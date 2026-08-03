# Project Charter

**Status:** Working product charter, audited 2026-08-02  
**Owner:** Asher Zafar  
**Scope:** Product direction, outcomes, and decision criteria. The experimental/graph strategy lives in `docs/EXPLORATION_STRATEGY.md`; implementation values live in `.windsurfrules`; delivery order lives in `docs/ROADMAP.md`.

## Origin and working scope

The project began with a friend’s request for a graph of sculptors and their lifespans, then grew into an experiment in using art data, visualization, network analysis, and AI-assisted development to discover interesting questions. That origin creates two legitimate goals: make a coherent public explorer and maintain a disciplined space for playful technical/visual research.

Sculpture is the first deep domain and the current public identity; 1800 is the current public data boundary. Neither is a permanent conceptual limit. The underlying model should be capable of representing artists in other disciplines and periods when their data quality, temporal precision, provenance, rights, and question value justify expansion.

## North star

Help people explore and explain how artists, institutions, places, movements, works, and practices shape one another over time—beginning with sculpture—while making the limits of the underlying data visible and auditable.

The product should feel like a carefully edited exhibition catalogue with the exploratory power of a research instrument: visually distinctive, inviting to browse, precise enough to cite, and candid about uncertainty.

## Audience hypotheses

These are hypotheses to validate, not assumptions to hard-code into the interface.

1. **Curious cultural readers and museum visitors** want to find a known sculptor, then discover an unexpected connection or historical pattern without learning a specialist tool.
2. **Educators, students, and researchers** want traceable evidence, reproducible views, and downloadable or linkable context they can inspect critically.
3. **Practitioners and sculpture organizations** want an accessible overview of lineages, institutions, movements, and geographic histories relevant to their field.
4. **Makers and cultural-data explorers** want a legible laboratory for trying unfamiliar visual, graph, temporal, and AI-assisted methods and learning which questions they can responsibly answer.

The National Sculpture Society tradition is an important origin and curation lens, but it is not the boundary of sculpture history. The product must name that lens and continue measuring whom it omits.

## Core jobs to be done

- **Orient:** “Show me what this project covers, where its data comes from, and what it cannot claim.”
- **Find:** “Help me reach a sculptor, movement, institution, place, or period I care about quickly.”
- **Explain:** “Help me understand a pattern and the evidence behind it without decoding a hairball or dashboard.”
- **Compare:** “Let me compare people, periods, places, or institutions on consistent terms.”
- **Share and verify:** “Give me a stable URL and enough provenance to reproduce or challenge what I saw.”
- **Experiment:** “Let me try a provocative visual or analytical idea, understand what it reveals or distorts, and preserve the learning even if it never becomes a feature.”

## Objectives and initial measures

Targets below are initial quality bars. Establish baselines during Phase 5Q and revise them with observed evidence.

### O1 — Make discovery fast and comprehension reliable

- In moderated task tests, at least 4 of 5 target users can find a named sculptor and explain one non-obvious relationship within two minutes.
- At least 80% of tested readers correctly identify what a chart encodes, the comparison being made, and one material limitation without coaching.
- Every top-level view answers one primary question in its heading, framing copy, and default state.

### O2 — Make claims auditable

- Every analytical view exposes source, scope/denominator, freshness, missingness, and confidence where applicable.
- Data-contract tests have zero unexplained impossible records and zero silent schema omissions.
- Published data exports are versioned and carry generated-at metadata, source versions, and a citation note.

### O3 — Make exploration reproducible and connected

- All consequential filters, selections, and view modes round-trip through the URL.
- Sculptors, movements, institutions, decades, and relevant views link to one another without dead ends.
- A reader can copy a URL and another reader sees the same analytical state.

### O4 — Keep the product trustworthy and sustainable

- The main validation suite is automated and green before feature expansion resumes.
- No high-severity dependency advisory remains untriaged; accepted risk has an owner and review date.
- Core Web Vitals meet the “good” p75 thresholds on representative routes; chart/filter response stays under 200 ms for normal interactions.
- The default lineage view settles within 1.5 seconds on the benchmark machine; opt-in heavy modes stay under 3 seconds or use a different renderer/interaction model.

### O5 — Learn through disciplined experimentation

- Keep a default work-in-progress limit of one active lab experiment. Each has a question card, data-fitness probe, reproducible artifact, and explicit continue/simplify/archive decision before the next begins.
- Experiments clearly distinguish source assertions, curated judgments, rule-derived relationships, and model-derived similarity or predictions.
- At least one experiment per planning cycle is reviewed with a reader or domain expert before production consideration.
- Negative results and archived ideas remain findable so future agents do not repeat them without new evidence.

## Product principles

1. **Question before product feature.** A production visualization begins with a reader question and decision, not an available field or attractive form. The lab may begin with play or technique, but it must end with an articulated learning.
2. **Overview before density.** Start with a legible overview, then offer filtering, focus, and details on demand.
3. **Caveats at the claim.** Put the consequential limitation beside the chart or statement it qualifies, not only on About.
4. **Uncertainty is data.** Show confidence and absence explicitly; never manufacture temporal or causal precision.
5. **Links are the product architecture.** Every entity and state should lead somewhere meaningful and remain shareable.
6. **Aesthetic restraint serves interpretation.** Typography, whitespace, motion, and material references should clarify hierarchy and support sustained attention.
7. **Progressive complexity.** Default views serve first-time readers; advanced layers remain opt-in until comprehension and performance are proven.
8. **Measure before scaling.** Use analytics, performance traces, data probes, and small user studies before large feature bets.
9. **Keep relationship layers honest.** Documented influence, affiliation, co-presence, similarity, and prediction are different claims and must remain separable.
10. **Model before database.** Establish entities, events, temporal semantics, provenance, and real query needs before choosing graph infrastructure.

## Non-goals for the current horizon

- Claiming comprehensive global coverage or a definitive art-historical canon.
- Remaining sculpture-only by design; expansion is allowed when it passes the evidence and model gates.
- Rebranding as a universal artist explorer before a second-domain pilot proves that the broader scope is coherent.
- Replacing museum catalogues, catalogues raisonnés, or scholarly attribution.
- Adding a visualization solely because the data or technique is available.
- Building a general-purpose graph analysis workbench.
- Generating opaque style embeddings before works-level data, rights, interpretability, and reader value are established.
- Supporting real-time collaborative editing or user accounts.

## Decision scorecard

Score a proposed initiative from 0–2 on each dimension. A feature should normally reach 9/12 and have no zero in reader value, evidence fitness, or accessibility before entering active work.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Reader value | No validated question | Plausible question | Observed recurring need |
| Evidence fitness | Data cannot support claim | Material gaps, bounded use | Data and uncertainty fit claim |
| Explanatory power | Decorative/redundant | Adds detail | Reveals a new, interpretable relationship |
| Accessibility | Excludes a core mode | Workaround exists | Equivalent perceivable/operable path |
| Performance/maintainability | Breaks budgets | Manageable with debt | Fits budgets and existing architecture |
| Strategic leverage | Isolated surface | Reuses one substrate | Connects several entities/views or improves trust |

Every scored production initiative also needs a **success signal**, a **stop or simplify condition**, and a named **data/UX risk**. Lab experiments use the lighter brief in `docs/EXPLORATION_STRATEGY.md`; graduation to the public explorer requires this scorecard. The roadmap is a sequence of tested bets, not a promise to ship every phase unchanged.
