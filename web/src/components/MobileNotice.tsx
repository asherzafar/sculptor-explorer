import Link from "next/link";

/**
 * MobileNotice — page-level "best on desktop" panel for views that
 * genuinely don't render meaningfully on a phone.
 *
 * Why per-page rather than a global gate:
 * - The previous implementation hard-walled every mobile visitor at
 *   the layout level, so a shared link to /explore/Q123 (which is
 *   perfectly readable on a phone) bounced the same as a link to
 *   /lineage (which isn't). That was the wrong honesty.
 * - This component lets each page declare its own posture. Lineage
 *   and Evolution opt in; Timeline, Explore, About, Transparency, and
 *   the sculptor detail pages stay open.
 *
 * Usage:
 *   // Inside a page component
 *   return (
 *     <>
 *       <MobileNotice
 *         viewName="The lineage graph"
 *         reason="Force-directed networks need a wide canvas and a hover-capable cursor."
 *       />
 *       <div className="hidden md:block">
 *         {actual page content}
 *       </div>
 *     </>
 *   );
 */
export interface MobileNoticeProps {
  /** Short noun phrase, e.g. "The lineage graph" or "The evolution charts". */
  viewName: string;
  /** One sentence explaining why this view doesn't fit a phone. */
  reason: string;
}

export function MobileNotice({ viewName, reason }: MobileNoticeProps) {
  return (
    <section className="md:hidden container mx-auto px-4 py-10">
      <div className="rounded-lg border border-border-subtle bg-bg-secondary p-6">
        <h1 className="font-display text-xl font-semibold text-text-primary mb-2">
          Best viewed on desktop
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          <strong className="text-text-primary">{viewName}</strong> isn&apos;t
          available on phones. {reason}
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          A few views work well on mobile if you want to keep exploring:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/timeline"
              className="text-accent-primary hover:underline"
            >
              Timeline →
            </Link>
            <span className="text-text-tertiary">
              {" "}
              when each sculptor lived
            </span>
          </li>
          <li>
            <Link
              href="/explore"
              className="text-accent-primary hover:underline"
            >
              Explore →
            </Link>
            <span className="text-text-tertiary">
              {" "}
              search and sort the full set
            </span>
          </li>
          <li>
            <Link
              href="/about"
              className="text-accent-primary hover:underline"
            >
              About →
            </Link>
            <span className="text-text-tertiary">
              {" "}
              what the project is
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
