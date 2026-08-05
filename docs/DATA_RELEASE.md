# Data Release 2026-08-02.2

This note identifies the committed public artifacts in
`web/public/data/`. It separates the age of the upstream source snapshot
from later, evidence-backed curation and contract work so a maintenance
change is never presented as a fresh source query.

## Release identity

| Field | Value |
|---|---|
| Public artifact release | `2026-08-02.2` |
| Inclusion methodology | `A.3` |
| Source snapshot generated | `2026-06-05T13:35:22.969660+00:00` |
| Evidence-backed curation reviewed | `2026-08-02` |
| Producer/consumer contracts reviewed | `2026-08-05` |
| Source candidate records | 6,711 |
| Evidence-backed person exclusions | 1 |
| Analytically eligible candidates | 6,710 |
| Published sculptors | 3,543 |
| A.3 rule exclusions | 3,167 |

These figures are immutable evidence for this release note, not values to
copy into runtime UI. The application derives current counts and dates from
`web/public/data/transparency.json` through `web/src/lib/snapshot.ts`.
The three release/review fields are maintained explicitly in
`overrides/data_release.json`; a record-level `sourceCheckedAt` date is
provenance for that evidence record, not the review date of the whole artifact.

## What changed after the source snapshot

- `Q87366` (Johann Albrecht Siegwitz) is excluded with source provenance.
  Wikidata records an eighteenth-century birth, but the older year-only
  projection flattened that interval to 1800 and produced an impossible
  1800–1756 lifespan. The override remains until the public schema can
  represent uncertain dates without inventing a year.
- Person-to-person and institutional relationship exports now share an
  explicit temporal-envelope and confidence contract. Known lineage links
  that cannot be dated remain visible with null dates and a reason;
  impossible institutional intervals are counted and skipped.
- Static aggregates, indexes, and shards were reconciled to the exclusion,
  and data-contract tests now enforce roster parity, lifespan order,
  identifiers, edge endpoints, denominators, and override provenance.
- Candidate accounting now names the source-query frame, evidence-exclusion
  boundary, eligible frame, publication rule, and rule exclusions separately.
- A compact canonical movement-route index prevents sparse P135 labels from
  linking to aggregate pages that are intentionally not generated below the
  three-record threshold.
- Getty enrichment now uses a deterministic final-record contract: 2,310
  current published records carry the same `gettyVerified` block in the
  monolith and their per-QID shard, while shard-only museum `works` remain
  intact. The Getty audit was regenerated against the post-exclusion roster,
  reducing its stale 2,311-record denominator by the excluded `Q87366`.

No new Wikidata, Getty, Met, or Art Institute source query is implied by
these changes.

## Sources and scope

- Wikidata supplies the core artist records and most relationship,
  institution, place, movement, portrait, and authority-link assertions.
- Getty ULAN is used for a cross-source audit and selected biographical
  verification; it does not silently replace Wikidata fields.
- The Metropolitan Museum of Art and Art Institute of Chicago supply
  public-domain work images and metadata for the curated focus subset where
  available.
- Wikimedia Commons portraits are referenced through Wikidata; licensing and
  attribution remain attached to the Commons file pages.

The published set is a rule-selected lens on structured data, not a
comprehensive global canon, a ranking of importance, or proof that every
recorded influence or teaching assertion is historically correct. See
`docs/DATASET_DATASHEET.md`, `docs/CLAIM_REGISTER.md`,
`docs/INCLUSION_CRITERIA.md`, and `/transparency` for the maintained
composition, license, claim, methodology, and coverage record.

## Reproduce and verify

Run `./scripts/validate.sh` from the repository root. The bounded gate checks
Python data contracts (including focused Getty final-record tests), temporal and institution logic, lint, TypeScript,
the static production build, and deterministic lineage performance bounds.
Run `cd web && npm run test:e2e` for the seven explicit browser journeys.

Use release identifiers in the form `YYYY-MM-DD.N` for committed artifact
revisions. Increment `N` when the published files change without a new source
snapshot; use the source-query date when a full fresh export is published.
Update this note, the public freshness stamp, and the handoff together.
