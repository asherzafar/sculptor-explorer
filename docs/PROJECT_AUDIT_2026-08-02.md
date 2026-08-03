# Project Audit — 2026-08-02

This is a dated evidence ledger for the August 2026 roadmap reset. It is not a source for permanent counts or current status; use generated metadata and `docs/AGENT_HANDOFF.md` for current truth. The founder direction added after the audit—including the sculpture-first but artist-neutral expansion posture and exploration lab—lives in `docs/EXPLORATION_STRATEGY.md`. Research-derived standards are documented separately in `docs/RESEARCH_FOUNDATIONS.md`.

> **Post-audit resolution, 2026-08-02:** Phase 5b.5 made lint green. The first
> Phase 5Q implementation slice then added repository CI, a bounded root
> validation command, broad static-data invariants, and Wikibase time-precision
> handling. The documented exclusion of `Q87366` changed the current published
> roster from this audit’s 3,544 baseline to 3,543; the measurements below are
> intentionally preserved as the inheritance baseline.
>
> **Audit correction:** the focus CSV contains 48 data rows (39 Fabio + 9
> original). The original audit read `wc -l` as a row count even though the
> final record had no terminating newline and reported 47 below; that factual
> count is corrected in place.

## Executive readout

Sculpture in Data is already a distinctive, credible exploratory product with real data depth, unusually strong transparency work, and a coherent visual identity. Its largest risk is no longer “not enough features”; it is that graph/data complexity, stale project truth, and missing quality infrastructure will outrun comprehension and trust. The best path is to finish Phase 5b.5, pass the Phase 5Q quality gate, observe readers using the existing product, and then favor connective features before another dense visualization.

## Audit method

The audit inspected repository instructions and documentation, data/export metadata, route and component structure, generated file sizes, static output, dependency state, chart/state patterns, and validation commands. It ran or reviewed:

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm audit`
- `node perf/lineage-bench.mjs`
- `python3 pipeline/test_institutions.py`
- the temporal test suite
- data integrity checks for identifiers, edge duplication, and lifespan order

## Findings by perspective

| Perspective | What is strong | Material gap / risk | Roadmap response |
|---|---|---|---|
| Product strategy | Seven complementary top-level views and substantial entity/narrative depth | Audience and core jobs were implicit; roadmap momentum favored new visual forms | Project charter, measurable objectives, scorecard, five-user evidence gate |
| Aesthetic system | Verdigris/Marble palette, Fraunces/DM Sans, restrained chrome, whitespace, and editorial tone create a memorable catalogue-like identity | Dense Lineage/Migration states can become cognitively noisy; some hierarchy/copy reflects old counts and scope | Preserve identity; review every default view question-first; simplify before decorating |
| Visualization | Strong D3 ownership, direct interaction, opt-in institution hubs, migration and temporal substrates | Default/advanced encodings lack a consistent comprehension protocol; animation/map/embedding ideas were technique-led in places | Munzner-style design review, overview→filter→detail, uncertainty and stop gates |
| Interaction/findability | Sculptor, decade, and movement routes create useful depth; many analytical filters are URL-backed | Explore search/sort is local; growing entities lack global search/institution pages; cross-view coordination is incomplete | URL-state completion and connective tissue precede further densification |
| Accessibility | Non-color rule exists in design policy; content pages have a mobile path | SVG names/roles, keyboard equivalents, focus, reduced motion, and non-visual detail paths are inconsistent | WCAG 2.2 AA + visualization-specific acceptance criteria in 5Q |
| Mobile | Ordinary routes can open on phones; dense routes acknowledge desktop limitations | Some Timeline/Explore behavior clips; a notice is not an equivalent for a reader task | Core mobile journey plus explicit simplified summaries/lists for dense views |
| Data/provenance | Transparency page, inclusion criteria, Getty comparison, country normalization, temporal confidence, and overrides are unusually mature | Stale snapshot, hard-coded counts, one impossible lifespan, and uneven/canon-biased source coverage | Datasheet/FAIR release contract, invariants, freshness UI, scheduled refresh/diff |
| Engineering quality | TypeScript and production build pass; pre-aggregation and slim index are sound; institution layer lazy-loads | Full lint fails; no CI or web tests; dependency advisories; static export/file count is large | Green automated gates and dependency triage before new features |
| Performance | Default route data is compressed effectively; opt-in loading protects first paint | Explore mounts all 3,544 rows; graph expansion has little headroom; export is 227MB/36,199 files | Pagination/virtualization, route budgets, p75 Web Vitals, graph thresholds |
| Agent maintainability | Detailed architecture/design/phase docs exist | No root vendor-neutral entry point; `.windsurfrules`, README, architecture, roadmap, and handoffs had contradictory phases/counts | `AGENTS.md`, thin vendor adapters, separated charter/roadmap/implementation truth |

## Measured baseline

### Product and data

- Included sculptors: 3,544.
- Export generated-at: 2026-06-05.
- Person-person lineage edges: 1,423.
- Institution bundle: 1,662 institution/place nodes, 334 renderable at the ≥3 threshold, 5,925 exported edges.
- Canonical focus CSV: 48 rows.
- No duplicate sculptor QIDs or duplicate lineage edges were found.
- One impossible lifespan: Johann Albrecht Siegwitz (`Q87366`), birth 1800 / death 1756.

### Build, quality, and security

- Production build: pass; 3,626 generated pages.
- TypeScript: pass.
- Institution test: pass.
- Temporal tests: 13 pass.
- Full lint: fail with 18 errors plus warnings, concentrated in Transparency.
- Dependency audit: 14 advisories, 7 high at audit time; Next.js 16.2.12 was reported as the patched upgrade from 16.2.3. This must be rechecked before action.
- CI workflows: none.
- Web component/interaction tests: none found.

### Performance and payloads

- Static output: approximately 227MB / 36,199 files.
- Lineage benchmark: current 1.68s; +institutions 2.26s; +movements 2.09s; stress 3.72s.
- Approximate gzip sizes: sculptor index 108KB; edges 39KB; institutions 375KB; migration 71KB; full sculptors 777KB.
- Explore mounts the full 3,544-row result set and does not preserve its consequential search/sort state in the URL.

## Strategic conclusions

### Preserve

- The catalogue-like visual identity and quiet, data-forward tone.
- Static deployment, pre-aggregation, additive data contracts, and D3/React pattern.
- Transparency as a first-class route rather than a disclaimer buried on About.
- Opt-in progressive complexity for expensive/dense graph layers.
- Stable QID-based entity routes and URL-backed analytical state.

### Change now

- Establish a single current project truth and automated quality gates.
- Treat comprehension, accessibility, mobile task completion, data validity, and performance as release criteria.
- Derive counts/freshness from metadata and put caveats beside claims.
- Measure reader behavior and interpretation before choosing the next major feature.

### Prefer after the gate

1. Institution pages and global search, because they make shipped data findable.
2. Coordinated links/URL state and a few curated analytical entry points, because they turn separate views into one explanatory system.
3. Versioned research downloads and scheduled refresh/diff reports, because they deepen trust and widen the audience.
4. Works/IIIF expansion and SAAM narratives, when coverage and rights support an interpretable story.

### Defer or require stronger evidence

- Movement nodes, animated lineage, career Sankey, and a map until a reader question, data fitness, accessible equivalent, and budget pass.
- Canvas/WebGL until a valuable, simplified view still exceeds the current renderer threshold.
- Style embeddings until works coverage, rights, bias analysis, interpretability, and a simpler baseline establish value.
