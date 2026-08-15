"use client";

import type { EvolutionSeriesProjection } from "@/app/evolution/evolution-state";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface MaterialsChartProps {
  projection: EvolutionSeriesProjection;
}

/** MaterialsChart — museum-object material observations by object decade. */
export function MaterialsChart({ projection }: MaterialsChartProps) {
  return (
    <DecadeStackedArea
      projection={projection}
      yLabel="museum objects"
    />
  );
}
