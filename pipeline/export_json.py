"""Export sculptor data for web app consumption."""
import json
from pathlib import Path
from typing import Optional

import pandas as pd

from helpers import country_alias_stats, normalize_name
from config import (
    NODES_METRICS_PATH,
    RELATIONS_CLEAN_PATH,
    MATERIALS_BY_DECADE_PATH,
    MET_OBJECTS_CACHE_PATH,
    AIC_OBJECTS_CACHE_PATH,
    WEB_DATA_DIR,
    MIN_BIRTH_YEAR,
    FOCUS_SCULPTOR_NAMES,
    load_focus_sculptors,
)
from helpers import normalize_name


def load_data():
    """Load processed data."""
    nodes = pd.read_parquet(NODES_METRICS_PATH)
    relations = pd.read_parquet(RELATIONS_CLEAN_PATH)

    # Load materials if available
    if MATERIALS_BY_DECADE_PATH.exists():
        materials = pd.read_parquet(MATERIALS_BY_DECADE_PATH)
    else:
        materials = pd.DataFrame()

    # Load external mentors if available
    from config import PROCESSED_DIR
    ext_path = PROCESSED_DIR / f"external_mentors_{MIN_BIRTH_YEAR}plus.parquet"
    external_mentors = pd.read_parquet(ext_path) if ext_path.exists() else pd.DataFrame()

    return nodes, relations, materials, external_mentors


def _sculptor_record(row) -> dict:
    """Shared serialization for a single sculptor row.

    Emits the Option A.3 schema including enrichment fields. Null-safe for
    all optional properties (place fields, native name, authority IDs).
    """
    def _opt_str(v):
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
        except (TypeError, ValueError):
            pass
        s = str(v)
        return s if s else None

    def _list(v):
        if v is None:
            return []
        if isinstance(v, (list, tuple)):
            return list(v)
        try:
            import numpy as np
            if isinstance(v, np.ndarray):
                return list(v)
        except ImportError:
            pass
        return list(v)

    return {
        "qid": row["qid"],
        "name": row["name"],
        "birthYear": int(row["birth_year"]) if pd.notna(row["birth_year"]) else None,
        "deathYear": int(row["death_year"]) if pd.notna(row["death_year"]) else None,
        "alive": bool(row["alive"]),
        "gender": row["gender"],
        "movement": row["movement_display"],
        "citizenship": row["citizenship_display"],           # primary (most common)
        "citizenships": _list(row["citizenships"]),          # full list
        "birthDecade": int(row["birth_decade"]) if pd.notna(row["birth_decade"]) else None,
        "inDegree": int(row["in_degree"]),
        "outDegree": int(row["out_degree"]),
        "totalDegree": int(row["total_degree"]),
        # Phase 3a enrichment
        "birthPlace": _opt_str(row.get("birth_place")),
        "birthCountry": _opt_str(row.get("birth_country")),
        "deathPlace": _opt_str(row.get("death_place")),
        "deathCountry": _opt_str(row.get("death_country")),
        "nativeName": _opt_str(row.get("native_name")),
        "nativeLang": _opt_str(row.get("native_lang")),
        # Phase 4: Wikimedia Commons portrait URL (raw FilePath form;
        # client appends ?width=N for thumbnail). Null if no P18.
        "image": _opt_str(row.get("image")),
        "authorityTypes": _list(row.get("authority_types")),
        "authorityLinks": _list(row.get("authority_links")),
        "sitelinkCount": int(row.get("sitelink_count") or 0),
        "nonEnSitelinkCount": int(row.get("non_en_sitelink_count") or 0),
        "inclusionSignals": _list(row.get("inclusion_signals")),
    }


def create_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create sculptors.json using Option A.3 inclusion signals.

    A sculptor is included if any of: movement, edge, focus, multi_citz,
    sitelinks fire (see process.py :: compute_inclusion_signals). Authority
    IDs are stored in `authorityTypes` as metadata but do NOT gate inclusion.
    """
    included = nodes[nodes["is_included"]].copy()
    return [_sculptor_record(row) for _, row in included.iterrows()]


def create_sculptors_index_json(nodes: pd.DataFrame) -> list[dict]:
    """Slim sculptors index for /explore (table) and /lineage (graph lookup).

    The full sculptors.json is ~6MB because every record carries
    authorityLinks, inclusionSignals, citizenships[], image URLs,
    gettyVerified, sitelink counts, etc. Those fields are only needed on
    the detail page — and the detail page already loads a per-sculptor
    shard from /data/sculptors/{qid}.json.

    This index keeps only the columns the Explore table renders and the
    Lineage graph reads (qid, name, movement). One small file replaces a
    multi-MB download for two of the most-trafficked pages.
    """
    included = nodes[nodes["is_included"]].copy()
    records: list[dict] = []
    for _, row in included.iterrows():
        birth = row.get("birth_year")
        death = row.get("death_year")
        birth_decade = row.get("birth_decade")
        records.append({
            "qid": row["qid"],
            "name": row["name"],
            "nativeName": row["native_name"] if pd.notna(row.get("native_name")) else None,
            "nativeLang": row["native_lang"] if pd.notna(row.get("native_lang")) else None,
            "birthYear": int(birth) if pd.notna(birth) else None,
            "deathYear": int(death) if pd.notna(death) else None,
            "birthDecade": int(birth_decade) if pd.notna(birth_decade) else None,
            "movement": row["movement_display"] if pd.notna(row.get("movement_display")) else None,
            "gender": row["gender"] if pd.notna(row.get("gender")) else None,
            "citizenship": row["citizenship_display"] if pd.notna(row.get("citizenship_display")) else None,
        })
    return records


def create_edges_json(
    relations: pd.DataFrame, nodes: pd.DataFrame
) -> list[dict]:
    """Create edges.json with relationship edges.

    Preserves ALL edges, including those to external mentors. Each edge
    records whether the `from` endpoint is an external mentor so the web
    client can style it differently.

    Phase 4 — adds `crossesBorders` per edge for the cross-cultural
    collaboration story:
      - True  if both endpoints have non-empty citizenship sets that are
              disjoint (no shared country).
      - False if both have non-empty citizenship sets that intersect.
      - None  if either side lacks citizenship data (most commonly when
              the `from` endpoint is an external mentor — we don't fetch
              citizenship for non-sculptor mentors).

    The tri-state matters: a False count is meaningful, but conflating
    None with False would inflate the "same-nationality" denominator.
    """
    if len(relations) == 0:
        return []

    # Build a citizenship lookup keyed by QID. We use the full
    # `citizenships` array (Wikidata P27 — may have multiple values for
    # émigré sculptors) so dual-citizenship cases are properly handled.
    citz_by_qid: dict[str, set[str]] = {}
    for _, row in nodes.iterrows():
        citz = row.get("citizenships")
        if citz is None:
            continue
        try:
            arr = list(citz)
        except TypeError:
            continue
        clean = {str(c) for c in arr if c and str(c).strip()}
        if clean:
            citz_by_qid[row["qid"]] = clean

    def _crosses(from_qid: str, to_qid: str) -> bool | None:
        f = citz_by_qid.get(from_qid)
        t = citz_by_qid.get(to_qid)
        if not f or not t:
            return None
        return len(f & t) == 0

    records = []
    for _, row in relations.iterrows():
        records.append({
            "fromQid": row["from_qid"],
            "toQid": row["to_qid"],
            "fromName": row["from_name"],
            "toName": row["to_name"],
            "relationType": row["relation_type"],
            "crossesBorders": _crosses(row["from_qid"], row["to_qid"]),
        })

    return records


def create_cross_cultural_summary(edges: list[dict], nodes: pd.DataFrame) -> dict:
    """Aggregate cross-cultural lineage statistics for /transparency.

    Splits each comparable edge by the FROM-side sculptor's birth decade
    (the teacher / influencer in `student_of` and `influenced_by` relations)
    so the timeline reflects when the formative connection happened.

    Output shape:
      {
        "totalEdges": int,
        "comparable": int,           # crossesBorders is not None
        "crossBorder": int,
        "sameNationality": int,
        "crossPctOfComparable": float,
        "byDecade": [{decade, total, cross, same}],
        "topPairs": [{a, b, count}]  # top 12 country-pair combos
      }
    """
    by_qid_decade = {
        row["qid"]: int(row["birth_decade"])
        for _, row in nodes.iterrows()
        if pd.notna(row.get("birth_decade"))
    }
    by_qid_citz = {}
    for _, row in nodes.iterrows():
        citz = row.get("citizenships")
        if citz is None:
            continue
        try:
            arr = list(citz)
        except TypeError:
            continue
        clean = [str(c) for c in arr if c and str(c).strip()]
        if clean:
            by_qid_citz[row["qid"]] = clean

    decade_buckets: dict[int, dict[str, int]] = {}
    pair_counts: dict[tuple[str, str], int] = {}
    cross = same = 0

    for e in edges:
        flag = e["crossesBorders"]
        if flag is None:
            continue
        decade = by_qid_decade.get(e["fromQid"]) or by_qid_decade.get(e["toQid"])
        if decade is None:
            continue
        bucket = decade_buckets.setdefault(
            decade, {"decade": decade, "total": 0, "cross": 0, "same": 0}
        )
        bucket["total"] += 1
        if flag:
            cross += 1
            bucket["cross"] += 1
            # Record the country-pair for the topPairs aggregation.
            # Use the first citizenship from each side as the canonical
            # representative — multi-citizenship sculptors get folded into
            # their primary national identity. Sorted so (FR, US) and
            # (US, FR) collapse to the same key.
            f_citz = by_qid_citz.get(e["fromQid"], [])
            t_citz = by_qid_citz.get(e["toQid"], [])
            if f_citz and t_citz:
                key = tuple(sorted([f_citz[0], t_citz[0]]))
                if key[0] != key[1]:
                    pair_counts[key] = pair_counts.get(key, 0) + 1
        else:
            same += 1
            bucket["same"] += 1

    comparable = cross + same
    by_decade = sorted(decade_buckets.values(), key=lambda b: b["decade"])
    top_pairs = sorted(
        ({"a": a, "b": b, "count": c} for (a, b), c in pair_counts.items()),
        key=lambda r: -r["count"],
    )[:12]

    return {
        "totalEdges": len(edges),
        "comparable": comparable,
        "crossBorder": cross,
        "sameNationality": same,
        "crossPctOfComparable": (cross / comparable) if comparable else None,
        "byDecade": by_decade,
        "topPairs": top_pairs,
    }


def create_external_mentors_json(external_mentors: pd.DataFrame) -> list[dict]:
    """Create external_mentors.json: non-sculptor endpoints of lineage edges.

    These are painters, composers, architects, and other teachers who
    appear in Wikidata as `student of` / `influenced by` targets but are
    not classified as sculptors themselves. Rendered as first-class nodes
    on the lineage graph with a distinct visual style.
    """
    if len(external_mentors) == 0:
        return []

    records = []
    for _, row in external_mentors.iterrows():
        birth = row["birth_year"]
        death = row["death_year"]
        records.append({
            "qid": row["qid"],
            "name": row["name"],
            "birthYear": int(birth) if pd.notna(birth) else None,
            "deathYear": int(death) if pd.notna(death) else None,
            "gender": row["gender"] if pd.notna(row["gender"]) else None,
            "occupation": row["occupation"] if pd.notna(row["occupation"]) else None,
        })
    return records


def create_movements_by_decade_json(nodes: pd.DataFrame) -> list[dict]:
    """Create movements_by_decade.json in tidy format: {decade, category, count}."""
    nodes_with_movement = nodes[nodes["movement_display"] != "No movement listed"].copy()
    
    # Group by decade and movement — already tidy
    grouped = (
        nodes_with_movement.groupby(["birth_decade", "movement_display"])
        .size()
        .reset_index(name="count")
    )
    
    # Keep only the top 15 movements; bucket the rest as "Other"
    top_movements = (
        nodes_with_movement["movement_display"]
        .value_counts()
        .head(15)
        .index.tolist()
    )
    
    records = []
    for _, row in grouped.iterrows():
        category = row["movement_display"] if row["movement_display"] in top_movements else "Other"
        records.append({
            "decade": int(row["birth_decade"]),
            "category": category,
            "count": int(row["count"]),
        })
    
    # Re-aggregate after bucketing "Other"
    agg = pd.DataFrame(records).groupby(["decade", "category"])["count"].sum().reset_index()
    return agg.sort_values(["decade", "count"], ascending=[True, False]).to_dict(orient="records")


def _geography_by_decade(
    nodes: pd.DataFrame, source_col: str, top_n: int = 15
) -> list[dict]:
    """Aggregate nodes by (birth_decade, source_col) with a tidy output.

    `source_col` is either "citizenship_display" (legal/attributed nationality)
    or "birth_country" (place-of-birth country). Null/missing values are
    bucketed under "Unknown" so the chart keeps its total intact. The top
    `top_n` categories survive; everything else collapses to "Other".
    """
    # Normalize missing values to a single "Unknown" label
    src = nodes[source_col].fillna("Unknown").replace("", "Unknown")
    working = nodes.assign(_category=src)

    top_categories = (
        working[working["_category"] != "Unknown"]["_category"]
        .value_counts()
        .head(top_n)
        .index.tolist()
    )
    keep = set(top_categories) | {"Unknown"}

    grouped = (
        working.groupby(["birth_decade", "_category"])
        .size()
        .reset_index(name="count")
    )
    grouped["category"] = grouped["_category"].where(
        grouped["_category"].isin(keep), other="Other"
    )

    agg = grouped.groupby(["birth_decade", "category"])["count"].sum().reset_index()
    agg = agg.rename(columns={"birth_decade": "decade"})
    return (
        agg.sort_values(["decade", "count"], ascending=[True, False])
        .astype({"decade": int, "count": int})
        .to_dict(orient="records")
    )


def create_geography_by_decade_json(nodes: pd.DataFrame) -> list[dict]:
    """Citizenship-based aggregation (Wikidata P27, primary value)."""
    return _geography_by_decade(nodes, "citizenship_display")


def create_geography_by_birth_country_json(nodes: pd.DataFrame) -> list[dict]:
    """Birth-country aggregation (Wikidata P19 → P17). This is the honest
    view of where sculptors were *born* vs. where they were later
    naturalized/attributed — Brâncuși born in Romania, not United States.
    """
    return _geography_by_decade(nodes, "birth_country")


# Maximum sculptors embedded per flow record. Prevents `migration.json`
# from ballooning on high-volume corridors (Germany→France etc.) while
# still giving the detail panel enough names to show a representative
# list. The detail page can fetch individual QIDs if a full roster is
# ever wanted.
MAX_SCULPTORS_PER_FLOW = 12


def create_migration_json(nodes: pd.DataFrame) -> dict:
    """Birth → death country flows for the Migration view (Phase 4/5).

    Only sculptors with both ``birth_country`` and ``death_country`` are
    eligible. Living sculptors are excluded — we don't yet know where they
    will end up, and showing a "died in <country>" edge for them is wrong.
    The page surfaces the exclusion count so the absence is explicit.

    Shape:
        {
          "meta": {
            "totalIncluded": 3643,
            "withBothCountries": 2648,
            "crossedBorders": 784,
            "sameCountry": 1864,
            "missingBirthCountry": int,
            "missingDeathCountry": int,
            "livingExcluded": int,
            "topFlows": [{...top 10 overall}]
          },
          "flows": [
            {
              "from": "Poland",
              "to": "Germany",
              "count": 34,
              "sameCountry": false,
              "sculptors": [{"qid":"Q...", "name":"..."}, ... up to MAX]
            }, ...
          ],
          "flowsByBirthDecade": {
            "1870": [...same flow shape, filtered to sculptors born in that decade...],
            ...
          }
        }

    Flows are sorted by descending count. Same-country flows are included
    (they outnumber migrations roughly 2:1 in the data and a reader who
    filters by decade deserves to see both).
    """
    # Only sculptors that pass A.3 inclusion are published, so we restrict
    # the migration view to the same set. This keeps numbers consistent
    # with /transparency and /explore.
    df = nodes[nodes["is_included"]].copy() if "is_included" in nodes.columns else nodes.copy()

    # Eligibility gates, logged individually so the UI can be honest about
    # absences.
    living_mask = df["alive"].fillna(False).astype(bool) if "alive" in df.columns else pd.Series(False, index=df.index)
    missing_birth = df["birth_country"].isna() | (df["birth_country"] == "")
    missing_death = df["death_country"].isna() | (df["death_country"] == "")

    eligible = df[~living_mask & ~missing_birth & ~missing_death].copy()

    same = eligible[eligible["birth_country"] == eligible["death_country"]]
    crossed = eligible[eligible["birth_country"] != eligible["death_country"]]

    def _build_flows(frame: pd.DataFrame) -> list[dict]:
        """Group a frame into flows sorted by count descending."""
        if len(frame) == 0:
            return []
        grouped = (
            frame.groupby(["birth_country", "death_country"], dropna=False)
            .apply(
                lambda g: g.sort_values("name")[["qid", "name"]].to_dict("records"),
                include_groups=False,
            )
            .reset_index(name="sculptors")
        )
        grouped["count"] = grouped["sculptors"].apply(len)
        grouped = grouped.sort_values("count", ascending=False)
        out: list[dict] = []
        for _, row in grouped.iterrows():
            sculptors = row["sculptors"][:MAX_SCULPTORS_PER_FLOW]
            out.append({
                "from": str(row["birth_country"]),
                "to": str(row["death_country"]),
                "count": int(row["count"]),
                "sameCountry": row["birth_country"] == row["death_country"],
                "sculptors": [
                    {"qid": s["qid"], "name": s["name"]}
                    for s in sculptors
                ],
            })
        return out

    all_flows = _build_flows(eligible)

    # Per-decade slices keyed by *birth* decade. Birth decade is the cleanest
    # anchor because a sculptor's flight from Europe in 1933 is a single
    # event, but bucketing by death decade would split generationally-linked
    # migrations (Bauhaus emigrés all died across 1950s-1980s). See also the
    # existing `_geography_by_decade` helper which uses the same anchor.
    flows_by_decade: dict[str, list[dict]] = {}
    for decade, group in eligible.groupby("birth_decade"):
        if pd.isna(decade):
            continue
        flows_by_decade[str(int(decade))] = _build_flows(group)

    # Top cross-border corridors for the headline call-outs. Same-country
    # flows are excluded here — "Born in USA → Died in USA" has 400+ entries
    # and dominates the list without adding narrative value.
    top_flows = [f for f in all_flows if not f["sameCountry"]][:10]

    # Make the four buckets a clean partition of `totalIncluded`:
    #   livingExcluded   = living sculptors (we don't yet know where they'll die)
    #   missingBirthCountry = non-living, no birth country
    #   missingDeathCountry = non-living, has birth country but no death country
    #   eligible         = non-living with both countries
    # Previously `missingDeathCountry` silently included living sculptors,
    # making the four buckets sum to more than totalIncluded.
    missing_birth_nonliving = (~living_mask & missing_birth).sum()
    missing_death_nonliving = (~living_mask & ~missing_birth & missing_death).sum()
    return {
        "meta": {
            "totalIncluded": int(len(df)),
            "eligible": int(len(eligible)),
            "withBothCountries": int(len(eligible)),
            "crossedBorders": int(len(crossed)),
            "sameCountry": int(len(same)),
            "missingBirthCountry": int(missing_birth_nonliving),
            "missingDeathCountry": int(missing_death_nonliving),
            "livingExcluded": int(living_mask.sum()),
            "topFlows": top_flows,
        },
        "flows": all_flows,
        "flowsByBirthDecade": flows_by_decade,
    }


DECADE_NOTABLE_LIMIT = 36
DECADE_TOP_COUNTRIES = 8
DECADE_TOP_MOVEMENTS = 6
DECADE_TOP_CORRIDORS = 5


def create_decades_json(nodes: pd.DataFrame, migration: dict) -> dict:
    """Per-decade aggregates that power /decade/[year] pages.

    A single bundle keyed by decade (str), each value carries the headline
    stats, top countries / movements / corridors, and a roster of notable
    sculptors (top by ``total_degree`` so the page leads with people the
    network knows about). All counts are computed against the *included*
    set so they line up with /explore and /transparency.

    Why not per-decade shards: the full bundle is small (~30 KB) and a
    single fetch beats 22 separate shards for a navigation pattern where
    a reader is likely to flip between adjacent decades.
    """
    df = nodes[nodes["is_included"]].copy() if "is_included" in nodes.columns else nodes.copy()
    df = df[df["birth_decade"].notna()].copy()
    df["birth_decade"] = df["birth_decade"].astype(int)

    flows_by_decade = migration.get("flowsByBirthDecade", {}) if migration else {}

    out: dict[str, dict] = {}
    for decade, group in df.groupby("birth_decade"):
        decade = int(decade)
        if decade < 1800:
            continue

        total = int(len(group))

        # Gender breakdown — count female + male only; "Other / unspecified"
        # is computed by subtraction so the chart stays honest about
        # records with no gender on Wikidata.
        female = int((group["gender"].fillna("").str.lower() == "female").sum())
        male = int((group["gender"].fillna("").str.lower() == "male").sum())
        other_or_unknown = total - female - male

        # Top countries by birth (P19 → P17). Group small countries into
        # "Other" so the page shows a clean ordered list, but always
        # surface the actual count of "Other" rather than dropping.
        country_counts = (
            group["birth_country"].dropna().value_counts().head(DECADE_TOP_COUNTRIES)
        )
        top_countries = [
            {"country": str(k), "count": int(v)} for k, v in country_counts.items()
        ]

        # Top movements (display-form). Same rationale as countries.
        # Exclude the "No movement listed" sentinel — it's a fill-NA marker
        # from process.py, not a real movement, and it would otherwise rank
        # #1 in every decade (~73% of sculptors lack a Wikidata movement).
        movement_series = group["movement_display"].dropna()
        movement_series = movement_series[movement_series != "No movement listed"]
        movement_counts = movement_series.value_counts().head(DECADE_TOP_MOVEMENTS)
        top_movements = [
            {"movement": str(k), "count": int(v)} for k, v in movement_counts.items()
        ]

        # Top notable sculptors — by total_degree (in + out edges in the
        # lineage graph). Falls back to alphabetical when degree is 0.
        notable_df = group.copy()
        notable_df["_deg"] = notable_df["total_degree"].fillna(0).astype(int)
        notable_df = notable_df.sort_values(
            ["_deg", "name"], ascending=[False, True]
        ).head(DECADE_NOTABLE_LIMIT)
        notable = [
            {
                "qid": str(r["qid"]),
                "name": str(r["name"]),
                "birthYear": int(r["birth_year"]) if pd.notna(r.get("birth_year")) else None,
                "deathYear": int(r["death_year"]) if pd.notna(r.get("death_year")) else None,
                "movement": str(r["movement_display"]) if pd.notna(r.get("movement_display")) else None,
                "citizenship": str(r["citizenship_display"]) if pd.notna(r.get("citizenship_display")) else None,
                "totalDegree": int(r["_deg"]),
            }
            for _, r in notable_df.iterrows()
        ]

        # Top migration corridors — pull from the precomputed migration
        # bundle to avoid recomputing the same group-by twice. Drop
        # same-country flows so the call-out tells the migration story.
        decade_flows = flows_by_decade.get(str(decade), [])
        cross_border_flows = [f for f in decade_flows if not f.get("sameCountry")]
        top_corridors = [
            {"from": f["from"], "to": f["to"], "count": int(f["count"])}
            for f in cross_border_flows[:DECADE_TOP_CORRIDORS]
        ]

        # Cross-border share for the decade headline ("X% left their
        # birth country"). Denominator is sculptors with both birth +
        # death country known — same definition as the Migration page.
        eligible_for_migration = sum(int(f["count"]) for f in decade_flows)
        crossed_for_migration = sum(int(f["count"]) for f in cross_border_flows)
        cross_pct = (
            round(crossed_for_migration / eligible_for_migration * 100)
            if eligible_for_migration > 0
            else None
        )

        out[str(decade)] = {
            "decade": decade,
            "totalBorn": total,
            "gender": {
                "female": female,
                "male": male,
                "otherOrUnknown": other_or_unknown,
            },
            "topCountries": top_countries,
            "topMovements": top_movements,
            "topCorridors": top_corridors,
            "migration": {
                "eligible": eligible_for_migration,
                "crossed": crossed_for_migration,
                "crossPct": cross_pct,
            },
            "notable": notable,
        }

    return out


MOVEMENT_NOTABLE_LIMIT = 36
MOVEMENT_TOP_COUNTRIES = 6
MOVEMENT_MIN_SCULPTORS = 3


def _movement_slug(name: str) -> str:
    """URL-safe slug for a movement display name.

    Lowercase, ASCII-fold non-letters, collapse runs of non-word chars
    into hyphens. We keep this in the pipeline (not the web app) so the
    JSON it emits already carries the canonical slug — that way the web
    app never has to re-derive a key it would then have to keep in sync
    with our slugger forever.
    """
    import re
    import unicodedata

    folded = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", folded).strip("-").lower()
    return slug or "unknown"


def create_movements_json(nodes: pd.DataFrame) -> dict:
    """Per-movement aggregates that power /movement/[slug] pages.

    Each entry carries: total sculptor count, decade histogram, top
    countries, and a notable-sculptor roster (top by ``total_degree``).
    Movements with fewer than ``MOVEMENT_MIN_SCULPTORS`` sculptors are
    dropped — single-sculptor "movements" are usually Wikidata
    long-tail labels (e.g. one obscure local circle) that don't merit
    a destination page and would dilute the index list.

    The bundle structure mirrors decades.json: a single object keyed by
    *slug*, plus an ``index`` list ordered by sculptor count for the
    /movement landing page (deferred — for now /movement/[slug] is
    reachable from detail-page pills).
    """
    df = nodes[nodes["is_included"]].copy() if "is_included" in nodes.columns else nodes.copy()
    # Drop the "No movement listed" sentinel before grouping — it's a
    # fill-NA marker from process.py (covers ~73% of sculptors who simply
    # lack a P135 on Wikidata), not a real movement. Without this filter
    # /movement/no-movement-listed becomes the largest movement page.
    df = df[
        df["movement_display"].notna()
        & (df["movement_display"] != "")
        & (df["movement_display"] != "No movement listed")
    ].copy()

    movements: dict[str, dict] = {}
    index_rows: list[dict] = []

    for movement, group in df.groupby("movement_display"):
        total = int(len(group))
        if total < MOVEMENT_MIN_SCULPTORS:
            continue

        slug = _movement_slug(str(movement))

        # Birth-decade histogram. Sparse — we only emit decades that
        # actually have sculptors so the chart consumer doesn't have
        # to filter out zero rows it never plotted.
        by_decade = (
            group["birth_decade"]
            .dropna()
            .astype(int)
            .value_counts()
            .sort_index()
            .to_dict()
        )
        by_decade_list = [
            {"decade": int(d), "count": int(c)} for d, c in by_decade.items()
        ]

        country_counts = (
            group["birth_country"].dropna().value_counts().head(MOVEMENT_TOP_COUNTRIES)
        )
        top_countries = [
            {"country": str(k), "count": int(v)} for k, v in country_counts.items()
        ]

        # Notable sculptors — same definition as decade pages.
        notable_df = group.copy()
        notable_df["_deg"] = notable_df["total_degree"].fillna(0).astype(int)
        notable_df = notable_df.sort_values(
            ["_deg", "name"], ascending=[False, True]
        ).head(MOVEMENT_NOTABLE_LIMIT)
        notable = [
            {
                "qid": str(r["qid"]),
                "name": str(r["name"]),
                "birthYear": int(r["birth_year"]) if pd.notna(r.get("birth_year")) else None,
                "deathYear": int(r["death_year"]) if pd.notna(r.get("death_year")) else None,
                "citizenship": str(r["citizenship_display"]) if pd.notna(r.get("citizenship_display")) else None,
                "totalDegree": int(r["_deg"]),
            }
            for _, r in notable_df.iterrows()
        ]

        # Median birth year — lightweight "era" anchor for the headline
        # ("Cubism — sculptors born 1882–1928, peak 1900s").
        years = group["birth_year"].dropna().astype(int)
        years_min = int(years.min()) if len(years) else None
        years_max = int(years.max()) if len(years) else None
        years_median = int(years.median()) if len(years) else None
        peak_decade = int(group["birth_decade"].dropna().mode().iloc[0]) if len(group["birth_decade"].dropna()) else None

        movements[slug] = {
            "slug": slug,
            "name": str(movement),
            "total": total,
            "yearsMin": years_min,
            "yearsMax": years_max,
            "yearsMedian": years_median,
            "peakDecade": peak_decade,
            "byDecade": by_decade_list,
            "topCountries": top_countries,
            "notable": notable,
        }
        index_rows.append(
            {
                "slug": slug,
                "name": str(movement),
                "total": total,
                "peakDecade": peak_decade,
            }
        )

    index_rows.sort(key=lambda r: r["total"], reverse=True)

    return {"movements": movements, "index": index_rows}


def create_timeline_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create timeline_sculptors.json driven by the curated focus CSV.

    CSV is source of truth for the roster and dates — this guarantees every
    curated sculptor appears even if Wikidata lacks them. Where a sculptor
    IS in Wikidata we overlay QID, movement, and citizenship for richer
    tooltips and click-through to detail pages. A synthetic slug-based id
    is used when no QID is available.
    """
    focus_rows = load_focus_sculptors()

    # Index Wikidata nodes by normalized name for overlay lookups
    nodes_by_name = {}
    for _, row in nodes.iterrows():
        nodes_by_name[row["name_norm"]] = row

    def _slugify(name: str) -> str:
        norm = normalize_name(name)
        return "curated-" + norm.replace(" ", "-")

    records = []
    for focus in focus_rows:
        name = focus["name"]
        try:
            birth = int(focus["birth_year"])
        except (ValueError, TypeError):
            # Skip entries without a birth year — we can't place them on a timeline
            continue
        death = None
        if focus.get("death_year"):
            try:
                death = int(focus["death_year"])
            except (ValueError, TypeError):
                death = None

        wd_row = nodes_by_name.get(normalize_name(name))
        if wd_row is not None:
            qid = wd_row["qid"]
            movement = wd_row.get("movement_display")
            citizenship = wd_row.get("citizenship_display")
            # Prefer Wikidata dates only if they exist; otherwise keep CSV values
            wd_birth = wd_row.get("birth_year")
            wd_death = wd_row.get("death_year")
            if pd.notna(wd_birth):
                birth = int(wd_birth)
            if pd.notna(wd_death):
                death = int(wd_death)
        else:
            qid = _slugify(name)
            movement = None
            citizenship = None

        records.append({
            "id": qid,
            "name": name,
            "birthYear": birth,
            "deathYear": death,
            "birthDecade": (birth // 10) * 10,
            "movement": movement if movement and movement != "No movement listed" else None,
            "citizenship": citizenship if citizenship and citizenship != "Unknown" else None,
            "source": focus.get("source", "fabio"),
        })
    return records


def create_focus_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create focus_sculptors.json with enriched focus list (same schema as sculptors.json)."""
    focus_norm = [normalize_name(n) for n in FOCUS_SCULPTOR_NAMES]
    focus_df = nodes[nodes["name_norm"].isin(focus_norm)].copy()
    focus_df = focus_df.sort_values("birth_year")
    return [_sculptor_record(row) for _, row in focus_df.iterrows()]


def create_transparency_json(nodes: pd.DataFrame) -> dict:
    """Build transparency / demographic-audit payload for the About page.

    Shows the honest base rate: total cached sculptors, A.3 inclusion counts,
    signal-level coverage, and demographic breakdown of included vs excluded
    sets. Committed to as a standing commitment per the ethics-scholar expert.
    """
    total = len(nodes)
    included_mask = nodes["is_included"].astype(bool)
    included = int(included_mask.sum())
    excluded = total - included

    # Signal coverage
    from collections import Counter
    sig_counter: Counter = Counter()
    for sigs in nodes["inclusion_signals"]:
        for s in sigs:
            sig_counter[s] += 1

    def breakdown(subset: pd.DataFrame) -> dict:
        n = len(subset)
        if n == 0:
            return {"total": 0}
        gender = subset["gender"].value_counts().to_dict()
        top_citz = subset["citizenship_display"].value_counts().head(20).to_dict()
        decade = subset["birth_decade"].value_counts().sort_index().to_dict()
        return {
            "total": n,
            "gender": {str(k): int(v) for k, v in gender.items()},
            "topCitizenships": {str(k): int(v) for k, v in top_citz.items()},
            "byBirthDecade": {int(k): int(v) for k, v in decade.items()},
        }

    return {
        "generatedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "totalCached": total,
        "included": included,
        "excluded": excluded,
        "inclusionPctOfCache": round(100 * included / total, 1),
        "signalCoverage": {k: int(v) for k, v in sig_counter.items()},
        "criterion": {
            "version": "A.3",
            "rule": "Include if ANY of: movement, edge, focus, multi_citz, "
                    "sitelinks (>=3 non-EN Wikipedia articles, bot-wikis excluded)",
            "authorityIdsAsGate": False,
            "sitelinkMinNonEnglish": 3,
            "botWikisExcluded": ["ceb", "war"],
        },
        "includedBreakdown": breakdown(nodes[included_mask]),
        "excludedBreakdown": breakdown(nodes[~included_mask]),
        # Per-field coverage on the included set. Lets the transparency
        # page report "we have a portrait for X of Y included sculptors"
        # without the reader having to derive it. Fields are reported
        # individually rather than aggregated so a reader can see which
        # data is sparse and which is well-covered.
        "fieldCoverage": _field_coverage(nodes[included_mask]),
        # Country-name normalization meta. Combines static alias-table
        # shape (loaded fresh) with per-run record-rewrite counts read
        # from the sidecar JSON written by process.py at the end of
        # process_nodes(). If the sidecar is missing (e.g. an older
        # cached pipeline run), `recordsRewritten` is omitted and the
        # /transparency page falls back to showing only the alias-table
        # description.
        "countryNormalization": _country_normalization_block(),
    }


def _country_normalization_block() -> dict:
    """Combine alias-table shape with per-run rewrite counts."""
    block = country_alias_stats()
    from config import PROCESSED_DIR
    counts_path = PROCESSED_DIR / "country_normalization_counts.json"
    if counts_path.exists():
        with open(counts_path) as f:
            block["recordsRewritten"] = json.load(f)
    return block


def _field_coverage(subset: pd.DataFrame) -> dict:
    """Per-field non-null counts on the given subset.

    Used by the transparency page. Fields chosen for display value (what
    a reader can see on detail / explore pages) rather than internal
    bookkeeping. `image` was added in Phase 4 alongside the portrait
    feature; the others have been here since 3a/3b.
    """
    n = len(subset)
    fields = [
        "birth_place", "death_place", "native_name", "image",
        "authority_links", "movement_display", "citizenship_display",
    ]
    out: dict[str, dict] = {"total": int(n)}
    for f in fields:
        if f not in subset.columns:
            continue
        col = subset[f]
        if col.dtype == object and len(col) and isinstance(col.iloc[0], list):
            present = col.apply(lambda v: bool(v) if isinstance(v, list) else False).sum()
        else:
            present = col.notna().sum()
            # treat empty strings and "Unknown" as missing for display fields
            if f in ("citizenship_display", "movement_display"):
                present = (col.notna() & (col != "Unknown") & (col != "No movement listed")).sum()
        out[f] = {"present": int(present), "pct": round(100 * present / n, 1) if n else 0.0}
    return out


def create_materials_by_decade_json(materials: pd.DataFrame) -> list[dict]:
    """Create materials_by_decade.json in tidy format: {decade, category, count}."""
    if len(materials) == 0:
        return []
    
    # Melt wide format to tidy if needed
    skip_cols = {"decade", "total"}
    value_cols = [c for c in materials.columns if c not in skip_cols]
    
    if "category" in materials.columns and "count" in materials.columns:
        # Already tidy
        return materials[["decade", "category", "count"]].to_dict(orient="records")
    
    # Wide → tidy
    records = []
    for _, row in materials.iterrows():
        for col in value_cols:
            count = int(row[col]) if pd.notna(row[col]) else 0
            if count > 0:
                records.append({
                    "decade": int(row["decade"]),
                    "category": col,
                    "count": count,
                })
    
    return sorted(records, key=lambda r: (r["decade"], -r["count"]))


# Per-sculptor cap. Six works gives a 2x3 grid on desktop and a single
# scrollable column on tablet without overwhelming the meta block. The
# pipeline is the right place to truncate (rather than the client) so
# the shards stay small — each work record is ~250 bytes including
# image URLs.
MAX_WORKS_PER_SCULPTOR = 6


def build_works_index(nodes: pd.DataFrame) -> dict[str, list[dict]]:
    """Join Met + AIC museum parquet caches to QIDs and return a dict
    mapping QID → list of public-domain work records ready to embed in
    per-sculptor shards.

    Sources:
      - MET_OBJECTS_CACHE_PATH (written by query_museums.py)
      - AIC_OBJECTS_CACHE_PATH (same)

    Filtering: strict public-domain only, AND must have a non-empty
    image_url. The PD flag without an image is useless for a gallery
    and the image without PD is a rights problem; both gates apply.

    Matching: the museum cache keys works by sculptor_name (the focus
    list display name). We normalize_name() against `nodes.name_norm`
    to find the QID. Sculptors not in the museum cache (which is
    everyone outside the focus list at the time of writing) simply
    return an empty list at lookup time and the detail page renders
    nothing — the absence is honest.

    Returns top MAX_WORKS_PER_SCULPTOR per sculptor, sorted oldest
    first by year-extracted-from-date and breaking ties in source
    preference order (Met → AIC). The "oldest first" rule shows a
    sculptor's career arc rather than a random crop.
    """
    if not (MET_OBJECTS_CACHE_PATH.exists() or AIC_OBJECTS_CACHE_PATH.exists()):
        return {}

    name_to_qid = {row["name_norm"]: row["qid"] for _, row in nodes.iterrows()}

    frames = []
    if MET_OBJECTS_CACHE_PATH.exists():
        frames.append(pd.read_parquet(MET_OBJECTS_CACHE_PATH))
    if AIC_OBJECTS_CACHE_PATH.exists():
        frames.append(pd.read_parquet(AIC_OBJECTS_CACHE_PATH))
    if not frames:
        return {}
    works_df = pd.concat(frames, ignore_index=True, sort=False)

    # Older parquets (from before image fields were captured) won't
    # have these columns — guard so a stale cache doesn't crash the
    # whole export. Caller should re-run query_museums to populate.
    required = {"is_public_domain", "image_url", "thumbnail_url", "museum_url"}
    missing = required - set(works_df.columns)
    if missing:
        print(
            f"⚠ Museum cache missing image columns {sorted(missing)} — "
            "re-run pipeline with REFRESH_FROM_MET / REFRESH_FROM_AIC = True. "
            "Skipping works index for this build."
        )
        return {}

    # Strict gate: PD + non-empty image URL.
    pd_mask = works_df["is_public_domain"].fillna(False).astype(bool)
    img_mask = works_df["image_url"].fillna("").astype(str).str.len() > 0
    works_df = works_df[pd_mask & img_mask].copy()

    if len(works_df) == 0:
        print("⚠ No public-domain works with images found in museum cache")
        return {}

    # Year for sorting. Prefer numeric begin_year (Met provides it),
    # else parse from the display date string (AIC). When neither
    # works the work sorts last via a sentinel.
    import re

    def _year(row) -> int:
        by = row.get("begin_year")
        if pd.notna(by):
            try:
                return int(by)
            except (TypeError, ValueError):
                pass
        date_str = str(row.get("date", "") or "")
        match = re.search(r"\b(1[7-9]\d{2}|20\d{2})\b", date_str)
        if match:
            return int(match.group(1))
        return 9999  # unsortable → bottom of the list

    works_df["_year"] = works_df.apply(_year, axis=1)
    works_df["_source_rank"] = works_df["source"].map({"met": 0, "aic": 1}).fillna(2)

    # Resolve sculptor_name → QID via name normalization.
    works_df["_qid"] = works_df["sculptor_name"].apply(
        lambda n: name_to_qid.get(normalize_name(n))
    )
    works_df = works_df[works_df["_qid"].notna()].copy()

    if len(works_df) == 0:
        print(
            "⚠ Museum works found but none matched a sculptor by name — "
            "check normalize_name() against focus list display names."
        )
        return {}

    index: dict[str, list[dict]] = {}
    for qid, group in works_df.groupby("_qid"):
        group_sorted = group.sort_values(by=["_year", "_source_rank", "object_id"])
        records = []
        for _, row in group_sorted.head(MAX_WORKS_PER_SCULPTOR).iterrows():
            records.append({
                "source": str(row["source"]),
                "objectId": str(row["object_id"]),
                "title": str(row.get("title") or "Untitled"),
                "date": str(row.get("date") or "") or None,
                "medium": str(row.get("medium") or "") or None,
                "imageUrl": str(row["image_url"]),
                "thumbnailUrl": str(row.get("thumbnail_url") or row["image_url"]),
                "museumUrl": str(row.get("museum_url") or "") or None,
                "creditLine": str(row.get("credit_line") or "") or None,
            })
        index[str(qid)] = records

    total = sum(len(v) for v in index.values())
    print(f"✓ Built works index: {total} PD images across {len(index)} sculptors")
    return index


def export_all():
    """Export all JSON files."""
    print("=" * 60)
    print("Exporting JSON files...")
    print("=" * 60)
    
    nodes, relations, materials, external_mentors = load_data()
    
    # Export sculptors.json
    sculptors = create_sculptors_json(nodes)
    sculptors_path = WEB_DATA_DIR / "sculptors.json"
    with open(sculptors_path, "w") as f:
        json.dump(sculptors, f, indent=2)
    print(f"✓ Exported {len(sculptors)} sculptors to {sculptors_path.name}")

    # Export the slim sculptors_index.json used by /explore and /lineage.
    # Written compact (no indent) because it's machine-read on every page
    # load — the ~30% size win from dropping whitespace matters here.
    # Detail page still uses per-sculptor shards for the full record.
    sculptors_index = create_sculptors_index_json(nodes)
    sculptors_index_path = WEB_DATA_DIR / "sculptors_index.json"
    with open(sculptors_index_path, "w") as f:
        json.dump(sculptors_index, f, separators=(",", ":"))
    print(f"✓ Exported slim index to {sculptors_index_path.name} ({len(sculptors_index)} sculptors)")

    # Export per-sculptor shards under data/sculptors/{qid}.json so the
    # detail page can fetch a single ~1.2KB record instead of the full
    # 5.9MB list. /explore and /lineage now use the slim
    # sculptors_index.json above; sculptors.json itself is retained for
    # build-time consumers (generateStaticParams on the detail route).
    #
    # Shards are written with `indent=None` (compact) since no human
    # reads them and the size savings compound across 3,600+ files.
    shard_dir = WEB_DATA_DIR / "sculptors"
    shard_dir.mkdir(parents=True, exist_ok=True)
    # Wipe any stale shards from previous runs — QIDs can disappear
    # when inclusion signals change and we don't want orphaned files
    # served forever by Vercel's static cache.
    for stale in shard_dir.glob("*.json"):
        stale.unlink()

    # Build the per-QID works index once, then merge per-sculptor.
    # Sculptors with no museum coverage (the vast majority outside the
    # focus list) simply don't get a `works` field; the detail page
    # treats absence as "no PD images available" rather than an error.
    works_index = build_works_index(nodes)

    for record in sculptors:
        qid = record["qid"]
        shard = dict(record)
        works = works_index.get(qid)
        if works:
            shard["works"] = works
        shard_path = shard_dir / f"{qid}.json"
        with open(shard_path, "w") as f:
            json.dump(shard, f, separators=(",", ":"))
    sculptors_with_works = sum(1 for r in sculptors if works_index.get(r["qid"]))
    print(
        f"✓ Exported {len(sculptors)} per-sculptor shards to {shard_dir.name}/ "
        f"({sculptors_with_works} include PD museum works)"
    )

    # Export edges.json (now includes per-edge crossesBorders flag)
    edges = create_edges_json(relations, nodes)
    edges_path = WEB_DATA_DIR / "edges.json"
    with open(edges_path, "w") as f:
        json.dump(edges, f, indent=2)
    print(f"✓ Exported {len(edges)} edges to {edges_path.name}")

    # Export cross_cultural_summary.json (Phase 4 collaboration story)
    cc_summary = create_cross_cultural_summary(edges, nodes)
    cc_path = WEB_DATA_DIR / "cross_cultural_summary.json"
    with open(cc_path, "w") as f:
        json.dump(cc_summary, f, indent=2)
    print(
        f"✓ Cross-cultural lineages: {cc_summary['crossBorder']}/"
        f"{cc_summary['comparable']} comparable edges cross national borders"
    )

    # Export external_mentors.json
    ext_mentors = create_external_mentors_json(external_mentors)
    ext_path = WEB_DATA_DIR / "external_mentors.json"
    with open(ext_path, "w") as f:
        json.dump(ext_mentors, f, indent=2)
    print(f"✓ Exported {len(ext_mentors)} external mentors to {ext_path.name}")
    
    # Export movements_by_decade.json
    movements = create_movements_by_decade_json(nodes)
    movements_path = WEB_DATA_DIR / "movements_by_decade.json"
    with open(movements_path, "w") as f:
        json.dump(movements, f, indent=2)
    print(f"✓ Exported movements by decade to {movements_path.name}")
    
    # Export geography_by_decade.json (citizenship — legal/attributed)
    geography = create_geography_by_decade_json(nodes)
    geography_path = WEB_DATA_DIR / "geography_by_decade.json"
    with open(geography_path, "w") as f:
        json.dump(geography, f, indent=2)
    print(f"✓ Exported geography by decade to {geography_path.name}")

    # Export geography_by_birth_country.json (place of birth — honest origin)
    geography_birth = create_geography_by_birth_country_json(nodes)
    geography_birth_path = WEB_DATA_DIR / "geography_by_birth_country.json"
    with open(geography_birth_path, "w") as f:
        json.dump(geography_birth, f, indent=2)
    print(f"✓ Exported geography by birth country to {geography_birth_path.name}")

    # Export migration.json — birth → death country flows for the
    # Migration view. Same nodes frame as everything else; no extra
    # Wikidata queries.
    migration = create_migration_json(nodes)
    migration_path = WEB_DATA_DIR / "migration.json"
    with open(migration_path, "w") as f:
        json.dump(migration, f, indent=2)
    print(
        f"✓ Exported migration flows to {migration_path.name} "
        f"({migration['meta']['crossedBorders']} crossed borders, "
        f"{migration['meta']['sameCountry']} stayed put, "
        f"{len(migration['flows'])} unique corridors)"
    )

    # Export decades.json — per-decade aggregates for /decade/[year] pages.
    # Reuses the migration bundle for top corridors so we don't recompute
    # the group-by twice.
    decades = create_decades_json(nodes, migration)
    decades_path = WEB_DATA_DIR / "decades.json"
    with open(decades_path, "w") as f:
        json.dump(decades, f, indent=2)
    print(f"✓ Exported decade aggregates to {decades_path.name} ({len(decades)} decades)")

    # Export movements.json — per-movement aggregates for /movement/[slug] pages.
    movements_bundle = create_movements_json(nodes)
    movements_bundle_path = WEB_DATA_DIR / "movements.json"
    with open(movements_bundle_path, "w") as f:
        json.dump(movements_bundle, f, indent=2)
    print(
        f"✓ Exported movement aggregates to {movements_bundle_path.name} "
        f"({len(movements_bundle['movements'])} movements with ≥{MOVEMENT_MIN_SCULPTORS} sculptors)"
    )
    
    # Export focus_sculptors.json
    focus = create_focus_sculptors_json(nodes)
    focus_path = WEB_DATA_DIR / "focus_sculptors.json"
    with open(focus_path, "w") as f:
        json.dump(focus, f, indent=2)
    print(f"✓ Exported {len(focus)} focus sculptors to {focus_path.name}")
    
    # Export timeline_sculptors.json (replaces hand-maintained file)
    timeline = create_timeline_sculptors_json(nodes)
    timeline_path = WEB_DATA_DIR / "timeline_sculptors.json"
    with open(timeline_path, "w") as f:
        json.dump(timeline, f, indent=2)
    print(f"✓ Exported {len(timeline)} timeline sculptors to {timeline_path.name}")
    
    # Export materials_by_decade.json
    materials_export = create_materials_by_decade_json(materials)
    materials_path = WEB_DATA_DIR / "materials_by_decade.json"
    with open(materials_path, "w") as f:
        json.dump(materials_export, f, indent=2)
    print(f"✓ Exported materials by decade to {materials_path.name} ({len(materials_export)} decades)")

    # Export transparency.json (Option A.3 demographic audit, standing commitment)
    transparency = create_transparency_json(nodes)
    transparency_path = WEB_DATA_DIR / "transparency.json"
    with open(transparency_path, "w") as f:
        json.dump(transparency, f, indent=2)
    print(f"✓ Exported transparency audit to {transparency_path.name} "
          f"({transparency['included']}/{transparency['totalCached']} included)")

    print("\n✓ All exports complete!")
    return {
        "sculptors": sculptors,
        "edges": edges,
        "movements_by_decade": movements,
        "geography_by_decade": geography,
        "focus_sculptors": focus,
        "timeline_sculptors": timeline,
        "materials_by_decade": materials_export,
        "transparency": transparency,
        "external_mentors": ext_mentors,
    }


if __name__ == "__main__":
    export_all()
