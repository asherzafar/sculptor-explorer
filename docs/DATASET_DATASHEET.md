# Dataset Datasheet

**Dataset:** Sculpture in Data public artifacts  
**Current artifact release:** `2026-08-02.1`  
**Source snapshot:** `2026-06-05T13:35:22.969660+00:00`  
**Methodology:** `A.3`  
**Curation and contract review:** 2026-08-02  
**Maintainer:** Asher Zafar  
**Status:** Maintained public-data record; update with every source refresh, methodology change, or material override

This datasheet follows the repository practice derived from *Datasheets for
Datasets*, FAIR, CARE, Data Feminism, and reproducible-computing guidance in
`docs/RESEARCH_FOUNDATIONS.md`. It describes the committed public artifacts,
not every gitignored intermediate cache.

## Purpose and motivation

The dataset supports an exploratory public site about sculptors, their lives,
recorded movements, places, institutions, museum works, and documented
relationships since 1800. It is designed for browsing, teaching, question
formation, source criticism, and reproducible visualization—not for ranking
artistic importance or establishing a definitive canon.

Sculpture is the first deep domain. The entity/relationship model may later
support other artists or periods, but this release must not be described as a
general artist dataset or a comprehensive global history of sculpture.

## Current composition

Counts below identify release `2026-08-02.1`. Runtime pages derive changing
facts from `web/public/data/transparency.json` rather than copying this table.

| Unit | Count | Meaning |
|---|---:|---|
| Source candidate records | 6,711 | Wikidata-derived frame before evidence-backed person exclusions |
| Evidence-backed person exclusions | 1 | Record the year-only public schema cannot currently represent honestly |
| Analytically eligible candidates | 6,710 | Post-evidence frame before A.3 publication filtering; legacy JSON calls this `totalCached` |
| Published sculptors | 3,543 | Candidates passing at least one A.3 inclusion signal, after explicit exclusions |
| A.3 rule-excluded candidates | 3,167 | Eligible candidates that fire no A.3 signal |
| Curated focus sculptors | 48 | Canonical focus CSV used by Timeline and bounded museum searches |
| Person-to-person assertions | 1,423 | Wikidata P737/P1066 edges; 1,372 have a temporal estimate and 51 remain explicitly undated |
| External mentor/influence nodes | 681 | Human endpoints of published edges not classified as sculptors in the candidate frame |
| Institution/place nodes | 1,662 | P69/P937 endpoints; 334 meet the current three-sculptor render threshold |
| Exported institution edges | 5,925 | 2,868 education and 3,057 work-location links after 54 empty temporal intersections were rejected |
| Material observations | 132 | Dated, artist-matched Met/AIC sculpture-object records grouped through the current material taxonomy |
| Public-domain works in detail shards | 34 across 9 sculptors | Met/AIC records passing the public-domain, image, match, and six-per-sculptor export gates |

The primary unit is a public record about a historical or living person. The
dataset contains no site-user accounts, behavioral profiles, private contact
information, or inferred protected characteristics. It does reproduce public
source assertions about living artists; those assertions can still be wrong or
harmful and must be treated as contestable.

## Candidate frame and inclusion

The Wikidata discovery query selects humans (`P31=Q5`) with an occupation that
is sculptor or a subclass of sculptor, a recorded birth at or after 1800, and a
birth value with year precision or better. Explicit focus-list compatibility
QIDs may be injected from a documented override file when source formatting
prevents discovery. Evidence-backed person exclusions are then applied before
enrichment and aggregation. This release starts with 6,711 source candidates,
excludes one incompatible record, and applies A.3 to the remaining 6,710.

A candidate is published under methodology A.3 if at least one signal fires:

1. a Wikidata art-movement assertion (`P135`);
2. a recorded `influenced by` or `student of` edge (`P737` or `P1066`);
3. membership in the curated focus list;
4. at least two distinct recorded citizenships (`P27`); or
5. at least three non-English Wikipedia sitelinks after excluding the
   currently identified bot-dominated Cebuano and Waray editions.

Authority identifiers are retained as metadata but do not gate publication.
The rule measures documentation signals, not merit, quality, influence, or
global importance. See `docs/INCLUSION_CRITERIA.md` for the research and
threshold history.

## Data fields and contracts

The producer is `pipeline/export_json.py`; the current consumer types are in
`web/src/lib/types.ts`; architecture and schema rationale are in
`docs/ARCHITECTURE.md`. The committed public projection uses camelCase even
where older architecture examples use snake_case.

| Field family | Examples | Source or derivation | Important interpretation |
|---|---|---|---|
| Identity | QID, display name, native name, authority links | Wikidata, with Getty identifiers for cross-reference | Identifiers aid reconciliation; names and identity records remain source assertions |
| Lifespan | birth/death year, alive flag, birth decade | Wikidata plus focus CSV dates | Only year precision or better is admitted; null death may mean living |
| Sensitive description | gender | Wikidata `P21` English label | Never inferred; display as “recorded in Wikidata,” not as an editorial judgment or complete identity model |
| Geography | citizenships, display citizenship, birth/death place and country | Wikidata `P27`, `P19`, `P20`, `P17`; documented normalization | Citizenship is not culture, ethnicity, residence, nationality in every historical context, or a movement path |
| Art-historical category | movement | Wikidata `P135` plus four documented focus overrides | Sparse source categorization, not proof of membership, stylistic similarity, or influence |
| Relationships | P737/P1066 person edges; P69/P937 institution edges | Wikidata direct properties | Source assertions, not independently verified causal history |
| Temporal envelope | min/max start/end, method, confidence, reason | Source qualifiers or disclosed lifespan/age rules | Confidence describes date precision only, never truth of the underlying relationship |
| Graph metrics | in/out/total degree, institution counts | Deterministic projection of the committed graph | Measures documentation in this graph, not importance or centrality in sculpture history |
| Museum works/materials | title, date, medium, image/source link; normalized material category | Met and AIC APIs plus explicit matching/taxonomy rules | Bounded focus-list-biased sample; object counts are not artist-level material prevalence |
| Inclusion evidence | signal list and audit counts | Deterministic A.3 rule | Explains publication; must not be shown as a quality score |

Stable QIDs are the person keys. Edge endpoints must resolve to an included
sculptor or a documented external human endpoint. Contract tests enforce
identifier shape, lifespan order, roster/index/shard parity, edge endpoints,
aggregate denominators, exclusion provenance, and temporal schemas.

## Source and license record

| Source | Use in this release | License/reuse posture |
|---|---|---|
| [Wikidata](https://www.wikidata.org/) | Core people, labels, dates, places, citizenships, movements, relationships, institutions, sitelinks, portraits, authority identifiers | Structured data is [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing) |
| [Getty ULAN](https://www.getty.edu/research/tools/vocabularies/ulan/) | Cross-source audit and selected biographical verification | Made available under [ODC Attribution 1.0](https://opendatacommons.org/licenses/by/1-0/); Getty/ULAN attribution is required |
| [The Metropolitan Museum of Art Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) | Matched sculpture-object metadata and public-domain images for the focus subset | Open-access data and eligible public-domain images are CC0; retain source object links and credit lines |
| [Art Institute of Chicago Open Access](https://www.artic.edu/open-access/open-access-images) | Matched sculpture-object metadata and public-domain IIIF images for the focus subset | Public-domain images and designated open data are CC0; retain source object links and credit lines |
| [Wikimedia Commons](https://commons.wikimedia.org/) | Portrait files referenced through Wikidata | File licenses vary; the site hotlinks thumbnails and links to each Commons file page for author/license detail |

The combined export has mixed provenance and is not relicensed as one new
blanket dataset. Reusers are responsible for following each source family’s
terms and any object/file-level attribution. “Open” technical access does not
remove CARE obligations or justify insensitive reuse of people or cultural
heritage.

## Collection and processing

1. Discover and cache candidate QIDs from Wikidata with the dated SPARQL
   query and year-precision boundary.
2. Fetch node fields, movements, citizenships, sitelinks, places, images,
   authority identifiers, relationships, and institutions in bounded batches.
3. Reconcile display labels and QIDs; preserve arrays where a source provides
   multiple citizenships or institutions.
4. Apply documented country aliases. Formal-name and single-successor
   historical-state mappings are allowed; ambiguous multi-successor states are
   deliberately left unresolved.
5. Apply explicit focus, movement, and person-exclusion overrides with source
   or rationale columns.
6. Calculate the A.3 inclusion signals, graph degrees, aggregate files, and
   temporal envelopes. Impossible values fail validation or remain explicitly
   unavailable; they are not silently coerced.
7. Query museum APIs only for the bounded focus roster, verify artist-name and
   sculpture-type matches, classify medium strings with an editorial taxonomy,
   and export detail images only when the source public-domain flag and image
   URL are both present.
8. Export static JSON. Full source refreshes update `generatedAt`; bounded
   compatibility backfills preserve that date and record later review
   separately.

The pipeline uses cached external inputs and is not fully reproducible from
the committed repository alone. A fresh source run requires the gitignored
parquet caches or network queries; the committed snapshot is independently
checkable through deterministic data contracts.

## Missingness and coverage

Coverage on the 3,543 published sculptors:

| Field | Present | Missing |
|---|---:|---:|
| Birth place | 3,487 (98.4%) | 56 |
| Death place | 2,574 (72.7%) | 969, including living people for whom a death place is not applicable |
| Native name | 1,334 (37.7%) | 2,209 |
| Portrait image | 2,274 (64.2%) | 1,269 |
| Authority link | 3,339 (94.2%) | 204 |
| Movement label | 962 (27.2%) | 2,581 |
| Display citizenship | 3,526 (99.5%) | 17 |

Migration-endpoint analysis admits 2,567 non-living sculptors with both birth
and death countries. It excludes 834 living people, 24 non-living records
without birth country, and 118 non-living records with birth but no death
country. A different birth/death country is an endpoint difference, not proof
of a journey, permanent migration, border crossing at a particular time, or
motivation.

Only 557 of 1,423 lineage edges have recorded citizenship sets on both
sculptor endpoints for the published citizenship comparison; 866 are
unclassifiable, commonly because an external mentor has no fetched P27 data.
The legacy `crossesBorders` JSON name means “disjoint recorded citizenship
sets,” not observed border crossing or cross-cultural exchange.

Missingness is structured by source coverage and historical power. The cache
overrepresents people documented in Wikidata and Euro-American institutions;
the publication rule cannot repair people, traditions, collectives, anonymous
makers, or cultural practices absent from those systems.

## Curation and overrides

| Path | Purpose |
|---|---|
| `overrides/focus_sculptors.csv` | Canonical curated Timeline/focus roster and dates |
| `overrides/movement_overrides.csv` | Documented corrections for four focus-sculptor display movements |
| `overrides/medium_taxonomy.csv` | Auditable mapping from museum medium strings to display categories |
| `pipeline/data/country_aliases.json` | Categorized country-label normalization and deliberate non-mappings |
| `overrides/person_exclusions.csv` | Evidence-backed exclusions where the year-only schema cannot represent source dates honestly |
| `overrides/data_release.json` | Explicit artifact identity plus release-level curation and contract-review dates |
| `overrides/missing_sculptor_qids.csv` | Explicit candidate compatibility additions where discovery formatting misses a focus record |

An override is not proof that the project has the final scholarly answer. It
must carry enough provenance or rationale to be reviewed, changed, or removed.

## Intended uses

- exploratory browsing and visualization;
- teaching data/source criticism and forming research questions;
- reproducing a public view from a stable URL;
- inspecting documentation patterns, missingness, and source disagreement;
- prototyping bounded graph and temporal methods with visible uncertainty;
- identifying records that merit verification in primary or scholarly sources.

## Non-intended uses

- ranking artistic merit, importance, market value, or institutional quality;
- presenting a definitive global canon or complete population estimate;
- inferring gender, ethnicity, culture, nationality, migration status,
  political identity, or other personal characteristics;
- proving that influence, teaching, movement membership, or institutional
  affiliation was historically true merely because a source edge exists;
- treating a graph path, layout proximity, cluster, or centrality score as
  causal or art-historical evidence;
- automated decisions about living artists, grants, employment, collections,
  reputation, or eligibility;
- unreviewed commercial or generative-AI reuse of cultural heritage merely
  because a source is technically open.

## Risks and mitigations

- **Canon/source bias:** display the cached and excluded populations, field
  coverage, source scope, and rule instead of claiming global coverage.
- **Sensitive-label harm:** never infer gender or culture; attribute displayed
  labels to their source and provide a correction path.
- **Citizenship overreach:** distinguish P27 from identity, residence, and
  movement; do not describe disjoint sets as observed border crossing.
- **Historical-state erasure:** normalize only documented low-ambiguity cases;
  preserve multi-successor states and disclose the decision.
- **Causal overclaim:** describe graph links as assertions; keep date confidence
  separate from relationship truth.
- **Documentation density as importance:** label degree rankings as
  “most-connected in this graph,” never “most important” or unqualified
  “notable.”
- **Living-person error:** retain only public professional/biographical source
  fields, make no predictions, and treat correction requests promptly.
- **Rights/attribution drift:** restrict detail images to source-flagged public
  domain, preserve institutional/file links, and review source terms before
  expanding collections.

`docs/CLAIM_REGISTER.md` records how these mitigations appear beside each
public analytical view and when outside expertise is required.

## Distribution, citation, and correction

The static JSON artifacts are served from `/data/` in the deployed site and
committed under `web/public/data/`. Cite this snapshot as:

> Sculpture in Data, public artifact release 2026-08-02.1, methodology A.3,
> source snapshot 2026-06-05, maintained by Asher Zafar. Derived from Wikidata,
> Getty ULAN, The Metropolitan Museum of Art, the Art Institute of Chicago,
> and Wikimedia Commons; source-specific licenses apply.

Include the exact artifact path or shared route URL and retrieval date when a
claim depends on a particular view. Corrections should be opened in the
repository with the QID/object ID, disputed field, proposed correction,
supporting source, and whether the issue affects only display or the public
roster/aggregates.

## Maintenance and release checklist

The source refresh cadence is not yet scheduled; freshness is therefore shown
in the product rather than implied. Review at every material change:

1. source snapshot and curation dates;
2. inclusion methodology/version and source/exclusion/eligible/published denominators;
3. source licenses and attribution language;
4. field and relationship missingness;
5. overrides, exclusions, and historical-state mappings;
6. sensitive classification language and external-review triggers;
7. producer/types/consumer schema alignment;
8. `./scripts/validate.sh` and `cd web && npm run test:e2e`;
9. `docs/DATA_RELEASE.md`, this datasheet, the claim register, Transparency,
   Roadmap, and agent handoff.

Use `YYYY-MM-DD.N` artifact releases as defined in `docs/DATA_RELEASE.md`.
