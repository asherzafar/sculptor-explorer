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
import type { MovementByDecade } from "@/lib/types";

interface MovementsChartProps {
  data: MovementByDecade[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
  showEvents?: boolean;
}

const HISTORICAL_EVENTS = [
  { year: 1893, label: "NSS founded" },
  { year: 1913, label: "Armory Show" },
  { year: 1918, label: "WWI ends" },
  { year: 1939, label: "WWII begins" },
  { year: 1945, label: "WWII ends" },
];

export function MovementsChart({
  data,
  activeDecade,
  onDecadeClick,
  showEvents = true,
}: MovementsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No movement data available.</p>
      </div>
    );
  }

  // Get top movements (excluding 'decade' and 'total')
  const allKeys = Object.keys(data[0]).filter(
    (k) => k !== "decade" && k !== "total"
  );
  const topMovements = allKeys.slice(0, 5);

  // Assign colors
  const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

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
          {showEvents &&
            HISTORICAL_EVENTS.map((event) => (
              <ReferenceLine
                key={event.year}
                x={Math.floor(event.year / 10) * 10}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{
                  value: event.label,
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
            ))}
          {activeDecade && (
            <ReferenceLine
              x={activeDecade}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          )}
          {topMovements.map((movement, i) => (
            <Area
              key={movement}
              type="monotone"
              dataKey={movement}
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
