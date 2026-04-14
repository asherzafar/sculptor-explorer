"""Clean, enrich, and compute metrics on sculptor data."""
import re
from datetime import date
from pathlib import Path
from typing import Optional

import networkx as nx
import pandas as pd
from config import (
    NODES_RAW_CACHE_PATH,
    MOVEMENTS_CACHE_PATH,
    CITIZENSHIPS_CACHE_PATH,
    RELATIONS_CACHE_PATH,
    MET_OBJECTS_CACHE_PATH,
    AIC_OBJECTS_CACHE_PATH,
    NODES_ENRICHED_PATH,
    NODES_METRICS_PATH,
    RELATIONS_CLEAN_PATH,
    MATERIALS_BY_DECADE_PATH,
    OVERRIDES_DIR,
    REFRESH_PROCESSING,
    MIN_BIRTH_YEAR,
    FOCUS_SCULPTORS,
)
from helpers import normalize_name


def parse_wikidata_date(date_str: str) -> Optional[date]:
    """Extract YYYY-MM-DD from strings like '1840-11-12T00:00:00Z'."""
    if pd.isna(date_str) or not date_str:
        return None
    # Extract date pattern
    match = re.search(r'(\d{4})-(\d{2})-(\d{2})', str(date_str))
    if match:
        year, month, day = map(int, match.groups())
        try:
            return date(year, month, day)
        except ValueError:
            return None
    return None


def extract_year(d: Optional[date]) -> Optional[int]:
    """Extract year from date."""
    return d.year if d else None


def process_nodes() -> pd.DataFrame:
    """Clean and enrich the node table."""
    # Load raw data
    nodes_raw = pd.read_parquet(NODES_RAW_CACHE_PATH)
    movements_raw = pd.read_parquet(MOVEMENTS_CACHE_PATH)
    citizenships_raw = pd.read_parquet(CITIZENSHIPS_CACHE_PATH)
    
    # Clean core node table
    nodes = pd.DataFrame({
        "qid": nodes_raw["qid_clean"].astype(str),
        "name": nodes_raw["name"].astype(str),
        "birth_date": nodes_raw["birth"].apply(parse_wikidata_date),
        "death_date": nodes_raw["death"].apply(parse_wikidata_date),
        "gender": nodes_raw["gender"].fillna("Unknown").astype(str),
    })
    
    # Remove rows with no birth date
    nodes = nodes[nodes["birth_date"].notna()].copy()
    
    # Add derived columns
    nodes["birth_year"] = nodes["birth_date"].apply(extract_year)
    nodes["death_year"] = nodes["death_date"].apply(extract_year)
    nodes["death_year_plot"] = nodes["death_year"].fillna(date.today().year).astype(int)
    nodes["death_date_plot"] = nodes["death_date"].fillna(date.today())
    nodes["alive"] = nodes["death_date"].isna()
    nodes["mid_year"] = nodes.apply(
        lambda row: row["birth_year"] if pd.isna(row["death_year"])
        else int((row["birth_year"] + row["death_year"]) // 2),
        axis=1,
    )
    nodes["birth_decade"] = (nodes["birth_year"] // 10 * 10).astype(int)
    nodes["name_norm"] = nodes["name"].apply(normalize_name)
    
    # Filter to birth year >= MIN_BIRTH_YEAR
    nodes = nodes[nodes["birth_year"] >= MIN_BIRTH_YEAR].copy()
    
    # Remove duplicates
    nodes = nodes.drop_duplicates(subset=["qid"], keep="first")
    
    # Process movements
    movements_long = pd.DataFrame({
        "qid": movements_raw["qid_clean"].astype(str),
        "movement_label": movements_raw["movementLabel"].astype(str).str.strip(),
    })
    movements_long = movements_long[
        movements_long["movement_label"].notna() & 
        (movements_long["movement_label"] != "")
    ].copy()
    
    # Only keep movements for sculptors in our node set
    movements_long = movements_long[movements_long["qid"].isin(nodes["qid"])].copy()
    
    # Count movement frequencies
    movement_freq = movements_long["movement_label"].value_counts().reset_index()
    movement_freq.columns = ["movement_label", "count"]
    
    # Pick most common movement label for each sculptor
    movements_with_freq = movements_long.merge(movement_freq, on="movement_label")
    movements_sorted = movements_with_freq.sort_values(
        ["qid", "count", "movement_label"],
        ascending=[True, False, True]
    )
    movement_display = (
        movements_sorted.groupby("qid")
        .agg(
            movement_display=("movement_label", "first"),
            movement_count=("movement_label", "nunique"),
        )
        .reset_index()
    )
    
    # Process citizenships
    citizenships_long = pd.DataFrame({
        "qid": citizenships_raw["qid_clean"].astype(str),
        "citizenship_label": citizenships_raw["citizenshipLabel"].astype(str).str.strip(),
    })
    citizenships_long = citizenships_long[
        citizenships_long["citizenship_label"].notna() & 
        (citizenships_long["citizenship_label"] != "")
    ].copy()
    
    # Only keep citizenships for sculptors in our node set
    citizenships_long = citizenships_long[citizenships_long["qid"].isin(nodes["qid"])].copy()
    
    # Pick most common citizenship label for each sculptor
    citizenship_freq = citizenships_long["citizenship_label"].value_counts().reset_index()
    citizenship_freq.columns = ["citizenship_label", "count"]
    citizenships_with_freq = citizenships_long.merge(citizenship_freq, on="citizenship_label")
    citizenships_sorted = citizenships_with_freq.sort_values(
        ["qid", "count", "citizenship_label"],
        ascending=[True, False, True]
    )
    citizenship_display = (
        citizenships_sorted.groupby("qid")
        .agg(citizenship_display=("citizenship_label", "first"))
        .reset_index()
    )
    
    # Join enrichments
    nodes_enriched = nodes.merge(
        movement_display, on="qid", how="left"
    ).merge(
        citizenship_display, on="qid", how="left"
    )
    
    # Fill missing values
    nodes_enriched["movement_display"] = nodes_enriched["movement_display"].fillna("No movement listed")
    nodes_enriched["movement_count"] = nodes_enriched["movement_count"].fillna(0).astype(int)
    nodes_enriched["citizenship_display"] = nodes_enriched["citizenship_display"].fillna("Unknown")
    
    return nodes_enriched


def process_relations(nodes_enriched: pd.DataFrame) -> pd.DataFrame:
    """Clean relations and keep only edges where both endpoints are in node set."""
    relations_raw = pd.read_parquet(RELATIONS_CACHE_PATH)
    
    if len(relations_raw) == 0:
        return pd.DataFrame({
            "from_qid": pd.Series([], dtype=str),
            "source_label": pd.Series([], dtype=str),
            "to_qid": pd.Series([], dtype=str),
            "sculptor_label": pd.Series([], dtype=str),
            "relation_type": pd.Series([], dtype=str),
        })
    
    relations = pd.DataFrame({
        "from_qid": relations_raw["from_qid"].astype(str),
        "source_label": relations_raw["sourceLabel"].astype(str),
        "to_qid": relations_raw["to_qid"].astype(str),
        "sculptor_label": relations_raw["sculptorLabel"].astype(str),
        "relation_type": relations_raw["relation_type"].astype(str),
    })
    
    # Keep only edges where both endpoints are in our node table
    qid_set = set(nodes_enriched["qid"])
    relations = relations[
        relations["from_qid"].isin(qid_set) & 
        relations["to_qid"].isin(qid_set)
    ].copy()
    
    # Remove duplicates
    relations = relations.drop_duplicates().copy()
    
    return relations


def compute_graph_metrics(nodes_enriched: pd.DataFrame, relations: pd.DataFrame) -> pd.DataFrame:
    """Build graph and compute degree metrics."""
    if len(relations) > 0:
        # Build directed graph
        G = nx.DiGraph()
        G.add_nodes_from(nodes_enriched["qid"])
        G.add_edges_from(zip(relations["from_qid"], relations["to_qid"]))
        
        # Compute metrics
        metrics = pd.DataFrame({
            "qid": list(G.nodes()),
            "in_degree": [G.in_degree(n) for n in G.nodes()],
            "out_degree": [G.out_degree(n) for n in G.nodes()],
            "total_degree": [G.degree(n) for n in G.nodes()],
        })
    else:
        metrics = pd.DataFrame({
            "qid": nodes_enriched["qid"],
            "in_degree": 0,
            "out_degree": 0,
            "total_degree": 0,
        })
    
    # Join metrics back to nodes
    nodes_with_metrics = nodes_enriched.merge(metrics, on="qid", how="left")
    nodes_with_metrics["in_degree"] = nodes_with_metrics["in_degree"].fillna(0).astype(int)
    nodes_with_metrics["out_degree"] = nodes_with_metrics["out_degree"].fillna(0).astype(int)
    nodes_with_metrics["total_degree"] = nodes_with_metrics["total_degree"].fillna(0).astype(int)
    
    return nodes_with_metrics


def load_medium_taxonomy() -> dict[str, str]:
    """Load medium taxonomy mapping from CSV."""
    taxonomy_path = OVERRIDES_DIR / "medium_taxonomy.csv"
    if not taxonomy_path.exists():
        return {}
    
    df = pd.read_csv(taxonomy_path)
    return dict(zip(df["keyword"].str.lower(), df["category"]))


def categorize_medium(medium_str: str, taxonomy: dict[str, str]) -> str:
    """Categorize a medium string using the taxonomy."""
    if pd.isna(medium_str) or not medium_str:
        return "Unknown"
    
    medium_lower = str(medium_str).lower()
    
    # Find matching keyword
    for keyword, category in taxonomy.items():
        if keyword in medium_lower:
            return category
    
    return "Other"


def parse_object_year(date_str: str) -> Optional[int]:
    """Extract year from object date string."""
    if pd.isna(date_str) or not date_str:
        return None
    
    # Look for 4-digit year
    match = re.search(r'\b(\d{4})\b', str(date_str))
    if match:
        year = int(match.group(1))
        # Sanity check: year should be reasonable (1800-2100)
        if 1800 <= year <= 2100:
            return year
    return None


def process_materials(nodes_with_metrics: pd.DataFrame) -> pd.DataFrame:
    """Process museum object materials and aggregate by decade."""
    # Load museum data if available
    materials_records = []
    
    if MET_OBJECTS_CACHE_PATH.exists():
        met_data = pd.read_parquet(MET_OBJECTS_CACHE_PATH)
        for _, row in met_data.iterrows():
            materials_records.append({
                "sculptor_name": row["sculptor_name"],
                "medium": row["medium"],
                "year": row["begin_year"] if pd.notna(row["begin_year"]) else parse_object_year(row["date"]),
                "source": "met",
            })
    
    if AIC_OBJECTS_CACHE_PATH.exists():
        aic_data = pd.read_parquet(AIC_OBJECTS_CACHE_PATH)
        for _, row in aic_data.iterrows():
            materials_records.append({
                "sculptor_name": row["sculptor_name"],
                "medium": row["medium"],
                "year": parse_object_year(row["date"]),
                "source": "aic",
            })
    
    if not materials_records:
        # Return empty DataFrame with expected structure
        return pd.DataFrame({
            "decade": pd.Series([], dtype=int),
            "total": pd.Series([], dtype=int),
        })
    
    # Create materials DataFrame
    materials_df = pd.DataFrame(materials_records)
    
    # Load taxonomy
    taxonomy = load_medium_taxonomy()
    
    # Categorize materials
    materials_df["category"] = materials_df["medium"].apply(
        lambda m: categorize_medium(m, taxonomy)
    )
    
    # Filter to valid years
    materials_df = materials_df[materials_df["year"].notna()].copy()
    materials_df["year"] = materials_df["year"].astype(int)
    materials_df["decade"] = (materials_df["year"] // 10 * 10).astype(int)
    
    # Aggregate by decade and category
    grouped = (
        materials_df.groupby(["decade", "category"])
        .size()
        .reset_index(name="count")
    )
    
    # Get top categories
    top_categories = (
        materials_df["category"]
        .value_counts()
        .head(10)
        .index.tolist()
    )
    
    # Pivot to wide format
    pivot = grouped.pivot(
        index="decade",
        columns="category",
        values="count"
    ).fillna(0).astype(int)
    
    # Build final records
    decades = range(MIN_BIRTH_YEAR, 2030, 10)
    records = []
    
    for decade in decades:
        record = {"decade": decade, "total": 0}
        
        for category in top_categories:
            count = int(pivot.loc[decade, category]) if decade in pivot.index and category in pivot.columns else 0
            record[category] = count
            record["total"] += count
        
        records.append(record)
    
    return pd.DataFrame(records)


def run_processing():
    """Run all processing steps."""
    if not REFRESH_PROCESSING and NODES_ENRICHED_PATH.exists():
        print("✓ Loading cached enriched nodes")
        nodes_enriched = pd.read_parquet(NODES_ENRICHED_PATH)
    else:
        print("=" * 60)
        print("Processing nodes...")
        print("=" * 60)
        nodes_enriched = process_nodes()
        nodes_enriched.to_parquet(NODES_ENRICHED_PATH, index=False)
        print(f"✓ Enriched nodes: {len(nodes_enriched)} rows")
    
    # Process relations
    relations = process_relations(nodes_enriched)
    relations.to_parquet(RELATIONS_CLEAN_PATH, index=False)
    print(f"✓ Relations after node-table filter: {len(relations)} edges")
    
    # Compute graph metrics
    nodes_with_metrics = compute_graph_metrics(nodes_enriched, relations)
    nodes_with_metrics.to_parquet(NODES_METRICS_PATH, index=False)
    print(f"✓ Nodes with metrics: {len(nodes_with_metrics)} rows")
    
    # Process materials
    print("\n" + "=" * 60)
    print("Processing materials...")
    print("=" * 60)
    materials_by_decade = process_materials(nodes_with_metrics)
    if len(materials_by_decade) > 0:
        materials_by_decade.to_parquet(MATERIALS_BY_DECADE_PATH, index=False)
        print(f"✓ Materials by decade: {len(materials_by_decade)} decades")
    else:
        print("⚠ No museum material data available")
    
    # Audit
    print("\n" + "=" * 60)
    print("Data Audit")
    print("=" * 60)
    print(f"Total sculptors: {len(nodes_with_metrics)}")
    print(f"With movement label: {sum(nodes_with_metrics['movement_display'] != 'No movement listed')}")
    print(f"Pct with movement: {100 * (nodes_with_metrics['movement_display'] != 'No movement listed').mean():.1f}%")
    print(f"With citizenship: {sum(nodes_with_metrics['citizenship_display'] != 'Unknown')}")
    print(f"Living sculptors: {sum(nodes_with_metrics['alive'])}")
    print(f"Relation edges: {len(relations)}")
    print(f"Sculptors with edges: {sum(nodes_with_metrics['total_degree'] > 0)}")
    print(f"Birth year range: {nodes_with_metrics['birth_year'].min()} – {nodes_with_metrics['birth_year'].max()}")
    
    # Focus subset audit
    focus_norm = [normalize_name(n) for n in FOCUS_SCULPTORS]
    focus_df = nodes_with_metrics[nodes_with_metrics["name_norm"].isin(focus_norm)].copy()
    missing = set(focus_norm) - set(focus_df["name_norm"])
    if missing:
        print(f"\n⚠ Missing from data: {[n for n in FOCUS_SCULPTORS if normalize_name(n) in missing]}")
    else:
        print(f"\n✓ All {len(FOCUS_SCULPTORS)} focus sculptors found")
    
    return {
        "nodes": nodes_with_metrics,
        "relations": relations,
        "materials_by_decade": materials_by_decade,
    }


if __name__ == "__main__":
    run_processing()
