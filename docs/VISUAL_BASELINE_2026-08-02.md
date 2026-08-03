# Phase 5Q Visual Baseline — 2026-08-02

**Status:** 5Q.4a machine-observable rendered/perceptual baseline closed on
2026-08-03; confirmed P1/P2 defects move to route implementation, while the
owner-run physical-browser, screen-reader, and reader-comprehension checks below
remain required before the 5Q product-quality gate can pass

**Release candidate:** 2026-08-02.1 on
`codex/phase-5q-stabilization`

**Closeout branch:** `codex/phase-5q4a-baseline-closeout`, based on protected
`origin/main@8a4fccdeef90b2678a87d957e57d3d438a7fd317`

**Audited deployment:** Vercel production deployment
`dpl_9VXLKKGNH1hcgHtCi5dHdDgY9mii`, `READY`, immutable URL
`https://sculptor-explorer-ilqzs1h0f-asherzafars-projects.vercel.app`, source
`main@8a4fccdeef90b2678a87d957e57d3d438a7fd317`

**Method:** `docs/RESEARCH_FOUNDATIONS.md` visual-foundations exercise and
`docs/ROADMAP.md` review gates

## Evidence boundary

This artifact distinguishes four evidence levels:

1. **Verified in source/contracts:** route structure, data semantics, URL
   state, DOM scale, breakpoints, accessible names, motion code, and generated
   denominators.
2. **Observed in the exact deployment:** direct inspection of the live rendered
   routes plus 67 consistent Chromium captures. The set contains route tops at
   1440×900 and 390×844, sequential-focus states, text-spacing samples, forced
   colors, four vision-deficiency simulations, and an image-failure state.
3. **Measured in standalone Chromium:** DOM/layout, Axe WCAG 2.2 AA results,
   sequential keyboard events, focus/target bounds, page and bounded overflow,
   console/request output, reduced-motion state, and controlled no-cache Web
   Vitals. These are real browser/layout events, but headless automation is not
   evidence of physical input, spoken screen-reader output, or human
   comprehension.
4. **Emulated or unavailable:** WCAG text spacing was an injected CSS override;
   forced colors and reduced motion used browser media emulation; grayscale and
   deuteranopia/protanopia/tritanopia used Chrome DevTools emulation. The in-app
   browser did not expose browser zoom and its synthetic Tab path did not move
   focus, so neither was treated as evidence. Actual 200% browser zoom,
   physical keyboard/touch use, spoken screen-reader output, and reader
   comprehension remain owner/human checks. The earlier 720×450 viewport is a
   reflow proxy only, not actual zoom.

No production code, deployment, provider setting, or retained resource was
changed during this baseline. Rapid route changes aborted speculative Next.js
prefetches; those collector-side aborts were not page-load failures. The only
product console errors were the Evolution errors recorded below.

## 5Q.4a closeout evidence matrix

| Lens | Routes/modes | Evidence | Result and boundary |
|---|---|---|---|
| Route hierarchy and responsive layout | Timeline, Explore, Evolution, Migration, Lineage, Rodin detail, 1880s decade, Cubism movement, About, Transparency at 1440×900 and 390×844 | Direct visual inspection plus 20 consistent route-top captures | Desktop hierarchy and the ordinary detail/content routes are coherent. Explore remains a wide catalogue table; the three dense analytical routes render only a desktop notice on phones. |
| Actual 200% browser zoom | Attempted on the exact deployment in the in-app browser | Tool limitation | Browser width, device-pixel ratio, and `visualViewport.scale` did not change after supported zoom-key attempts. The 720×450 historical viewport remains a proxy. Run the owner protocol below; no zoom pass is claimed. |
| WCAG text spacing | All ten routes at 390×844 with line height 1.5, paragraph spacing 2, letter spacing 0.12em, and word spacing 0.16em; Explore, detail, About, and Transparency visually inspected | Browser CSS override plus DOM measurements | No page-level horizontal overflow or clipped audited text. Timeline widened its main region by 3px and Transparency gained a 32px bounded strip overflow; verify these at actual zoom but no content loss was observed. |
| Overflow | All 20 route/viewport combinations plus text-spacing mode | Browser scroll measurements and screenshots | No baseline page-level horizontal overflow. Mobile Timeline uses a 358→700px chart scroller; Explore uses a 358→781px table scroller that is 196,386px high. The shared mobile nav is 390→567px and gives no visual overflow cue. |
| Sequential keyboard and activation | First 24 desktop/18 mobile Tab stops sampled per route; representative native controls activated | Standalone Chromium keyboard events and focus captures | Shell order is logo → seven nav links → route controls, with no skip link. Timeline sort, Explore detail link, and About→Transparency activate. Focused Migration “Include same-country endpoints” does not toggle on Space and does not write `stay=1`. Explore exposes 4,423 focusables. Physical-keyboard confirmation remains owner-run. |
| Visible focus | Shared nav plus representative buttons, links, cards, inputs, and pills | Focus-state screenshots and computed styles | Strong outlines are visible on nav links, cards, buttons, and pills. Search inputs rely on a border-color change rather than an outline; evaluate this in the physical-keyboard pass. |
| Touch targets | Timeline marks, Explore header/row links, movement decade links, and representative detail controls | Browser bounding boxes plus Axe `target-size` | Timeline pointer rows are about 12.44px high; Explore sort headers are about 16px high; four movement decade links are about 32.6×16px and fail Axe. These are below the 24px WCAG 2.2 target pattern. Physical-device accuracy is not claimed. |
| Automated accessibility | All 20 route/viewport combinations with Axe 4.11.3, WCAG 2 A/AA, 2.1 AA, and 2.2 AA tags | Direct automated result | See the counts below. Main repeated failures are contrast, a non-focusable mobile Timeline scroller, six prohibited `aria-label` uses on detail completeness dots, and four movement target-size failures. Automated results do not replace assistive-technology use. |
| Screen reader | Environment assessment after automated accessibility | Unsupported in the observable environment | No spoken output was available, so no screen-reader or comprehension claim is made. Use the owner VoiceOver/NVDA protocol below. |
| Reduced motion | Timeline, Evolution, Migration, and Lineage after `prefers-reduced-motion: reduce` | Browser media emulation, animation enumeration, 600ms sampled geometry | The settled pages had no active CSS/Web Animations and sampled geometry remained stable. The observation began after route settle, so initial Lineage force motion and reader comfort remain unverified. |
| Forced colors | Timeline, Evolution, Migration, Lineage, detail, Transparency | Chromium forced-colors emulation plus visual inspection | Shell/content routes remain legible. Timeline and Migration retain structure, but categorical distinctions weaken; Lineage graph labels/nodes wash out against the forced white canvas. This is simulation evidence, not a Windows High Contrast user pass. |
| Grayscale/color vision | Timeline, Evolution, Migration, Lineage under achromatopsia, deuteranopia, protanopia, and tritanopia | DevTools vision-deficiency emulation plus visual inspection | Labels, position, and Lineage shapes preserve some structure, but Timeline birth-decade colors collapse in grayscale and adjacent Evolution stacks become hard to distinguish. With no structured equivalent, color resilience does not pass. |
| Console and image failure | All routes/modes; seven Rodin-detail images deliberately aborted | Console/request listeners and a 390×844 failure capture | Evolution emits 80 negative-width `rect` errors at `-2.947...` and 72 at `-3.294...` across the matrix. Broken detail images retain useful alt text, but show raw broken-image chrome and the portrait loses its reserved height. No other user-visible load failure was observed. |
| Perceptual performance | Controlled no-cache Chromium pass at both widths; one run per route | Navigation timing, FCP/LCP/CLS, long-task, resource bytes | This is lab evidence, not p75 field data. LCP ranged 56–764ms. Explore produced one 82–90ms long task and 477–527KB; Lineage transferred 520–553KB. Mobile detail CLS was 0.120, above the 0.1 “good” threshold. Field p75 remains 5Q.4b work. |

### Automated accessibility counts

Counts are failing DOM nodes, not unique design defects. The same token misuse
can therefore produce thousands of nodes.

| Route | Desktop | Mobile |
|---|---:|---:|
| Timeline | none | `scrollable-region-focusable` 1 |
| Explore | `color-contrast` 2,378 | `color-contrast` 2,378 |
| Evolution | `color-contrast` 74 | `color-contrast` 6 |
| Migration | `color-contrast` 24 | `color-contrast` 6 |
| Lineage | `color-contrast` 1 | `color-contrast` 6 |
| Sculptor detail | `aria-prohibited-attr` 6; `color-contrast` 24 | same |
| Decade | `color-contrast` 99 | same |
| Movement | `color-contrast` 34; `target-size` 4 | same |
| About | `color-contrast` 1 | same |
| Transparency | `color-contrast` 5 | same |

The principal measured pairs were accent `#3d7a68` on secondary `#f0f1ee`
at 4.42:1, accent on accent-muted `#e7edeb` at 4.23:1, and 12px tertiary
`#6b706d` on secondary at 4.44:1. Lineage’s disabled label measured 2.05:1.
The earlier Timeline “Armory Show” measurement remains 2.13:1.

## Prioritized closeout findings

### Shared shell and reusable-system defects

| Severity | Finding | Scope / evidence |
|---|---|---|
| **P1** | Contextual color tokens do not meet text contrast in common secondary/muted surfaces. | Explore alone has 2,378 failing links; the pattern also appears in dense mobile notices, Evolution/detail badges, decade/movement metadata, About, and Transparency. Fix contexts/tokens deliberately, not by replacing the palette wholesale. |
| **P1** | Analytical SVGs have names but no structured, keyboard-readable equivalent and their categorical encodings degrade in forced colors/grayscale. | Timeline, Evolution, Migration, Lineage; zero tabbable SVG descendants in the default views. |
| **P1** | Reusable target patterns are below 24px. | Timeline rows ≈12.44px; Explore headers ≈16px; movement decade links 32.6×16px. |
| **P2** | No skip link precedes the repeated shell navigation. | Every route; Explore makes the cost acute with 4,423 focusables. |
| **P2** | Mobile navigation hides About/Transparency offscreen with no visible overflow cue. | All 390px route tops; automated reachability still passes. |

### Route-specific defects

| Severity | Finding | Scope / evidence |
|---|---|---|
| **P1** | Explore is not a viable narrow-screen or sequential-keyboard catalogue at current scale. | All 3,543 rows mount; 4,423 focusables; the table is 781px wide and 196,386px high in a 358px scroller; search/sort remain local rather than shareable URL state. |
| **P1** | Evolution, Migration, and Lineage have no mobile analytical equivalent. | At 390px each route is replaced by “Best viewed on desktop” plus links elsewhere. |
| **P1** | Migration’s focused same-country checkbox does not activate with Space. | Direct standalone-Chromium keyboard event; state and URL remain unchanged. |
| **P1** | Timeline loses name/date correlation on mobile and exposes no keyboard detail path. | 700px chart in a 358px scroller; scrollbar at the bottom; zero mark tab stops; 12.44px rows. |
| **P2** | Evolution generates invalid negative SVG widths. | 152 console errors across the mode matrix, with two repeated negative values. |
| **P2** | Sculptor detail completeness dots use prohibited ARIA and the mobile page shifts during image load. | Six Axe nodes; no-cache mobile CLS 0.120. |
| **P2** | Detail image failure is semantically survivable but visually unstable. | All seven failed images retain alt text, while the portrait collapses in height and browser broken-image chrome remains visible. |
| **P2** | Timeline’s disclosure delays the first useful mobile data view and one annotation fails contrast. | Chart begins below the first 844px viewport; “Armory Show” is 2.13:1. |

There are no P0 findings. Decade, movement, detail, About, and Transparency
otherwise show sound responsive hierarchy and no baseline page overflow.
Desktop Explore and the three analytical routes retain the project’s strong
catalogue identity, direct source/scope/snapshot/limits disclosure, and coherent
Fraunces/DM Sans hierarchy. These are preservation constraints for 5Q.4b.

## Remaining owner/human protocols

These checks are not delegated to viewport proxies or inferred from source.
Record browser/OS/version, route, task, exact utterance or observation, and a
pass/fail/blocked result beside each run.

1. **Actual 200% browser zoom:** on a 1440×900 physical display, open the exact
   preview head in current Chrome and Safari with DevTools closed. Use
   `Command`+`+` until the browser UI reports 200%; do not resize the viewport as
   a substitute. For all ten routes, capture the top, first action, deepest
   bounded table/chart, focus indicator, and any horizontal/page overflow.
   Activate at least one consequential control, reload its URL, then reset with
   `Command`+`0`.
2. **Physical keyboard:** disconnect or avoid the pointer. From the address bar,
   use Tab/Shift+Tab through the logo, all navigation, route controls, and the
   first content action. Use Enter and Space as appropriate; use arrow keys for
   native groups/sliders. Confirm order, visible focus, no trap, skip-link
   behavior once implemented, and URL/state persistence. Reproduce the
   Migration checkbox failure before fixing it.
3. **VoiceOver + Safari on macOS:** enable VoiceOver before page load. Use the
   rotor to enumerate landmarks, headings, links, form controls, and tables;
   then complete: find/open Rodin in Explore, identify one Timeline lifespan,
   identify the largest Evolution category for a chosen decade, inspect one
   Migration pair, inspect one Lineage relationship, and state each route’s
   source/scope/limits. Record the actual spoken labels and any silent,
   duplicated, or misleading output. If Windows is available, repeat the core
   tasks with current NVDA + Chrome; do not treat one stack as proof of the
   other.
4. **Physical touch and high contrast:** on a phone, reach all seven nav routes,
   sort/open an Explore row, and attempt Timeline marks without zooming the
   page. On Windows High Contrast, repeat the four chart-identification tasks
   and confirm focus visibility. Browser emulation is only a preflight.
5. **Reduced motion:** enable the OS preference before launching the browser,
   hard-reload Lineage, and observe initial settling, filter changes, hover,
   zoom/pan, and route transitions. Stop if motion continues without a user
   action or if focus is displaced.
6. **Reader comprehension and founder taste:** in the five 5Q.5 sessions, ask
   readers to orient, find a named sculptor, explain one chart claim and its
   denominator, share/reload a state, and name an important limitation. Separately
   ask the founder whether the preserved catalogue identity still feels
   playful and intentional. Record task success and quotes; screenshots or Axe
   results are not comprehension evidence.

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
4. Treat the 5Q.4a evidence baseline as closed, not passed: carry the confirmed
   defects into route slices, and complete the owner-run actual-zoom,
   screen-reader, physical-input, and comprehension protocols before the
   affected route or Phase 5Q product gate passes.

## Route and task matrix

| Route | Primary reader question / first useful action | Reproducible state | Current equivalent/mobile path | Highest-risk issue |
|---|---|---|---|---|
| Timeline | “When did these focus sculptors live?” Sort or open one lifespan. | sort query; alphabetical is canonical default | Page is available; chart has a 700px minimum inside horizontal overflow | Confirmed loss of mobile name/date correlation, 12.44px targets, and no structured keyboard-readable lifespan equivalent |
| Explore | “Can I find a named sculptor or browse the roster?” Search, sort, then open a record. | None for search/sort/filter | Full table is present and horizontally scrollable | Confirmed 4,423-tab-stop/196,386px catalogue, local state, 2,378 contrast failures, and no task-specific mobile list |
| Evolution | “How do recorded geography and movement labels change by birth decade?” Change geography source or select a decade. | geography source and selected decade in URL | Entire analytical route is replaced by a notice below md | Confirmed missing mobile equivalent, color/grayscale dependence, and negative-width SVG console errors |
| Evolution—materials | “What material categories appear in the bounded museum-object sample over object time?” Read the static overview. | No consequential interaction | Inherits Evolution’s route-level mobile gate | Only 132 object observations; object decade must never be coupled to artist birth-decade state |
| Migration | “Which recorded birth/death-country endpoints differ, and for whom?” Select decade/same-country state and inspect a pair. | Decade and same-country state in URL | Entire route is replaced by a notice below md | Confirmed missing mobile/structured overview and Space-key failure on the same-country checkbox; naming remains an interpretation risk |
| Lineage | “What source-asserted relationships surround an artist?” Focus a person, choose hops/layers, inspect neighbors. | Focus, hops, node kinds, edge/filter state in URL | Entire route is replaced by a notice below md | Confirmed missing phone/keyboard/structured equivalent and washed forced-color graph; force distance remains non-semantic |
| Decade | “What characterizes the published birth cohort in this decade?” Scan counts/categories and open an entity. | Decade path | Ordinary responsive content; tables/lists are primary | Responsive hierarchy passes the baseline; repeated small tertiary contrast fails and leading lists can be mistaken for complete distributions |
| Movement | “What does the source label connect in this dataset?” Scan decade/country/peer patterns and open an artist. | Movement slug path; pages require three records | Ordinary responsive content | Responsive hierarchy passes; four 16px-high decade targets and repeated contrast fail; sparse P135 labels remain an interpretation risk |
| Sculptor detail | “What does the source record say, what is missing, and where can I go next?” Inspect fields and connected entities. | QID path | Ordinary entity journey | Responsive hierarchy and alt text survive; six prohibited ARIA labels, 0.120 mobile CLS, contrast, and unstable broken-image chrome remain |
| About / Transparency | “What is this, who is represented, and can I trust the claims?” Read scope/release/coverage and follow evidence. | Stable paths | Ordinary responsive prose; audit blocks remain bounded | Hierarchy/reflow pass the machine baseline; actual 200% and human comprehension remain owner-run, with small contextual contrast failures |

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

## Boundary after baseline closeout

The machine-observable 5Q.4a baseline now includes the consistent route
captures, text-spacing/overflow measurements, standalone-browser keyboard and
focus evidence, automated accessibility, color-mode simulations, console/image
failure review, and controlled-lab Web Vitals above. It does not turn failed
routes into passes and does not convert emulation into human evidence.

The exact owner protocols above remain required for actual 200% zoom, physical
input, screen-reader utterances, Windows High Contrast, initial reduced-motion
comfort, and reader/founder comprehension. Field p75 measurement belongs in the
implemented route slices. Do not propagate a broad visual change until the
first Explore slice fixes or explicitly re-scopes its confirmed P1/P2 findings
and passes a separate rendered review.
