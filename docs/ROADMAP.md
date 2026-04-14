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

- [ ] Geography-by-decade D3 chart on evolution page
- [ ] Movements-by-decade D3 chart on evolution page
- [ ] Add Evolution to nav as 5th route (now that it has real charts)
- [ ] Filter sentence component ("Showing [all countries ▾] from [1800 ▾] to [2020 ▾]")
- [ ] Filters write to URL params via `useSearchParams()`
- [ ] Decade selector: linked views, selecting filters all charts
- [ ] Deploy to Vercel
- [ ] Share with Fabio, collect feedback

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
