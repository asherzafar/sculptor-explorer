# Roadmap

## Current status: Phase 4 closed; Phase 5 plan adopted (May 2026).

Project recast: from "ship to first feedback" to "better data, more
interesting visualizations, explorable interactives." Phase 5 plan
lives in `docs/PHASE_5_PLAN.md`; spine is institutional densification
of the lineage graph (P69 probed at 34.3% coverage, 1,084 distinct
institutions, ENSBA/Académie Julian/Bauhaus/ASL as real hubs).

Recently shipped: Phase 4 polish + perf pass — typography drift fixed
on /transparency, slim `sculptors_index.json` cuts /explore and
/lineage payload by ~88% (5.8MB → 745KB), mobile posture verified as
deliberate read-only fallback, country-name normalization (3a
follow-up), migration Sankey, decade/movement narrative pages.

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

### 3a follow-up: country-name normalization ✅ COMPLETE (May 2026)
The migration Sankey turned out to be mostly clean — Wikidata's
place→country resolver already maps to modern states for P19/P20.
The real prize was the singular `citizenship` field used by the
Explore table and detail-page pills.

- [x] **Audit** — `birthCountry`/`deathCountry` are mostly clean (under 30 historical-state hits combined); `citizenships[]` and the singular `citizenship_display` carried ~1,200 records under historical or formal-state labels (Kingdom of the Netherlands, Kingdom of Italy, Russian Empire, Soviet Union, Kingdom of Prussia, etc.).
- [x] **Curate** — `pipeline/data/country_aliases.json`: 43 entries split as 8 Category A (formal-name-to-display, lossless: Kingdom of the Netherlands → Netherlands) + 35 Category B (single-successor historical: Kingdom of Prussia / German Empire / German Reich → Germany). Multi-successor states (Russian Empire, Soviet Union, Czechoslovakia, Yugoslavia variants, Ottoman Empire) deliberately preserved.
- [x] **Apply** — single chokepoint at end of `process_nodes()` in `pipeline/process.py`. New helpers in `pipeline/helpers.py`: `normalize_country`, `normalize_country_list` (element-wise + dedup), `country_alias_stats`. Per-run rewrite counts persisted to `data/processed/country_normalization_counts.json` sidecar so they survive the parquet round-trip into `export_json.py`.
- [x] **Re-export** — every downstream JSON inherits the normalization (sculptors, migration, decades, movements, geography-by-decade, transparency). 1,206 citizenship records rewritten, 331 multi-citizenship list entries collapsed via dedup, 27 birth-country, 2 death-country.
- [x] **Transparency surface** — `/transparency` now renders a "Country names: what we rewrite, what we leave alone" section with category split, per-run record counts, and the full deliberately-not-normalized list.
- [x] **Document** — `docs/COUNTRY_NORMALIZATION.md` covers rationale, category definitions, deliberate non-decisions, and a maintenance procedure for adding new aliases.

**Future enhancement (parked):** disambiguate multi-successor states on a per-record basis using `birth_place` city. Requires a curated city-to-modern-country map and explicit editorial position. Tracked under Phase 4+ "data-ethics analysis."

### Parking lot — deeper data-ethics analysis (revisit in Phase 4+)
Questions surfaced by Phase 3a analysis but not resolved in this pass:
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
- [x] **Migration view** — birth → death country Sankey shipped at `/migration` with decade-slice URL state (`?decade=1880`) and stayed-put toggle (`?stay=1`). Per-flow side panel shows a sample of sculptors per corridor (capped at 12). Activity-place data still deferred behind 3b; the v1 chart uses birth/death countries only.
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

- [x] **Cross-cultural collaboration story** — tri-state `crossesBorders` flag on edges, lineage filter pills + headline stat banner, per-sculptor cross-border count on detail page, transparency section with by-decade breakdown.
- [x] **Portrait images on detail pages** (Wikidata P18 → Wikimedia Commons). 2,303 of 3,630 included sculptors (63%) have a portrait. Floats right of the header block; Commons file-page link for licence/author attribution. Met/AIC IIIF integration for actual sculptures deferred — see below.
- [x] **Per-field coverage on transparency** — birth_place, death_place, native_name, image, authority_links, movement, citizenship.
- [x] **OG preview image** — generated at build time via `app/opengraph-image.tsx` (next/og + Satori). 1200×630, on-brand verdigris accent, headline + 3,630-sculptor subhead. Twitter card set to summary_large_image. metadataBase points at sculptor-explorer.vercel.app.
- [ ] **Custom domain** (if desired) — credibility infrastructure.
- [x] **Mobile posture** — kept as a per-page `<MobileNotice />` on /lineage, /evolution, /migration (the three views that genuinely don't render on a 375px viewport). /, /timeline, /explore, /explore/[qid], /decade, /movement, /about, /transparency all open on phones. This is the read-only fallback pattern, not a hard gate.
- [ ] Sculpture (not portrait) images on detail pages via Met/AIC IIIF, public domain only — separate from the portrait win above; this would surface actual works.
- [x] **Performance audit** — JS bundle 1.2MB (well under the 3MB budget). Main perf win was the heavy `sculptors.json` (5.8MB) being loaded by /explore and /lineage even though both pages only read ~10 fields. Added slim `sculptors_index.json` (745KB, ~88% smaller), wired through `loadSculptorsIndex()` + a new `SculptorIndexEntry` type. `sculptors.json` retained for build-time consumers + per-sculptor shards retained for the detail page.
- [ ] Animation polish: chart transitions (400ms ease-out), page cross-fades.
- [x] Empty-state polish + filter suggestions — shared `<EmptyState>` and `<LoadingState>` components, applied across explore (no-results), evolution (decade filter empties focus list), charts (no-data block), transparency (load error). Replaces 5 ad-hoc loading copy variants.
- [x] Inline data degradation messaging — detail page now shows explicit "No art movement listed on Wikidata" / "Birthplace not recorded" lines instead of silently hiding sections. Death-place absence is suppressed for living sculptors.
- [x] **Page-header consistency** — shared `<PageHeader>` component (title, subtitle, eyebrow, actions slots) applied to all six top-level pages. Fixes `mb-6`/`mb-8` drift, `text-muted-foreground` vs `text-text-secondary` token leakage, and the `max-w-3xl` reading-width that was only on the lineage page. Transparency's "← About" link is now an eyebrow rather than a sibling above the H1.
- [x] **Lineage network map level-up** — movement palette legend (capped at 12 with `+N more`), stronger hover focus (verdigris halo on hovered node, pinned labels for hovered node + neighbours, thicker focus edges), radial-gradient backdrop for atmospheric perspective, translucent pill chrome for stats and legend. Hover-to-focus interaction is now explicit in the hint copy.
- [x] **Design polish sweep (May 2026)** — typography drift caught on /transparency (6 section H2s missing `font-display`, now consistent with /decade, /movement, /migration, /about). Hover-state audit: all interactive surfaces (table rows, links, buttons, sort headers, movement pills, chart labels) carry hover + `transition-colors`. Vertical-rhythm differences across pages are intentional (prose pages use `mb-8`, narrative pages use `mb-10`).

## Phase 5: Densification + explorable interactives

**Project recast (May 2026):** the goal is now "better data, more
interesting visualizations, and explorable interactives." Phases 0–4
produced a credible analytical explorer; Phase 5 takes it from
"credible" to "actually shows you something you couldn't see anywhere
else." Full milestone plan with risks, exit gates, and tests lives in
**`docs/PHASE_5_PLAN.md`**. Discovery measurement (`pipeline/probe_*`
scripts) confirmed the densification thesis: P69 educated_at adds
**3,450 new edges** on top of our current 1,418 lineage edges, with
real hub structure (ENSBA Paris 274 sculptors, Munich Academy 91,
Académie Julian 57, Vienna 57, Düsseldorf 53, Bauhaus / Black Mountain
present too).

- [x] **5a — Discovery and sizing.** Probes against live Wikidata sized P69 (34.3% coverage, 1,084 distinct institutions, 58 hubs with ≥10 sculptors), P937 (27.6%, mixed cities/studios), P361 + P39 (<2%, dead). Decision: ingest P69 + P937, skip the others.
- [ ] **5b — Densify the lineage graph with institutions.** P69 + P937 ingest, third node kind in `<LineageGraph />`, ≥3-sculptor render threshold, perf budget tests.
- [ ] **5c — Time-coded edges and animated lineage.** P580/P582 qualifiers (18% coverage) + birth-year inference fallback, decade scrubber, URL-backed.
- [ ] **5d — Career-trajectory Sankey.** Generalize `/migration` from 2 nodes (born → died) to 4 (born → educated → worked → died). Drops out of 5b + P937.
- [ ] **5e — Coordinated multi-view.** Brush a decade on Timeline → highlight in Lineage / Migration / Geography. The Bret Victor / Distill pattern.
- [ ] **5f — Choropleth map** for `/evolution`. Drops out of existing data; pure UI lift.
- [ ] **5g — IIIF sculpture images.** Met + AIC widened beyond focus list.
- [ ] **5h — Embedding viz** (UMAP/t-SNE on CLIP). Research, gated on 5g.

Each phase has an explicit exit gate that may rewrite the phases
after it. See PHASE_5_PLAN.md for the full plan.

### Already-shipped narrative pages (kept here for inventory)

- [x] Decade pages (`/decade/[year]`) — top countries, top movements, top corridors (deep-link into the Sankey filtered to that decade), notable-sculptor roster, prev/next adjacent-decade nav.
- [x] Movement pages (`/movement/[slug]`) — stat blocks, decade histogram, top countries, peer movements, notable roster. Movement pills on detail and Explore pages link out.

### Folded into Phase 5 plan

- Curated tours ("Women the canon forgot", "From marble to steel") — moved into 5e as an instance of the explorable-interactive pattern (a pre-set selection state shared via URL).
- Wikidata-independent lineage via museum provenance — kept parked. Provenance ingest is a multi-week lift with uncertain payoff once 5b lands the institutional hubs that were the original motivator.

### Institutions, studios, places as first-class nodes — promoted

This was a Phase 4 backlog item. It has been promoted to the spine of
**Phase 5b–5d** after probes confirmed the densification thesis (P69
educated_at: 34.3% coverage, 1,084 distinct institutions, real hub
structure). See `docs/PHASE_5_PLAN.md` for the scoped plan, including
how we'll handle the open design questions originally listed here:

- d3-force perf budget at ~7,700 nodes / ~4,800 edges → **measured** in 5b.0 perf benchmark before the page changes; opt-in toggle if borderline; Canvas/WebGL fallback only if both fail.
- Bipartite vs. tripartite → tripartite (institution = square), with a ≥3-sculptor render threshold to suppress the long tail.
- City vs. country granularity for migration → P937 ingest gates city use behind label disambiguation; corridor view stays country-level until 5d's career-trajectory Sankey.

P361 (part_of) and P39 (position_held) were probed and dropped (<2%
coverage each). They are not on the Phase 5 path.

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
