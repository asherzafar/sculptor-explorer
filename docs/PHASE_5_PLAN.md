# Phase 5 — Densification + explorable interactives

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

**Inputs.**
- New SPARQL: `query_institutions.py` for P69 (with P580/P582 quals)
  + P937 (with same quals), batched like existing enrichment
- New columns in `sculptor_nodes_enriched`: `institutions[]` (list of
  institution QIDs) and `institutional_edges[]` (per-edge w/ start/end)
- New JSON: `institutions.json` (one row per institution: qid, label,
  sculptor_count, decade_range)
- Schema additions to `LegacySculptor`: optional, append-only.

**Architecture.**
- One new ingest module, mirrors `query_enrichment.py` pattern.
- One new export function, mirrors `create_external_mentors_json`.
- LineageGraph gets a third node kind (`"institution"`) — square. Existing
  sculptor / mentor branches stay untouched.
- **Display threshold: institutions with ≥3 sculptors render as nodes.**
  Below that, the institution still appears on a sculptor's detail page
  as a chip but doesn't pollute the graph. This is the same logic as
  `MOVEMENT_MIN_SCULPTORS=2`.

**Risks and unknowns.**
- **Perf budget.** Adding ~370 institutional nodes + ~3,000 edges on top
  of current 4,300 nodes / 1,400 edges. d3-force documented to handle
  10k nodes / 30k edges on modern hardware, but our current page
  already takes 1.5–2.5s to settle. Risk: **Lineage initial layout
  becomes >5s and motion-safe animations stall.**
- **Mitigation A:** measure first — write a 5b.0 perf benchmark cell
  that runs the simulation headless against synthetic data of varying
  sizes before changing the page.
- **Mitigation B:** if perf is borderline, ship an "Institutions" toggle
  (off by default) so the densified view is opt-in. Better to surface
  the data behind a click than to crash the page.
- **Mitigation C (last resort):** Canvas/WebGL fallback. Adds 2–3 days
  of work. Only invoke if A and B both fail.
- **Long-tail label noise.** P69 distinct count is 1,084 but most are
  single-sculptor. Solved at ingest by filtering ≥3 for graph rendering;
  detail-page chips can show all without clutter.
- **Disambiguation between "educated at" and "student of".** A sculptor
  who studied at ENSBA *and* names a teacher there has both an
  institutional edge and a personal one. We render both — they're
  different relationships.

**Tests / harness.**
- `pipeline/test_institutions.py` — new module:
  - Edge count regression: ≥2,500 institutional edges in clean export
  - Top-5 hub presence: ENSBA, Munich, Vienna, Académie Julian, Düsseldorf must all carry sculptor_count ≥30 in `institutions.json`
  - Schema regression: `institutions[]` is always a list, never null
  - Snapshot: top-30 institutions list compared turn-over-turn
- `web/__perf__/lineage-bench.ts` — Playwright script that opens
  `/lineage` and reports time-to-stable-layout. Budget: ≤4s.
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
- Hard: lineage page renders in <4s with institutions on; tests pass;
  top-5 hubs visible by eye in the graph.
- Soft: the densified graph "tells a different story" — at minimum,
  ENSBA-Académie Julian-École de Paris should form a visible Parisian
  cluster, Bauhaus/Munich/Vienna a Germanic cluster, etc.
- **Decision after gate:** if soft criterion fails (the cluster
  structure is muddy or hubs are dwarfed by long-tail noise), reconsider
  the rendering threshold and possibly defer to a movement-tag
  approach instead of rendering institutions as nodes.

**Estimate.** 2–3 sessions. Net new SPARQL + ingest is 1 session;
graph component changes + threshold tuning is 1 session; perf budget +
tests + transparency surface is 1 session.

---

## Phase 5c — Time-coded edges and animated lineage

**Goal.** A "Play through the decades" control on `/lineage` that
animates the network growing as sculptors finish their training and
new institutional edges activate. Reader can scrub a decade slider
and watch the canon assemble.

**Inputs.** P580 (start_time) and P582 (end_time) qualifiers on P69
edges. Coverage measured at 18% — most edges will be dateless. We
infer dates for the rest from `sculptor.birth_year + 18` as a fallback
("typical training age"), with explicit disclosure.

**Architecture.**
- Edge schema gains `start_year: int | null`, `end_year: int | null`,
  `date_source: "qualifier" | "inferred"`.
- `LineageGraph` gains a `decadeRange: [number, number]` prop and
  filters edges to those whose `(start_year || inferred_year)` falls
  in the range.
- New transport control component: `<DecadeScrubber />` — draggable,
  URL-backed (`?from=1880&to=1920`), optionally auto-plays.

**Risks.**
- **Inferred dates are misleading.** A sculptor born 1860 didn't
  necessarily train at age 18; some trained at 25, some at 40 (Bourgeois
  studied into her 40s). Mitigation: surface the inference explicitly
  in the UI ("dates inferred for 82% of edges"). This is the same
  honesty pattern as the citizenship-vs-birthplace disclosure.
- **Sparsity at low decades.** Pre-1850 the data is thinner; the
  network might look empty at 1820 and snap into existence around 1880.
  That's fine — it reflects the data — but copy needs to acknowledge it.

**Tests.**
- `pipeline/test_temporal.py`: every edge with a qualifier date matches
  the value in Wikidata at probe time (5-edge spot check, fixture-based).
- Snapshot: 1880, 1900, 1920, 1940 frames record (#sculptors, #edges)
  visible — guards regressions in the temporal filter.

**Exit gate.**
- The 1900→1940 animation visibly shows the German-academy → US
  emigration shift (Bauhaus alums entering ASL / Black Mountain).
- If the visual story is muddy, reconsider whether to ship the
  scrubber as such or fall back to small-multiples (one frame per
  decade, no animation) which is honest and lower-risk.

**Estimate.** 1–2 sessions if 5b lands cleanly.

---

## Phase 5d — Career-trajectory Sankey

**Goal.** Generalize `/migration` from a 2-node corridor (born → died)
to 4 nodes: **born → educated → worked → died**. Same Sankey idiom,
much richer story. Naturally answers "who trained in Paris and
emigrated to the US" without having to read between charts.

**Inputs.** Drops out of 5b + P937 ingest. Uses
`birth_country`, `educated_at[].country`, `work_location[].country`,
`death_country`. Aggregates to country-level for the chart, drilldown to
sculptors per band.

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
needs to widen the search to the full 3,544 published sculptors,
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
- **The phases are not strictly ordered.** 5f (choropleth) and 5g
  (IIIF) don't depend on 5b. We can interleave if a phase stalls.

## Cross-cutting commitments

- Every ingest writes a `data/processed/*_provenance.json` sidecar:
  source URL, query date, row count, and any transformation rules.
  This is the lineage record for every chart.
- Every new chart gets a `transparency.json` field documenting its
  data source + denominator. The /transparency page is the discipline
  receipt.
- Every new schema field is **additive** — `LegacySculptor` keeps every
  Phase 0–4 field, new fields are optional, and old JSON consumers
  continue to work.
- Tests live next to the pipeline modules they cover and are runnable
  via `pytest pipeline/`. The bar is "guards against regression," not
  "100% coverage" — small, surgical, written before merge.
