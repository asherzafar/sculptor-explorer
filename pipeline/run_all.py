"""Master script to run all pipeline steps in order."""
import sys


def main():
    """Run all pipeline steps."""
    print("\n" + "=" * 60)
    print("SCULPTOR EXPLORER PIPELINE")
    print("=" * 60)
    
    try:
        # Step 1: Query Wikidata
        print("\n" + "=" * 60)
        print("STEP 1/6: Querying Wikidata")
        print("=" * 60)
        from query_wikidata import run_all_queries
        query_results = run_all_queries()
        
        # Step 2: Query Museum APIs (optional - uses focus sculptors)
        print("\n" + "=" * 60)
        print("STEP 2/6: Querying Museum APIs (Met + AIC)")
        print("=" * 60)
        try:
            from query_museums import run_museum_queries
            from config import FOCUS_SCULPTOR_NAMES
            museum_results = run_museum_queries(FOCUS_SCULPTOR_NAMES)
            print(f"✓ Queried {len(museum_results['combined'])} museum objects")
        except Exception as e:
            print(f"⚠ Museum query skipped or failed: {e}")
            museum_results = {"combined": []}
        
        # Step 3: Query institution and work-location statements. Cached
        # inputs are reused unless the caller explicitly requests refresh.
        print("\n" + "=" * 60)
        print("STEP 3/6: Querying institutions (P69 + P937)")
        print("=" * 60)
        from config import REFRESH_FROM_INSTITUTIONS
        from query_institutions import run_all_institutions
        institution_results = run_all_institutions(
            refresh=REFRESH_FROM_INSTITUTIONS
        )

        # Step 4: Process data
        print("\n" + "=" * 60)
        print("STEP 4/6: Processing data")
        print("=" * 60)
        from process import run_processing
        process_results = run_processing()
        
        # Step 5: Export base JSON and shard-only museum works.
        print("\n" + "=" * 60)
        print("STEP 5/6: Exporting base JSON and shards")
        print("=" * 60)
        from export_json import export_all
        export_results = export_all()

        # Step 6: Getty ULAN cross-reference (Phase 3b) and final records.
        # The export above intentionally writes the base monolith and shards
        # first because works are shard-only. The finalizer validates that
        # base parity, preserves works, and attaches one identical Getty block
        # to both surfaces. Failure is fatal: a "complete" pipeline must not
        # silently publish detail shards without the shipped Getty contract.
        print("\n" + "=" * 60)
        print("STEP 6/6: Getty audit and final sculptor records")
        print("=" * 60)
        from config import REFRESH_FROM_GETTY
        from query_getty import fetch_all
        fetch_all(refresh=REFRESH_FROM_GETTY)
        from audit_getty import run_audit, merge_into_sculptor_outputs
        run_audit()
        merge_into_sculptor_outputs()
        
        print("\n" + "=" * 60)
        print("PIPELINE COMPLETE!")
        print("=" * 60)
        print(f"✓ Queried {len(query_results['qids'])} sculptor QIDs from Wikidata")
        print(f"✓ Queried {len(museum_results['combined'])} objects from museum APIs")
        print(
            "✓ Queried "
            f"{len(institution_results['institution_metadata'])} institution metadata rows"
        )
        print(f"✓ Processed {len(process_results['nodes'])} sculptors")
        print(f"✓ Exported {len(export_results['sculptors'])} notable sculptors to web app")
        
        return 0
        
    except Exception as e:
        print(f"\n✗ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
