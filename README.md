# Sculpture in Data

An interactive data explorer for sculpture history — materials, geography, movements, and lineages since 1800. Built from Wikidata, with Met Museum and Art Institute of Chicago APIs planned.

> **Curated list emphasizes the National Sculpture Society tradition.** Not a comprehensive survey of global sculpture. See `overrides/focus_sculptors.csv` for the full list and provenance.

## Quick Start

```bash
cd web && npm install && npm run dev
# Open http://localhost:3000 → redirects to /timeline
```

## Project Structure

```
sculptor-explorer/
├── pipeline/          # Python data pipeline (run locally, rarely)
├── web/               # Next.js app (App Router, static export)
│   ├── src/app/       #   Routes: /timeline (hero), /explore, /lineage, /about
│   └── public/data/   #   JSON from pipeline (committed)
├── overrides/         # Canonical sculptor list + quality corrections
├── docs/              # Deep-dive docs (rationale & patterns)
├── data/              # Pipeline cache (gitignored)
└── .windsurfrules     # Single source of truth for all decisions
```

## Documentation

All current values (colors, fonts, routes, rules) live in **`.windsurfrules`**.

| Doc | Covers |
|-----|--------|
| `.windsurfrules` | **All decisions.** Palette, fonts, routes, coding rules, current phase. |
| `docs/DESIGN_SYSTEM.md` | Design rationale, accessibility, component behavior |
| `docs/ARCHITECTURE.md` | Data flow, SPARQL queries, JSON schemas, TypeScript interfaces |
| `docs/ROADMAP.md` | Phased plan, task status |
| `CLAUDE.md` | AI agent entry point (points to `.windsurfrules`) |

## Data Pipeline

```bash
cd pipeline && pip install -r requirements.txt && python run_all.py
```

Steps: Wikidata SPARQL → enrich & process → export JSON to `web/public/data/`
