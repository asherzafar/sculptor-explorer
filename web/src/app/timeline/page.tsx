import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { TimelineContent } from "./TimelineContent";

export default function TimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <LoadingState label="Loading timeline" />
        </div>
      }
    >
      <TimelineContent />
    </Suspense>
  );
}
