# Agent Handoff

**Verified:** 2026-08-08

**Purpose:** Current agent-neutral continuation state. The evidence behind the roadmap reset is in `docs/PROJECT_AUDIT_2026-08-02.md`; historical 5b.3–5b.4 implementation detail remains in `docs/CODEX_HANDOFF.md`.

## Current boundary

The Phase 5Q.4b Timeline-only slice landed through PR #28. Reviewed head
`ba693dd9d21e62758c95027af405b8350f42b245`, based on freshly fetched protected
`main@b00cac633d9a81e3706fc868292fa6c743a5ee0a`, preserves the 48-sculptor
lifespan question and deterministic `/explore/{qid}` targets while adding
canonical URL sort state, correlated mobile/zoom reflow, wide-view structured
equivalence, native keyboard/focus paths, 24–48px targets, explicit
unknown-year disclosure, and bounded route checks. Exact-head Actions and
Git-backed Preview QA passed before the guarded merge commit; default-branch
CI, exact-SHA production, and canonical/immutable route probes passed after it.

Documentation-only PR #29 then landed reviewed head
`31c8d30a1ee5c3a0af710eb6b6d220826ae86df2` as merge commit
`1cf72de55ceeed18e2d20bb30b5bd7fb8d36fca9`. Default-branch Actions run
`31264845842`, exact-source `READY` production
`dpl_Fj3yDDw2eVTKQExD8vn7i1wBZe1W`, and canonical/immutable route probes
passed. That closeout changed no application, route, data, claim, or
dependency behavior.

PR [#30](https://github.com/asherzafar/sculptor-explorer/pull/30) landed the
bounded nanoid remediation from reviewed head
`fe0a260c2aa82d959bdd21a81c2f2a11fa5f480f` as merge commit
`f972d56fc3e20b8b91919a7b9b7ac72b705923cb`. Default-branch Actions run
`31268128135`, exact-source `READY` production
`dpl_4WDRWsPT29PGAvMaNwjQXeS9cL5g`, canonical and immutable route probes,
both merged-main audit views, and the zero-open-alert check passed. The change
only resolves lockfile nanoid `3.3.17`; the package manifest, Next.js,
PostCSS, Sharp, Tailwind, shadcn, routes, and data contracts remain unchanged.

Documentation-only PR #31 landed reviewed head
`3d649e0217f5bb54ca9309119886bebbd6f8fc36` as merge commit
`f9f31d4286bc171f3547c8ddb139fe926e06f1ad`, without deleting its branch.
Default-branch Actions run `31278205059` passed the root gate and all 30
browser journeys. Git-backed Vercel production deployment
`dpl_FjSW7EVEQbqGLKpWTNowd86ScmrY` is `READY` from that exact merge at
`https://sculptor-explorer-7kj5pe0ym-asherzafars-projects.vercel.app`;
canonical and immutable probes returned 200 for `/`, `/timeline`, `/explore`,
`/about`, and `/transparency`, plus 404 for the missing route. No retained
branch/worktree was cleaned, and no manual deployment, promotion, provider,
route, domain, application, data, claim, or dependency change occurred.

Documentation-only PR #32 then landed the dense Lineage/Migration family review
from reviewed head `7891d328336158496bd5d882e4804b4ce89b0bb2` as merge commit
`6b86d605a73d026cd23bf8d37b61fcf476ae1277`, without deleting its branch.
Default-branch Actions run `31281395835` passed the root gate and all 30
browser journeys. Git-backed Vercel production deployment
`dpl_5GNeDBLbVPf1oZop3ix1J8WfmN66` is `READY` from that exact merge at
`https://sculptor-explorer-os3yhpilc-asherzafars-projects.vercel.app`;
canonical and immutable probes returned 200 for `/`, `/timeline`, `/explore`,
`/about`, and `/transparency`, plus 404 for the missing route. The Git
integration created production without a manual deployment, promotion,
provider, route, or domain change. The remote review branch remains retained at
its reviewed head. No npm audit repeat was required because the merge changed
documentation only.

PR [#33](https://github.com/asherzafar/sculptor-explorer/pull/33) then landed
**Migration** as the third bounded 5Q.4b route slice from reviewed head
`2a9352111fd814882cec87d8cd19f3b5870809d7`, based on freshly fetched protected
`main@6b86d605a73d026cd23bf8d37b61fcf476ae1277`. It changes only the Migration
route, route-local state/chart support, focused unit/browser tests, the existing
Migration smoke journey, and directly affected durable documentation. It
preserves the 2,567-record endpoint denominator, all 976 exclusions, endpoint
uncertainty, wide Sankey identity, and deterministic `/explore/{qid}` links.
Below `xl`, it mounts the complete structured selection/detail task instead of
the D3 overview; the collapsed list exposes 20 pairs and native disclosure
reaches the bounded remainder. Canonical URL state serializes `decade`, `stay`,
`from`, and `to`, resets malformed/duplicate/stale values visibly, and never
serializes the chart-only `Other` rollups. Lineage and Evolution remain
unchanged.

The exact head passed push Actions run `31287162498`, pull-request Actions run
`31287202872`, Git-backed `READY` Preview deployment
`dpl_HQwYUuqoWUZpiZoJQEzD35NoRw91`, and rendered 1440×900, 390×844, 720px
reflow, forced-colors, reduced-motion, text-spacing, Axe, keyboard,
focus/target, degraded-data, console/page/request, gzip, visible-focusable, and
feedback-budget checks. A focused Preview harness reported 9/10 only because it
counted expected Next/Vercel navigation aborts; the separate error-filtered
inspection found no product error. The authoritative final local serial browser
run and the exact-head CI runs each passed all 40 journeys.

The guarded merge created
`21ab2f038aa62b23188cd8f373e36d5353a46128`. Default-branch Actions run
[`31289869997`](https://github.com/asherzafar/sculptor-explorer/actions/runs/31289869997)
passed the root gate and all 40 browser journeys. Git-backed production
deployment `dpl_CQAsXL2YtumCprFQqNDEtCpYhG7S` is `READY` from that exact merge
at `https://sculptor-explorer-8g4vzgtfp-asherzafars-projects.vercel.app`.
Canonical and immutable delivery probes passed; `/migration`, its selected
`?stay=1&from=France&to=France` state, and `?decade=1880` each returned 200.
Both npm audit views remained at zero findings, and no `/migration` runtime
error was reported in the landing window. Actual 200% zoom, physical input,
VoiceOver/NVDA, Windows High Contrast, field p75, and reader comprehension
remain owner-run and are not claimed.

Phase 5b.5 and Phase 5Q.1–5Q.3 are implemented in the current release candidate. P1066/P737 person-person edges share the six-field temporal envelope contract used by P69/P937 institutional edges; undatable person links remain exported with null fields and explicit reasons. `/transparency` reports institution coverage, date confidence, skipped empty intersections, educational concentration, explicit release-review dates, and separate source/eligible/publication counts.

The bounded Getty contract repair restores the detail behavior that the old
roadmap overstated. The 3,543-record monolith and all per-QID shards now share a
validated final-record base; 2,310 records carry structurally identical
`gettyVerified` values across both surfaces, and the nine shards with 34
public-domain museum works retain their shard-only `works` field. The Getty
audit denominator is 2,310 after excluding `Q87366`, not the stale 2,311. The
canonical root gate now includes both the committed-data parity checks and a
focused standard-library final-writer regression suite.

The latest behavior-changing application merge through this record is PR #33
merge `21ab2f038aa62b23188cd8f373e36d5353a46128`; its exact delivery evidence is
recorded above. A later documentation-only merge carrying this closeout may
advance protected `main` and production source without superseding that
behavior evidence. The existing Git integration produced Preview and
production; no manual deployment, promotion, provider-setting, route, domain,
integration, credential, data, claim, or dependency mutation occurred.

The permanent `main` checkout is clean and fast-forwarded to the exact PR #33
merge. The local/remote
`codex/phase-5q4b-explore-slice@f7b220788e83a36f5583cd645a740ff6c9706789`
and
`codex/phase-5q4b-landing-hotfix@d7dd1955f1cc4360430c7957d9e0508ed5d8c2a7`
branches remain retained; the hotfix worktree and clean detached PR #24
worktree at `8633902fa01d02f72e325c53944780b40b219ec8` are unchanged. The
local/remote Timeline branch remains retained at
`ba693dd9d21e62758c95027af405b8350f42b245`. The local/remote Migration branch
and its dedicated worktree remain clean at
`2a9352111fd814882cec87d8cd19f3b5870809d7`. Older retained verification,
application, dependency, and documentation worktrees are also clean; prunable
historical registrations were not altered. This reconciliation uses the new
dedicated `codex/phase-5q4b-migration-landing-closeout` branch/worktree from the
exact PR #33 merge. No retained branch or worktree was cleaned.

A Codex review submitted three minutes after PR #24 merged identified three
confirmed production defects: sequential multi-word typing collapsed spaces,
the 2,581 pipeline movement sentinels sorted as a literal letter-N block, and
the 390px list inferred “present” from a null death year. PR #25 preserved an
ephemeral whitespace draft only while the search field is edited while keeping
result state and shared URLs canonical; sent the movement sentinel through the
existing missing-last comparator in both directions; and rendered an unknown
death year as `—` on mobile. Focused unit and browser regressions cover those
boundaries. The change did not alter pagination, filters, link destinations,
shared navigation, or any Timeline, Evolution, Migration, or Lineage behavior.
Its exact-head CI, `READY` Preview, rendered desktop/390px QA, review,
head-protected merge, default-branch validation, exact-SHA production, and
route proofs all passed. Explore is closed as the first 5Q.4b route slice.

Phase 5Q—the product clarity and quality gate—is active before 5b.6
movements-as-nodes, 5c time-coded lineage, or 5d career Sankey. The 5Q.4a
machine-observable baseline is closed on protected
`main@8a4fccdeef90b2678a87d957e57d3d438a7fd317`, using exact READY Vercel
deployment `dpl_9VXLKKGNH1hcgHtCi5dHdDgY9mii` at
`https://sculptor-explorer-ilqzs1h0f-asherzafars-projects.vercel.app`. It covers
all primary routes at 1440×900/390×844, text spacing, overflow,
standalone-browser keyboard/focus/targets, automated accessibility, reduced
motion, forced colors, four color-vision modes, console/image failures, and a
controlled no-cache performance pass. It is an evidence closeout, not a route
pass: actual 200% browser zoom, physical input, spoken screen-reader output,
Windows High Contrast, and reader/founder comprehension were not observable and
have exact owner protocols in `docs/VISUAL_BASELINE_2026-08-02.md`.

The 5Q.4a baseline itself changed no production code. It confirmed P1 systemic
contextual contrast, missing structured chart equivalents, undersized target
patterns, Explore’s 4,423-focusable/196,386px catalogue, missing Evolution/
Migration/Lineage mobile equivalents, a Migration Space-key failure, and
Timeline mobile correlation failure. PR #24 addressed only the Explore
catalogue/contrast/target/mobile/state findings and the shared skip link; the
PR #25 hotfix closed only its three post-merge boundary defects. Evolution
negative-width errors, sculptor-detail ARIA/image shift, dense
chart equivalents, actual zoom/screen-reader evidence, and
reader comprehension remain separate work. Explore patterns are verified for
that route but still require real-reader evidence before broader reuse. User evidence in 5Q.5 and
the Phase 5R strategic workshop still precede a major new public phase.

The release stack is integrated. PRs
[#1](https://github.com/asherzafar/sculptor-explorer/pull/1),
[#2](https://github.com/asherzafar/sculptor-explorer/pull/2),
[#3](https://github.com/asherzafar/sculptor-explorer/pull/3), and
[#4](https://github.com/asherzafar/sculptor-explorer/pull/4) were reconciled,
retargeted, freshly validated, and merged in that order. Their `main` merge
commits are `440e68a`, `209cb19`, `efbebbd`, and `1b7c301`. After every merge,
the full GitHub validation passed, Vercel reported a production deployment for
the exact merge SHA, and the canonical route smoke returned 200 for five real
routes and 404 for the missing-route probe. No post-disconnect Cloudflare
Workers Builds check appeared.

PR #22 then closed the Phase 5Q.4a baseline on merge commit
`d5091abf74ddcd6427e7a624675e9d80387117f5`. Default-branch Actions run
`30973384613` passed, and Vercel production deployment
`dpl_ANk8khnZrCCJjyHhufoNAinwwF89` is `READY` with that exact source SHA.

PR #23 then landed the Getty final-record repair on exact merge commit
`39a52ac45968379a01e6fedb5897aca80cf85ede`. Default-branch Actions run
`31052625912` passed, Vercel production deployment
`dpl_GGjRVRufKc44bwiAmVtvXUMtfqMn` is `READY` from that merge, and the public
HTTP contract passed. This exact commit was the base for PR #24.

PR #24 then merged the Explore slice as exact merge commit
`8633902fa01d02f72e325c53944780b40b219ec8` from reviewed head
`f7b220788e83a36f5583cd645a740ff6c9706789`. Required PR checks and Preview
passed, default-branch Actions run `31119230390` succeeded on the exact merge,
Vercel production deployment `dpl_3W5dDYtmb5FaQLUrQHU6Kj8SsYyB` reached
`READY` from that SHA, and canonical/immutable route probes passed. The late
automated review findings above triggered the bounded PR #25 hotfix.

PR #25 then merged the landing repair as exact merge commit
`c22cba075ef36373f635d114ffa2d6f3d9ca17f9` from reviewed head
`d7dd1955f1cc4360430c7957d9e0508ed5d8c2a7`. Required PR checks, the exact-SHA
`READY` Preview, and read-only desktop/390px Explore QA passed before the
head-protected merge. Default-branch Actions run `31193771731` succeeded on the
exact merge, Vercel production deployment `dpl_6tfRw7nJJ1QeR9Mxvnf22GWZSB61`
reached `READY` from that SHA, and canonical/missing-route probes passed. This
closes Explore as the first 5Q.4b route slice without changing another route.

After that release stack, the dependency queue landed sequentially as PRs #17,
#13, #15, #14, #18, #19, #12, #10, and #8, followed by focused transitive
advisory closeout PR #20. Every PR passed exact-head `validate` and Vercel
preview checks; every merge then passed default-branch validation and an
exact-SHA Vercel production check before the next PR proceeded. The dependency
closeout baseline is `main@674f65884d622f8fabb509e43d651cf67188717b`;
GitHub Actions run `30788497586` passed all seven browser journeys, and Vercel
production deployment `dpl_TgufELpqshj8xAZQtpjVF6i5DPVg` is `READY` on the
canonical aliases. At that dependency-closeout boundary GitHub had zero open
PRs and zero open Dependabot alerts; both full and production-only npm audits
reported zero vulnerabilities.

The active `Protect main delivery` ruleset requires PRs, merge commits, resolved
conversations, and strict `validate` plus `Vercel` checks; it blocks deletion
and force-pushes and has no bypass actors. Actions are limited to GitHub-owned
actions with full-SHA enforcement. Workflow tokens are read-only and cannot
approve PRs. Vulnerability alerts and Dependabot security updates are enabled.
The former local audit and Getty repair branches have been reconciled outside
this task; read-only preflight found neither branch locally nor remotely. Do
not recreate or delete historical branches as part of the Explore slice.

Merged remote dependency branches were deleted after exact merge ancestry was
verified. Future automated proposals remain ordinary review work: group split
compatibility families, rebase onto current `main`, require fresh checks and an
exact preview, and never auto-merge merely because an alert or bot opened them.
PR #20's temporary patched PostCSS/Sharp overrides and their retirement triggers
are documented in `docs/SECURITY.md`; do not replace them with an uncontrolled
force fix or a framework downgrade.

Canonical production is <https://sculptor-explorer.vercel.app/>. The founder
identified <https://sculpture-in-data.netlify.app/> as a stale legacy host; it
now issues path- and query-preserving 301 responses to Vercel and remains an
observation/compatibility surface, not a deploy target. The Cloudflare Worker
Git build was disconnected at 2026-08-03 00:31:05 UTC. Read-only API evidence
shows no Worker URL, custom domain, account zone/route, build config, active
trigger, deploy hook, cron schedule, or service-scoped invocation row in the
30-day window ending 2026-08-03 06:03:22.628 UTC. The build history retains 40
failed records, but none occurred after the 2026-08-03 00:31:05 UTC disconnect.
Active version `cf3a4cff-d0bb-4da6-b047-efcca385a435` remains at
100% in deployment `9a427017-e4ec-455a-8ace-c9881295ca41`; prior version
`2da29370-4423-4b31-b200-83c36793e08d` remains available through prior
deployment `75bca7e6-e89c-4e56-a656-517f57cb969b`. Build-token UUID
`fdb812b2-cd1f-4ba8-aa38-39b70e780721` still maps to Cloudflare token ID
`ca6d130ad8553a383d9c7aa5f81237fd`; only non-secret metadata was read.
Final Netlify probes reconfirmed exact 301 locations for `/`, `/timeline`,
`/about?source=legacy`, and `/missing/nested/path`, including the query string.

Retain the dormant manual deployment through the observation window; do not
delete or reconnect it merely to alter a GitHub check. Retain the Worker, both
manual versions, and non-secret build-token metadata through 2026-09-02 UTC.

## Founder direction added 2026-08-02

- The project began with a National Sculpture Society friend’s request for a sculptor lifespan graph, then became a vehicle for playful art-data visualization and AI-assisted development.
- Experimentation and fun are first-class goals, not merely feature-discovery tactics.
- Confirmed decision: keep **Sculpture in Data** as the public identity through 5Q, while designing an additive artist-neutral entity/relationship model underneath.
- The quality-gated public explorer is the primary product; an isolated, time-boxed research lab is a first-class supporting practice with one active experiment by default. Phase 5Q gates productionization, not curiosity.
- Influence, affiliation, co-presence, similarity, and prediction must remain separate edge layers with visible evidence/derivation. Derived layers may be public only when they are opt-in, visibly distinct, and method/evidence-traceable.
- A graph database is not preselected. Model semantics and real temporal/multilayer queries first, then benchmark storage options through an architecture decision.
- The founder welcomes well-framed interviews when product identity, audience, inference posture, breadth/depth, or experiment priorities materially affect the result. Current questions and recommended defaults live in `docs/EXPLORATION_STRATEGY.md`.

## Verified product/data snapshot

- Seven top-level navigation routes: Timeline, Explore, Evolution, Migration, Lineage, About, Transparency.
- The source query returned 6,711 candidate records. A documented 2026-08-02 overlay excludes `Q87366`, whose century-precision birth had been flattened into a false year; 6,710 analytically eligible candidates remain, 3,543 are published under A.3, and 3,167 are rule-excluded. The source generated-at date remains 2026-06-05, while artifact/curation/contract review metadata is explicit and separate. Older 3,630, 3,544, and 48,000 figures in current-status prose are not current truth.
- The snapshot has 1,423 person-person edges: 1,372 (96.4%) have temporal envelopes; 40 have disjoint lifespans and 11 lack the source person’s birth year. No known edge is silently dropped.
- Institutional links cover 2,393 included sculptors (67.5%); 1,826 (51.5%) have education links. The top five recorded education hubs hold 15.8% of 2,868 education edges.
- Getty ULAN comparisons cover 2,310 published sculptors. The monolith and
  exactly 2,310 matching detail shards carry identical `gettyVerified` blocks;
  the audit, output count, ULAN identifiers/URLs, agreement schema, and
  shard-only works preservation are repository invariants.
- Production build, TypeScript, zero-warning lint, data contracts, and bounded
  performance checks pass on the protected base. PR #24 expanded browser
  coverage beyond the seven core journeys, including deterministic URL
  defaults/round trips, invalid states, page combinations, shared skip behavior
  on all route types, responsive equivalence, exact movement/sculptor links,
  target/contrast measurement, bounded focusables, and interaction timing; PR
  #25 added sequential typing and missing-last movement-sort regressions and
  strengthened the responsive equivalence assertion for unknown death years.
  GitHub Actions still defines the non-browser root gate and explicit browser
  gate; the verified build generates 3,625 static pages.
- The Vercel project reports Node `24.x`. The focused continuation declares
  Node 24 in both `.nvmrc` files, `web/package.json`/lockfile, local
  documentation, and CI; `engines.node: "24.x"` is the tracked repository
  override because no `vercel.json` or `.vercel` project metadata is
  committed. The exact-head PR #3 preview is READY and Vercel Preview Comments
  passes with no unresolved feedback.
- The current static export is large: approximately 228 MB and 36,201 files, driven mainly by per-sculptor pages/assets.
- Default lineage performance is acceptable but has little expansion headroom: roughly 1.68 s current, 2.26 s with institutions, 2.09 s with movements, and 3.72 s in the stress scenario on the audit machine.
- The dated exact-main visual baseline records the pre-PR-#24 Explore state:
  3,543 mounted rows, 4,423 focusables, a 781px-wide/196,386px-high mobile
  scroller, and local-only search/sort state. Current production now mounts 50
  desktop rows plus 50 hidden responsive list records, keeps visible focusables
  below 150, and serializes query, sort, movement-record filter, and page. The
  production hotfix retains those contracts while closing the three late
  review findings. The pattern is verified for Explore but remains unearned for
  broader reuse until real-reader task evidence supports it.
- Evolution, Migration, and Lineage are desktop-only analytical experiences at
  390px; each is replaced by a notice with links to other routes. Those three
  chart families still lack a structured keyboard/screen-reader equivalent.
- The landed Timeline slice replaces the 700px mobile chart with a
  correlated semantic list below `xl`, gives wide chart rows 24px pointer
  targets, and exposes the same links through a structured list. Migration’s
  focused same-country checkbox fails Space activation. Evolution emits
  invalid negative-width SVG console errors under the audited mode matrix.
- `docs/DATASET_DATASHEET.md` is the maintained composition/source/license/processing/use/risk record. `docs/CLAIM_REGISTER.md` maps every public analytical surface to its supported claim and defines external domain/community-review triggers.
- The retained JSON field/file names `crossesBorders` and `cross_cultural_summary.json` are legacy contract names. Their exact meaning is disjoint recorded Wikidata P27 sets; public copy no longer describes this as observed border crossing, migration, refugee history, or cross-cultural influence.

## Known quality issues

- `npm run lint` now exits with zero errors and zero warnings. The intentional standard `<img>` in `WorksGallery` remains documented inline for hot-linked public-domain museum assets in the static export.
- Next.js and `eslint-config-next` remain aligned at 16.2.12. Protected main
  now locks patched nanoid `3.3.17` inside PostCSS's existing `^3.3.16`
  range; clean full and production-only audits report zero vulnerabilities,
  and GitHub reports zero open Dependabot alerts. The temporary PostCSS/Sharp
  override and nanoid lock rationale/review triggers are in
  `docs/SECURITY.md`.
- The known impossible lifespan is resolved at its source boundary: Wikidata records `Q87366` only as “18th century” (precision 7), so the year-based public export now excludes it with evidence in `overrides/person_exclusions.csv` and `transparency.json`. Repository invariants reject any future birth-after-death record.
- Repository CI and seven focused Playwright core-journey/URL-state/provenance checks now exist. The repo-local Chromium binary is gitignored; install it with `cd web && npm run test:e2e:install` before the first local run.
- The Evolution, Migration, and Lineage chart families have accessible names
  but no structured equivalent or tabbable chart-detail path. Forced-colors/
  grayscale simulation weakens or collapses categorical distinctions; those
  routes cannot pass until a non-color reading path exists. Timeline now has
  a correlated reflow list and an on-demand wide-view structured equivalent.
- The 5Q.4a Axe baseline found repeated contextual contrast failures (2,378
  nodes on old Explore), six prohibited ARIA labels on detail completeness
  dots, a non-focusable mobile Timeline scroller, and four movement target-size
  failures. PR #24 uses the AA darker Verdigris context and ≥24px targets; its
  exact Preview Axe/forced-color/measurement review passed. PR #25 changed no
  styling and its final exact-head rendered replay also passed. Non-Explore
  findings remain open. No P0 was found in the baseline.
- Actual 200% browser zoom and spoken screen-reader output remain explicitly
  unobserved. The in-app zoom/Tab surface did not expose those operations;
  viewport resizing and source inspection are not substitutes.

## Validation state at this handoff

The documentation-only dense-route scope review used Node 24.14.0 and npm
11.9.0 against exact protected
`main@f9f31d4286bc171f3547c8ddb139fe926e06f1ad`:

- Exact production `dpl_FjSW7EVEQbqGLKpWTNowd86ScmrY` was inspected at
  1440×900, 390×844, and a 720px reflow proxy for Migration and Lineage.
  Both routes retain strong disclosure but replace the analytical task with a
  desktop-only notice at the two narrow widths; inspected states emitted no
  console warnings or errors.
- Migration's decade and `stay` state restored from the URL, pointer activation
  worked, and its native top-corridor button exposed deterministic sculptor
  links. Space failed to activate the same-country checkbox; Sankey marks have
  no tabbable path; the top-ten list is not equivalent to filtered slices; and
  a pinned pair is local-only state.
- Lineage's SVG exposed zero tabbable node targets, its typeahead results are
  click-only list items, and its initial force/transitions do not honor reduced
  motion. The existing focused-institution clear-state browser journey failed
  against exact production in the complete run and again in isolation.
- `npm ci` installed 705 packages (706 audited) with zero vulnerabilities.
  The first browser attempt was an environment-only macOS sandbox launch
  failure before assertions; the supported outside-sandbox exact-production
  rerun passed 29/30, with only the repeatable Lineage failure above. The
  Migration URL journey passed but does not cover its confirmed Space/mobile/
  structured-equivalence gaps.
- `node web/perf/lineage-bench.mjs` measured 1.50 s current, 1.81 s with
  institutions, 1.87 s with movements, and 3.00 s stress to perceptual settle;
  these are headless medians and exclude SVG rendering/time-to-interactive.
- Migration's committed projection is 532,592 bytes raw / 70,841 bytes gzip
  for 415 endpoint pairs. Default Lineage loads approximately 179 KB gzip
  across its index/edge/mentor files before the optional 375,543 byte-gzip
  institution bundle.
- Actual 200% browser zoom, spoken VoiceOver/NVDA output, physical input,
  Windows High Contrast, field p75, and reader comprehension remain explicitly
  unobserved owner-run boundaries.

The bounded nanoid remediation is landed from exact base
`1cf72de55ceeed18e2d20bb30b5bd7fb8d36fca9` through PR #30, with Node
24.14.0 and npm 11.9.0:

- Baseline `npm audit` and `npm audit --omit=dev` each reproduced the one high
  `nanoid@3.3.16` advisory; Dependabot run `31228078335` identified the
  transitive PostCSS range and recommended an override/resolution.
- The remediation changes only the lockfile: nanoid version, tarball, integrity,
  and npm's production classification of the already-shared PostCSS node.
  No manifest override was necessary. `npm ls` confirms Next 16.2.12, PostCSS
  8.5.25, Sharp 0.35.3, Tailwind 4.3.3, and shadcn 4.2.0 are unchanged.
- Fresh `npm ci` installs 705 packages (706 audited); `npm audit` and
  `npm audit --omit=dev` both report zero vulnerabilities.
- `./scripts/validate.sh` passes all data/Getty/institution/relationship/
  temporal contracts, 11 URL-state unit tests, zero-warning lint, type
  checking, the 3,625-route production build, and CI lineage bounds.
- After installing the documented repository-local Chromium prerequisite,
  `npm run test:e2e` passes all 30 browser journeys. The initial pre-install
  attempt failed all launches only because that binary was absent; no
  application assertion ran or failed. One later eight-worker run reproduced
  the previously recorded Next dev-server `Unexpected end of JSON input`
  flake on `/decade/1880`; all top-level JSON inputs parsed cleanly, and the
  affected journey plus the complete 30-journey rerun passed immediately.
- Exact-head Actions, Git-backed Preview, and route smoke passed on
  `fe0a260c2aa82d959bdd21a81c2f2a11fa5f480f`. The guarded merge commit is
  `f972d56fc3e20b8b91919a7b9b7ac72b705923cb`; default-branch run
  `31268128135` passed the root gate and all 30 browser journeys.
- Production deployment `dpl_4WDRWsPT29PGAvMaNwjQXeS9cL5g` is `READY` from
  that exact merge SHA. Canonical and immutable probes each returned 200 for
  `/`, `/timeline`, `/explore`, `/about`, and `/transparency`, plus 404 for the
  missing route.
- A fresh exact-merge `npm ci` installed 705 packages (706 audited); both npm
  audit views report zero vulnerabilities, the intended package graph is
  unchanged except for nanoid `3.3.17`, and GitHub has zero open Dependabot
  alerts. No application, route, rendering, pipeline, generated-data, or
  provider file changed.

The Timeline implementation landed through PR #28 after passing locally on
`codex/phase-5q4b-timeline-slice` from exact base
`b00cac633d9a81e3706fc868292fa6c743a5ee0a` with Node 24.14.0 and npm
11.9.0:

- `./scripts/validate.sh` — all data/Getty/institution/relationship/temporal
  contracts, 11 URL-state unit tests, zero-warning lint, type checking, the
  3,625-route production build, and CI lineage bounds passed.
- `cd web && npm run test:e2e -- --workers=1` — all 30 Chromium journeys
  passed, including the nine Timeline-specific URL, reflow, deterministic-link,
  keyboard/focus/target, Axe, forced-color/reduced-motion/text-spacing,
  performance, and degraded-data checks. Existing Explore, Migration, and
  Lineage journeys remained green.
- Read-only local rendering at 1440×900, 390×844, and a 720px reflow proxy
  showed no horizontal overflow or console warnings/errors. The mobile view
  exposed 48 correlated native links, the wide view retained the lifespan
  overview plus its structured equivalent, and chronological sorting restored
  `/timeline?sort=chrono` with Hiram Powers linking to `/explore/Q2572996`.
- The compressed Timeline JSON is under 20 KB, visible focusables stay below
  80, sort feedback completes under the 200 ms route budget, list links are at
  least 48px high, and visual chart row targets are at least 24px high.
- Actual 200% browser zoom, spoken VoiceOver/NVDA output, physical input,
  Windows High Contrast, and reader comprehension were not claimed; they remain
  owner-run boundaries.
- Fresh `npm audit` and `npm audit --omit=dev` each report the separately
  triaged `nanoid@3.3.16` advisory described above; dependency files were not
  changed in this route slice.
- Exact head `ba693dd9d21e62758c95027af405b8350f42b245` passed Actions run
  `31227074431`, immutable `READY` Preview
  `dpl_aULsaqDU8jXPmqjgt8HzHFQMwRjw`, nine focused Preview journeys, and
  rendered 1440×900/390×844 review with no unresolved conversations.
- The exact-head guarded merge produced
  `f3f5130fa043134f55d7832a9cac4f485b73af6d`. Default-branch Actions run
  `31228072123`, exact-source `READY` production
  `dpl_9Qho7DQj584HwaPf8EawSayLuSzg`, and canonical/immutable route probes
  passed. Both post-merge audit views still report only the triaged nanoid
  advisory. Dependabot run `31228078335` could not create an automatic update
  because the current PostCSS dependency range still permits the vulnerable
  version; resolve that in a separate bounded security task.

The implementation now landed by PR #25 passed locally on
`codex/phase-5q4b-landing-hotfix` from exact base
`8633902fa01d02f72e325c53944780b40b219ec8` with Node 24.14.0 and npm
11.9.0:

- `npm ci` — 705 locked packages installed (706 audited), with only the known
  `node-domexception` deprecation and zero vulnerabilities
- `npm run test:e2e -- tests/e2e/explore-slice.spec.ts` — all 14 focused
  Explore journeys passed, including sequential multi-word entry and URL
  navigation, missing-last movement sorting in both directions, explicit mobile
  unknown years, accessibility, scale, and interaction budgets
- `./scripts/validate.sh` — all data/Getty/institution/relationship/temporal
  contracts, seven Explore state unit tests, zero-warning lint, type checking,
  the 3,625-route production build, and CI lineage bounds passed
- `cd web && npm run test:e2e` — all 21 Chromium journeys passed with eight
  workers; the matching one-worker CI configuration also passed all 21. Two
  earlier parallel attempts reproduced the already recorded Next dev-server
  `Unexpected end of JSON input`/unfinished-RSC flake; the affected existing
  movement-link journey passed alone, under CI conditions, and in the clean
  ordinary rerun. The known `NO_COLOR`/`FORCE_COLOR` warning remains log noise.
- PR #25 opened from first implementation head
  `81b9aaba2172dd258467d4cd3e045e92692caa13`, then reached final reviewed head
  `d7dd1955f1cc4360430c7957d9e0508ed5d8c2a7`. Required `validate` run
  `31126315871` passed on attempt 2 after the first outage attempt received no
  runner. Git-integrated exact-head Preview
  `dpl_CDXYMVmceNrXF6Ey2Wtq6hv9vHVz` reached `READY` at
  `https://sculptor-explorer-6k0jp4v0v-asherzafars-projects.vercel.app`; its
  source branch/SHA and canonical/missing-route probe matched the final head.
- Read-only final-head Preview QA covered first, middle, last, empty, invalid,
  and filtered states at 1440×900 and 390×844. All 12 states had zero page
  overflow, clipped product elements, or sub-24px targets; visible focusables
  peaked at 83 desktop and 76 mobile. Source, scope, snapshot, and limits
  remained visible; the skip link landed on main content; and the search field
  exposed a 3px solid focus outline with 3px offset. Sequential “Auguste Rodin”
  entry, URL/back/forward/reload, the deterministic sculptor link, missing-last
  movement boundaries in both sort directions, and Johann Philipp Mihm’s
  mobile `1800–—` value all passed. The exact Preview’s 14 Explore journeys,
  including Axe, text spacing, forced colors, reduced motion, target/contrast,
  bounded-focusable, data-weight, and latency checks, passed.
- The stable Preview inspection produced no console warnings/errors, page
  errors, or HTTP error responses. Next canceled speculative route/detail
  prefetches with `net::ERR_ABORTED` as the harness changed state; document and
  data requests did not fail. A broader remote run passed 18/21 and exposed
  three untouched Timeline/Migration/Lineage URL-control timing failures. The
  same three tests reproduced against immutable current production
  `dpl_3W5dDYtmb5FaQLUrQHU6Kj8SsYyB` (Migration passed on retry there), while
  all 21 pass locally; they predate this hotfix and remain outside its explicit
  route scope.
- PR #25 merged final head `d7dd1955f1cc4360430c7957d9e0508ed5d8c2a7`
  as `c22cba075ef36373f635d114ffa2d6f3d9ca17f9`. Default-branch Actions run
  `31193771731` passed the full validation and 21 browser journeys. Vercel
  production deployment `dpl_6tfRw7nJJ1QeR9Mxvnf22GWZSB61` is `READY` from
  that exact merge SHA, and canonical/missing-route probes passed. Review
  conversations were resolved; local/remote task branches and retained
  worktrees are clean.

For this documentation-only Timeline landing closeout, exact-head GitHub
checks, a `READY` Vercel Preview, route smoke, review conversations, and clean
source-control reconciliation remain the publishing/review gates. No rendered
behavior is changed, so PR #28's final-head visual QA remains the relevant
interface evidence; this docs-only PR must not claim or trigger a new visual
review.

Historical PR #24 implementation evidence follows. It passed locally on
`codex/phase-5q4b-explore-slice` from exact base
`39a52ac45968379a01e6fedb5897aca80cf85ede` with Node 24.14.0 and npm
11.9.0:

- `npm ci` — 705 locked packages installed (706 audited), with only the known
  `node-domexception` deprecation; the unused TanStack table runtime was
  removed
- `./scripts/validate.sh` — all data/Getty/institution/relationship/temporal
  contracts, six Explore URL-state unit tests, zero-warning lint, type checking,
  3,625-route production build, and CI lineage bounds passed
- `cd web && npm run test:e2e` — all 19 Chromium journeys passed after the
  rendered review added direct Axe plus text-spacing/forced-colors/
  reduced-motion coverage. The earlier 17-test clean rerun passed in 5.6s; its
  preceding full run passed 16/17 but one worker received a
  transient Next dev-server `Unexpected end of JSON input` before product state
  rendered; that exact journey then passed in isolation and in the full rerun.
  The known `NO_COLOR`/`FORCE_COLOR` warning remains log noise.
- Exact first-head Preview review at desktop and 390px covered
  first/middle/last/empty/invalid/filtered states with zero page overflow,
  clipped product elements, undersized targets, failed resources, or console
  warnings/errors. The 12-state/viewport Axe sweep reported zero WCAG A/AA
  violations; forced colors, reduced motion, and WCAG text spacing preserved
  the find/filter/list task. Final evidence must be repeated on the exact final
  remote head after this QA-coverage commit.
- `node web/perf/lineage-bench.mjs` — full local median settled at 1.54s
  default, 1.90s with institutions, 2.02s with movements, and 3.16s stress;
  force-cost breakdown completed. No graph code or behavior changed.
- `npm audit` and `npm audit --omit=dev` — zero vulnerabilities
- `git diff --check` — passed

Passed locally on `codex/getty-shard-contract-repair` with Node 24.14.0 and
npm 11.9.0:

- `python3 pipeline/test_getty_contracts.py` — final-record parity, shard-only
  works preservation, rejection-before-write, and idempotence passed
- `python3 pipeline/test_data_contracts.py` — 3,543 exact monolith/shard bases,
  2,310 identical Getty enrichments, valid agreement/ULAN contracts, and
  aggregate/sample parity passed
- `./scripts/validate.sh` — all data, Getty, institution, relationship, and
  temporal checks; zero-warning lint; type checking; 3,625-route production
  build; and CI performance bounds passed
- `cd web && npm run test:e2e` — all seven Chromium journeys passed; only the
  known `NO_COLOR`/`FORCE_COLOR` warning was emitted
- Complete base comparison — removing only `gettyVerified` leaves zero
  monolith or shard differences from protected-main, all 2,310 Getty blocks
  match across outputs, and all nine work-bearing shards remain intact
- `git diff --check` passed

The optional raw-cache validator `pipeline/validate_institutions.py` could not
run in this clean no-refresh worktree because its gitignored
`data/raw/sculptor_educated_at_1800plus.parquet` input is absent. The
committed-output institution contract in the canonical gate passed; no network
refresh was authorized or attempted to manufacture that cache.

Passed locally on `codex/node-24-alignment` with Node 24.14.0 and npm 11.9.0:

- `npm ci` — 709 locked packages installed with no engine mismatch; the existing `node-domexception` deprecation and documented 14-advisory audit posture remain unchanged
- `./scripts/validate.sh` — all data/institution/relationship/temporal checks, zero-warning lint, Node-24 type checking, 3,625-route production build, and performance bounds passed
- `node perf/lineage-bench.mjs --ci` within the root gate — current 1.67 s; institutions 1.98 s
- `npm run test:e2e` — all seven Chromium journeys passed in 6.0 s; only the known `NO_COLOR`/`FORCE_COLOR` warning was emitted

The lockfile changes only the root engine contract, `@types/node` 20.19.39 →
24.13.3, and its required `undici-types` 6.21.0 → 7.18.2 dependency. No other
package version changes. On the published PR #3 head `d25a577`, both fresh
GitHub Actions events passed the root and browser gates, Vercel reached READY,
and Vercel Preview Comments passed. No post-disconnect Cloudflare Workers check
appeared. Older heads did contain an independent failed Cloudflare check; that
historical provider failure was not evidence of a Node 24 regression.

Passed after the 2026-08-02 Phase 5Q.3R stabilization implementation and again
on the final PR #1 head where applicable:

- `python3 pipeline/test_data_contracts.py` — 3,543 sculptors, exact full/index/shard parity, valid lifespans/endpoints/aggregate denominators, exact movement-route parity, explicit release metadata, and source/eligible candidate accounting
- `python3 pipeline/test_institutions.py`
- `python3 pipeline/test_relationship_temporal.py`
- 13 temporal tests
- `npm run lint` (zero errors; zero warnings) and `npm run typecheck`
- `node perf/lineage-bench.mjs --ci` — deterministic default and institution scenarios inside non-flaky regression bounds
- `npm run test:e2e` — all seven Chromium journeys pass, including sparse/published movement-route behavior and the 390px mobile navigation path
- Static build — 3,625 routes; 36,201 files; approximately 228 MB

`./scripts/validate.sh` is the canonical non-browser local/CI gate; run
`cd web && npm run test:e2e` as the explicit browser gate. They are separate
because restricted sandboxes can permit localhost binding for the direct test
command while denying a nested server process under a general shell wrapper.
In the latest local run, a Turbopack attempt exposed its hidden internal-port
requirement under the restricted sandbox. The supported `next build --webpack` path is now
the canonical production build, and Fraunces/DM Sans are licensed,
repository-local WOFF2 assets rather than network fetches. The verified build
generates 3,625 static pages without external font access.

Measured, not pass/fail:

- `node perf/lineage-bench.mjs --ci` — current 1.73 s; institutions 2.13 s on the latest 5Q.3R validation run. These are single deterministic regression runs, not p75 field metrics or the full local median.
- Compressed major JSON: sculptor index ~108 KB, edges ~54 KB, institutions ~376 KB, migration ~71 KB, full sculptors ~900 KB after Getty restoration

The protected-main starting worktree did not contain the gitignored Getty
parquet caches. For the bounded no-network repair, the exact 2,311 historical
Getty blocks from committed export `17b49a1` were converted locally into the
normal ignored `getty_verified.parquet` input; `audit_getty.py` then recomputed
the comparison against the current roster, excluded `Q87366`, and finalized
2,310 current records. No Wikidata, Getty, Met, or AIC source was refreshed and
no cache is committed. Fresh full exports still use `pipeline/export_json.py`;
the committed June snapshot was otherwise upgraded reproducibly with
`python3 pipeline/backfill_relationship_exports.py` and
`python3 pipeline/backfill_person_exclusions.py`. Both preserve the source
snapshot’s `generatedAt` value; the latter publishes its evidence separately
through the person-exclusion block.

Passed after the 5Q.4a source/contract baseline and its two P0 truth fixes:

- `npm run lint` (zero errors; zero warnings)
- `npm run typecheck`
- `npm run build` — 3,625 static routes

The explicit repository-local browser journey gate was not rerun for the
initial source/contract documentation commit. It was subsequently rerun in
both final-head GitHub Actions workflows on `8bb61a7`; all seven journeys
passed. The successful in-app preview review remains separate rendered/
perceptual evidence rather than a substitute for that gate.

Recorded on `codex/phase-5q4a-baseline-closeout` without production-code,
deployment, or provider-setting changes:

- exact source/deployment verification for
  `main@8a4fccdeef90b2678a87d957e57d3d438a7fd317` and
  `dpl_9VXLKKGNH1hcgHtCi5dHdDgY9mii`;
- 67 captures spanning ten route tops at desktop/mobile, focus states, WCAG text
  spacing, forced colors, four color-vision simulations, and image failure;
- all 20 route/viewport Axe and overflow measurements, standalone-Chromium
  sequential keyboard/activation evidence, and controlled no-cache Web Vitals;
- settled reduced-motion evidence, Evolution-only console errors, and a Rodin
  detail failure state in which seven broken images preserve alt text but not
  stable presentation;
- `npm run test:e2e` — all seven canonical Chromium journeys passed with only
  the known `NO_COLOR`/`FORCE_COLOR` warnings.

The ad hoc read-only collector was temporary and is not a repository test.
Early full-matrix attempts exposed collector assumptions; the final matrix
reached the Migration Space assertion and correctly surfaced the product
failure, while the isolated interaction/image-failure and route-top/no-cache
subtests passed. Evidence classifications and owner-only protocols are in the
visual baseline.

### Publishing-check history on PR #1

- The GitHub account billing lock that prevented CI from starting was cleared
  on 2026-08-02. Earlier push run
  [30763980033](https://github.com/asherzafar/sculptor-explorer/actions/runs/30763980033)
  and pull-request run
  [30763981375](https://github.com/asherzafar/sculptor-explorer/actions/runs/30763981375)
  ended with zero steps and a billing-lock annotation; their missing log blobs
  were consequences of the jobs never starting, not repository failures.
- Rerunning the final-head workflows after payment confirmed that runners could
  start, then exposed a repository CI issue: the browser-install step populated
  `web/.playwright-browsers/` before the root validation gate, and ESLint's flat
  config scanned Chromium's generated `inspector_overlay/main.js`. The browser
  bundle is gitignored third-party code, so this branch now excludes
  `.playwright-browsers/**` explicitly in `web/eslint.config.mjs`.
- Once lint passed, two GitHub-hosted Ubuntu runs consistently measured the
  deterministic lineage benchmark at 6.43–6.56 s for the default scenario and
  7.93–8.38 s with institutions, versus 1.68 s and 2.11 s on the audit machine.
  The workflow now supplies runner-specific 9 s / 11 s regression tripwires;
  these do not replace the full local median or real-browser product budgets.
  Treat the latest checks on PR #1 as the authoritative validation result.
- Final push run
  [30768319691](https://github.com/asherzafar/sculptor-explorer/actions/runs/30768319691)
  and pull-request run
  [30768321252](https://github.com/asherzafar/sculptor-explorer/actions/runs/30768321252)
  both completed successfully at `8bb61a7`, including the complete validation
  gate and all seven Playwright journeys. Vercel and Vercel Preview Comments
  also passed at the same head.
- Before the approved per-Worker Git build disconnect, the external
  `Workers Builds: sculpture-in-data` check failed at
  [Cloudflare build `8735cabc-6f56-4eb3-9cfc-3377607f375d`](https://dash.cloudflare.com/370dc6896c711fc6c8c6801139acd063/workers/services/view/sculpture-in-data/production/builds/8735cabc-6f56-4eb3-9cfc-3377607f375d).
  The disconnect later removed only the Worker's two Git build triggers. The
  Worker, active/prior manual versions, disabled routing, and build-token
  metadata remain retained through 2026-09-02 UTC. Fresh PR heads #1–#4 have
  no Cloudflare check; Vercel remains the canonical production host.

The historical failure and post-disconnect API evidence remain in the separate
5Q.4c hosting inventory. Do not repeat the disconnect or delete/revoke retained
Cloudflare resources without a new post-retention review and explicit approval.

## Recommended next sequence

1. Review the remaining 5Q.4b route evidence against the earned
   Explore/Timeline/Migration patterns and select one smallest coherent next
   slice before changing behavior. Keep Lineage separate unless its adjacency,
   focus, typeahead, keyboard, reduced-motion, forced-colors, canonical-state,
   and performance model are scoped together; do not carry the Sankey's pair
   list mechanically into the heterogeneous graph.
2. Run the owner-only actual-zoom, physical-input, VoiceOver/NVDA, Windows High
   Contrast, and comprehension protocols for the landed route slices; do not
   backfill them as automated evidence.
3. Add privacy-respecting analytics and run five structured user sessions,
   then hold the Phase 5R strategic horizon workshop before the next major
   public phase. At most one isolated lab experiment may run in parallel.

### Next bounded seed — select the next 5Q.4b route slice

> Continue Phase 5Q.4b from freshly fetched protected `origin/main` in a
> dedicated clean worktree. Perform a read-only remaining-route scope review
> against the 5Q.4a baseline and the earned Explore, Timeline, and Migration
> patterns; select one smallest coherent next slice and record its reader
> question, task/data abstraction, URL contract, responsive structured
> equivalent, keyboard/focus/target behavior, disclosure, accessibility and
> performance budgets, and success/stop gates. Do not change route behavior,
> begin implementation, clean retained branches/worktrees, deploy or promote
> manually, change provider settings/routes/domains, or merge without separate
> exact-head approval.

## Starting instructions for any agent

Read `AGENTS.md`, `.windsurfrules`, `docs/PROJECT_CHARTER.md`, `docs/ROADMAP.md`, and the applicable nested instructions. Inspect the repository rather than trusting historical counts. Preserve unrelated work, run proportional validation, and update this handoff when the verified boundary changes.
