"""Smoke-test the rewritten relations SPARQL on a tiny batch.

Goal: verify the label service returns real names (not QIDs) and that
edges with non-English-only labels survive. Run directly:

    python test_relations_query.py
"""
from query_wikidata import (
    INFLUENCED_BY_TEMPLATE,
    STUDENT_OF_TEMPLATE,
    LABELS_TEMPLATE,
)
from helpers import build_values_block, query_sparql


def main() -> None:
    # A hand-picked set including sculptors with known non-English mentors
    test_qids = [
        "Q142472",    # Käthe Kollwitz
        "Q30755",     # Auguste Rodin
        "Q168419",    # Henry Moore
        "Q156023",    # Camille Claudel
        "Q157002",    # Constantin Brancusi
        "Q272886",    # Isamu Noguchi
        "Q172508",    # Alexander Calder
    ]
    values = build_values_block(test_qids)

    print(f"Testing P737 with {len(test_qids)} seed QIDs...")
    df_p737 = query_sparql(
        INFLUENCED_BY_TEMPLATE.replace("{{VALUES_BLOCK}}", values),
        cache_path=None, refresh=True, max_attempts=2,
    )
    df_p737["relation_type"] = "influenced_by"

    print(f"Testing P1066 with {len(test_qids)} seed QIDs...")
    df_p1066 = query_sparql(
        STUDENT_OF_TEMPLATE.replace("{{VALUES_BLOCK}}", values),
        cache_path=None, refresh=True, max_attempts=2,
    )
    df_p1066["relation_type"] = "student_of"

    import pandas as pd
    df = pd.concat([df_p737, df_p1066], ignore_index=True).drop_duplicates()
    print(f"\nGot {len(df)} edges")
    print("Columns:", list(df.columns))
    if len(df) == 0:
        return
    print("\nFirst 15 rows:")
    print(df.head(15).to_string())
    print(f"\nUnique source QIDs: {df['from_qid'].nunique()}")
    print(f"Unique target QIDs: {df['to_qid'].nunique()}")

    # Test the label service on unique endpoint QIDs
    unique_qids = sorted(set(df["from_qid"]).union(df["to_qid"]))
    print(f"\nTesting LABELS_TEMPLATE on {len(unique_qids)} unique QIDs...")
    values_labels = build_values_block(unique_qids)
    labels_df = query_sparql(
        LABELS_TEMPLATE.replace("{{VALUES_BLOCK}}", values_labels),
        cache_path=None, refresh=True, max_attempts=2,
    )
    print(f"Got {len(labels_df)} label rows")
    print(labels_df.head(20).to_string())
    missing = set(unique_qids) - set(labels_df["qid_clean"])
    print(f"\nQIDs with no label in any of the 25 configured languages: {len(missing)}")
    if missing:
        print("Examples:", list(missing)[:10])


if __name__ == "__main__":
    main()
