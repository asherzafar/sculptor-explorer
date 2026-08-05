"""Deterministic final-record writer for sculptor monoliths and shards.

This module is standard-library only so the contract can be tested in CI
without installing the full data-pipeline environment.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB_DATA_DIR = ROOT / "web" / "public" / "data"
SCULPTOR_SHARD_DIR = WEB_DATA_DIR / "sculptors"

# The monolith is the canonical full record. Detail shards must contain
# that exact record plus only these explicitly shard-local extensions.
# Keeping the exception list small makes a future shard-only field a
# deliberate contract change instead of an accidental divergence.
SHARD_ONLY_FIELDS = frozenset({"works"})


def write_final_sculptor_records(
    getty_by_qid: dict[str, dict],
    sculptors_json_path: Path = WEB_DATA_DIR / "sculptors.json",
    shard_dir: Path = SCULPTOR_SHARD_DIR,
) -> int:
    """Write one deterministic final record to the monolith and shards.

    The export stage writes base records and shard-only works first. This
    final stage validates that every shard still equals its monolith record,
    preserves only the declared shard-local fields, attaches one identical
    Getty block to both surfaces, and then writes all outputs. Validation is
    completed in memory before any file is changed.
    """
    sculptors = json.loads(Path(sculptors_json_path).read_text(encoding="utf-8"))
    if not isinstance(sculptors, list):
        raise ValueError("sculptors.json must contain a list")
    qids = [record.get("qid") for record in sculptors]
    if len(qids) != len(set(qids)):
        raise ValueError("sculptors.json contains duplicate QIDs")
    qid_set = set(qids)

    shard_paths = {path.stem: path for path in shard_dir.glob("*.json")}
    if set(shard_paths) != qid_set:
        missing = sorted(qid_set - set(shard_paths))
        extra = sorted(set(shard_paths) - qid_set)
        raise ValueError(
            f"Sculptor shard roster differs from monolith; missing={missing}, extra={extra}"
        )
    unexpected_getty = sorted(set(getty_by_qid) - qid_set)
    if unexpected_getty:
        raise ValueError(f"Getty blocks reference unpublished QIDs: {unexpected_getty}")

    final_sculptors: list[dict] = []
    final_shards: dict[str, dict] = {}
    for record in sculptors:
        qid = record["qid"]
        shard = json.loads(shard_paths[qid].read_text(encoding="utf-8"))
        if not isinstance(shard, dict):
            raise ValueError(f"{qid} shard must contain an object")

        shard_only = {
            key: shard[key] for key in SHARD_ONLY_FIELDS if key in shard
        }
        shard_base = {
            key: value for key, value in shard.items() if key not in SHARD_ONLY_FIELDS
        }
        if shard_base != record:
            differing = sorted(
                key
                for key in set(shard_base) | set(record)
                if shard_base.get(key) != record.get(key)
                or (key in shard_base) != (key in record)
            )
            raise ValueError(f"{qid} shard diverges from monolith: {differing}")

        final_record = dict(record)
        final_record.pop("gettyVerified", None)
        if qid in getty_by_qid:
            final_record["gettyVerified"] = getty_by_qid[qid]

        final_shard = dict(final_record)
        final_shard.update(shard_only)
        final_sculptors.append(final_record)
        final_shards[qid] = final_shard

    Path(sculptors_json_path).write_text(
        json.dumps(final_sculptors, indent=2), encoding="utf-8"
    )
    for qid, final_shard in final_shards.items():
        shard_paths[qid].write_text(
            json.dumps(final_shard, separators=(",", ":")),
            encoding="utf-8",
        )

    enriched = len(getty_by_qid)
    print(
        f"✓ Wrote {len(final_sculptors)} final sculptor records; "
        f"{enriched} carry identical Getty data in monolith and shards"
    )
    return enriched
