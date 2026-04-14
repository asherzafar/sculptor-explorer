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
        print("STEP 1/4: Querying Wikidata")
        print("=" * 60)
        from query_wikidata import run_all_queries
        query_results = run_all_queries()
        
        # Step 2: Query Museum APIs (optional - uses focus sculptors)
        print("\n" + "=" * 60)
        print("STEP 2/4: Querying Museum APIs (Met + AIC)")
        print("=" * 60)
        try:
            from query_museums import run_museum_queries
            from config import FOCUS_SCULPTOR_NAMES
            museum_results = run_museum_queries(FOCUS_SCULPTOR_NAMES)
            print(f"✓ Queried {len(museum_results['combined'])} museum objects")
        except Exception as e:
            print(f"⚠ Museum query skipped or failed: {e}")
            museum_results = {"combined": []}
        
        # Step 3: Process data
        print("\n" + "=" * 60)
        print("STEP 3/4: Processing data")
        print("=" * 60)
        from process import run_processing
        process_results = run_processing()
        
        # Step 4: Export to JSON
        print("\n" + "=" * 60)
        print("STEP 4/4: Exporting to JSON")
        print("=" * 60)
        from export_json import export_all
        export_results = export_all()
        
        print("\n" + "=" * 60)
        print("PIPELINE COMPLETE!")
        print("=" * 60)
        print(f"✓ Queried {len(query_results['qids'])} sculptor QIDs from Wikidata")
        print(f"✓ Queried {len(museum_results['combined'])} objects from museum APIs")
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
