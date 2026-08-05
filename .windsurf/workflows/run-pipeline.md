---
description: Run and validate the complete Python data pipeline
---

# Run the Sculpture in Data pipeline

Run commands from the repository root. A full source refresh uses Wikidata,
Getty, Met, and AIC network services; do not start one without approval and a
review of the refresh flags in `pipeline/config.py`. Institution refreshes also
query Wikidata. Existing gitignored parquet caches may be reused without a
network refresh.

Set only the source families intended for the run:

- `REFRESH_FROM_WIKIDATA`
- `REFRESH_FROM_INSTITUTIONS`
- `REFRESH_FROM_GETTY`
- `REFRESH_FROM_MET`
- `REFRESH_FROM_AIC`
- `REFRESH_PROCESSING`

## Environment

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r pipeline/requirements.txt
```

## Complete pipeline

```bash
cd pipeline
python3 run_all.py
cd ..
```

`run_all.py` owns this order:

1. Query/cache the Wikidata candidate and enrichment inputs.
2. Query/cache bounded Met and AIC museum results; these remain optional.
3. Generate/cache P69 education, P937 work-location, and institution metadata.
4. Process the source tables, overrides, inclusion signals, and graph metrics.
5. Export the base monolith, slim index, aggregates, and per-QID shards; museum
   `works` are added as an explicit shard-only field here.
6. Query or reuse the Getty cache, regenerate the cross-source audit, then run
   the final-record writer. That writer requires monolith/shard base parity,
   preserves shard-only `works`, and attaches one identical `gettyVerified`
   block to the monolith and matching shard. A Getty/finalization failure makes
   the full pipeline fail rather than silently publishing dormant detail UI.

For an approved institution-only source refresh, run the institution generator
before repeating export and Getty finalization:

```bash
cd pipeline
python3 -m query_institutions
python3 export_json.py
python3 audit_getty.py
cd ..
```

`python3 -m query_institutions` performs a network refresh. If the institution
caches are already authoritative, skip that command and run only the export and
Getty finalization steps. `audit_getty.py` requires the cached
`data/processed/getty_verified.parquet`; `query_getty.py` creates it during a
full run and will use the network if the cache is absent or
`REFRESH_FROM_GETTY` is true.

## Validation and review

```bash
python3 pipeline/test_getty_contracts.py
python3 pipeline/test_data_contracts.py
python3 pipeline/test_institutions.py
python3 pipeline/validate_institutions.py
./scripts/validate.sh
cd web
npm run test:e2e
cd ..
git diff --check
git status --short
git diff --stat
```

Inspect the complete generated-data diff before keeping it. Do not edit files
under `web/public/data/` by hand, invent source results, or treat a successful
export as proof that institution and Getty final-record contracts passed.
