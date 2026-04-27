# Roadmap

## Current status: Phase 3a shipped + 3d follow-throughs in flight. Lineage graph now has filters; detail page surfaces multi-citizenship and native names; Explore table shows native scripts.

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

### 3a. Wikidata enrichment — low risk, high yield ✅ COMPLETE
- [x] **Inclusion criteria research + decision** — see `docs/INCLUSION_CRITERIA.md`. Seven-expert stress test produced **Option A.3** (5 signals, drop authority as gate, sitelinks ≥3 non-EN).
- [x] SPARQL queries for **P19 (place of birth)**, **P20 (place of death)**, **sitelinks**, **authority IDs** (ULAN+VIAF+LCNAF+BnF+DNB+NDL+BNE), **P1559 (native name)**.
- [x] **Apply A.3 inclusion filter** in `process.py` — **3,630 sculptors** published (54.2% of 6,700 cache).
- [x] **Schema evolution** — `LegacySculptor` gains `birthPlace`, `birthCountry`, `deathPlace`, `deathCountry`, `nativeName`, `nativeLang`, `authorityTypes[]`, `inclusionSignals[]`, `sitelinkCount`, `nonEnSitelinkCount`, `citizenships[]`. All surfaced on the detail page.
- [x] **Re-export lineage edges** — rewrote relations SPARQL (split P737/P1066, removed EN-only label filter). Result: **147 → 1,418 edges (9.6×)**.
- [x] **External mentors as first-class** — 682 non-sculptor teachers (painters, composers, architects who trained sculptors) now render as diamond nodes on the Lineage graph so cross-media academic training isn't dropped.
- [x] **Aggregations use full 6,700** for honest base rates (`create_movements_by_decade_json` and `create_geography_by_decade_json` receive unfiltered nodes).
- [x] **Transparency page** at `/transparency` — top-line counts, inclusion rule, signal coverage bars, side-by-side Included vs Excluded demographic breakdowns. This is the "Hidden from view" page promised in 3d, built early because the data was already in hand.

### Parking lot — deeper data-ethics analysis (revisit in Phase 4+)
Questions surfaced by Phase 3a analysis but not resolved in this pass:
- Historical-vs-modern country name normalization (Kingdom of Prussia → Germany, etc.) — affects migration story accuracy
- Russian Empire / Soviet Union → Russia vs. Ukraine vs. other successor states
- Could a weighted signal score (instead of binary OR) outperform? Authority↔sitelinks correlation is 0.67
- Softer non-EN sitelinks ranking (top quartile of decade? logarithmic count?) rather than hard ≥3 threshold
- Periodic review of bot-dominated Wikipedias list (currently ceb, war)
- Gender representation: Phase 3a only moved 13% → 14.4% female. What would it take to do better? Is that even a filter question, or a data-source question?

### 3b. Getty ULAN crosswalk — Wikidata cross-reference
- [x] **P245 (ULAN ID) crosswalk** — 2,340 of 3,630 sculptors (64.5%) carry a Wikidata-supplied ULAN ID; no fuzzy match required.
- [x] **Per-record JSON-LD ingest** — `pipeline/query_getty.py` fetches `https://vocab.getty.edu/ulan/{id}.json` (the per-record endpoint, *not* the unstable SPARQL endpoint), with disk cache + politeness throttle. Resume-on-rerun is free. Full ingest: ~17 min, zero failures.
- [x] **Wikidata ↔ Getty audit** — `pipeline/audit_getty.py` produces both `getty_audit.json` (aggregate metrics + spot-check tables) and `getty_compared.parquet` (per-record). Cross-reference badge on detail pages; full audit section on `/transparency`.
- [x] **Schema** — sculptors gain a `gettyVerified` block: Getty's parallel data (label, birth/death year + place, nationality chips) plus per-field agreement flags computed at export time.
- [x] **UI surfaces** — detail page shows a one-line cross-ref status (verified / differs) with a deep link to the Getty record; place data falls back to Getty when Wikidata is missing (rare — only 4 cases in practice).
- [ ] **Activity places (migration view data)** — NOT in the basic JSON-LD record. Would require Getty's SPARQL endpoint (unreliable) or the bulk LOD download (~3GB TTL). Deferred unless we re-prioritise the dedicated migration chart.
- [ ] **License attribution** — ODC-By 1.0, Getty named on About page (pending small About-page touch).

**Honest readout from the audit (live numbers on `/transparency`):**
- Birth-year agreement: **94.6% exact**, 1.9% off-by-1, 3.5% off-by-2+ (Getty has more transcription typos than Wikidata: e.g. Allen Jones = 1837 vs 1937).
- Death-year agreement: **81.9% exact**, with a long tail of "Getty hasn't updated death dates for living artists."
- Birthplace agreement: **69.2%** when both have data — most "disagreements" are transliteration drift (Tehran/Tehrān, Constantine/Qacentina) or city-vs-country granularity differences, not factual disagreements.
- **Wikidata is the larger source by far.** Getty fills 4 birthplace gaps; Wikidata fills 921 the other way. Getty's value here is verification, not coverage.
- Mean nationality Jaccard: **0.62** — partly because Getty uses adjective form (`Dutch`) and Wikidata uses legal-state form (`Kingdom of the Netherlands`); partly because the two model different concepts (cultural attribution vs. citizenship).

### 3c. SAAM (Smithsonian American Art Museum) — biographical narratives
- [ ] Download SAAM LOD dataset (CC0, GitHub)
- [ ] Join via ULAN ID (SAAM also uses ULAN — clean join key) and/or name + birth year
- [ ] Extract biographical narrative text (Great Migration stories, émigré context, etc.)
- [ ] Schema: sculptor gains optional `bio_narrative` field with source attribution
- [ ] Note: this is the better museum-API choice than Met/AIC for our specific story. AIC/Met give us works + materials; SAAM gives us the migration narratives.

### 3d. Data-story UI — surfaces what the new data reveals
Built in increments alongside 3a-c, not saved for the end.
- [x] **Geography chart: source toggle** (citizenship / birth country) live on `/evolution`. Country-of-activity deferred to 3b (Getty ULAN).
- [ ] **Migration view** — per-sculptor birth → residences → death trajectory as a dedicated visualization (Sankey / arc map). The lighter-touch version (born-in / died-in lines + multi-citizenship pills) ships under "Detail page enrichment (phase 2)" below; this slot stays for the richer chart once 3b lands activity-place data.
- [x] **"Hidden from view" page** — shipped as `/transparency`. Owns the included-vs-excluded distribution, signal coverage, and demographic gaps. Regenerates automatically on every pipeline run (standing commitment).
- [x] **Detail page enrichment (phase 1)** — native name with `lang` attribute, birth/death place with country, authority-file chips (ULAN/VIAF/LCNAF/BnF/DNB/NDL/BNE), inclusion-signal chips ("Included because of…").
- [x] **Detail page enrichment (phase 2)** — multi-citizenship pills surface the `citizenships[]` array (831 sculptors with >1 country) so émigré histories don't read as a single flat nationality. Native-name visibility tightened to non-English entries only (echoes of the romanized name suppressed). SAAM narrative snippet remains pending behind 3c.
- [x] **Authority-file chips → outbound links** — chips render as `<a>` to VIAF / ULAN / LCNAF / BnF / DNB / NDL / BNE when the pipeline has a resolved URL; static badges fall through for IDs without a templated URL formatter.
- [x] **Native names on Explore table** — second line under romanization with `lang` attribute; global search now matches native-script forms too (paste "ブランクーシ" → finds Brâncuși).
- [x] **Lineage graph filters** — search-to-focus ego network (1/2/3-hop BFS), connection-type radio, mentor toggle, movement multi-select pills (top 12 by edge count), backbone slider, all URL-backed via `?focus=…&hops=…&mentors=…&edge=…&minDeg=…&mov=…`. Cleared two `.windsurfrules` violations on the page (design tokens, URL state).
- [x] **About page update** — three-tier scope (3,600+ published / 680+ mentors / 48 focus), two Transparency links, data sources list now covers places/lineage/native names/authority IDs.

### 3e. Explicitly deferred to later phases
- Sculpture images from Met/AIC IIIF
- Materials-over-time chart (needs Met/AIC re-ingest — lower priority than migration story)
- Network graph on lineage: **live** (bipartite — sculptor circles + mentor diamonds, 1,418 edges). Deferred: richer non-Wikidata edge sources (Getty, SAAM)
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
