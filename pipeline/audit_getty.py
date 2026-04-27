"""Wikidata ↔ Getty cross-reference audit.

Joins the Wikidata-derived sculptor table to the Getty parquet on QID
and produces a comparison report. The point isn't to declare a winner —
the two sources legitimately model different things (Getty's
"nationality" is cultural attribution; Wikidata's `citizenships[]` is
legal citizenship) — but to surface where they agree, where they
disagree, and where one has data the other lacks. That's the data
story.

Outputs:
- `web/public/data/getty_audit.json` — aggregate metrics + top-N
  disagreement examples, ready for the /transparency page.
- `data/processed/getty_compared.parquet` — per-sculptor row with all
  comparison flags, used by export_json.py to surface "Verified by
  Getty" / "Sources disagree" affordances on the detail page.

Comparison rules:
- Birth/death year: exact match, off-by-1 (transcription drift,
  calendar reform), off-by-2+ (substantive disagreement).
- Birth/death place: case-insensitive substring match, both directions
  — Getty's "Paris" matches Wikidata's "Paris, France" and vice versa.
  Misses are conservative ("Kyiv" ≠ "Russian Empire" even though they
  describe the same person's origin in different conceptual frames).
- Nationality: convert Getty's adjective form ("French") to a country
  ("France") via a small static map, then compute Jaccard similarity
  with Wikidata's `citizenships[]`. Adjectives without a mapping fall
  through unchanged and almost certainly miss — that's expected and
  surfaces as a coverage gap, not a defect.
"""
import json
from collections import Counter
from pathlib import Path

import pandas as pd

from config import PROCESSED_DIR, WEB_DATA_DIR

GETTY_VERIFIED_PATH = PROCESSED_DIR / "getty_verified.parquet"
GETTY_COMPARED_PATH = PROCESSED_DIR / "getty_compared.parquet"
GETTY_AUDIT_JSON_PATH = WEB_DATA_DIR / "getty_audit.json"

# Adjective → country mapping. Conservative: when in doubt, leave the
# adjective as-is so the miss surfaces in the report rather than being
# papered over by a wrong join. This is NOT meant to be exhaustive — it
# covers the long tail of common European/North American nationalities
# and grows by inspection of the audit's "unmatched" list.
ADJECTIVE_TO_COUNTRY = {
    # Latin alphabet, common
    "American": "United States",
    "British": "United Kingdom",
    "English": "United Kingdom",
    "Scottish": "United Kingdom",
    "Welsh": "United Kingdom",
    "Irish": "Ireland",
    "French": "France",
    "German": "Germany",
    "Italian": "Italy",
    "Spanish": "Spain",
    "Portuguese": "Portugal",
    "Dutch": "Netherlands",
    "Belgian": "Belgium",
    "Swiss": "Switzerland",
    "Austrian": "Austria",
    "Polish": "Poland",
    "Czech": "Czech Republic",
    "Slovak": "Slovakia",
    "Hungarian": "Hungary",
    "Romanian": "Romania",
    "Bulgarian": "Bulgaria",
    "Greek": "Greece",
    "Ukrainian": "Ukraine",
    "Russian": "Russia",
    "Soviet": "Soviet Union",
    "Yugoslav": "Yugoslavia",
    "Croatian": "Croatia",
    "Serbian": "Serbia",
    "Slovenian": "Slovenia",
    "Bosnian": "Bosnia and Herzegovina",
    "Macedonian": "North Macedonia",
    "Albanian": "Albania",
    "Turkish": "Turkey",
    "Israeli": "Israel",
    "Lebanese": "Lebanon",
    "Egyptian": "Egypt",
    "Iranian": "Iran",
    "Iraqi": "Iraq",
    "Saudi": "Saudi Arabia",
    "Indian": "India",
    "Pakistani": "Pakistan",
    "Chinese": "China",
    "Japanese": "Japan",
    "Korean": "South Korea",
    "Vietnamese": "Vietnam",
    "Thai": "Thailand",
    "Indonesian": "Indonesia",
    "Filipino": "Philippines",
    "Australian": "Australia",
    "New Zealander": "New Zealand",
    "Canadian": "Canada",
    "Mexican": "Mexico",
    "Cuban": "Cuba",
    "Brazilian": "Brazil",
    "Argentine": "Argentina",
    "Argentinian": "Argentina",
    "Chilean": "Chile",
    "Colombian": "Colombia",
    "Venezuelan": "Venezuela",
    "Peruvian": "Peru",
    "Uruguayan": "Uruguay",
    "South African": "South Africa",
    "Nigerian": "Nigeria",
    "Kenyan": "Kenya",
    "Ethiopian": "Ethiopia",
    "Ghanaian": "Ghana",
    "Norwegian": "Norway",
    "Swedish": "Sweden",
    "Danish": "Denmark",
    "Finnish": "Finland",
    "Icelandic": "Iceland",
    "Estonian": "Estonia",
    "Latvian": "Latvia",
    "Lithuanian": "Lithuania",
}


def _adjective_to_country(adj: str) -> str:
    """Best-effort adjective→country lookup. Falls through unchanged
    when no mapping exists; downstream Jaccard handles the miss."""
    return ADJECTIVE_TO_COUNTRY.get(adj, adj)


def _compare_year(wd: int | None, getty: int | None) -> str:
    """Bucket year disagreement: missing | match | off1 | off_big."""
    if wd is None or getty is None:
        return "missing"
    diff = abs(int(wd) - int(getty))
    if diff == 0:
        return "match"
    if diff == 1:
        return "off1"
    return "off_big"


def _place_overlaps(getty_place: str | None, wd_city: str | None, wd_country: str | None) -> bool:
    """Case-insensitive substring match either direction. Returns True
    if Getty's place mentions Wikidata's city/country (or vice versa)."""
    if not getty_place:
        return False
    g = getty_place.lower()
    for candidate in (wd_city, wd_country):
        if not candidate:
            continue
        c = candidate.lower()
        if c in g or g in c:
            return True
    return False


def _nat_overlap(getty_nats: list[str], wd_citz: list[str]) -> dict:
    """Compute Jaccard between Getty's adjective-form nationalities
    (mapped to countries) and Wikidata's citizenship list."""
    g = {_adjective_to_country(n) for n in (getty_nats or []) if n}
    w = set((wd_citz or []))
    if not g and not w:
        return {"jaccard": None, "agreed": [], "getty_only": [], "wd_only": []}
    intersect = g & w
    union = g | w
    jaccard = (len(intersect) / len(union)) if union else None
    return {
        "jaccard": jaccard,
        "agreed": sorted(intersect),
        "getty_only": sorted(g - w),
        "wd_only": sorted(w - g),
    }


def _safe_int(v) -> int | None:
    try:
        if v is None:
            return None
        if pd.isna(v):
            return None
        return int(v)
    except (TypeError, ValueError):
        return None


def _safe_str(v) -> str | None:
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    s = str(v)
    return s or None


def run_audit(
    sculptors_json_path: Path = WEB_DATA_DIR / "sculptors.json",
    getty_path: Path = GETTY_VERIFIED_PATH,
) -> dict:
    """Compare Wikidata-derived sculptors.json against the Getty parquet
    and emit per-record + aggregate audit data."""
    if not getty_path.exists():
        raise FileNotFoundError(
            f"Run query_getty.py first; missing {getty_path}"
        )

    sculptors = json.loads(Path(sculptors_json_path).read_text(encoding="utf-8"))
    wd_by_qid = {s["qid"]: s for s in sculptors}
    getty_df = pd.read_parquet(getty_path)
    getty_by_qid = {row["qid"]: row for _, row in getty_df.iterrows()}

    rows: list[dict] = []
    for qid, getty_row in getty_by_qid.items():
        wd = wd_by_qid.get(qid)
        if not wd:
            continue  # Getty record for a sculptor not in our published set.
        if not getty_row.get("getty_fetched"):
            continue  # 404 or hard fetch failure — nothing to compare.

        wd_birth = wd.get("birthYear")
        wd_death = wd.get("deathYear")
        wd_city = wd.get("birthPlace")
        wd_country = wd.get("birthCountry")
        wd_dcity = wd.get("deathPlace")
        wd_dcountry = wd.get("deathCountry")
        wd_citz = wd.get("citizenships") or (
            [wd["citizenship"]] if wd.get("citizenship") else []
        )

        g_birth = _safe_int(getty_row.get("getty_birth_year"))
        g_death = _safe_int(getty_row.get("getty_death_year"))
        g_bplace = _safe_str(getty_row.get("getty_birth_place"))
        g_dplace = _safe_str(getty_row.get("getty_death_place"))
        # `getty_row` is a pandas Series, so `or []` triggers truthiness
        # evaluation on the underlying array — bail out manually.
        raw_nats = getty_row.get("getty_nationalities")
        g_nats = list(raw_nats) if raw_nats is not None and len(raw_nats) > 0 else []

        nat = _nat_overlap(g_nats, wd_citz)

        rows.append({
            "qid": qid,
            "name": wd["name"],
            # Years
            "wd_birth_year": wd_birth,
            "getty_birth_year": g_birth,
            "birth_year_status": _compare_year(wd_birth, g_birth),
            "wd_death_year": wd_death,
            "getty_death_year": g_death,
            "death_year_status": _compare_year(wd_death, g_death),
            # Places
            "wd_birth_city": wd_city,
            "wd_birth_country": wd_country,
            "getty_birth_place": g_bplace,
            "birth_place_match": _place_overlaps(g_bplace, wd_city, wd_country),
            "wd_birth_place_present": bool(wd_city or wd_country),
            "getty_birth_place_present": bool(g_bplace),
            "wd_death_city": wd_dcity,
            "wd_death_country": wd_dcountry,
            "getty_death_place": g_dplace,
            "death_place_match": _place_overlaps(g_dplace, wd_dcity, wd_dcountry),
            "wd_death_place_present": bool(wd_dcity or wd_dcountry),
            "getty_death_place_present": bool(g_dplace),
            # Nationalities
            "wd_citizenships": wd_citz,
            "getty_nationalities": g_nats,
            "nat_jaccard": nat["jaccard"],
            "nat_agreed": nat["agreed"],
            "nat_getty_only": nat["getty_only"],
            "nat_wd_only": nat["wd_only"],
        })

    df = pd.DataFrame(rows)
    df.to_parquet(GETTY_COMPARED_PATH, index=False)

    # Aggregate metrics. We deliberately split year/place coverage from
    # agreement: a sculptor where Wikidata has no birth place can't
    # disagree with Getty, so excluding them from agreement-rate makes
    # the headline number honest.
    n = len(df)
    by_status = Counter(df["birth_year_status"])
    death_status = Counter(df["death_year_status"])
    bp_comparable = df[
        df["wd_birth_place_present"] & df["getty_birth_place_present"]
    ]
    dp_comparable = df[
        df["wd_death_place_present"] & df["getty_death_place_present"]
    ]
    nat_comparable = df[df["nat_jaccard"].notna()]

    aggregate = {
        "compared": int(n),
        "birth_year": {
            "comparable": int(sum(v for k, v in by_status.items() if k != "missing")),
            "exact_match": int(by_status.get("match", 0)),
            "off_by_1": int(by_status.get("off1", 0)),
            "off_by_more": int(by_status.get("off_big", 0)),
            "missing_one_or_both": int(by_status.get("missing", 0)),
        },
        "death_year": {
            "comparable": int(sum(v for k, v in death_status.items() if k != "missing")),
            "exact_match": int(death_status.get("match", 0)),
            "off_by_1": int(death_status.get("off1", 0)),
            "off_by_more": int(death_status.get("off_big", 0)),
            "missing_one_or_both": int(death_status.get("missing", 0)),
        },
        "birth_place": {
            "wd_present": int(df["wd_birth_place_present"].sum()),
            "getty_present": int(df["getty_birth_place_present"].sum()),
            "both_present": int(len(bp_comparable)),
            "agreement_rate": (
                float(bp_comparable["birth_place_match"].mean())
                if len(bp_comparable) else None
            ),
            "getty_fills_wd_gap": int(
                ((~df["wd_birth_place_present"]) & df["getty_birth_place_present"]).sum()
            ),
            "wd_fills_getty_gap": int(
                (df["wd_birth_place_present"] & (~df["getty_birth_place_present"])).sum()
            ),
        },
        "death_place": {
            "wd_present": int(df["wd_death_place_present"].sum()),
            "getty_present": int(df["getty_death_place_present"].sum()),
            "both_present": int(len(dp_comparable)),
            "agreement_rate": (
                float(dp_comparable["death_place_match"].mean())
                if len(dp_comparable) else None
            ),
            "getty_fills_wd_gap": int(
                ((~df["wd_death_place_present"]) & df["getty_death_place_present"]).sum()
            ),
            "wd_fills_getty_gap": int(
                (df["wd_death_place_present"] & (~df["getty_death_place_present"])).sum()
            ),
        },
        "nationality": {
            "comparable": int(len(nat_comparable)),
            "mean_jaccard": (
                float(nat_comparable["nat_jaccard"].mean())
                if len(nat_comparable) else None
            ),
            "full_agreement": int((nat_comparable["nat_jaccard"] == 1.0).sum()),
            "any_overlap": int((nat_comparable["nat_jaccard"] > 0).sum()),
            "no_overlap": int((nat_comparable["nat_jaccard"] == 0.0).sum()),
            "getty_adds_country": int(
                nat_comparable["nat_getty_only"].apply(lambda x: len(x) > 0).sum()
            ),
            "wd_adds_country": int(
                nat_comparable["nat_wd_only"].apply(lambda x: len(x) > 0).sum()
            ),
        },
    }

    # Sample disagreements — small N each, useful for the transparency
    # page and for spot-checks. Picked deterministically (sorted by name)
    # so reruns produce stable output.
    def _sample(query, fields, n=8):
        sub = df[query].sort_values("name").head(n)
        return [
            {f: (v.tolist() if hasattr(v, "tolist") else v)
             for f, v in zip(fields, [row[f] for f in fields])}
            for _, row in sub.iterrows()
        ]

    samples = {
        "birth_year_off_by_more": _sample(
            df["birth_year_status"] == "off_big",
            ["qid", "name", "wd_birth_year", "getty_birth_year"],
        ),
        "birth_place_disagree": _sample(
            df["wd_birth_place_present"]
            & df["getty_birth_place_present"]
            & (~df["birth_place_match"]),
            ["qid", "name", "wd_birth_city", "wd_birth_country", "getty_birth_place"],
        ),
        "getty_fills_birthplace_gap": _sample(
            (~df["wd_birth_place_present"]) & df["getty_birth_place_present"],
            ["qid", "name", "getty_birth_place"],
        ),
        "nationality_no_overlap": _sample(
            df["nat_jaccard"] == 0.0,
            ["qid", "name", "wd_citizenships", "getty_nationalities"],
        ),
        "nationality_getty_adds": _sample(
            df["nat_getty_only"].apply(lambda x: len(x) > 0),
            ["qid", "name", "wd_citizenships", "getty_nationalities", "nat_getty_only"],
        ),
    }

    audit = {
        "version": 1,
        "aggregate": aggregate,
        "samples": samples,
    }
    GETTY_AUDIT_JSON_PATH.write_text(
        json.dumps(audit, indent=2, ensure_ascii=False, default=str),
        encoding="utf-8",
    )
    print(f"✓ Wrote audit → {GETTY_AUDIT_JSON_PATH}")
    print(f"✓ Wrote per-record comparison → {GETTY_COMPARED_PATH}")
    print()
    print("Headline metrics:")
    print(f"  Records compared: {aggregate['compared']}")
    print(f"  Birth-year exact match: {aggregate['birth_year']['exact_match']}/{aggregate['birth_year']['comparable']}")
    print(f"  Birth-place agreement: {aggregate['birth_place']['agreement_rate']}")
    print(f"  Getty fills WD birthplace gap: {aggregate['birth_place']['getty_fills_wd_gap']}")
    print(f"  Mean nationality Jaccard: {aggregate['nationality']['mean_jaccard']}")
    return audit


def merge_into_sculptors_json(
    sculptors_json_path: Path = WEB_DATA_DIR / "sculptors.json",
    compared_path: Path = GETTY_COMPARED_PATH,
) -> None:
    """Augment sculptors.json with a `gettyVerified` block per sculptor.

    Mutation is in-place: we read the existing JSON, attach the Getty
    fields where we have them, and write back. Keeps export_json.py
    untouched (no new imports, no schema branching) — Getty becomes a
    post-hoc enrichment that the UI treats as optional metadata.
    """
    if not compared_path.exists():
        print(f"⚠ Skipping merge — {compared_path} doesn't exist yet")
        return
    cmp_df = pd.read_parquet(compared_path)
    # `compared.parquet` has the comparison flags but not the raw Getty
    # label, so we join in the verified parquet to pick that up too.
    verified_df = pd.read_parquet(GETTY_VERIFIED_PATH)
    df = cmp_df.merge(
        verified_df[["qid", "getty_label"]], on="qid", how="left"
    )
    by_qid = {row["qid"]: row for _, row in df.iterrows()}

    sculptors = json.loads(Path(sculptors_json_path).read_text(encoding="utf-8"))
    enriched = 0
    for s in sculptors:
        row = by_qid.get(s["qid"])
        if row is None:
            continue
        # Pull the ULAN ID off the existing authority links so consumers
        # don't have to re-resolve it. Same for the public URL.
        ulan_link = next(
            (a for a in (s.get("authorityLinks") or []) if a.get("type") == "ulan"),
            None,
        )
        s["gettyVerified"] = {
            "ulanId": ulan_link["id"] if ulan_link else None,
            "url": ulan_link["url"] if ulan_link else None,
            "label": _safe_str(row.get("getty_label")),
            "birthYear": _safe_int(row.get("getty_birth_year")),
            "birthPlace": _safe_str(row.get("getty_birth_place")),
            "deathYear": _safe_int(row.get("getty_death_year")),
            "deathPlace": _safe_str(row.get("getty_death_place")),
            "nationalities": (
                list(row["getty_nationalities"])
                if row.get("getty_nationalities") is not None
                and len(row["getty_nationalities"]) > 0
                else []
            ),
            "agreement": {
                "birthYear": _safe_str(row.get("birth_year_status")),
                "deathYear": _safe_str(row.get("death_year_status")),
                "birthPlace": (
                    bool(row["birth_place_match"])
                    if row["wd_birth_place_present"] and row["getty_birth_place_present"]
                    else None
                ),
                "deathPlace": (
                    bool(row["death_place_match"])
                    if row["wd_death_place_present"] and row["getty_death_place_present"]
                    else None
                ),
                "natJaccard": (
                    float(row["nat_jaccard"])
                    if pd.notna(row.get("nat_jaccard")) else None
                ),
            },
        }
        enriched += 1

    Path(sculptors_json_path).write_text(
        json.dumps(sculptors, ensure_ascii=False), encoding="utf-8"
    )
    print(f"✓ Enriched {enriched}/{len(sculptors)} sculptors with gettyVerified block")


if __name__ == "__main__":
    # Note: getty_label isn't in the compared parquet today (only the
    # comparison fields are). Read it from getty_verified.parquet instead.
    run_audit()
    merge_into_sculptors_json()
