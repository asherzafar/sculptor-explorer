"""Focused regression tests for the Getty final-record writer."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from sculptor_records import write_final_sculptor_records


def write_json(path: Path, value: object, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, separators=(",", ":") if compact else None),
        encoding="utf-8",
    )


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def test_final_writer_preserves_works_and_is_idempotent() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        monolith = root / "sculptors.json"
        shards = root / "sculptors"
        old_getty = {"ulanId": "old"}
        records = [
            {"qid": "Q1", "name": "One", "gettyVerified": old_getty},
            {"qid": "Q2", "name": "Two", "gettyVerified": old_getty},
        ]
        works = [{"source": "met", "objectId": "1"}]
        write_json(monolith, records)
        write_json(shards / "Q1.json", {**records[0], "works": works}, compact=True)
        write_json(shards / "Q2.json", records[1], compact=True)

        new_getty = {
            "ulanId": "500000001",
            "agreement": {"birthYear": "match"},
        }
        enriched = write_final_sculptor_records(
            {"Q1": new_getty}, monolith, shards
        )
        assert enriched == 1

        final_records = read_json(monolith)
        assert isinstance(final_records, list)
        assert final_records[0]["gettyVerified"] == new_getty
        assert "gettyVerified" not in final_records[1]
        q1_shard = read_json(shards / "Q1.json")
        q2_shard = read_json(shards / "Q2.json")
        assert q1_shard["gettyVerified"] == new_getty
        assert q1_shard["works"] == works
        assert q2_shard == final_records[1]

        first_bytes = {
            path: path.read_bytes()
            for path in (monolith, shards / "Q1.json", shards / "Q2.json")
        }
        write_final_sculptor_records({"Q1": new_getty}, monolith, shards)
        assert all(path.read_bytes() == content for path, content in first_bytes.items())


def test_divergence_fails_before_any_write() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        monolith = root / "sculptors.json"
        shards = root / "sculptors"
        write_json(monolith, [{"qid": "Q1", "name": "Canonical"}])
        write_json(shards / "Q1.json", {"qid": "Q1", "name": "Divergent"})
        before = monolith.read_bytes()

        try:
            write_final_sculptor_records({"Q1": {"ulanId": "500000001"}}, monolith, shards)
        except ValueError as error:
            assert "Q1 shard diverges from monolith" in str(error)
        else:
            raise AssertionError("divergent shard unexpectedly passed")
        assert monolith.read_bytes() == before


def test_missing_shard_fails_before_any_write() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        monolith = root / "sculptors.json"
        shards = root / "sculptors"
        shards.mkdir()
        write_json(monolith, [{"qid": "Q1", "name": "One"}])
        before = monolith.read_bytes()

        try:
            write_final_sculptor_records({}, monolith, shards)
        except ValueError as error:
            assert "shard roster differs from monolith" in str(error)
        else:
            raise AssertionError("missing shard unexpectedly passed")
        assert monolith.read_bytes() == before


def main() -> None:
    test_final_writer_preserves_works_and_is_idempotent()
    test_divergence_fails_before_any_write()
    test_missing_shard_fails_before_any_write()
    print("Getty final-record contracts OK: parity, works preservation, idempotence")


if __name__ == "__main__":
    main()
