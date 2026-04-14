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
import type { GeographyByDecade } from "@/lib/types";

interface GeographyChartProps {
  data: GeographyByDecade[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

export function GeographyChart({
  data,
  activeDecade,
  onDecadeClick,
}: GeographyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No geography data available.</p>
      </div>
    );
  }

  // Get top countries (excluding 'decade', 'total', 'unknown')
  const allKeys = Object.keys(data[0]).filter(
    (k) => k !== "decade" && k !== "total" && k !== "unknown"
  );
  const topCountries = allKeys.slice(0, 5);

  // Assign colors
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
          {topCountries.map((country, i) => (
            <Area
              key={country}
              type="monotone"
              dataKey={country}
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
