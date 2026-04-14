# Sculptor Evolution Explorer

An interactive web app exploring how sculpture evolved over time — materials, geography, movements, and lineages — built from Wikidata, Met Museum API, and Art Institute of Chicago API data.

## Quick Start

```bash
# 1. Start the web app (dev server)
cd web && npm run dev

# 2. Open http://localhost:3000
```

## Project Structure

```
sculptor-explorer/
├── pipeline/          # Python data pipeline (run locally, rarely)
│   ├── config.py    #   endpoints, knobs, min_birth_year, focus list
│   ├── helpers.py   #   SPARQL query, batching, caching, name normalization
│   ├── 01_query_wikidata.py
│   ├── 04_process.py
│   ├── 06_export_json.py
│   └── run_all.py   #   master: run everything in order
├── web/               # Next.js app
│   ├── src/app/       #   Routes (/evolution, /explore, /lineage, /about)
│   ├── src/components/#   React components
│   ├── src/lib/       #   Types, data loading, utils
│   └── public/data/   #   JSON files (committed, needed at build time)
├── data/              # Pipeline cache (gitignored)
├── overrides/         # Manual quality corrections (committed)
└── CLAUDE.md          # Project conventions for AI agents
```

## Data Pipeline

The pipeline is in Python and runs locally (rarely). It fetches data from Wikidata and exports JSON to `web/public/data/`.

```bash
cd pipeline
pip install -r requirements.txt
python run_all.py
```

**Pipeline steps:**
1. `01_query_wikidata.py` — Discover sculptor QIDs, pull details, movements, citizenships, relations
2. `04_process.py` — Clean, enrich, compute graph metrics
3. `06_export_json.py` — Export to JSON for web app

## Tech Stack

| Layer | Tool |
|-------|------|
| Data pipeline | Python (requests, pandas, networkx) |
| Web framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Data tables | @tanstack/react-table |

## Documentation

- `CLAUDE.md` — Project conventions for AI agents
- `ROADMAP.md` — Phase-by-phase development plan
- `.windsurf/workflows/` — Workflow files for common tasks

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 0 | ✅ | Project scaffold, Python pipeline, Next.js app with seed data |
| Phase 1 | ✅ | Museum APIs (Met + AIC) → materials data → MaterialsChart |
| Phase 2 | ✅ | Evolution page polish (3 synchronized tracks, decade zoom) |
| Phase 3 | ⏳ | Lifespan Timeline hero (Fabio's curated list, horizontal bars) |
| Phase 4 | ⏳ | Explore + Lineage views (network graph, search) |
| Phase 5 | ⏳ | Polish + Deploy (Vercel, social sharing export) |
| Phase 6 | ⏳ | ULAN enrichment, images, guided tours |
