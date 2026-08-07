import { dataSnapshot, formatSnapshotDate } from "@/lib/snapshot";

interface DataScopeNoteProps {
  source: string;
  scope: string;
  limits: string;
  className?: string;
  compactMobile?: boolean;
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
  compactMobile = false,
}: DataScopeNoteProps) {
  const snapshot = (
    <>
      Artifact {dataSnapshot.artifactRelease} · source export{" "}
      {formatSnapshotDate(dataSnapshot.generatedAt)} · methodology{" "}
      {dataSnapshot.methodologyVersion} · curation reviewed{" "}
      {formatSnapshotDate(dataSnapshot.curationReviewedAt)}
    </>
  );

  return (
    <aside
      role="note"
      aria-label="Data scope and limitations"
      data-testid="data-scope-note"
      className={`rounded-md bg-bg-secondary px-4 py-3 text-xs leading-relaxed text-text-secondary ${className}`}
    >
      {compactMobile ? (
        <div className="space-y-1.5 sm:hidden">
          <p>
            <strong className="text-text-primary">Source and scope:</strong>{" "}
            {source} {scope}
          </p>
          <p>
            <strong className="text-text-primary">Snapshot:</strong>{" "}
            {snapshot}
          </p>
          <p>
            <strong className="text-text-primary">Limits:</strong> {limits}
          </p>
        </div>
      ) : null}
      <dl
        className={`${compactMobile ? "hidden sm:grid" : "grid"} gap-x-5 gap-y-1 sm:grid-cols-[auto_1fr]`}
      >
        <dt className="font-semibold text-text-primary">Source</dt>
        <dd>{source}</dd>
        <dt className="font-semibold text-text-primary">Scope</dt>
        <dd>{scope}</dd>
        <dt className="font-semibold text-text-primary">Snapshot</dt>
        <dd>{snapshot}</dd>
        <dt className="font-semibold text-text-primary">Limits</dt>
        <dd>{limits}</dd>
      </dl>
    </aside>
  );
}
