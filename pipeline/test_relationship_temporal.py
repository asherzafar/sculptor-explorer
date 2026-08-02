"""Phase 5b.5 regression checks for relationship temporal contracts.

Run from the repository root:

    python3 pipeline/test_relationship_temporal.py
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from relationship_audit import (
    TEMPORAL_FIELDS,
    build_person_envelopes,
    summarize_temporal_edges,
    temporalize_lineage_edges,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "web" / "public" / "data"
DATE_SOURCES = {
    "qualifier",
    "lifespan_intersect",
    "lifespan_intersect+age_prior",
}
CONFIDENCE_LEVELS = {"high", "medium", "low"}


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def _load(name: str) -> Any:
    path = DATA_DIR / name
    _assert(path.exists(), f"missing {path}")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _assert_temporal_contract(edge: dict[str, Any], label: str) -> None:
    for field in TEMPORAL_FIELDS:
        _assert(field in edge, f"{label} missing {field}")
    status = edge.get("temporalStatus", "dated")
    if status == "dated":
        for field in TEMPORAL_FIELDS[:4]:
            _assert(isinstance(edge[field], int), f"{label} {field} must be int")
        _assert(edge["dateSource"] in DATE_SOURCES, f"{label} bad dateSource")
        _assert(edge["confidence"] in CONFIDENCE_LEVELS, f"{label} bad confidence")
        _assert(edge.get("temporalReason") is None, f"{label} dated edge has reason")
    else:
        _assert(status == "unavailable", f"{label} bad temporalStatus")
        _assert(all(edge[field] is None for field in TEMPORAL_FIELDS), f"{label} null contract")
        _assert(bool(edge.get("temporalReason")), f"{label} unavailable without reason")


def test_student_age_prior_applies_to_student() -> None:
    envelopes, invalid = build_person_envelopes([
        {"qid": "Q_TEACHER", "birthYear": 1850, "deathYear": 1930},
        {"qid": "Q_STUDENT", "birthYear": 1880, "deathYear": 1950},
    ])
    result = temporalize_lineage_edges(
        [{
            "fromQid": "Q_TEACHER",
            "toQid": "Q_STUDENT",
            "relationType": "student_of",
        }],
        envelopes,
        invalid_qids=invalid,
        now_year=2026,
    )[0]
    _assert(result["minStart"] == 1896, "student prior must start at birth+16")
    _assert(result["maxEnd"] == 1910, "student prior must end at birth+30")
    _assert(result["confidence"] == "low", "student prior must be disclosed as low")


def main() -> None:
    test_student_age_prior_applies_to_student()
    edges = _load("edges.json")
    institutions = _load("institutions.json")
    transparency = _load("transparency.json")

    _assert(isinstance(edges, list) and len(edges) >= 1400, "lineage edge count regressed")
    for index, edge in enumerate(edges):
        _assert_temporal_contract(edge, f"lineage edge {index}")

    institution_edge_count = 0
    for qid, institution in institutions["institutions"].items():
        for index, edge in enumerate(institution.get("edges", [])):
            _assert_temporal_contract(edge, f"institution {qid} edge {index}")
            institution_edge_count += 1

    _assert(institution_edge_count == institutions["meta"]["exportedEdges"], "institution edge count/meta mismatch")

    coverage = transparency.get("relationshipCoverage")
    _assert(isinstance(coverage, dict), "transparency missing relationshipCoverage")
    _assert(coverage["lineage"] == summarize_temporal_edges(edges), "lineage transparency mismatch")

    institution_audit = coverage["institutions"]
    for key in (
        "includedSculptors",
        "totalInstitutions",
        "renderedInstitutions",
        "exportedEdges",
        "skippedEmptyIntersection",
        "sculptorsWithInstitutions",
        "confidenceCounts",
        "topEducationInstitutions",
        "topFiveEducationSharePct",
    ):
        _assert(institution_audit[key] == institutions["meta"][key], f"institution transparency mismatch: {key}")

    print(
        "relationship temporal exports OK: "
        f"{coverage['lineage']['datedEdges']}/{len(edges)} lineage edges dated, "
        f"{institution_edge_count} institution edges share the contract"
    )


if __name__ == "__main__":
    main()
