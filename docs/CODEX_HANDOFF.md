# Codex Handoff

## Current repo state

Branch: `main`

Recent implementation commits:

- `6022932 5b.3: export institutional graph data`
- `a6d343b Implement lineage institution hubs`

This handoff document should be read first when continuing in Codex.

## Current phase

Phase 5b.4 is complete. The next clean boundary is Phase 5b.5.

## What shipped in 5b.3

- Institutional ingest/export is wired into `pipeline/export_json.py`.
- `web/public/data/institutions.json` is generated with institution/place nodes, rosters, edge bundles, index rows, relation counts, render flags, and export metadata.
- Sculptor JSON records gain additive `institutions[]` and `institutionalEdges[]` fields.
- TypeScript schema and loader support live in:
  - `web/src/lib/types.ts`
  - `web/src/lib/data.ts`

Export results from the included sculptor roster:

- 1,662 institution/place nodes
- 334 renderable institutions at the >=3-sculptor threshold
- 5,925 institutional/work-location edges
- 54 skipped empty lifespan intersections
- Edge confidence split:
  - 1,004 high qualifier-backed
  - 63 medium lifespan-only
  - 4,858 low age-prior-backed

## What shipped in 5b.4

`/lineage` now loads institutions and can render institution hubs behind an opt-in URL state.

Behavior:

- Default `/lineage`: institutions off.
- Opt-in: `/lineage?nodes=sculptor,institution`.
- The default route does not fetch `institutions.json`; the institution
  bundle lazy-loads only after the URL/checkbox opts into institution hubs.
- Institution layer is active only when relation type and cross-border filters are both `all`, because those filters apply to person-person lineage edges, not P69/P937 institutional edges.

Graph encoding:

- Sculptors: circles.
- External mentors: diamonds.
- Institutions: squares.
- Institutional P69/P937 edges: dashed, lower-opacity links.

Force tuning for institutional view:

- Institutional link distance: `72`
- Institutional link strength: `0.35`
- Many-body strength: `-80`
- Many-body theta: `1.5`

Benchmark harness:

- `web/perf/lineage-bench.mjs` now matches the 5b.4 force tuning.

Latest headless benchmark results:

- Current graph: 1.58s settled
- +institutions: 1.92s settled
- +movements projection: 1.98s settled
- stress: 3.32s settled

## Validation already run

From `web/`:

```bash
npx tsc --noEmit
npx eslint src/app/lineage/LineageContent.tsx src/components/charts/LineageGraph.tsx
node perf/lineage-bench.mjs
```

From repo root:

```bash
python3 pipeline/test_institutions.py
```

Route smoke tests were also run against the local dev server:

- `/lineage` returned 200
- `/lineage?nodes=sculptor,institution` returned 200

Python environment note:

- Use `python3`, not `python`, on this machine.
- The lightweight `pipeline/test_institutions.py` harness uses only the
  standard library and can run without installing pipeline dependencies.
- `pipeline/validate_institutions.py` and `pipeline/test_temporal.py`
  require a pipeline environment with `pandas`, `pyarrow`, and `pytest`.
  The system `python3` used during this handoff review did not have those
  packages installed.

Review note:

- Full `npm run lint` still fails on pre-existing unrelated issues,
  primarily `react-hooks/static-components` and unescaped apostrophes in
  `web/src/app/transparency/page.tsx`. The touched lineage files pass
  targeted ESLint, and `npm run build` passes.

## Important files

Pipeline and data:

- `pipeline/export_json.py`
- `pipeline/query_institutions.py`
- `pipeline/temporal.py`
- `pipeline/test_temporal.py`
- `pipeline/test_institutions.py`
- `pipeline/validate_institutions.py`

Web data/schema:

- `web/src/lib/types.ts`
- `web/src/lib/data.ts`

Lineage UI:

- `web/src/app/lineage/LineageContent.tsx`
- `web/src/components/charts/LineageGraph.tsx`

Performance/docs:

- `web/perf/lineage-bench.mjs`
- `docs/PHASE_5_PLAN.md`
- `docs/ROADMAP.md`

## Next task: Phase 5b.5

Recommended next work:

1. Backfill existing P1066/P737 person-person lineage edges with the temporal envelope schema already used by institutional edges.
2. Add transparency-page surfaces for:
   - institution coverage
   - edge confidence
   - skipped empty intersections
   - educational concentration
3. Keep institutions off by default unless a future benchmark/browser profile justifies default-on.

## Suggested Codex starting prompt

```markdown
We are working in `sculptor-explorer`.

Phase 5b.3 and 5b.4 are complete. Start from `docs/CODEX_HANDOFF.md`, `docs/PHASE_5_PLAN.md`, and `docs/ROADMAP.md`.

Latest completed work:
- 5b.3 exported institutional graph data.
- 5b.4 added opt-in institution hubs to `/lineage` via `?nodes=sculptor,institution`.
- Institutions are off by default.
- Institution data lazy-loads only after opting in.
- `LineageGraph` supports institution nodes as squares and dashed P69/P937 edges.
- Force tuning for institutional view: link distance 72, link strength 0.35, many-body strength -80, theta 1.5.

Validation already passed:
- `npx tsc --noEmit`
- targeted ESLint for lineage files
- route smoke tests for default and institution lineage URLs
- `node perf/lineage-bench.mjs`

Next task: Phase 5b.5. Backfill P1066/P737 person-person lineage edges with temporal envelopes, then add transparency coverage/confidence surfaces.
```
