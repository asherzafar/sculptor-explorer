# Sculpture in Data

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
│   ├── config.py      #   endpoints, knobs, min_birth_year, focus list
│   ├── helpers.py     #   SPARQL query, batching, caching, name normalization
│   ├── 01_query_wikidata.py
│   ├── 04_process.py
│   ├── 06_export_json.py
│   └── run_all.py     #   master: run everything in order
├── web/               # Next.js 15 app (App Router, static export)
│   ├── src/app/       #   Routes (/evolution, /explore, /lineage, /about)
│   ├── src/components/#   React + D3 chart components
│   ├── src/lib/       #   Types, data loading, utils
│   └── public/data/   #   JSON files (committed, needed at build time)
├── docs/              # Project documentation
│   ├── ARCHITECTURE.md#   Stack, queries, data sources, JSON schemas
│   ├── DESIGN_SYSTEM.md#  Visual spec: colors, fonts, spacing, charts
│   └── ROADMAP.md     #   Phased plan, MVP scope
├── data/              # Pipeline cache (gitignored)
├── overrides/         # Manual quality corrections (committed)
└── CLAUDE.md          # Quick reference for AI agents
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
| Web framework | Next.js 15 (App Router, static export) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | D3.js (in React wrappers) |
| Fonts | Fraunces (display) + DM Sans (body) |
| Hosting | Vercel (static export) |

## Documentation

| Doc | Covers |
|-----|--------|
| `.windsurfrules` | Critical rules, colors, fonts, Next.js gotchas |
| `docs/DESIGN_SYSTEM.md` | Full visual spec |
| `docs/ROADMAP.md` | Phased plan, MVP scope |
| `docs/ARCHITECTURE.md` | Stack, queries, TypeScript interfaces |
| `CLAUDE.md` | Quick reference for AI agents |
