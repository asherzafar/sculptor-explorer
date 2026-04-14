"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MaterialByDecade } from "@/lib/types";

interface MaterialsChartProps {
  data: MaterialByDecade[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

export function MaterialsChart({
  data,
  activeDecade,
  onDecadeClick,
}: MaterialsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No material data available. Run the pipeline with museum API queries to populate.
        </p>
      </div>
    );
  }

  // Get top materials (excluding 'decade' and 'total')
  const allKeys = Object.keys(data[0]).filter(
    (k) => k !== "decade" && k !== "total"
  );
  const topMaterials = allKeys.slice(0, 5);

  // Assign colors
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

  // Handle chart click
  const handleClick = (state: any) => {
    if (state && state.activeLabel && onDecadeClick) {
      onDecadeClick(state.activeLabel);
    }
  };

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          onClick={handleClick}
          className="cursor-pointer"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="decade"
            tickFormatter={(v) => `${v}s`}
            className="text-xs fill-muted-foreground"
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          {activeDecade && (
            <ReferenceLine
              x={activeDecade}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          )}
          {topMaterials.map((material, i) => (
            <Area
              key={material}
              type="monotone"
              dataKey={material}
              stackId="1"
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={activeDecade ? 0.3 : 0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
