# Phase 5Q dense-route scope review — 2026-08-08

**Status:** Review complete; Migration selected as the next bounded route slice

**Exact source:** protected `main@f9f31d4286bc171f3547c8ddb139fe926e06f1ad`

**Exact production:** `dpl_FjSW7EVEQbqGLKpWTNowd86ScmrY` (`READY`) at
<https://sculptor-explorer-7kj5pe0ym-asherzafars-projects.vercel.app>

**Behavior changed by this review:** none

## Decision

Implement **Migration** next and leave **Lineage** and **Evolution** unchanged.
Migration is the smallest coherent slice that can prove the dense-route
overview → focus → details pattern without coupling the work to a force-layout
redesign. Its committed route projection is 415 endpoint pairs in one 532,592
byte / 70,841 byte-gzip file, its source/scope/snapshot/limits disclosure is
already strong, and its side panel already exposes deterministic sculptor
links. The missing work is bounded: one canonical state contract, one
task-equivalent structured pair view, native keyboard and focus behavior, and
responsive presentation that does not execute a hidden desktop chart.

Lineage needs a separate interaction-model slice. Its default rendered graph
contains 931 sculptors, 681 external mentors, and 1,423 relationships; the
route loads approximately 179 KB gzip before the optional 376 KB institution
bundle. The graph, typeahead, external targets, structured equivalent, reduced
motion, forced-colors path, canonical state, and browser-side performance need
to be designed together. Folding that work into Migration would create two
independent outcomes and would not be the smallest credible next step.

## Reader questions and task abstractions

### Migration — selected

- **Reader question:** Which recorded birth/death-country endpoints differ,
  and for whom?
- **Target readers:** curious cultural-data readers, educators, and researchers
  who need a source-critical overview and a path to the named records.
- **Data abstraction:** a directed, weighted country-pair table over 2,567
  eligible non-living published sculptors. The current release contains 772
  different-country records and 1,795 same-country records; 834 living people,
  24 non-living records without birth country, and 118 without death country
  are excluded.
- **Tasks:** compare the headline denominator, filter by birth decade, choose
  whether same-country endpoint pairs are included, rank/select a pair, inspect
  its count and sample, and follow deterministic sculptor links.
- **Idiom:** preserve the wide Sankey as an optional overview; make a semantic
  ranked pair view the canonical focus path on narrow/reflow layouts and an
  available equivalent on wide layouts; keep one selected-pair detail panel.
- **Uncertainty:** endpoints do not reconstruct travel, timing, duration,
  motive, home, or permanent migration. Matching endpoints do not prove that a
  person stayed in one country. `Other` is a display rollup, not a country.

### Lineage — deferred

- **Reader question:** What source-asserted relationships surround an artist?
- **Data abstraction:** a heterogeneous asserted relationship graph with
  optional institution nodes, sparse documentation, temporal estimates, and a
  separate recorded-citizenship comparison.
- **Tasks:** find a person, form an ego network, change hops/layers/relationship
  filters, understand neighbors and evidence, and open a deterministic person,
  institution, or source target.
- **Needed idiom work before implementation:** a semantic adjacency/ego list,
  keyboard-operable typeahead and node targets, explicit overview/focus/detail
  hierarchy, reduced-motion force behavior, non-color state, canonical state
  parsing, and browser-side time-to-usable measurement.

## Exact-source findings

### Preserved strengths

- Both routes ask bounded questions and put source, scope, snapshot, and limits
  beside the claim.
- Migration reports the 2,567 denominator and all 976 exclusions, separates
  different- and same-country endpoint counts, and avoids journey/motive copy.
- Migration's top-ten list uses native buttons; its selected detail panel
  exposes up to 12 deterministic `/explore/{qid}` links.
- Lineage distinguishes source assertions from causal proof, keeps temporal
  confidence separate from relationship truth, and leaves institutions opt-in.
- The inspected exact-production desktop and reflow states emitted no console
  warnings or errors.

### Confirmed Migration failures

1. At 390×844 and the 720px reflow proxy, the entire analytical task is
   replaced by “Best viewed on desktop.” The CSS-hidden desktop branch still
   mounts, fetches `migration.json`, and runs D3.
2. The Sankey has an accessible name but no tabbable links or nodes. Corridors
   can be one-pixel-wide pointer targets and expose detail only through hover or
   click.
3. The top-ten native-button list is only present in the unfiltered full-data
   state. It is not equivalent to the current decade/same-country slice and
   cannot reach the full pair set.
4. Pressing Space on the native “Include same-country endpoints” checkbox did
   not change its checked state or URL on exact production. Pointer activation
   correctly added `stay=1`.
5. Decade and `stay` state restore after reload, but parsing is inline and does
   not canonicalize malformed or duplicate parameters. A pinned pair is local
   state only, so it cannot be shared or restored.
6. The dated forced-colors pass found weakened categorical distinction. There
   is no same-state structured reading path to carry the task without color.

### Confirmed Lineage failures and risk

1. At 390×844 and 720px, the route is replaced by the same desktop notice;
   the hidden branch still fetches the index/edge/mentor data and starts the
   graph work.
2. The SVG has `role="img"` and a summary label, but none of its 1,612 rendered
   nodes is tabbable or a semantic link/button. Graph clicks and hover are the
   only node-detail path.
3. Typeahead results are clickable `<li>` elements without option roles or
   keyboard focus. Enter always chooses the first substring match rather than
   an explicitly focused option.
4. D3 node/edge transitions and the initial force simulation do not honor
   reduced motion. The dated forced-colors pass washed graph nodes/labels out.
5. URL parsing is inline and permissive. On the exact production deployment,
   the existing focused-institution journey failed to clear the URL in both the
   full 30-test run and an isolated retry.
6. The exact-source headless median benchmark measured 1.50 s for the current
   synthetic scenario, 1.81 s with institutions, 1.87 s with movements, and
   3.00 s stress. These exclude SVG rendering and time-to-interactive; the
   current route has no browser-side stable-layout gate.

## Selected Migration slice contract

The implementation slice must preserve the endpoint question, denominator,
uncertainty language, deterministic sculptor links, wide Sankey identity, and
all Evolution and Lineage behavior. It should change only `/migration`, its
route-local state/chart support, focused tests, and directly affected durable
documentation.

The smallest coherent interaction model is:

1. **Overview:** the existing slice-aware summary and disclosure.
2. **Focus:** native decade and same-country controls plus a semantic ranked
   pair view derived from the same current slice. Keep a bounded default and an
   explicit way to reach every pair rather than mounting an unexplained wall of
   focus targets.
3. **Details:** one selected pair with count, rollup disclosure when relevant,
   and the existing deterministic sample links.
4. **Share:** a route-local parser/serializer owns canonical `decade`, `stay`,
   and selected-pair state. Defaults are omitted; invalid/duplicate/stale pair
   states reset visibly; reload, back, and forward reproduce one view.
5. **Responsive equivalence:** 390px and zoom/reflow widths receive the same
   summary, filters, pair selection, and details through semantic HTML. Do not
   render or load a CSS-hidden Sankey merely to show the equivalent view.

## Success gate

The candidate may proceed to exact-head Preview review only when all of these
are true:

- Default, decade, same-country, selected-pair, invalid, empty, and degraded
  states pass at 1440×900, 390×844, and a 720px reflow proxy with no page
  overflow or route-level desktop notice.
- The structured view and wide Sankey use the same filtered pair/count source;
  every pair is reachable without hover, and selected detail retains exact
  `/explore/{qid}` targets.
- Native Tab/Shift+Tab, Enter, and Space operate every consequential control;
  focus is visible; ordinary desktop targets are at least 24px and mobile
  action targets at least 44px. Sankey marks are not the only target.
- Canonical URLs round-trip decade, same-country inclusion, and pair selection
  through reload/back/forward; defaults, duplicates, malformed values, and
  stale pair selections normalize deterministically.
- Source, denominator, snapshot, exclusions, endpoint limits, same-country
  caveat, and `Other` rollup meaning remain available beside the task.
- Axe WCAG A/AA, WCAG text spacing, forced colors, reduced motion, keyboard,
  focus/target, and deterministic-link checks pass in the focused route suite;
  the inspected states emit no console/page/request errors.
- The existing 70,841 byte-gzip data projection stays below 80 KB unless a
  reviewed contract change justifies growth; no hidden mobile chart work runs;
  ordinary filter/pair feedback completes under 200 ms. The default collapsed
  structured view keeps visible focusables below 100, while the explicit full
  pair view remains bounded by the committed 415-pair contract.
- `./scripts/validate.sh`, the complete repository browser gate, exact-head
  Actions, and exact-head Git-backed Preview verification pass. Actual 200%
  browser zoom, physical input, VoiceOver/NVDA, Windows High Contrast, and
  reader comprehension remain owner-run evidence and must not be inferred.

## Stop and simplify gate

- If the Sankey and structured view cannot share one pair/count contract,
  treat the semantic ranked view as authoritative and simplify or demote the
  Sankey rather than shipping divergent answers.
- If the full structured view exceeds the interaction/focus budget, add
  semantic pagination or a native disclosure while preserving access to every
  pair; do not introduce accessibility-sensitive virtualization for 415 rows.
- If selected rollups cannot restore honestly from source/destination state,
  serialize only raw country pairs and describe `Other` as an overview-only
  rollup.
- If mobile still downloads or simulates the hidden chart, split the visual
  branch at render time before calling the route complete.
- Any need to change the migration data schema, claim denominator, Evolution,
  Lineage, a provider setting, or a shared route pattern stops this slice for a
  separate decision.

## Validation evidence and limits

- Exact production inspected at 1440×900, 390×844, and 720px reflow for both
  routes; representative URL, selection, keyboard, disclosure, target,
  semantics, and console states were reviewed.
- Existing exact-production browser suite: 29/30 passed; only the Lineage
  focused-institution clear-state journey failed. That Lineage failure repeated
  in isolation. The Migration URL journey passed but does not cover Space,
  mobile equivalence, full structured equivalence, or canonical invalid state.
- `node web/perf/lineage-bench.mjs` produced the exact-source medians recorded
  above. It measures headless force cost, not browser rendering or field p75.
- The first browser-suite attempt was an environment-only macOS sandbox launch
  failure before any assertion ran; the supported outside-sandbox rerun is the
  product evidence.
- The dated baseline supplies reduced-motion, forced-colors, color-vision, Axe,
  and owner-only protocol context. This review did not claim spoken screen
  reader output, physical-device accuracy, actual browser zoom, Windows High
  Contrast, field p75, or reader comprehension.
