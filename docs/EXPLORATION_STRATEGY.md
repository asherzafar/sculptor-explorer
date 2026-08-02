# Exploration Strategy

**Status:** Working strategy, 2026-08-02  
**Scope:** How playful research, graph modeling, temporal questions, and possible expansion beyond sculpture fit beside the public product.

## Origin and intent

The project began with a concrete request from a friend at the National Sculpture Society: make a graph of artists and their lifespans. That small request opened a larger creative question—what can art data become when visualization, network thinking, and AI-assisted development are used as instruments for exploration?

That experimental impulse is not project drift. It is one of the project’s purposes. The discipline is to distinguish a useful experiment from a production claim and to preserve what was learned even when a prototype does not graduate into the public app.

## Confirmed operating decisions

The founder confirmed these decisions on 2026-08-02:

- Keep **Sculpture in Data** as the public identity through Phase 5Q.
- Make the quality-gated public explorer the primary product, with an
  isolated exploration lab as a first-class supporting practice.
- Keep at most one active lab experiment by default.
- Permit derived relationship layers in the public explorer only when
  they are opt-in, visibly distinct from source assertions, and expose
  their method/evidence.

Treat sculpture as the first deep domain and proving ground, not as a permanent boundary in the underlying model.

Likewise, “since 1800” is the current public dataset boundary, not a
conceptual limit. Earlier periods may have different source density,
date precision, attribution practices, entity identity problems, and
survival bias; expand time through a dated source-fitness pilot rather
than by merely lowering a query cutoff.

This is a reversible decision. Revisit the name and public scope only after:

- the entity/relationship model can represent another artistic discipline without sculpture-specific distortion;
- a second-domain data probe passes coverage, provenance, and ethics checks;
- users demonstrate value in cross-discipline exploration; and
- the wider identity would clarify rather than dilute the product.

## Two connected tracks

### Public explorer

The public product must be coherent, trustworthy, accessible, performant, and legible to someone who did not build it. It earns promotion through the charter scorecard and the Phase 5Q gate.

### Exploration lab

The lab is for question discovery, visual play, unfamiliar techniques, source probes, and deliberately rough prototypes. A lab experiment may begin because an idea looks fun or technically interesting; it must state what was learned before it is considered complete.

The lab may run in parallel with 5Q when work is:

- isolated from production routes and contracts;
- time-boxed;
- reproducible enough for another agent to inspect;
- explicit about synthetic, inferred, or incomplete data; and
- cheap to archive without leaving production debt.

Phase 5Q gates **productionization**, not curiosity.

## Question atlas

The question—not the chart type or database—organizes exploration.

### Influence and lineage

- Through which documented channels did one artist plausibly affect another: teaching, study, collaboration, shared institution, exhibition, movement, text, or direct attribution?
- How does the picture change when asserted influence, formal affiliation, co-presence, and algorithmic similarity are viewed as separate layers?
- Which artists bridge otherwise separate communities, and is that bridge art-historical evidence or documentation density?
- Which institutions transmit practices across generations or national boundaries?
- Where do the records show a missing link rather than a true absence of connection?

### Temporal lives and changing relationships

- What did the artistic world around a person, institution, movement, or city look like at different points in its life?
- When did a node enter, leave, bridge, or reshape a community?
- Which relationships were definitely possible, merely temporally plausible, or contradicted by time/place?
- How did an institution’s roster, geography, influence, or movement mix change over time?
- When did a city become a scene, and when did that scene disperse or migrate?

### Communities, scenes, and overlap

- Which communities emerge from each relationship layer, and which remain stable across layers and decades?
- Do formal movements match communities derived from teaching, institutions, exhibitions, places, or works?
- Which artists belong to overlapping communities rather than one exclusive cluster?
- How do migration and institutional pathways connect regional scenes?

### Practice and works

- How do materials, media, subjects, scale, and fabrication practices spread through networks?
- Do changes in practice follow institutions, cities, teachers, movements, technologies, or museum collecting?
- How different is the history implied by museum collections from the history implied by biographical and institutional data?

### Historiography of the data

- Who becomes central because they were influential, and who becomes central because institutions documented them well?
- Which regions, genders, disciplines, languages, and relationship types disappear under each inclusion rule?
- How do conclusions change when a source or confidence tier is removed?

## Conceptual graph model

Model the cultural network before selecting a graph database. The production JSON can remain a set of optimized projections while the canonical conceptual model becomes more general.

### Entity kinds

- **Person:** artist, teacher, collaborator, patron, critic, curator.
- **Institution:** school, academy, studio, museum, collective, workshop.
- **Place:** city, region, country, site.
- **Movement or group:** named movement, school, collective, tendency.
- **Work:** artwork or documented creative object.
- **Event:** exhibition, residency, commission, class, collaboration, publication, migration episode.

People carry one or more roles/disciplines—sculptor, painter, architect, designer—rather than being locked into a sculpture-only person type.

### Relationship families

Keep semantically different relationships in separate layers:

1. **Asserted interpersonal:** `studied_under`, `teacher_of`, `influenced_by`, `collaborated_with`.
2. **Participation/affiliation:** `educated_at`, `worked_at`, `member_of`, `exhibited_at`, `represented_by`.
3. **Spatial/temporal:** `born_in`, `lived_in`, `worked_in`, `died_in`, `co_present_with`.
4. **Creative:** `created`, `depicts`, `uses_material`, `has_subject`, `part_of_series`.
5. **Interpretive/derived:** `similar_to`, `same_community_as`, `possible_contact_with`, `movement_transition`.

Never render co-presence, shared membership, similarity, or a predicted link as documented influence. Readers must be able to enable layers independently and see how each relation was established.

### Time and evidence

Every relationship should be able to carry:

- an asserted validity interval or bounded temporal envelope;
- precision/granularity (day, year, decade, lifespan-derived, unknown);
- evidence class (`source_asserted`, `curated`, `rule_derived`, `model_derived`);
- confidence and the method that produced it;
- source assertion(s), source URL/identifier, retrieval date, and transformation history;
- explicit contradiction or unknown state where relevant.

“When the source says this was true” and “when the project retrieved or derived it” are different clocks and should not be conflated.

## Analytical techniques worth exploring

These are methods, not promised features.

- **Ego networks and temporal neighborhoods:** follow one node through dated layers and events.
- **Multilayer network comparison:** compare teaching, institution, place, movement, collaboration, and similarity layers without collapsing them.
- **Community detection:** use Leiden or another justified method per layer/time slice, with stability checks across seeds, parameters, and missing-data assumptions.
- **Overlapping communities:** useful when artists participate in several scenes or movements; do not force exclusive membership when the domain is multiplex.
- **Dynamic communities:** track community birth, merge, split, persistence, and dissolution across periods.
- **Centrality and brokerage:** use degree, betweenness, PageRank, or flow measures only with an explanation of what the chosen edge layer makes them mean.
- **Path and reachability queries:** reveal documented chains while distinguishing a path in the graph from a causal historical claim.
- **Similarity and embeddings:** explore only after interpretable feature baselines, coverage/bias analysis, and a concrete reader task.
- **Counterfactual/source sensitivity:** recompute a view after removing a source, confidence tier, or over-documented hub.

## Initial experiment queue

### E1 — Temporal ego journey

Choose one artist, institution, and city with strong coverage. Prototype a shared time scrubber showing life/activity intervals, relationship layers, events, and changing neighborhood. First test whether a sequence of small multiples or event bands explains change better than an animated force graph.

### E2 — Layered lineage

Create separate projections for documented teaching/influence, institution, movement, place overlap, and derived similarity. Test what readers conclude from each layer and whether a combined view clarifies or confuses.

### E3 — Communities through time

Run a reproducible community analysis by decade and relation layer. Measure stability across seeds/resolution parameters and compare derived communities with named movements. The first artifact is an analysis report; a visualization is optional.

### E4 — Institution/city biography

Treat an institution or city as the focal node: roster arrivals/departures, movements, migration flows, works/events, and connections to peer places over time.

### E5 — Artist comparison

Compare two artists’ temporal neighborhoods, institutions, movements, places, works, and confidence/missingness. Test whether comparison answers observed user questions before building a generic comparison interface.

## Experiment lifecycle

1. **Question card:** state the motivating question, reader, why it is interesting, and what would count as surprise or learning.
2. **Data-fitness probe:** measure coverage, identifiers, time precision, missingness, bias, licenses, and provenance before UI work.
3. **Smallest useful prototype:** notebook, script, static mock, or isolated interaction; avoid production routing and schema commitments.
4. **Interpretation test:** compare with a simpler baseline and ask a reader/domain expert what they infer.
5. **Learning note:** record findings, failure modes, source sensitivity, and whether to continue, simplify, redirect, or archive.
6. **Graduation review:** only then score it as a public feature against the charter and Phase 5Q requirements.

Use this experiment brief:

```markdown
Question and why it matters:
Target reader / learning goal:
Entities and relationship layers:
Source assertions vs. derived signals:
Temporal model and uncertainty:
Coverage/bias/license probe:
Simplest comparison baseline:
Prototype boundary and time box:
What would surprise us:
Success / learning signal:
Stop, simplify, or archive condition:
Result and next decision:
```

## When a graph database becomes justified

A graph-shaped domain does not automatically require a graph database. The current static product benefits from pipeline computation and route-specific JSON projections.

Evaluate a canonical graph store when at least three important workflows repeatedly need capabilities that are awkward or slow in the current pipeline, such as:

- arbitrary multi-hop traversal across several entity/relationship types;
- temporal subgraph queries and event histories;
- repeated multilayer/community analysis without bespoke joins;
- assertion-level provenance queries;
- a second artistic discipline using the same model; or
- incremental updates that make full rebuilds impractical.

Before choosing a database, write an architecture decision record comparing a property graph, RDF/Linked Art/CIDOC CRM alignment, and a relational/columnar analytical model. Benchmark real queries and export needs. The browser should still receive small, purpose-built projections rather than a general graph database connection.

## Expansion beyond sculpture

1. **Deep sculpture wedge:** finish the current provenance/quality foundation and learn from real use.
2. **Artist-neutral semantic layer:** define additive domain-neutral entities, roles, assertions, temporal intervals, and relation layers alongside the legacy sculpture schemas.
3. **Second-domain probe:** choose a discipline from question value and source fitness—not breadth alone—and run the same inclusion/provenance audit.
4. **Earlier-period probe:** test identity resolution, temporal precision, attribution, coverage, and survival bias before moving the public start date.
5. **Cross-domain experiment:** test a question that genuinely benefits from multiple disciplines or periods, such as teacher networks or shared institutions.
6. **Public expansion decision:** only then decide whether to retain a sculpture section, create a wider umbrella identity, change the time claim, or rename the product.

## Questions for a later founder interview

Recommended defaults are stated so these questions can be answered quickly.

1. **First validation audience:** begin with the original sculpture/NSS relationship plus a few curious cultural-data readers (recommended), or optimize first for researchers/educators?
2. **Breadth versus depth:** prove the general model with one carefully chosen second discipline (recommended), or ingest many artist types early and accept uneven coverage?
3. **Second discipline:** choose from the cross-domain question and measured source fitness (recommended), or begin with the most familiar adjacent discipline?
