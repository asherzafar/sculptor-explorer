"""Query Wikidata for sculptor data via SPARQL endpoint."""
import pandas as pd
from config import (
    MIN_BIRTH_YEAR,
    QID_CACHE_PATH,
    NODES_RAW_CACHE_PATH,
    MOVEMENTS_CACHE_PATH,
    CITIZENSHIPS_CACHE_PATH,
    RELATIONS_CACHE_PATH,
    ENDPOINT_LABELS_CACHE_PATH,
    MENTOR_META_CACHE_PATH,
    VALUES_BATCH_SIZE,
    REFRESH_FROM_WIKIDATA,
)
from helpers import query_sparql, query_sparql_batched


# =============================================================================
# Query 1: QID discovery (the expensive one, run once)
# =============================================================================
QID_DISCOVERY_QUERY = """
PREFIX wd:  <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT
  (REPLACE(STR(?sculptor), 'http://www.wikidata.org/entity/', '') AS ?qid)
WHERE {{
  ?sculptor wdt:P31  wd:Q5 .
  ?sculptor wdt:P106 ?occ .
  ?occ      wdt:P279* wd:Q1281618 .
  ?sculptor wdt:P569 ?birth .
  FILTER(?birth >= '{min_birth_year}-01-01T00:00:00Z'^^xsd:dateTime)
}}
"""


# =============================================================================
# Query 2: Node details (batched via VALUES on ?qid)
# =============================================================================
NODE_DETAILS_TEMPLATE = """
PREFIX wd:       <http://www.wikidata.org/entity/>
PREFIX wdt:      <http://www.wikidata.org/prop/direct/>
PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>
PREFIX wikibase: <http://wikiba.se/ontology#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?name
  (MIN(?b) AS ?birth)
  (MAX(?d) AS ?death)
  (SAMPLE(?genderLabel) AS ?gender)
WHERE {
  {{VALUES_BLOCK}}
  ?qid rdfs:label ?name . FILTER(LANG(?name) = 'en')
  ?qid wdt:P569 ?b .
  OPTIONAL { ?qid wdt:P570 ?d . }
  OPTIONAL { ?qid wdt:P21 ?genderEntity . ?genderEntity rdfs:label ?genderLabel . FILTER(LANG(?genderLabel) = 'en') }
}
GROUP BY ?qid ?name
"""


# =============================================================================
# Query 3: Movements (batched)
# =============================================================================
MOVEMENTS_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?movementLabel
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P135 ?movement .
  ?movement rdfs:label ?movementLabel . FILTER(LANG(?movementLabel) = 'en')
}
"""


# =============================================================================
# Query 4: Citizenships (batched)
# =============================================================================
CITIZENSHIPS_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?citizenshipLabel
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P27 ?citizenship .
  ?citizenship rdfs:label ?citizenshipLabel . FILTER(LANG(?citizenshipLabel) = 'en')
}
"""


# =============================================================================
# Query 5: Relations
#
# NOTE: We deliberately split P737 (influenced_by) and P1066 (student_of) into
# two separate queries rather than one UNION. Wikidata's optimizer produces a
# much slower plan for the UNION variant (timeouts at ~50 QIDs), whereas the
# single-pattern version returns in <1s even for 300-QID batches.
# Labels are fetched separately via LABELS_TEMPLATE (source + sculptor QIDs),
# not inline, so we don't drop edges whose endpoints lack English labels.
# =============================================================================
def _relation_template(predicate: str, relation_type: str) -> str:
    return f"""
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>

SELECT DISTINCT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?to_qid)
  (REPLACE(STR(?source), 'http://www.wikidata.org/entity/', '') AS ?from_qid)
WHERE {{
  {{{{VALUES_BLOCK}}}}
  ?qid wdt:{predicate} ?source .
  ?source wdt:P31 wd:Q5 .
}}
"""


INFLUENCED_BY_TEMPLATE = _relation_template("P737", "influenced_by")
STUDENT_OF_TEMPLATE = _relation_template("P1066", "student_of")


# =============================================================================
# Query 6: Labels for arbitrary QIDs (with multi-language fallback)
#
# Used to resolve the human-readable name of every unique endpoint in the
# edge set, including external mentors that may lack an English rdfs:label.
# The label service is cheap when the query body is just the VALUES clause.
# =============================================================================
LABELS_TEMPLATE = """
PREFIX wd:       <http://www.wikidata.org/entity/>
PREFIX wdt:      <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd:       <http://www.bigdata.com/rdf#>
PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  ?label
WHERE {
  {{VALUES_BLOCK}}
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language
      "en,de,fr,it,es,nl,ru,pt,ja,zh,ar,he,pl,sv,no,da,fi,cs,hu,ro,tr,ko,el,uk,ca" .
    ?qid rdfs:label ?label .
  }
}
"""


# =============================================================================
# Query 7: Mentor enrichment
#
# Grabs light-weight metadata for the unique non-sculptor endpoints of the
# lineage graph so we can render them as proper nodes (not stubs). We fetch
# birth year, death year, and a single primary occupation label. All three
# are optional so missing values don't drop the row. The label is resolved
# separately via LABELS_TEMPLATE because it uses the label service.
# =============================================================================
MENTOR_META_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (MIN(?b) AS ?birth)
  (MAX(?d) AS ?death)
  (SAMPLE(?gLabel) AS ?gender)
  (SAMPLE(?occLabel) AS ?occupation)
WHERE {
  {{VALUES_BLOCK}}
  OPTIONAL { ?qid wdt:P569 ?b . }
  OPTIONAL { ?qid wdt:P570 ?d . }
  OPTIONAL { ?qid wdt:P21  ?g . ?g rdfs:label ?gLabel . FILTER(LANG(?gLabel) = 'en') }
  OPTIONAL { ?qid wdt:P106 ?occ . ?occ rdfs:label ?occLabel . FILTER(LANG(?occLabel) = 'en') }
}
GROUP BY ?qid
"""


def run_qid_discovery() -> pd.DataFrame:
    """Run the QID discovery query to find all sculptor QIDs."""
    query = QID_DISCOVERY_QUERY.format(min_birth_year=MIN_BIRTH_YEAR)
    return query_sparql(
        query=query,
        cache_path=QID_CACHE_PATH,
        refresh=REFRESH_FROM_WIKIDATA,
    )


def run_node_details(qids: list[str]) -> pd.DataFrame:
    """Pull node details for a list of QIDs."""
    return query_sparql_batched(
        query_template=NODE_DETAILS_TEMPLATE,
        qids=qids,
        cache_path=NODES_RAW_CACHE_PATH,
        refresh=REFRESH_FROM_WIKIDATA,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_movements(qids: list[str]) -> pd.DataFrame:
    """Pull movement labels for a list of QIDs."""
    return query_sparql_batched(
        query_template=MOVEMENTS_TEMPLATE,
        qids=qids,
        cache_path=MOVEMENTS_CACHE_PATH,
        refresh=REFRESH_FROM_WIKIDATA,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_citizenships(qids: list[str]) -> pd.DataFrame:
    """Pull citizenship labels for a list of QIDs."""
    return query_sparql_batched(
        query_template=CITIZENSHIPS_TEMPLATE,
        qids=qids,
        cache_path=CITIZENSHIPS_CACHE_PATH,
        refresh=REFRESH_FROM_WIKIDATA,
        batch_size=VALUES_BATCH_SIZE,
    )


def run_relations(qids: list[str]) -> pd.DataFrame:
    """Pull relationship edges for a list of QIDs.

    Splits P737 (influenced_by) and P1066 (student_of) into two passes
    because the UNION variant was timing out on Wikidata's optimizer.
    Labels are NOT joined here — use run_labels() on the unique endpoint
    QIDs instead so non-English-only entities are preserved.

    Returns a DataFrame with columns: from_qid, to_qid, relation_type.
    """
    needs_refresh = REFRESH_FROM_WIKIDATA or not RELATIONS_CACHE_PATH.exists()
    if not needs_refresh:
        return pd.read_parquet(RELATIONS_CACHE_PATH)

    print("  - Fetching P737 (influenced_by) ...")
    influenced = query_sparql_batched(
        query_template=INFLUENCED_BY_TEMPLATE,
        qids=qids,
        cache_path=None,
        refresh=True,
        batch_size=VALUES_BATCH_SIZE,
    )
    influenced["relation_type"] = "influenced_by"

    print("  - Fetching P1066 (student_of) ...")
    student = query_sparql_batched(
        query_template=STUDENT_OF_TEMPLATE,
        qids=qids,
        cache_path=None,
        refresh=True,
        batch_size=VALUES_BATCH_SIZE,
    )
    student["relation_type"] = "student_of"

    relations = pd.concat([influenced, student], ignore_index=True).drop_duplicates()
    relations.to_parquet(RELATIONS_CACHE_PATH, index=False)
    print(f"✓ Cached: {RELATIONS_CACHE_PATH.name} ({len(relations)} rows)")
    return relations


def run_endpoint_labels(qids: list[str]) -> pd.DataFrame:
    """Fetch labels for arbitrary QIDs with multi-language fallback.

    Used to resolve human-readable names for every unique endpoint in the
    relations graph, including non-English-only entities. Output columns:
    qid_clean, label.
    """
    needs_refresh = REFRESH_FROM_WIKIDATA or not ENDPOINT_LABELS_CACHE_PATH.exists()
    if not needs_refresh:
        return pd.read_parquet(ENDPOINT_LABELS_CACHE_PATH)
    return query_sparql_batched(
        query_template=LABELS_TEMPLATE,
        qids=qids,
        cache_path=ENDPOINT_LABELS_CACHE_PATH,
        refresh=True,
        batch_size=200,
    )


def run_mentor_meta(qids: list[str]) -> pd.DataFrame:
    """Fetch birth, death, gender, and primary occupation for mentor QIDs.

    Used to render external (non-sculptor) mentors as first-class nodes on
    the lineage graph. All fields are optional and may be null.
    Output columns: qid_clean, birth, death, gender, occupation.
    """
    needs_refresh = REFRESH_FROM_WIKIDATA or not MENTOR_META_CACHE_PATH.exists()
    if not needs_refresh:
        return pd.read_parquet(MENTOR_META_CACHE_PATH)
    return query_sparql_batched(
        query_template=MENTOR_META_TEMPLATE,
        qids=qids,
        cache_path=MENTOR_META_CACHE_PATH,
        refresh=True,
        batch_size=150,
    )


def run_all_queries():
    """Run all Wikidata queries in sequence."""
    print("=" * 60)
    print("STEP 1: QID Discovery")
    print("=" * 60)
    qid_df = run_qid_discovery()
    qids = qid_df["qid"].tolist()
    print(f"Found {len(qids)} sculptor QIDs born >= {MIN_BIRTH_YEAR}")
    
    print("\n" + "=" * 60)
    print("STEP 2: Node Details")
    print("=" * 60)
    nodes_df = run_node_details(qids)
    print(f"Pulled details for {len(nodes_df)} sculptors")
    
    print("\n" + "=" * 60)
    print("STEP 3: Movements")
    print("=" * 60)
    movements_df = run_movements(qids)
    print(f"Pulled {len(movements_df)} movement associations")
    
    print("\n" + "=" * 60)
    print("STEP 4: Citizenships")
    print("=" * 60)
    citizenships_df = run_citizenships(qids)
    print(f"Pulled {len(citizenships_df)} citizenship associations")
    
    print("\n" + "=" * 60)
    print("STEP 5: Relations")
    print("=" * 60)
    relations_df = run_relations(qids)
    print(f"Pulled {len(relations_df)} relationship edges")
    
    return {
        "qids": qid_df,
        "nodes_raw": nodes_df,
        "movements": movements_df,
        "citizenships": citizenships_df,
        "relations": relations_df,
    }


if __name__ == "__main__":
    run_all_queries()
