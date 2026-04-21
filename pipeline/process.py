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
    ENDPOINT_LABELS_CACHE_PATH,
    MENTOR_META_CACHE_PATH,
    MET_OBJECTS_CACHE_PATH,
    AIC_OBJECTS_CACHE_PATH,
    NODES_ENRICHED_PATH,
    NODES_METRICS_PATH,
    RELATIONS_CLEAN_PATH,
    MATERIALS_BY_DECADE_PATH,
    OVERRIDES_DIR,
    REFRESH_PROCESSING,
    MIN_BIRTH_YEAR,
    FOCUS_SCULPTOR_NAMES,
    PROCESSED_DIR,
)
from query_enrichment import (
    SITELINKS_CACHE_PATH,
    AUTHORITY_IDS_CACHE_PATH,
    BIRTH_PLACES_CACHE_PATH,
    DEATH_PLACES_CACHE_PATH,
    NATIVE_NAMES_CACHE_PATH,
)
from helpers import normalize_name


# =============================================================================
# Phase 3a: Option A.3 inclusion criteria
# =============================================================================
# Wikipedias dominated by bot-generated stubs — excluded from sitelink counts
# per Expert 4 (Wikidata community veteran) recommendation.
BOT_DOMINATED_WIKIS = {"ceb", "war"}

# Sitelinks threshold: require >=3 non-English Wikipedia articles (bots excluded).
# Chosen after U-shape threshold analysis — see docs/INCLUSION_CRITERIA.md.
SITELINKS_MIN_NON_ENGLISH = 3


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
    
    # Pick most common citizenship label for display (primary)
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

    # ALSO build citizenships list (all distinct per sculptor) — for the
    # multi-citizenship story and migration views.
    citizenships_all = (
        citizenships_long.drop_duplicates(["qid", "citizenship_label"])
        .groupby("qid")["citizenship_label"]
        .apply(list)
        .reset_index(name="citizenships")
    )
    citizenships_all["citizenship_count"] = citizenships_all["citizenships"].apply(len)

    # =========================================================================
    # Phase 3a enrichment: sitelinks, authority IDs, places, native names
    # =========================================================================
    sitelinks_enrich  = _build_sitelinks_enrichment(nodes["qid"])
    authority_enrich  = _build_authority_enrichment(nodes["qid"])
    birth_enrich      = _build_place_enrichment(BIRTH_PLACES_CACHE_PATH, "birth")
    death_enrich      = _build_place_enrichment(DEATH_PLACES_CACHE_PATH, "death")
    native_enrich     = _build_native_name_enrichment()

    # Join everything
    nodes_enriched = nodes.merge(
        movement_display, on="qid", how="left"
    ).merge(
        citizenship_display, on="qid", how="left"
    ).merge(
        citizenships_all, on="qid", how="left"
    ).merge(
        sitelinks_enrich, on="qid", how="left"
    ).merge(
        authority_enrich, on="qid", how="left"
    ).merge(
        birth_enrich, on="qid", how="left"
    ).merge(
        death_enrich, on="qid", how="left"
    ).merge(
        native_enrich, on="qid", how="left"
    )

    # Fill missing values
    nodes_enriched["movement_display"] = nodes_enriched["movement_display"].fillna("No movement listed")
    nodes_enriched["movement_count"] = nodes_enriched["movement_count"].fillna(0).astype(int)
    nodes_enriched["citizenship_display"] = nodes_enriched["citizenship_display"].fillna("Unknown")
    nodes_enriched["citizenship_count"] = nodes_enriched["citizenship_count"].fillna(0).astype(int)
    nodes_enriched["citizenships"] = nodes_enriched["citizenships"].apply(
        lambda v: v if isinstance(v, list) else []
    )
    nodes_enriched["sitelink_langs"] = nodes_enriched["sitelink_langs"].apply(
        lambda v: v if isinstance(v, list) else []
    )
    nodes_enriched["sitelink_count"] = nodes_enriched["sitelink_count"].fillna(0).astype(int)
    nodes_enriched["non_en_sitelink_count"] = nodes_enriched["non_en_sitelink_count"].fillna(0).astype(int)
    nodes_enriched["authority_types"] = nodes_enriched["authority_types"].apply(
        lambda v: v if isinstance(v, list) else []
    )
    nodes_enriched["authority_links"] = nodes_enriched["authority_links"].apply(
        lambda v: v if isinstance(v, list) else []
    )

    return nodes_enriched


# =============================================================================
# Enrichment builders (Phase 3a)
# =============================================================================
def _build_sitelinks_enrichment(node_qids: pd.Series) -> pd.DataFrame:
    """Return per-QID: sitelink_langs (list), sitelink_count, non_en_sitelink_count.

    Bot-dominated wikis (ceb, war) already excluded at query time, but we
    defensively re-filter here in case the cache pre-dated that filter.
    """
    if not SITELINKS_CACHE_PATH.exists():
        return pd.DataFrame({
            "qid": pd.Series([], dtype=str),
            "sitelink_langs": pd.Series([], dtype=object),
            "sitelink_count": pd.Series([], dtype=int),
            "non_en_sitelink_count": pd.Series([], dtype=int),
        })
    df = pd.read_parquet(SITELINKS_CACHE_PATH)
    df = df.dropna(subset=["lang"]).copy()
    df["lang"] = df["lang"].astype(str)
    df = df[~df["lang"].isin(BOT_DOMINATED_WIKIS)]
    df = df[df["qid_clean"].isin(set(node_qids))]
    grouped = df.groupby("qid_clean")["lang"].apply(lambda s: sorted(set(s)))
    out = grouped.reset_index().rename(columns={"qid_clean": "qid", "lang": "sitelink_langs"})
    out["sitelink_count"] = out["sitelink_langs"].apply(len)
    out["non_en_sitelink_count"] = out["sitelink_langs"].apply(
        lambda langs: sum(1 for l in langs if l != "en")
    )
    return out


# URL templates per authority file. Matches the formatter URLs declared in
# Wikidata for the corresponding property. Keep this list in sync with the
# UNION arms of AUTHORITY_IDS_TEMPLATE in query_enrichment.py.
AUTHORITY_URL_TEMPLATES = {
    "ulan":  "https://www.getty.edu/vow/ULANFullDisplay?find=&role=&nation=&subjectid={id}",
    "viaf":  "https://viaf.org/en/viaf/{id}",
    "lcnaf": "https://id.loc.gov/authorities/names/{id}",
    "bnf":   "https://catalogue.bnf.fr/ark:/12148/cb{id}",
    "dnb":   "https://d-nb.info/gnd/{id}",
    "ndl":   "https://id.ndl.go.jp/auth/ndlna/{id}",
    "bne":   "https://datos.bne.es/persona/{id}",
}


def _build_authority_enrichment(node_qids: pd.Series) -> pd.DataFrame:
    """Return per-QID: authority_types (list of type strings) and
    authority_links (list of {type, id, url} dicts).

    Both fields are emitted so Option A.3's boolean-presence semantics are
    preserved for the signal layer while the JSON consumer gets actionable
    outbound URLs. If a sculptor has multiple IDs for the same authority
    (rare but legal in Wikidata), we keep the first encountered.
    """
    empty_cols = {
        "qid": pd.Series([], dtype=str),
        "authority_types": pd.Series([], dtype=object),
        "authority_links": pd.Series([], dtype=object),
    }
    if not AUTHORITY_IDS_CACHE_PATH.exists():
        return pd.DataFrame(empty_cols)

    df = pd.read_parquet(AUTHORITY_IDS_CACHE_PATH)
    df = df.dropna(subset=["authority"]).copy()
    df["authority"] = df["authority"].astype(str)
    # `value` may be missing for older cached parquets (pre-2026-04-21);
    # guard against it so a stale cache doesn't break the pipeline.
    has_value = "value" in df.columns
    if has_value:
        df["value"] = df["value"].astype(str)
    df = df[df["qid_clean"].isin(set(node_qids))]

    def _build_links(group: pd.DataFrame) -> list[dict]:
        seen: dict[str, dict] = {}
        for _, r in group.iterrows():
            t = r["authority"]
            if t in seen:
                continue  # keep first ID per type
            val = r["value"] if has_value else None
            tmpl = AUTHORITY_URL_TEMPLATES.get(t)
            url = tmpl.format(id=val) if (tmpl and val) else None
            seen[t] = {"type": t, "id": val, "url": url}
        return sorted(seen.values(), key=lambda d: d["type"])

    grouped = df.groupby("qid_clean", group_keys=False).apply(
        lambda g: pd.Series({
            "authority_types": sorted(set(g["authority"])),
            "authority_links": _build_links(g),
        })
    )
    return grouped.reset_index().rename(columns={"qid_clean": "qid"})


def _build_place_enrichment(cache_path: Path, prefix: str) -> pd.DataFrame:
    """Read birth_places or death_places parquet and return one row per QID.

    If a sculptor has multiple places, pick the first (most common pattern
    in Wikidata is single-value). prefix is 'birth' or 'death'.
    """
    if not cache_path.exists():
        return pd.DataFrame({
            "qid": pd.Series([], dtype=str),
            f"{prefix}_place": pd.Series([], dtype=str),
            f"{prefix}_place_qid": pd.Series([], dtype=str),
            f"{prefix}_country": pd.Series([], dtype=str),
        })
    df = pd.read_parquet(cache_path)
    df = df.drop_duplicates("qid_clean", keep="first")
    return df.rename(columns={
        "qid_clean": "qid",
        "place_qid": f"{prefix}_place_qid",
        "place_label": f"{prefix}_place",
        "country_label": f"{prefix}_country",
    })


def _build_native_name_enrichment() -> pd.DataFrame:
    """Return per-QID: native_name, native_lang."""
    if not NATIVE_NAMES_CACHE_PATH.exists():
        return pd.DataFrame({
            "qid": pd.Series([], dtype=str),
            "native_name": pd.Series([], dtype=str),
            "native_lang": pd.Series([], dtype=str),
        })
    df = pd.read_parquet(NATIVE_NAMES_CACHE_PATH)
    df = df.drop_duplicates("qid_clean", keep="first")
    return df.rename(columns={"qid_clean": "qid"})


def process_relations(nodes_enriched: pd.DataFrame) -> pd.DataFrame:
    """Clean relations and attach labels from the endpoint labels cache.

    Does NOT filter edges by whether both endpoints are sculptors: cross-media
    mentors (painters, composers, architects who taught sculptors) are common
    in academic training and are preserved as external nodes. They are later
    enriched with birth/death/occupation via build_external_mentors().

    Output columns: from_qid, to_qid, relation_type, from_name, to_name.
    """
    relations_raw = pd.read_parquet(RELATIONS_CACHE_PATH)

    if len(relations_raw) == 0:
        return pd.DataFrame({
            "from_qid": pd.Series([], dtype=str),
            "to_qid": pd.Series([], dtype=str),
            "relation_type": pd.Series([], dtype=str),
            "from_name": pd.Series([], dtype=str),
            "to_name": pd.Series([], dtype=str),
        })

    relations = pd.DataFrame({
        "from_qid": relations_raw["from_qid"].astype(str),
        "to_qid": relations_raw["to_qid"].astype(str),
        "relation_type": relations_raw["relation_type"].astype(str),
    }).drop_duplicates()

    # Keep edges where target (to_qid, the sculptor) is in our node table.
    # The sculptor_qids query was used to fetch these, so ~all should pass,
    # but this guards against drift between cache vintages.
    qid_set = set(nodes_enriched["qid"])
    relations = relations[relations["to_qid"].isin(qid_set)].copy()

    # Attach labels (prefer multi-language fallback from endpoint_labels cache,
    # fall back to nodes_enriched 'name' for sculptors already in our set).
    label_map = {}
    if ENDPOINT_LABELS_CACHE_PATH.exists():
        labels_df = pd.read_parquet(ENDPOINT_LABELS_CACHE_PATH)
        label_map = dict(zip(labels_df["qid_clean"], labels_df["label"]))
    # Sculptor names take precedence — they're canonical English labels
    for _, row in nodes_enriched.iterrows():
        label_map[row["qid"]] = row["name"]

    relations["from_name"] = relations["from_qid"].map(label_map).fillna(relations["from_qid"])
    relations["to_name"] = relations["to_qid"].map(label_map).fillna(relations["to_qid"])

    return relations


def build_external_mentors(
    relations: pd.DataFrame,
    nodes_enriched: pd.DataFrame,
) -> pd.DataFrame:
    """Build a dataframe of non-sculptor mentors referenced by edges.

    Pulls labels from the endpoint_labels cache and birth/death/gender/
    occupation from the mentor_meta cache. Rows may be missing any of
    those optional fields — all defaults to None.

    Output columns: qid, name, birth_year, death_year, gender, occupation.
    """
    sculptor_qids = set(nodes_enriched["qid"])
    mentor_qids = sorted(set(relations["from_qid"]) - sculptor_qids)

    if not mentor_qids:
        return pd.DataFrame(columns=["qid", "name", "birth_year", "death_year", "gender", "occupation"])

    # Labels
    labels = (
        pd.read_parquet(ENDPOINT_LABELS_CACHE_PATH)
        if ENDPOINT_LABELS_CACHE_PATH.exists()
        else pd.DataFrame(columns=["qid_clean", "label"])
    )
    label_map = dict(zip(labels["qid_clean"], labels["label"]))

    # Meta
    meta = (
        pd.read_parquet(MENTOR_META_CACHE_PATH)
        if MENTOR_META_CACHE_PATH.exists()
        else pd.DataFrame(columns=["qid_clean", "birth", "death", "gender", "occupation"])
    )
    meta = meta.drop_duplicates("qid_clean", keep="first").set_index("qid_clean")

    records = []
    for qid in mentor_qids:
        m = meta.loc[qid] if qid in meta.index else None
        birth_y = extract_year(parse_wikidata_date(m["birth"])) if m is not None else None
        death_y = extract_year(parse_wikidata_date(m["death"])) if m is not None else None
        records.append({
            "qid": qid,
            "name": label_map.get(qid, qid),
            "birth_year": birth_y,
            "death_year": death_y,
            "gender": (m["gender"] if m is not None and pd.notna(m["gender"]) else None),
            "occupation": (m["occupation"] if m is not None and pd.notna(m["occupation"]) else None),
        })
    return pd.DataFrame(records)


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


def compute_inclusion_signals(nodes: pd.DataFrame) -> pd.DataFrame:
    """Attach Option A.3 inclusion signals to each sculptor row.

    Adds two columns:
      - inclusion_signals : list[str] of fired signal names
      - is_included       : bool — True if at least one A.3 signal fires

    A.3 signals (all five are sufficient; ANY fires = included):
      1. 'movement'    — Wikidata P135 label present
      2. 'edge'        — appears as source OR target in relations
      3. 'focus'       — on Fabio's curated focus list
      4. 'multi_citz'  — >=2 distinct citizenships
      5. 'sitelinks'   — >= SITELINKS_MIN_NON_ENGLISH non-EN Wikipedia articles,
                         excluding bot-dominated wikis (already filtered upstream)

    Authority IDs are STORED (nodes["authority_types"]) but are NOT an
    inclusion gate — analysis showed they're heavily Western-biased and
    don't add meaningful non-Western representation. See INCLUSION_CRITERIA.md.
    """
    focus_norm = set(normalize_name(n) for n in FOCUS_SCULPTOR_NAMES)

    def signals_for(row) -> list[str]:
        sigs: list[str] = []
        if row["movement_display"] and row["movement_display"] != "No movement listed":
            sigs.append("movement")
        if row["total_degree"] > 0:
            sigs.append("edge")
        if row["name_norm"] in focus_norm:
            sigs.append("focus")
        if row["citizenship_count"] >= 2:
            sigs.append("multi_citz")
        if row["non_en_sitelink_count"] >= SITELINKS_MIN_NON_ENGLISH:
            sigs.append("sitelinks")
        return sigs

    nodes = nodes.copy()
    nodes["inclusion_signals"] = nodes.apply(signals_for, axis=1)
    nodes["is_included"] = nodes["inclusion_signals"].apply(lambda s: len(s) > 0)
    return nodes


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
    
    # Process relations (keep ALL edges including cross-media mentors)
    relations = process_relations(nodes_enriched)
    relations.to_parquet(RELATIONS_CLEAN_PATH, index=False)
    print(f"✓ Relations after target-sculptor filter: {len(relations)} edges")

    # Build external mentor table (non-sculptor endpoints, enriched with meta)
    external_mentors = build_external_mentors(relations, nodes_enriched)
    external_mentors_path = PROCESSED_DIR / f"external_mentors_{MIN_BIRTH_YEAR}plus.parquet"
    external_mentors.to_parquet(external_mentors_path, index=False)
    print(f"✓ External mentors: {len(external_mentors)} rows")

    # Compute graph metrics (uses all edges, including those to external mentors)
    nodes_with_metrics = compute_graph_metrics(nodes_enriched, relations)

    # Compute A.3 inclusion signals (after edges are counted)
    nodes_with_metrics = compute_inclusion_signals(nodes_with_metrics)

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
    total = len(nodes_with_metrics)
    included = int(nodes_with_metrics["is_included"].sum())
    print(f"Total sculptors in cache: {total}")
    print(f"A.3 inclusion set:        {included}  ({100*included/total:.1f}% of cache)")
    print(f"  Excluded:               {total - included}")
    print()
    print("Signal coverage (any sculptor can fire multiple):")
    from collections import Counter
    sig_counter: Counter = Counter()
    for sigs in nodes_with_metrics["inclusion_signals"]:
        for s in sigs:
            sig_counter[s] += 1
    for sig in ["movement", "edge", "focus", "multi_citz", "sitelinks"]:
        count = sig_counter.get(sig, 0)
        print(f"  {sig:<14} {count:>5}  ({100*count/total:.1f}% of cache)")
    print()
    print(f"With citizenship:  {sum(nodes_with_metrics['citizenship_display'] != 'Unknown')}")
    print(f"With birth place:  {sum(nodes_with_metrics['birth_place'].notna())}")
    print(f"With death place:  {sum(nodes_with_metrics['death_place'].notna())}")
    print(f"With native name:  {sum(nodes_with_metrics['native_name'].notna())}")
    print(f"With authority ID: {sum(nodes_with_metrics['authority_types'].apply(len) > 0)}")
    print(f"Living sculptors:  {sum(nodes_with_metrics['alive'])}")
    print(f"Relation edges:    {len(relations)}")
    print(f"Birth year range:  {nodes_with_metrics['birth_year'].min()} \u2013 {nodes_with_metrics['birth_year'].max()}")
    
    # Focus subset audit
    focus_norm = [normalize_name(n) for n in FOCUS_SCULPTOR_NAMES]
    focus_df = nodes_with_metrics[nodes_with_metrics["name_norm"].isin(focus_norm)].copy()
    missing = set(focus_norm) - set(focus_df["name_norm"])
    if missing:
        print(f"\n⚠ Missing from data: {[n for n in FOCUS_SCULPTOR_NAMES if normalize_name(n) in missing]}")
    else:
        print(f"\n✓ All {len(FOCUS_SCULPTOR_NAMES)} focus sculptors found")
    
    return {
        "nodes": nodes_with_metrics,
        "relations": relations,
        "materials_by_decade": materials_by_decade,
    }


if __name__ == "__main__":
    run_processing()
