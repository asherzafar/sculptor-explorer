# Sculpture in Data

An interactive, evidence-aware explorer of artistic lives and cultural networks over time, beginning with sculpture since 1800. It connects artists, movements, institutions, places, recorded geographic endpoints, and museum works using Wikidata, Getty ULAN, the Metropolitan Museum of Art, and the Art Institute of Chicago, while exposing the coverage and limits of those sources.

> **Curation note:** The canonical focus list emphasizes the National Sculpture Society tradition, and the wider published dataset is still shaped by the coverage biases of its sources. This is a data lens, not a comprehensive global canon; see `overrides/focus_sculptors.csv`, `/transparency`, and `docs/INCLUSION_CRITERIA.md`.

## Current state

Phase 5b.5 and Phase 5Q.1–5Q.3R are implemented in the current release candidate. The active boundary is 5Q.4: the source/contract portion of the visual-foundations exercise is recorded, while rendered perceptual review, route-by-route aesthetic/comprehension work, accessibility, mobile task equivalence, URL-state completion, and measured performance remain before further production graph densification. Person-to-person and institutional relationships share one temporal-confidence contract; every analytical route carries source/scope/freshness/missingness context, with the full data record on `/transparency` and in the dataset datasheet. A parallel, isolated exploration lab may prototype temporal and multilayer-network questions without creating production dependencies; the public identity remains Sculpture in Data through 5Q while the conceptual model becomes artist-neutral through evidence-tested, additive steps. A strategic Phase 5R workshop follows user evidence and deliberately reopens the longer-term goals, literature, question atlas, and roadmap before the next major public phase.

The committed snapshot audited on 2026-08-02 contains 3,543 included sculptors and retains its source generated-at date of 2026-06-05. An evidence-backed static overlay removed one century-precision record that had been flattened to an impossible lifespan; runtime displays should derive changing counts and dates from export metadata.

## Quick start

The repository currently declares Node 20.9 or newer for local/CI use, while
the connected Vercel project already reports Node `24.x`. The next focused
infrastructure task standardizes all three environments on Node 24; until that
review lands, follow the committed local/CI contract rather than changing one
surface ad hoc.

```bash
cd web
npm ci
npm run dev
# Open http://localhost:3000 → redirects to /timeline
```

## Project structure

```text
sculptor-explorer/
├── AGENTS.md          # Vendor-neutral instructions for coding agents
├── .agents/skills/    # Optional repo workflows; AGENTS.md remains canonical
├── pipeline/          # Python ingestion, normalization, validation, export
├── web/               # Next.js App Router app, statically exported
│   ├── src/app/       # Timeline, Explore, Evolution, Migration, Lineage,
│   │                  # About, Transparency, and entity/narrative routes
│   └── public/data/   # Generated JSON committed for static hosting
├── overrides/         # Curated inclusion list and documented corrections
├── data/              # Local pipeline cache (gitignored)
└── .windsurfrules     # Current design and implementation values
```

## Documentation

Start with `AGENTS.md` regardless of which coding agent you use.

| Document | Purpose |
|---|---|
| `AGENTS.md` | Canonical cross-agent read order, guardrails, workflow, and validation |
| `.windsurfrules` | Current design tokens and implementation invariants |
| `docs/PROJECT_CHARTER.md` | North star, audiences, objectives, principles, and decision scorecard |
| `docs/EXPLORATION_STRATEGY.md` | Project origin, question atlas, lab workflow, graph/temporal semantics, and expansion path |
| `docs/DECISIONS.md` | Active decisions, review triggers, and founder questions that are deliberately deferred |
| `docs/ROADMAP.md` | Delivery order, priorities, and exit gates |
| `docs/SOURCE_CONTROL_AND_DELIVERY.md` | Protected-main target, stacked-PR rules, CI/preview/production contract, provider boundaries, and agent authority |
| `docs/DATA_RELEASE.md` | Versioned identity, provenance, and changes for the committed public data artifacts |
| `docs/DATASET_DATASHEET.md` | Composition, licenses, processing, missingness, uses/non-uses, risks, citation, and maintenance |
| `docs/CLAIM_REGISTER.md` | Route-level evidence/denominator audit and sensitive classification language rules |
| `docs/SECURITY.md` | Dependency findings, deployment reachability, fixes, and time-bounded acceptances |
| `docs/RESEARCH_FOUNDATIONS.md` | Primary evidence and how it becomes verifiable project practice |
| `docs/VISUAL_BASELINE_2026-08-02.md` | Phase 5Q route/task and encoding baseline, ranked findings, and pending perceptual evidence |
| `docs/PROJECT_AUDIT_2026-08-02.md` | Dated inheritance audit and measured baseline behind the roadmap reset |
| `docs/AGENT_HANDOFF.md` | Latest verified state, known issues, and next clean boundary |
| `docs/DESIGN_SYSTEM.md` | Design rationale, accessibility, visualization, and component behavior |
| `docs/ARCHITECTURE.md` | Data flow, source APIs, schemas, and TypeScript interfaces |
| `docs/PHASE_5_PLAN.md` | Detailed Phase 5 hypotheses, architecture, risks, and gates |

Tool-specific entry points (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, and `.windsurfrules`) are deliberately thin adapters or implementation-value stores; they must not become competing roadmaps.

## Agent workflow

`AGENTS.md` defines the same inspect → focused change → validate/review →
publish/preview → rendered-QA lifecycle for Claude, Codex, Cursor, Windsurf,
Copilot, and other agents. Skill-aware agents may use the instruction-only
`ship-pr` and `visual-qa` workflows in `.agents/skills/`; agents without that
feature follow the equivalent steps in `AGENTS.md` directly. Publishing and
merging always require explicit user authorization, and every bounded task
must say whether it is complete and safe to archive, awaiting review, or
blocked, then provide the next task's exact seed prompt when work remains.
Every PR handoff ties GitHub Actions and an immutable Vercel deployment to the
same full commit SHA; Vercel's Git integration remains the sole application
deployment path.

## Data pipeline

```bash
cd pipeline
pip install -r requirements.txt
python3 run_all.py
```

The pipeline ingests source data, applies documented normalization and overrides, validates contracts, and exports JSON to `web/public/data/`. Do not rerun it casually: external queries can be slow, caches may be required, and generated-output changes should be reviewed with their metadata and validation results.

## Quality checks

```bash
./scripts/validate.sh
cd web
npm run test:e2e
```

These two bounded gates run in GitHub Actions. The root command covers
repository data contracts, temporal/institution tests, lint, type checking,
the production build, and deterministic performance-regression bounds; the
direct web command covers seven Playwright core-journey/URL-state/provenance checks. They
remain separate because restricted agent sandboxes may grant localhost
binding to an explicit browser-test command but not to a nested process inside
a general shell script. Before the first local run, install the gitignored
repository-local Chromium test binary with
`cd web && npm run test:e2e:install`; it does not use a user-wide browser
profile or cache. Run
`node web/perf/lineage-bench.mjs` separately when you need the full median and
force-cost study for a product decision.

The production build intentionally uses Next's supported Webpack path. The
default Turbopack build can require an internal worker port that restricted
agent sandboxes do not permit; Webpack produces the same static-export
contract without that hidden capability.

See `docs/AGENT_HANDOFF.md` for the current pass/fail baseline. As of the Phase 5Q.3R stabilization run on 2026-08-02, the complete local validation gate and all seven Chromium journeys pass.

## Deployment

The canonical production site is
<https://sculptor-explorer.vercel.app/>. It is hosted on Vercel and
statically exported by Next.js.

| Setting | Value |
|---|---|
| Framework | Next.js 16, App Router |
| Root directory | `web` |
| Build command | `npm run build` |
| Output directory | `out` |
| Node version | Vercel project: `24.x`; repository/CI currently: `20.9+` (`web/.nvmrc`, `web/package.json`, and CI), with alignment scheduled next |

The stale <https://sculpture-in-data.netlify.app/> deployment is a legacy
host scheduled for deliberate retirement in Phase 5Q.4c. Replace its stale
content with a path-preserving redirect before deciding whether to delete the
Netlify project; do not deploy the current application there. Cloudflare’s
free static-asset manifest limit is below the current per-sculptor export’s
file count, so Vercel remains the practical target unless the export
architecture changes.
