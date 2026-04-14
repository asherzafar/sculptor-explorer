# Sculptor Evolution Explorer — Roadmap

This document tracks the phased development of the project.

## Phase 0 — Project Scaffold ✅

**Goal:** Full directory structure, working Python pipeline, working Next.js app with seed data.

- [x] Create directory structure (pipeline/, data/, web/, overrides/)
- [x] Set up Python pipeline (config.py, helpers.py, 01_query_wikidata.py, 04_process.py, 06_export_json.py, run_all.py)
- [x] Scaffold Next.js app with TypeScript, Tailwind, App Router
- [x] Set up shadcn/ui
- [x] Install recharts and @tanstack/react-table
- [x] Create seed JSON data files (~19 focus sculptors)
- [x] Build Nav component
- [x] Create 4 route placeholders (/evolution, /explore, /lineage, /about)
- [x] Build minimal /evolution page with Recharts
- [x] Create .gitignore and README.md
- [x] Create ROADMAP.md and documentation standards
- [x] Verify npm run dev works

## Phase 1 — Museum APIs ✅

**Goal:** Integrate Met Museum API and Art Institute of Chicago API for materials data.

- [x] Create 02_query_museums.py
- [x] Implement Met Museum API client (search by artist, fetch objects)
- [x] Implement AIC API client
- [x] Build medium_taxonomy.csv for string → category mapping
- [x] Aggregate materials by decade
- [x] Export materials_by_decade.json
- [x] Build MaterialsChart component

## Phase 2 — Evolution Page Polish ✅

**Goal:** Three synchronized tracks with decade zoom.

- [x] Synchronized brushing across geography, movements, and materials charts
- [x] Decade zoom (filter all charts to a selected decade)
- [x] Add key historical events (NSS founded 1893, Armory Show 1913, etc.)
- [x] Add timeline annotations

## Phase 3 — Lifespan Timeline (Hero) ⏳

**Goal:** Build the core visualization Fabio needs — a lifespan bar chart showing when notable sculptors lived.

**Context:** Fabio (NSS) provided a curated list of 38 sculptors. The hero visualization shows each sculptor as a horizontal bar from birth to death, color-coded by birth decade, with historical event markers.

- [ ] Ingest `sculptors_timeline.csv` (Fabio's curated list)
- [ ] Create seed `timeline_sculptors.json` for web app
- [ ] Build `LifespanTimeline` component (horizontal bars, birth decade colors)
- [ ] Add historical event markers (NSS 1893, Armory Show 1913, WWI, WWII)
- [ ] Add hover/click popover for sculptor details
- [ ] Make this the new landing page hero
- [ ] Responsive layout (works on mobile for social sharing)

**Design decisions (from Fabio feedback):**
- Movement labels are **optional** — not shown by default on timeline
- Age-at-death is **excluded** — not a story we want to tell
- Simplicity first — clean, beautiful, shareable
- Both representational and abstract sculptors included intentionally

## Phase 4 — Explore + Lineage Views ⏳

**Goal:** Interactive search, filter, compare, and network visualization.

- [ ] Build SculptorSearch component with autocomplete
- [ ] Build data table with @tanstack/react-table
- [ ] Add filter by movement, citizenship, decade
- [ ] Build CompareView for side-by-side sculptor comparison
- [ ] Integrate react-force-graph-2d for lineage visualization
- [ ] Add interactive node highlighting
- [ ] Deep-link support for /explore/[qid]

## Phase 5 — Polish + Deploy ⏳

**Goal:** Always-on public web app, shareable on social media.

- [ ] SVG/PNG export for social sharing
- [ ] Configure next.config.ts for static export
- [ ] Set up Vercel project
- [ ] Performance optimization
- [ ] About page with NSS context and credits

## Phase 6 — ULAN Enrichment ⏳

**Goal:** Enhanced relationship data via Getty ULAN.

- [ ] Create 03_query_ulan.py
- [ ] Implement Getty ULAN SPARQL client
- [ ] Reconcile sculptor QIDs to ULAN IDs
- [ ] Fetch additional influence/student relationships
- [ ] Export enriched edges.json
- [ ] Update lineage visualization

## Data Quality Improvements

- [ ] Create movement_overrides.csv for focus sculptor corrections
- [ ] Build automated quality audit in 05_quality.py
- [ ] Add notability filter (Phase 0: basic, Phase 6: refined)

## Future Ideas (Post-Phase 6)

- Image gallery per sculptor
- Guided scrollytelling tours
- 3D sculpture viewer integration
- Mobile app (React Native)
- RSS feed for new discoveries
