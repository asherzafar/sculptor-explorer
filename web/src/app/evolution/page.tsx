import { Suspense } from "react";
import { EvolutionContent } from "./EvolutionContent";

/**
 * Evolution page — Server Component wrapper.
 * EvolutionContent uses useSearchParams(), which requires a Suspense boundary
 * for Next.js static export (`output: 'export'`). See .windsurfrules.
 */
export default function EvolutionPage() {
  return (
    <Suspense fallback={null}>
      <EvolutionContent />
    </Suspense>
  );
}
