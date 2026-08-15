import { Suspense } from "react";
import { EvolutionContent } from "./EvolutionContent";

export const metadata = {
  title: "Evolution",
  description:
    "Recorded geography and movement labels by sculptor birth decade, plus a separate bounded museum-object materials view.",
};

/**
 * Evolution page — Server Component wrapper.
 * EvolutionContent uses useSearchParams(), which requires a Suspense boundary
 * for Next.js static export (`output: 'export'`). See .windsurfrules.
 *
 * The client component owns the chart/structured responsive branch so the D3
 * module is not mounted or requested below its useful width.
 */
export default function EvolutionPage() {
  return (
    <Suspense fallback={null}>
      <EvolutionContent />
    </Suspense>
  );
}
