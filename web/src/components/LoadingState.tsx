/**
 * LoadingState — single source of truth for in-progress data loads.
 *
 * Background: pages were rolling their own copy ("Loading...",
 * "Loading lineage network...", "Loading…", "Loading timeline...").
 * Inconsistent both visually and verbally. This component standardises
 * tone — muted, deliberately understated, no spinner — because every
 * page is a static-export read and finishes in well under a second on
 * any reasonable connection. A spinner would lie about the
 * latency profile.
 *
 * Use cases:
 * - Page-level: caller wraps in its own container.
 * - Suspense fallbacks for client components that read URL params.
 *
 * The `label` defaults to a generic phrase so callers can drop it in
 * without thinking; supply something more specific when context helps
 * (e.g. "Loading lineage network").
 */
export function LoadingState({
  label = "Loading data",
}: {
  label?: string;
}) {
  return (
    <p className="text-text-secondary text-sm" role="status" aria-live="polite">
      {label}…
    </p>
  );
}
