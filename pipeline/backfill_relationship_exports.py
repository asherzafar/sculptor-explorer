"""Upgrade the committed static snapshot with Phase 5b.5 relationship data.

Use this when parquet caches are intentionally absent from a worktree:

    python3 pipeline/backfill_relationship_exports.py

The script does not fetch or reinterpret source records. It derives temporal
envelopes and compact audits from the already-published JSON snapshot using
the same helpers as the primary exporter, and it preserves ``generatedAt``
because the underlying source snapshot has not changed.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from relationship_audit import (
    build_person_envelopes,
    summarize_institutions,
    summarize_temporal_edges,
    temporalize_lineage_edges,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "web" / "public" / "data"


def _read(name: str) -> Any:
    with (DATA_DIR / name).open(encoding="utf-8") as handle:
        return json.load(handle)


def _write(name: str, value: Any, *, compact: bool = False) -> None:
    path = DATA_DIR / name
    if compact:
        payload = json.dumps(value, separators=(",", ":"))
    else:
        payload = json.dumps(value, indent=2)
    path.write_text(payload, encoding="utf-8")


def main() -> None:
    edges = _read("edges.json")
    sculptors = _read("sculptors_index.json")
    external_mentors = _read("external_mentors.json")
    institutions = _read("institutions.json")
    transparency = _read("transparency.json")

    envelopes, invalid_qids = build_person_envelopes([
        *sculptors,
        *external_mentors,
    ])
    temporal_edges = temporalize_lineage_edges(
        edges,
        envelopes,
        invalid_qids=invalid_qids,
    )
    lineage_summary = summarize_temporal_edges(temporal_edges)
    institution_summary = summarize_institutions(
        institutions,
        included_sculptors=len(sculptors),
    )

    institutions["meta"].update(institution_summary)
    transparency["relationshipCoverage"] = {
        "lineage": lineage_summary,
        "institutions": institution_summary,
    }

    _write("edges.json", temporal_edges)
    _write("institutions.json", institutions, compact=True)
    _write("transparency.json", transparency)

    print(
        "Phase 5b.5 snapshot backfill complete: "
        f"{lineage_summary['datedEdges']}/{lineage_summary['totalEdges']} "
        "lineage edges dated; "
        f"{institution_summary['sculptorsWithInstitutions']}/"
        f"{institution_summary['includedSculptors']} sculptors have "
        "institution links."
    )


if __name__ == "__main__":
    main()
