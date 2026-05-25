"""Phase 5b.2 audit — apply the temporal envelope to real ingested
P69/P937 data and report on:

  - Qualifier acceptance rate (vs flagged-conflict rate)
  - Distribution of envelope widths (how wide is the "possibly active"
    interval when there's no qualifier?)
  - Empty-intersection count (Wikidata data quality bugs)

Surfaces the per-edge confidence distribution that the plan calls for
on /transparency. Run after `query_institutions.py` lands a fresh
ingest.

    python -m audit_temporal
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from query_institutions import (
    EDUCATED_AT_CACHE_PATH,
    INSTITUTION_METADATA_CACHE_PATH,
    WORK_LOCATION_CACHE_PATH,
)
from temporal import (
    EDUCATED_AT_AGE_PRIOR,
    NodeEnvelope,
    compute_envelope,
)


def _parse_year(value) -> int | None:
    """Pull the year out of a Wikidata-style timestamp like
    '1952-11-13T00:00:00Z' or '-0040-00-00T00:00:00Z'. Returns None
    on null / unparseable. Negative years (BCE) are accepted but
    extremely unlikely in our 1800+ corpus."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    s = str(value).strip()
    if not s or s == "nan":
        return None
    # Handle leading minus for BCE.
    sign = 1
    if s.startswith("-"):
        sign = -1
        s = s[1:]
    head = s.split("-", 1)[0]
    try:
        return sign * int(head)
    except ValueError:
        return None


def _load_sculptor_lifespans() -> dict[str, NodeEnvelope]:
    """Pull birth/death years from the existing nodes_raw cache.

    Schema: qid_clean, name, birth (ISO timestamp str), death (ISO or null),
    gender. We read the parquet directly rather than running process.py."""
    from config import NODES_RAW_CACHE_PATH

    df = pd.read_parquet(NODES_RAW_CACHE_PATH)
    out: dict[str, NodeEnvelope] = {}
    for _, row in df.iterrows():
        qid = row.get("qid_clean")
        if not qid:
            continue
        birth_year = _parse_year(row.get("birth"))
        death_year = _parse_year(row.get("death"))
        if birth_year is None:
            continue
        try:
            out[qid] = NodeEnvelope(
                existed_from=birth_year, existed_to=death_year
            )
        except ValueError:
            # death < birth — Wikidata data quality bug. Skipped silently
            # here; the audit reports `missing_sculptor_env` for these.
            continue
    return out


def _load_institution_envelopes() -> dict[str, NodeEnvelope]:
    """Build a NodeEnvelope per institution QID from the metadata cache."""
    df = pd.read_parquet(INSTITUTION_METADATA_CACHE_PATH)
    # One institution may have multiple rows (en + mul label). De-dup to
    # the earliest inception year (founding-date disagreement) and the
    # latest dissolved year (in case of contradictory records).
    out: dict[str, NodeEnvelope] = {}
    for qid, group in df.groupby("qid_clean"):
        inceptions = group["inception_year"].dropna()
        dissolveds = group["dissolved_year"].dropna()
        if inceptions.empty:
            continue  # no inception → can't anchor the envelope
        try:
            inc = int(inceptions.min())
            diss = int(dissolveds.max()) if not dissolveds.empty else None
            out[qid] = NodeEnvelope(existed_from=inc, existed_to=diss)
        except ValueError:
            continue
    return out


def audit_edges(
    edges_df: pd.DataFrame,
    inst_qid_col: str,
    sculptor_envs: dict[str, NodeEnvelope],
    inst_envs: dict[str, NodeEnvelope],
    label: str,
    *,
    apply_age_prior: bool = False,
) -> None:
    """Run compute_envelope over every row and print summary stats.

    Without `apply_age_prior`, edges land as either qualifier-backed
    (high) or lifespan-only (medium). With the prior, we expect a
    chunk to drop to (low) confidence with narrower windows.
    """
    counts = {
        "qualifier": 0,
        "lifespan_intersect": 0,
        "lifespan_intersect+age_prior": 0,
        "empty_intersection": 0,
        "missing_sculptor_env": 0,
        "missing_institution_env": 0,
    }
    width_samples = {"qualifier": [], "lifespan": []}
    a_age_min, a_age_max = (
        EDUCATED_AT_AGE_PRIOR if apply_age_prior else (None, None)
    )
    for _, row in edges_df.iterrows():
        sculptor_qid = row["qid_clean"]
        inst_qid = row[inst_qid_col]
        s_env = sculptor_envs.get(sculptor_qid)
        i_env = inst_envs.get(inst_qid)
        if s_env is None:
            counts["missing_sculptor_env"] += 1
            continue
        if i_env is None:
            counts["missing_institution_env"] += 1
            continue
        q_start = row.get("start_year")
        q_end = row.get("end_year")
        q_start = int(q_start) if pd.notna(q_start) else None
        q_end = int(q_end) if pd.notna(q_end) else None
        env = compute_envelope(
            s_env,
            i_env,
            qualifier_start=q_start,
            qualifier_end=q_end,
            a_age_min=a_age_min,
            a_age_max=a_age_max,
        )
        if env is None:
            counts["empty_intersection"] += 1
            continue
        counts[env.date_source] += 1
        width = env.max_end - env.min_start
        if env.date_source == "qualifier":
            width_samples["qualifier"].append(width)
        else:
            width_samples["lifespan"].append(width)

    total = sum(counts.values())
    print(f"\n=== {label} ===")
    if apply_age_prior:
        print("    (with educated_at age prior 16-30 applied)")
    print(f"  Total edges: {total}")
    for k, v in counts.items():
        if v:
            print(f"    {k:38s}  {v:5d}  ({100*v/total:.1f}%)")
    for src, widths in width_samples.items():
        if widths:
            ws = pd.Series(widths)
            print(
                f"  Width [{src:9s}]  n={len(ws)}  "
                f"min={ws.min():3d}  median={int(ws.median()):3d}  "
                f"mean={ws.mean():.1f}  max={ws.max():3d}"
            )


def main() -> None:
    print("Loading sculptor lifespans...")
    sculptor_envs = _load_sculptor_lifespans()
    print(f"  {len(sculptor_envs)} sculptors with parseable birth (and possibly death)")

    print("Loading institution envelopes...")
    inst_envs = _load_institution_envelopes()
    print(f"  {len(inst_envs)} institutions with inception year")

    print("Loading P69 / P937 edges...")
    edu_df = pd.read_parquet(EDUCATED_AT_CACHE_PATH)
    work_df = pd.read_parquet(WORK_LOCATION_CACHE_PATH)

    audit_edges(
        edu_df,
        "inst_qid",
        sculptor_envs,
        inst_envs,
        "P69 educated_at (no prior)",
    )
    audit_edges(
        edu_df,
        "inst_qid",
        sculptor_envs,
        inst_envs,
        "P69 educated_at (WITH age prior)",
        apply_age_prior=True,
    )
    audit_edges(
        work_df,
        "loc_qid",
        sculptor_envs,
        inst_envs,
        "P937 work_location (no prior)",
    )

    print()


if __name__ == "__main__":
    main()
