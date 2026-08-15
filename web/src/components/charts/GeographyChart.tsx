"use client";

import type { EvolutionSeriesProjection } from "@/app/evolution/evolution-state";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface GeographyChartProps {
  projection: EvolutionSeriesProjection;
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

/**
 * GeographyChart — recorded geography by sculptor birth decade.
 * Delegates rendering to DecadeStackedArea (D3-powered).
 */
export function GeographyChart({
  projection,
  activeDecade,
  onDecadeClick,
}: GeographyChartProps) {
  return (
    <DecadeStackedArea
      projection={projection}
      activeDecade={activeDecade}
      onDecadeClick={onDecadeClick}
      yLabel="sculptors"
    />
  );
}
