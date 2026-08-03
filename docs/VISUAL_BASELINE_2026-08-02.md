# Phase 5Q Visual Baseline — 2026-08-02

**Status:** route/task and encoding baseline complete; rendered Timeline
desktop/390px evidence recorded; remaining routes and assistive-technology
review pending

**Release candidate:** 2026-08-02.1 on
`codex/phase-5q-stabilization`

**Rendered-evidence branch:** `codex/phase-5q4-rendered-baseline`, based on
`54a095f`

**Method:** `docs/RESEARCH_FOUNDATIONS.md` visual-foundations exercise and
`docs/ROADMAP.md` review gates

## Evidence boundary

This artifact distinguishes three evidence levels:

1. **Verified in source/contracts:** route structure, data semantics, URL
   state, DOM scale, breakpoints, accessible names, motion code, and generated
   denominators.
2. **Verified by automated Chromium journeys:** seven core routes/states,
   including 390px navigation reachability and movement-route integrity.
3. **Verified in the rendered Timeline preview:** 1440×900 desktop and 390×844
   mobile layout, a 720×450 CSS-viewport reflow proxy for a 1440×900 display at
   approximately 200% zoom, pointer interactions, URL persistence, sampled
   contrast, visible focus on representative native controls, DOM focus order,
   horizontal-scroll reachability, and warning/error console output.
4. **Not yet perceptually reviewed:** the remaining routes, actual browser
   zoom and WCAG text-spacing overrides, forced colors, grayscale/color-vision
   simulation, reduced-motion behavior, sequential keyboard activation in an
   assistive-technology browser session, screen-reader output, and
   comprehension with readers.

The successful rendered review used the user-supplied Vercel preview
`https://sculptor-explorer-honqy7k8z-asherzafars-projects.vercel.app/timeline`.
The user identified it as the preview for source commit `54a095f`; the page’s
artifact/snapshot copy matched release candidate 2026-08-02.1, but the Vercel
UI did not independently expose a commit identifier during the audit. No
production promotion, retention change, or deployment cleanup was performed,
and preview retention behavior remains unverified. A Vercel preview toolbar
was visible in the signed-in audit session and is excluded from product
findings; hide or crop it from the canonical screenshot baseline.

## Rendered Timeline audit

### Test matrix and measured evidence

| Lens | Desktop evidence (1440×900) | Mobile/reflow evidence |
|---|---|---|
| Visual/layout | 224px persistent sidebar; 1,216px main region; chart rendered at 1,184×1,180px. Fraunces/DM Sans loaded and the title, subtitle, disclosure, controls, and chart read as one coherent hierarchy. | At 390×844 the mobile header is 108px high, content is 343px wide, the disclosure is 344.5px high, sort controls begin at y=734.25, and the chart begins at y=790.25. |
| Responsive overflow | The main region scrolls vertically; the route has no page-level horizontal overflow. | The 700px chart sits in a 343px horizontal scroller. The chart scroller is 1,227px high, so its scrollbar appears only at the bottom. Panning to `scrollLeft=300` reveals later dates but removes the corresponding names. The 567px navigation scroller can reveal all seven links. |
| Interaction/state | Alphabetical is selected on the bare route. Selecting Chronological writes `?sort=chrono`, updates `aria-pressed`, survives reload/back navigation, and reorders the first row to Hiram Powers. Clicking that row opens `/explore/Q2572996`. | Navigation and chart horizontal scrolling work. Timeline row bounds render at about 12.44px high in the scaled SVG, below an adequate touch target. No scroll instruction is present. |
| Accessibility/keyboard | The chart has `role="img"` and an accurate accessible name. Representative sidebar-link and sort-button focus outlines are visible; sort controls are native buttons with `aria-pressed`, and Timeline links expose `aria-current="page"`. The SVG has zero tabbable descendants and no structured table/list equivalent. No skip link precedes repeated navigation. | The same zero-tabstop chart is exposed on mobile. The header links and sort controls remain semantic, but the chart cannot provide keyboard or screen-reader record inspection. Sequential Tab/activation behavior was not conclusively verified by the in-app synthetic-key path and still needs a real keyboard/assistive-technology pass. |
| Zoom/reflow | — | At the 720×450 CSS-viewport proxy, the shell switches to the mobile header and text/disclosure content reflows without page-level horizontal overflow. The chart remains a 700px canvas in a 608px scroller, so the core chart-equivalence defect persists. This is reflow evidence, not a substitute for actual 200% browser zoom. |
| Color/type | Primary text, subtitle, navigation, sort controls, axis labels, WWI, and “NSS Founded” passed the sampled contrast check. | “Armory Show” renders at 9px in sandstone with 2.13:1 contrast on `#FAFAF9`; this fails WCAG AA for text. Mobile chart labels render at approximately 9–12px and become difficult to scan. |
| Console | No warnings or errors after load, sorting, detail navigation, reload/back, and viewport changes. | No warnings or errors at 390px. |

### Ranked confirmed defects

These are observed failures, not aesthetic preferences. “Existing” means the
source/contract baseline already named the risk; “new” means the rendered
review supplied a previously unrecorded defect or measurement.

| Rank | Severity | Finding and evidence | Affected routes | Prior status |
|---|---|---|---|---|
| 1 | **P1** | **Mobile Timeline loses name/date correlation.** A 700px chart is shown through a 343px viewport; the only scrollbar is at the bottom of a 1,227px region, and scrolling right hides the names needed to interpret the bars. No structured equivalent or scroll guidance is adjacent. | `/timeline`; pattern risk for other horizontally scrolling chart routes | Existing risk, newly confirmed and measured |
| 2 | **P1** | **The 48 clickable Timeline rows are not keyboard-inspectable.** The SVG has an accessible name but zero tabbable marks and no list/table path. Pointer navigation succeeds, so equivalent keyboard and screen-reader access—not data availability—is the missing layer. | `/timeline`; reusable requirement for Evolution, Migration, and Lineage | Existing risk, newly confirmed in rendered DOM |
| 3 | **P1** | **Mobile row targets are about 12.44px high.** The scaled chart rows are too small for reliable touch selection and are packed more tightly than a 24px minimum target pattern. | `/timeline` | New measurement |
| 4 | **P2** | **The Timeline’s useful data begins below the first mobile viewport.** The disclosure occupies 344.5px and pushes controls/chart to y=734/y=790; the route explains itself well but does not expose the visualization promptly. | `/timeline`; provenance hierarchy opportunity on all analytical routes | Existing provenance-density risk, newly confirmed and measured |
| 5 | **P2** | **“Armory Show” fails text contrast.** Sandstone on the warm page background measures 2.13:1 at 9px. | `/timeline`; audit the same sandstone text use wherever it appears | Existing small-annotation/color risk, new confirmed failure |
| 6 | **P2** | **There is no skip link before repeated navigation.** Landmarks and visible focus exist, but keyboard users lack a direct bypass to main content. | Shared shell; all routes | New shared-shell defect |

### Ranked design opportunities and open decisions

These are not confirmed failures and should be tested rather than treated as
automatic restyling instructions.

| Rank | Severity | Opportunity / decision | Affected routes | Prior status |
|---|---|---|---|---|
| 1 | **P1 opportunity** | Pair the chart with a chronological, URL-state-aware name/lifespan list. On narrow screens the list can become the primary reading path; on desktop it can serve keyboard/screen-reader detail without removing the overview. | `/timeline`; pattern candidate for dense chart equivalents | Already documented; rendered audit strengthens priority |
| 2 | **P2 opportunity** | Shorten or progressively disclose `DataScopeNote` on narrow screens only after testing that readers still notice scope and limits. Moving it below the first useful action is an alternative to collapsing it. | All analytical routes | Already documented; mobile height is new evidence |
| 3 | **P2 opportunity** | Preserve the strong dark/light catalogue identity and desktop hierarchy. The rendered result supports keeping Fraunces, DM Sans, Verdigris & Marble, whitespace, and direct source disclosure while changing interaction structure. | All routes | Already documented; now positively supported by Timeline evidence |
| 4 | **P2 opportunity** | Improve mobile navigation information scent without assuming a hamburger is better. The 390px scroller reaches all routes, but About/Transparency begin offscreen; test edge fades, grouping, or another visible overflow cue. | Shared mobile shell | Automated reachability was documented; visual discoverability is new |
| 5 | **P2 decision** | Resolve sort-default documentation drift before changing behavior. The bare route and this baseline treat Alphabetical as canonical, while an older Roadmap Phase 2.5 line calls Chronological the default. URL round-tripping itself passes. | `/timeline`; documentation | New cross-document inconsistency, not a rendered defect |

### Recommended implementation order

The route order remains **Explore → Timeline → dense routes**, as specified in
the Roadmap. The Timeline evidence changes priority within its slice, not the
governing sequence:

1. In the Explore slice, establish the reusable responsive list/table,
   visible-focus, skip-link, URL-state, and target-size patterns.
2. In the Timeline slice, add the structured name/lifespan/detail-link
   equivalent and semantic keyboard path first; then fix mobile correlation,
   target size, disclosure placement, scroll guidance, and the sandstone
   annotation contrast.
3. Carry only the proven equivalent/focus/provenance patterns into Evolution,
   Migration, and Lineage; do not mass-restyle the shell or palette.
4. Complete actual 200% zoom, text-spacing, forced-colors, reduced-motion,
   screen-reader, and reader-comprehension checks before declaring the
   Timeline or 5Q.4a gate complete.

## Route and task matrix

| Route | Primary reader question / first useful action | Reproducible state | Current equivalent/mobile path | Highest-risk issue |
|---|---|---|---|---|
| Timeline | “When did these focus sculptors live?” Sort or open one lifespan. | sort query; alphabetical is canonical default | Page is available; chart has a 700px minimum inside horizontal overflow | No structured lifespan equivalent; horizontal canvas and bar details need mobile/zoom/keyboard review |
| Explore | “Can I find a named sculptor or browse the roster?” Search, sort, then open a record. | None for search/sort/filter | Full table is present and horizontally scrollable | All 3,543 rows mount; consequential state is local; wide table has no task-specific mobile list |
| Evolution | “How do recorded geography and movement labels change by birth decade?” Change geography source or select a decade. | geography source and selected decade in URL | Entire analytical route is replaced by a notice below md | Mobile has no analytical equivalent; stacked areas rely heavily on color/area; panels have incompatible denominators |
| Evolution—materials | “What material categories appear in the bounded museum-object sample over object time?” Read the static overview. | No consequential interaction | Inherits Evolution’s route-level mobile gate | Only 132 object observations; object decade must never be coupled to artist birth-decade state |
| Migration | “Which recorded birth/death-country endpoints differ, and for whom?” Select decade/same-country state and inspect a pair. | Decade and same-country state in URL | Entire route is replaced by a notice below md | Sankey pair width/hover has no mobile or structured overview; “migration” naming can imply a journey despite caveats |
| Lineage | “What source-asserted relationships surround an artist?” Focus a person, choose hops/layers, inspect neighbors. | Focus, hops, node kinds, edge/filter state in URL | Entire route is replaced by a notice below md | Force layout, hover details, and high density have no phone/keyboard/structured equivalent; layout distance is non-semantic |
| Decade | “What characterizes the published birth cohort in this decade?” Scan counts/categories and open an entity. | Decade path | Ordinary responsive content; tables/lists are primary | Leading-category lists can be mistaken for complete distributions; mobile/perceptual review pending |
| Movement | “What does the source label connect in this dataset?” Scan decade/country/peer patterns and open an artist. | Movement slug path; pages require three records | Ordinary responsive content | Sparse P135 labels can look more coherent than the source supports; aggregate pages need long-label/reflow review |
| Sculptor detail | “What does the source record say, what is missing, and where can I go next?” Inspect fields and connected entities. | QID path | Ordinary entity journey | Hover-only visibility of some affordances, dense source labels, completeness dots, and long names need touch/focus review |
| About / Transparency | “What is this, who is represented, and can I trust the claims?” Read scope/release/coverage and follow evidence. | Stable paths | Ordinary prose; some wide tables scroll | Provenance density may obscure hierarchy; audit tables require 200% zoom/reflow review |

## Encoding inventory

### Lifespan timeline

- **Quantitative:** horizontal position and length encode years/lifespan.
- **Categorical/state:** bar color encodes birth decade; text labels identify
  people; sort buttons expose narrative order.
- **Interaction:** hover tooltip and bar click to the QID detail route.
- **Risk:** color interpolation is currently constructed from literal hex
  endpoints rather than resolved tokens. The SVG has an accessible name, but
  its individual marks are not a keyboard-readable dataset.
- **Simpler equivalent to test:** chronological name/lifespan list with the
  same sort state and entity links, paired with the chart on narrow screens.

### Geography, movement, and material stacked areas

- **Quantitative:** vertical extent/area represents counts over decades.
- **Categorical:** fill color plus an external text legend identifies the top
  categories and Other.
- **Interaction:** geography/movement decade selection changes a shared
  artist-birth-decade state. Materials are intentionally static because their
  decade is the museum object date, a different temporal variable.
- **Risk:** stacked areas favor overview shape, not accurate non-baseline
  comparison; repeated palette colors and color-only areas need grayscale and
  color-vision testing. Other combines long-tail and unknown cases in some
  projections.
- **Alternatives to test:** small multiples with shared axes; directly labeled
  top lines; table of decade/category counts; a static material small-multiple
  because the sample is small.

### Endpoint Sankey

- **Quantitative:** link width encodes record count; node/link position is
  layout, not geography.
- **Categorical/state:** source/destination columns, color, hover/pinned pair,
  and side-panel text identify the selected endpoint pair.
- **Interaction:** decade and same-country filters are URL-backed; hover/pin
  exposes representative records.
- **Risk:** width and crossings are hard to compare; hover is not a keyboard or
  phone equivalent; the route name can overstate what two endpoints prove.
- **Alternatives to test:** ranked pair table, origin-by-destination matrix for
  a focused subset, and top-pairs summary before the full Sankey.

### Lineage network

- **Quantitative:** node size encodes degree in this graph; edge count and
  filters shape density.
- **Categorical/state:** circle/diamond/square encode entity kind; movement
  color, dashed institution edges, labels, and hover halos add channels.
- **Interaction:** focus, hops, relation type, node kinds, degree threshold,
  and movement filters; many are URL-backed.
- **Risk:** force position/distance has no historical meaning; hover carries
  material detail; movement palette cycles; transitions ignore reduced-motion
  preferences; current and opt-in simulations sit in the yellow performance
  band.
- **Alternatives to test:** focused adjacency list, ego-network summary,
  institution/person small multiples, and temporal event bands before any
  animation.

### Tables, cards, and provenance notes

- Text, position, grouping, and tabular figures carry most meaning and are the
  strongest existing non-visual path.
- Whole-row click plus nested entity links need touch/keyboard review so the
  target destination is predictable.
- DataScopeNote standardizes source/scope/snapshot/limits but can become a
  large repeated preamble. Test a concise default with expandable depth only
  if limitation awareness does not fall.

## Type, layout, and color questions to test

### Typography

Preserve Fraunces + DM Sans as the baseline identity. Build the specimen before
considering another face:

- short/long names, diacritics, non-Latin native forms, institution names;
- dates, tabular counts, axis labels, 10–12px caveats, and dense table rows;
- 320/390/768/1024/1440 widths, 200% zoom, and WCAG text-spacing overrides;
- visible focus and link recognition when hover is unavailable.

The first question is hierarchy and readability, not replacement. Specific
risks are over-dense 12px provenance text, long-line prose, display-weight
consistency, and small chart annotations.

### Layout and information architecture

- Preserve the catalogue-like whitespace and strong dark/light navigation
  boundary.
- Revisit page-level hierarchy: primary question, useful first action,
  provenance, visual overview, and details should read in that order.
- Test “generous” collection entry points alongside precise search. Global
  search should not eliminate browseable structure.
- Remove page-level overflow; bounded chart/table scrolling needs a visible
  cue and an adjacent equivalent.
- Prefer one end-to-end route pattern over mass spacing changes. Explore is the
  first slice because it combines the core find task, largest DOM, state debt,
  link integrity, and mobile table pressure.

### Color

- Inventory every nominal, ordered, diverging, confidence, hover, and selected
  use before changing palette values.
- Preserve Verdigris & Marble for identity while deriving analytical scales by
  data semantics; seven repeated hues are not automatically sufficient for a
  movement long tail.
- Test WCAG 2.2 contrast, grayscale, forced colors, and common color-vision
  simulations on the warm light surface and the dark graph surface.
- Resolve literal chart colors through tokens and evaluate ramps in a
  perceptual space such as OKLCH. WCAG 2.2 remains the acceptance standard;
  draft APCA/WCAG 3 measures are diagnostic only.

## Ranked findings

### P0 — Correctness/truth (fixed in this slice)

- Evolution rendered a stale “coming in Phase 2” material placeholder even
  though the committed export contains 132 observations. It now uses the
  existing D3 area pattern and explicitly remains independent of the
  artist-birth-decade filter.
- Migration metadata called endpoint differences “the canon’s migration
  story.” It now describes recorded endpoints and says they are not
  reconstructed journeys.

### P1 — First route slices

1. **Explore state and scale:** URL-backed query/sort/filter plus pagination or
   virtualization; responsive table/list; accessible search label; preserve
   deterministic row/entity links.
2. **Timeline equivalence:** structured lifespan list, explicit horizontal
   scroll cue only if retained, touch/keyboard bar detail, and type specimen.
3. **Dense-route equivalence:** mobile summaries/lists for Evolution,
   Migration, and Lineage rather than page-level notices alone.
4. **Visualization accessibility:** useful adjacent summaries/data, keyboard
   detail paths, focus, non-color state, reduced motion, zoom/reflow, and one
   screen-reader pass per novel pattern.

### P2 — System improvements after the first slice proves them

- Token-resolved/perceptually tested chart ramps and removal of undocumented
  literal-color exceptions.
- Concise-but-effective provenance hierarchy.
- Global entity search and institution pages/links as post-gate connective
  tissue.
- Coordinated, URL-backed analytical entry points after comprehension testing.

## Gate evidence still required

Before 5Q.4a closes:

- consistent desktop and 390px screenshots for every primary route;
- 200% zoom/text-spacing and page-overflow measurements;
- keyboard order, focus visibility, and chart-detail task results;
- automated accessibility scan followed by a screen-reader pass;
- grayscale/color-vision and forced-colors review;
- route payload, interaction latency, and p75 field or controlled-lab Web
  Vitals baseline;
- founder review of hierarchy, material feel, and whether the product remains
  playful and inviting rather than merely compliant.

Do not propagate a broad visual change until the first Explore route slice has
this evidence or an explicit exception/next test.
