import { Suspense } from "react";
import { EvolutionContent } from "./EvolutionContent";
import { MobileNotice } from "@/components/MobileNotice";

/**
 * Evolution page — Server Component wrapper.
 * EvolutionContent uses useSearchParams(), which requires a Suspense boundary
 * for Next.js static export (`output: 'export'`). See .windsurfrules.
 *
 * Mobile posture: gated. The two-column charts grid (geography +
 * movements + materials) only makes sense at lg breakpoints; below
 * that the chart axes compress and the click-to-filter affordance is
 * lost without a hover state.
 */
export default function EvolutionPage() {
  return (
    <>
      <MobileNotice
        viewName="The evolution charts"
        reason="The decade-by-decade stacked area charts depend on hover for legends and a wide canvas to read."
      />
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <EvolutionContent />
        </Suspense>
      </div>
    </>
  );
}
