"""Getty ULAN crosswalk — Phase 3b.

Fetches per-record JSON-LD from Getty's vocab service for every sculptor
that already carries a Wikidata-supplied ULAN ID (P245). Stores raw
records on disk, then parses them into a normalized parquet suitable
for joining back into the sculptor table.

Why per-record JSON-LD instead of SPARQL?
- The Getty SPARQL endpoint at vocab.getty.edu/sparql is unreliable —
  multiple probe queries hung indefinitely during 3b scoping.
- The per-record endpoint (https://vocab.getty.edu/ulan/{id}.json) is
  stable, fast (1–4s typical), and trivially cacheable as one file per
  sculptor. Resume-on-rerun is free: we just check whether the cached
  file already exists.
- We sacrifice the ability to do server-side filtering, but at our
  scale (~2,300 records, ~30 MB total) downloading the whole record per
  sculptor is fine.

What we extract:
- Getty's preferred label.
- Birth year + place (city or country, as reported).
- Death year + place.
- Nationality "chips" — entries in `classified_as` whose AAT IDs fall
  in the nationality/culture range (300107xxx–300112xxx). These are
  cultural attributions in Getty's model, NOT citizenship in the legal
  sense — Wikidata's `citizenships[]` may legitimately disagree, and
  the audit script (audit_getty.py) treats this as data quality news,
  not a defect.

Politeness: a 200ms gap between requests, 12s per-request hard timeout,
two retries on transient failure (429, 5xx, timeout). Single-threaded
because Getty's recommended client is conservative and we don't need
the parallelism — a full run completes in ~10 minutes.
"""
import json
import time
from pathlib import Path
from typing import Optional

import pandas as pd
import requests

from config import (
    PROCESSED_DIR,
    RAW_CACHE_DIR,
    USER_AGENT,
    WEB_DATA_DIR,
)

# Per-record JSON-LD endpoint. We swap out the SPARQL one because of
# stability — see module docstring.
GETTY_ENDPOINT = "https://vocab.getty.edu/ulan/{id}.json"

# Storage: one JSON file per ULAN ID, mirrors the upstream URL shape.
GETTY_CACHE_DIR = RAW_CACHE_DIR / "getty"
GETTY_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Output: qid-keyed parquet that export_json.py and audit_getty.py read.
GETTY_VERIFIED_PATH = PROCESSED_DIR / "getty_verified.parquet"

# Politeness knobs. Conservative because Getty's docs explicitly ask
# clients to throttle, and we have all the time in the world.
REQUEST_GAP_SECONDS = 0.20
PER_REQUEST_TIMEOUT = 12
MAX_ATTEMPTS = 3
BACKOFF_SECONDS = (2, 5)

# Getty AAT ID prefixes that map to nationality/culture chips in the
# `classified_as` block. Anything outside this range is occupation
# (architects, painters, draftsmen) or gender (male/female) and gets
# discarded from the nationality view.
NATIONALITY_AAT_PREFIXES = (
    "300107", "300108", "300109", "300110", "300111", "300112",
)


def _is_nationality_chip(getty_id: str) -> bool:
    """True for AAT IDs in the nationality/culture range."""
    if not getty_id:
        return False
    aat = getty_id.rsplit("/", 1)[-1]
    return aat.startswith(NATIONALITY_AAT_PREFIXES)


def _strip_parenthetical(label: str) -> str:
    """Normalize 'French (culture or style)' → 'French'.

    Getty wraps every cultural attribution in '(culture or style)' or
    similar. Stripping the parenthetical gives a stable form to compare
    against Wikidata's country names. Continent attributions like
    'American (North American)' collapse to 'American', which is the
    correct comparable for joining to Wikidata's country labels.
    """
    if not label:
        return ""
    paren = label.find("(")
    if paren == -1:
        return label.strip()
    return label[:paren].strip()


def _extract_ulan_targets(sculptors_json_path: Path) -> list[tuple[str, str]]:
    """Read sculptors.json and return [(qid, ulan_id), ...] tuples.

    We pull from the already-exported web JSON instead of the upstream
    parquet because (a) it's the canonical sculptor list everyone agrees
    on and (b) the authority links are already in their final form.
    """
    sculptors = json.loads(Path(sculptors_json_path).read_text(encoding="utf-8"))
    out: list[tuple[str, str]] = []
    for s in sculptors:
        for link in (s.get("authorityLinks") or []):
            if link.get("type") == "ulan" and link.get("id"):
                out.append((s["qid"], str(link["id"])))
                break
    return out


def _fetch_one(ulan_id: str, session: requests.Session) -> Optional[dict]:
    """Fetch one ULAN JSON-LD record with retry/backoff. Returns None on
    permanent failure so the caller can keep going."""
    cache = GETTY_CACHE_DIR / f"{ulan_id}.json"
    if cache.exists():
        try:
            return json.loads(cache.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            cache.unlink(missing_ok=True)  # corrupt cache, refetch

    url = GETTY_ENDPOINT.format(id=ulan_id)
    last_err: Optional[Exception] = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            r = session.get(
                url,
                timeout=PER_REQUEST_TIMEOUT,
                headers={"Accept": "application/json"},
            )
            if r.status_code == 404:
                # ULAN ID exists in Wikidata but Getty has retired/merged
                # it. Don't retry; mark as missing.
                return None
            r.raise_for_status()
            payload = r.json()
            cache.write_text(json.dumps(payload), encoding="utf-8")
            return payload
        except (requests.RequestException, json.JSONDecodeError) as e:
            last_err = e
            if attempt < MAX_ATTEMPTS:
                wait = BACKOFF_SECONDS[min(attempt - 1, len(BACKOFF_SECONDS) - 1)]
                time.sleep(wait)
    print(f"    ✗ {ulan_id}: gave up after {MAX_ATTEMPTS} attempts ({last_err})")
    return None


def _parse_record(qid: str, ulan_id: str, payload: dict) -> dict:
    """Flatten a Getty JSON-LD record into a row.

    Returns an empty-ish row (with qid + ulan_id) when payload is None
    so the caller can still emit a DataFrame entry. Coverage flags on
    each field tell downstream consumers what's actually populated.
    """
    row: dict = {
        "qid": qid,
        "ulan_id": ulan_id,
        "getty_label": None,
        "getty_birth_year": None,
        "getty_birth_place": None,
        "getty_death_year": None,
        "getty_death_place": None,
        "getty_nationalities": [],
        "getty_fetched": payload is not None,
    }
    if payload is None:
        return row

    row["getty_label"] = payload.get("_label")

    born = payload.get("born") or {}
    bts = (born.get("timespan") or {}).get("begin_of_the_begin")
    if bts and len(bts) >= 4:
        try:
            row["getty_birth_year"] = int(bts[:4])
        except ValueError:
            pass
    bplaces = born.get("took_place_at") or []
    if bplaces:
        row["getty_birth_place"] = bplaces[0].get("_label")

    died = payload.get("died") or {}
    dts = (died.get("timespan") or {}).get("begin_of_the_begin")
    if dts and len(dts) >= 4:
        try:
            row["getty_death_year"] = int(dts[:4])
        except ValueError:
            pass
    dplaces = died.get("took_place_at") or []
    if dplaces:
        row["getty_death_place"] = dplaces[0].get("_label")

    # Nationality chips: AAT IDs in the cultures range OFTEN overlap
    # with subtype occupations. The boundary case we hit is AAT 300112172
    # = "draftsmen (artists)", which is in the 300112 prefix block right
    # next to actual nationality terms like 300111198 = Italian. The
    # robust filter is: nationality range AND parenthetical is not
    # `(artists)` (occupations) and not `(occupation)`. Plain unsuffixed
    # labels like "Argentine" pass through cleanly.
    nats: list[str] = []
    for chip in (payload.get("classified_as") or []):
        chip_id = chip.get("id", "")
        if not _is_nationality_chip(chip_id):
            continue
        raw_label = chip.get("_label") or ""
        if "(artists)" in raw_label or "(occupation)" in raw_label:
            continue
        label = _strip_parenthetical(raw_label)
        if label and label not in nats:
            nats.append(label)
    row["getty_nationalities"] = nats

    return row


def fetch_all(
    sculptors_json_path: Path = WEB_DATA_DIR / "sculptors.json",
    refresh: bool = False,
    limit: Optional[int] = None,
) -> pd.DataFrame:
    """Fetch + parse Getty records for every ULAN-tagged sculptor.

    Args:
        sculptors_json_path: source of (qid, ulan_id) pairs.
        refresh: when True, ignore the cached parquet output and re-parse
            (does NOT re-download cached JSON files unless those are also
            removed manually).
        limit: optional cap on number of fetches — used for the probe.
    """
    if GETTY_VERIFIED_PATH.exists() and not refresh:
        print(f"✓ Using cached Getty parquet: {GETTY_VERIFIED_PATH.name}")
        return pd.read_parquet(GETTY_VERIFIED_PATH)

    targets = _extract_ulan_targets(sculptors_json_path)
    if limit:
        targets = targets[:limit]
    n = len(targets)
    if n == 0:
        print("⚠ No ULAN IDs to fetch.")
        return pd.DataFrame()

    print(f"→ Getty fetch: {n} sculptors with ULAN IDs")
    cached_existing = sum(
        1 for _, ulan in targets if (GETTY_CACHE_DIR / f"{ulan}.json").exists()
    )
    if cached_existing:
        print(f"  ({cached_existing} already on disk — these don't re-fetch)")

    rows: list[dict] = []
    fetched_now = 0
    failed = 0
    t0 = time.time()
    with requests.Session() as session:
        session.headers.update({"User-Agent": USER_AGENT})
        for i, (qid, ulan_id) in enumerate(targets, 1):
            cache_existed = (GETTY_CACHE_DIR / f"{ulan_id}.json").exists()
            payload = _fetch_one(ulan_id, session)
            if payload is None and not cache_existed:
                failed += 1
            elif not cache_existed:
                fetched_now += 1
                # Throttle only when we actually hit the network.
                time.sleep(REQUEST_GAP_SECONDS)
            rows.append(_parse_record(qid, ulan_id, payload))

            # Progress every 100 — chatty enough to know it's alive,
            # not so chatty that the log becomes noise.
            if i % 100 == 0 or i == n:
                elapsed = time.time() - t0
                rate = fetched_now / elapsed if elapsed > 0 and fetched_now else 0
                print(
                    f"  [{i:>5}/{n}] fetched={fetched_now} from-cache={i - fetched_now - failed} "
                    f"failed={failed} elapsed={elapsed:.0f}s "
                    f"rate={rate:.1f}/s"
                )

    df = pd.DataFrame(rows)
    df.to_parquet(GETTY_VERIFIED_PATH, index=False)
    print(f"✓ Wrote {len(df)} rows → {GETTY_VERIFIED_PATH}")
    print(
        f"  coverage: birth_year={df['getty_birth_year'].notna().sum()}, "
        f"birth_place={df['getty_birth_place'].notna().sum()}, "
        f"death_place={df['getty_death_place'].notna().sum()}, "
        f"any_nationality={(df['getty_nationalities'].apply(len) > 0).sum()}"
    )
    return df


if __name__ == "__main__":
    import sys
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    fetch_all(limit=limit, refresh=True)
