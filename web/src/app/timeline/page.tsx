"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { TimelineSculptor } from "@/lib/types";
import { loadTimelineSculptors } from "@/lib/data";
import { LifespanTimeline, type SortMode } from "@/components/charts/LifespanTimeline";

const SORT_OPTIONS: { key: SortMode; label: string; title: string }[] = [
  { key: "chrono",   label: "Chronological", title: "Sort by birth year" },
  { key: "alpha",    label: "Alphabetical",  title: "Sort A → Z by name" },
  { key: "lifespan", label: "Lifespan",      title: "Sort by years lived (longest first)" },
  { key: "movement", label: "Movement",      title: "Group by artistic movement, then birth year" },
];

function TimelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sculptors, setSculptors] = useState<TimelineSculptor[]>([]);
  const [loading, setLoading] = useState(true);

  const rawSort = searchParams.get("sort");
  const sortMode: SortMode =
    rawSort === "alpha" || rawSort === "lifespan" || rawSort === "movement"
      ? rawSort
      : "chrono";

  function setSortMode(mode: SortMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "chrono") {
      params.delete("sort");
    } else {
      params.set("sort", mode);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await loadTimelineSculptors();
        setSculptors(data);
      } catch (err) {
        console.error("Failed to load timeline data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Notable Sculptors — Lifespans
        </h1>
        <p className="text-muted-foreground">
          A visual timeline of {sculptors.length} sculptors curated with the
          National Sculpture Society, showing when they lived. Bars are
          color-coded by birth decade. This list emphasizes the American
          figurative tradition and is not a comprehensive survey of global
          sculpture.
        </p>
      </div>

      {/* Sort controls */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Sort:</span>
        {SORT_OPTIONS.map(({ key, label, title }) => (
          <button
            key={key}
            title={title}
            onClick={() => setSortMode(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sortMode === key
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-accent-primary/20 hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <LifespanTimeline data={sculptors} showEvents={true} sortMode={sortMode} />
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    }>
      <TimelineContent />
    </Suspense>
  );
}
