import { Suspense } from "react";
import { LineageContent } from "./LineageContent";
import { LoadingState } from "@/components/LoadingState";
import { MobileNotice } from "@/components/MobileNotice";

/**
 * Server Component wrapper. The Suspense boundary is required because
 * LineageContent uses useSearchParams() and the site builds with
 * `output: "export"` (see .windsurfrules → Critical Next.js gotchas).
 *
 * Mobile posture: this view is gated on phones — a force-directed
 * graph with hover affordances, a multi-section filter bar, and a
 * 680px-tall canvas does not survive a 375px viewport. We render
 * <MobileNotice /> below md and the full experience above. CSS-only
 * gate (display:none on the unused branch); the JSON still downloads
 * either way, which is acceptable but a future perf win if it
 * matters.
 */
export default function LineagePage() {
  return (
    <>
      <MobileNotice
        viewName="The lineage graph"
        reason="Force-directed networks need a wide canvas and hover-capable cursors to be readable."
      />
      <div className="hidden md:block">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-8">
              <LoadingState label="Loading lineage network" />
            </div>
          }
        >
          <LineageContent />
        </Suspense>
      </div>
    </>
  );
}
