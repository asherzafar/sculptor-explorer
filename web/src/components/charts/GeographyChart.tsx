"use client";

import type { DecadeAggregation } from "@/lib/types";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface GeographyChartProps {
  data: DecadeAggregation[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

/**
 * GeographyChart — stacked area of top countries of birth by decade.
 * Delegates rendering to DecadeStackedArea (D3-powered).
 */
export function GeographyChart({
  data,
  activeDecade,
  onDecadeClick,
}: GeographyChartProps) {
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
