"""Phase 5b regression checks for the exported institutions bundle.

Run from repo root with:
    python3 pipeline/test_institutions.py
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "web" / "public" / "data" / "institutions.json"

KNOWN_HUBS = {
    "Q273593": ("Beaux-Arts de Paris", 200),
    "Q414052": ("Academy of Fine Arts, Munich", 50),
    "Q337480": ("Académie Julian", 30),
    "Q414219": ("Academy of Fine Arts Vienna", 30),
    "Q662355": ("Kunstakademie Düsseldorf", 30),
}


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def _load() -> dict[str, Any]:
    _assert(DATA_PATH.exists(), f"missing {DATA_PATH}")
    with DATA_PATH.open() as f:
        data = json.load(f)
    _assert(isinstance(data, dict), "institutions.json must contain an object")
    return data


def test_export_shape(data: dict[str, Any]) -> None:
    meta = data.get("meta")
    institutions = data.get("institutions")
    index = data.get("index")
    _assert(isinstance(meta, dict), "meta must be an object")
    _assert(isinstance(institutions, dict), "institutions must be an object")
    _assert(isinstance(index, list), "index must be a list")
    _assert(meta.get("minSculptors") == 3, "expected minSculptors=3")
    _assert(meta.get("exportedEdges", 0) >= 2500, "too few exported institutional edges")
    _assert(meta.get("renderedInstitutions", 0) >= 250, "too few renderable institutions")
    _assert(len(index) == len(institutions), "index and institutions size mismatch")


def test_known_hubs(data: dict[str, Any]) -> None:
    institutions = data["institutions"]
    for qid, (expected_label, min_count) in KNOWN_HUBS.items():
        inst = institutions.get(qid)
        _assert(inst is not None, f"missing known hub {qid} ({expected_label})")
        _assert(inst.get("render") is True, f"{expected_label} should render")
        count = inst.get("sculptorCount", 0)
        _assert(count >= min_count, f"{expected_label} count {count} < {min_count}")


def test_sculptor_edges_are_lists(data: dict[str, Any]) -> None:
    for qid, inst in data["institutions"].items():
        _assert(isinstance(inst.get("edges"), list), f"{qid} edges must be a list")
        _assert(isinstance(inst.get("sculptors"), list), f"{qid} sculptors must be a list")


def main() -> None:
    data = _load()
    test_export_shape(data)
    test_known_hubs(data)
    test_sculptor_edges_are_lists(data)
    meta = data["meta"]
    print(
        "institutions.json OK: "
        f"{meta['renderedInstitutions']} renderable hubs, "
        f"{meta['exportedEdges']} exported edges"
    )


if __name__ == "__main__":
    main()
