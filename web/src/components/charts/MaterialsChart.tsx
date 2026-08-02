"use client";

import type { DecadeAggregation } from "@/lib/types";
import { DecadeStackedArea } from "./DecadeStackedArea";

interface MaterialsChartProps {
  data: DecadeAggregation[];
}

/** MaterialsChart — museum-object material observations by object decade. */
export function MaterialsChart({ data }: MaterialsChartProps) {
  return (
    <DecadeStackedArea
      data={data}
      topN={6}
      yLabel="museum objects"
    />
  );
}
