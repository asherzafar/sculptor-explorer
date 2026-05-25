"""Phase 5 follow-up probe — does P69 (educated_at) concentrate into hubs?

The previous probe showed 34.8% coverage and 153 distinct institutions
in a 500-QID sample. The densification thesis only holds if those
institutions concentrate (Académie Julian, Bauhaus, ASL as
high-degree hubs) rather than spreading thinly. This probe pulls the
top institutions by sculptor count and prints labels so we can
eyeball the distribution.

We run against the FULL 6,711 QID cache here (not a sample), batched
through the existing query helper, because the institution counts
need to be exact for sizing decisions.
"""
from __future__ import annotations

import time
import requests
import pandas as pd
from pathlib import Path
from collections import Counter

ENDPOINT = "https://query.wikidata.org/sparql"
HEADERS = {
    "User-Agent": "sculptor-explorer/0.1 (densification-probe; ash@asherzafar.com)",
    "Accept": "application/sparql-results+json",
}

QID_CACHE = Path(__file__).parent.parent / "data" / "raw" / "sculptor_qids_1800plus.parquet"
BATCH = 200


def values_block(qids: list[str]) -> str:
    return "VALUES ?qid { " + " ".join(f"wd:{q}" for q in qids) + " }"


def fetch_p69(qids: list[str]) -> list[tuple[str, str, str]]:
    """Returns [(sculptor_qid, institution_qid, institution_label)]."""
    rows: list[tuple[str, str, str]] = []
    for i in range(0, len(qids), BATCH):
        batch = qids[i : i + BATCH]
        q = f"""
        SELECT ?qid ?inst ?instLabel WHERE {{
          {values_block(batch)}
          ?qid wdt:P69 ?inst .
          OPTIONAL {{ ?inst rdfs:label ?instLabel . FILTER(LANG(?instLabel) IN ('en','mul')) }}
        }}
        """
        for attempt in range(3):
            r = requests.get(ENDPOINT, params={"query": q}, headers=HEADERS, timeout=120)
            if r.status_code == 200:
                break
            if r.status_code in (429, 503):
                time.sleep(2 ** attempt)
                continue
            r.raise_for_status()
        else:
            raise RuntimeError(f"batch {i} retries exhausted")

        for row in r.json()["results"]["bindings"]:
            sc = row["qid"]["value"].rsplit("/", 1)[-1]
            inst = row["inst"]["value"].rsplit("/", 1)[-1]
            label = row.get("instLabel", {}).get("value", "")
            rows.append((sc, inst, label))
        print(f"  batch {i // BATCH + 1}/{(len(qids) + BATCH - 1) // BATCH} → {len(rows)} edges so far")
        time.sleep(0.5)
    return rows


def main() -> None:
    qids = pd.read_parquet(QID_CACHE)["qid"].tolist()
    print(f"Querying P69 for {len(qids)} sculptors in batches of {BATCH}...\n")
    edges = fetch_p69(qids)
    print(f"\nTotal raw edges: {len(edges)}")

    sculptor_inst = {(e[0], e[1]) for e in edges}
    print(f"Distinct (sculptor, institution) pairs: {len(sculptor_inst)}")

    sculptors_with = {e[0] for e in edges}
    print(f"Sculptors with ≥1 P69: {len(sculptors_with)} ({100*len(sculptors_with)/len(qids):.1f}% of cache)")

    inst_counts = Counter(e[1] for e in sculptor_inst)
    inst_labels = {}
    for sc, inst, label in edges:
        if label:
            inst_labels[inst] = label

    print(f"Distinct institutions: {len(inst_counts)}")
    print(f"\nDistribution of sculptors-per-institution:")
    sizes = pd.Series(inst_counts.values())
    print(f"  mean: {sizes.mean():.1f}, median: {sizes.median():.0f}, max: {sizes.max()}")
    for q in [0.50, 0.75, 0.90, 0.95, 0.99]:
        print(f"  p{int(q*100)}: {sizes.quantile(q):.0f}")
    bins = [(1, 1), (2, 4), (5, 9), (10, 24), (25, 49), (50, 99), (100, 99999)]
    for lo, hi in bins:
        n = ((sizes >= lo) & (sizes <= hi)).sum()
        print(f"  {lo:>3}-{hi:<5} sculptors: {n:>4} institutions")

    print("\nTop 30 institutions by sculptor count:")
    for inst_qid, count in inst_counts.most_common(30):
        label = inst_labels.get(inst_qid, "(no label)")
        print(f"  {count:>4}  {inst_qid:<12}  {label}")

    out_path = Path(__file__).parent.parent / "data" / "raw" / "probe_p69_edges.parquet"
    pd.DataFrame(edges, columns=["sculptor_qid", "inst_qid", "inst_label"]).to_parquet(out_path)
    print(f"\nWrote raw edges to {out_path}")


if __name__ == "__main__":
    main()
