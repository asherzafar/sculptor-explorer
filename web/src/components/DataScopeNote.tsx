import { dataSnapshot, formatSnapshotDate } from "@/lib/snapshot";

interface DataScopeNoteProps {
  source: string;
  scope: string;
  limits: string;
  className?: string;
}

/**
 * Compact provenance placed beside an analytical view or claim.
 *
 * The shared snapshot line is derived from the committed export so route
 * copy cannot silently drift from the data it describes. Route-specific
 * source, denominator, and missingness remain explicit props because those
 * semantics differ materially across views.
 */
export function DataScopeNote({
  source,
  scope,
  limits,
  className = "",
}: DataScopeNoteProps) {
  return (
    <aside
      role="note"
      aria-label="Data scope and limitations"
      data-testid="data-scope-note"
      className={`rounded-md bg-bg-secondary px-4 py-3 text-xs leading-relaxed text-text-secondary ${className}`}
    >
      <dl className="grid gap-x-5 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-text-primary">Source</dt>
        <dd>{source}</dd>
        <dt className="font-semibold text-text-primary">Scope</dt>
        <dd>{scope}</dd>
        <dt className="font-semibold text-text-primary">Snapshot</dt>
        <dd>
          Artifact {dataSnapshot.artifactRelease} · source export{" "}
          {formatSnapshotDate(dataSnapshot.generatedAt)} · methodology{" "}
          {dataSnapshot.methodologyVersion} · curation reviewed{" "}
          {formatSnapshotDate(dataSnapshot.curationReviewedAt)}
        </dd>
        <dt className="font-semibold text-text-primary">Limits</dt>
        <dd>{limits}</dd>
      </dl>
    </aside>
  );
}
