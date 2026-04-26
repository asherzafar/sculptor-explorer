import { Suspense } from "react";
import { LineageContent } from "./LineageContent";

/**
 * Server Component wrapper. The Suspense boundary is required because
 * LineageContent uses useSearchParams() and the site builds with
 * `output: "export"` (see .windsurfrules → Critical Next.js gotchas).
 */
export default function LineagePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <p className="text-text-secondary">Loading lineage network...</p>
        </div>
      }
    >
      <LineageContent />
    </Suspense>
  );
}
