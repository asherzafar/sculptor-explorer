import type { ReactNode } from "react";

/**
 * PageHeader — single source of truth for top-of-page layout.
 *
 * Why this exists: each page (Explore, Lineage, Timeline, Evolution,
 * Transparency, About) was rolling its own header. The discrepancies
 * were small individually — `mb-6` vs `mb-8`, `text-muted-foreground`
 * vs `text-text-secondary`, `max-w-3xl` on one page only — but visible
 * when navigating between tabs, and they undermine the typographic
 * confidence the project otherwise displays.
 *
 * Conventions baked in:
 * - Title: Fraunces display, semibold, balanced text-wrap. Size hops
 *   cleanly from md to lg breakpoint so it reads as a confident hero
 *   on desktop without overwhelming smaller widths.
 * - Subtitle: `text-text-secondary` (project token, NOT
 *   `text-muted-foreground` from shadcn — the project palette wins).
 *   Constrained to `max-w-3xl` so prose doesn't run as long lines on
 *   wide screens; reading rhythm matters even on a stats page.
 * - Vertical rhythm: `mb-8` below the header — large enough to feel
 *   like a section break, not so large that filter bars float.
 * - `eyebrow` slot: small label above the title (e.g. a back-link or a
 *   breadcrumb-style category tag). Replaces the ad-hoc inline `<Link>`
 *   pattern previously used on /transparency.
 * - `actions` slot: right-aligned controls that belong with the title
 *   (e.g. a "View source" or "Re-run pipeline" link). Use sparingly;
 *   filter bars belong below the header, not in it.
 *
 * Usage:
 *   <PageHeader
 *     title="Lineage"
 *     subtitle="Mentor–student relationships sourced from Wikidata…"
 *   />
 *
 * If you have a sub-rule like "show interaction hint" or a stat banner,
 * render it *after* the PageHeader as a separate element. Don't try to
 * cram it into this component — that's how design systems calcify.
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Override the bottom margin in unusual cases. Defaults to mb-8. */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className = "mb-8",
}: PageHeaderProps) {
  return (
    <header className={className}>
      {eyebrow ? (
        <div className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-text-tertiary">
          {eyebrow}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-6">
        <h1
          className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-text-primary text-balance"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
        {actions ? (
          <div className="shrink-0 flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm text-text-secondary leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
