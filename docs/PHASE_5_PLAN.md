# Phase 5 — Densification + explorable interactives

> **Sequencing update (August 2026):** 5b.5 and Phase 5Q.1–5Q.3 are
> implemented in the current release candidate. Explore, Timeline, and
> Migration are the first three landed 5Q.4b route slices; the latest
> behavior-changing protected-main commit is Migration merge
> `21ab2f038aa62b23188cd8f373e36d5353a46128`. The bounded nanoid remediation
> landed through PR #30 without changing route behavior, and documentation-only
> PR #31 advanced protected `main` without changing route behavior.
> Documentation-only PR #32 then landed the dense-route scope review as
> `6b86d605a73d026cd23bf8d37b61fcf476ae1277`, with passing default-branch CI,
> exact-SHA production, route probes, and its branch retained.
>
> The exact-main Lineage/Migration review dated 2026-08-08 selects
> **Migration** as the next bounded route slice and leaves Lineage and Evolution
> unchanged. Migration has one 415-pair, approximately 71 KB-gzip projection
> and an existing disclosure/detail-link pattern; it can prove responsive and
> structured task equivalence, canonical selected-pair state, keyboard/focus
> behavior, and interaction budgets without coupling the work to a force-graph
> redesign. Lineage remains a later independent slice because its adjacency
> equivalent, typeahead/node keyboard model, canonical state, reduced motion,
> forced-colors path, and browser-side stable-layout budget must be designed
> together. The exact evidence and success/stop gates are in
> `docs/PHASE_5Q_DENSE_ROUTE_SCOPE_REVIEW_2026-08-08.md`.
>
> PR #33 landed the dedicated `codex/phase-5q4b-migration-slice` head
> `2a9352111fd814882cec87d8cd19f3b5870809d7` through guarded merge commit
> `21ab2f038aa62b23188cd8f373e36d5353a46128`. Exact-head Actions, Git-backed
> Preview QA, default-branch CI, exact-SHA `READY` production, route probes,
> both npm audit views, and the landing-window runtime error check passed. It
> keeps Lineage and Evolution unchanged.
>
> The bounded Evolution candidate is now implemented locally on
> `codex/phase-5q4b-evolution-slice` from freshly fetched protected
> `main@614951db2288a416fccb4511ac937c7951602053`. It keeps Lineage and every
> other route unchanged while adding the route-local `geo`/`decade` contract,
> one chart/semantic projection, a complete structured reflow task below the
> measured 1280px chart boundary, separate material object time, native
> controls, exact selected-decade rankings, deterministic links, and bounded
> accessibility/performance tests. The canonical local gate and all 52 serial
> Chromium journeys pass. Draft PR #35 is open to `main`; both exact
> implementation-head Actions runs pass and the exact-SHA Git-backed Preview is
> `READY` with route smoke and focused rendered QA complete. No ready
> transition, merge, production action, provider change, or landing evidence is
> claimed; those require separate authority before the slice can be called
> landed.
>
> Complete Phase 5Q in `docs/ROADMAP.md` before starting 5b.6, 5c, or 5d. The
> later phases in this document are researched hypotheses, not commitments;
> re-score them against `docs/PROJECT_CHARTER.md` using the product, data,
> accessibility, user-evidence, and performance gates in
> `docs/RESEARCH_FOUNDATIONS.md`. Isolated, time-boxed research prototypes may
> explore these ideas under `docs/EXPLORATION_STRATEGY.md`; they do not count as
> starting the production phase or create production dependencies.

> **Project recast (May 2026):** the goal stops being "ship to Fabio /
> first-deploy feedback" and becomes "better data, more interesting
> visualizations, and explorable interactives." Phases 0–4 produced a
> credible analytical explorer; Phase 5 takes it from "credible" to
> "actually shows you something you couldn't see anywhere else."

This document is a working plan. Numbers are measured (probe scripts
live in `pipeline/probe_*.py`). Every phase exits with a measurable
result and a **decision gate** that may rewrite the phases after it.
Update this doc when the gate flips, not at the end.

---

## Discovery: what we measured before planning

Before committing to a "densify the graph" thesis, we probed the live
Wikidata SPARQL endpoint against our existing 6,711 QID cache to
size each candidate property. Findings (`probe_densification.py`,
`probe_p69_hubs.py`, May 2026):

| Property | Coverage | Distinct values | Time-qualified | Verdict |
|---|---|---|---|---|
| **P69 educated_at** | **34.3%** (2,304 of 6,711) | 1,084 institutions | 18% have P580 | **Goldmine** |
| P937 work_location | 27.6% | ~600 places (mixed) | 30% have P580 | Workable, noisy |
| P361 part_of | 0.8% | trivial | — | Dead, skip |
| P39 position_held | 1.6% | trivial | — | Dead, skip |
| P108 employer | 11.8% | ~400 | low | Sanity bonus |

**P69 hub structure (full 6,711 cache):**

```
Top 8 institutions cover ~30% of all P69-carrying sculptors:
  274  ENSBA Paris             91  Munich Academy          79  Hungarian Academy
  57   Académie Julian         57  Vienna Academy          53  Düsseldorf
  52   Académie de France Rome 50  Eur. Ceramics Workctr   49  Brera Academy
58 institutions with ≥10 sculptors   →   real graph hubs
714 institutions with =1 sculptor    →   long tail to filter
```

**The densification thesis is real**: P69 alone adds **3,450 new edges**
on top of the current **1,418 lineage edges** — a 2.4× edge count
increase, and an honest one (ENSBA + Académie Julian + Black Mountain
trained the canon; person-to-person `student_of` edges miss most of it).

**What we don't know yet** (and what each phase will measure):
- Will d3-force survive ~7,700 nodes + ~4,800 edges? Current is ~4,300 + ~1,400.
- How noisy are institutional labels at the long tail? Need a sample.
- For sculptors *with* P69, how many also have time qualifiers we can use?
- Will `birth_decade` of educated sculptors cluster meaningfully by
  institution? (Needed for the time-animated lineage.)
- How does P937 ("work location") split between cities and studios? The
  Yaddo/Skowhegan/Roman Academy hits would be real value; Paris/NYC are
  redundant with citizenship.

---

## Cross-cutting concept: edge dating as a window with confidence

A naive "do we have a P580 qualifier?" framing fails for 82% of edges.
A better model came from project conversation in May 2026: every node
has a **temporal envelope**, and every edge between two nodes is
bounded by the intersection of their envelopes. We never claim to
know the exact date a relationship existed — we encode the range
within which it must have, and let the UI honestly distinguish
"definitely active" from "possibly active" intervals.

**Node envelopes** (one row per node, regardless of type):

| Node kind | `existed_from` | `existed_to` |
|---|---|---|
| Person | P569 birth | P570 death (null = living) |
| Institution | P571 inception | P576 dissolved (null = extant) |
| City | P571 inception (rarely the constraint) | null |
| Group / movement | P571 inception | P576 dissolved |

**Edge envelopes** between nodes A and B:

```
edge_min_start = max(A.existed_from, B.existed_from)         # earliest plausible
edge_max_end   = min(A.existed_to ?? now, B.existed_to ?? now)  # latest plausible
```

**Optional domain priors** narrow the envelope further on opinionated
edge types. Off by default; opt-in via a /transparency-disclosed toggle:

- **P69 educated_at**: training typically 16–30. Narrow to
  `[student.birth+16, student.birth+30]` ∩ institution envelope.
- **P1066 student_of**: same training-age prior on the younger party.
- **P937 work_location**: adulthood. Narrow to `[person.birth+18, ...]`.

**Wikidata qualifiers (P580/P582), when present**, replace the inferred
envelope and bring `confidence = "high"`. We sanity-check them against
the lifespan envelope; an explicit "trained 1850–1855" on a person born
1900 is dropped (with a logged audit note) rather than displayed.

**Per-edge schema** — applies to every relation in the densified
dataset (institutional, mentor, student_of, work_location):

```
edge_min_start: int          # never null; lifespan-derived if needed
edge_max_start: int          # = edge_min_end if must-overlap
edge_min_end:   int
edge_max_end:   int          # never null; uses 'now' for living/extant
date_source:    "qualifier" | "lifespan_intersect" | "lifespan_intersect+age_prior"
confidence:     "high" | "medium" | "low"
```

**What the UI does with this:**

- **Animated lineage (5c).** At scrubbed year Y, an edge is *definitely
  active* if `edge_max_start ≤ Y ≤ edge_min_end` (solid), *possibly
  active* if `edge_min_start ≤ Y ≤ edge_max_end` (translucent), hidden
  otherwise. Reader sees the confidence ratio shift as they scrub.
- **Career Sankey (5d).** Each sculptor's stops are sortable along
  their personal timeline; envelope conflicts (e.g. educated AFTER
  worked) become flags on a data-quality dashboard.
- **Static lineage (5b, today's view).** Envelopes are computed and
  stored but not exposed by default — they're the substrate, not the
  feature. Could power a "show only edges active in 1920" filter as a
  cheap follow-up.

**Cost.** One added SPARQL fetch in 5b: P571 + P576 for institutions
(the institution metadata query that's already needed for labels). One
new helper module `pipeline/temporal.py` with `compute_envelope()`
and `intersect_envelopes()`. Maybe 80 lines of code, a snapshot test
fixture, and a transparency-page surface for "edge confidence
distribution."

**Measured (5b.2 SHIPPED, May 2026).** `audit_temporal.py` applied
the helper to the full P69 + P937 ingest. Headline numbers:

```
P69 educated_at (no prior):
  qualifier (high)            656  18.9%   median width  4 yr
  lifespan_intersect (medium) 2646 76.2%   median width 73 yr
  empty_intersection           41   1.2%   ← Wikidata data bugs
  missing_institution_env     131   3.8%

P69 educated_at (WITH age prior 16-30):
  qualifier (high)            548  15.8%   median width  4 yr
  lifespan_intersect           77   2.2%   late-career returnees
  +age_prior (low)           2677  77.1%   median width 14 yr  ← 5× narrowing
  empty_intersection           41   1.2%   (unchanged from no-prior)

P937 work_location:
  qualifier                   665  16.0%   median width 10 yr
  lifespan_intersect         2243  54.0%   median width 75 yr
  missing_institution_env   1230  29.6%   ← cities don't have P571
```

Three findings worth carrying forward:

1. **The age prior delivers a 5× narrowing** on the bulk of P69 edges
   (median width 73 → 14 years). Without the prior, animated lineage
   would be dominated by edges "possibly active for ~70 years" —
   visually close to "always on." With it, the median edge is active
   in a 14-year window, which is meaningfully scrubbable.

2. **41 P69 + 15 P937 edges have empty lifespan intersection** —
   real Wikidata data bugs (sculptor lifespan doesn't overlap with
   institution inception/dissolution). These are surfaced as a
   transparency-page diagnostic, not silently dropped.

3. **P937 has 30% missing institution metadata** because P937 values
   are mostly cities, and cities rarely carry P571 inception in
   Wikidata. For 5b.3 export, P937 edges without metadata fall back
   to a "city has always existed" assumption (`existed_from = -∞`,
   handled by treating the city's window as unbounded above the
   sculptor's birth). The lifespan intersection then reduces to the
   sculptor's lifespan alone, which is honest.

The helper landed with 13 tests covering: lifespan intersection,
qualifier precedence, qualifier sanity-check with ±2yr slack,
qualifier clamping, age prior narrowing, age prior fallback when it
empties node_a alone or the joint intersection, and empty lifespan
intersections returning None.

---

## Cross-cutting concept: node / edge / trait ontology

Project conversation in May 2026 surfaced a more fundamental design
question than "which Wikidata properties to ingest": **what should be
a node, what should be an edge, and what should stay a trait?** A
working framework, applied to our data:

| Concept becomes a... | When |
|---|---|
| **Trait** | Single value belonging to exactly one entity, no independent identity. |
| **Edge** | Binary relation between two entities, no attributes of its own beyond endpoints + envelope. |
| **Node** | Has its own lifespan + attributes, participates in many relations, or naturally connects >2 things. |
| **Reified edge (= node)** | The relation itself needs attributes — date, location, witnesses — and may connect more than two parties (exhibitions, residencies). |

Our current model and where it's underutilized:

| Concept | Today | Should be | Phase |
|---|---|---|---|
| People | Node ✓ | Node | — |
| Institutions | Trait (nothing) | Node | **5b** |
| Movements | Trait on people (`movement: "Surrealism"`) | **Node** (founding date, manifesto, peer movements) | **5b.6** |
| Cities | Trait via `citizenship` / `birth_country` | Node when surfacing P937 detail | **5d** (city-aware Sankey) |
| Works (sculptures) | Outside the graph entirely | Reified node connecting (artist, year, material, location) | **5g** |
| Exhibitions | Not modelled | Reified node connecting (artist, ..., venue, year) — N-ary | parked, stretch |
| Time / decades | Trait + UI axis | **Stay a trait + UI axis**, not a graph node | — |
| Countries | Trait + chart axis | Stay a trait for now; promote to node only if migration-by-city demands it | parked |
| Materials | Trait of works (when present) | Stay a trait (derived `materials_by_decade.json` is enough) | — |

**Why time stays out of the graph as a node.** It would create a hub
connected to every entity that has a lifespan — thousands of edges, zero
new structure. Time as (a) a trait on every node (`existed_from/to`),
(b) an envelope on every edge, and (c) an axis in the UI is sufficient
for every temporal-querying use case we have. Reification of time only
earns its keep when an *event* (exhibition, residency) connects more
than two parties — and that's a separate, future addition.

**Why movements move from trait to node now.** Movements already have
the trappings of nodes: a founding date (P571 on the movement entity),
a manifesto author, a Country-of-origin distribution, peer movements
(chronologically adjacent — we already compute these for
`/movement/[slug]`). Elevating them adds two new edge types — "member
of movement" (person→movement) and "movement transition" (movement→
movement, e.g. Cubism→Surrealism via shared members) — which surface
interpretive payload that today is hidden in tooltips. Cost is low:
the SPARQL we already run hands back the movement QID alongside the
label.

**Why cities are a 5d concern, not 5b.** P937 (work_location) at city
granularity is exactly what makes the career-trajectory Sankey richer
than the existing country-level migration view. But cities-as-nodes
without P937 ingest is empty; we wait for the ingest, then promote.

**Why works wait for 5g.** Without IIIF images, works are just labels
in a table — node-like in structure but unrewarding to render. Once 5g
lands real artwork imagery, works become first-class graph entities and
the embedding viz (5h) operates on them.

## Cross-cutting concept: view modes and dimension reduction

Adding institutions (5b), movements (5b.6), cities (5d), and works (5g)
takes us from 2 node kinds today to 5 by end of Phase 5. Each kind
adds a shape to the legend and a visual-channel constraint (we already
use colour for movement). There's a real "too many shapes" ceiling —
probably 5–6 before it stops reading.

**Near-term solution: view modes.** Once we exceed 3 node kinds on
`/lineage`, expose a node-kind selector ("show only sculptors", "+ institutions", "+ movements", "full multipartite"). The graph stays
heterogeneous underneath; the reader picks the lens. URL-backed
(`?nodes=sculptor,institution`) so views are shareable. Implement in
5b once we have the third node kind to motivate it.

**Future direction: embedding the heterogeneous graph itself.**
Rather than rendering all node kinds with different shapes,
dimensionality-reduction on the graph's adjacency structure
(node2vec, GraphSAGE, or a metapath2vec-style approach for typed
graphs) projects every node — sculptor, institution, movement, work
— into the same low-dimensional space. Visual encoding becomes
*position* (cluster proximity) rather than *shape* (node kind), which
scales past the shape-vocabulary ceiling and surfaces structural
similarity that a force-directed layout doesn't.

We'll research and scope this together when 5g lands (so the
embedding viz of works, 5h, can share an algorithm and pipeline with
the heterogeneous-graph embedding). Two paths converge: 5h embeds
visual style (CLIP on images), this embeds graph structure
(node2vec-ish on the multipartite network). Whether to ship one,
both, or a fusion is a real research-mode question for a future
session.

Cost-of-keeping-this-in-mind today: zero. The view-modes pattern is
forward-compatible with an embedding viz — same data, different
projection.

---

## Phase 5a — Discovery and sizing (DONE, May 2026)

- [x] Audit existing cache (`raw/*.parquet`) for densification properties → none present
- [x] `probe_densification.py` against 500-QID sample for P69/P937/P361/P39/P108
- [x] `probe_p69_hubs.py` against full cache for hub distribution + labels
- [x] This document drafted with measured numbers

**Exit gate:** ✅ thesis confirmed. Proceed to 5b.

---

## Phase 5b — Densify the lineage graph with institutions

**Goal.** A reader who opens `/lineage` sees Académie Julian, ENSBA,
Bauhaus, ASL, and Black Mountain as visually distinct **hub nodes**
they can click to filter the network down to "everyone trained at
ENSBA". The existing person-mentor diamond pattern stays.

**Inputs (5b.1 SHIPPED, May 2026).** `pipeline/query_institutions.py`
ran against live Wikidata; cached in `data/raw/`:

```
P69 educated_at:    3,474 statements · 2,305 sculptors · 1,084 institutions
P937 work_location: 4,153 statements · 2,027 sculptors · 813 locations
Combined distinct:  1,892 institutions/places
```

Temporal qualifier coverage (drives the envelope's confidence axis):
P69 19.9%, P937 22.4% — so ~80% of edges rely on the lifespan-envelope
substrate. Institution metadata coverage: label 99.2%, inception
(P571) 70.5%, dissolved (P576) 6.1% (most institutions still
operating, which is correct).

At the ≥3-sculptor render threshold: 226 P69 institutions + 175 P937
locations ≈ ~400 graph nodes (vs the 370 estimate). Top P69 hubs by
sculptor count: ENSBA 276, Munich 91, Hungarian University 79,
Académie Julian / Vienna Academy 57 each, Düsseldorf 53, French
Academy in Rome 52, Brera 49, Rijksakademie 35. Strong Parisian,
Germanic, Italian, Dutch clusters confirmed before we render.

`validate_institutions.py` is the harness that produced these numbers
and stays as the regression check after schema or ingest changes.

Sidecar provenance JSON written next to each parquet: source URL,
fetched_at timestamp, query SHA, row count, input QID count. The
/transparency page will surface "data fetched on YYYY-MM-DD" from
these sidecars.

**Shipped in 5b.2–5b.3.**
- `pipeline/temporal.py` exposes `compute_envelope(...)` and is tested
  against the edge dating cases described above.
- `pipeline/export_json.py` emits additive `institutions[]` and
  `institutionalEdges[]` fields on each `LegacySculptor` record.
- `web/public/data/institutions.json` exports the graph-ready
  institution/place bundle: qid, label, inception/dissolved years,
  sculptor_count, relation counts, decade range, per-institution
  roster, per-institution edges, and an index sorted by sculptor count.
- `web/src/lib/types.ts` and `web/src/lib/data.ts` define
  `InstitutionsData`, `InstitutionRecord`, `InstitutionalEdge`, and
  `loadInstitutions()`.

5b.3 export results (included sculptor roster only): 1,662 total
institution/place nodes, 334 renderable at the ≥3-sculptor threshold,
5,925 exported institutional/work-location edges, 54 skipped empty
lifespan intersections. Edge confidence split: 1,004 high
qualifier-backed, 63 medium lifespan-only, 4,858 low age-prior-backed.

**Shipped in 5b.4.**
- `/lineage` loads `institutions.json` and exposes a URL-backed
  `?nodes=sculptor,institution` selector. The default route keeps
  institutions off for first-paint performance.
- `LineageGraph` renders institution hubs as square nodes, merges P69/P937
  edges into the graph only when the institutional layer is active, and
  preserves existing sculptor-circle / external-mentor-diamond encodings.
- Heavy institutional view uses tuned force settings: institutional links
  are looser and the many-body force switches to strength -80 / theta 1.5.
- Headless benchmark with 5b.4 tuning: current graph 1.66s settled,
  +institutions 2.00s settled, +movements projection 2.15s settled, stress
  3.48s settled. This keeps institutions in the yellow opt-in band.

**Shipped in 5b.5.**
- Existing P1066/P737 person-person edges now carry the same envelope
  schema, or explicit null fields and a documented unavailable reason.
- `/transparency` reports institution coverage, date confidence,
  skipped empty intersections, and educational concentration.
- Regression checks verify both edge families and reconcile public
  transparency figures with export metadata.

**Architecture.**
- One new ingest module, mirrors `query_enrichment.py` pattern.
- One new export function, mirrors `create_external_mentors_json`.
- LineageGraph gets a third node kind (`"institution"`) — square. Existing
  sculptor / mentor branches stay untouched.
- **Display threshold: institutions with ≥3 sculptors render as nodes.**
  Below that, the institution still appears on a sculptor's detail page
  as a chip but doesn't pollute the graph. This is the same logic as
  `MOVEMENT_MIN_SCULPTORS=2`.
- **Node-kind view modes.** With 3 node kinds, the legend starts to
  earn its keep but the graph also gets crowded. Add a URL-backed
  `?nodes=sculptor,institution` selector (institutions off by default).
  5b.6 will reuse this when movements are added; 5d may add `,city`.

**Risks and unknowns.**
- **Perf budget — measured and re-run after 5b.4 tuning.**
  `web/perf/lineage-bench.mjs` runs the same force configuration the
  page uses, against synthetic preferential-attachment graphs at each
  Phase-5 size point (median of 3 runs after a warm-up). June 2026
  review numbers:
  ```
  scenario                  settled (α<0.02)   full converge   verdict
  now (4.3k / 1.4k)         1.66s              2.88s           yellow
  +institutions (7.7k/4.8k) 2.00s              3.50s           yellow
  +movements (7.85k/5.4k)   2.15s              3.75s           yellow
  stress (12k / 8k)         3.48s              6.14s           RED
  ```
  Force-cost review at 5b size still shows both collide and charge as
  material costs; the tuned all-forces heavy view settles under the
  2.5s gate, so Canvas/WebGL remains parked.
- **Decision: ship view-mode toggle with institutions OFF by default.**
  The default `/lineage` keeps today's 1.57s settled time. The
  densified view is one click away (`?nodes=sculptor,institution`),
  deep-linkable from `/transparency` and per-institution pages.
  Readers who want the rich view opt in; first-paint perf is preserved.
- **Charge tuning — shipped mitigation.** The heavy view uses
  Barnes-Hut `theta=1.5`, charge strength -80, institutional link
  distance 72, and institutional link strength 0.35. The layout stays
  legible while keeping the institutional view in the yellow opt-in band.
- **Canvas/WebGL is parked, not promoted.** It addresses SVG render
  cost, which isn't the bottleneck at this size. Re-evaluate only if
  a future phase pushes us past 15k nodes.
- **Long-tail label noise.** P69 distinct count is 1,084 but most are
  single-sculptor. Solved at ingest by filtering ≥3 for graph rendering;
  detail-page chips can show all without clutter.
- **Disambiguation between "educated at" and "student of".** A sculptor
  who studied at ENSBA *and* names a teacher there has both an
  institutional edge and a personal one. We render both — they're
  different relationships.

**Tests / harness.**
- `pipeline/test_institutions.py` — stdlib-only exported JSON regression:
  - Edge count regression: ≥2,500 institutional edges in clean export
  - Known-hub presence: ENSBA, Munich, Vienna, Académie Julian,
    Düsseldorf must all render and clear minimum sculptor counts
  - Schema regression: per-institution `edges[]` and `sculptors[]` are
    always lists
- `web/perf/lineage-bench.mjs` — the headless d3-force benchmark that
  produced the numbers above. Re-run after graph-force changes to confirm
  settled time on the heavy view stays below 2.5s.
- (Optional, post-5b.4) Playwright script that opens `/lineage` and
  reports browser-side time-to-stable-layout including SVG rendering.
  Browser numbers may diverge from the headless ones (rAF batching,
  V8 vs Node V8); we'll add the Playwright harness only if the
  divergence looks worth measuring.
- `pipeline/audit.py` — extend with institutional-coverage section so
  Transparency page can surface "X% of sculptors have an educational
  institution recorded".

**Diagnostics surfaced on /transparency.**
- Coverage bar for `institutions[]` alongside the existing fields.
- New section: "Educational concentration" with a Lorenz curve showing
  what % of sculptors trained at the top N institutions. This is itself
  the start of an "explorable" — drag a slider, see how many academies
  you need to cover 80% of the canon.

**Exit gate.**
- Hard: default `/lineage` (institutions toggle off) settled time
  unchanged from today (≤1.7s in the headless bench).
- Hard: heavy view (institutions toggle on) settled time ≤2.5s after
  charge tuning. If it stays above 2.5s, ship with the toggle but
  surface a "computing…" hint on first paint of the heavy view.
- Hard: top-5 hubs visible by eye in the heavy view; tests pass.
- Soft: the densified graph "tells a different story" — at minimum,
  ENSBA-Académie Julian-École de Paris should form a visible Parisian
  cluster, Bauhaus/Munich/Vienna a Germanic cluster.
- **Decision after gate:** if soft criterion fails (the cluster
  structure is muddy or hubs are dwarfed by long-tail noise), reconsider
  the rendering threshold and possibly defer to a movement-tag
  approach instead of rendering institutions as nodes.

**Also landing across 5b: the temporal envelope substrate.** Even
though 5b's visible feature is institutional nodes (not animated
lineage), the institutional ingest already computes envelopes for
P69/P937 edges. Phase 5b.5 completed that substrate by backfilling
existing P1066/P737 person-person edges, so 5c can be purely a UI phase
and /lineage can gain a quiet "show only edges active in YEAR" filter as
a cheap follow-up if we want one before the full scrubber.

**Estimate.** 3 sessions. SPARQL + ingest (institutions + temporal
quals + institution metadata) is 1 session; `pipeline/temporal.py` +
tests + envelope backfill on existing edges is 1 session; graph
component changes, threshold tuning, perf benchmark, and transparency
surface is 1 session. The third session can split into a separate
sitting if perf needs an opt-in toggle.

---

## Phase 5b.5 — Person-person temporal backfill and transparency

**Status: completed 2026-08-02.** The committed snapshot dates 1,372
of 1,423 P1066/P737 edges; the remaining 51 stay exported with null
envelopes and explicit reasons. Institution links cover 2,393 of 3,543
published sculptors, and `/transparency` exposes confidence splits,
54 skipped empty institution intersections, and a top-five education
concentration share of 15.8%. Regression checks compare both edge
families and verify the public audit against export metadata.

**Goal.** Existing P1066/P737 lineage edges carry the same temporal
envelope fields as institutional P69/P937 edges, and /transparency can
explain coverage, confidence, and skipped intersections without needing
Codex to rediscover the substrate.

**Inputs.**
- Existing `edges.json` / relation export for P1066/P737 person-person
  lineage.
- `pipeline/temporal.py` and the institutional edge envelope schema.
- Institutional export metadata: confidence split, skipped empty
  intersections, and rendered institution counts.

**Work.**
- Backfill `minStart`, `maxStart`, `minEnd`, `maxEnd`, `dateSource`, and
  `confidence` onto existing person-person lineage edges.
- Add regression coverage so P1066/P737 edges and P69/P937 institutional
  edges share the same envelope contract.
- Extend transparency data/page surfaces for institution coverage, edge
  confidence, skipped empty intersections, and educational concentration.

**Exit gate.**
- Hard: existing `/lineage` behavior and 5b.4 institution rendering stay
  unchanged except for additive envelope fields.
- Hard: exported person-person edges all have envelope fields or an
  explicit documented null/skipped reason.
- Hard: transparency surfaces match export metadata and explain
  confidence levels plainly.

---

## Phase 5b.6 — Movements as nodes

**Goal.** Today every sculptor has a `movement` trait. After 5b.6,
movements are first-class nodes on `/lineage` (and joinable in the
graph data substrate generally). A reader can click "Surrealism" and
see the sculptor cluster + the institutions that hosted the movement +
the peer movements one transition away (Dada, Abstract Expressionism).

**Inputs.**
- We already ingest `?movement` per sculptor via `wdt:P135`. Keep the
  movement QID alongside the label in that query (it's currently
  label-only) so we have a stable joinable identifier.
- New small SPARQL: movement metadata — P571 (inception), P576
  (dissolved), P112 (founder), P276 (location of origin), P361 (part
  of, for nested movements like "Russian avant-garde"). Modest fetch;
  there are ~150 distinct movements across the dataset.
- Reuses the temporal-envelope helper from 5b for movement edges.

**Architecture.**
- New JSON: `movements.json` (one row per movement: qid, label, slug,
  inception, dissolved, sculptor_count, peer_movements[], origin_city,
  origin_country). Most of this content already exists in the
  derived per-movement page data; this consolidates it.
- LineageGraph gains a fourth node kind (`"movement"`) — hexagon, to
  read as "polygonal / not a person" alongside the institution square.
- Two new edge types:
  - **`member_of_movement`** (sculptor → movement). Envelope =
    sculptor's lifespan ∩ movement's lifespan; confidence "medium"
    unless we find dated qualifiers.
  - **`movement_transition`** (movement → movement). Derived from
    shared-membership: if N sculptors are members of both M1 and M2,
    and M1's median membership-year precedes M2's, render a directed
    edge. Threshold and N tuned during build.
- Per-movement pages (`/movement/[slug]`) gain a small inline
  micro-graph showing the focal movement + its immediate peers — the
  Sankey-of-styles in miniature.

**Risks.**
- **Movement-as-node may be redundant with movement-as-colour.**
  Today every sculptor circle is *coloured* by movement; adding a
  movement hexagon doubles the encoding. Mitigation: when the
  movements view mode is on, suppress per-sculptor movement
  colouring — the hexagon centroid carries that information now and
  the colour channel is free for something else (gender, decade,
  cross-border count). Reader chooses which channel to use.
- **Transition edges can mislead.** "Cubism → Surrealism" derived
  from shared members suggests stylistic succession that the data
  doesn't actually claim. Mitigation: require N ≥ 5 shared members
  before drawing a transition; label the edge "shared members", not
  "led to"; document the derivation on /transparency.
- **Movement granularity is uneven.** Wikidata has "Bauhaus" but
  also "Bauhaus (Weimar)" sub-entities. Mitigation: canonicalize to
  the parent during ingest, with a tested mapping table similar to
  `country_aliases.json`.

**Tests.**
- `pipeline/test_movements.py`: every sculptor with a `movement`
  label has a resolvable `movement_qid`; movement counts match across
  `sculptors.json` and `movements.json`; transition-edge derivation is
  deterministic and produces the expected edges on a 3-movement
  fixture.
- Visual snapshot: known cluster (Surrealism, Dada, Bauhaus, ASL) is
  visible at default zoom with view-mode=movements-on.

**Diagnostics on /transparency.**
- New section: "Movements as nodes" — count of movements rendered,
  count suppressed below threshold, top transitions with shared-member
  counts, and a frank note on the derivation method.

**Exit gate.**
- Hard: 5b tests still pass, perf still under 4s with movements on.
- Soft: a reader can find "the Bauhaus cluster" or "the Surrealist
  cluster" without filtering — the spatial cluster + the movement
  hexagon make it visually unmistakable.
- **Decision after gate:** if shared-member transition edges read as
  noise rather than signal, drop the transition edge type and keep
  movements as standalone hubs. Per-movement pages already show peer
  movements; the graph doesn't have to.

**Estimate.** 1–2 sessions. The data is mostly already in hand; the
work is the new node kind, the transition-edge derivation, and the
view-mode integration. If transition edges turn out to be the hard
part we can ship membership-only first and return to transitions in a
follow-up sitting.

---

## Phase 5c — Time-coded edges and animated lineage

**Goal.** A "Play through the decades" control on `/lineage` that
animates the network growing as sculptors finish their training and
new institutional edges activate. Reader can scrub a decade slider
and watch the canon assemble.

**Inputs.** Edge envelopes already computed in 5b via the cross-cutting
dating model — `edge_min_start`, `edge_max_start`, `edge_min_end`,
`edge_max_end`, `date_source`, `confidence`. No new ingest needed for
5c; this phase is purely the UI layer that exposes the temporal
structure. The 18%-qualifier-coverage figure stops being a blocker:
every edge has a (possibly wide) envelope from lifespan intersection.

**Architecture.**
- `LineageGraph` consumes the envelope fields already in the edge
  schema and adds an `activeYear: number` prop. At year Y, edges where
  `edge_max_start ≤ Y ≤ edge_min_end` render solid (definitely active);
  edges where `edge_min_start ≤ Y ≤ edge_max_end` render translucent
  (possibly active); the rest are hidden. Same applies to nodes: a
  sculptor whose lifespan doesn't include Y is hidden.
- New transport control component: `<DecadeScrubber />` — draggable,
  URL-backed (`?year=1920`), optionally auto-plays through the data's
  active range (1820–2020). Per the existing URL-state rule, the
  scrubber position is shareable.
- Visible legend strip explains the solid/translucent encoding so
  readers know what they're seeing.

**Risks.**
- **Wide envelopes blunt the animation.** A sculptor who lived
  1850–1940 trained at ENSBA (founded 1648) gets a 90-year envelope
  without a qualifier — the edge would be "possibly active" for nearly
  a century. Mitigation: opt-in training-age prior (defined in the
  cross-cutting model) shrinks this to ~14 years on educated_at edges.
  Disclose the prior on /transparency.
- **Confidence-ratio reading.** If a decade is dominated by translucent
  edges, readers might read it as "nothing happened" when it actually
  means "we don't know exactly when." Mitigation: show a small inline
  ratio ("68% definitely active, 32% possibly active") next to the
  scrubber so the rendering is legible.
- **Sparsity at low decades.** Pre-1850 the data is thinner; the
  network might look empty at 1820 and snap into existence around 1880.
  That's fine — it reflects the data — but copy needs to acknowledge it.

**Tests.**
- `pipeline/test_temporal.py`: pure-function tests on `compute_envelope`
  and `intersect_envelopes`. Cover qualifier-vs-lifespan precedence,
  null `existed_to` (extant institution / living person), empty
  intersections (Wikidata data bug), and the optional age prior.
- Audit script: count edges where the qualifier conflicts with the
  lifespan envelope and assert the conflict-rate is below a sanity
  threshold (say 1%) — surfaced on /transparency.
- Snapshot: 1880, 1900, 1920, 1940 frames record (#solid, #translucent,
  #hidden) edges/nodes — guards regressions in the temporal filter.

**Exit gate.**
- The 1900→1940 animation visibly shows the German-academy → US
  emigration shift (Bauhaus alums entering ASL / Black Mountain).
- The confidence-ratio readout reads above 50% "definitely active"
  in any given decade after applying the age prior — otherwise the
  animation is dominated by translucent edges and isn't earning its
  keep.
- If either soft criterion fails, fall back to small-multiples (one
  frame per decade, no animation), which still uses the envelope
  data but is lower-risk to read.

**Estimate.** 1–2 sessions if 5b lands cleanly.

---

## Phase 5d — Career-trajectory Sankey

**Goal.** Generalize `/migration` from a 2-node corridor (born → died)
to 4 nodes: **born → educated → worked → died**. Same Sankey idiom,
much richer story. Naturally answers "who trained in Paris and
emigrated to the US" without having to read between charts.

**Inputs.** Drops out of 5b + P937 ingest. Uses
`birth_country`, `educated_at[].country`, `work_location[].country`,
`death_country`. Aggregates to country-level for the chart top view;
drill-down expands a band to **city-level nodes** (Paris, NYC, Berlin,
Rome), promoting cities from trait to node per the ontology
framework. P937 keeps QIDs at ingest specifically so this drilldown is
cheap when we get here.

**Risks.**
- **Sparsity at the middle bands.** Only 34% educated, 28% work-located.
  Most sculptors will have at least one missing band, breaking the chart.
  Mitigation: each band gets an explicit "Unknown" stop, visually
  greyed; the chart honestly reads the data sparsity.
- **Crowding at 4 columns.** /migration already shows 30+ countries.
  At 4 columns, label collisions are likely. Mitigation: top-N per
  band + "Other".

**Tests.** Reuse `/migration` test pattern (flow totals, decade slicer,
filter URL state).

**Exit gate.** The "Bauhaus émigrés" story is visible at a glance
without filtering: Germany (born) → Germany (educated) → US (worked) →
US (died). If that thread isn't visible, the chart isn't earning its
keep — fall back to two paired Sankeys (born→educated and
worked→died) instead.

**Estimate.** 2 sessions.

---

## Phase 5e — Coordinated multi-view (the explorable-interactive
core)

**Goal.** Adopt the Distill / Bret Victor pattern: **brush a decade on
the Timeline page, see that decade highlighted in Lineage, Migration,
Geography, and Movements simultaneously.** Same data, multiple cuts,
state coordinated.

**Architecture.**
- Migrate top-level filter state from per-page URL params to a small
  Zustand (or even a single React context) store keyed in the URL.
- All charts subscribe to the same `selection: { decade?, movement?,
  country?, qid? }` shape.
- Brush events publish to the store; every chart applies the selection
  as a visual emphasis (highlight, not filter, so context is preserved).

**Risks.**
- **State plumbing creep.** This is exactly the "expensive plumbing"
  reason it was parked. Mitigation: scope the first version to one
  selection axis only (decade) and one cross-page link (Timeline →
  Migration). Ship that, learn, expand.
- **Cross-page context.** A brush on Timeline → highlight on Migration
  requires both pages mounted. Either: (a) ship as a single super-page
  combining all charts, or (b) preserve selection in the URL and
  re-apply on cross-link navigation. Option (b) is simpler and matches
  the "explorable" idiom of "share a URL, share the view."

**Tests.**
- Playwright: brush decade 1920 on Timeline → navigate to Migration →
  verify ?decade=1920 in URL and the corresponding decade is
  highlighted. Repeat for movement brush.

**Exit gate.** A reader can produce and share a URL that captures a
multi-axis selection (e.g. `?decade=1920&movement=Bauhaus`) and every
chart respects it. If the plumbing makes the rest of the codebase
harder to change, reconsider — the URL pattern alone (no shared store)
might be enough.

**Estimate.** 2–3 sessions; first slice (decade brush from Timeline →
Migration) is 1 session.

---

## Phase 5f — Choropleth map

**Goal.** A decade-animated map of sculptor distribution. Pure UI lift
on existing data. Different cognitive read than the stacked-area chart
(Where on Earth is the canon? Not just Which countries dominate?).

**Inputs.** Existing `geography_by_decade.json`. New: world TopoJSON
(Natural Earth, public domain) at country resolution.

**Architecture.** D3 + topojson-client; `<ChoroplethMap />` component
on `/evolution`, toggle between stacked-area and map view. Decade
slider drives both.

**Risks.**
- **Map asset weight.** Natural Earth countries TopoJSON is ~150 KB
  gzipped. Acceptable.
- **Country-name join.** Our citizenships are display names
  ("Netherlands"); TopoJSON joins on ISO-A3 codes. New crosswalk file
  needed; reuse `country_aliases.json` patterns.
- **Choropleth misleading scale.** Linear scale would let Italy and
  France swallow everything. Use quantile or log scale; document choice.

**Exit gate.** Map renders for every decade 1820–2020 without empty
frames; ISO-A3 join covers ≥95% of countries in our data; toggle is
URL-backed.

**Estimate.** 1–2 sessions.

---

## Phase 5g — IIIF sculpture images

**Goal.** Detail pages of sculptors with works in Met or AIC show
actual sculptures, not just portraits. Met serves IIIF; AIC serves
IIIF. Public-domain only.

**Inputs.** Existing `met_objects` (17 rows) and `aic_objects` (124
rows) caches are tiny — they covered only the focus list. New ingest
needs to widen the search to the full 3,543 published sculptors,
joined by name + birth year for fuzzy match (ULAN-ID join is cleaner
where ULAN is present).

**Risks.**
- **Name-match precision.** Met's `/search?q=Auguste+Rodin` returns
  Rodin objects but also Rodin-attributed reproductions. Need to filter
  by `artistDisplayName` exact match + birth-year cross-check.
- **Coverage will be uneven.** Maybe 200 sculptors total get an image.
  That's fine, but the UI must degrade gracefully when zero works.
- **Image hotlinking ethics.** Met's Open Access policy permits direct
  IIIF use. AIC same. Re-confirm at ingest and store the credit line.

**Tests.** Snapshot a known-good ingest (Rodin should yield ≥3 Met
objects). Spot-check 10 random sculptors that have works → verify
name match against Wikidata canonical name.

**Exit gate.** ≥150 sculptors in the published set get at least one
public-domain work surfaced. (We have 124 from AIC alone today, scoped
to focus — widening alone should clear this.)

**Estimate.** 2 sessions, mostly ingest plus the gallery component.

---

## Phase 5h — Embedding viz (UMAP/t-SNE of style space)

**Goal.** A "Sculpture Space" view: a 2D scatter where each point is a
work, positioned by stylistic similarity, coloured by sculptor or
movement. Click a point → that work + similar works.

**Inputs.** Requires 5g done first (need stable image URLs at scale).
Then a one-off Python notebook: CLIP embeddings on each image, UMAP
to 2D, dump JSON `{work_id, x, y, sculptor_qid, movement}`.

**Risks.**
- **Embedding quality on sculpture is unproven.** CLIP was trained on
  general images; whether it captures sculpture-specific style (vs.
  caption surface features) is open. Honest possibility this view is
  noisy and we ship it anyway with disclosure.
- **Compute is real but small.** ~500–2,000 images × CLIP forward pass
  on a CPU takes ~10 minutes. Not a bottleneck.
- **Static vs interactive.** A truly explorable embedding wants
  hover preview + zoom + lasso select. That's a lot of UI.

**Tests.** Sanity check: known-similar pairs (Rodin's *The Thinker*
should be close to other late-19th-century bronzes) come out near
each other in 2D.

**Exit gate.** A reader can visually identify ≥3 stylistic clusters
(modernist abstraction, classical figure, Brutalist mass) without
reading labels. If they can't, the embedding viz isn't earning its
keep — ship the gallery viewer alone (5g) and keep this parked.

**Estimate.** 2–3 sessions experimental. Tag this one as research,
not feature delivery.

---

## How we'll update this plan

- **Each phase exits with an explicit decision.** Re-read the exit
  gate. If soft criteria failed, the phase below it changes shape.
  Update this doc; don't carry stale assumptions forward.
- **New homework arrives mid-phase.** If 5b reveals that institutional
  labels are unusable at scale (e.g. half are foreign-language without
  English aliases), 5d shrinks too — note that in 5b's exit and rewrite
  5c/d before starting them.
- **A phase taking >2× its estimate is a flag.** Stop, write down what
  you didn't anticipate, and decide whether to scope down or pivot.
- **5Q is a hard ordering constraint.** After 5b.5, do not use an
  independent dependency graph as a reason to skip the product-quality
  gate. Once 5Q passes, later phases can be interleaved only when their
  own evidence and exit gates pass.

## Cross-cutting commitments

- Every ingest writes a `data/processed/*_provenance.json` sidecar:
  source URL, query date, row count, and any transformation rules.
  This is the lineage record for every chart.
- Every new chart gets a `transparency.json` field documenting its
  data source + denominator. The /transparency page is the discipline
  receipt.
- Every new schema field is **additive** — `LegacySculptor` keeps every
  Phase 0–4 field, new fields are optional, and old JSON consumers
  continue to work. If a breaking contract becomes necessary, version
  it explicitly and migrate producer, consumers, tests, and docs in one
  bounded change.
- Tests live next to the pipeline modules they cover and are runnable
  via `pytest pipeline/`. The bar is "guards against regression," not
  "100% coverage" — small, surgical, written before merge.
- Every novel visualization records its reader question, data/task
  abstraction, encoding rationale, uncertainty, accessible equivalent,
  budget, success signal, and stop/simplify condition before build.
- Every consequential state is URL-reproducible. Every novel chart
  pattern has a keyboard-operable path, accessible name and summary,
  non-color encoding, and reduced-motion behavior before it ships.
