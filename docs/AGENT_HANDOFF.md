# Agent Handoff

**Verified:** 2026-08-06

**Purpose:** Current agent-neutral continuation state. The evidence behind the roadmap reset is in `docs/PROJECT_AUDIT_2026-08-02.md`; historical 5b.3–5b.4 implementation detail remains in `docs/CODEX_HANDOFF.md`.

## Current boundary

Phase 5b.5 and Phase 5Q.1–5Q.3 are implemented in the current release candidate. P1066/P737 person-person edges share the six-field temporal envelope contract used by P69/P937 institutional edges; undatable person links remain exported with null fields and explicit reasons. `/transparency` reports institution coverage, date confidence, skipped empty intersections, educational concentration, explicit release-review dates, and separate source/eligible/publication counts.

The bounded Getty contract repair restores the detail behavior that the old
roadmap overstated. The 3,543-record monolith and all per-QID shards now share a
validated final-record base; 2,310 records carry structurally identical
`gettyVerified` values across both surfaces, and the nine shards with 34
public-domain museum works retain their shard-only `works` field. The Getty
audit denominator is 2,310 after excluding `Q87366`, not the stale 2,311. The
canonical root gate now includes both the committed-data parity checks and a
focused standard-library final-writer regression suite.

Protected `main` is now
`8633902fa01d02f72e325c53944780b40b219ec8`: PR #24 merged the Explore slice
at exact head `f7b220788e83a36f5583cd645a740ff6c9706789` after PR #23. Default-branch
Actions run `31119230390` completed successfully on attempt 2 after attempt 1
timed out without receiving a runner. Vercel production deployment
`dpl_3W5dDYtmb5FaQLUrQHU6Kj8SsYyB` is `READY` from the exact merge SHA at
`https://sculptor-explorer-poxhnj3o7-asherzafars-projects.vercel.app`;
canonical and immutable route probes return 200 for the public routes and 404
for the missing-route probe. The existing Git integration produced the
deployment; no manual promotion or provider mutation occurred. The merged
Explore branch and worktree remain retained and clean.

A Codex review submitted three minutes after PR #24 merged identified three
confirmed production defects: sequential multi-word typing collapsed spaces,
the 2,581 pipeline movement sentinels sorted as a literal letter-N block, and
the 390px list inferred “present” from a null death year. The current bounded
candidate is `codex/phase-5q4b-landing-hotfix`, based exactly on the protected
merge commit above. It preserves an ephemeral whitespace draft only while the
search field is being edited while keeping result state and shared URLs
canonical; sends the movement sentinel through the existing missing-last
comparator in both directions; and renders an unknown death year as `—` on
mobile. Focused unit and browser regressions cover those boundaries. It does
not change pagination, filters, link destinations, shared navigation, or any
Timeline, Evolution, Migration, or Lineage behavior. Explore remains an open
5Q.4b route slice until this hotfix passes exact-head CI, READY Preview,
rendered QA, review, merge, and production proof.

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
current hotfix closes only its three post-merge boundary defects. Evolution
negative-width errors, sculptor-detail ARIA/image shift, dense
chart equivalents, Timeline issues, actual zoom/screen-reader evidence, and
reader comprehension remain separate work. Explore patterns are not earned for
reuse until the hotfix passes review and landing. User evidence in 5Q.5 and
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
automated review findings above prevent the route slice from being recorded as
closed until the bounded hotfix lands through the same gates.

After that release stack, the dependency queue landed sequentially as PRs #17,
#13, #15, #14, #18, #19, #12, #10, and #8, followed by focused transitive
advisory closeout PR #20. Every PR passed exact-head `validate` and Vercel
preview checks; every merge then passed default-branch validation and an
exact-SHA Vercel production check before the next PR proceeded. The dependency
closeout baseline is `main@674f65884d622f8fabb509e43d651cf67188717b`;
GitHub Actions run `30788497586` passed all seven browser journeys, and Vercel
production deployment `dpl_TgufELpqshj8xAZQtpjVF6i5DPVg` is `READY` on the
canonical aliases. GitHub has zero open PRs and zero open Dependabot alerts;
both full and production-only npm audits report zero vulnerabilities.

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
  target/contrast measurement, bounded focusables, and interaction timing; the
  hotfix adds sequential typing and missing-last movement-sort regressions and
  strengthens the responsive equivalence assertion for unknown death years.
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
  hotfix retains those contracts while closing the three late review findings;
  treat the pattern as unearned for reuse until hotfix Preview QA and landing.
- Evolution, Migration, and Lineage are desktop-only analytical experiences at
  390px; each is replaced by a notice with links to other routes. All four chart
  families still lack a structured keyboard/screen-reader equivalent.
- Timeline’s 700px mobile chart loses name/date correlation, has about 12.44px
  pointer rows, and exposes zero mark tab stops. Migration’s focused
  same-country checkbox fails Space activation. Evolution emits invalid
  negative-width SVG console errors under the audited mode matrix.
- `docs/DATASET_DATASHEET.md` is the maintained composition/source/license/processing/use/risk record. `docs/CLAIM_REGISTER.md` maps every public analytical surface to its supported claim and defines external domain/community-review triggers.
- The retained JSON field/file names `crossesBorders` and `cross_cultural_summary.json` are legacy contract names. Their exact meaning is disjoint recorded Wikidata P27 sets; public copy no longer describes this as observed border crossing, migration, refugee history, or cross-cultural influence.

## Known quality issues

- `npm run lint` now exits with zero errors and zero warnings. The intentional standard `<img>` in `WorksGallery` remains documented inline for hot-linked public-domain museum assets in the static export.
- Next.js and `eslint-config-next` are aligned at 16.2.12. Patched transitive
  dependency closeout leaves both npm audit views and GitHub's open Dependabot
  alert queue at zero. The temporary PostCSS/Sharp override rationale and
  retirement triggers are in `docs/SECURITY.md`.
- The known impossible lifespan is resolved at its source boundary: Wikidata records `Q87366` only as “18th century” (precision 7), so the year-based public export now excludes it with evidence in `overrides/person_exclusions.csv` and `transparency.json`. Repository invariants reject any future birth-after-death record.
- Repository CI and seven focused Playwright core-journey/URL-state/provenance checks now exist. The repo-local Chromium binary is gitignored; install it with `cd web && npm run test:e2e:install` before the first local run.
- All four production chart SVGs have roles and accessible names but no
  structured equivalent or tabbable chart-detail path. Forced-colors/grayscale
  simulation weakens or collapses categorical distinctions; this cannot pass
  until a non-color reading path exists.
- The 5Q.4a Axe baseline found repeated contextual contrast failures (2,378
  nodes on old Explore), six prohibited ARIA labels on detail completeness
  dots, a non-focusable mobile Timeline scroller, and four movement target-size
  failures. PR #24 uses the AA darker Verdigris context and ≥24px targets; its
  exact Preview Axe/forced-color/measurement review passed. The landing hotfix
  changes no styling but must repeat exact-head rendered evidence. Non-Explore
  findings remain open. No P0 was found in the baseline.
- Actual 200% browser zoom and spoken screen-reader output remain explicitly
  unobserved. The in-app zoom/Tab surface did not expose those operations;
  viewport resizing and source inspection are not substitutes.

## Validation state at this handoff

Passed locally on `codex/phase-5q4b-landing-hotfix` from exact base
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
- Draft PR #25 opened at
  `https://github.com/asherzafar/sculptor-explorer/pull/25` from first head
  `81b9aaba2172dd258467d4cd3e045e92692caa13`. Its Git-integrated Vercel
  Preview `dpl_856x7SmuennGGiBQKA6ag6Nz3Zxs` reached `READY` at
  `https://sculptor-explorer-oq3q6nosp-asherzafars-projects.vercel.app` from
  that exact branch/SHA, and the repository canonical/missing-route probe
  returned the required 200/404 contract.
- Read-only first-head Preview QA covered first, middle, last, empty, invalid,
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

Exact-head GitHub checks, a `READY` Vercel Preview, read-only rendered QA,
review conversations, and clean source-control reconciliation remain the
publishing/review gates for the final docs-only evidence head. Evidence from
the first hotfix head and from PR #24 is historical and cannot close that
final head.

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

1. Finish exact-head review of `codex/phase-5q4b-landing-hotfix`: required
   checks, READY Preview, desktop/390px rendered QA of sequential multi-word
   entry, movement missing-last sorting, explicit mobile unknown years, and the
   unaffected Explore gates. Merge and production landing require separate
   exact-PR-head approval. Only after the hotfix lands may the Explore route be
   closed or another route slice begin.
2. Run the owner-only actual-zoom, physical-input, VoiceOver/NVDA, Windows High
   Contrast, reduced-motion, and comprehension protocols at the relevant route
   gate; do not backfill them as automated evidence.
3. At the 2026-09-02 dependency review (or sooner on a stable Next release),
   test whether the PostCSS/Sharp overrides can be safely retired; do not let
   that maintenance interrupt the current route slice unless a new advisory
   changes risk.
4. Add privacy-respecting analytics and run five structured user sessions,
   then hold the Phase 5R strategic horizon workshop before the next major
   public phase. At most one isolated lab experiment may run in parallel.

### Next bounded task seed — review and land the Phase 5Q.4b hotfix

> Continue Sculpture in Data Phase 5Q.4b on the existing
> `codex/phase-5q4b-landing-hotfix` draft PR. Re-read its exact head, required
> checks, review conversations, and READY Preview source SHA; do not use older
> Preview evidence. Confirm sequential “Auguste Rodin” entry, canonical URL and
> navigation round trips, missing-last movement sorting in both directions, and
> the 390px unknown-death rendering, then review the unaffected Explore
> accessibility/mobile/scale/performance gates. Fix confirmed defects on the
> same branch and repeat exact-head checks/Preview QA. Mark ready and merge only
> with separate approval naming the exact PR head and only after all
> branch-protection gates pass. After merge, verify default-branch Actions,
> exact-SHA READY production, canonical/missing-route probes, and reconciliation;
> do not delete branches/worktrees or start Timeline in the same task.

## Starting instructions for any agent

Read `AGENTS.md`, `.windsurfrules`, `docs/PROJECT_CHARTER.md`, `docs/ROADMAP.md`, and the applicable nested instructions. Inspect the repository rather than trusting historical counts. Preserve unrelated work, run proportional validation, and update this handoff when the verified boundary changes.
