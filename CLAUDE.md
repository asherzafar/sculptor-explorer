# Sculptor Evolution Explorer — Project Kickoff

## What this is

An interactive web app exploring how sculpture evolved over time — materials, geography, movements, and lineages — built from Wikidata, Met Museum API, and Art Institute of Chicago API data.

The deliverable is an always-on public web app for a friend connected to the National Sculpture Society.

## Tech stack (decided)

| Layer | Tool | Why |
|-------|------|-----|
| Data pipeline | Python (requests, pandas) | HTTP→parse→clean→aggregate→JSON |
| Web framework | Next.js 15 (App Router, static export) | Free Vercel hosting, fast, modern |
| Styling | Tailwind CSS + shadcn/ui | Clean design system |
| Charts | Recharts (standard) + Nivo (Sankey/specialized) | React-native, good defaults |
| Network graph | react-force-graph-2d | Interactive node-link diagrams |
| Data tables | shadcn/ui Table + @tanstack/react-table | Search, sort, filter |
| Hosting | Vercel (free tier) | Always-on, deploys from git push |

## Directory structure

```
sculptor-explorer/
├── .gitignore
├── README.md
├── CLAUDE.md                        # Project conventions for AI agents
│
├── pipeline/                        # Python data pipeline (run locally, rarely)
│   ├── config.py                    #   endpoints, knobs, min_birth_year, focus list
│   ├── 01_query_wikidata.py         #   QID discovery + node/movement/citizenship/relation pulls
│   ├── 02_query_museums.py          #   Met + AIC API pulls
│   ├── 03_query_ulan.py             #   Getty ULAN enrichment (Phase 5, placeholder)
│   ├── 04_process.py                #   clean, enrich, join, graph metrics
│   ├── 05_quality.py                #   movement overrides, AAT filter, notability filter
│   ├── 06_export_json.py            #   write web/public/data/*.json
│   ├── helpers.py                   #   SPARQL query, batching, caching, name normalization
│   ├── requirements.txt
│   └── run_all.py                   #   master: run everything in order
│
├── data/                            # Pipeline cache (gitignored)
│   ├── raw/                         #   direct query result caches (.parquet or .pkl)
│   └── processed/                   #   cleaned, enriched intermediate tables
│
├── overrides/                       # Manual quality corrections (committed to git)
│   ├── movement_overrides.csv       #   focus sculptor movement label fixes
│   └── medium_taxonomy.csv          #   Met/AIC medium string → category mapping
│
├── web/                             # Next.js app
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── public/
│   │   └── data/                    #   JSON files written by pipeline step 06
│   │       ├── sculptors.json
│   │       ├── edges.json
│   │       ├── materials_by_decade.json
│   │       ├── movements_by_decade.json
│   │       ├── geography_by_decade.json
│   │       └── focus_sculptors.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx             #   landing → /evolution
│       │   ├── evolution/
│       │   │   └── page.tsx         #   hero: how sculpture evolved over time
│       │   ├── explore/
│       │   │   ├── page.tsx         #   search, filter, compare sculptors
│       │   │   └── [qid]/
│       │   │       └── page.tsx     #   individual sculptor deep-link
│       │   ├── lineage/
│       │   │   └── page.tsx         #   network graph of influences
│       │   └── about/
│       │       └── page.tsx         #   data sources, methodology, credits
│       ├── components/
│       │   ├── ui/                  #   shadcn/ui primitives
│       │   ├── charts/
│       │   │   ├── MaterialsChart.tsx
│       │   │   ├── MovementsChart.tsx
│       │   │   ├── GeographyChart.tsx
│       │   │   ├── TimelineChart.tsx
│       │   │   └── NetworkGraph.tsx
│       │   ├── SculptorCard.tsx
│       │   ├── SculptorSearch.tsx
│       │   ├── CompareView.tsx
│       │   └── Nav.tsx
│       ├── lib/
│       │   ├── data.ts              #   load + parse JSON, React hooks
│       │   ├── types.ts             #   TypeScript interfaces for all data
│       │   └── utils.ts             #   formatting, color scales, date helpers
│       └── styles/
│           └── globals.css
│
└── notebook/                        # Original R exploration notebook (reference only)
    └── sculptor_notebook.Rmd
```

## Phase 0 — what to build now

Set up the full project scaffold. The pipeline and web app should both exist and work minimally.

### Pipeline (Python)

Create the pipeline directory with all files. For Phase 0, only implement:

1. `config.py` — all configuration:
   - `SPARQL_ENDPOINT = "https://qlever.cs.uni-freiburg.de/api/wikidata"`
   - `MIN_BIRTH_YEAR = 1800`
   - `VALUES_BATCH_SIZE = 300`
   - Focus sculptor list (see below)
   - Cache paths
   - `REFRESH_FROM_WIKIDATA = True` / `REFRESH_PROCESSING = True` flags

2. `helpers.py` — core functions:
   - `query_sparql(query, endpoint, cache_path, refresh)` — POST SPARQL, Accept: text/csv, retry with backoff, cache as parquet
   - `query_sparql_batched(query_template, qids, endpoint, cache_path, refresh, batch_size)` — split QIDs into batches, build VALUES blocks, combine results
   - `build_values_block(qids)` — returns `VALUES ?qid { wd:Q123 wd:Q456 }`
   - `normalize_name(name)` — lowercase, strip diacritics, trim

3. `01_query_wikidata.py` — all SPARQL queries. There are 5 queries:

   **Query 1: QID discovery** (the expensive one, run once)
   ```sparql
   PREFIX wd:  <http://www.wikidata.org/entity/>
   PREFIX wdt: <http://www.wikidata.org/prop/direct/>
   PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
   SELECT DISTINCT
     (REPLACE(STR(?sculptor), 'http://www.wikidata.org/entity/', '') AS ?qid)
   WHERE {
     ?sculptor wdt:P31  wd:Q5 .
     ?sculptor wdt:P106 ?occ .
     ?occ      wdt:P279* wd:Q1281618 .
     ?sculptor wdt:P569 ?birth .
     FILTER(?birth >= '{min_birth_year}-01-01T00:00:00Z'^^xsd:dateTime)
   }
   ```
   This returns ~50K QIDs. Cache it.

   **Query 2: Node details** (batched via VALUES on ?qid)
   ```sparql
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
   ```

   **Query 3: Movements** (batched)
   ```sparql
   SELECT
     (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
     ?movementLabel
   WHERE {
     {{VALUES_BLOCK}}
     ?qid wdt:P135 ?movement .
     ?movement rdfs:label ?movementLabel . FILTER(LANG(?movementLabel) = 'en')
   }
   ```

   **Query 4: Citizenships** (batched)
   ```sparql
   SELECT
     (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
     ?citizenshipLabel
   WHERE {
     {{VALUES_BLOCK}}
     ?qid wdt:P27 ?citizenship .
     ?citizenship rdfs:label ?citizenshipLabel . FILTER(LANG(?citizenshipLabel) = 'en')
   }
   ```

   **Query 5: Relations** (batched — CRITICAL: use ?qid in VALUES AND in the UNION branches)
   ```sparql
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
   ```
   ⚠️ The variable in the VALUES block MUST match the variable used in the query body.
   We use `?qid` everywhere. A previous version used `?sculptor` in the body but `?qid`
   in VALUES, causing a 300x cartesian product (449M rows, crashed R).

   **SPARQL endpoint notes:**
   - Use QLever: `https://qlever.cs.uni-freiburg.de/api/wikidata`
   - Request CSV format: `Accept: text/csv` (NOT TSV — CSV gives clean headers with no `?` prefix, no angle brackets, no `@en` tags, no `^^<datatype>` annotations)
   - No Blazegraph-specific hints (no `hint:Prior hint:rangeSafe true`)
   - No `SERVICE wikibase:label` (use `rdfs:label` + `FILTER(LANG(...)='en')` instead)
   - QLever is fast but public — add 0.5s delay between batches
   - Timeout: 300 seconds
   - User-Agent header: `SculptorExplorer/1.0 (Python/requests)`

4. `04_process.py` — clean and enrich:
   - Parse dates (extract YYYY-MM-DD from strings like "1840-11-12T00:00:00Z")
   - Pick display movement (most frequent label per sculptor)
   - Pick display citizenship (most frequent)
   - Build igraph, compute in_degree/out_degree/total_degree
   - Filter to notable sculptors for the web app (~10-15K)

5. `06_export_json.py` — write JSON files to `web/public/data/`:
   - `sculptors.json` — all notable sculptors with metadata
   - `edges.json` — relationship edges
   - `movements_by_decade.json` — pre-aggregated
   - `geography_by_decade.json` — pre-aggregated
   - `focus_sculptors.json` — enriched focus list

6. `run_all.py` — orchestrate: run steps in order, respect refresh flags

### Web app (Next.js)

Scaffold with `npx create-next-app@latest web --typescript --tailwind --app --src-dir`.

Then:
1. Install dependencies: shadcn/ui, recharts, @tanstack/react-table
2. Set up shadcn/ui with `npx shadcn@latest init`
3. Create the 4 routes: `/evolution`, `/explore`, `/lineage`, `/about`
4. Create `src/lib/types.ts` with TypeScript interfaces for all JSON data
5. Create `src/lib/data.ts` with functions to load JSON from `/data/`
6. Create `src/components/Nav.tsx` — top nav with links to all routes
7. Create a minimal `/evolution` page that loads sculptor data and renders a simple Recharts area chart (geography by decade or any available data)
8. Create placeholder pages for other routes

### Seed data

For Phase 0, create minimal seed JSON files in `web/public/data/` with ~20 hand-picked sculptors so the web app has something to render before the pipeline runs. Use this focus list:

```python
FOCUS_SCULPTORS = [
    "Auguste Rodin",
    "Camille Claudel",
    "Aristide Maillol",
    "Antoine Bourdelle",
    "Constantin Brâncuși",
    "Alexander Archipenko",
    "Henry Moore",
    "Barbara Hepworth",
    "Alberto Giacometti",
    "Isamu Noguchi",
    "Louise Bourgeois",
    "David Smith",
    "Richard Serra",
    "Anish Kapoor",
    "Maya Lin",
    # NSS founders
    "Daniel Chester French",
    "Augustus Saint-Gaudens",
    "Gutzon Borglum",
    "Anna Hyatt Huntington",
]
```

## Key design decisions

- **Pipeline writes JSON to `web/public/data/`**. The web app reads it at build time or client-side. No API server.
- **All interactivity is client-side**. JSON files are ~3MB total, loaded on first visit, then instant.
- **Deep links**: `/explore/Q7325` (sculptor by QID) should work. Use Next.js dynamic routes.
- **Pre-aggregate in the pipeline**. The web app never touches raw data. All decade×category aggregations happen in Python.
- **Notability filter**: Ship ~10-15K sculptors to the web app (has movement OR has edges OR has museum works OR in focus list). Full 48K stays in pipeline cache.

## Data sources

| Source | URL | Auth | Rate limit |
|--------|-----|------|-----------|
| Wikidata (QLever) | `https://qlever.cs.uni-freiburg.de/api/wikidata` | None | Be polite (0.5s between batches) |
| Met Museum API | `https://collectionapi.metmuseum.org/public/collection/v1/` | None | ~80 req/sec |
| AIC API | `https://api.artic.edu/api/v1/artworks` | None | 1 req/sec recommended |
| Getty ULAN | `https://data.getty.edu/vocab/sparql` | None | Unknown, be conservative |

## Known data quality issues

1. **Wikidata movement labels are unreliable.** 4 of 15 focus sculptors had wrong labels (Barbara Hepworth = "Catalan modernism"). Use `overrides/movement_overrides.csv` for focus sculptors.
2. **Relations are sparse for famous sculptors.** Wikidata has 3,864 sculptor-to-sculptor edges total but only 1 among the 15 focus sculptors. Getty ULAN (Phase 5) will help.
3. **Met medium strings need parsing.** Strings like "Marble, with traces of paint" need mapping to clean categories. Will use `overrides/medium_taxonomy.csv`.

## What NOT to build in Phase 0

- Museum API integration (Phase 1)
- ULAN enrichment (Phase 5)
- Material taxonomy (Phase 1)
- Scrollytelling / guided narrative (Phase 2)
- Network graph component (Phase 3)
- Vercel deployment (Phase 4)

## .gitignore

```
# Python
__pycache__/
*.pyc
.venv/
*.egg-info/

# Pipeline cache (too large)
data/

# Node
web/node_modules/
web/.next/

# OS
.DS_Store

# IDE
.idea/
.vscode/
*.swp
```

Note: `web/public/data/*.json` IS committed (small, needed at build time).
Note: `overrides/*.csv` IS committed (auditable quality corrections).

## After Phase 0

Phase 1: Museum APIs (Met + AIC) → materials data → MaterialsChart
Phase 2: Evolution page polish (3 synchronized tracks, decade zoom)
Phase 3: Explore + Lineage views
Phase 4: Deploy to Vercel
Phase 5: ULAN enrichment, images, tours