# Roadmap

## Current status: MVP (Phases 0-2)

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
- [ ] **Remove border/card wrapper from chart.** The `rounded-lg border bg-card` container around `<LifespanTimeline>` violates the design rule "no borders on charts." Chart should float in the content area's whitespace.
- [ ] **Full-width chart.** Remove inner padding that constrains chart width — it should span the full content column.
- [ ] **Heading → chart spacing.** Increase gap between the subtitle paragraph and the chart area (currently feels too tight).

### Explore page
- [ ] **Name link affordance.** Name cells must visually signal clickability: `text-accent-primary` color + `hover:underline`. Currently looks like plain text.
- [ ] **Default sort: birth year ascending.** Randomized load order is confusing. Default should be chronological (oldest first) so the table tells a coherent story.
- [ ] **Movement/gender capitalization normalization.** Wikidata supplies inconsistent casing (47 of 131 movements start lowercase, e.g. `abstract art` vs `Expressionism`). Fix: add `toTitleCase()` display utility in `lib/utils.ts` and apply it to movement and gender display everywhere. Do NOT mutate the raw data — normalize at render time only.
- [ ] **Zebra striping.** Already in DESIGN_SYSTEM spec (alternating `--bg-primary` / `--bg-card`). Not yet implemented.
- [ ] **Row hover cursor.** Should be `cursor-pointer` — currently `cursor-default`.

### Sculptor detail page (`/explore/[qid]`)
- [ ] **Implement the SculptorCard spec from DESIGN_SYSTEM.** Currently a bare 2-column data grid. Replace with: display name (Fraunces serif, large), lifespan line below name, movement as a pill badge, citizenship + gender inline, connections with in/out breakdown, data-completeness dots (4 dots: has_movement, has_citizenship, has_edges — filled = present, hollow = missing with tooltip).
- [ ] **External link to Wikidata.** Each sculptor has a QID — link out to `https://www.wikidata.org/wiki/{qid}` (small external link icon, `text-text-tertiary`, opens in new tab).
- [ ] **"Back to explore" preserves search state.** Currently hard-links to `/explore` losing any active search or sort. Should use `router.back()` or pass the previous URL.

### Evolution page
- [ ] **Chart hover affordance.** The stacked areas need `cursor-pointer` on hover over the click-target rects. Also: a subtle hover state (lighten the hovered decade band) so users discover the interaction.
- [ ] **Interaction hint.** The subtitle "click to filter" is easily missed. Add a small pulsing indicator or a persistent tooltip-style hint on first load (dismissible, localStorage-backed).
- [ ] **Focus sculptor cards → link to detail page.** Cards in the filtered list should be clickable and navigate to `/explore/{qid}`. Add hover state + cursor pointer.
- [ ] **Focus sculptor card polish.** Match the SculptorCard spec (movement pill, lifespan line, data dots). Currently plain text on a white card.

### About page
- [ ] **Add builder credit.** Credits section currently says "Inspired by Fabio J. Fernández" but omits the builder. Add: "Built by [Asher Zafar](https://linkedin.com/in/asherzafar)" as the first line of the Credits section. LinkedIn URL to be confirmed.
- [ ] **Fix stale data source references.** "Met Museum API — Phase 1" and "AIC API — Phase 1" are incorrect (these are Phase 3). Update to reflect actual current state.

---

## Phase 3: Depth + museum data

- [ ] Museum API integration: Met (`collectionapi.metmuseum.org`) + AIC (`api.artic.edu`)
- [ ] Material taxonomy: parse medium strings → clean categories via `overrides/medium_taxonomy.csv`
- [ ] Materials-over-time chart (the most novel visualization)
- [ ] Synchronized evolution view: materials + geography + movements with linked decade selector
- [ ] Streamgraph option (toggle between streamgraph and small multiples)
- [ ] Sculptor comparison view on explore page
- [ ] Network graph on lineage page (with Wikidata edges — don't wait for ULAN)
- [ ] Export PNG button per chart
- [ ] Styled empty states with filter suggestions
- [ ] Inline data degradation messaging ("Movement data unavailable for 12 sculptors")

## Phase 4: Polish + production

- [ ] OG preview image (screenshot of evolution page, 1200×630px)
- [ ] Performance audit against budget (<3s paint, <5s interactive, <3MB payload)
- [ ] Animation polish: chart transitions (400ms ease-out), page cross-fades
- [ ] Diacritic-insensitive search (`normalize('NFD')` stripping)
- [ ] Custom domain (if desired)

## Phase 5: Enrichment

- [ ] Getty ULAN edge enrichment → richer lineage network
- [ ] Sculpture images from Met/AIC IIIF (public domain only)
- [ ] Curated tours: pre-set filter combinations ("The Rodin Lineage", "From Marble to Mixed Media")
- [ ] Sculptor profile pages (`/explore/[qid]`) with images and key works
- [ ] Movement quality: cross-reference Wikidata P135 against Getty AAT terms

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
