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


def create_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create sculptors.json with all notable sculptors."""
    # Filter to notable sculptors: has movement OR has edges OR in focus list
    focus_norm = set(normalize_name(n) for n in FOCUS_SCULPTOR_NAMES)
    is_notable = (
        (nodes["movement_display"] != "No movement listed") |
        (nodes["total_degree"] > 0) |
        (nodes["name_norm"].isin(focus_norm))
    )
    notable_nodes = nodes[is_notable].copy()
    
    records = []
    for _, row in notable_nodes.iterrows():
        records.append({
            "qid": row["qid"],
            "name": row["name"],
            "birthYear": int(row["birth_year"]) if pd.notna(row["birth_year"]) else None,
            "deathYear": int(row["death_year"]) if pd.notna(row["death_year"]) else None,
            "alive": bool(row["alive"]),
            "gender": row["gender"],
            "movement": row["movement_display"],
            "citizenship": row["citizenship_display"],
            "birthDecade": int(row["birth_decade"]) if pd.notna(row["birth_decade"]) else None,
            "inDegree": int(row["in_degree"]),
            "outDegree": int(row["out_degree"]),
            "totalDegree": int(row["total_degree"]),
        })
    
    return records


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
    """Create movements_by_decade.json with pre-aggregated data."""
    nodes_with_movement = nodes[nodes["movement_display"] != "No movement listed"].copy()
    
    # Group by decade and movement
    grouped = (
        nodes_with_movement.groupby(["birth_decade", "movement_display"])
        .size()
        .reset_index(name="count")
    )
    
    # Pivot to get decades as rows, movements as columns
    pivot = grouped.pivot(
        index="birth_decade",
        columns="movement_display",
        values="count"
    ).fillna(0).astype(int)
    
    # Get top movements overall
    top_movements = (
        nodes_with_movement["movement_display"]
        .value_counts()
        .head(15)
        .index.tolist()
    )
    
    records = []
    for decade in sorted(pivot.index):
        record = {"decade": int(decade)}
        for movement in top_movements:
            record[movement] = int(pivot.loc[decade, movement]) if movement in pivot.columns else 0
        record["total"] = int(pivot.loc[decade].sum())
        records.append(record)
    
    return records


def create_geography_by_decade_json(nodes: pd.DataFrame) -> list[dict]:
    """Create geography_by_decade.json with pre-aggregated data."""
    nodes_with_citizenship = nodes[nodes["citizenship_display"] != "Unknown"].copy()
    
    # Group by decade and citizenship
    grouped = (
        nodes_with_citizenship.groupby(["birth_decade", "citizenship_display"])
        .size()
        .reset_index(name="count")
    )
    
    # Get top citizenships overall
    top_citizenships = (
        nodes_with_citizenship["citizenship_display"]
        .value_counts()
        .head(15)
        .index.tolist()
    )
    
    # Create decade records
    records = []
    decades = sorted(nodes["birth_decade"].unique())
    
    for decade in decades:
        decade_nodes = nodes[nodes["birth_decade"] == decade]
        record = {"decade": int(decade)}
        
        for citizenship in top_citizenships:
            count = len(
                decade_nodes[decade_nodes["citizenship_display"] == citizenship]
            )
            record[citizenship] = count
        
        record["unknown"] = len(decade_nodes[decade_nodes["citizenship_display"] == "Unknown"])
        record["total"] = len(decade_nodes)
        records.append(record)
    
    return records


def create_focus_sculptors_json(nodes: pd.DataFrame) -> list[dict]:
    """Create focus_sculptors.json with enriched focus list."""
    focus_norm = [normalize_name(n) for n in FOCUS_SCULPTOR_NAMES]
    focus_df = nodes[nodes["name_norm"].isin(focus_norm)].copy()
    
    # Sort by birth year
    focus_df = focus_df.sort_values("birth_year")
    
    records = []
    for _, row in focus_df.iterrows():
        records.append({
            "qid": row["qid"],
            "name": row["name"],
            "birthYear": int(row["birth_year"]) if pd.notna(row["birth_year"]) else None,
            "deathYear": int(row["death_year"]) if pd.notna(row["death_year"]) else None,
            "alive": bool(row["alive"]),
            "gender": row["gender"],
            "movement": row["movement_display"],
            "citizenship": row["citizenship_display"],
            "birthDecade": int(row["birth_decade"]) if pd.notna(row["birth_decade"]) else None,
            "inDegree": int(row["in_degree"]),
            "outDegree": int(row["out_degree"]),
            "totalDegree": int(row["total_degree"]),
        })
    
    return records


def create_materials_by_decade_json(materials: pd.DataFrame) -> list[dict]:
    """Create materials_by_decade.json with pre-aggregated material data."""
    if len(materials) == 0:
        return []
    
    # Convert DataFrame to list of dicts
    records = []
    for _, row in materials.iterrows():
        record = {"decade": int(row["decade"]), "total": int(row["total"])}
        
        # Add all material categories (excluding decade and total)
        for col in materials.columns:
            if col not in ["decade", "total"]:
                record[col] = int(row[col]) if pd.notna(row[col]) else 0
        
        records.append(record)
    
    return records


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
    
    # Export materials_by_decade.json
    materials_export = create_materials_by_decade_json(materials)
    materials_path = WEB_DATA_DIR / "materials_by_decade.json"
    with open(materials_path, "w") as f:
        json.dump(materials_export, f, indent=2)
    print(f"✓ Exported materials by decade to {materials_path.name} ({len(materials_export)} decades)")
    
    print("\n✓ All exports complete!")
    return {
        "sculptors": sculptors,
        "edges": edges,
        "movements_by_decade": movements,
        "geography_by_decade": geography,
        "focus_sculptors": focus,
        "materials_by_decade": materials_export,
    }


if __name__ == "__main__":
    export_all()
