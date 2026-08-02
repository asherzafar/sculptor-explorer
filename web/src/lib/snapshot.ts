import externalMentors from "../../public/data/external_mentors.json";
import focusSculptors from "../../public/data/focus_sculptors.json";
import transparency from "../../public/data/transparency.json";

/**
 * Build-time facts from the committed public export.
 *
 * Keep volatile counts out of page copy and metadata: importing this module
 * makes the deployed language move with the snapshot that the UI actually
 * serves. Client components may import these small derived constants; the
 * committed JSON is resolved at build time rather than fetched at runtime.
 */
export const dataSnapshot = Object.freeze({
  generatedAt: transparency.generatedAt,
  artifactRelease: transparency.release.artifactRelease,
  methodologyVersion: transparency.criterion.version,
  curationReviewedAt: transparency.release.curationReviewedAt,
  contractsReviewedAt: transparency.release.contractsReviewedAt,
  includedSculptors: transparency.included,
  sourceCandidates: transparency.sourceCandidates,
  eligibleCandidates: transparency.eligibleCandidates,
  externalMentors: externalMentors.length,
  focusSculptors: focusSculptors.length,
  lineageEdges: transparency.relationshipCoverage.lineage.totalEdges,
  datedLineageEdges: transparency.relationshipCoverage.lineage.datedEdges,
  fieldCoverage: transparency.fieldCoverage,
});

export function formatSnapshotDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
