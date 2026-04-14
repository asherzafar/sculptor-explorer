"use client";

import type { DecadeAggregation } from "@/lib/types";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface MovementsChartProps {
  data: DecadeAggregation[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
  showEvents?: boolean;
}

/**
 * MovementsChart — stacked area of art movements by decade.
 * Delegates rendering to DecadeStackedArea (D3-powered).
 * showEvents prop reserved for Phase 3 event marker overlay.
 */
export function MovementsChart({
  data,
  activeDecade,
  onDecadeClick,
}: MovementsChartProps) {
  return (
    <DecadeStackedArea
      data={data}
      topN={6}
      activeDecade={activeDecade}
      onDecadeClick={onDecadeClick}
      yLabel="sculptors"
    />
  );
}
