# Roadmap

## Current status: Getty contract repaired after 5Q.4a; Explore next (August 2026)

**North star:** help people explore and explain how artists,
institutions, places, movements, works, and practices shape one another
over time—beginning with sculpture—while making the limits of the
underlying data visible and auditable. The full outcome model and
decision scorecard live in `docs/PROJECT_CHARTER.md`; the experimental,
graph, temporal, and expansion strategy lives in
`docs/EXPLORATION_STRATEGY.md`; research standards live in
`docs/RESEARCH_FOUNDATIONS.md`; the measured inheritance audit lives in
`docs/PROJECT_AUDIT_2026-08-02.md`.

Phase 5's detailed technical plan lives in `docs/PHASE_5_PLAN.md`;
the current agent-neutral continuation state lives in
`docs/AGENT_HANDOFF.md`. Institutional densification
is implemented through 5b.5: `/lineage` can opt into square institution
hubs via `?nodes=sculptor,institution`, while the default route keeps
institutions off for first-paint performance. Person-person and
institution edges now share the temporal envelope contract, and
`/transparency` reports coverage, confidence, skipped intersections,
and educational concentration.

The Getty detail contract is also repaired in the current release candidate.
The final pipeline stage now validates the full-record/shard base, preserves
the shard-only `works` extension, and writes one identical `gettyVerified`
block to both surfaces. The current 3,543-record snapshot contains 2,310
Getty-enriched records in the monolith and the same 2,310 detail shards; the
audit denominator was regenerated after the `Q87366` exclusion instead of
retaining the stale 2,311-record figure.

Implemented in the current release candidate: Phase 5b.3–5b.5
institutional/temporal graph work — P69/P937
institution data exports to `institutions.json`, sculptor shards carry
institution chips/edges, and `LineageGraph` renders opt-in institution
hubs with tuned force settings. The institution bundle lazy-loads only
after opt-in, preserving the default lineage payload. Phase 5b.5 dated
1,372 of 1,423 person-person edges while retaining 51 undatable links
with explicit reasons; institution links cover 2,393 of 3,543 published
sculptors. Phase 4's scoped
polish work shipped—typography drift fixed on /transparency, slim
`sculptors_index.json` cuts /explore and /lineage payload by ~88%
(5.8MB → 745KB), country-name normalization (3a follow-up), migration
Sankey, and decade/movement narrative pages. Phase 5Q intentionally
reopens cross-cutting quality where the August audit found the earlier
mobile, accessibility, state, and performance posture insufficient.

The project now has enough production surface area to learn from, but
experimentation remains an explicit goal. The governing strategy uses
two connected tracks: finish the temporal/provenance substrate and make
the public explorer understandable and trustworthy, while running
isolated, time-boxed lab experiments that help discover better
questions and methods. Every production phase must leave a deployable
state; no public feature should depend on an unbuilt future phase.

## Priority order

| Horizon | Priority | Outcome |
|---|---|---|
| Completed | **5b.5 temporal backfill + transparency** | Shared edge-confidence substrate landed without changing default graph behavior. |
| Completed | **Node 24 + dependency/security closeout** | Runtime drift is resolved; the dependency sequence and transitive advisory closeout landed with exact-head CI/preview/production proof, zero open GitHub alerts, and zero npm audit findings. |
| Completed | **Getty monolith/shard contract repair** | A deterministic final-record stage restores 2,310 detail badges/fallback records, preserves works, and makes audit/output parity a CI invariant. |
| Now | **5Q.4b Explore route slice** | Use the closed 5Q.4a evidence baseline to fix Explore state/scale, mobile equivalence, accessibility, and performance as the first end-to-end route pattern. |
| Parallel | **Exploration lab** | Prototype temporal ego journeys, relationship layers, communities, and institution/city biographies without creating production debt. |
| After 5Q | **Findability and connective tissue** | Prefer institution pages, global search, coordinated links/URL state, and curated entry points when evidence supports them. |
| Medium term | **Works, story depth, and neutral semantics** | Widen IIIF/works data, narratives, comparison, versioned downloads, and an additive artist-neutral graph model. |
| Long term | **Evidence-gated expansion** | Pilot one second artistic discipline; pursue advanced temporal/multilayer views and renderer/database changes only when real questions justify them. Embeddings remain last. |

This order deliberately pauses feature densification after 5b.5. The
August audit found stale project truth, failing lint, untriaged
dependency risk, an impossible lifespan record, no CI/web tests,
inconsistent SVG accessibility, incomplete URL state, mobile clipping,
and little user evidence. Phase 5b.5 repaired lint; the 5Q reliability/data
slice added CI, a root validation gate, static invariants, and the precision
fix/exclusion; 5Q.3 added the maintained datasheet/claim register and public
claim context. Accessibility, mobile equivalence, performance, and user
evidence still precede new production nodes.
Adding nodes before resolving them
would increase visual and maintenance complexity faster than reader
value.

## Parallel exploration track

Phase 5Q pauses new **production** complexity, not creative research.
Lab experiments may proceed when they follow
`docs/EXPLORATION_STRATEGY.md`, remain isolated from public routes and
contracts, and end with a reproducible learning note plus an explicit
continue/simplify/archive decision.

Initial queue:

1. Temporal ego journey for one well-documented artist, institution,
   and city; compare small multiples/event bands with animation.
2. Separate lineage layers for documented interpersonal relations,
   institutions, movements, place overlap, and derived similarity.
3. Reproducible community analysis by decade/layer, including
   stability and source-sensitivity checks before visual design.
4. Institution/city biography showing roster, movement, migration,
   events, and peer connections over time.
5. Two-artist temporal-neighborhood comparison driven by observed
   questions rather than a generic comparison workbench.

The graph data model should become artist-neutral before the product
becomes artist-general. A graph database is a later architecture
decision, not a prerequisite: first establish entity/relation/event
semantics, provenance, temporal queries, and a second-domain use case.

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
- [x] Initial Netlify deploy (historical; now a path/query-preserving 301 compatibility redirect to Vercel) — https://sculpture-in-data.netlify.app
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

**Why this, why now.** The earlier site reduced multiple Wikidata P27 assertions to one display value and could not show birth/death-country endpoints. That flattened the source record, although neither multiple citizenships nor different endpoint countries can reconstruct migration history. The earlier publication filter also relied heavily on Western-art-historical movement labels. Before more visual polish, the project preserved multi-valued source data, added a bounded endpoint view, and replaced the movement-only gate.

**Themes the data should support after this phase:**
- Where sculptors actually came from vs. where they're attributed
- The non-Western gap — owned honestly, not hidden
- Multi-country lives (residences, activity places over time)
- Native-script names alongside romanizations

**Approach:** interleave data work with visible UI changes so every session produces a deployable increment. Do not disappear into a multi-week pure-data-work tunnel. Learn from each ingest and adjust.

### 3a. Wikidata enrichment — low risk, high yield ✅ COMPLETE
- [x] **Inclusion criteria research + decision** — see `docs/INCLUSION_CRITERIA.md`. Seven-expert stress test produced **Option A.3** (5 signals, drop authority as gate, sitelinks ≥3 non-EN).
- [x] SPARQL queries for **P19 (place of birth)**, **P20 (place of death)**, **sitelinks**, **authority IDs** (ULAN+VIAF+LCNAF+BnF+DNB+NDL+BNE), **P1559 (native name)**.
- [x] **Apply A.3 inclusion filter** in `process.py` — the May 2026 run published **3,630 sculptors** (54.2% of the then-current 6,700 cache). This is historical run evidence, not the current snapshot count.
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
- Recorded P21 label distribution: Phase 3a only moved the share labeled female from 13% to 14.4%. This is a source/rule diagnostic, not a population estimate or a complete gender model.

### 3b. Getty ULAN crosswalk — Wikidata cross-reference
- [x] **P245 (ULAN ID) crosswalk** — in the May 2026 run, 2,340 of 3,630 sculptors (64.5%) carried a Wikidata-supplied ULAN ID; no fuzzy match required.
- [x] **Per-record JSON-LD ingest** — `pipeline/query_getty.py` fetches `https://vocab.getty.edu/ulan/{id}.json` (the per-record endpoint, *not* the unstable SPARQL endpoint), with disk cache + politeness throttle. Resume-on-rerun is free. Full ingest: ~17 min, zero failures.
- [x] **Wikidata ↔ Getty audit** — `pipeline/audit_getty.py` produces both `getty_audit.json` (aggregate metrics + spot-check tables) and `getty_compared.parquet` (per-record). The current audit covers 2,310 published records after the evidence-backed `Q87366` exclusion.
- [x] **Schema and final-record contract** — 2,310 sculptors carry a `gettyVerified` block with Getty's parallel data (label, birth/death year + place, nationality chips) plus per-field agreement flags. `pipeline/sculptor_records.py` validates monolith/shard parity, preserves declared shard-only fields such as `works`, and writes the same Getty block to both outputs.
- [x] **UI surfaces** — the detail page receives Getty data from its per-QID shard, shows a one-line cross-ref status (verified / differs) with a deep link, and falls back to Getty place data when Wikidata is missing (4 birthplace cases in this snapshot).
- [ ] **Activity places (migration view data)** — NOT in the basic JSON-LD record. Would require Getty's SPARQL endpoint (unreliable) or the bulk LOD download (~3GB TTL). Deferred unless we re-prioritise the dedicated migration chart.
- [x] **License attribution** — About names Getty ULAN and ODC-By 1.0, links the license, and explains that source-specific terms still apply.

**Honest readout from the audit (live numbers on `/transparency`):**
- Birth-year agreement: **94.5% exact**, 1.9% off-by-1, 3.6% off-by-2+ among 2,308 comparable records (for example, Getty records Allen Jones as 1837 while Wikidata records 1937).
- Death-year agreement: **82.0% exact** among 1,826 comparable records, with a long tail of Getty records that have not added a death date for a formerly living artist.
- Birthplace agreement: **69.0%** across 1,404 records where both sources have a place — many differences are transliteration drift (Tehran/Tehrān, Constantine/Qacentina) or city-vs-country granularity, not established factual conflicts.
- **Wikidata is the larger source by far.** Getty fills 4 birthplace gaps; Wikidata fills 899 the other way. Getty's value here is verification, not coverage.
- Mean nationality/citizenship Jaccard is **0.757** across 2,310 records. The fields are not semantic equivalents: Getty uses cultural/national descriptors while Wikidata records P27 citizenship assertions.

### 3c. SAAM (Smithsonian American Art Museum) — biographical narratives
- [ ] Download SAAM LOD dataset (CC0, GitHub)
- [ ] Join via ULAN ID (SAAM also uses ULAN — clean join key) and/or name + birth year
- [ ] Extract biographical narrative text (Great Migration stories, émigré context, etc.)
- [ ] Schema: sculptor gains optional `bio_narrative` field with source attribution
- [ ] Note: this is the better museum-API choice than Met/AIC for our specific story. AIC/Met give us works + materials; SAAM gives us the migration narratives.

### 3d. Data-story UI — surfaces what the new data reveals
Built in increments alongside 3a-c, not saved for the end.
- [x] **Geography chart: source toggle** (citizenship / birth country) live on `/evolution`. Country-of-activity deferred to 3b (Getty ULAN).
- [x] **Migration view** — birth → death country Sankey shipped at `/migration` with decade-slice URL state (`?decade=1880`) and same-country-endpoint toggle (`?stay=1`). Per-flow side panel shows a sample of sculptors per pair (capped at 12). The UI explicitly treats these as endpoints, not a reconstructed journey; activity-place data remains deferred.
- [x] **"Hidden from view" page** — shipped as `/transparency`. Owns the included-vs-excluded distribution, signal coverage, and demographic gaps. Regenerates automatically on every pipeline run (standing commitment).
- [x] **Detail page enrichment (phase 1)** — native name with `lang` attribute, birth/death place with country, authority-file chips (ULAN/VIAF/LCNAF/BnF/DNB/NDL/BNE), inclusion-signal chips ("Included because of…").
- [x] **Detail page enrichment (phase 2)** — multi-citizenship pills surface the `citizenships[]` array rather than silently selecting one P27 value; the UI does not claim that P27 reconstructs identity or migration history. Native-name visibility tightened to non-English entries only (echoes of the romanized name suppressed). SAAM narrative snippet remains pending behind 3c.
- [x] **Authority-file chips → outbound links** — chips render as `<a>` to VIAF / ULAN / LCNAF / BnF / DNB / NDL / BNE when the pipeline has a resolved URL; static badges fall through for IDs without a templated URL formatter.
- [x] **Native names on Explore table** — second line under romanization with `lang` attribute; global search now matches native-script forms too (paste "ブランクーシ" → finds Brâncuși).
- [x] **Lineage graph filters** — search-to-focus ego network (1/2/3-hop BFS), connection-type radio, mentor toggle, movement multi-select pills (top 12 by edge count), backbone slider, all URL-backed via `?focus=…&hops=…&mentors=…&edge=…&minDeg=…&mov=…`. Cleared two `.windsurfrules` violations on the page (design tokens, URL state).
- [x] **About page update** — origin, scope, explorer/lab boundary, generated snapshot values, source licenses, dataset datasheet, and claim register are live; the canonical focus CSV currently has 48 rows.

### 3e. Explicitly deferred to later phases
- Sculpture images from Met/AIC IIIF
- Materials-over-time chart (needs Met/AIC re-ingest — lower priority than migration story)
- Network graph on lineage: **live** (bipartite — sculptor circles + mentor diamonds, 1,418 edges). Deferred: richer non-Wikidata edge sources (Getty, SAAM)
- Streamgraph toggle
- Export PNG per chart
- Sculptor comparison view

## Phase 4: Visual polish + production

- [x] **Recorded citizenship-set comparison** — the legacy tri-state `crossesBorders` field records whether two non-empty P27 sets are disjoint. Phase 5Q.3 removed border-crossing/cross-cultural causal language from Lineage, detail, and Transparency while retaining the shareable filter and exact denominator.
- [x] **Portrait images on detail pages** (Wikidata P18 → Wikimedia Commons). In the May 2026 run, 2,303 of 3,630 included sculptors (63%) had a portrait. Floats right of the header block; Commons file-page link for licence/author attribution. Met/AIC IIIF integration for actual sculptures deferred — see below.
- [x] **Per-field coverage on transparency** — birth_place, death_place, native_name, image, authority_links, movement, citizenship.
- [x] **OG preview image** — generated at build time via `app/opengraph-image.tsx` (next/og + Satori), with the published count derived from current export metadata. Twitter card is `summary_large_image`; metadataBase points at sculptor-explorer.vercel.app.
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
- [x] **5b — Densify and temporally qualify the lineage graph.** P69 + P937 ingest, `institutions.json` export, third node kind in `<LineageGraph />`, ≥3-sculptor render threshold, opt-in URL-backed institution hubs, and perf budget tests shipped through 5b.4. Phase 5b.5 added the same six-field envelope contract to P1066/P737 edges, explicit null reasons, regression checks, and public relationship/institution audits.
- [ ] **5b.6 — Movements as nodes (GATED).** Promote `movement` from trait to first-class node only if 5Q shows the lineage graph needs this question answered and the default/opt-in performance and comprehension budgets hold. ~150 movement nodes are available, but availability is not sufficient evidence.
- [ ] **5c — Time-coded lineage (GATED).** Use the temporal-envelope substrate for a URL-backed decade view with explicit definite/possible encoding. Prototype the static/focused version before any animation.
- [ ] **5d — Career-trajectory Sankey (GATED).** Generalize `/migration` from born → died to born → educated → worked → died only if P69/P937 temporal confidence supports the claims readers make. Country overview and city drill-down remain hypotheses.
- [ ] **5e — Coordinated multi-view and curated states.** Connect selections across Timeline, Lineage, Migration, and Geography through shared URL state. Curated tours should be saved analytical states, not a separate storytelling engine.
- [ ] **5f — Geographic view (GATED).** Choose choropleth, proportional symbol map, or no map from the analytical task and denominator; do not assume a choropleth is appropriate because country data exists.
- [ ] **5g — IIIF sculpture images / works context.** Widen Met + AIC works beyond the focus list with public-domain and attribution checks, then test whether works improve understanding rather than decoration alone.
- [ ] **5h — Interpretable style-space research (LAST).** Embeddings require adequate works-level coverage, rights, bias analysis, explanation, and a reader task. UMAP/t-SNE is not a roadmap commitment by itself.

Each phase has an explicit exit gate that may rewrite the phases
after it. See PHASE_5_PLAN.md for the full plan.

### Phase 5Q — Product clarity and quality gate (active)

**Goal:** make the existing explorer reliable, comprehensible,
accessible, measurable, and easy to continue before adding another
major visual dimension.

#### 5Q.1 — One current project truth (complete)

- [x] Remove stale hard-coded counts, phases, routes, and source claims from UI metadata and active docs; `web/src/lib/snapshot.ts` now derives volatile public values from committed export metadata.
- [x] Refresh landing/About copy to explain the project origin, sculpture-first scope, public-explorer/lab distinction, and possible evidence-gated expansion without promising a universal canon.
- [x] Keep `AGENTS.md` vendor-neutral and all tool-specific instruction files thin and consistent.
- [x] Add a visible source-snapshot/curation stamp and versioned methodology/data-release note. `/about` and `/transparency` distinguish source age from later review; `docs/DATA_RELEASE.md` identifies the committed artifact release.

#### 5Q.2 — Reliability, security, and reproducibility (complete)

- [x] Make full lint green and preserve passing type/build checks. Phase 5b.5 removed the 18 Transparency errors and the two remaining warnings.
- [x] Add focused web interaction tests for URL state and core journeys. Seven Playwright checks cover root/Timeline state, Migration state, Lineage focus/institution state, public provenance, movement-route integrity, seven analytical-route claim notes, and mobile navigation; CI installs Chromium inside the repo job and runs the explicit browser gate after the non-browser validation gate.
- [x] Add CI for type checking, lint, production build, data-contract tests, and the bounded lineage benchmark. `.github/workflows/ci.yml` runs the same root gate used locally.
- [x] Triage and close dependency advisories by reachability, compatibility, and
  upgrade risk. Next.js moved from 16.2.3 to 16.2.12, shadcn is development-only,
  compatible Dependabot families landed sequentially, and a focused transitive
  closeout left both npm audit views and GitHub's open alert queue at zero.
  `docs/SECURITY.md` records the temporary override retirement triggers.
- [x] Document the pipeline environment and add a reproducible validation entry point that does not require rediscovery by each agent. `./scripts/validate.sh` is standard-library-only on the Python side and uses the installed web dependencies.

#### 5Q.3 — Data contracts and ethical claims (complete)

- [x] Fix the impossible `Q87366` lifespan and add invariants for birth/death order, identifiers, roster/index/shard parity, edge endpoints, aggregate denominators, exclusion provenance, and relationship schemas. Wikibase time precision now prevents century values from becoming fake years; `overrides/person_exclusions.csv` protects older caches and documents the current exclusion.
- [x] Publish/maintain a dataset datasheet: `docs/DATASET_DATASHEET.md` covers composition, contracts, sources/licenses, processing, inclusion, missingness, overrides, uses/non-uses, risks, citation, corrections, and maintenance.
- [x] Put source, scope/denominator, freshness, and important missingness beside every analytical claim. `DataScopeNote` now supplies a snapshot-derived stamp and route-specific context on Timeline, Explore, Evolution, Migration, Lineage, Decade, and Movement; `docs/CLAIM_REGISTER.md` is the durable audit.
- [x] Review gender, geography, historical-state, and cultural classification language. Current public copy attributes P21/P27/P135 labels, describes birth/death countries as endpoints, and treats the legacy `crossesBorders` field as disjoint recorded citizenship sets rather than travel or cross-cultural proof. The claim register requires relevant domain/community review before any consequential named cultural, identity, historical-state, or living-artist claim ships.

#### 5Q.3R — Release-candidate stabilization (complete)

- [x] Separate source-query freshness, artifact release/review metadata, and per-record evidence-check dates in the generated contract and public copy.
- [x] Make candidate accounting explicit: 6,711 source candidates, one evidence-backed person exclusion, 6,710 analytically eligible candidates, 3,543 published records, and 3,167 A.3 rule exclusions.
- [x] Prevent movement labels from linking to nonexistent aggregate pages; export a small canonical movement-route index and enforce exact producer/bundle/route parity in data contracts and a browser journey.
- [x] Align `eslint-config-next` with the pinned Next.js release and give the four production SVG charts accessible names. Text/structured equivalents and keyboard inspection remain 5Q.4 work.
- [x] Pass the complete non-browser, build, performance, and seven-journey browser gates; inspect the semantic data diff and static-output change. The local build remains 3,625 routes / 36,201 files / ~228 MB; data changes are the documented exclusion/temporal exports plus additive release and movement-route contracts.
- [x] Create a named repository checkpoint for the inherited release candidate before route-level visual iteration (`codex/phase-5q-stabilization`).

#### Phase 5Q release-workflow enablers (verified; before the next code slice)

- [x] Prove the branch → draft PR → GitHub Actions → Vercel Preview path on
  PR [#1](https://github.com/asherzafar/sculptor-explorer/pull/1). At final
  head `8bb61a777007851abc060047894ed7e9c1828629`, both the push and
  pull-request CI runs passed the full root gate and seven Playwright journeys;
  Vercel and Vercel Preview Comments passed on the exact same commit.
- [x] Encode the agent-neutral inspect → coherent change → validate/review →
  publish/preview → rendered-QA → explicit merge lifecycle in `AGENTS.md`, with
  optional instruction-only `ship-pr` and `visual-qa` repository skills. Keep
  unique policy in canonical docs so Claude, Codex, Cursor, Windsurf, Copilot,
  and agents without skill discovery can follow the same process.
- [x] Define the protected-`main`, exact-SHA preview/production, stacked-PR,
  worktree, provider-boundary, and agent-authority target in
  `docs/SOURCE_CONTROL_AND_DELIVERY.md`; add a PR evidence template and public
  deployment smoke command. Pin the existing action majors to immutable SHAs
  and schedule monthly GitHub Actions/npm Dependabot version reviews. The
  approved `Protect main delivery` ruleset, GitHub-owned/full-SHA Actions
  policy, vulnerability alerts, and Dependabot security updates are active.
- [x] Land the separate dependency queue in exact-head order rather than as a
  batch: #17, #13, #15, #14, #18, #19, #12, #10, #8, then focused advisory
  closeout #20. Each merge passed default-branch validation and exact-SHA Vercel
  production verification before the next; merged remote branches were deleted,
  GitHub has zero open PRs/Dependabot alerts, and full/production npm audits are
  clean at the dependency-closeout baseline.
- [x] **Implement Node.js 24 alignment in one focused, separately reviewed
  branch.** `codex/node-24-alignment` adds root/web `.nvmrc` files at 24,
  declares `engines.node: "24.x"`, intentionally moves `@types/node` to 24,
  updates only its required lockfile dependency, selects Node 24 in CI, and
  updates current local/deployment documentation. With Node 24.14.0, `npm ci`,
  `./scripts/validate.sh`, and all seven Playwright journeys pass. No unrelated
  package version moved. On draft PR
  [#3](https://github.com/asherzafar/sculptor-explorer/pull/3), both push and
  pull-request CI plus Vercel passed on the same published head, so this
  implementation is integrated. PR #3 merged as `efbebbd`; its post-merge
  `main` validation and exact-SHA Vercel production deployment passed.
- [x] In the same runtime-alignment review, update `actions/checkout`,
  `actions/setup-node`, and `actions/setup-python` from their old Node-20-based
  majors to v7 while preserving their existing inputs, and pin the v7 releases
  to full commit SHAs. As of 2026-08-02, the official
  [`checkout` v7](https://github.com/actions/checkout/releases/tag/v7.0.1),
  [`setup-node` v7](https://github.com/actions/setup-node/releases/tag/v7.0.0),
  and
  [`setup-python` v7](https://github.com/actions/setup-python/releases/tag/v7.0.0)
  each declare the Node 24 action runtime. This is distinct from the
  application runtime selected by `setup-node`. Vercel documents
  `engines.node: "24.x"` as the repository override for its project setting in
  [Node.js version configuration](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
  The PR #3 push and pull-request runs prove those action upgrades on
  GitHub-hosted runners, and the merged `main` head completed its Vercel build.
- [x] Integrate the release stack in order. PRs #1–#4 merged as `440e68a`,
  `209cb19`, `efbebbd`, and `1b7c301`; every exact head and resulting `main`
  commit passed Actions and Vercel, and no Cloudflare build check returned.
- [ ] After runtime alignment is green, remove duplicate full-suite execution
  for a PR branch (currently both `push` and `pull_request`) in a separate CI
  efficiency change. Preserve validation for the default/release branch and
  for pull requests; measure the result rather than combining it with Node
  compatibility work.
- [ ] Treat cache and performance-infrastructure changes as measured follow-up:
  assess `.next/cache` first, verify whether Playwright-browser caching is safe
  and worthwhile, and replace shared-runner wall-clock thresholds with a
  normalized or dedicated benchmark when feasible. Until then, keep the 9 s /
  11 s runner values as regression tripwires, not product budgets.
- [ ] Pilot automated Codex PR review only as a non-blocking second reviewer
  after the manual review workflow is stable. Measure finding quality, noise,
  permissions, and account usage before making it a required check. Keep the
  existing time-bounded npm advisory review; do not use an uncontrolled
  `npm audit fix`. Repeated color-environment warnings are low-priority log
  hygiene.

#### 5Q.4 — Aesthetic clarity, accessibility, mobile, and performance

##### 5Q.4a — Visual foundations and baseline (do first)

- [x] Record the route/task matrix, encoding inventory, source audit, ranked findings, and initial alternative set in `docs/VISUAL_BASELINE_2026-08-02.md`.
- [x] Validate the branch-to-Vercel preview workflow from the current checkpoint before rendered review: PR #1’s final preview
  `https://sculptor-explorer-hgkmgumny-asherzafars-projects.vercel.app`
  is READY for source commit `8bb61a777007851abc060047894ed7e9c1828629`;
  no production promotion or retention change was performed. The later hosting
  inventory retains exact preview/deployment evidence and makes cleanup a
  deliberate, separately approved action.
- [x] Close the machine-observable rendered/perceptual baseline on exact
  `main@8a4fccdeef90b2678a87d957e57d3d438a7fd317`: 67 consistent captures,
  desktop/390px routes, WCAG text-spacing and overflow, standalone-browser
  keyboard/focus/target evidence, Axe, forced colors, four color-vision modes,
  reduced-motion settle, console/image failures, and controlled no-cache Web
  Vitals are recorded in `docs/VISUAL_BASELINE_2026-08-02.md`. Actual 200%
  browser zoom, spoken screen-reader output, physical input, and comprehension
  were not available and have exact owner-run protocols; this checkbox closes
  the baseline task, not the product-quality gate.
- [x] Audit hierarchy, layout, typography, palette usage, chart semantics,
  information scent, mobile/reflow, keyboard flow, accessible naming, reduced
  motion, and perceptual performance against charter tasks. Confirmed failures
  are ranked P1/P2 and separated into shared-system and route-specific work.
- [x] Preserve the Verdigris & Marble identity, Fraunces/DM Sans hierarchy,
  catalogue whitespace, and direct disclosure. Route slices may change failed
  token contexts, chart equivalents, targets, state, and responsive structure;
  no baseline evidence supports a wholesale restyle or a new styling system.

##### 5Q.4b — End-to-end route slices

- [ ] Start with **Explore**: URL-backed search/sort/filter state, pagination or virtualization, mobile table/list equivalence, movement-route integrity, and fast find/share tasks.
- [ ] Continue with **Timeline**: make the project-origin lifespan view legible on mobile and at zoom, with a structured equivalent and verified sort/share behavior.
- [ ] Review the dense **Lineage/Migration** family: overview/focus/details, denominators and uncertainty, keyboard/text equivalents, reduced motion, and measured graph/interaction budgets.
- [ ] Propagate earned patterns through Evolution, Decade, Movement, sculptor detail, About, and Transparency; do not mass-restyle before the first route slice passes review.
- [ ] Review each default view with the visualization proposal model in `docs/RESEARCH_FOUNDATIONS.md`: reader question → data/task → encoding/interaction → implementation.
- [ ] Give every interactive SVG an accessible name, text summary/equivalent, keyboard-operable consequential controls, visible focus, reduced-motion behavior, and non-color state encoding.
- [ ] Replace unexplained density with overview → focus/filter → details on demand. Test lineage labels/legends, temporal confidence, and migration denominators for comprehension.
- [ ] Make ordinary discovery/detail journeys usable on mobile; provide an explicit simplified list/summary for dense charts rather than clipping.
- [ ] Virtualize or paginate Explore instead of mounting all included rows; move consequential search/sort/filter state into the URL.
- [ ] Measure route payloads and Core Web Vitals at p75. Keep normal interactions under 200 ms, default lineage under 1.5 s, opt-in heavy graph modes under 3 s, and monitor static-output growth.

##### 5Q.4c — Visual closeout

- [ ] Run the route-slice review gate on every primary journey, synthesize unresolved issues by severity, and update `docs/DESIGN_SYSTEM.md` only with patterns that passed evidence and reuse checks.
- [ ] Preserve a before/after visual and performance record so future agents can distinguish intentional design decisions from drift.
- [x] Complete the hosting inventory in
  `docs/HOSTING_INVENTORY_2026-08-02.md`: record canonical Vercel production and
  previews, Netlify ownership/rollback/redirect evidence, and the unexpected
  Cloudflare Worker build/routing/version/traffic/token boundary without
  exposing credentials.
- [x] Retire the stale `sculpture-in-data.netlify.app` content with a
  path/query-preserving 301 to `sculptor-explorer.vercel.app`; retain the
  redirect indefinitely by default. Disconnect only the dormant Cloudflare
  Worker's per-service Git build after its evidence gates; preserve its disabled
  routing and manual versions through 2026-09-02 UTC. Fresh PR #1–#4 heads have
  Actions/Vercel success and no Cloudflare Workers Builds check. Worker or token
  deletion remains a separately approved post-retention decision.

#### 5Q.5 — Learn before choosing the next bet

- [ ] Add privacy-respecting, minimal analytics for route use, search success, filter/share actions, empty results, and performance—never sensitive profiles.
- [ ] Run at least five structured sessions spanning the charter's audience hypotheses; test orientation, findability, interpretation, limitation awareness, and sharing.
- [ ] Score the next candidates with the charter scorecard and document a go/simplify/stop decision.

**Phase 5Q exit gate:** all required CI checks are green; zero unexplained
data invariants fail; core flows meet WCAG 2.2 AA requirements and
have a mobile/equivalent path; URL states round-trip; performance
budgets are measured and met or explicitly re-scoped; five user
sessions are synthesized; and the next feature is selected from
evidence rather than phase-number momentum.

### Phase 5R — Strategic horizon workshop (after 5Q evidence, before the next major public phase)

**Goal:** zoom out deliberately once the inherited product is stable enough to
judge. Revisit the project’s goals, question atlas, audience hypotheses,
creative ambition, evidence model, and longer-term roadmap without letting a
pre-existing phase number choose the answer.

- [ ] Synthesize the 5Q route evidence, user sessions, analytics, dependency/data risks, and the active lab experiment’s learning note.
- [ ] Refresh the expert/frontier reading across cultural-collection UX, visualization, temporal/multilayer networks, art-historical method, cultural-data governance, and relevant technical architecture. Separate durable foundations, emerging methods, and unvalidated novelty.
- [ ] Hold a founder interview/workshop around the most consequential unresolved choices: primary audience, best questions, breadth versus depth, role of fun/experimentation, first second-domain or earlier-period probe, and when the public name should be reconsidered.
- [ ] Expand and rank the question atlas; score candidate initiatives with the charter scorecard, including success/stop conditions, data/UX risks, and the smallest experiment that would reduce uncertainty.
- [ ] Update the charter, decision log, exploration strategy, design/research standards, architecture triggers, roadmap, and handoff together. Record rejected options and non-goals so another agent does not silently revive them.

Candidate sequence to bring into that workshop:

| Slot | Recommended option | Alternative / gate |
|---|---|---|
| During 5Q, WIP limit one | **E4 institution/city biography** as an isolated small-multiple/event-band lab because the institutional substrate already exists | E1 temporal ego journey if a person-centered story is easier to test; neither alters production routes |
| First post-gate production theme | **Findability and connective tissue:** global search plus institution-page/link discovery | Build only after task evidence and scorecard review; begin with the smallest useful slice |
| Second post-gate theme | **Coordinated URL states and curated analytical entry points** | Prefer saved/reproducible states over a separate storytelling engine |
| Story-depth option | **Works/IIIF expansion** | Requires coverage, rights, attribution, and “understanding versus decoration” evidence |
| Research/model option | **Artist-neutral semantic layer plus one second-domain or earlier-period probe** | Additive model first; no public rebrand until source fitness and cross-domain value pass |
| Still gated | Movement nodes, animated lineage, career Sankey, map, embeddings, graph database/renderer rewrite | Require a reader question, evidence fitness, comprehension, accessibility, and measured scale trigger |

## Review and validation gates

Review happens both **as work proceeds** and at explicit boundaries. Automated
checks alone catch regressions; human review alone is too late and too hard to
reproduce.

Use the task lifecycle in `AGENTS.md`. The repository `ship-pr` and
`visual-qa` skills are optional executable checklists for compatible agents;
the gates below remain authoritative for every agent. A task is complete only
when it declares its archive state and hands off the exact next bounded prompt.

### Gate A — Every coherent change

- Run the smallest relevant data/unit/interaction check, type checking and
  lint where code changed, and `git diff --check`.
- For generated data, update producer, consumer, types, contract tests,
  release metadata, and public/documented semantics together; inspect a
  semantic diff rather than accepting file churn.
- Re-check source, denominator, freshness, missingness, URL state, and
  accessible naming for any affected public claim or interaction.

### Gate B — Every route slice

- Review six lenses together: **truth**, **visual hierarchy/encoding**,
  **interaction/state**, **responsive/mobile**, **accessibility**, and
  **performance**.
- Capture desktop and 390px evidence, keyboard/zoom/reflow results, automated
  accessibility findings, route payload/interaction timings, and a short
  before/after decision note.
- Do not propagate a new visual pattern to other routes until this gate passes
  or the exception and next test are recorded.

### Gate C — Milestone/release candidate

- Run `./scripts/validate.sh`, the explicit Playwright gate, full local
  lineage median when graph behavior changed, and the remote CI checks on the
  checkpoint branch.
- Inspect browser console output, static route count/output size, package
  audit posture, generated-data semantic diff, documentation links/status,
  and known-risk ownership.
- “Implemented,” “locally validated,” “in CI,” “deployed,” and “observed with
  users” are separate statuses; documentation must not collapse them into
  “shipped.”

### Gate D — Product decision

- Use founder/domain review and the five-session synthesis to assess whether a
  reader can orient, interpret, find, share, and name a limitation.
- Score the next bet, record go/simplify/stop, and update the roadmap/decision
  log before a major production feature begins.

### Already-implemented narrative pages (kept here for inventory)

- [x] Decade pages (`/decade/[year]`) — top countries, top movements, top endpoint pairs (deep-link into the Sankey filtered to that decade), most-connected-in-this-graph roster, prev/next adjacent-decade nav.
- [x] Movement pages (`/movement/[slug]`) — stat blocks, decade histogram, top countries, peer movements, and most-connected-in-this-graph roster. Movement pills on detail and Explore pages link out.

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

## Improvement opportunities and future ideas (August 2026 audit)

Items in 5Q are scheduled as gate work; feature candidates remain
options to score after the gate. The ordering below is strategic,
not an instruction to build all of them.

### Easy wins (hours, not days)

- [x] **Remove unused `react-force-graph-2d` dependency.** Zero imports
  remain after the D3 migration; it only inflates installs.
- [x] **Make full `npm run lint` green.** Phase 5b.5 moved nested
  Transparency components to module scope and fixed JSX escaping. The
  command now exits with zero errors and zero warnings.
- [x] **Surface pipeline export date in the UI.** A "data as of …"
  stamp in the footer or on /transparency builds trust and makes stale
  deploys visible. `/about` and `/transparency` now show the export date,
  methodology version, and later curation-review date without implying a
  fresh upstream query.
- [ ] **Sitemap + per-page metadata.** Decade, movement, and sculptor
  detail pages are SEO-ready narrative surfaces with no sitemap today.
- [x] **`npm audit` cleanup.** The August audit observed 14 advisories,
  7 high. Next.js 16.2.12 patches the direct framework advisories; the
  remaining three production-tree package findings are build-only PostCSS/
  Sharp paths under the static-export boundary, and the other eleven are
  development-only. `docs/SECURITY.md` documents reachability and the
  time-bounded review.

### Process and infrastructure

- [x] **CI via GitHub Actions.** `.github/workflows/ci.yml` runs the
  repository validation gate and explicit Playwright journey gate, including
  deterministic data contracts and bounded lineage performance regression.
- [ ] **Scheduled pipeline refresh.** Wikidata moves; our export is a
  snapshot. A monthly re-run with a diff report (new sculptors, changed
  edges) keeps the data honest and gives /transparency a changelog.
- [ ] **Privacy-friendly analytics** (Plausible/Umami). Before
  investing in 5e+ interactives, learn which views people actually use.

### Preferred post-gate feature candidates (days)

- [ ] **Per-institution pages** (`/institution/[qid]`). The natural
  next step after 5b.4: mirror the movement-page pattern with roster,
  decade histogram, and a small inline graph; deep-link from lineage
  hub nodes and /transparency. The data is already in
  `institutions.json`.
- [ ] **Global search / command palette** (⌘K). One search box across
  sculptors, institutions, and movements that jumps to the right page.
  The slim `sculptors_index.json` plus the institution index make this
  cheap; it would tie the growing page inventory together.
- [ ] **Curated analytical entry points.** Publish a small set of
  evidence-reviewed, URL-backed states that teach readers how to enter
  the data without building a separate scrollytelling system.
- [ ] **Coordinated links and URL state.** Make entity chips, chart
  selections, and filters connect Timeline, Explore, Evolution,
  Migration, Lineage, and entity pages; first close Explore search/sort
  URL debt.
- [ ] **Sculptor comparison view.** Parked since 3e. Two-up detail
  comparison (lifespans, movements, institutions, shared mentors) is a
  natural use of the per-sculptor shards.

### Medium/long-term bets (weeks; score after 5Q)

- [ ] **Canvas/WebGL lineage renderer.** The stress benchmark scenario
  (12k nodes) remains RED (~3.5s settled). Not needed at current sizes,
  but it becomes the gate if movements (5b.6) + cities (5d) + a Getty
  ULAN expansion ever land together.
- [ ] **SAAM biographical narratives (3c).** Still the best unstarted
  data story: CC0 émigré/Great Migration narrative text joined via
  ULAN. Elevates detail pages from data sheets to stories.
- [ ] **Works-level data (Met/AIC).** Unlocks the materials-over-time
  chart, sculpture images beyond portraits (5g), and eventually the
  embedding viz (5h). The single biggest data expansion left.
- [ ] **Research data downloads.** Publish the JSON bundles as
  documented, versioned downloads with a citation note. Cheap to do,
  widens the audience from readers to researchers.
- [ ] **Comparison journeys.** Test whether a two-up sculptor or
  institution comparison answers observed questions before designing a
  generic comparison workbench.
- [ ] **Time-coded lineage / career trajectories.** Proceed only when
  temporal confidence, comprehension, and performance gates support the
  intended claims; a focused static prototype precedes animation.
- [ ] **Artist-neutral semantic layer.** Add domain-neutral entity,
  role, event, assertion, temporal-envelope, and relationship-layer
  contracts alongside the legacy sculpture exports. Do not force a
  breaking rename through current consumers.
- [ ] **Second-discipline pilot.** Choose one domain from question value
  and source fitness, run the same provenance/inclusion audit, and test a
  genuinely cross-disciplinary question before any public rebrand.
- [ ] **Earlier-period pilot.** Before moving the 1800 boundary, measure
  identity resolution, date precision, attribution conventions, source
  coverage, and survival bias on one historically coherent sample.

---

## Build / gate / defer — quick reference

| If you're about to build… | Decision | Why |
|---|---|---|
| Phase 5b.5 temporal/provenance work | **Completed** | Shared substrate and transparency contract shipped on 2026-08-02. |
| Lint/CI/data invariants/accessibility/mobile/URL/performance work | **Build next (5Q)** | Required to trust and evaluate the existing product. |
| Isolated temporal/network lab prototype | **Explore in parallel** | Play and technique-led learning are in scope when time-boxed, reproducible, and disconnected from production contracts. |
| Institution pages, global search, coordinated links/states | **Prefer after 5Q** | High connective value using data already shipped. |
| Curated tours | **Prototype after 5Q** | Use URL-backed states; validate interpretation before a new narrative engine. |
| Works/IIIF expansion and materials stories | **Medium term** | High story value, but coverage, rights, attribution, and data QA must be measured. |
| Artist-neutral semantic model / second-domain or earlier-period probe | **Design, then pilot** | Generalize additively and measure source fitness before broadening the brand, disciplines, or time claim. |
| Movement nodes, animated lineage, career Sankey, map | **Gated** | Reader question, data fitness, comprehension, and performance must pass first. |
| Graph database | **Query-triggered** | Compare property graph, RDF/cultural-heritage alignment, and analytical storage only after real workflows justify it. |
| Canvas/WebGL rewrite | **Threshold-triggered** | Only if measured, valuable views cannot meet budgets with the current renderer. |
| Style embeddings | **Defer / research last** | Needs works coverage, interpretable task, rights, bias analysis, and simpler baselines. |

## Architecture rules

See `.windsurfrules` for the 8 non-negotiable rules. The key ones that prevent rework across phases:

- **URL state from day 1.** `useSearchParams()` for all filters.
- **D3 for charts from day 1.** No Recharts.
- **Stable, explicit JSON contracts.** Prefer additive fields/files; version and migrate any necessary breaking change across producer, consumers, tests, and docs.
- **Design tokens from day 1.** All colors/fonts/spacing use CSS variables.
