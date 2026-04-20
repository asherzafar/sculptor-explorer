"""Smoke-test the enrichment queries on a tiny batch (20 QIDs) before
running at scale. Verifies each query shape works on Wikidata's endpoint
and returns sane output.
"""
from __future__ import annotations

import time
import pandas as pd

from config import QID_CACHE_PATH
from helpers import build_values_block, query_sparql
from query_enrichment import (
    SITELINKS_TEMPLATE,
    AUTHORITY_IDS_TEMPLATE,
    BIRTH_PLACES_TEMPLATE,
    DEATH_PLACES_TEMPLATE,
    NATIVE_NAMES_TEMPLATE,
)


# Use 20 well-known focus sculptors plus a Japanese sculptor to test
# non-English behavior.
TEST_QIDS = [
    "Q30755",    # Auguste Rodin
    "Q23349",    # Constantin Brâncuși
    "Q152480",   # Alberto Giacometti
    "Q234771",   # Camille Claudel
    "Q236497",   # Augusta Savage
    "Q156031",   # Isamu Noguchi
    "Q207264",   # Louise Bourgeois
    "Q194346",   # Anish Kapoor
    "Q463363",   # Alexander Archipenko
    "Q168381",   # Maya Lin
    "Q131356",   # Maillol
    "Q5593",     # Picasso
    "Q5589",     # Duchamp
    "Q160422",   # Calder
    "Q155234",   # Henry Moore
    "Q157004",   # Barbara Hepworth
    "Q156622",   # Richard Serra
    "Q156622",   # (dup for de-dup sanity)
    "Q155830",   # Donald Judd
    "Q156591",   # Jeff Koons
]
TEST_QIDS = list(dict.fromkeys(TEST_QIDS))


def test_query(name: str, template: str) -> bool:
    print(f"\n--- {name} ---")
    values = build_values_block(TEST_QIDS)
    query = template.replace("{{VALUES_BLOCK}}", values)
    t0 = time.time()
    try:
        df = query_sparql(query, cache_path=None, refresh=True, max_attempts=2)
        elapsed = round(time.time() - t0, 1)
        print(f"✓ {name}: {len(df)} rows in {elapsed}s")
        if len(df):
            print(f"  columns: {list(df.columns)}")
            print(f"  first row: {df.iloc[0].to_dict()}")
            # Show per-QID count
            if "qid_clean" in df.columns:
                per = df.groupby("qid_clean").size().describe()
                print(f"  rows per sculptor: min={per['min']:.0f} mean={per['mean']:.1f} max={per['max']:.0f}")
        return True
    except Exception as e:
        elapsed = round(time.time() - t0, 1)
        print(f"✗ {name} failed after {elapsed}s: {e}")
        return False


def main() -> int:
    tests = [
        ("Sitelinks",      SITELINKS_TEMPLATE),
        ("Authority IDs",  AUTHORITY_IDS_TEMPLATE),
        ("Birth places",   BIRTH_PLACES_TEMPLATE),
        ("Death places",   DEATH_PLACES_TEMPLATE),
        ("Native names",   NATIVE_NAMES_TEMPLATE),
    ]
    failures = 0
    for name, tmpl in tests:
        if not test_query(name, tmpl):
            failures += 1
    print(f"\n{'='*50}")
    print(f"Passed: {len(tests) - failures}/{len(tests)}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
