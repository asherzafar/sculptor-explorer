"use client";

import { useEffect, useState } from "react";
import type { TimelineSculptor } from "@/lib/types";
import { loadTimelineSculptors } from "@/lib/data";
import { LifespanTimeline } from "@/components/charts/LifespanTimeline";

export default function TimelinePage() {
  const [sculptors, setSculptors] = useState<TimelineSculptor[]>([]);
  const [loading, setLoading] = useState(true);

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
        <p className="text-muted-foreground max-w-2xl">
          A visual timeline of {sculptors.length} sculptors curated with the
          National Sculpture Society, showing when they lived. Bars are
          color-coded by birth decade. This list emphasizes the American
          figurative tradition and is not a comprehensive survey of global
          sculpture.
        </p>
      </div>

      <LifespanTimeline data={sculptors} showEvents={true} />
    </div>
  );
}
