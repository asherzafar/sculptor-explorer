"""Apply evidence-backed person exclusions to the committed static export.

The canonical pipeline applies overrides before enrichment. This bounded
backfill exists for repositories that commit web JSON but do not commit the
large parquet caches needed for a full export. It refuses records that touch
lineage or institution edges because those require a complete cached rebuild.
"""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "public" / "data"
OVERRIDES = ROOT / "overrides" / "person_exclusions.csv"
MAX_SCULPTORS_PER_FLOW = 12


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload, *, compact: bool = False) -> None:
    with path.open("w", encoding="utf-8") as handle:
        if compact:
            json.dump(payload, handle, separators=(",", ":"))
        else:
            json.dump(payload, handle, indent=2)
            handle.write("\n")


def load_exclusions() -> list[dict[str, str]]:
    with OVERRIDES.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows or any(not row.get("qid") for row in rows):
        raise ValueError(f"{OVERRIDES} must contain at least one non-empty qid")
    return rows


def decrement_tidy(path: Path, record: dict, field: str) -> None:
    rows = read_json(path)
    decade = record["birthDecade"]
    value = record.get(field) or "Unknown"
    candidates = [
        row for row in rows
        if row.get("decade") == decade and row.get("category") == value
    ]
    if not candidates:
        candidates = [
            row for row in rows
            if row.get("decade") == decade and row.get("category") == "Other"
        ]
    if len(candidates) != 1 or candidates[0]["count"] < 1:
        raise ValueError(f"Cannot safely decrement {path.name}: {decade=} {value=}")
    candidates[0]["count"] -= 1
    rows = [row for row in rows if row.get("count") != 0]
    write_json(path, rows)


def build_flows(records: list[dict]) -> list[dict]:
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for record in records:
        groups[(record["birthCountry"], record["deathCountry"])].append(record)

    flows = []
    for (origin, destination), group in groups.items():
        group.sort(key=lambda row: row["name"])
        flows.append({
            "from": origin,
            "to": destination,
            "count": len(group),
            "sameCountry": origin == destination,
            "sculptors": [
                {"qid": row["qid"], "name": row["name"]}
                for row in group[:MAX_SCULPTORS_PER_FLOW]
            ],
        })
    return sorted(flows, key=lambda row: (-row["count"], row["from"], row["to"]))


def rebuild_migration(sculptors: list[dict]) -> dict:
    living = [row for row in sculptors if row.get("alive")]
    nonliving = [row for row in sculptors if not row.get("alive")]
    missing_birth = [row for row in nonliving if not row.get("birthCountry")]
    missing_death = [
        row for row in nonliving
        if row.get("birthCountry") and not row.get("deathCountry")
    ]
    eligible = [
        row for row in nonliving
        if row.get("birthCountry") and row.get("deathCountry")
    ]
    flows = build_flows(eligible)
    by_decade: dict[str, list[dict]] = {}
    decades = sorted({row["birthDecade"] for row in eligible if row.get("birthDecade") is not None})
    for decade in decades:
        by_decade[str(decade)] = build_flows(
            [row for row in eligible if row.get("birthDecade") == decade]
        )
    crossed = [row for row in eligible if row["birthCountry"] != row["deathCountry"]]
    same = [row for row in eligible if row["birthCountry"] == row["deathCountry"]]
    return {
        "meta": {
            "totalIncluded": len(sculptors),
            "eligible": len(eligible),
            "withBothCountries": len(eligible),
            "crossedBorders": len(crossed),
            "sameCountry": len(same),
            "missingBirthCountry": len(missing_birth),
            "missingDeathCountry": len(missing_death),
            "livingExcluded": len(living),
            "topFlows": [row for row in flows if not row["sameCountry"]][:10],
        },
        "flows": flows,
        "flowsByBirthDecade": by_decade,
    }


def ordered_top(counter: Counter, old_rows: list[dict], key: str, limit: int) -> list[dict]:
    old_rank = {row[key]: index for index, row in enumerate(old_rows)}
    values = sorted(
        counter,
        key=lambda value: (-counter[value], old_rank.get(value, limit + 1), str(value)),
    )[:limit]
    return [{key: value, "count": counter[value]} for value in values]


def rebuild_affected_decades(
    decades: dict,
    sculptors: list[dict],
    migration: dict,
    affected: set[int],
) -> dict:
    for decade in affected:
        key = str(decade)
        old = decades[key]
        group = [row for row in sculptors if row.get("birthDecade") == decade]
        genders = Counter((row.get("gender") or "").lower() for row in group)
        countries = Counter(row["birthCountry"] for row in group if row.get("birthCountry"))
        movements = Counter(
            row["movement"] for row in group
            if row.get("movement") and row["movement"] != "No movement listed"
        )
        notable = sorted(group, key=lambda row: (-row.get("totalDegree", 0), row["name"]))[:36]
        decade_flows = migration["flowsByBirthDecade"].get(key, [])
        cross_flows = [row for row in decade_flows if not row["sameCountry"]]
        eligible = sum(row["count"] for row in decade_flows)
        crossed = sum(row["count"] for row in cross_flows)
        decades[key] = {
            "decade": decade,
            "totalBorn": len(group),
            "gender": {
                "female": genders["female"],
                "male": genders["male"],
                "otherOrUnknown": len(group) - genders["female"] - genders["male"],
            },
            "topCountries": ordered_top(countries, old["topCountries"], "country", 8),
            "topMovements": ordered_top(movements, old["topMovements"], "movement", 6),
            "topCorridors": [
                {"from": row["from"], "to": row["to"], "count": row["count"]}
                for row in cross_flows[:5]
            ],
            "migration": {
                "eligible": eligible,
                "crossed": crossed,
                "crossPct": round(crossed / eligible * 100) if eligible else None,
            },
            "notable": [
                {
                    "qid": row["qid"],
                    "name": row["name"],
                    "birthYear": row.get("birthYear"),
                    "deathYear": row.get("deathYear"),
                    "movement": row.get("movement"),
                    "citizenship": row.get("citizenship"),
                    "totalDegree": row.get("totalDegree", 0),
                }
                for row in notable
            ],
        }
    return decades


def present(value) -> bool:
    return value is not None and value != "" and value != []


def rebuild_transparency(old: dict, sculptors: list[dict], exclusions: list[dict]) -> dict:
    old["totalCached"] -= old["included"] - len(sculptors)
    old["included"] = len(sculptors)
    old["excluded"] = old["totalCached"] - old["included"]
    old["inclusionPctOfCache"] = round(100 * old["included"] / old["totalCached"], 1)
    old["sourceCandidates"] = old["totalCached"] + len(exclusions)
    old["eligibleCandidates"] = old["totalCached"]

    signals = Counter(signal for row in sculptors for signal in row.get("inclusionSignals", []))
    old["signalCoverage"] = dict(signals)

    genders = Counter(row.get("gender") or "Unknown" for row in sculptors)
    citizenships = Counter(row.get("citizenship") for row in sculptors if row.get("citizenship"))
    birth_decades = Counter(row.get("birthDecade") for row in sculptors if row.get("birthDecade") is not None)
    old_breakdown = old["includedBreakdown"]
    old["includedBreakdown"] = {
        "total": len(sculptors),
        "gender": dict(genders),
        "topCitizenships": {
            row["country"]: row["count"]
            for row in ordered_top(
                citizenships,
                [{"country": key} for key in old_breakdown["topCitizenships"]],
                "country",
                20,
            )
        },
        "byBirthDecade": {
            str(decade): birth_decades[decade] for decade in sorted(birth_decades)
        },
    }

    field_map = {
        "birth_place": "birthPlace",
        "death_place": "deathPlace",
        "native_name": "nativeName",
        "image": "image",
        "authority_links": "authorityLinks",
        "movement_display": "movement",
        "citizenship_display": "citizenship",
    }
    coverage = {"total": len(sculptors)}
    for export_key, record_key in field_map.items():
        count = sum(
            1 for row in sculptors
            if present(row.get(record_key))
            and not (record_key == "movement" and row.get(record_key) == "No movement listed")
            and not (record_key == "citizenship" and row.get(record_key) == "Unknown")
        )
        coverage[export_key] = {
            "present": count,
            "pct": round(100 * count / len(sculptors), 1) if sculptors else 0.0,
        }
    old["fieldCoverage"] = coverage
    old["personExclusions"] = {
        "count": len(exclusions),
        "records": [
            {
                "qid": row["qid"],
                "name": row.get("name", ""),
                "reason": row.get("reason", ""),
                "sourceUrl": row.get("source_url", ""),
                "sourceCheckedAt": row.get("source_checked_at", ""),
            }
            for row in exclusions
        ],
    }
    with (ROOT / "overrides" / "data_release.json").open(encoding="utf-8") as handle:
        old["release"] = json.load(handle)
    return old


def main() -> None:
    exclusions = load_exclusions()
    excluded_qids = {row["qid"] for row in exclusions}
    sculptors_path = DATA / "sculptors.json"
    original = read_json(sculptors_path)
    removed = [row for row in original if row["qid"] in excluded_qids]
    if not removed:
        transparency = read_json(DATA / "transparency.json")
        recorded = {
            row["qid"] for row in transparency.get("personExclusions", {}).get("records", [])
        }
        if recorded != excluded_qids:
            raise ValueError(
                "Excluded QIDs are absent but transparency provenance does not match"
            )
        transparency["sourceCandidates"] = (
            transparency["totalCached"] + len(exclusions)
        )
        transparency["eligibleCandidates"] = transparency["totalCached"]
        with (ROOT / "overrides" / "data_release.json").open(
            encoding="utf-8"
        ) as handle:
            transparency["release"] = json.load(handle)
        # Normalize JSON encoding to the canonical pipeline writer. This also
        # makes a second invocation genuinely idempotent after older versions
        # of this backfill wrote literal non-ASCII characters.
        for filename in (
            "sculptors.json",
            "migration.json",
            "decades.json",
            "movements_by_decade.json",
            "geography_by_decade.json",
            "geography_by_birth_country.json",
        ):
            path = DATA / filename
            write_json(path, read_json(path))
        write_json(DATA / "transparency.json", transparency)
        write_json(
            DATA / "sculptors_index.json",
            read_json(DATA / "sculptors_index.json"),
            compact=True,
        )
        write_json(
            DATA / "institutions.json",
            read_json(DATA / "institutions.json"),
            compact=True,
        )
        print("Person exclusions already applied; refreshed generated release metadata.")
        return

    if {row["qid"] for row in removed} != excluded_qids:
        missing = excluded_qids - {row["qid"] for row in removed}
        raise ValueError(f"Excluded QIDs absent from static export: {sorted(missing)}")

    edges = read_json(DATA / "edges.json")
    if any(edge.get("fromQid") in excluded_qids or edge.get("toQid") in excluded_qids for edge in edges):
        raise ValueError("Backfill refuses exclusions connected to lineage edges; run the full export")
    if any(row.get("institutions") or row.get("institutionalEdges") for row in removed):
        raise ValueError("Backfill refuses exclusions connected to institutions; run the full export")

    sculptors = [row for row in original if row["qid"] not in excluded_qids]
    write_json(sculptors_path, sculptors)
    index = [
        {
            "qid": row["qid"],
            "name": row["name"],
            "nativeName": row.get("nativeName"),
            "nativeLang": row.get("nativeLang"),
            "birthYear": row.get("birthYear"),
            "deathYear": row.get("deathYear"),
            "birthDecade": row.get("birthDecade"),
            "movement": row.get("movement"),
            "gender": row.get("gender"),
            "citizenship": row.get("citizenship"),
        }
        for row in sculptors
    ]
    write_json(DATA / "sculptors_index.json", index, compact=True)
    for qid in excluded_qids:
        shard = DATA / "sculptors" / f"{qid}.json"
        if shard.exists():
            shard.unlink()

    for record in removed:
        decrement_tidy(DATA / "movements_by_decade.json", record, "movement")
        decrement_tidy(DATA / "geography_by_decade.json", record, "citizenship")
        decrement_tidy(DATA / "geography_by_birth_country.json", record, "birthCountry")

    migration = rebuild_migration(sculptors)
    write_json(DATA / "migration.json", migration)
    decades = read_json(DATA / "decades.json")
    affected_decades = {row["birthDecade"] for row in removed}
    write_json(
        DATA / "decades.json",
        rebuild_affected_decades(decades, sculptors, migration, affected_decades),
    )

    for filename in ("focus_sculptors.json", "timeline_sculptors.json"):
        path = DATA / filename
        rows = read_json(path)
        filtered = [row for row in rows if row.get("qid") not in excluded_qids]
        if filtered != rows:
            write_json(path, filtered)

    institutions_path = DATA / "institutions.json"
    institutions = read_json(institutions_path)
    institutions["meta"]["includedSculptors"] = len(sculptors)
    institutions["meta"]["sculptorCoveragePct"] = round(
        100 * institutions["meta"]["sculptorsWithInstitutions"] / len(sculptors), 1
    )
    institutions["meta"]["educationCoveragePct"] = round(
        100 * institutions["meta"]["sculptorsWithEducation"] / len(sculptors), 1
    )
    write_json(institutions_path, institutions, compact=True)

    transparency_path = DATA / "transparency.json"
    transparency = rebuild_transparency(
        read_json(transparency_path), sculptors, exclusions
    )
    transparency["relationshipCoverage"]["institutions"] = institutions["meta"]
    write_json(transparency_path, transparency)

    print(
        f"Applied {len(removed)} person exclusion(s); "
        f"published roster is now {len(sculptors)} records."
    )


if __name__ == "__main__":
    main()
