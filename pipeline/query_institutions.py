"""Phase 5b — institutional densification queries.

Three SPARQL ingests, mirroring `query_enrichment.py`:

1. **P69 (educated_at)** per sculptor, with P580 / P582 statement
   qualifiers preserved when present. Phase 5a probe measured 34.3%
   coverage on our 6,711 cache → ~3,450 sculptor-institution edges.
2. **P937 (work_location)** per sculptor, same qualifier handling.
   Phase 5a measured 27.6% coverage; will mix cities + studios.
3. **Institution metadata** (label, P571 inception, P576 dissolved)
   for the union of distinct institution QIDs from queries 1 + 2.
   Feeds the temporal-envelope model defined in PHASE_5_PLAN.md
   (institution `existed_from` / `existed_to` derived here).

Outputs four parquet caches in data/raw/:
    sculptor_educated_at_1800plus.parquet
    sculptor_work_location_1800plus.parquet
    institution_qids_1800plus.parquet         (union; intermediate)
    institution_metadata_1800plus.parquet

Plus a provenance sidecar `*_provenance.json` per cache, capturing
source URL, query date, row count, and a SHA of the query template —
so re-runs are traceable and the /transparency page can surface
"data fetched on YYYY-MM-DD".

Run standalone:
    python -m query_institutions
"""
from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from config import (
    MIN_BIRTH_YEAR,
    QID_CACHE_PATH,
    RAW_CACHE_DIR,
    SPARQL_ENDPOINT,
    VALUES_BATCH_SIZE,
)
from helpers import build_values_block, query_sparql_batched, query_sparql


# =============================================================================
# Cache paths
# =============================================================================
EDUCATED_AT_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_educated_at_{MIN_BIRTH_YEAR}plus.parquet"
WORK_LOCATION_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_work_location_{MIN_BIRTH_YEAR}plus.parquet"
INSTITUTION_QIDS_CACHE_PATH = RAW_CACHE_DIR / f"institution_qids_{MIN_BIRTH_YEAR}plus.parquet"
INSTITUTION_METADATA_CACHE_PATH = RAW_CACHE_DIR / f"institution_metadata_{MIN_BIRTH_YEAR}plus.parquet"


# =============================================================================
# Query 1: P69 educated_at with P580/P582 qualifiers.
#
# Uses p:/ps:/pq: triple-pattern form to access statement-level
# qualifiers. A sculptor with N P69 statements yields N rows; if a
# statement has no P580/P582, the qualifier columns come back null.
# The institution itself is just a QID here — labels resolved later
# via the metadata query so we have a single label authority.
# =============================================================================
EDUCATED_AT_TEMPLATE = """
PREFIX wd:  <http://www.wikidata.org/entity/>
PREFIX p:   <http://www.wikidata.org/prop/>
PREFIX ps:  <http://www.wikidata.org/prop/statement/>
PREFIX pq:  <http://www.wikidata.org/prop/qualifier/>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (REPLACE(STR(?inst), 'http://www.wikidata.org/entity/', '') AS ?inst_qid)
  (YEAR(?start) AS ?start_year)
  (YEAR(?end) AS ?end_year)
WHERE {
  {{VALUES_BLOCK}}
  ?qid p:P69 ?stmt .
  ?stmt ps:P69 ?inst .
  OPTIONAL { ?stmt pq:P580 ?start . }
  OPTIONAL { ?stmt pq:P582 ?end . }
}
"""


# =============================================================================
# Query 2: P937 work_location with P580/P582 qualifiers.
#
# Same structure as P69; semantics are noisier (the value can be a
# city, a studio, or an artist colony). Filtering to "studio-like"
# entities is a downstream concern in process.py.
# =============================================================================
WORK_LOCATION_TEMPLATE = """
PREFIX wd:  <http://www.wikidata.org/entity/>
PREFIX p:   <http://www.wikidata.org/prop/>
PREFIX ps:  <http://www.wikidata.org/prop/statement/>
PREFIX pq:  <http://www.wikidata.org/prop/qualifier/>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (REPLACE(STR(?loc), 'http://www.wikidata.org/entity/', '') AS ?loc_qid)
  (YEAR(?start) AS ?start_year)
  (YEAR(?end) AS ?end_year)
WHERE {
  {{VALUES_BLOCK}}
  ?qid p:P937 ?stmt .
  ?stmt ps:P937 ?loc .
  OPTIONAL { ?stmt pq:P580 ?start . }
  OPTIONAL { ?stmt pq:P582 ?end . }
}
"""


# =============================================================================
# Query 3: Institution metadata.
#
# For each institution QID found via P69 / P937: English label
# (with `mul` fallback for multi-lingual entities), P571 inception
# year, P576 dissolved year. Inception + dissolved feed the temporal
# envelope (`existed_from`, `existed_to`) defined in PHASE_5_PLAN.md.
#
# A few entities have multiple P571 statements (founding date
# disagreements between sources); we take the earliest year via
# downstream aggregation. P576 is null for institutions still
# operating, which is correct — the envelope-builder treats null
# `existed_to` as "extant; bound by `now`."
# =============================================================================
INSTITUTION_METADATA_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?label
  (LANG(?label) AS ?label_lang)
  (YEAR(?inception) AS ?inception_year)
  (YEAR(?dissolved) AS ?dissolved_year)
WHERE {
  {{VALUES_BLOCK}}
  OPTIONAL {
    ?qid rdfs:label ?label .
    FILTER(LANG(?label) IN ('en', 'mul'))
  }
  OPTIONAL { ?qid wdt:P571 ?inception . }
  OPTIONAL { ?qid wdt:P576 ?dissolved . }
}
"""


# =============================================================================
# Provenance sidecar
# =============================================================================
def _query_sha(template: str) -> str:
    """Stable SHA-256 of the query template, for change detection."""
    return hashlib.sha256(template.encode("utf-8")).hexdigest()[:16]


def _write_provenance(
    cache_path: Path,
    *,
    template: str,
    row_count: int,
    qid_count: int,
    description: str,
) -> None:
    """Write a `<cache>_provenance.json` sidecar next to the parquet.

    Surfaces the data lineage on /transparency: when the data was
    fetched, against which endpoint, with which query template SHA,
    and how many rows came back. Re-running with the same template
    and the same QID set should produce the same row count to within
    Wikidata churn — a regression here flags either upstream
    schema/data changes or a query bug.
    """
    sidecar = cache_path.with_name(cache_path.stem + "_provenance.json")
    sidecar.write_text(
        json.dumps(
            {
                "cache": cache_path.name,
                "description": description,
                "endpoint": SPARQL_ENDPOINT,
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "query_sha16": _query_sha(template),
                "input_qid_count": qid_count,
                "output_row_count": row_count,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


# =============================================================================
# Runners
# =============================================================================
def run_educated_at(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    df = query_sparql_batched(
        query_template=EDUCATED_AT_TEMPLATE,
        qids=qids,
        cache_path=EDUCATED_AT_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )
    if refresh or not (EDUCATED_AT_CACHE_PATH.with_name(
        EDUCATED_AT_CACHE_PATH.stem + "_provenance.json"
    )).exists():
        _write_provenance(
            EDUCATED_AT_CACHE_PATH,
            template=EDUCATED_AT_TEMPLATE,
            row_count=len(df),
            qid_count=len(qids),
            description="P69 educated_at per sculptor with P580/P582 qualifiers",
        )
    return df


def run_work_location(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    df = query_sparql_batched(
        query_template=WORK_LOCATION_TEMPLATE,
        qids=qids,
        cache_path=WORK_LOCATION_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )
    if refresh or not (WORK_LOCATION_CACHE_PATH.with_name(
        WORK_LOCATION_CACHE_PATH.stem + "_provenance.json"
    )).exists():
        _write_provenance(
            WORK_LOCATION_CACHE_PATH,
            template=WORK_LOCATION_TEMPLATE,
            row_count=len(df),
            qid_count=len(qids),
            description="P937 work_location per sculptor with P580/P582 qualifiers",
        )
    return df


def collect_institution_qids(
    educated_at_df: pd.DataFrame,
    work_location_df: pd.DataFrame,
    refresh: bool = False,
) -> list[str]:
    """Take the union of institution QIDs across P69 + P937 outputs.

    The same QID can appear in both (e.g. an academy that's also a
    work location). De-duped; sorted for deterministic batching."""
    if not refresh and INSTITUTION_QIDS_CACHE_PATH.exists():
        print(f"✓ Loading cached: {INSTITUTION_QIDS_CACHE_PATH.name}")
        return pd.read_parquet(INSTITUTION_QIDS_CACHE_PATH)["qid"].tolist()

    qids = set()
    if "inst_qid" in educated_at_df.columns:
        qids.update(educated_at_df["inst_qid"].dropna().unique())
    if "loc_qid" in work_location_df.columns:
        qids.update(work_location_df["loc_qid"].dropna().unique())
    qids_list = sorted(qids)

    pd.DataFrame({"qid": qids_list}).to_parquet(
        INSTITUTION_QIDS_CACHE_PATH, index=False
    )
    print(f"✓ Cached: {INSTITUTION_QIDS_CACHE_PATH.name} ({len(qids_list)} QIDs)")
    return qids_list


def run_institution_metadata(
    institution_qids: list[str], refresh: bool = False
) -> pd.DataFrame:
    """Fetch label + inception + dissolved per institution QID.

    Reuses `query_sparql_batched`, which expects VALUES over `?qid`.
    Our template binds institution QIDs to `?qid`, so the helper
    works as-is despite the variable being semantically an
    institution rather than a sculptor in this query.
    """
    df = query_sparql_batched(
        query_template=INSTITUTION_METADATA_TEMPLATE,
        qids=institution_qids,
        cache_path=INSTITUTION_METADATA_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )
    if refresh or not (INSTITUTION_METADATA_CACHE_PATH.with_name(
        INSTITUTION_METADATA_CACHE_PATH.stem + "_provenance.json"
    )).exists():
        _write_provenance(
            INSTITUTION_METADATA_CACHE_PATH,
            template=INSTITUTION_METADATA_TEMPLATE,
            row_count=len(df),
            qid_count=len(institution_qids),
            description="Institution metadata: label (en|mul), P571 inception, P576 dissolved",
        )
    return df


def run_all_institutions(refresh: bool = False) -> dict[str, pd.DataFrame]:
    """Full institutional densification ingest.

    Sequence:
      1. P69 educated_at per sculptor
      2. P937 work_location per sculptor
      3. Union institution QIDs from (1)+(2), cache as intermediate
      4. Institution metadata for the union
    """
    qids = pd.read_parquet(QID_CACHE_PATH)["qid"].tolist()
    print(f"Phase 5b institutional ingest for {len(qids)} sculptors\n")

    print("== P69 educated_at ==")
    edu_df = run_educated_at(qids, refresh=refresh)
    sculptors_with_edu = edu_df["qid_clean"].nunique() if not edu_df.empty else 0
    print(f"   {len(edu_df)} statements across {sculptors_with_edu} sculptors\n")

    print("== P937 work_location ==")
    work_df = run_work_location(qids, refresh=refresh)
    sculptors_with_work = work_df["qid_clean"].nunique() if not work_df.empty else 0
    print(f"   {len(work_df)} statements across {sculptors_with_work} sculptors\n")

    print("== Union institution QIDs ==")
    inst_qids = collect_institution_qids(edu_df, work_df, refresh=refresh)
    print(f"   {len(inst_qids)} distinct institutions to look up\n")

    print("== Institution metadata ==")
    meta_df = run_institution_metadata(inst_qids, refresh=refresh)
    inst_with_meta = meta_df["qid_clean"].nunique() if not meta_df.empty else 0
    print(f"   {len(meta_df)} rows covering {inst_with_meta} institutions\n")

    return {
        "educated_at": edu_df,
        "work_location": work_df,
        "institution_metadata": meta_df,
    }


if __name__ == "__main__":
    run_all_institutions(refresh=True)
