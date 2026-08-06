# Architecture

> **Authority:** Start with `AGENTS.md`. Current design and implementation
> values live in `.windsurfrules`; product outcomes live in
> `docs/PROJECT_CHARTER.md`; the graph/temporal and expansion strategy
> lives in `docs/EXPLORATION_STRATEGY.md`; sequencing lives in
> `docs/ROADMAP.md`.
> This document describes **data flow, schemas, and technical patterns**.
> Counts and file sizes are dated audit snapshots, not schema contracts.

## Data flow

```
Pipeline (Python, run locally)          Web App (Next.js, deployed on Vercel)
──────────────────────────              ────────────────────────────────────
Wikidata SPARQL ──┐                     
Met API ──────────┤                     
AIC API ──────────┼── process ──► JSON files ──► route-scoped fetch ──► client
Getty ULAN ───────┤             final records                filter/render + D3
Institutions ─────┤                     │
Overrides CSV ────┘                     └── committed to git
                                            in web/public/data/
```

The deployment is a static export with no runtime application server or
private API. Interactivity is client-side, while Server Components may
run at build time to generate routes. Data is loaded per route; heavy
institution/graph layers are lazy-loaded after opt-in. Do not restore an
“eager-load every JSON file” architecture.

The sculptor export has an explicit two-part write order. `export_json.py`
writes the base monolith and shards, including shard-only museum `works`.
`audit_getty.py` then regenerates the Getty comparison and delegates to the
standard-library final-record writer in `sculptor_records.py`. The writer
requires every shard to equal its monolith record apart from declared
shard-only fields, preserves those extensions, and attaches one identical
`gettyVerified` block to both surfaces. `run_all.py` treats failure of this
stage as a failed pipeline, not an optional loss of detail behavior.

## Tech stack

> Current stack versions and rules: see `.windsurfrules` (tech choices are in § 8 Non-negotiable rules).

Key architectural choices:
- **Static export** (`output: 'export'` in `next.config.ts`). No server, no API. JSON files committed to git.
- **CSS-first tokens** (Tailwind v4). No `tailwind.config.ts` — all tokens in `globals.css`.
- **D3 for charts, React for containers.** D3 operates on refs inside `useEffect`.
- **Pre-aggregated data.** Pipeline does the heavy lifting; web app just renders.

## Graph architecture direction

The domain is graph-shaped, but the deployed product does not need a
runtime graph database today. The current architecture—source caches →
pipeline/analysis → route-specific JSON projections → static client—is
a deliberate fit for the dataset and deployment model.

Generalization should happen in this order:

1. Define an additive, artist-neutral conceptual model for entities,
   roles, events, relationship layers, temporal intervals, source
   assertions, derivations, and confidence.
2. Preserve existing sculpture JSON contracts while generating new
   analytical projections from that model.
3. Prototype real temporal/multilayer questions and measure which
   traversals or provenance queries remain awkward.
4. Pilot one second artistic discipline and test interoperability
   against CIDOC CRM / Linked Art concepts.
5. Only then write an architecture decision comparing property graph,
   RDF/linked-data, and relational/columnar analytical storage using
   representative queries and export benchmarks.

Regardless of storage, public routes receive small purpose-built
projections. Asserted interpersonal relationships, affiliations,
co-presence, similarity, and model-derived links remain separate layers;
time validity and assertion/derivation provenance remain distinct.

## Directory structure

```
sculpture-in-data/
├── AGENTS.md                        # Vendor-neutral agent entry point
├── CLAUDE.md                        # Claude adapter importing AGENTS.md
├── .cursor/rules/project.mdc        # Cursor adapter
├── .github/copilot-instructions.md  # GitHub Copilot adapter
├── README.md
├── .gitignore
│
├── docs/                            # Project documentation
│   ├── PROJECT_CHARTER.md            #   Purpose, outcomes, decisions
│   ├── EXPLORATION_STRATEGY.md        #   Graph/temporal lab + expansion
│   ├── DECISIONS.md                   #   Active decisions + review triggers
│   ├── RESEARCH_FOUNDATIONS.md       #   Evidence → practice standards
│   ├── PROJECT_AUDIT_2026-08-02.md   #   Dated measured audit
│   ├── AGENT_HANDOFF.md              #   Current verified state
│   ├── DESIGN_SYSTEM.md             #   Typography, colors, components, accessibility
│   ├── ROADMAP.md                   #   Priorities, phases, exit gates
│   └── ARCHITECTURE.md              #   This file
│
├── pipeline/                        # Python data pipeline (run locally, rarely)
│   ├── config.py                    #   Endpoints, knobs, focus list, cache paths
│   ├── helpers.py                   #   SPARQL query, batching, caching, normalization
│   ├── query_wikidata.py            #   All 5 SPARQL queries
│   ├── query_museums.py             #   Met + AIC API pulls
│   ├── query_getty.py               #   Getty ULAN JSON-LD ingest
│   ├── query_institutions.py        #   P69/P937 institutional ingest
│   ├── temporal.py                  #   Temporal-envelope inference
│   ├── process.py                   #   Clean, enrich, join, graph metrics
│   ├── export_json.py               #   Write web/public/data/*.json
│   ├── audit_getty.py               #   Getty comparison + finalization input
│   ├── sculptor_records.py           #   Final monolith/shard contract writer
│   ├── test_getty_contracts.py       #   Focused final-record regression tests
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
│   └── medium_taxonomy.csv          #   Medium string → category mapping
│
├── web/                             # Next.js app
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json                #   Tailwind v4: tokens in globals.css, no tailwind.config.ts
│   ├── public/
│   │   └── data/                    #   JSON from pipeline (COMMITTED — small files)
│   │       ├── sculptors.json       #   Full current records
│   │       ├── sculptors_index.json #   Slim route index
│   │       ├── edges.json           #   Person-person lineage
│   │       ├── institutions.json    #   Institutional graph bundle
│   │       ├── migration.json       #   Birth→death flows
│   │       ├── transparency.json    #   Inclusion/coverage metadata
│   │       ├── movements_by_decade.json
│   │       ├── geography_by_decade.json
│   │       └── focus_sculptors.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx           #   Root layout, fonts, nav, meta tags
│       │   ├── page.tsx             #   Client-side redirect to /timeline
│       │   ├── timeline/page.tsx    #   Hero: lifespan timeline of curated sculptors
│       │   ├── evolution/
│       │   │   ├── page.tsx             #   Server Component wrapper with <Suspense>
│       │   │   └── EvolutionContent.tsx #   Client Component: D3 charts, URL decade param
│       │   ├── explore/
│       │   │   ├── page.tsx         #   Suspense wrapper for URL-backed browse
│       │   │   ├── ExploreContent.tsx #  Paginated desktop table/mobile list
│       │   │   ├── explore-state.ts #   Parse/serialize/filter/sort/page contract
│       │   │   └── [qid]/page.tsx   #   Individual sculptor (deep-link)
│       │   ├── lineage/page.tsx     #   Network graph
│       │   ├── migration/page.tsx   #   Birth→death Sankey
│       │   ├── transparency/page.tsx#   Inclusion/coverage audit
│       │   └── about/page.tsx       #   Methodology, sources, credits
│       ├── components/
│       │   ├── ui/                  #   shadcn/ui primitives
│       │   ├── charts/              #   D3 chart components
│       │   │   ├── DecadeStackedArea.tsx  #   Shared stacked area (Geography + Movements)
│       │   │   ├── GeographyChart.tsx     #   Country of birth by decade
│       │   │   ├── MovementsChart.tsx     #   Art movements by decade
│       │   │   ├── MaterialsChart.tsx     #   Museum-works materials
│       │   │   └── LifespanTimeline.tsx   #   Horizontal lifespan bars
│       │   ├── Nav.tsx              #   Sidebar navigation (7 routes)
│       │   ├── MobileNav.tsx        #   Compact navigation
│       │   └── MobileNotice.tsx     #   Dense-view simplified-mode notice
│       ├── lib/
│       │   ├── data.ts              #   Load/parse JSON, React hooks
│       │   ├── types.ts             #   TypeScript interfaces
│       │   └── utils.ts             #   Formatting, color scales, diacritics
│       └── app/
│           └── globals.css          #   Tailwind v4 base + CSS design tokens
│
└── notebook/                        # Original R exploration (reference only)
    └── sculptor_notebook.Rmd
```

## JSON data files

The pipeline writes these to `web/public/data/`. The web app loads them client-side.

| File | Contents | 2026-08-05 artifact snapshot |
|---|---|---|
| `sculptors.json` | Full included sculptor metadata and institution/Getty additions | 3,543 rows, 2,310 Getty-enriched; 8.8MB raw / ~900KB gzip |
| `sculptors/{qid}.json` | Exact full record plus declared shard-only `works` | 3,543 shards; 2,310 Getty-enriched; 34 works across 9 shards |
| `sculptors_index.json` | Slim fields for Explore and default Lineage | 3,543 rows; 770KB raw / ~108KB gzip |
| `edges.json` | P1066/P737 person-person lineage edges with temporal envelopes/reasons | 1,423 rows; 585KB raw / ~54KB gzip |
| `external_mentors.json` | Non-sculptor lineage endpoints | 108KB raw |
| `institutions.json` | Institution/place nodes, rosters, temporal edges, metadata | 1,662 nodes / 5,925 exported edges; 3.0MB raw / ~375KB gzip |
| `migration.json` | Birth→death flows, decade slices, denominators | 520KB raw / ~71KB gzip |
| `movements.json` / `movements_index.json` / `decades.json` | Narrative/entity page aggregates plus compact canonical movement-route index | 164KB / ~5KB / 182KB raw |
| `transparency.json` / `getty_audit.json` | Inclusion, exclusions, relationship/institution coverage, normalization, cross-source audit | 8KB / 12KB raw |
| `focus_sculptors.json` / `timeline_sculptors.json` | Enriched canonical focus list / timeline projection | 48 rows; 182KB / 10KB raw |
| `*_by_decade.json` | Pre-aggregated chart rows | Route-specific, generally small |

**Inclusion filter:** the committed snapshot publishes 3,543 included
sculptors from the wider cache. The exact rule is documented in
`docs/INCLUSION_CRITERIA.md`; current counts and freshness must come
from generated metadata rather than this dated table.

`transparency.json` distinguishes `sourceCandidates` (before evidence-backed
person exclusions), `eligibleCandidates` (after those exclusions and before
A.3), and the legacy compatibility field `totalCached` (equal to
`eligibleCandidates`). Its `release` block is produced from
`overrides/data_release.json`; source-query freshness remains `generatedAt`.

`overrides/person_exclusions.csv` is the evidence-backed compatibility
boundary for source records that the integer-year public schema cannot
represent honestly. The normal pipeline applies it before enrichment and all
aggregations. When parquet caches are unavailable, the bounded
`pipeline/backfill_person_exclusions.py` updates the committed static roster,
dependent aggregates, and published exclusion provenance.

## Data sources

| Source | Endpoint | Auth | Local access pattern |
|---|---|---|---|
| Wikidata | `https://query.wikidata.org/sparql` | None | Batched SPARQL with disk cache and polite delay |
| Met Museum | `https://collectionapi.metmuseum.org/public/collection/v1/` | None | Artist/object API with disk cache |
| Art Institute Chicago | `https://api.artic.edu/api/v1/artworks` | None | Search/object API; ~1 request/sec |
| Getty ULAN | `https://vocab.getty.edu/ulan/{id}.json` | None | Per-record JSON-LD with disk cache and attribution |

Wikidata structured data is CC0; the current Met/AIC open-data and eligible
public-domain image paths are treated as CC0; Getty ULAN is ODC-By 1.0 and is
attributed on About. Commons file licenses vary and remain linked at the file
page. The maintained field/source/license record is
`docs/DATASET_DATASHEET.md`; source-specific terms still apply to the mixed
export.

## SPARQL queries (Wikidata)

**Endpoint:** `https://query.wikidata.org/sparql`
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
  ?sculptor p:P569 ?birthStatement .
  ?birthStatement psv:P569 ?birthValue .
  ?birthValue wikibase:timeValue ?birth ;
              wikibase:timePrecision ?birthPrecision .
  FILTER(?birthPrecision >= 9)
  FILTER(?birth >= '{min_birth_year}-01-01T00:00:00Z'^^xsd:dateTime)
}
```

Precision 9 is year-level; month/day precision is higher. Decade, century, or
broader values are not flattened into fake boundary years. Cache as parquet.

### Query 2: Node details (batched via VALUES on ?qid)

```sparql
SELECT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?qid_clean)
  (SAMPLE(?nameAny) AS ?name)
  (MIN(?b) AS ?birth)
  (MAX(?birthPrecisionRaw) AS ?birth_precision)
  (MAX(?d) AS ?death)
  (MAX(?deathPrecisionRaw) AS ?death_precision)
  (SAMPLE(?genderLabel) AS ?gender)
WHERE {
  {{VALUES_BLOCK}}
  ?qid rdfs:label ?nameAny . FILTER(LANG(?nameAny) IN ('en', 'mul'))
  ?qid p:P569 ?birthStatement .
  ?birthStatement psv:P569 ?birthValue .
  ?birthValue wikibase:timeValue ?b ;
              wikibase:timePrecision ?birthPrecisionRaw .
  FILTER(?birthPrecisionRaw >= 9)
  OPTIONAL {
    ?qid p:P570 ?deathStatement .
    ?deathStatement psv:P570 ?deathValue .
    ?deathValue wikibase:timeValue ?d ;
                wikibase:timePrecision ?deathPrecisionRaw .
    FILTER(?deathPrecisionRaw >= 9)
  }
  OPTIONAL {
    ?qid wdt:P21 ?genderEntity .
    ?genderEntity rdfs:label ?genderLabel . FILTER(LANG(?genderLabel) = 'en')
  }
}
GROUP BY ?qid
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

The variable in `{{VALUES_BLOCK}}` must be `?qid`, the target sculptor. P737
and P1066 run as separate templates because the previous `UNION` plan timed
out. Source endpoints need only be humans: cross-media mentors are intentional
and are exported as `external_mentors.json` rather than silently discarded.

```sparql
SELECT DISTINCT
  (REPLACE(STR(?qid), 'http://www.wikidata.org/entity/', '') AS ?to_qid)
  (REPLACE(STR(?source), 'http://www.wikidata.org/entity/', '') AS ?from_qid)
WHERE {
  {{VALUES_BLOCK}}
  ?qid wdt:P737 ?source . # second pass substitutes P1066
  ?source wdt:P31 wd:Q5 .
}
```

Endpoint labels are fetched in a separate multilingual-fallback query so a
missing English label never removes an edge.

### Batching pattern

All queries except Query 1 use a VALUES block to batch QIDs:

```python
def build_values_block(qids: list[str]) -> str:
    """Returns: VALUES ?qid { wd:Q123 wd:Q456 ... }"""
    values = " ".join(f"wd:{qid}" for qid in qids)
    return f"VALUES ?qid {{ {values} }}"
```

Batch size: 300 QIDs per request. 2s delay between batches.
Template uses `{{VALUES_BLOCK}}` placeholder, replaced at runtime.

## Known data quality issues

1. **Wikidata movement labels are unreliable.** 4 of 15 focus sculptors had wrong labels (e.g., Barbara Hepworth = "Catalan modernism" instead of Unit One/Abstraction-Création). Fix via `overrides/movement_overrides.csv`.
2. **Person-person relations remain sparse and uneven.** The published snapshot has 1,423 P1066/P737 edges plus external mentors; institution hubs add useful structure but do not make the graph a complete record of influence.
3. **Connections chart skews toward French/German academic institutions.** Rümann (91 edges), Falguière (69), Jouffroy (65) are well-documented professors, not necessarily the most influential sculptors. This is institutional documentation density, not art-historical importance.
4. **Met/AIC medium strings require editorial taxonomy.** Strings like “Marble, with traces of paint” are mapped through `overrides/medium_taxonomy.csv`; preserve the source string and audit the mapping rather than treating a classifier output as fact.
5. **"Contemporary art" as a movement label is a catch-all.** It signals incomplete data, not a real movement classification.
6. **Imprecise source dates require an explicit boundary.** `Q87366` exposed the failure mode: Wikidata’s “18th century” value was previously flattened to 1800, creating an impossible 1800–1756 lifespan. Discovery/details now require year precision or better, `process_nodes()` rejects any remaining birth-after-death row, `overrides/person_exclusions.csv` protects old caches, and `pipeline/test_data_contracts.py` verifies the committed public export.

## Focus sculptors

The canonical list lives in **`overrides/focus_sculptors.csv`** (single source of truth). The pipeline reads it at runtime via `config.load_focus_sculptors()`.

Currently 48 sculptors: 39 from Fabio's curated NSS list + 9 additions for broader art history coverage. The CSV tracks `name`, `birth_year`, `death_year`, `source` (fabio/original), and optional `notes`.

To add a sculptor: edit the CSV. The pipeline will pick it up on the next run.

## TypeScript interfaces

The examples below preserve the original core schema for rationale, but
they are no longer the complete contract. The exact current TypeScript
shapes live in `web/src/lib/types.ts`; the producer is
`pipeline/export_json.py`. Verify both before changing a field, and keep
producer, consumers, tests, and this document synchronized.

```typescript
export interface Sculptor {
  qid: string;                    // "Q7325"
  name: string;                   // "Auguste Rodin"
  birth_year: number | null;      // 1840
  death_year: number | null;      // 1917 (null if living)
  gender: string | null;          // source P21 English label; never inferred
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
  min_start: number | null;       // earliest possible start
  max_start: number | null;       // latest possible start
  min_end: number | null;         // earliest possible end
  max_end: number | null;         // latest possible end
  date_source: string | null;     // qualifier | lifespan_intersect | +age_prior
  confidence: string | null;      // high | medium | low (dating only)
  temporal_status: string;        // dated | unavailable
  temporal_reason: string | null; // explicit reason when unavailable
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
export type MaterialsByDecadeJSON = DecadeAggregation[];
export type FocusSculptorsJSON = Sculptor[];               // subset with overrides applied
```

The committed web projection uses camelCase equivalents (`minStart`,
`dateSource`, `temporalStatus`, and so on) for compatibility with the
existing app. P1066/P737 and P69/P937 edges share the six envelope
fields. Known person-person assertions with invalid, missing, or
disjoint endpoint lifespans remain in `edges.json` with null envelope
fields and an explicit `temporalReason`; institutional source rows with
empty intersections are excluded and counted in export/transparency
metadata. Confidence describes temporal precision, not the truth of the
relationship assertion.

Fresh full exports require the gitignored parquet caches. When a
worktree only has the committed static snapshot, run
`python3 pipeline/backfill_relationship_exports.py`; it uses the same
pure helpers as `export_json.py` and preserves the source snapshot’s
`generatedAt` date.

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

Explore keeps `q`, `sort`, `filter`, and `page` as the complete consequential
state contract. Defaults are omitted from the canonical URL, malformed or
duplicate values are reset visibly, and out-of-range pages clamp only after the
3,543-record index loads. Fixed 50-record semantic pages bound DOM and focus
cost while preserving native desktop-table and mobile-list structure; the
movement index continues to decide whether a recorded label is a deterministic
aggregate link or plain text.

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

The pipeline reads this file in `process.py` and replaces the Wikidata movement with the corrected value for these QIDs.

## Data/source expansion candidates

| Source | What it gives us | Access | Priority |
|--------|-----------------|--------|----------|
| **SAAM LOD** | Biographical narratives relevant to migration and Great Migration stories | Free (CC0) | Medium/high after 5Q; validate join/rights and narrative coverage |
| **Met/AIC IIIF widening** | More public-domain works and sculpture images beyond current coverage | Free APIs/IIIF | Medium; coverage, attribution, and interpretive value gate |
| **Europeana API** | 50M+ cultural heritage items from European museums | Free API key | Medium |
| **Additional IIIF institutions** | Standardized image delivery from many museums | Varies | Medium/long term; source/license review required |
| **Wikidata P186** | Material used for specific works | Free (CC0) | Supplemental; measure accuracy/completeness against museum records |

## Exemplary projects (reference, not implementation targets)

- **Harvard Atlas of Economic Complexity** (`atlas.cid.harvard.edu`) — Primary design reference. Linked views, filter sentence, dark sidebar + light content.
- **Google "Museum of the World"** (`britishmuseum.withgoogle.com`) — Timeline of objects across continents/cultures. WebGL.
- **Yale PixPlot** (`dhlab.yale.edu/projects/pixplot`) — UMAP embedding visualization of large image collections. Reference for future embedding scatter feature.
- **The Pudding** (`pudding.cool`) — Visual essay methodology. "Making Internet Things" series on data → narrative → visual.
- **Sigma.js** (`sigmajs.org`) — WebGL network reference. The current graph is D3 force/SVG; consider Canvas/WebGL only when a valuable view exceeds the measured budget after simplification.

## Embedding visualization concept (Phase 5h, evidence-gated)

This is a research sketch, not an active commitment. Works coverage,
rights, reader task, bias analysis, interpretability, and simpler
baselines must pass before implementation.

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
