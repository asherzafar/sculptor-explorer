# Agent Handoff

**Verified:** 2026-08-03

**Purpose:** Current agent-neutral continuation state. The evidence behind the roadmap reset is in `docs/PROJECT_AUDIT_2026-08-02.md`; historical 5b.3–5b.4 implementation detail remains in `docs/CODEX_HANDOFF.md`.

## Current boundary

Phase 5b.5 and Phase 5Q.1–5Q.3 are implemented in the current release candidate. P1066/P737 person-person edges share the six-field temporal envelope contract used by P69/P937 institutional edges; undatable person links remain exported with null fields and explicit reasons. `/transparency` reports institution coverage, date confidence, skipped empty intersections, educational concentration, explicit release-review dates, and separate source/eligible/publication counts.

Phase 5Q—the product clarity and quality gate—is active before 5b.6 movements-as-nodes, 5c time-coded lineage, or 5d career Sankey. The 5Q.3R stabilization pass is locally green: movement labels link only through a generated route index, source freshness is distinct from artifact/contract review, candidate accounting is explicit, Next and its ESLint config are aligned at 16.2.12, and every production chart SVG has an accessible role/name. The source/contract portion of 5Q.4a and the first rendered Timeline slice are now recorded in `docs/VISUAL_BASELINE_2026-08-02.md`. The rendered review covers 1440×900, 390×844, a 720×450 reflow proxy, pointer/URL behavior, representative focus, sampled contrast, chart focusability, and console output. It confirms that Timeline’s mobile chart, keyboard-detail path, touch targets, disclosure hierarchy, one annotation color, and shared skip-link behavior remain below the product gate. Remaining routes, actual browser zoom, text-spacing/forced-colors/reduced-motion, sequential keyboard/assistive-technology use, screen-reader output, performance, and reader comprehension remain open. Route slices still begin with Explore so its responsive list/state patterns can be earned before Timeline and dense charts reuse them. User evidence in 5Q.5 and the Phase 5R strategic workshop follow before a major new public phase.

The complete publishing/preview checkpoint was independently verified at
`8bb61a777007851abc060047894ed7e9c1828629`: draft PR #1 was mergeable, both
GitHub Actions events passed the root gate and all seven Playwright journeys,
and Vercel plus Vercel Preview Comments passed on that exact head. PR #1 has
since advanced to post-disconnect head
`9200e1c87fd8c5dc18005e1408060d59558c1c55`, which pins the current Actions to
immutable SHAs and adds monthly GitHub Actions/npm Dependabot review. Treat the
fresh head's newly triggered checks as the current merge evidence, not the old
checkpoint.

The workflow-standards branch has advanced to
`61dda5d5591d8e73965bd93435604973503e0fe2` with the protected-main target,
stack rules, PR evidence template, agent authority matrix, and verified
deployment smoke script. The earlier Node-alignment checkpoint
`945d2cb2b4b661f8ff4be2dcd510d2c1c096038b` passed local Node 24 install,
root/browser gates, both GitHub Actions events, and Vercel. The Node branch now
incorporates the refreshed parent and pins each v7 action to a full SHA, so that
earlier remote evidence is historical; fresh checks on the reconciled head are
required before review completion.

Stabilization checkpoint: `codex/phase-5q-stabilization` at `54a095f`.
Rendered-evidence continuation branch: `codex/phase-5q4-rendered-baseline` at
`9200e1c87fd8c5dc18005e1408060d59558c1c55`, draft PR
[#1](https://github.com/asherzafar/sculptor-explorer/pull/1).
Workflow-standards continuation branch: `codex/phase-5q4-workflow-standards`
at `61dda5d5591d8e73965bd93435604973503e0fe2`, based on the refreshed PR #1
head, draft PR [#2](https://github.com/asherzafar/sculptor-explorer/pull/2).
Node-runtime continuation branch: `codex/node-24-alignment`, based on the
workflow-standards branch, draft PR
[#3](https://github.com/asherzafar/sculptor-explorer/pull/3).

Canonical production is <https://sculptor-explorer.vercel.app/>. The founder
identified <https://sculpture-in-data.netlify.app/> as a stale legacy host; it
now issues path- and query-preserving 301 responses to Vercel and remains an
observation/compatibility surface, not a deploy target. The Cloudflare Worker
Git build was disconnected at 2026-08-03 00:31:05 UTC. Read-only API evidence
shows no Worker URL, custom domain, account zone/route, build config, trigger,
deploy hook, or service-scoped invocation row in the 30-day window ending
2026-08-03 01:55 UTC.

Retain the dormant manual deployment through the observation window; do not
delete or reconnect it merely to alter a GitHub check.

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
- Production build, TypeScript, zero-warning lint, data contracts, seven browser journeys, and bounded performance checks pass locally. Browser coverage includes the shared source/scope/snapshot/limits disclosure on all seven analytical route types and exact movement-link/route integrity. GitHub Actions defines the non-browser root gate and explicit browser gate; the verified build generates 3,625 static pages.
- The Vercel project reports Node `24.x`. The focused continuation declares
  Node 24 in both `.nvmrc` files, `web/package.json`/lockfile, local
  documentation, and CI; `engines.node: "24.x"` is the tracked repository
  override because no `vercel.json` or `.vercel` project metadata is
  committed. The exact-head PR #3 preview is READY and Vercel Preview Comments
  passes with no unresolved feedback.
- The current static export is large: approximately 228 MB and 36,201 files, driven mainly by per-sculptor pages/assets.
- Default lineage performance is acceptable but has little expansion headroom: roughly 1.68 s current, 2.26 s with institutions, 2.09 s with movements, and 3.72 s in the stress scenario on the audit machine.
- The Explore page mounts all included rows and keeps search/sort state locally rather than in the URL.
- Timeline/Explore mobile behavior and dense lineage interpretation need deliberate task-level treatment; clipping is not an acceptable long-term fallback.
- The rendered Timeline preview confirms the specific failure mode: at 390px a 700px-wide SVG is exposed through a 343px horizontal scroller; scrolling to later dates removes the names needed to interpret them, the scrollbar is only reached at the bottom of a 1,227px region, and row targets render at about 12.44px high. The chart has zero tabbable marks and no list/table equivalent.
- `docs/DATASET_DATASHEET.md` is the maintained composition/source/license/processing/use/risk record. `docs/CLAIM_REGISTER.md` maps every public analytical surface to its supported claim and defines external domain/community-review triggers.
- The retained JSON field/file names `crossesBorders` and `cross_cultural_summary.json` are legacy contract names. Their exact meaning is disjoint recorded Wikidata P27 sets; public copy no longer describes this as observed border crossing, migration, refugee history, or cross-cultural influence.

## Known quality issues

- `npm run lint` now exits with zero errors and zero warnings. The intentional standard `<img>` in `WorksGallery` remains documented inline for hot-linked public-domain museum assets in the static export.
- Next.js and `eslint-config-next` are aligned at 16.2.12. The full audit still reports 14 package findings (7 high), while `--omit=dev` reports three high findings through Next's build-only PostCSS and optional Sharp paths. The static-export reachability decision and 2026-09-02 review deadline are in `docs/SECURITY.md`.
- The known impossible lifespan is resolved at its source boundary: Wikidata records `Q87366` only as “18th century” (precision 7), so the year-based public export now excludes it with evidence in `overrides/person_exclusions.csv` and `transparency.json`. Repository invariants reject any future birth-after-death record.
- Repository CI and seven focused Playwright core-journey/URL-state/provenance checks now exist. The repo-local Chromium binary is gitignored; install it with `cd web && npm run test:e2e:install` before the first local run.
- All four production chart SVGs now have roles and accessible names. Useful text/structured equivalents, keyboard-accessible chart details, focus behavior, and non-color encodings still require the systematic 5Q.4 pass.
- A later Codex in-app browser session successfully inspected the user-supplied Vercel Timeline preview. The page emitted zero console warnings/errors during load, sort, navigation, reload/back, and viewport changes. The preview association with `54a095f` comes from the user-supplied workflow rather than independently exposed Vercel commit metadata; preview retention remains unverified. The earlier repository-local Chromium journeys remain regression evidence rather than the full 5Q.4 visual/accessibility gate.
- Timeline’s representative native controls expose visible browser focus, `aria-current`, and `aria-pressed`, but no skip link precedes repeated navigation. The SVG itself has an accessible role/name and zero tabbable descendants. Sequential Tab activation was not conclusive through the in-app synthetic-key path; a real keyboard and screen-reader pass remains required.
- Sampled Timeline text contrast passes except “Armory Show,” which renders at 9px in sandstone with 2.13:1 contrast against the warm page background. Treat that as a confirmed text-contrast defect, not a reason to replace the palette wholesale.

## Validation state at this handoff

Passed locally on `codex/node-24-alignment` with Node 24.14.0 and npm 11.9.0:

- `npm ci` — 709 locked packages installed with no engine mismatch; the existing `node-domexception` deprecation and documented 14-advisory audit posture remain unchanged
- `./scripts/validate.sh` — all data/institution/relationship/temporal checks, zero-warning lint, Node-24 type checking, 3,625-route production build, and performance bounds passed
- `node perf/lineage-bench.mjs --ci` within the root gate — current 1.67 s; institutions 1.98 s
- `npm run test:e2e` — all seven Chromium journeys passed in 6.0 s; only the known `NO_COLOR`/`FORCE_COLOR` warning was emitted

The lockfile changes only the root engine contract, `@types/node` 20.19.39 →
24.13.3, and its required `undici-types` 6.21.0 → 7.18.2 dependency. No other
package version changes. On the same published PR #3 head, both GitHub Actions
events passed the root and browser gates, Vercel reached READY, and Vercel
Preview Comments passed. The external Cloudflare Workers check failed on both
the approved base and this branch; it is not evidence of a Node 24 regression.

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
- Compressed major JSON: sculptor index ~108 KB, edges ~54 KB, institutions ~376 KB, migration ~71 KB, full sculptors ~777 KB

The worktree does not contain the gitignored parquet caches. Fresh full
exports still use `pipeline/export_json.py`; the committed June snapshot
was upgraded reproducibly with
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

Recorded on `codex/phase-5q4-rendered-baseline` without production-code or
deployment changes:

- rendered Timeline evidence at 1440×900 and 390×844;
- a 720×450 CSS-viewport proxy for approximately 200% desktop reflow;
- URL-backed sort persistence and pointer navigation to Hiram Powers;
- DOM focusability/landmark measurements, representative visible focus, and
  the confirmed absence of chart tab stops and a skip link;
- sampled text contrast and zero warning/error console output.

This is a documentation/evidence checkpoint, not a claim that Timeline or
5Q.4a passes. Actual browser zoom, sequential keyboard activation, text
spacing, forced colors, reduced motion, screen-reader behavior, remaining
routes, performance, and comprehension remain unverified.

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
- The external `Workers Builds: sculpture-in-data` check most recently failed
  at
  [Cloudflare build `8735cabc-6f56-4eb3-9cfc-3377607f375d`](https://dash.cloudflare.com/370dc6896c711fc6c8c6801139acd063/workers/services/view/sculpture-in-data/production/builds/8735cabc-6f56-4eb3-9cfc-3377607f375d).
  Treat this as Phase 5Q.4c hosting-inventory work. The integration and service
  were not changed or deleted; Vercel remains the canonical production host.

The Cloudflare failure must remain visible in the separate 5Q.4c hosting
inventory rather than being silenced by changing the integration in this task.

## Recommended next sequence

1. Run the 5Q.4c hosting inventory as a separate read-only task. Inventory
   Vercel, Netlify, and Cloudflare ownership, configuration, traffic/redirect
   needs, and rollback paths; make no deletion, integration, authentication,
   or production change.
2. Keep the rendered preview as evidence only—do not promote production—and
   complete 5Q.4a on the remaining routes plus actual zoom, text spacing,
   forced colors, reduced motion, keyboard/screen-reader behavior, perceptual
   performance, and reader comprehension.
3. Implement end-to-end route slices in order: Explore, Timeline, dense
   Lineage/Migration, then propagate earned patterns. Use Explore to establish
   the responsive list/table, URL-state, skip-link, target-size, and focus
   patterns. Run a separate read-only visual-QA task on each rendered PR before
   fixes and final validation.
4. Add privacy-respecting analytics and run five structured user sessions,
   then hold the Phase 5R strategic horizon workshop before the next major
   public phase. At most one isolated lab experiment may run in parallel.

## Starting instructions for any agent

Read `AGENTS.md`, `.windsurfrules`, `docs/PROJECT_CHARTER.md`, `docs/ROADMAP.md`, and the applicable nested instructions. Inspect the repository rather than trusting historical counts. Preserve unrelated work, run proportional validation, and update this handoff when the verified boundary changes.
