"use client";

import type { EvolutionSeriesProjection } from "@/app/evolution/evolution-state";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface MovementsChartProps {
  projection: EvolutionSeriesProjection;
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

/**
 * MovementsChart — stacked area of art movements by decade.
 * Delegates rendering to DecadeStackedArea (D3-powered).
 */
export function MovementsChart({
  projection,
  activeDecade,
  onDecadeClick,
}: MovementsChartProps) {
  return (
    <DecadeStackedArea
      projection={projection}
      activeDecade={activeDecade}
      onDecadeClick={onDecadeClick}
      yLabel="sculptors"
    />
  );
}
