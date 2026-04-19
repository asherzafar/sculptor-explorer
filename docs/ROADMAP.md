# Roadmap

## Current status: Phase 2.5 shipped + reviewed by Fabio. Pivoting to data enrichment.

The goal is to get something live and shareable as fast as possible, then iterate with real feedback. Every phase produces a deployable state. Nothing should only work "when the next phase is done."

---

## MVP — Phases 0-2

**Exit criteria:** Fabio can open a URL, see a real chart with real data, search for a sculptor by name, filter by country or era, and share a link that reproduces his view. The design looks intentional. He can give feedback.

### Phase 0: Scaffold + design system ✅ DONE

- [x] Next.js 16 scaffold with TypeScript, Tailwind v4, App Router
- [x] Design tokens: Verdigris & Marble palette, Fraunces + DM Sans fonts in globals.css
- [x] Dark sidebar nav with 4 routes (Timeline hero, Explore, Lineage, About)
- [x] Timeline page with lifespan chart of Fabio's curated sculptors
- [x] Explore page with searchable data table
- [x] Lineage page placeholder
- [x] About page with methodology content
- [x] MobileGate component (<768px "visit on desktop")
- [x] OG meta tags, static export (`output: 'export'`)
- [x] Canonical focus sculptor CSV (`overrides/focus_sculptors.csv`)
- [x] `.gitignore`, `README.md`, `CLAUDE.md`, `.windsurfrules`

### Phase 1: D3 migration + pipeline ✅ COMPLETE

- [x] Rewrite LifespanTimeline chart in D3 (currently hand-rolled SVG)
- [x] Install D3, establish D3+React pattern
- [x] Remove Recharts dependency (stubs for Evolution page)
- [x] Pipeline runs end-to-end: Wikidata → process → tidy JSON export
- [x] Pipeline exports tidy `DecadeAggregation` format (`{decade, category, count}`)
- [x] Regenerate `timeline_sculptors.json` from pipeline (enriched with QIDs)
- [x] Replace hardcoded colors in LifespanTimeline with design tokens
- [x] Explore page: sortable columns, diacritic-insensitive search

### Phase 2: Evolution page + deploy

- [x] Geography-by-decade D3 chart on evolution page
- [x] Movements-by-decade D3 chart on evolution page
- [x] Add Evolution to nav as 5th route (now that it has real charts)
- [x] Filters write to URL params via `useSearchParams()` (decade → `?decade=1920`)
- [x] Decade selector: clicking chart area filters focus sculptors + updates URL
- [x] Deploy to Netlify — https://sculpture-in-data.netlify.app
- [ ] Share with Fabio, collect feedback

---

## Phase 2.5: Polish (post-first-deploy feedback)

Feedback from first live deploy. These are UX/polish fixes, not new features.

### Timeline page
- [x] **Remove border/card wrapper from chart.** ~~The `rounded-lg border bg-card` container around `<LifespanTimeline>` violates the design rule "no borders on charts."~~ Chart now floats in whitespace.
- [x] **Full-width chart.** ~~Remove inner padding that constrains chart width~~ — chart now spans full content column.
- [x] **Bars clickable.** ~~Bars only show tooltip~~ — now clicking a bar navigates to sculptor detail.
- [x] **Heading → chart spacing.** ~~Gap too tight~~ — now `mb-8` (32px) between subtitle and chart.
- [x] **Sort controls.** Added URL-backed sort modes: Chronological (default), Alphabetical, Lifespan.

### Explore page
- [x] **Name link affordance.** ~~Name cells must visually signal clickability~~ — now `text-accent-primary` + `hover:underline` + `cursor-pointer`.
- [x] **Default sort: birth year ascending.** ~~Randomized load order~~ — now defaults to chronological (oldest first).
- [x] **Movement/gender capitalization normalization.** ~~Wikidata supplies inconsistent casing~~ — now handled via `toTitleCase()` and `formatGender()` in `lib/utils.ts`.
- [x] **Zebra striping.** ~~Not yet implemented~~ — now alternating `--bg-primary` / `--bg-secondary`.
- [x] **Row hover cursor.** ~~Should be `cursor-pointer`~~ — now implemented.
- [x] **Table rows clickable.** ~~Only name links~~ — now entire row navigates to sculptor detail.
- [x] **Table outer border removal.** ~~Still has border~~ — search input keeps border (functional), table has no outer border.

### Sculptor detail page (`/explore/[qid]`)
- [x] **Apply formatting utilities.** Now uses `formatDisplayValue()` and `formatGender()` for consistent display.
- [x] **Remove borders from data cards.** ~~Had `border-border-subtle`~~ — now uses `bg-bg-secondary` without borders.
- [x] **Implement the SculptorCard spec from DESIGN_SYSTEM.** ~~Bare 2-column data grid~~ — now uses the full spec: Fraunces 4xl name, lifespan line, movement pill, `citizenship · gender` inline, connections with in/out breakdown, 3 data-completeness dots.
- [x] **External link to Wikidata.** ~~No link out~~ — small `ExternalLink` icon appears top-right on hover, opens `https://www.wikidata.org/wiki/{qid}` in new tab.
- [x] **"Back to explore" preserves search state.** ~~Hard link to /explore~~ — now uses `router.back()` when history exists, falls back to `/explore` for deep links.

### Evolution page
- [x] **Chart hover affordance.** ~~The stacked areas need cursor-pointer~~ — now implemented with subtle hover band (0.08 opacity) on decade hover.
- [x] **Interaction hint.** ~~Subtitle only~~ — now shows dismissible hint with icon: "Click any decade area to filter sculptors".
- [x] **Focus sculptor cards → link to detail page.** ~~Cards not clickable~~ — now wrapped in `<Link>` with hover state.
- [x] **Focus sculptor card polish.** ~~Plain text on white card~~ — now uses `bg-bg-secondary`, hover state, movement pill badge, formatted values.
- [x] **Remove section border wrapper.** ~~Evaluation~~ — section has no border; cards use `bg-bg-secondary` consistent with design system.

### About page
- [x] **Add builder credit.** ~~Credits section omits builder~~ — now "Built by Asher Zafar" with LinkedIn link.
- [x] **Fix stale data source references.** ~~"Met Museum API — Phase 1"~~ — now split into "Current" (Wikidata) and "Planned" sections with no phase numbers.

---

## Phase 3: Data enrichment — the migration/geography story

**Why this, why now.** Looking honestly at the data: the current site shows `citizenship = "United States"` for Brâncuși, Archipenko, Nadelman, Lachaise, Noguchi, Bourgeois — a single flat field that erases the actual migration history of 20th-century sculpture. The canon this site tries to document **is** a migration canon, and we're flattening it. We also silently exclude non-Western sculptors because our "notable" filter requires a Western-art-historical movement label. Before more visual polish, fix the data.

**Themes the data should support after this phase:**
- Where sculptors actually came from vs. where they're attributed
- The non-Western gap — owned honestly, not hidden
- Multi-country lives (residences, activity places over time)
- Native-script names alongside romanizations

**Approach:** interleave data work with visible UI changes so every session produces a deployable increment. Do not disappear into a multi-week pure-data-work tunnel. Learn from each ingest and adjust.

### 3a. Wikidata enrichment — low risk, high yield
- [ ] Add SPARQL queries for **P19 (place of birth)**, **P20 (place of death)**, **P551 (residence)** — single-property queries, should not hit the UNION-query 504s
- [ ] Pull **native-language labels** (sculptor's name in native script) via Wikidata's `rdfs:label` per-language
- [ ] Pull **P172 (ethnic group)** where populated
- [ ] **Audit and fix the "notable sculptor" filter.** Currently `movement != "No movement listed" OR has_edges OR in_focus_list` — all Western-biased criteria. Add: `has non-English Wikipedia sitelink OR has P172 heritage OR has P19 place of birth`. Measure the delta.
- [ ] Schema evolution: sculptor JSON gains `birth_place`, `death_place`, `residences[]`, `native_name`, `heritage[]`
- [ ] **After ingest, look at the data together and decide what UI surfaces first.** Don't commit to a UI design up front.

### 3b. Getty ULAN crosswalk — authoritative nationality & activity data
- [ ] Use Wikidata's **P245 (ULAN ID)** to get the crosswalk for free (no fuzzy-match required)
- [ ] Query Getty's SPARQL endpoint (http://vocab.getty.edu/sparql) in small batches for: nationalities-over-time, verified birth/death places, places of activity
- [ ] Schema: sculptor gains `nationalities[]` array (with source provenance per entry) and `activity_places[]`
- [ ] License: ODC-By 1.0, attribute Getty on About page

### 3c. SAAM (Smithsonian American Art Museum) — biographical narratives
- [ ] Download SAAM LOD dataset (CC0, GitHub)
- [ ] Join via ULAN ID (SAAM also uses ULAN — clean join key) and/or name + birth year
- [ ] Extract biographical narrative text (Great Migration stories, émigré context, etc.)
- [ ] Schema: sculptor gains optional `bio_narrative` field with source attribution
- [ ] Note: this is the better museum-API choice than Met/AIC for our specific story. AIC/Met give us works + materials; SAAM gives us the migration narratives.

### 3d. Data-story UI — surfaces what the new data reveals
Built in increments alongside 3a-c, not saved for the end.
- [ ] **Geography chart: add source toggle** (citizenship / birth country / country of activity). Reveals the migration delta.
- [ ] **Migration view** — per-sculptor birth → residences → death trajectory. Format TBD after seeing data (dot plot, Sankey, arc map — decide based on what looks legible).
- [ ] **"Hidden from view" page** — owns the non-Western gap: what enriched filter surfaced, what's still missing. Meta-chart about the dataset itself.
- [ ] **Detail page enrichment** — native name alongside romanization, heritage pills, residence timeline, SAAM narrative snippet when available
- [ ] **About page update** — new data sources (ULAN, SAAM), explanation of citizenship vs. birth-country distinction

### 3e. Explicitly deferred to later phases
- Sculpture images from Met/AIC IIIF
- Materials-over-time chart (needs Met/AIC re-ingest — lower priority than migration story)
- Network graph on lineage (component built, still waiting for non-Wikidata edge sources)
- Streamgraph toggle
- Export PNG per chart
- Sculptor comparison view

## Phase 4: Visual polish + production

- [ ] **OG preview image** (screenshot of evolution page, 1200×630px) — moved up from previous plan; shareability matters now
- [ ] **Custom domain** (if desired) — credibility infrastructure
- [ ] **Mobile support** — revisit the `MobileGate` decision. If strangers share on phones, gating cuts most traffic. Options: adapt key pages, or keep gate with improved copy.
- [ ] Sculpture images on detail pages (Met/AIC IIIF, public domain only) — the biggest single *emotional* upgrade
- [ ] Performance audit against budget (<3s paint, <5s interactive, <3MB payload)
- [ ] Animation polish: chart transitions (400ms ease-out), page cross-fades
- [ ] Empty-state polish + filter suggestions
- [ ] Inline data degradation messaging ("Movement data unavailable for 12 sculptors")

## Phase 5: Optional — if energy remains

- [ ] Map-based geography view (choropleth by decade) — may displace or complement the current stacked area chart
- [ ] Decade pages (`/decade/1920s`) — editorial narrative with key sculptors, movements, works
- [ ] Movement pages (`/movement/minimalism`) — elevate movements from pills to destinations
- [ ] Curated tours — pre-set lenses ("Women the canon forgot," "From marble to steel")
- [ ] Wikidata-independent lineage via museum provenance records (finally makes the network graph real)

---

## What to build vs. defer — quick reference

| If you're about to build... | MVP? | Notes |
|-----------------------------|------|-------|
| A D3 chart with correct axes and styling | ✅ Yes | Use design tokens from day 1 |
| Rewrite Recharts → D3 | ✅ Phase 1 | Done: LifespanTimeline in D3, Recharts removed |
| Filter sentence + URL params | ✅ Phase 2 | When evolution page gets real charts |
| Searchable data table | ✅ Done | TanStack Table, sortable columns, diacritic-insensitive search |
| About page | ✅ Done | Full content |
| Sidebar nav | ✅ Done | Dark variant, 4 routes (Timeline hero) |
| Materials chart | ❌ Phase 3 | Needs museum API data |
| Network graph | ❌ Phase 3 | Needs more edges to be useful |
| PNG export | ❌ Phase 3 | Design the button placement now, implement later |
| Streamgraph toggle | ❌ Phase 4 | Start with basic stacked area or small multiples |
| Chart animations | ❌ Phase 4 | Get the static version right first |
| Sculpture images | ❌ Phase 5 | Met/AIC IIIF integration |
| ULAN enrichment | ❌ Phase 5 | Separate pipeline step |

## Architecture rules

See `.windsurfrules` for the 8 non-negotiable rules. The key ones that prevent rework across phases:

- **URL state from day 1.** `useSearchParams()` for all filters.
- **D3 for charts from day 1.** No Recharts.
- **Stable JSON schema.** New data adds new files, never changes existing schemas.
- **Design tokens from day 1.** All colors/fonts/spacing use CSS variables.
