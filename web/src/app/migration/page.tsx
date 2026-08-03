import { Suspense } from "react";
import { MigrationContent } from "./MigrationContent";
import { MobileNotice } from "@/components/MobileNotice";

export const metadata = {
  title: "Migration",
  description:
    "Recorded birth- and death-country endpoints for published sculptors, with explicit coverage limits; not reconstructed journeys.",
};

/**
 * Migration page — Server Component wrapper.
 *
 * Why this is a separate page (not a chart on /evolution): the recorded
 * endpoint comparison is a focused project question, not a side detail. It
 * deserves its own headline stat, a Sankey large enough to read country
 * names, and a side panel for sculptor sample lists. Cramming it into
 * the evolution charts grid would compress all three into uselessness.
 *
 * MigrationContent uses useSearchParams() for the decade filter, so a
 * Suspense boundary is required for static export.
 */
export default function MigrationPage() {
  return (
    <>
      <MobileNotice
        viewName="The migration view"
        reason="The Sankey chart needs a wide canvas to render dozens of country labels and corridor widths legibly."
      />
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <MigrationContent />
        </Suspense>
      </div>
    </>
  );
}
