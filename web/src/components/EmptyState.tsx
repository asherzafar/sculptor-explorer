import type { ReactNode } from "react";

/**
 * EmptyState — generic "no data here" affordance.
 *
 * The project's "honest readout" ethos means we don't silently hide a
 * section just because data isn't available. We say what's missing and,
 * when meaningful, why. This component is the standard surface for that.
 *
 * Two layout variants:
 * - Default (`variant="block"`): centred, padded, used inside chart and
 *   table containers where we want the empty box to feel substantive.
 * - `variant="inline"`: a single muted line, used inside the detail
 *   page's identity card where a missing field shouldn't dominate.
 *
 * Tone notes:
 * - The `title` is the affirmative observation ("No movement listed").
 *   Avoid blame language ("Failed to load…") unless that's actually
 *   what happened.
 * - The `description` is optional context — usually one of:
 *   "Not recorded on Wikidata for this sculptor."
 *   "Try clearing the movement filter to see more results."
 * - The `action` slot is for a single restorative button (e.g. "Clear
 *   filters"). Two actions is a sign the empty state is doing too much
 *   work — push the second one into surrounding chrome.
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "block" | "inline";
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  variant = "block",
  className = "",
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <p className={`text-sm text-text-tertiary ${className}`}>
        <span className="text-text-secondary">{title}</span>
        {description ? (
          <span className="ml-1.5 text-text-tertiary/80">— {description}</span>
        ) : null}
      </p>
    );
  }

  return (
    <div
      className={
        "flex flex-col items-center justify-center text-center " +
        "py-10 px-4 rounded-md border border-border-subtle bg-bg-secondary/40 " +
        className
      }
    >
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-text-tertiary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
