# Agent Handoff

**Verified:** 2026-08-02  
**Purpose:** Current agent-neutral continuation state. The evidence behind the roadmap reset is in `docs/PROJECT_AUDIT_2026-08-02.md`; historical 5b.3–5b.4 implementation detail remains in `docs/CODEX_HANDOFF.md`.

## Current boundary

Phase 5b.5 and Phase 5Q.1–5Q.3 are implemented in the current release candidate. P1066/P737 person-person edges share the six-field temporal envelope contract used by P69/P937 institutional edges; undatable person links remain exported with null fields and explicit reasons. `/transparency` reports institution coverage, date confidence, skipped empty intersections, educational concentration, explicit release-review dates, and separate source/eligible/publication counts.

Phase 5Q—the product clarity and quality gate—is active before 5b.6 movements-as-nodes, 5c time-coded lineage, or 5d career Sankey. The 5Q.3R stabilization pass is locally green: movement labels link only through a generated route index, source freshness is distinct from artifact/contract review, candidate accounting is explicit, Next and its ESLint config are aligned at 16.2.12, and every production chart SVG has an accessible role/name. The next clean boundary is 5Q.4a’s visual-foundations exercise, followed by route slices beginning with Explore. Structured chart equivalents, keyboard chart-detail access, mobile task equivalence, Explore state/DOM scale, and measured field performance remain open. User evidence in 5Q.5 and the Phase 5R strategic workshop follow before a major new public phase.

Checkpoint branch: `codex/phase-5q-stabilization`.

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
- The current static export is large: approximately 228 MB and 36,201 files, driven mainly by per-sculptor pages/assets.
- Default lineage performance is acceptable but has little expansion headroom: roughly 1.68 s current, 2.26 s with institutions, 2.09 s with movements, and 3.72 s in the stress scenario on the audit machine.
- The Explore page mounts all included rows and keeps search/sort state locally rather than in the URL.
- Timeline/Explore mobile behavior and dense lineage interpretation need deliberate task-level treatment; clipping is not an acceptable long-term fallback.
- `docs/DATASET_DATASHEET.md` is the maintained composition/source/license/processing/use/risk record. `docs/CLAIM_REGISTER.md` maps every public analytical surface to its supported claim and defines external domain/community-review triggers.
- The retained JSON field/file names `crossesBorders` and `cross_cultural_summary.json` are legacy contract names. Their exact meaning is disjoint recorded Wikidata P27 sets; public copy no longer describes this as observed border crossing, migration, refugee history, or cross-cultural influence.

## Known quality issues

- `npm run lint` now exits with zero errors and zero warnings. The intentional standard `<img>` in `WorksGallery` remains documented inline for hot-linked public-domain museum assets in the static export.
- Next.js and `eslint-config-next` are aligned at 16.2.12. The full audit still reports 14 package findings (7 high), while `--omit=dev` reports three high findings through Next's build-only PostCSS and optional Sharp paths. The static-export reachability decision and 2026-09-02 review deadline are in `docs/SECURITY.md`.
- The known impossible lifespan is resolved at its source boundary: Wikidata records `Q87366` only as “18th century” (precision 7), so the year-based public export now excludes it with evidence in `overrides/person_exclusions.csv` and `transparency.json`. Repository invariants reject any future birth-after-death record.
- Repository CI and seven focused Playwright core-journey/URL-state/provenance checks now exist. The repo-local Chromium binary is gitignored; install it with `cd web && npm run test:e2e:install` before the first local run.
- All four production chart SVGs now have roles and accessible names. Useful text/structured equivalents, keyboard-accessible chart details, focus behavior, and non-color encodings still require the systematic 5Q.4 pass.
- The Codex app's in-app browser safety policy previously denied localhost inspection. Repository-local Chromium now renders all core/provenance journeys successfully, but 5Q.3 was a claims/data pass rather than a human aesthetic or assistive-technology review; do not treat it as the 5Q.4 visual/accessibility gate.

## Validation state at this handoff

Passed after the 2026-08-02 Phase 5Q.3R stabilization implementation:

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

## Recommended next sequence

1. Run 5Q.4a’s visual-foundations exercise: route/task matrix, baseline evidence, encoding inventory, real-content type/color/layout specimen, accessibility/performance checks, and low-fidelity alternatives.
2. Implement end-to-end route slices in order: Explore, Timeline, dense Lineage/Migration, then propagate earned patterns to the remaining routes; apply the route review gate each time.
3. Add privacy-respecting analytics and run five structured user sessions across the audience hypotheses.
4. Hold the Phase 5R strategic horizon workshop and use the evidence to choose among findability/connective tissue, coordinated views/entry points, works/IIIF story depth, and artist-neutral source/model pilots before further graph densification.
5. In parallel, run at most one bounded exploration—E4 institution/city biography is the recommended first option, with E1 temporal ego journey as the alternative—and record its learning without coupling it to production.

## Starting instructions for any agent

Read `AGENTS.md`, `.windsurfrules`, `docs/PROJECT_CHARTER.md`, `docs/ROADMAP.md`, and the applicable nested instructions. Inspect the repository rather than trusting historical counts. Preserve unrelated work, run proportional validation, and update this handoff when the verified boundary changes.
