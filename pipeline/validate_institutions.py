"""Phase 5b validation — sanity-check the institutional ingest cache.

Reads the four parquet caches produced by `query_institutions.py`
and reports:
  - Row counts vs sculptor counts
  - P580/P582 qualifier coverage on P69 and P937
  - Institution metadata coverage (label, inception, dissolved)
  - Spot-checks on known hubs (ENSBA, Munich, Académie Julian, etc.)
  - Sculptor-count distribution at 1/2/3/5/10 thresholds — drives the
    5b "≥3 sculptors render as nodes" decision

Run: python -m validate_institutions
"""
from __future__ import annotations

import pandas as pd

from query_institutions import (
    EDUCATED_AT_CACHE_PATH,
    INSTITUTION_METADATA_CACHE_PATH,
    INSTITUTION_QIDS_CACHE_PATH,
    WORK_LOCATION_CACHE_PATH,
)


def _pct(n: int, d: int) -> str:
    return f"{100 * n / d:.1f}%" if d else "—"


def main() -> None:
    edu = pd.read_parquet(EDUCATED_AT_CACHE_PATH)
    work = pd.read_parquet(WORK_LOCATION_CACHE_PATH)
    meta = pd.read_parquet(INSTITUTION_METADATA_CACHE_PATH)
    qids = pd.read_parquet(INSTITUTION_QIDS_CACHE_PATH)

    print()
    print("=== P69 educated_at ===")
    print(
        f"  {len(edu)} statements · "
        f"{edu['qid_clean'].nunique()} sculptors · "
        f"{edu['inst_qid'].nunique()} institutions"
    )
    edu_with_quals = edu[edu["start_year"].notna() | edu["end_year"].notna()]
    print(
        f"  P580/P582 coverage: {len(edu_with_quals)}/{len(edu)} "
        f"({_pct(len(edu_with_quals), len(edu))})"
    )

    print()
    print("=== P937 work_location ===")
    print(
        f"  {len(work)} statements · "
        f"{work['qid_clean'].nunique()} sculptors · "
        f"{work['loc_qid'].nunique()} locations"
    )
    work_with_quals = work[work["start_year"].notna() | work["end_year"].notna()]
    print(
        f"  P580/P582 coverage: {len(work_with_quals)}/{len(work)} "
        f"({_pct(len(work_with_quals), len(work))})"
    )

    print()
    print("=== Institution metadata ===")
    total = meta["qid_clean"].nunique()
    got_label = meta[meta["label"].notna()]["qid_clean"].nunique()
    got_inc = meta[meta["inception_year"].notna()]["qid_clean"].nunique()
    got_diss = meta[meta["dissolved_year"].notna()]["qid_clean"].nunique()
    print(f"  {len(meta)} rows · {total} distinct institutions")
    print(f"  with label:      {got_label}/{total} ({_pct(got_label, total)})")
    print(f"  with inception:  {got_inc}/{total} ({_pct(got_inc, total)})")
    print(f"  with dissolved:  {got_diss}/{total} ({_pct(got_diss, total)})")
    lang_counts = meta["label_lang"].value_counts().head(5).to_dict()
    print(f"  label langs (top 5): {lang_counts}")

    print()
    print("=== Spot-checks: known hubs ===")
    spots = [
        ("Q273593", "ENSBA Paris", 1648),
        ("Q414052", "Munich Academy of Fine Arts", 1808),
        ("Q337480", "Académie Julian", 1867),
        ("Q414219", "Vienna Academy of Fine Arts", 1692),
        ("Q705737", "Art Students League NY", 1875),
        ("Q152099", "Bauhaus", 1919),
    ]
    for qid, name, expected_year in spots:
        rows = meta[meta["qid_clean"] == qid]
        if rows.empty:
            print(f"  {qid:9s}  {name:30s}  MISSING from metadata")
            continue
        en_rows = rows[rows["label_lang"] == "en"]
        label = en_rows["label"].iloc[0] if not en_rows.empty else rows["label"].dropna().iloc[0] if rows["label"].notna().any() else "(no label)"
        inc = (
            int(rows["inception_year"].dropna().iloc[0])
            if rows["inception_year"].notna().any()
            else None
        )
        diss = (
            int(rows["dissolved_year"].dropna().iloc[0])
            if rows["dissolved_year"].notna().any()
            else None
        )
        diss_str = str(diss) if diss is not None else "extant"
        flag = "" if inc == expected_year else f"  (expected ~{expected_year})"
        print(
            f"  {qid:9s}  {label:32s}  inc={inc}  diss={diss_str}{flag}"
        )

    print()
    print("=== ≥N-sculptor render thresholds ===")
    edu_counts = (
        edu.drop_duplicates(["qid_clean", "inst_qid"])
        .groupby("inst_qid")
        .size()
    )
    work_counts = (
        work.drop_duplicates(["qid_clean", "loc_qid"])
        .groupby("loc_qid")
        .size()
    )
    print(f"  Source: {len(edu_counts)} P69 institutions, {len(work_counts)} P937 locations")
    for thr in [1, 2, 3, 5, 10, 20]:
        n_edu = int((edu_counts >= thr).sum())
        n_work = int((work_counts >= thr).sum())
        print(f"  ≥{thr:2d} sculptors:   P69 {n_edu:5d}   P937 {n_work:5d}")

    print()
    print("=== Top 10 P69 institutions by sculptor count ===")
    label_lookup = (
        meta[meta["label_lang"] == "en"]
        .drop_duplicates("qid_clean")
        .set_index("qid_clean")["label"]
        .to_dict()
    )
    top = edu_counts.sort_values(ascending=False).head(10)
    for inst_qid, cnt in top.items():
        label = label_lookup.get(inst_qid, "(no en label)")
        print(f"  {cnt:4d}  {inst_qid:9s}  {label}")

    print()


if __name__ == "__main__":
    main()
