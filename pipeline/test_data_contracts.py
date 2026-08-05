"""Repository-wide invariants for the committed static data export.

This suite is intentionally standard-library only so it can run in a clean CI
job without installing the full data-pipeline environment.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "public" / "data"
QID = re.compile(r"^Q[1-9][0-9]*$")


def load(name: str) -> Any:
    path = DATA / name
    assert path.exists(), f"missing static export: {path}"
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def unique_qids(records: list[dict], label: str) -> set[str]:
    qids = [record.get("qid") for record in records]
    assert all(isinstance(qid, str) and QID.fullmatch(qid) for qid in qids), (
        f"{label} contains an invalid QID"
    )
    assert len(qids) == len(set(qids)), f"{label} contains duplicate QIDs"
    return set(qids)


def assert_lifespan(record: dict, label: str, *, enforce_scope: bool = False) -> None:
    birth = record.get("birthYear")
    death = record.get("deathYear")
    assert isinstance(birth, int) or birth is None, f"{label} has invalid birthYear"
    assert isinstance(death, int) or death is None, f"{label} has invalid deathYear"
    if enforce_scope:
        assert birth is not None and birth >= 1800, f"{label} falls outside public scope"
    if birth is not None and death is not None:
        assert birth <= death, f"{label} has impossible lifespan {birth}-{death}"


def assert_sculptor_roster() -> tuple[list[dict], set[str]]:
    sculptors = load("sculptors.json")
    index = load("sculptors_index.json")
    assert isinstance(sculptors, list) and len(sculptors) >= 3_000, "sculptor roster regressed"
    assert len(index) == len(sculptors), "full/index roster length mismatch"
    sculptor_qids = unique_qids(sculptors, "sculptors.json")
    assert unique_qids(index, "sculptors_index.json") == sculptor_qids, (
        "full/index QID sets differ"
    )

    by_qid = {record["qid"]: record for record in sculptors}
    for record in sculptors:
        qid = record["qid"]
        assert isinstance(record.get("name"), str) and record["name"].strip(), (
            f"{qid} has no display name"
        )
        assert_lifespan(record, qid, enforce_scope=True)
        assert record.get("birthDecade") == record["birthYear"] // 10 * 10, (
            f"{qid} birthDecade mismatch"
        )
        assert isinstance(record.get("inclusionSignals"), list) and record["inclusionSignals"], (
            f"{qid} has no inclusion signal"
        )

    for record in index:
        full = by_qid[record["qid"]]
        for key in ("name", "birthYear", "deathYear", "birthDecade", "movement", "gender", "citizenship"):
            assert record.get(key) == full.get(key), f"{record['qid']} index mismatch: {key}"

    shard_dir = DATA / "sculptors"
    shard_qids = {path.stem for path in shard_dir.glob("*.json")}
    assert shard_qids == sculptor_qids, "per-sculptor shards do not exactly match roster"
    for qid in sorted(sculptor_qids):
        shard = load(f"sculptors/{qid}.json")
        full = by_qid[qid]
        unexpected = set(shard) - set(full) - {"works"}
        assert not unexpected, f"{qid} has undeclared shard-only fields: {unexpected}"
        shard_base = {key: value for key, value in shard.items() if key != "works"}
        assert shard_base == full, f"{qid} shard diverges from monolith"
        if "works" in shard:
            assert isinstance(shard["works"], list) and shard["works"], (
                f"{qid} has an invalid shard-only works block"
            )

    return sculptors, sculptor_qids


def assert_getty_enrichment(sculptors: list[dict], sculptor_qids: set[str]) -> None:
    audit = load("getty_audit.json")
    by_qid = {record["qid"]: record for record in sculptors}
    getty_records = {
        record["qid"]: record["gettyVerified"]
        for record in sculptors
        if "gettyVerified" in record
    }
    compared = audit.get("aggregate", {}).get("compared")
    assert isinstance(compared, int) and compared > 0, "Getty audit is empty"
    assert len(getty_records) == compared, (
        "Getty audit count differs from published Getty enrichment"
    )

    for qid, getty in getty_records.items():
        assert isinstance(getty, dict), f"{qid} has an invalid gettyVerified block"
        authority = next(
            (
                row
                for row in by_qid[qid].get("authorityLinks", [])
                if row.get("type") == "ulan"
            ),
            None,
        )
        assert authority is not None, f"{qid} Getty data has no ULAN authority link"
        assert getty.get("ulanId") == authority.get("id"), f"{qid} Getty ID mismatch"
        assert getty.get("url") == authority.get("url"), f"{qid} Getty URL mismatch"
        assert isinstance(getty.get("nationalities"), list), (
            f"{qid} has invalid Getty nationalities"
        )
        agreement = getty.get("agreement")
        assert isinstance(agreement, dict) and set(agreement) == {
            "birthYear",
            "deathYear",
            "birthPlace",
            "deathPlace",
            "natJaccard",
        }, f"{qid} has an invalid Getty agreement contract"

    sample_qids = {
        row.get("qid")
        for rows in audit.get("samples", {}).values()
        for row in rows
    }
    assert sample_qids <= set(getty_records) <= sculptor_qids, (
        "Getty audit samples reference records without published Getty data"
    )


def assert_relationships(sculptor_qids: set[str]) -> None:
    external = load("external_mentors.json")
    external_qids = unique_qids(external, "external_mentors.json")
    assert not (external_qids & sculptor_qids), "external mentor appears in sculptor roster"
    for record in external:
        assert_lifespan(record, f"external mentor {record['qid']}")

    edges = load("edges.json")
    seen = set()
    for index, edge in enumerate(edges):
        key = (edge.get("fromQid"), edge.get("toQid"), edge.get("relationType"))
        assert key not in seen, f"duplicate lineage edge at index {index}: {key}"
        seen.add(key)
        assert edge.get("toQid") in sculptor_qids, f"edge {index} target is not published"
        assert edge.get("fromQid") in sculptor_qids | external_qids, (
            f"edge {index} source has no node record"
        )


def assert_institutions(sculptor_qids: set[str]) -> None:
    bundle = load("institutions.json")
    institutions = bundle.get("institutions")
    meta = bundle.get("meta")
    assert isinstance(institutions, dict) and isinstance(meta, dict), "invalid institution bundle"
    assert meta.get("includedSculptors") == len(sculptor_qids), (
        "institution denominator differs from published roster"
    )
    edge_count = 0
    for qid, institution in institutions.items():
        assert QID.fullmatch(qid) and institution.get("qid") == qid, f"bad institution key {qid}"
        edges = institution.get("edges", [])
        sculptors = institution.get("sculptors", [])
        assert institution.get("sculptorCount") == len(sculptors), (
            f"{qid} sculptor count mismatch"
        )
        assert all(row.get("qid") in sculptor_qids for row in sculptors), (
            f"{qid} lists an unpublished sculptor"
        )
        for edge in edges:
            assert edge.get("institutionQid") == qid, f"{qid} edge points elsewhere"
            assert edge.get("sculptorQid") in sculptor_qids, f"{qid} edge target unpublished"
        edge_count += len(edges)
    assert edge_count == meta.get("exportedEdges"), "institution edge total mismatch"


def assert_migration_and_decades(sculptors: list[dict], sculptor_qids: set[str]) -> None:
    migration = load("migration.json")
    meta = migration.get("meta", {})
    assert meta.get("totalIncluded") == len(sculptors), "migration denominator mismatch"
    partition = sum(
        meta.get(key, 0)
        for key in ("eligible", "missingBirthCountry", "missingDeathCountry", "livingExcluded")
    )
    assert partition == len(sculptors), "migration exclusion buckets do not partition roster"
    assert meta.get("eligible") == meta.get("crossedBorders") + meta.get("sameCountry"), (
        "migration eligible count does not partition by border crossing"
    )
    assert sum(flow["count"] for flow in migration.get("flows", [])) == meta.get("eligible"), (
        "migration flow counts do not sum to eligible"
    )
    flow_keys = [
        (-flow["count"], flow["from"], flow["to"])
        for flow in migration.get("flows", [])
    ]
    assert flow_keys == sorted(flow_keys), "migration flows are not deterministically sorted"
    for flow in migration.get("flows", []):
        assert flow["sameCountry"] == (flow["from"] == flow["to"]), "bad sameCountry flag"
        assert 0 < len(flow.get("sculptors", [])) <= min(12, flow["count"]), (
            "migration representative roster violates cap"
        )
        assert all(row.get("qid") in sculptor_qids for row in flow["sculptors"]), (
            "migration flow lists an unpublished sculptor"
        )

    decades = load("decades.json")
    assert sum(row.get("totalBorn", 0) for row in decades.values()) == len(sculptors), (
        "decade totals do not sum to roster"
    )
    for key, row in decades.items():
        assert str(row.get("decade")) == key, f"decade key mismatch: {key}"
        gender = row.get("gender", {})
        assert sum(gender.values()) == row.get("totalBorn"), f"{key} gender total mismatch"
        assert all(person.get("qid") in sculptor_qids for person in row.get("notable", [])), (
            f"{key} notable roster contains unpublished sculptor"
        )


def assert_movements(sculptors: list[dict], sculptor_qids: set[str]) -> None:
    bundle = load("movements.json")
    index = load("movements_index.json")
    assert index == bundle.get("index"), "movement route index differs from aggregate bundle"

    movements = bundle.get("movements")
    assert isinstance(movements, dict), "invalid movement bundle"
    assert len(index) == len(movements), "movement route/index count mismatch"

    slugs = [row.get("slug") for row in index]
    names = [row.get("name") for row in index]
    assert len(slugs) == len(set(slugs)), "movement index contains duplicate slugs"
    assert len(names) == len(set(names)), "movement index contains duplicate names"
    assert set(slugs) == set(movements), "movement index does not match generated routes"

    source_counts = Counter(
        row.get("movement")
        for row in sculptors
        if row.get("movement") and row.get("movement") != "No movement listed"
    )
    for row in index:
        slug = row["slug"]
        movement = movements[slug]
        assert movement.get("slug") == slug, f"movement slug mismatch: {slug}"
        assert movement.get("name") == row["name"], f"movement name mismatch: {slug}"
        assert movement.get("total") == row["total"], f"movement total mismatch: {slug}"
        assert row["total"] == source_counts[row["name"]], (
            f"movement source count mismatch: {slug}"
        )
        assert row["total"] >= 3, f"movement page below privacy/legibility threshold: {slug}"
        assert all(
            person.get("qid") in sculptor_qids
            for person in movement.get("notable", [])
        ), f"{slug} notable roster contains unpublished sculptor"


def assert_transparency(sculptors: list[dict], sculptor_qids: set[str]) -> None:
    transparency = load("transparency.json")
    datetime.fromisoformat(transparency["generatedAt"].replace("Z", "+00:00"))
    release = transparency.get("release", {})
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}\.\d+", release.get("artifactRelease", "")), (
        "invalid or missing artifact release"
    )
    for field in ("curationReviewedAt", "contractsReviewedAt"):
        datetime.fromisoformat(release[field])
    with (ROOT / "overrides" / "data_release.json").open(encoding="utf-8") as handle:
        assert release == json.load(handle), "published release metadata differs from override"

    assert transparency.get("included") == len(sculptors), "transparency included mismatch"
    assert transparency.get("eligibleCandidates") == transparency.get("totalCached"), (
        "eligible-candidate compatibility count mismatch"
    )
    assert transparency.get("totalCached") == transparency.get("included") + transparency.get("excluded"), (
        "transparency cache partition mismatch"
    )
    assert transparency.get("includedBreakdown", {}).get("total") == len(sculptors), (
        "transparency included breakdown mismatch"
    )
    assert transparency.get("fieldCoverage", {}).get("total") == len(sculptors), (
        "transparency field denominator mismatch"
    )

    expected_signals = Counter(
        signal for record in sculptors for signal in record.get("inclusionSignals", [])
    )
    assert transparency.get("signalCoverage") == dict(expected_signals), (
        "transparency signal coverage mismatch"
    )
    field_map = {
        "birth_place": "birthPlace",
        "death_place": "deathPlace",
        "native_name": "nativeName",
        "image": "image",
        "authority_links": "authorityLinks",
        "movement_display": "movement",
        "citizenship_display": "citizenship",
    }
    for export_key, record_key in field_map.items():
        count = sum(
            1 for record in sculptors
            if record.get(record_key) not in (None, "", [], "Unknown", "No movement listed")
        )
        assert transparency["fieldCoverage"][export_key]["present"] == count, (
            f"transparency field coverage mismatch: {export_key}"
        )

    with (ROOT / "overrides" / "person_exclusions.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        override_qids = {row["qid"] for row in csv.DictReader(handle)}
    published_exclusions = {
        row["qid"] for row in transparency.get("personExclusions", {}).get("records", [])
    }
    assert transparency.get("personExclusions", {}).get("count") == len(
        published_exclusions
    ), "person-exclusion count mismatch"
    assert transparency.get("sourceCandidates") == (
        transparency.get("eligibleCandidates") + len(published_exclusions)
    ), "source/eligible candidate accounting mismatch"
    assert published_exclusions == override_qids, "person-exclusion provenance mismatch"
    assert not (published_exclusions & sculptor_qids), "excluded person remains published"


def assert_secondary_rosters(sculptor_qids: set[str]) -> None:
    for filename in ("focus_sculptors.json", "timeline_sculptors.json"):
        records = load(filename)
        qids = [record.get("qid") for record in records if record.get("qid")]
        assert len(qids) == len(set(qids)), f"{filename} contains duplicate QIDs"
        assert set(qids) <= sculptor_qids, f"{filename} contains unpublished QIDs"


def main() -> None:
    sculptors, sculptor_qids = assert_sculptor_roster()
    assert_getty_enrichment(sculptors, sculptor_qids)
    assert_relationships(sculptor_qids)
    assert_institutions(sculptor_qids)
    assert_migration_and_decades(sculptors, sculptor_qids)
    assert_movements(sculptors, sculptor_qids)
    assert_transparency(sculptors, sculptor_qids)
    assert_secondary_rosters(sculptor_qids)
    print(
        "static data contracts OK: "
        f"{len(sculptors)} sculptors, exact index/shard parity, "
        "Getty enrichment parity, valid lifespans, movement routes, "
        "release metadata, and aggregate denominators"
    )


if __name__ == "__main__":
    main()
