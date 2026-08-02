# Phase 5Q Visual Baseline — 2026-08-02

**Status:** route/task and encoding baseline complete; rendered perceptual
review pending

**Release candidate:** 2026-08-02.1 on
`codex/phase-5q-stabilization`

**Method:** `docs/RESEARCH_FOUNDATIONS.md` visual-foundations exercise and
`docs/ROADMAP.md` review gates

## Evidence boundary

This artifact distinguishes three evidence levels:

1. **Verified in source/contracts:** route structure, data semantics, URL
   state, DOM scale, breakpoints, accessible names, motion code, and generated
   denominators.
2. **Verified by automated Chromium journeys:** seven core routes/states,
   including 390px navigation reachability and movement-route integrity.
3. **Not yet perceptually reviewed:** screenshots, optical hierarchy, actual
   wrapping/clipping, color discrimination, focus visibility, keyboard-only
   chart-detail inspection, zoom/reflow, screen reader behavior, and
   comprehension with readers.

The Codex in-app browser safety layer denied this repository’s localhost URL.
That is an automatic browser-policy boundary, not a request for broader file
permissions. No alternate browser-control route was used. Automated browser
success is therefore not presented as visual or assistive-technology evidence.

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
