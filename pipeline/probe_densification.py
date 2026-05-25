"""Phase 5 fast-fail probe — measure coverage of densification properties.

Before planning any new ingest, we need real numbers. Hits the live
Wikidata SPARQL endpoint with a 500-QID sample and counts how many
sculptors carry each candidate property.

Properties probed:
  - P69   educated at      (academies, ateliers — likely highest payoff)
  - P937  work location    (studios, foundries, artist colonies)
  - P361  part of          (artist groups, secessions, schools)
  - P39   position held    (NSS / NAD / Académie membership)
  - P108  employer         (rare for sculptors; sanity check)

We also separately probe whether P69 carries temporal qualifiers
(pq:P580 start_time / pq:P582 end_time), which determines whether
time-coded edges and animated lineage are feasible.

Output: prints a coverage table + uniqueness estimate for each
property so we can decide what to ingest in Phase 5b.
"""
from __future__ import annotations

import random
import time
import requests
import pandas as pd
from pathlib import Path

ENDPOINT = "https://query.wikidata.org/sparql"
HEADERS = {
    "User-Agent": "sculptor-explorer/0.1 (densification-probe; ash@asherzafar.com)",
    "Accept": "application/sparql-results+json",
}

QID_CACHE = Path(__file__).parent.parent / "data" / "raw" / "sculptor_qids_1800plus.parquet"

# Properties to probe. (P, label, optional qualifier we want to confirm)
PROBES: list[tuple[str, str, str | None]] = [
    ("P69",  "educated_at",   "P580"),  # check for start_time qualifier
    ("P937", "work_location", "P580"),
    ("P361", "part_of",        None),
    ("P39",  "position_held",  None),
    ("P108", "employer",       None),
]

# 500 QIDs is a usable estimator (±~4% at 95% CI for a 50% rate).
SAMPLE_SIZE = 500
random.seed(42)


def run_query(query: str) -> dict:
    """One SPARQL request with retry on 429/503."""
    for attempt in range(3):
        r = requests.get(ENDPOINT, params={"query": query}, headers=HEADERS, timeout=60)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (429, 503):
            time.sleep(2 ** attempt)
            continue
        r.raise_for_status()
    raise RuntimeError("SPARQL retries exhausted")


def values_block(qids: list[str]) -> str:
    return "VALUES ?qid { " + " ".join(f"wd:{q}" for q in qids) + " }"


def probe_property(prop: str, qids: list[str]) -> dict:
    """Return {present, total_values, distinct_values} on the QID sample."""
    q = f"""
    SELECT ?qid ?value WHERE {{
      {values_block(qids)}
      ?qid wdt:{prop} ?value .
    }}
    """
    data = run_query(q)
    rows = data["results"]["bindings"]
    qids_with = {r["qid"]["value"].rsplit("/", 1)[-1] for r in rows}
    distinct = {r["value"]["value"].rsplit("/", 1)[-1] for r in rows}
    return {
        "present": len(qids_with),
        "total_values": len(rows),
        "distinct_values": len(distinct),
        "avg_per_sculptor": len(rows) / max(len(qids_with), 1),
    }


def probe_qualifier(prop: str, qual: str, qids: list[str]) -> dict:
    """Count how often a qualifier (start/end time) is set on a property."""
    q = f"""
    SELECT ?qid ?stmt ?qval WHERE {{
      {values_block(qids)}
      ?qid p:{prop} ?stmt .
      ?stmt pq:{qual} ?qval .
    }}
    """
    data = run_query(q)
    rows = data["results"]["bindings"]
    qids_with = {r["qid"]["value"].rsplit("/", 1)[-1] for r in rows}
    return {"qualifier_rows": len(rows), "qids_with_qualifier": len(qids_with)}


def main() -> None:
    qids = pd.read_parquet(QID_CACHE)["qid"].tolist()
    print(f"Cache contains {len(qids)} QIDs. Sampling {SAMPLE_SIZE}.\n")
    sample = random.sample(qids, SAMPLE_SIZE)

    print(f"{'property':18s} {'coverage':>10s} {'pct':>6s} {'distinct':>10s} {'avg/sculptor':>14s}  qualifier")
    print("-" * 88)

    for prop, label, qual in PROBES:
        try:
            r = probe_property(prop, sample)
        except Exception as e:
            print(f"{prop:6s} {label:14s} ERROR: {e}")
            continue
        pct = 100 * r["present"] / SAMPLE_SIZE
        qual_note = ""
        if qual:
            try:
                q = probe_qualifier(prop, qual, sample)
                qpct = 100 * q["qids_with_qualifier"] / max(r["present"], 1)
                qual_note = f"{qual}={q['qids_with_qualifier']:>3} ({qpct:>4.1f}% of those with {prop})"
            except Exception as e:
                qual_note = f"{qual}=ERR"
        print(
            f"{prop} {label:13s} {r['present']:>4}/{SAMPLE_SIZE} {pct:>5.1f}% "
            f"{r['distinct_values']:>9} {r['avg_per_sculptor']:>14.2f}  {qual_note}"
        )
        time.sleep(1.0)  # politeness — we're hammering WDQS

    print("\nNotes:")
    print("- 'distinct' counts unique QIDs the property points at — proxies how")
    print("  many institutional/group nodes we'd add as graph nodes.")
    print("- A high 'avg/sculptor' on P69 means many academies per sculptor —")
    print("  good for graph density.")
    print("- 'qualifier' shows whether we can time-code edges.")


if __name__ == "__main__":
    main()
