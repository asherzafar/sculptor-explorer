"""Phase 3a enrichment queries — new Wikidata properties for inclusion
criteria (Option A.2) and the migration/geography story.

Each query here is single-property or simple-UNION (no multi-step joins),
so they should not hit the timeout failures that the RELATIONS UNION query
encountered.

Produces five new cached parquet files in data/raw/:
- sculptor_sitelinks_1800plus.parquet
- sculptor_authority_ids_1800plus.parquet
- sculptor_birth_places_1800plus.parquet
- sculptor_death_places_1800plus.parquet
- sculptor_native_names_1800plus.parquet

Run standalone to refresh all:
    python -m query_enrichment
"""
from __future__ import annotations

import pandas as pd
from config import (
    RAW_CACHE_DIR,
    VALUES_BATCH_SIZE,
    MIN_BIRTH_YEAR,
    QID_CACHE_PATH,
)
from helpers import query_sparql_batched


# =============================================================================
# Cache paths
# =============================================================================
SITELINKS_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_sitelinks_{MIN_BIRTH_YEAR}plus.parquet"
AUTHORITY_IDS_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_authority_ids_{MIN_BIRTH_YEAR}plus.parquet"
BIRTH_PLACES_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_birth_places_{MIN_BIRTH_YEAR}plus.parquet"
DEATH_PLACES_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_death_places_{MIN_BIRTH_YEAR}plus.parquet"
NATIVE_NAMES_CACHE_PATH = RAW_CACHE_DIR / f"sculptor_native_names_{MIN_BIRTH_YEAR}plus.parquet"


# =============================================================================
# Query 1: Wikipedia sitelinks per sculptor
#
# Returns one row per (sculptor, language_wiki). Excludes bot-dominated
# Wikipedias (ceb, war) per expert recommendation. We'll compute the
# inclusion signal ("has ≥2 sitelinks including ≥1 non-English") in
# post-processing so we can also display the language list.
# =============================================================================
SITELINKS_TEMPLATE = """
PREFIX wd:     <http://www.wikidata.org/entity/>
PREFIX schema: <http://schema.org/>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?lang
WHERE {
  {{VALUES_BLOCK}}
  ?article schema:about ?qid ;
           schema:inLanguage ?lang ;
           schema:isPartOf ?site .
  FILTER(CONTAINS(STR(?site), 'wikipedia.org'))
  FILTER(?lang NOT IN ('ceb', 'war'))
}
"""


# =============================================================================
# Query 2: Authority identifiers
#
# Returns one row per (sculptor, authority) where authority is one of:
#   ulan (P245), viaf (P214), lcnaf (P244), bnf (P268), dnb (P227),
#   ndl (P349 — National Diet Library / Japan), bne (P950 — Spain).
# We combine all seven via UNION but there are no joins/labels, so this is
# light. If it times out, we'll split into per-authority queries.
# =============================================================================
AUTHORITY_IDS_TEMPLATE = """
PREFIX wd:  <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?authority
  ?value
WHERE {
  {{VALUES_BLOCK}}
  {
    ?qid wdt:P245 ?value . BIND('ulan'  AS ?authority)
  } UNION {
    ?qid wdt:P214 ?value . BIND('viaf'  AS ?authority)
  } UNION {
    ?qid wdt:P244 ?value . BIND('lcnaf' AS ?authority)
  } UNION {
    ?qid wdt:P268 ?value . BIND('bnf'   AS ?authority)
  } UNION {
    ?qid wdt:P227 ?value . BIND('dnb'   AS ?authority)
  } UNION {
    ?qid wdt:P349 ?value . BIND('ndl'   AS ?authority)
  } UNION {
    ?qid wdt:P950 ?value . BIND('bne'   AS ?authority)
  }
}
"""


# =============================================================================
# Query 3: Place of birth (P19) with label + country
#
# Returns per-sculptor: qid_clean, birth_place_qid, birth_place_label,
# birth_country_label. A sculptor can have multiple P19s (rare) but we take
# what's there; downstream SAMPLE if needed.
# =============================================================================
BIRTH_PLACES_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (REPLACE(STR(?place), 'http://www.wikidata.org/entity/', '') AS ?place_qid)
  ?place_label
  ?country_label
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P19 ?place .
  OPTIONAL { ?place rdfs:label ?place_label . FILTER(LANG(?place_label) = 'en') }
  OPTIONAL {
    ?place wdt:P17 ?country .
    ?country rdfs:label ?country_label . FILTER(LANG(?country_label) = 'en')
  }
}
"""


# =============================================================================
# Query 4: Place of death (P20) with label + country
# =============================================================================
DEATH_PLACES_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (REPLACE(STR(?place), 'http://www.wikidata.org/entity/', '') AS ?place_qid)
  ?place_label
  ?country_label
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P20 ?place .
  OPTIONAL { ?place rdfs:label ?place_label . FILTER(LANG(?place_label) = 'en') }
  OPTIONAL {
    ?place wdt:P17 ?country .
    ?country rdfs:label ?country_label . FILTER(LANG(?country_label) = 'en')
  }
}
"""


# =============================================================================
# Query 5: Native-language name via P1559 (name in native language).
#
# P1559 is the canonical "name in native language" property on Wikidata.
# More reliable than guessing from P103 (native language) + fetching matching
# rdfs:label. Returns one row per sculptor that has this property set.
# =============================================================================
NATIVE_NAMES_TEMPLATE = """
PREFIX wd:  <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?native_name
  (LANG(?native_name) AS ?native_lang)
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P1559 ?native_name .
}
"""


# =============================================================================
# Runners
# =============================================================================
def run_sitelinks(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    return query_sparql_batched(
        query_template=SITELINKS_TEMPLATE,
        qids=qids,
        cache_path=SITELINKS_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_authority_ids(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    return query_sparql_batched(
        query_template=AUTHORITY_IDS_TEMPLATE,
        qids=qids,
        cache_path=AUTHORITY_IDS_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_birth_places(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    return query_sparql_batched(
        query_template=BIRTH_PLACES_TEMPLATE,
        qids=qids,
        cache_path=BIRTH_PLACES_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_death_places(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    return query_sparql_batched(
        query_template=DEATH_PLACES_TEMPLATE,
        qids=qids,
        cache_path=DEATH_PLACES_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_native_names(qids: list[str], refresh: bool = False) -> pd.DataFrame:
    return query_sparql_batched(
        query_template=NATIVE_NAMES_TEMPLATE,
        qids=qids,
        cache_path=NATIVE_NAMES_CACHE_PATH,
        refresh=refresh,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_all_enrichment(refresh: bool = False) -> dict[str, pd.DataFrame]:
    qids = pd.read_parquet(QID_CACHE_PATH)["qid"].tolist()
    print(f"Enriching {len(qids)} sculptors...\n")

    steps = [
        ("Sitelinks",      run_sitelinks),
        ("Authority IDs",  run_authority_ids),
        ("Birth places",   run_birth_places),
        ("Death places",   run_death_places),
        ("Native names",   run_native_names),
    ]
    out: dict[str, pd.DataFrame] = {}
    for label, fn in steps:
        print(f"== {label} ==")
        df = fn(qids, refresh=refresh)
        print(f"   {len(df)} rows cached\n")
        out[label] = df
    return out


if __name__ == "__main__":
    run_all_enrichment(refresh=True)
