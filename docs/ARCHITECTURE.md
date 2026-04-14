# Architecture

> **Values source:** All colors, fonts, routes, and current decisions live in `.windsurfrules`.
> This document describes **data flow, schemas, and technical patterns**. Do not duplicate values here.

## Data flow

```
Pipeline (Python, run locally)          Web App (Next.js, deployed on Vercel)
──────────────────────────              ────────────────────────────────────
Wikidata QLever ──┐                     
Met API ──────────┤                     
AIC API ──────────┼── process ──► JSON files ──► static import ──► client-side
Getty ULAN ───────┤                     │                          filter/render
Overrides CSV ────┘                     └── committed to git
                                            in web/public/data/
```

All interactivity is client-side. No server. No API. JSON files load on first visit (~2-3MB), then everything is instant.

## Tech stack

> Current stack versions and rules: see `.windsurfrules` (tech choices are in § 8 Non-negotiable rules).

Key architectural choices:
- **Static export** (`output: 'export'` in `next.config.ts`). No server, no API. JSON files committed to git.
- **CSS-first tokens** (Tailwind v4). No `tailwind.config.ts` — all tokens in `globals.css`.
- **D3 for charts, React for containers.** D3 operates on refs inside `useEffect`.
- **Pre-aggregated data.** Pipeline does the heavy lifting; web app just renders.

## Directory structure

```
sculpture-in-data/
├── CLAUDE.md                        # AI agent conventions (entry point)
├── README.md
├── .gitignore
│
├── docs/                            # Project documentation
│   ├── DESIGN_SYSTEM.md             #   Typography, colors, components, accessibility
│   ├── ROADMAP.md                   #   Phased plan with MVP scope
│   └── ARCHITECTURE.md              #   This file
│
├── pipeline/                        # Python data pipeline (run locally, rarely)
│   ├── config.py                    #   Endpoints, knobs, focus list, cache paths
│   ├── helpers.py                   #   SPARQL query, batching, caching, normalization
│   ├── 01_query_wikidata.py         #   All 5 SPARQL queries
│   ├── 02_query_museums.py          #   Met + AIC API pulls (Phase 3)
│   ├── 03_query_ulan.py             #   Getty ULAN enrichment (Phase 5)
│   ├── 04_process.py                #   Clean, enrich, join, graph metrics
│   ├── 05_quality.py                #   Movement overrides, notability filter
│   ├── 06_export_json.py            #   Write web/public/data/*.json
│   ├── requirements.txt
│   └── run_all.py                   #   Master orchestrator
│
├── data/                            # Pipeline cache (GITIGNORED)
│   ├── raw/                         #   Direct query result caches (.parquet)
│   └── processed/                   #   Enriched intermediate tables
│
├── overrides/                       # Manual quality corrections (COMMITTED)
│   ├── focus_sculptors.csv          #   Canonical focus sculptor list (single source of truth)
│   ├── movement_overrides.csv       #   Focus sculptor movement label fixes
│   └── medium_taxonomy.csv          #   Medium string → category mapping (Phase 3)
│
├── web/                             # Next.js app
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json                #   Tailwind v4: tokens in globals.css, no tailwind.config.ts
│   ├── public/
│   │   └── data/                    #   JSON from pipeline (COMMITTED — small files)
│   │       ├── sculptors.json
│   │       ├── edges.json
│   │       ├── movements_by_decade.json
│   │       ├── geography_by_decade.json
│   │       └── focus_sculptors.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx           #   Root layout, fonts, nav, meta tags
│       │   ├── page.tsx             #   Client-side redirect to /timeline
│       │   ├── timeline/page.tsx    #   Hero: lifespan timeline of curated sculptors
│       │   ├── evolution/page.tsx   #   Aggregate trends (deferred from nav until D3 charts built)
│       │   ├── explore/
│       │   │   ├── page.tsx         #   Search, filter, compare
│       │   │   └── [qid]/page.tsx   #   Individual sculptor (deep-link)
│       │   ├── lineage/page.tsx     #   Network graph
│       │   └── about/page.tsx       #   Methodology, sources, credits
│       ├── components/
│       │   ├── ui/                  #   shadcn/ui primitives
│       │   ├── charts/              #   D3 chart components
│       │   ├── Nav.tsx              #   Sidebar navigation
│       │   ├── FilterSentence.tsx   #   "Showing [X] in [Y] from [Z]"
│       │   ├── SculptorCard.tsx
│       │   ├── SculptorSearch.tsx
│       │   ├── MobileGate.tsx       #   "Visit on desktop" for <768px
│       │   └── ExportButton.tsx     #   PNG export (Phase 3)
│       ├── lib/
│       │   ├── data.ts              #   Load/parse JSON, React hooks
│       │   ├── types.ts             #   TypeScript interfaces
│       │   ├── chart-state.ts       #   Shared chart state hook
│       │   └── utils.ts             #   Formatting, color scales, diacritics
│       └── app/
│           └── globals.css          #   Tailwind v4 base + CSS design tokens
│
└── notebook/                        # Original R exploration (reference only)
    └── sculptor_notebook.Rmd
```

## JSON data files

The pipeline writes these to `web/public/data/`. The web app loads them client-side.

| File | Contents | Est. rows | Est. size |
|------|----------|-----------|-----------|
| `sculptors.json` | Notable sculptor metadata (name, dates, movement, country, gender, degree) | ~10-15K | ~2MB |
| `edges.json` | Influence/teacher edges with labels | ~4K | ~300KB |
| `movements_by_decade.json` | Tidy: `{decade, category, count}` rows | ~500 | ~20KB |
| `geography_by_decade.json` | Tidy: `{decade, category, count}` rows | ~500 | ~20KB |
| `focus_sculptors.json` | Enriched focus list with overrides applied | ~47 | ~15KB |
| `timeline_sculptors.json` | Focus sculptors for lifespan timeline (hero page) | ~47 | ~10KB |
| `materials_by_decade.json` | Tidy: `{decade, category, count}` rows (Phase 3) | ~500 | ~20KB |

**Notability filter:** The pipeline ships ~10-15K "notable" sculptors to the web app (has movement OR has edges OR has museum works OR in focus list). The full ~48K stays in pipeline cache.

## Data sources

| Source | Endpoint | Auth | Rate limit | Phase |
|--------|----------|------|------------|-------|
| Wikidata (QLever) | `https://qlever.cs.uni-freiburg.de/api/wikidata` | None | 0.5s between batches | 0 |
| Met Museum | `https://collectionapi.metmuseum.org/public/collection/v1/` | None | ~80 req/sec | 3 |
| Art Institute Chicago | `https://api.artic.edu/api/v1/artworks` | None | 1 req/sec | 3 |
| Getty ULAN | `https://data.getty.edu/vocab/sparql` | None | Conservative | 5 |

All data sources are free. Met/AIC/Wikidata are CC0. Getty ULAN is ODC-By (attribution required on about page).

## SPARQL queries (Wikidata via QLever)

**Endpoint:** `https://qlever.cs.uni-freiburg.de/api/wikidata`
**Format:** POST, `Accept: text/csv` (NOT TSV)
**No Blazegraph hints.** No `SERVICE wikibase:label`. Use `rdfs:label` + `FILTER(LANG(...)='en')`.

### Query 1: QID discovery (expensive, run once, cache)

```sparql
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

Returns ~50K QIDs. Cache as parquet.

### Query 2: Node details (batched via VALUES on ?qid)

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
  OPTIONAL {
    ?qid wdt:P21 ?genderEntity .
    ?genderEntity rdfs:label ?genderLabel . FILTER(LANG(?genderLabel) = 'en')
  }
}
GROUP BY ?qid ?name
```

### Query 3: Movements (batched)

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

### Query 4: Citizenships (batched)

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

### Query 5: Relations (batched)

⚠️ **CRITICAL:** The variable in `{{VALUES_BLOCK}}` MUST be `?qid` — the same variable used in the query body. A previous version used `?sculptor` in the body but `?qid` in VALUES, causing a cartesian product (449M rows).

⚠️ **CRITICAL:** The source sculptor filter (`?sourceOcc wdt:P279* wd:Q1281618`) is REQUIRED. Without it, the query returns all influences (painters, architects, etc.) producing 2GB+ results.

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

### Batching pattern

All queries except Query 1 use a VALUES block to batch QIDs:

```python
def build_values_block(qids: list[str]) -> str:
    """Returns: VALUES ?qid { wd:Q123 wd:Q456 ... }"""
    values = " ".join(f"wd:{qid}" for qid in qids)
    return f"VALUES ?qid {{ {values} }}"
```

Batch size: 300 QIDs per request. 0.5s delay between batches.
Template uses `{{VALUES_BLOCK}}` placeholder, replaced at runtime.

## Known data quality issues

1. **Wikidata movement labels are unreliable.** 4 of 15 focus sculptors had wrong labels (e.g., Barbara Hepworth = "Catalan modernism" instead of Unit One/Abstraction-Création). Fix via `overrides/movement_overrides.csv`.
2. **Relations are sparse for famous modern sculptors.** Wikidata has ~3,864 sculptor-to-sculptor edges total but only 1 among the focus list. Getty ULAN (Phase 5) will help.
3. **Connections chart skews toward French/German academic institutions.** Rümann (91 edges), Falguière (69), Jouffroy (65) are well-documented professors, not necessarily the most influential sculptors. This is institutional documentation density, not art-historical importance.
4. **Met/AIC medium strings need parsing.** Strings like "Marble, with traces of paint" need mapping to clean categories via Claude API classification → `overrides/medium_taxonomy.csv`.
5. **"Contemporary art" as a movement label is a catch-all.** It signals incomplete data, not a real movement classification.

## Focus sculptors

The canonical list lives in **`overrides/focus_sculptors.csv`** (single source of truth). The pipeline reads it at runtime via `config.load_focus_sculptors()`.

Currently 47 sculptors: 38 from Fabio's curated NSS list + 9 additions for broader art history coverage. The CSV tracks `name`, `birth_year`, `death_year`, `source` (fabio/original), and optional `notes`.

To add a sculptor: edit the CSV. The pipeline will pick it up on the next run.

## TypeScript interfaces

These are the exact shapes of the JSON files the web app loads. Implement in `src/lib/types.ts`.

```typescript
export interface Sculptor {
  qid: string;                    // "Q7325"
  name: string;                   // "Auguste Rodin"
  birth_year: number | null;      // 1840
  death_year: number | null;      // 1917 (null if living)
  gender: string | null;          // "male" | "female" | null
  movement: string | null;        // display movement (most frequent label)
  citizenship: string | null;     // display citizenship (most frequent)
  birth_decade: number;           // 1840
  in_degree: number;              // incoming influence/student edges
  out_degree: number;             // outgoing edges
  total_degree: number;           // in + out
  is_focus: boolean;              // in the focus sculptor list
}

export interface Edge {
  from_qid: string;               // "Q7325"
  from_name: string;              // "Auguste Rodin"
  to_qid: string;                 // "Q156458"
  to_name: string;                // "Camille Claudel"
  relation_type: string;          // "influenced_by" | "student_of"
}

export interface DecadeAggregation {
  decade: number;                 // 1840
  category: string;               // movement name, country name, or material
  count: number;                  // number of sculptors or works
}

// JSON file shapes
export type SculptorsJSON = Sculptor[];
export type EdgesJSON = Edge[];
export type MovementsByDecadeJSON = DecadeAggregation[];
export type GeographyByDecadeJSON = DecadeAggregation[];
export type MaterialsByDecadeJSON = DecadeAggregation[];  // Phase 3
export type FocusSculptorsJSON = Sculptor[];               // subset with overrides applied
```

## Next.js static export

For Vercel deployment as a purely static site (no server-side rendering), `next.config.ts` must include:

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,  // required for static export
  },
};

export default nextConfig;
```

This means:
- No `getServerSideProps`, no API routes, no server components that fetch at request time
- All data loading happens client-side via `fetch('/data/sculptors.json')`
- Images use standard `<img>` tags, not Next.js `<Image>` optimization
- The build produces an `out/` directory of static HTML/CSS/JS that Vercel serves from CDN

### Critical: useSearchParams requires Suspense

With `output: 'export'`, any component using `useSearchParams()` MUST be a Client Component wrapped in a `<Suspense>` boundary. Without this, `next build` fails with "useSearchParams() should be wrapped in a suspense boundary." This is the #1 build failure developers hit.

**Required pattern:**
```typescript
// app/evolution/page.tsx (Server Component — no 'use client')
import { Suspense } from 'react';
import { EvolutionContent } from './EvolutionContent';

export default function EvolutionPage() {
  return (
    <Suspense fallback={null}>
      <EvolutionContent />
    </Suspense>
  );
}
```

```typescript
// app/evolution/EvolutionContent.tsx (Client Component)
'use client';
import { useSearchParams } from 'next/navigation';

export function EvolutionContent() {
  const searchParams = useSearchParams();
  const country = searchParams.get('country') ?? 'all';
  // ... all filter logic and chart rendering here
}
```

Every page that reads URL params needs this split: a thin Server Component page.tsx that wraps the real content in Suspense.

### Landing redirect

Static export doesn't support `redirect()` in server components. Use client-side redirect in `app/page.tsx` (see `.windsurfrules` § Landing redirect for the pattern and current target route).

## D3-React integration pattern

Use the "D3 renders into a React ref" pattern. This is the simplest approach and closest to ggplot's mental model — one function configures the entire chart.

```typescript
'use client';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface ChartProps {
  data: DecadeAggregation[];
  width?: number;
  height?: number;
}

export function GeographyChart({ data, width = 800, height = 400 }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 40, right: 20, bottom: 48, left: 56 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales, axes, shapes — all D3, all in this function
    // Colors come from CSS variables: getComputedStyle(document.documentElement).getPropertyValue('--data-1')
    // This is the ggplot-equivalent: you tune margins, tick formatting, colors, opacity here

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

**Key points:**
- React owns the `<svg>` element and passes data as props
- D3 does ALL rendering inside `useEffect` — scales, axes, shapes, transitions
- Clear and redraw on data change (`svg.selectAll('*').remove()`)
- Read design token colors from CSS variables, not hardcoded hex
- The developer tunes D3 parameters directly (margin, tickPadding, opacity) — same mental model as ggplot `theme()`

## Movement overrides

The file `overrides/movement_overrides.csv` corrects known-wrong Wikidata movement labels for focus sculptors:

```csv
qid,name,wikidata_movement,corrected_movement,source
Q233580,Barbara Hepworth,Catalan modernism,British Constructivism,"Unit One co-founder; Abstraction-Création member (Tate, Wikipedia)"
Q156458,Camille Claudel,Expressionism,Symbolism,"Rodin circle; Impressionist/Symbolist (Wikipedia, Musée Camille Claudel)"
Q151679,Henry Moore,contemporary art,British Modernism,"Unit One; biomorphic abstraction (Tate, TheArtStory)"
Q159409,Louise Bourgeois,abstract expressionism,Feminist art / Surrealism,"Not AbEx; confessional/surrealist practice (MoMA, Guggenheim)"
```

The pipeline reads this file in `05_quality.py` and replaces the Wikidata movement with the corrected value for these QIDs.

## Future data sources (researched, not yet integrated)

| Source | What it gives us | Access | Priority |
|--------|-----------------|--------|----------|
| **Getty ULAN** | 293K+ artists with teacher/student/influence relationships. SPARQL at `vocab.getty.edu/sparql` | Free (ODC-By) | High — transforms lineage graph |
| **Wikidata P18** | Wikimedia Commons image URL for ~40% of sculptors | Free (CC0) | Low — images deferred |
| **Europeana API** | 50M+ cultural heritage items from European museums | Free API key | Medium |
| **IIIF** | Standardized image serving from Met, AIC, and 100+ museums | Free | Low — when images needed |
| **Wikidata P186** | Material used for specific works (marble, bronze, etc.) | Free (CC0) | Medium |

## Exemplary projects (reference, not implementation targets)

- **Harvard Atlas of Economic Complexity** (`atlas.cid.harvard.edu`) — Primary design reference. Linked views, filter sentence, dark sidebar + light content.
- **Google "Museum of the World"** (`britishmuseum.withgoogle.com`) — Timeline of objects across continents/cultures. WebGL.
- **Yale PixPlot** (`dhlab.yale.edu/projects/pixplot`) — UMAP embedding visualization of large image collections. Reference for future embedding scatter feature.
- **The Pudding** (`pudding.cool`) — Visual essay methodology. "Making Internet Things" series on data → narrative → visual.
- **Sigma.js** (`sigmajs.org`) — WebGL network graph library. Candidate to replace `react-force-graph-2d` when lineage graph scales.

## Embedding visualization concept (Phase 3-4)

A "Sculpture Space" where every sculptor is a 2D point, clustered by similarity:

```
Sculptor metadata (movement, era, geography, degree centrality, gender)
  → Feature encoding (one-hot categoricals + normalized numerics)
  → Gower distance or cosine distance on encoded features
  → UMAP projection to 2D
  → JSON [{qid, x, y, name, movement, ...}]
  → D3 or deck.gl scatter plot
```

Open questions:
- ~60% of sculptors lack movement labels. How to handle NaN in feature space?
- Distance metric: Gower (handles mixed types natively) vs. one-hot + cosine?
- Evaluation: how to assess if clusters are meaningful vs. reflecting documentation density?
- Later: CLIP image embeddings (multimodal) once sculpture images are available.

