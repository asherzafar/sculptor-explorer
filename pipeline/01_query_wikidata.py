"""Query Wikidata for sculptor data via QLever SPARQL endpoint."""
import pandas as pd
from config import (
    MIN_BIRTH_YEAR,
    QID_CACHE_PATH,
    NODES_RAW_CACHE_PATH,
    MOVEMENTS_CACHE_PATH,
    CITIZENSHIPS_CACHE_PATH,
    RELATIONS_CACHE_PATH,
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
# Query 5: Relations (batched — CRITICAL: use ?qid in VALUES AND in the UNION branches)
# =============================================================================
RELATIONS_TEMPLATE = """
PREFIX wd:   <http://www.wikidata.org/entity/>
PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?to_qid)
  ?sculptorLabel
  (REPLACE(STR(?source), 'http://www.wikidata.org/entity/', '') AS ?from_qid)
  ?sourceLabel
  ?relation_type
WHERE {
  {{VALUES_BLOCK}}
  {
    ?qid wdt:P737 ?source .
    BIND('influenced_by' AS ?relation_type)
  }
  UNION
  {
    ?qid wdt:P1066 ?source .
    BIND('student_of' AS ?relation_type)
  }
  ?source wdt:P31 wd:Q5 .
  ?source wdt:P106 ?sourceOcc .
  ?sourceOcc wdt:P279* wd:Q1281618 .
  ?qid rdfs:label ?sculptorLabel . FILTER(LANG(?sculptorLabel) = 'en')
  ?source rdfs:label ?sourceLabel . FILTER(LANG(?sourceLabel) = 'en')
}
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
    """Pull relationship edges for a list of QIDs."""
    return query_sparql_batched(
        query_template=RELATIONS_TEMPLATE,
        qids=qids,
        cache_path=RELATIONS_CACHE_PATH,
        refresh=REFRESH_FROM_WIKIDATA,
        batch_size=VALUES_BATCH_SIZE,
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
