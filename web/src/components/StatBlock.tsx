/**
 * StatBlock — small headline tile used at the top of analytical pages
 * (/decade/[year], /movement/[slug], /migration). Three variations
 * existed inline across those pages with minor visual divergence; this
 * is the single source of truth.
 *
 * Visual contract:
 *   - Compact label in tertiary text, uppercase tracking.
 *   - Large display-font value, tabular-nums so digit columns line up
 *     when two StatBlocks sit side-by-side with different number widths.
 *   - Optional sub-line in secondary text for the "x of y" context.
 *   - `accent` flips the value color to accent-primary — used to draw
 *     the eye to the single most important number on each page.
 */
export function StatBlock({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-bg-secondary p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-semibold tabular-nums leading-tight ${
          accent ? "text-accent-primary" : "text-text-primary"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-text-secondary leading-snug">
          {sub}
        </div>
      )}
    </div>
  );
}
