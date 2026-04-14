# Sculpture in Data — Design Brief

> **Values source:** All colors, fonts, routes, and current decisions live in `.windsurfrules`.
> This document describes **rationale and patterns**. Do not duplicate values here.

## Design DNA

**One sentence:** The Harvard Atlas of Economic Complexity, but for sculpture history — with the warmth, materiality, and quiet confidence of a beautifully designed gallery exhibition catalog.

**What this is NOT:**
- Not a SaaS dashboard (no card grids, no KPI tiles, no drop shadows)
- Not a newsroom interactive (no scrollytelling hero, no "scroll to explore" prompts)
- Not an academic tool (no grey-on-grey institutional design)
- Not influencer-core or trendy (no glassmorphism, no neon accents, no gradient meshes)

**What this IS:**
- Data-forward: the visualization IS the page, not decoration alongside text
- Quiet confidence: everything looks intentional, nothing is decorative
- Warm materiality: feels like printed matter, not software
- Craft-legible: the care in the typography and spacing signals "someone made this thoughtfully" — the same way a well-finished watch dial communicates quality through precision, not flash

## References

### Primary: Harvard Atlas of Economic Complexity
`https://atlas.hks.harvard.edu/`
- Full-bleed visualizations that dominate the viewport
- Minimal chrome — the UI disappears, the data speaks
- Sidebar navigation, not top tabs
- Smooth animated transitions between states
- Deep-linkable views (every configuration has a URL)
- Dark sidebar + light content area for spatial hierarchy

### Secondary: The Economist data journalism
- Confident axis labeling — never over-labeled, never under-labeled
- Restrained color palette (2-3 hues max per chart, not a rainbow)
- Annotations directly on the chart, not in separate legends
- Clear typographic hierarchy: headline → subtitle → annotation → axis

### Tertiary: Gallery catalog / Kinfolk / Cereal Magazine aesthetic
- Generous whitespace
- Serif headlines with sans-serif body (warm, not clinical)
- Muted, natural palette — stone, patina green, marble, warm grey
- Photography-forward (we'll use sculpture images from Met/AIC IIIF)
- The feeling of printed matter: considered, slow, premium

### Anti-references (avoid these)
- Generic shadcn/ui dashboard templates (card grids, rounded corners everywhere)
- Observable notebooks (great for prototyping, wrong aesthetic for this)
- Flourish/Datawrapper defaults (too "infographic-y")
- Material Design / Google aesthetic (too flat, too institutional)

## Typography

### Chosen pairing

**Display / Headlines:** **Fraunces** (Variable, Google Fonts)
- Optical size axis, warm, slightly wonky. Soft terminals feel sculptural.
- The "authored object" choice — distinctive without being precious.
- Use at weight 400 (regular) for headlines, 300 (light) for large display numbers.

**Body / UI / Axis labels:** **DM Sans** (Google Fonts)
- Geometric but warm. Excellent legibility at small sizes.
- Use at weight 400 (regular) for body, 500 (medium) for emphasis.
- Tabular lining figures available for data display.

**Data / Monospace (optional, for counts/years):**
- **Tabular Lining Figures** from the body font (most good sans fonts have these)
- Or **JetBrains Mono** for explicitly technical contexts

### Type scale

Use a modular scale based on a ~1.25 ratio (Major Third):

```
--text-xs:    0.75rem   (12px)  — axis ticks, fine print
--text-sm:    0.875rem  (14px)  — axis labels, table cells, captions
--text-base:  1rem      (16px)  — body text, UI elements
--text-lg:    1.25rem   (20px)  — section subheads, card titles
--text-xl:    1.5rem    (24px)  — page subtitles
--text-2xl:   2rem      (32px)  — page titles
--text-3xl:   2.5rem    (40px)  — hero display (used sparingly)
```

### Type rules
- Headlines: serif, medium weight (not bold), generous letter-spacing (-0.01em to -0.02em)
- Body: sans, regular weight, 1.6 line-height
- Axis labels: sans, light or regular, slightly reduced size, muted color
- Numbers on charts: tabular figures always (prevents jitter on transitions)
- No ALL CAPS except very short labels (nav items, tiny category tags)

## Color

### Philosophy
The palette draws from sculpture materials — oxidized bronze, marble, weathered copper, stone. The verdigris accent evokes the patina on aged bronze sculpture. Cool and restrained, with warmth coming from the typography rather than the colors.

### Core palette

> Exact hex values: see `.windsurfrules` § Color palette.
> Implementation: see `web/src/app/globals.css` for CSS custom properties.

The palette is organized into: backgrounds (3 tiers), text (3 tiers + inverse), accent (primary + hover + muted), data visualization (8 ordered, CVD-safe), and borders (3 tiers). Data palette uses warm-dark umber as data-1 to separate from cool verdigris under deuteranopia.

### Color rules
- **Charts use at most 5-6 colors.** If more categories exist, group the tail into "Other" using --data-5.
- **One accent color** (verdigris) used for: active states, selected items, the single most important data point. Never more than 10% of any screen.
- **No pure black** (#000) and **no pure white** (#FFF) except for data container backgrounds. Everything else uses the cool-warm variants.
- **Dark sidebar** — see `.windsurfrules` § Sidebar for current tokens. No right border — the dark/light contrast defines the edge.
- **Hover states** are subtle: slightly darker background or a thin underline. No color explosions.
- **The sandstone (#D4A574) provides warmth** in the otherwise cool palette — use it for the 3rd or 4th data category to prevent the charts from feeling clinical.

### Accessibility rules (non-negotiable)
- **Never rely on color alone to encode information.** Every color distinction must be reinforced with a second channel: texture, pattern, direct label, line style (solid/dashed), or shape. Stacked areas use 1px white separators between layers. Network graph nodes vary in size and shape, not just color.
- **All text must meet WCAG AA** (4.5:1 contrast ratio on its background). Use Chrome DevTools → Rendering → Emulate vision deficiencies to test.
- **Test the data palette under deuteranopia, protanopia, and tritanopia** before finalizing any chart. The palette was designed for CVD safety (warm umber separates from cool verdigris) but must be verified in context.
- **Direct label charts whenever possible** — avoid forcing the reader to match colors between a legend and the chart. Label lines at their endpoints, label areas inline, label bars at their tips.

## Spacing & Layout

### Grid
- Sidebar: fixed 240px wide on desktop, collapsible on tablet
- Content area: fluid, max-width 1400px, centered
- Charts: full width of content area minus modest padding (24-32px)
- Generous vertical spacing between sections: 48-64px

### Spacing scale (Tailwind)
```
p-1 (4px)   — tight internal padding
p-2 (8px)   — between related elements
p-4 (16px)  — standard component padding
p-6 (24px)  — section padding
p-8 (32px)  — generous section padding
p-12 (48px) — between major sections
p-16 (64px) — page-level vertical rhythm
```

### Layout principles
- **Charts should breathe.** Minimum 48px above, 32px below every chart.
- **No borders on charts.** The data IS the boundary. Use whitespace to separate.
- **Left-align everything.** No centered text blocks (except maybe the landing hero).
- **Sidebar nav is persistent** on desktop. It anchors the spatial experience.
- **No horizontal scrolling ever.**

### Border usage standards
The "no borders" rule is nuanced. Borders provide functional affordance for interactive elements but clutter content displays.

**NO borders on:**
- Chart containers (data floats in whitespace)
- Content cards (use `bg-bg-secondary` background instead)
- Data displays (sculptor detail grids, relationship lists)
- Timeline/event annotations

**YES borders on:**
- Search inputs (users need to know where to type)
- Buttons (affordance for clickability)
- Active filter banners (visual distinction for state change)
- Dropdowns/selects (form element affordance)

**Rule of thumb:** If removing the border would make a user hesitate about where to click or what the element is, keep the border. If the border is purely decorative, remove it.

## Charts & Data Visualization

### General chart style
- **No chart borders or boxes.** Charts float in whitespace.
- **Gridlines are barely visible** (--border-grid at ~0.3 opacity). Horizontal only. No vertical gridlines.
- **Axis lines:** left (Y) and bottom (X) only. Use --border-axis color. No top or right axis.
- **Axis labels:** --text-tertiary color, --text-sm size. Y-axis labels right-aligned to the axis. X-axis labels centered below ticks.
- **No default legends.** Use direct annotation on the chart (label the line/area directly) or use a compact inline legend above the chart. Legends on the side waste space.
- **Tooltips:** minimal, no border, subtle shadow, warm background (#FAFAF8), appears on hover with a 100ms delay. Shows only essential info.
- **Transitions:** 400ms ease-out on data changes. Elements should fade/morph, not pop.

### Chart type guidance

**Stacked area / streamgraph (materials over time, movements over time):**
- Default view: **streamgraph** (centered stacked area) for visual impact and overview gestalt
- Toggle to: **small multiples line chart** (one panel per material) for accurate comparison
- Click any material/movement in the stream → isolates that layer as a single line chart
- Use the data palette in order of visual weight (darkest for largest category)
- Subtle 1px white separator between areas (accessibility: not color-alone)
- Area opacity: 0.85 (not fully opaque — gives layered feeling)
- Decade labels on X axis, count on Y axis
- Title above chart, left-aligned, serif font
- **Insight targets for materials chart:** The viewer should immediately see (1) marble's dominance pre-1900, (2) the rise of bronze in the early 20th century, (3) the dramatic emergence of steel/welded metal post-1950, (4) the explosion of mixed media from the 1960s onward.
- **Insight targets for movements chart:** (1) Symbolism/Realism giving way to Expressionism and Cubism ~1900-1920, (2) the simultaneous explosion of multiple movements in the 1920s-30s, (3) the rise of "contemporary art" as a catch-all post-1960 (a data quality signal, not a real movement).

**Small multiples (geography by country):**
- 2-3 columns on desktop, 1 on mobile
- Shared X axis across all panels
- Each panel title in --text-lg, serif
- Area fill in --data-1 at 0.2 opacity, line in --data-1 at full opacity
- Consistent Y-axis scale where possible (allows visual comparison)
- **Insight targets:** (1) France and Germany's early dominance, (2) the US rise in the early 20th century, (3) global diversification post-1950 (Japan, Latin America, etc.)

**Network graph (lineage):**
- Dark background (#1C1C1A) — networks read better on dark
- Nodes: circles, sized by degree, colored by movement or country
- Nodes also vary in **border style** (solid for high-confidence data, dashed for sparse data) — not color-alone
- Edges: thin (0.5-1px), low opacity (0.3), curved slightly
- Hover a node: highlight its edges, dim everything else (0.1 opacity)
- Click a node: sticky highlight, show sculptor card overlay
- Force layout with gentle physics (no chaotic bouncing)
- The network should feel like a constellation, not a hairball
- **Insight targets:** (1) The French academic cluster (Rümann, Falguière, Jouffroy) is institutional documentation, not universal influence, (2) Rodin as the bridge between academic and modern, (3) sparse connections among modernists = Wikidata gap, not art-historical reality.

**Data table (explore view):**
- Zebra striping: alternating --bg-primary / --bg-card (very subtle)
- No cell borders. Use spacing and background to separate rows.
- Sortable columns with subtle arrow indicator
- Search bar: minimal, no border, just a bottom line. Placeholder: "Search sculptors..."
- On row hover: subtle background change + cursor pointer

## Components

### Sculptor Card
- Used in explore view, sculptor detail page, and evolution focus sculptor list
- Layout: vertical stack. No border on the card itself. Hover: subtle `--bg-secondary` background.
- **Name:** Fraunces (display), `--text-lg`, `--text-primary`. Clicking anywhere on the card navigates to `/explore/{qid}`.
- **Lifespan line:** `1911 – 2010` or `1946 – present` if `alive`. Sans, `--text-sm`, `--text-secondary`.
- **Movement pill:** small pill badge with `--accent-muted` background and `--accent-primary` text. `text-capitalize` applied to movement label (see Capitalization Standards below). If no movement: omit entirely (do not show "No movement listed" — this is noise).
- **Citizenship + gender:** inline, `--text-sm`, `--text-secondary`, separated by · (centered dot)
- **Connections count:** only show if > 0. Format: `{n} connections`. If 0: omit. Zero connections is a data gap, not a fact worth displaying.
- **Data completeness indicator:** 4 small dots below the metadata (has_movement, has_citizenship, has_edges, has_museum_works). Filled dot = data present, hollow = missing. `--text-tertiary`, 6px. Tooltip on hover explains each dot. This signals data quality without cluttering.
- **Wikidata link:** small external link icon (Lucide `ExternalLink`, 12px, `--text-tertiary`) at top-right corner. Links to `https://www.wikidata.org/wiki/{qid}`, `target="_blank"`. Only visible on card hover.
- **Image placeholder** (Phase 5): when no image, show initials in Fraunces on `--bg-secondary` square.

### Navigation (sidebar)

> Current values (colors, routes, active states): see `.windsurfrules` § Sidebar.

- Dark sidebar + light content area creates spatial hierarchy (Harvard Atlas reference)
- Active nav item uses left-border accent for scannability without breaking the dark surface
- No right border — the contrast boundary IS the edge
- Implementation: `<Nav>` component in `web/src/components/Nav.tsx`

### Decade Selector
- A horizontal strip below the main chart on the evolution page
- Decades from 1800 to 2010
- Each decade is a clickable segment
- Selected decade: --accent-primary background
- Clicking a decade filters all charts on the page to that decade's data
- Can also select a range by click-dragging

### Filter Controls
- Minimal. Dropdowns for country, movement, era.
- Styled as inline text with underline: "Showing [all countries ▾] in [all movements ▾] from [1800 ▾] to [2020 ▾]"
- This is the Economist/FT approach: filters as readable sentences, not form elements.

## Animation & Interaction

### Page transitions
- Cross-fade between routes (200ms)
- Charts animate in on first load: areas grow from baseline, nodes fade in

### Chart interactions
- **Hover:** highlight the hovered element, dim others to 0.3 opacity
- **Click:** toggle sticky selection (stays highlighted after mouse leaves)
- **Zoom/pan:** on timeline charts, scroll to zoom X axis, drag to pan. Pinch on mobile.
- **Linked views:** selecting a decade on the evolution page filters all three chart tracks simultaneously

### Loading states
- Skeleton: show chart axes and layout immediately, data fades in
- No spinner. No "Loading..." text. The structure appears instantly, data populates.

## Responsive Strategy

### v1: Desktop-first (1024px+)
- Sidebar nav, full charts, side-by-side layouts
- This is the primary experience. Optimize here first.

### v2 stretch: Tablet (768-1023px)
- Sidebar collapses to hamburger menu
- Charts go full-width
- Small multiples: 2 columns

### v3 stretch: Mobile (< 768px)
- Bottom tab nav (not sidebar)
- Charts go full-width, scrollable
- Network graph may be impractical — show a simplified list view instead
- Deprioritize mobile. This is a desk-based exploration tool.

## Implementation Notes for Windsurf

### Fonts (Google Fonts, loaded via next/font)
```typescript
import { Fraunces, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
```

### Tailwind v4 (CSS-first)
No `tailwind.config.ts`. All design tokens defined directly in `web/src/app/globals.css` using `@theme inline`. Font families, colors, and spacing are CSS custom properties consumed by Tailwind utility classes.

### Chart library choice by chart type
| Chart | Library | Why |
|-------|---------|-----|
| Stacked area (materials, movements) | D3 in React wrapper | Full control over styling, animation, annotations |
| Small multiples (geography) | D3 in React wrapper | Consistent with stacked area approach |
| Timeline (sculptor lifespans) | D3 in React wrapper | Custom layout needed |
| Network graph | react-force-graph-2d | Purpose-built, performant, customizable |
| Data table | @tanstack/react-table + custom styled | Sorting, filtering, virtualization |
| Tooltips | Custom React component | Unified style across all chart types |

Using D3 for the main charts (not Recharts) gives full control over every visual parameter — axis formatting, grid opacity, annotation placement, transition easing. This matches ggplot-style parameter tuning.

### Key D3 parameters the developer will tune
These are the web equivalents of ggplot `theme()` parameters:

```javascript
// Axis styling (≈ ggplot axis.text, axis.line, axis.ticks)
const axisConfig = {
  tickSize: 0,                    // no tick marks (or 4 for subtle)
  tickPadding: 8,                 // space between tick and label
  tickFormat: d3.format(','),     // number formatting
  labelColor: '#6B706D',          // --text-tertiary (WCAG AA safe)
  labelSize: '0.75rem',           // --text-xs
  lineColor: '#CDD0CA',          // --border-axis
  lineWidth: 1,
}

// Grid styling (≈ ggplot panel.grid)
const gridConfig = {
  color: '#EDEFE9',               // --border-grid
  opacity: 0.5,
  strokeDasharray: 'none',        // solid, not dashed
  // Only horizontal gridlines. No vertical.
}

// Margins (≈ ggplot plot.margin)
const margin = {
  top: 40,     // space for title
  right: 20,   // breathing room
  bottom: 48,  // space for x-axis + label
  left: 56,    // space for y-axis labels
}

// Transitions (no ggplot equivalent — this is the upgrade)
const transition = {
  duration: 400,
  easing: d3.easeCubicOut,
}
```

## Build Phases

> Phasing, task lists, and current status: see `docs/ROADMAP.md`.
> Architecture rules (URL state, D3, stable JSON, design tokens from day 1): see `.windsurfrules` § 8 Non-negotiable rules.

**MVP exit criteria:** Fabio can open a URL, see a real chart with real data, search for a sculptor by name, and share a link that reproduces his view. The design looks intentional (not a prototype). He can give feedback.

## Aspiration

Imagine someone from the National Sculpture Society opens this link. Within 3 seconds they understand what it is. Within 10 seconds they've clicked something and seen the data respond. Within 30 seconds they've found a sculptor they know and learned something they didn't. Within 2 minutes they've shared the link with a colleague.

The tool should feel like it was made by someone who cares about sculpture AND cares about design. Not one or the other.

## First-visit experience

The timeline page (the landing destination) should open with a brief orientation — not a scrollytelling essay, just enough context to frame the data:

**Headline (serif, --text-2xl):** "How Sculpture Evolved"
**Subtitle (sans, --text-base, --text-secondary):** "48,000 sculptors. 200 years of materials, movements, and geography — from Wikidata, the Met, and the Art Institute of Chicago."

This sits above the first chart. Below it, the filter sentence ("Showing all countries in all movements from 1800 to 2020") provides the current-state description. Then the charts.

No tutorial overlay. No "click here to start" button. No animation on first load that blocks interaction. The data should be visible and interactive within 2 seconds of page load.

## App Identity

> Name and tagline: see `.windsurfrules` § Identity.

**Tone:** Factual, humble, data-forward. This is not an authoritative art-historical argument — it's a lens on structured public data. Caveats are features, not bugs. When the data is incomplete, say so.

**Curation disclosure:** The curated sculptor list emphasizes the National Sculpture Society tradition. It is not a comprehensive survey of global sculpture. Provenance tracked in `overrides/focus_sculptors.csv`.

## Standards

### Capitalization normalization (Wikidata data quality)

Wikidata movement labels are inconsistently cased: `abstract art`, `Expressionism`, `COBRA`. Gender labels are lowercase (`female`, `male`). **Never display raw Wikidata strings directly.**

- **Rule:** Apply `toTitleCase()` to movement and gender labels at render time only. Do NOT mutate the raw JSON — normalization is a display concern, not a data concern.
- **`toTitleCase()` logic:** capitalize the first letter of each word, except lowercase articles/prepositions in the middle of a phrase (`and`, `of`, `the`, `in`, `for`, `a`, `an`, `on`, `to`, `with`, `by`). Handle known all-caps acronyms (`COBRA`, `ULAN`, `AIC`, `IIIF`, `API`, `NSS`, `WWI`, `WWII`) as exceptions.
- **Implementation:** `lib/utils.ts` — exports:
  - `toTitleCase(str: string | null | undefined): string` — main formatter
  - `formatDisplayValue(value, { isName?, isMovement?, isGender? })` — handles null/"No X listed" → em dash
  - `formatGender(gender)` — respectful gender display with known value mapping
- **Apply in:** name column cells, movement pill on SculptorCard, movement column in Explore table, movement labels in chart legends, movement/citizenship/gender display in SculptorDetail.
- **Gender display:** use `formatGender()` which maps: `male` → `Male`, `female` → `Female`, `non-binary` → `Non-binary`, `genderfluid` → `Genderfluid`, `trans man` → `Trans Man`, `trans woman` → `Trans Woman`. Gender is a sensitive field — display it respectfully, not as a raw database string.
- **Null/placeholder handling:** any value matching `/^no\s+\w+\s+listed$/i`, `/^unknown$/i`, `/^none$/i`, or empty/null → display as `—` (em dash). Never show "No movement listed" in the UI.

### Explore table standards

- **Default sort:** birth year ascending (chronological). Defines the table's narrative arc.
- **Name column:** `text-accent-primary` + `hover:underline` + `cursor-pointer`. The only cell that links out — make it obvious.
- **Zebra striping:** alternate row backgrounds `--bg-primary` / `--bg-card`. Subtle — 2-3% luminance difference. No row borders.
- **"No movement listed"** strings from the pipeline must not appear. Show `—` (em dash) for any empty/null/"No X listed" values. Pipe this through a display utility, not ad-hoc in components.
- **Decade column format:** `1920s` not `1920`. Already correct but confirm consistently.

### Chart interaction affordances

Interactive charts must always signal their interactivity. Never require the user to discover interactions by accident.

- **Cursor:** any clickable chart region must set `cursor: pointer` on the SVG element or its hit-target rect. This is the minimum affordance.
- **Hover state:** interactive decade bands in stacked area charts should visually respond on hover: lighten the band opacity slightly (e.g. band opacity 0.08 → 0.2) before click.
- **Interaction hint text:** keep the subtitle "click to filter" but ensure it is visually distinct — use an underline or small icon to signal it is an instruction, not just a description.
- **Selected state:** active/selected elements must have a clearly distinct visual state from hover and default. Active decade band: `--color-accent-primary` at 0.15 opacity is correct. Add a 2px top+bottom border on the band in `--color-accent-primary` to make it unmistakable.
- **Linked filter banner:** the "Filtered: 1930s" banner (already implemented on Evolution page) is the right pattern. Keep it. It provides persistent confirmation that a filter is active.

### About page standards

- **Builder credit** must be in the Credits section, first line: `"Built by Asher Zafar"` with link to LinkedIn.
- **Inspired by credit:** `"Inspired by Fabio J. Fernández, National Sculpture Society"`
- **Data source phase references:** do not list data sources with phase numbers in the UI. Phases are internal planning concepts. Instead: mark sources as "Current" or "Planned" and only list current ones under Data Sources. Move planned sources to a separate "Planned" subsection.
- **GitHub link:** optionally link to the repo for transparency about methodology. This is the right kind of project to show the work publicly.

### URL state & shareability
- All major filter state is encoded in URL query parameters: `/evolution?country=France&movement=Expressionism&from=1900&to=1950`
- Individual sculptor pages use Wikidata QIDs: `/explore/Q7325` (Auguste Rodin)
- Ephemeral state (hover, tooltip position, selection highlight) stays in local React state — not in URL
- Use `useSearchParams()` from Next.js App Router. Write to URL on every filter change.
- Copying the URL at any point should give someone else the exact same view.

### Export
- Small export button (camera icon or "Export PNG") in the top-right corner of each chart container
- D3 charts render as SVG → export via `html2canvas` or direct SVG serialization → PNG download
- Filename convention: `sculpture-in-data_[chart-name]_[filters].png` (e.g. `sculpture-in-data_materials_france_1900-1950.png`)
- Phase 3 implementation. Design the button placement and style now (small, --text-tertiary, visible on hover over the chart container).

### Empty states
- When a filter combination returns zero results: show the chart container at full size with a centered message in --text-secondary:
  - "No sculptors match these filters."
  - Below it, in --text-tertiary: "Try broadening your date range or removing a filter."
- When a sculptor card has no image: show a placeholder square in --bg-secondary with a subtle sculpture silhouette icon or just the initials in serif font.
- When search returns no results: "No sculptors found for '[query]'" with suggestion to check spelling.

### Error & data degradation
- When a chart's data is partially incomplete, show **inline text below the chart** in --text-tertiary, --text-xs:
  - "Movement data unavailable for 12 of 340 sculptors in this view."
  - "Citizenship unknown for 8% of sculptors born before 1850."
- Never silently drop data. If sculptors are excluded due to missing fields, count them and disclose.
- On network graph: if a sculptor has no edges, they appear as an isolated node (not hidden). Tooltip: "No documented relationships in Wikidata."

### Social sharing (Open Graph)
- Auto-generated OG meta tags in `layout.tsx`:
  - `og:title`: "Sculpture in Data — How Sculpture Evolved"
  - `og:description`: "Explore 48,000 sculptors across 200 years of materials, movements, and geography."
  - `og:image`: Static preview image (a screenshot of the evolution page, 1200×630px, stored in `public/og-image.png`). Generate once during Phase 4.
  - `og:url`: dynamic based on current page
- Per-page titles: "Materials Over Time — Sculpture in Data", "Auguste Rodin — Sculpture in Data"

### Performance budget
- **First contentful paint:** <3 seconds
- **Time to interactive:** <5 seconds
- **Total JSON payload:** <3MB (currently estimated ~2-3MB for ~10-15K sculptors + aggregations)
- **Chart re-render on filter change:** <200ms (pre-aggregated data makes this achievable)
- **No lazy loading of data** — load all JSON on initial page load, cache in memory. The dataset is small enough.
- **Bundle size:** monitor with `next build` output. Flag any single dependency >100KB.

### Internationalization & character handling
- UI language: English only.
- Sculptor names: full UTF-8 support. Many names have diacritics (Brâncuși, Müller, José). The pipeline already pulls English-language labels from Wikidata but names retain original diacritics.
- Font requirement: Fraunces and DM Sans both support extended Latin character sets. Verify coverage for Romanian (ș, ț), German (ü, ö, ä, ß), French (é, è, ê, ç), Scandinavian (å, ø, æ), and Japanese romanization (macrons: ō, ū).
- Search should be diacritic-insensitive: searching "Brancusi" should find "Brâncuși". Implement with `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` on both query and index.

### Mobile strategy (v1)
- Desktop-first: optimized for 1024px+ viewport.
- On viewports <768px: show a centered message over a blurred/dimmed screenshot of the app:
  - "Sculpture in Data is designed for desktop."
  - "Visit on a laptop or desktop for the full experience."
- No attempt to make charts responsive in v1. This avoids shipping a broken mobile experience.

### About page content
The about page should include:

1. **What this is:** 2-3 sentences. "Sculpture in Data is an interactive tool exploring how sculpture evolved over 200 years. It draws on structured data from Wikidata, the Metropolitan Museum of Art, and the Art Institute of Chicago."
2. **What it isn't:** "This is not an art-historical argument. It's a data lens. The data has gaps, biases, and errors — especially in movement labels and influence relationships. Where we know about quality issues, we've noted them."
3. **Data sources:** Wikidata (CC0), Met Museum API (CC0), Art Institute of Chicago API (CC0), Getty ULAN (ODC-By — attribution required). Link to each.
4. **Methodology:** Brief explanation of pipeline (SPARQL queries, museum API pulls, reconciliation, quality overrides). Link to GitHub repo.
5. **Known limitations:** Movement labels from Wikidata are inconsistent. Influence relationships are sparse for modern sculptors. Museum data skews toward Western canonical sculpture. The "notability filter" means many sculptors in Wikidata are not shown.
6. **Attribution:** "Built by Asher Zafar" with LinkedIn link. "Powered by data from [sources]. Contains information from the Union List of Artist Names (ULAN)® which is made available under the ODC Attribution License."
7. **Feedback:** "Have corrections, suggestions, or questions? [contact method]."

### Sculpture images (future, not v1)
- Met and AIC both provide IIIF image URLs for public domain works.
- Future implementation: pull `primaryImage` from Met API, `image_id` from AIC API.
- Display on sculptor profile pages and as thumbnails on cards.
- Only public domain images (CC0). Check `isPublicDomain` flag from Met API.
- Respect IIIF sizing: request thumbnails at 200px width, full images at 843px.

### Domain
- v1 deploys to Vercel default subdomain (e.g. `sculpture-in-data.vercel.app`)
- Custom domain decision deferred. If purchased later, Vercel handles the redirect automatically.
