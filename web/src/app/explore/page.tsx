import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { ExploreContent } from "./ExploreContent";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <LoadingState label="Loading Explore" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
