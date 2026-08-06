# Public Claim Register

**Status:** Current production plus landing-hotfix review
**Reviewed:** 2026-08-06
**Applies to:** Release `2026-08-02.2`, methodology `A.3`

This register is the maintainable audit behind the charter requirement that
every analytical claim expose its source, denominator, freshness, and material
missingness. Public analytical routes use the shared `DataScopeNote` component
for the snapshot stamp and route-specific evidence; Transparency carries the
deeper audit.

## Route and claim audit

| Surface | Claim actually supported | Source | Scope/denominator | Missingness and interpretation shown beside it |
|---|---|---|---|---|
| Timeline | Lifespans of a curated focus roster | Focus CSV; matched Wikidata metadata | 48 focus sculptors | NSS/American figurative emphasis; not a global survey; color is birth decade, not importance |
| Explore | URL-shareable name search, source-field sorting, and recorded-movement-presence filtering over the published roster; pagination changes presentation, not scope | Wikidata plus explicit overrides | 3,543 published of 6,710 analytically eligible candidates after one evidence-backed exclusion from 6,711 source candidates; 50 records per page | Search covers display/native names, not every field; sequential input keeps word boundaries while shared URLs stay canonical; “recorded movement” means a non-missing P135 display value, not verified membership; 2,581 missing movement values render as — and sort after recorded labels; null death years remain unknown rather than implying living status; sparse movement labels remain text rather than dead aggregate links; labels are source assertions |
| Evolution—geography | Counts by one display citizenship or recorded birth country and birth decade | Wikidata P27 or P19→P17 | All 6,710 analytically eligible candidates; Unknown remains a category | Citizenship is not identity/residence; country of birth is not later residence; top categories and Other are explicit |
| Evolution—movement | Distribution of recorded P135 labels by birth decade | Wikidata P135 | 962 records with movement labels | 2,581 published records lack a movement label; no claim of movement membership or influence |
| Evolution—materials | Counts of categorized, dated museum-object records | Met/AIC object metadata and medium taxonomy | 132 matched records from bounded focus-list searches | Not comparable to artist counts; not representative of overall practice or collections |
| Migration | Recorded birth-country → death-country endpoint pairs | Wikidata P19/P20→P17 plus country normalization | 2,567 eligible non-living published sculptors | 834 living + 142 missing-endpoint records excluded; endpoints do not reconstruct a journey or motive |
| Lineage | Source-asserted P737/P1066 connections and optional P69/P937 institution links | Wikidata | 1,423 person assertions; institution scope disclosed on Transparency | Edge truth is not verified; temporal confidence is date precision only; sparse documentation shapes the graph |
| Lineage citizenship comparison | Whether two non-empty recorded citizenship sets intersect | Wikidata P27 arrays on both sculptor endpoints | 557 classifiable of 1,423 edges; 866 unclassifiable | No shared value does not establish travel, refugee status, culture, or cross-cultural exchange |
| Decade pages | Published cohort counts and leading recorded categories | Wikidata fields and precomputed migration endpoint bundle | Published sculptors born in the selected decade; endpoint denominator displayed | P21 labels are attributed; leading lists omit missing/long-tail values while retaining the full cohort denominator |
| Movement pages | Records sharing one P135 label, their dates, countries, and graph degree | Wikidata | Movement total shown; dedicated pages require at least three records | P135 is a sparse source classification; “most-connected in this graph” replaces value-laden “notable” |
| Sculptor detail | Source fields for one QID, Getty comparison where present, and graph degree | Wikidata; Getty ULAN for 2,310 published QIDs; optional Met/AIC | One published record; the detail shard is contract-tested against the monolith | Source links and absences are visible; Getty place fallback is attributed; Getty cultural/national descriptors remain distinct from citizenship; disjoint-citizenship connection count is not called border crossing |
| Transparency inclusion/demographics | Composition of source, evidence-excluded, eligible, published, and A.3 rule-excluded frames | Generated A.3 audit plus documented exclusion override | Exact population totals shown | Evidence exclusions are not A.3 signal exclusions; differences reflect both source-frame and rule bias; no causal attribution to the rule alone |
| Transparency Getty audit | Agreement/disagreement between two source models | Getty ULAN and Wikidata | 2,310 published records compared; field-specific comparable denominators shown | Getty cultural attribution is not legal citizenship; string-based place agreement is disclosed; the excluded `Q87366` is not retained in this denominator |
| Transparency institutions | Relationship coverage, temporal method, and education-link concentration | Wikidata P69/P937 and deterministic envelope rules | Exact edges, sculptors, and institutions shown | Concentration measures documentation, not institutional quality or importance |

## Classification language decisions

### Gender

- The public value is the Wikidata `P21` label; the project does not infer,
  predict, or correct an individual’s gender without evidence and review.
- Aggregates say “recorded gender (Wikidata P21)” and “labeled female,” not
  “women,” where the computation is a source-label count.
- “Other or unknown” is not treated as one identity. It is a technical
  remainder containing any non-male/non-female labels and missing values.
- Small counts are descriptive of source documentation and must not support
  population-level conclusions.

### Citizenship, nationality, geography, and historical states

- Wikidata `P27` is displayed as recorded citizenship, not ethnicity,
  culture, residence, self-identification, or a universally stable notion of
  nationality.
- Getty’s nationality/culture vocabulary remains visibly distinct from
  Wikidata citizenship in the cross-source audit.
- P19/P20 country endpoints do not encode intermediate travel, timing,
  duration, motive, home, or permanent migration.
- The legacy JSON field `crossesBorders` means disjoint recorded citizenship
  sets only. Public copy must not expand that into cross-cultural influence or
  observed border crossing.
- Formal-name and single-successor country mappings are permitted with a
  categorized rationale. Multi-successor states remain unresolved unless a
  per-record, evidence-backed rule receives domain/community review.

### Movements and cultural categories

- P135 labels are source classifications and are incomplete. They do not prove
  membership, stylistic similarity, mutual influence, or the historical
  coherence of a group.
- Layout proximity, graph paths, institutional overlap, co-presence, clusters,
  and model-derived similarity remain separate claim layers.
- Do not name an algorithmic community as a historical/cultural group without
  stability analysis, source sensitivity, art-historical evidence, and review.

### Ranking language

- Degree means connections in the committed Wikidata projection. Public lists
  use “most-connected sculptors in this graph,” not “most important” or an
  unqualified “notable.”
- Institution concentration is documentation concentration, not a ranking of
  quality or historical importance.

## Domain and community review triggers

The 2026-08-02 pass is an internal source/claims audit, not a substitute for
outside expertise. Obtain relevant art-historical and community review before
shipping any of the following consequential claims:

- a named story or comparison about women, trans/non-binary artists,
  Indigenous peoples, nationality, ethnicity, religion, colonial status,
  refugees, diaspora, or a cultural group;
- automated reassignment of a multi-successor historical state or disputed
  place/citizenship identity;
- a claim that one artist influenced another based on anything other than a
  visibly sourced assertion, or a claim that a graph path is historically
  possible without temporal validation;
- cluster/community names, cultural-region taxonomies, global representation
  scores, or fairness claims;
- reuse of Indigenous or culturally sensitive knowledge/assets merely because
  a technical source is open;
- an inference or evaluation affecting a living artist.

Review should include at least one relevant domain specialist and, where a
living or historically marginalized community is described, a person or
organization with standing in that context. Record participants, question,
materials reviewed, disagreements, resulting language/data changes, date, and
the next review trigger. Consultation does not transfer editorial
responsibility to the reviewer.

## Maintenance rule

When adding or changing a public analytical claim:

1. state the reader question and exact assertion;
2. identify the source field/assertion and transformation;
3. identify the population, numerator, and denominator;
4. quantify or explicitly name material missingness;
5. separate source assertion, curated judgment, rule-derived result, and
   model-derived inference;
6. add freshness from the committed snapshot;
7. check the classification decisions and external-review triggers above;
8. update the route’s `DataScopeNote`, this register, relevant contract tests,
   datasheet, and data release when material.

If the evidence cannot support concise honest wording, remove or reframe the
claim rather than hiding the limitation on About.
