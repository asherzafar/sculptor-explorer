"""Export processed data to JSON files for the web app."""
import json
from pathlib import Path

import pandas as pd
from config import (
    NODES_METRICS_PATH,
    RELATIONS_CLEAN_PATH,
    MATERIALS_BY_DECADE_PATH,
    WEB_DATA_DIR,
    MIN_BIRTH_YEAR,
    FOCUS_SCULPTOR_NAMES,
)
from helpers import normalize_name


def load_data():
    """Load processed data."""
    nodes = pd.read_parquet(NODES_METRICS_PATH)
    relations = pd.read_parquet(RELATIONS_CLEAN_PATH)
    
    # Load materials if available
    if MATERIALS_BY_DECADE_PATH.exists():
        materials = pd.read_parquet(MATERIALS_BY_DECADE_PATH)
    else:
        materials = pd.DataFrame()
    
    return nodes, relations, materials


def _sculptor_record(row) -> dict:
    """Shared serialization for a single sculptor row.

    Emits the Option A.3 schema including enrichment fields. Null-safe for
    all optional properties (place fields, native name, authority IDs).
    """
    def _opt_str(v):
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
        except (TypeError, ValueError):
            pass
        s = str(v)
        return s if s else None

    def _list(v):
        if v is None:
            return []
        if isinstance(v, (list, tuple)):
            return list(v)
        try:
            import numpy as np
            if isinstance(v, np.ndarray):
                return list(v)
        except ImportError:
            pass
        return list(v)

    return {
        "qid": row["qid"],
        "name": row["name"],
        "birthYear": int(row["birth_year"]) if pd.notna(row["birth_year"]) else None,
        "deathYear": int(row["death_year"]) if pd.notna(row["death_year"]) else None,
        "alive": bool(row["alive"]),
        "gender": row["gender"],
        "movement": row["movement_display"],
        "citizenship": row["citizenship_display"],           # primary (most common)
        "citizenships": _list(row["citizenships"]),          # full list
        "birthDecade": int(row["birth_decade"]) if pd.notna(row["birth_decade"]) else None,
        "inDegree": int(row["in_degree"]),
        "outDegree": int(row["out_degree"]),
        "totalDegree": int(row["total_degree"]),
        # Phase 3a enrichment
        "birthPlace": _opt_str(row.get("birth_place")),
        "birthCountry": _opt_str(row.get("birth_country")),
        "deathPlace": _opt_str(row.get("death_place")),
        "deathCountry": _opt_str(row.get("death_country")),
        "nativeName": _opt_str(row.get("native_name")),
        "nativeLang": _opt_str(row.get("native_lang")),
        "authorityTypes": _list(row.get("authority_types")),
        "sitelinkCount": int(row.get("sitelink_count") or 0),
        "nonEnSitelinkCount": int(row.get("non_en_sitelink_count") or 0),
        "inclusionSignals": _list(row.get("inclusion_signals")),
    }


def create_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create sculptors.json using Option A.3 inclusion signals.

    A sculptor is included if any of: movement, edge, focus, multi_citz,
    sitelinks fire (see process.py :: compute_inclusion_signals). Authority
    IDs are stored in `authorityTypes` as metadata but do NOT gate inclusion.
    """
    included = nodes[nodes["is_included"]].copy()
    return [_sculptor_record(row) for _, row in included.iterrows()]


def create_edges_json(relations: pd.DataFrame) -> list[dict]:
    """Create edges.json with relationship edges."""
    if len(relations) == 0:
        return []
    
    records = []
    for _, row in relations.iterrows():
        records.append({
            "fromQid": row["from_qid"],
            "toQid": row["to_qid"],
            "fromName": row["source_label"],
            "toName": row["sculptor_label"],
            "relationType": row["relation_type"],
        })
    
    return records


def create_movements_by_decade_json(nodes: pd.DataFrame) -> list[dict]:
    """Create movements_by_decade.json in tidy format: {decade, category, count}."""
    nodes_with_movement = nodes[nodes["movement_display"] != "No movement listed"].copy()
    
    # Group by decade and movement — already tidy
    grouped = (
        nodes_with_movement.groupby(["birth_decade", "movement_display"])
        .size()
        .reset_index(name="count")
    )
    
    # Keep only the top 15 movements; bucket the rest as "Other"
    top_movements = (
        nodes_with_movement["movement_display"]
        .value_counts()
        .head(15)
        .index.tolist()
    )
    
    records = []
    for _, row in grouped.iterrows():
        category = row["movement_display"] if row["movement_display"] in top_movements else "Other"
        records.append({
            "decade": int(row["birth_decade"]),
            "category": category,
            "count": int(row["count"]),
        })
    
    # Re-aggregate after bucketing "Other"
    agg = pd.DataFrame(records).groupby(["decade", "category"])["count"].sum().reset_index()
    return agg.sort_values(["decade", "count"], ascending=[True, False]).to_dict(orient="records")


def create_geography_by_decade_json(nodes: pd.DataFrame) -> list[dict]:
    """Create geography_by_decade.json in tidy format: {decade, category, count}."""
    # Include Unknown as a category rather than dropping it
    grouped = (
        nodes.groupby(["birth_decade", "citizenship_display"])
        .size()
        .reset_index(name="count")
    )
    
    # Keep top 15 citizenships; bucket rest as "Other"
    top_citizenships = (
        nodes[nodes["citizenship_display"] != "Unknown"]["citizenship_display"]
        .value_counts()
        .head(15)
        .index.tolist()
    )
    keep = set(top_citizenships) | {"Unknown"}
    
    records = []
    for _, row in grouped.iterrows():
        category = row["citizenship_display"] if row["citizenship_display"] in keep else "Other"
        records.append({
            "decade": int(row["birth_decade"]),
            "category": category,
            "count": int(row["count"]),
        })
    
    # Re-aggregate after bucketing
    agg = pd.DataFrame(records).groupby(["decade", "category"])["count"].sum().reset_index()
    return agg.sort_values(["decade", "count"], ascending=[True, False]).to_dict(orient="records")


def create_timeline_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create timeline_sculptors.json from focus sculptor data (replaces hand-maintained file)."""
    focus_norm = set(normalize_name(n) for n in FOCUS_SCULPTOR_NAMES)
    focus_df = nodes[nodes["name_norm"].isin(focus_norm)].copy()
    focus_df = focus_df.sort_values("birth_year")

    records = []
    for _, row in focus_df.iterrows():
        rec = _sculptor_record(row)
        rec["id"] = rec.pop("qid")  # timeline uses 'id' not 'qid' for backward-compat
        rec["source"] = "pipeline"
        records.append(rec)
    return records


def create_focus_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create focus_sculptors.json with enriched focus list (same schema as sculptors.json)."""
    focus_norm = [normalize_name(n) for n in FOCUS_SCULPTOR_NAMES]
    focus_df = nodes[nodes["name_norm"].isin(focus_norm)].copy()
    focus_df = focus_df.sort_values("birth_year")
    return [_sculptor_record(row) for _, row in focus_df.iterrows()]


def create_transparency_json(nodes: pd.DataFrame) -> dict:
    """Build transparency / demographic-audit payload for the About page.

    Shows the honest base rate: total cached sculptors, A.3 inclusion counts,
    signal-level coverage, and demographic breakdown of included vs excluded
    sets. Committed to as a standing commitment per the ethics-scholar expert.
    """
    total = len(nodes)
    included_mask = nodes["is_included"].astype(bool)
    included = int(included_mask.sum())
    excluded = total - included

    # Signal coverage
    from collections import Counter
    sig_counter: Counter = Counter()
    for sigs in nodes["inclusion_signals"]:
        for s in sigs:
            sig_counter[s] += 1

    def breakdown(subset: pd.DataFrame) -> dict:
        n = len(subset)
        if n == 0:
            return {"total": 0}
        gender = subset["gender"].value_counts().to_dict()
        top_citz = subset["citizenship_display"].value_counts().head(20).to_dict()
        decade = subset["birth_decade"].value_counts().sort_index().to_dict()
        return {
            "total": n,
            "gender": {str(k): int(v) for k, v in gender.items()},
            "topCitizenships": {str(k): int(v) for k, v in top_citz.items()},
            "byBirthDecade": {int(k): int(v) for k, v in decade.items()},
        }

    return {
        "generatedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "totalCached": total,
        "included": included,
        "excluded": excluded,
        "inclusionPctOfCache": round(100 * included / total, 1),
        "signalCoverage": {k: int(v) for k, v in sig_counter.items()},
        "criterion": {
            "version": "A.3",
            "rule": "Include if ANY of: movement, edge, focus, multi_citz, "
                    "sitelinks (>=3 non-EN Wikipedia articles, bot-wikis excluded)",
            "authorityIdsAsGate": False,
            "sitelinkMinNonEnglish": 3,
            "botWikisExcluded": ["ceb", "war"],
        },
        "includedBreakdown": breakdown(nodes[included_mask]),
        "excludedBreakdown": breakdown(nodes[~included_mask]),
    }


def create_materials_by_decade_json(materials: pd.DataFrame) -> list[dict]:
    """Create materials_by_decade.json in tidy format: {decade, category, count}."""
    if len(materials) == 0:
        return []
    
    # Melt wide format to tidy if needed
    skip_cols = {"decade", "total"}
    value_cols = [c for c in materials.columns if c not in skip_cols]
    
    if "category" in materials.columns and "count" in materials.columns:
        # Already tidy
        return materials[["decade", "category", "count"]].to_dict(orient="records")
    
    # Wide → tidy
    records = []
    for _, row in materials.iterrows():
        for col in value_cols:
            count = int(row[col]) if pd.notna(row[col]) else 0
            if count > 0:
                records.append({
                    "decade": int(row["decade"]),
                    "category": col,
                    "count": count,
                })
    
    return sorted(records, key=lambda r: (r["decade"], -r["count"]))


def export_all():
    """Export all JSON files."""
    print("=" * 60)
    print("Exporting JSON files...")
    print("=" * 60)
    
    nodes, relations, materials = load_data()
    
    # Export sculptors.json
    sculptors = create_sculptors_json(nodes)
    sculptors_path = WEB_DATA_DIR / "sculptors.json"
    with open(sculptors_path, "w") as f:
        json.dump(sculptors, f, indent=2)
    print(f"✓ Exported {len(sculptors)} sculptors to {sculptors_path.name}")
    
    # Export edges.json
    edges = create_edges_json(relations)
    edges_path = WEB_DATA_DIR / "edges.json"
    with open(edges_path, "w") as f:
        json.dump(edges, f, indent=2)
    print(f"✓ Exported {len(edges)} edges to {edges_path.name}")
    
    # Export movements_by_decade.json
    movements = create_movements_by_decade_json(nodes)
    movements_path = WEB_DATA_DIR / "movements_by_decade.json"
    with open(movements_path, "w") as f:
        json.dump(movements, f, indent=2)
    print(f"✓ Exported movements by decade to {movements_path.name}")
    
    # Export geography_by_decade.json
    geography = create_geography_by_decade_json(nodes)
    geography_path = WEB_DATA_DIR / "geography_by_decade.json"
    with open(geography_path, "w") as f:
        json.dump(geography, f, indent=2)
    print(f"✓ Exported geography by decade to {geography_path.name}")
    
    # Export focus_sculptors.json
    focus = create_focus_sculptors_json(nodes)
    focus_path = WEB_DATA_DIR / "focus_sculptors.json"
    with open(focus_path, "w") as f:
        json.dump(focus, f, indent=2)
    print(f"✓ Exported {len(focus)} focus sculptors to {focus_path.name}")
    
    # Export timeline_sculptors.json (replaces hand-maintained file)
    timeline = create_timeline_sculptors_json(nodes)
    timeline_path = WEB_DATA_DIR / "timeline_sculptors.json"
    with open(timeline_path, "w") as f:
        json.dump(timeline, f, indent=2)
    print(f"✓ Exported {len(timeline)} timeline sculptors to {timeline_path.name}")
    
    # Export materials_by_decade.json
    materials_export = create_materials_by_decade_json(materials)
    materials_path = WEB_DATA_DIR / "materials_by_decade.json"
    with open(materials_path, "w") as f:
        json.dump(materials_export, f, indent=2)
    print(f"✓ Exported materials by decade to {materials_path.name} ({len(materials_export)} decades)")

    # Export transparency.json (Option A.3 demographic audit, standing commitment)
    transparency = create_transparency_json(nodes)
    transparency_path = WEB_DATA_DIR / "transparency.json"
    with open(transparency_path, "w") as f:
        json.dump(transparency, f, indent=2)
    print(f"✓ Exported transparency audit to {transparency_path.name} "
          f"({transparency['included']}/{transparency['totalCached']} included)")

    print("\n✓ All exports complete!")
    return {
        "sculptors": sculptors,
        "edges": edges,
        "movements_by_decade": movements,
        "geography_by_decade": geography,
        "focus_sculptors": focus,
        "timeline_sculptors": timeline,
        "materials_by_decade": materials_export,
        "transparency": transparency,
    }


if __name__ == "__main__":
    export_all()
