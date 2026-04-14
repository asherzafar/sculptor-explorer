---
description: Run the Python data pipeline to fetch fresh Wikidata
---

# Run the Sculptor Data Pipeline

This workflow fetches fresh sculptor data from Wikidata via the SPARQL endpoint (`query.wikidata.org`).

## Prerequisites

1. Python 3.10+ installed
2. Virtual environment (optional but recommended)

## Steps

1. Navigate to the pipeline directory
   ```bash
   cd /Users/asherzafar/Documents/PersonalCode/sculptor-explorer/pipeline
   ```

2. Install dependencies (first time only)
   ```bash
   pip install -r requirements.txt
   ```

3. Run the full pipeline
   // turbo
   ```bash
   python run_all.py
   ```

4. Verify JSON files were created in `web/public/data/`
   ```bash
   ls -la /Users/asherzafar/Documents/PersonalCode/sculptor-explorer/web/public/data/
   ```

## What the pipeline does

- **Step 1:** Discovers all sculptor QIDs born since 1800 from Wikidata
- **Step 2:** Pulls node details (name, birth/death dates, gender)
- **Step 3:** Pulls movement labels
- **Step 4:** Pulls citizenships
- **Step 5:** Pulls influence/student relationships
- **Step 6:** Cleans and enriches data, computes graph metrics
- **Step 7:** Exports JSON files for the web app

## Refresh flags

Edit `pipeline/config.py` to control refresh behavior:
- `REFRESH_FROM_WIKIDATA = True` — Re-run SPARQL queries (slow)
- `REFRESH_PROCESSING = True` — Re-run cleaning/enrichment (fast)

## Expected output

The pipeline creates:
- Cache files in `data/raw/` (parquet format)
- Processed files in `data/processed/` (parquet format)
- JSON exports in `web/public/data/` (read by web app)
