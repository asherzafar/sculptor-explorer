# Sculpture in Data — Agent Guide

This is the vendor-neutral entry point for every coding agent working in this repository. Keep this file concise and durable; tool-specific files should point here instead of copying project policy.

## Read order and authority

1. Follow the user's current request and the nearest `AGENTS.md` for the files being changed.
2. Read `.windsurfrules` for current design tokens, interaction invariants, and Next.js/D3 implementation rules.
3. Read `docs/PROJECT_CHARTER.md` for the product's purpose, audiences, objectives, and decision criteria.
4. Read `docs/EXPLORATION_STRATEGY.md` for the sculpture-first scope, research-lab workflow, graph semantics, question atlas, and expansion path.
5. Read `docs/DECISIONS.md` for active decisions, review triggers, and deferred founder choices.
6. Read `docs/ROADMAP.md` and, for Phase 5 work, `docs/PHASE_5_PLAN.md` for sequencing and gates.
7. Read the relevant specialist document: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/RESEARCH_FOUNDATIONS.md`, `docs/VISUAL_BASELINE_2026-08-02.md` during Phase 5Q visual work, `docs/DATASET_DATASHEET.md`, `docs/CLAIM_REGISTER.md`, or a pipeline/source-specific document.
8. Read `docs/AGENT_HANDOFF.md` for the latest verified state and known issues. Use `docs/PROJECT_AUDIT_2026-08-02.md` when you need the dated evidence behind the roadmap reset.

If documents conflict, the more specific and more current instruction wins. Strategic outcomes belong in the charter, current consequential choices in the decision log, sequencing in the roadmap, implementation values in `.windsurfrules`, and rationale in the deep-dive docs. Fix contradictions in the same change rather than choosing silently.

## Product guardrails

- North star: help people explore and explain how artists, institutions, places, movements, works, and practices shape one another over time—beginning with sculpture—while making the limits of the underlying data visible and auditable.
- Sculpture is the current public identity and first deep domain, and 1800 is the current public data boundary; neither is a permanent model limit. Generalize disciplines or periods only through additive, evidence-tested steps.
- The project has two tracks: a quality-gated public explorer and an isolated, time-boxed exploration lab. A fun or technique-led prototype is welcome in the lab; it needs a learning note before completion and full charter gates before production.
- The project is a lens on structured public data, not a comprehensive or authoritative art-historical canon.
- Optimize for a clear question and legible answer before adding visual density.
- Every analytical view must expose its source, denominator or scope, freshness, and important missingness near the claim.
- Do not infer certainty the data does not contain. Preserve source values, provenance, confidence, and explicit unknown states.
- Keep asserted influence, affiliation, co-presence, similarity, and prediction as separate relationship layers. Never present a graph path or inferred overlap as proof of causation.
- All consequential filters and selections must be reproducible in the URL. Hover and other ephemeral UI state may remain local.
- Accessibility, mobile comprehension, performance, data integrity, and maintainability are product requirements, not post-launch polish.

## Working method

Before changing files:

1. Inspect the current implementation, git status, and applicable nested instructions.
2. State the user outcome, evidence, and validation needed. For substantial work, keep a short working plan.
3. For a new visualization or data feature, document the domain question, target reader, data/task abstraction, chosen idiom, uncertainty, and success/stop gate. Use `docs/RESEARCH_FOUNDATIONS.md`.
4. Prefer primary sources: official vendor documentation, standards bodies, peer-reviewed literature, and source-system documentation. Record durable findings in the relevant doc with links.
5. For a lab experiment, use the brief and lifecycle in `docs/EXPLORATION_STRATEGY.md`; isolate it from production routes/contracts and record a continue/simplify/archive decision.

While changing files:

- Preserve unrelated user work and avoid broad rewrites.
- Use existing patterns and tokens. Do not introduce a second charting, state, or styling system without an explicit architecture decision.
- Treat `web/public/data/` as generated output and `overrides/` as curated evidence, not casual edit targets.
- Make schemas additive where practical. If a breaking change is necessary, version it and update producers, consumers, tests, and documentation together.
- Derive changing counts and dates from export metadata in UI code. Audit snapshots in docs must be dated.
- Keep tool-specific agent files as thin adapters. Do not place unique project policy only in `CLAUDE.md`, `.cursor/`, `.github/`, or another vendor directory.
- Do not adopt a graph database because the domain is graph-shaped. First document the semantic model, real queries, provenance/temporal requirements, benchmark, and architecture decision.

Before handing off:

1. Run checks proportional to the change and report both successes and pre-existing failures.
2. Reconcile status, counts, routes, schemas, and priorities across affected docs.
3. Update `docs/AGENT_HANDOFF.md` when the verified state or next clean boundary changes.
4. Summarize the outcome, files changed, tests run, known risks, and next decision. Do not claim a check passed if it was not run.

## Validation commands

Use Node 20. The canonical bounded gate, from the repository root, is:

```bash
./scripts/validate.sh
```

It runs these standard-library data checks plus lint, type checking, the
production build, and CI-safe performance bounds:

```bash
python3 pipeline/test_data_contracts.py
python3 pipeline/test_institutions.py
python3 pipeline/test_relationship_temporal.py
python3 pipeline/test_temporal.py
```

Run `node web/perf/lineage-bench.mjs` separately for the full local median and
force-cost analysis. CI installs web dependencies with `npm ci` before invoking
the root gate.

When the pipeline environment has its dependencies:

```bash
cd pipeline
python3 -m pytest test_temporal.py
python3 validate_institutions.py
```

For documentation-only changes, at minimum run `git diff --check`, verify local links and terminology, and inspect `git diff`. Do not rerun the data pipeline unless the task changes pipeline inputs or generated data.

## Current sequencing constraint

Phase 5b.5 and Phase 5Q.1–5Q.3 are implemented in the current release candidate. Complete the stabilization checkpoint and Phase 5Q product-quality gate in `docs/ROADMAP.md` before starting 5b.6, 5c, or 5d as public features. Isolated, time-boxed lab prototypes may run in parallel; they must not create production dependencies or bypass graduation gates. New large public visualizations remain hypotheses until their reader question, data fitness, usability evidence, and performance budget pass.
