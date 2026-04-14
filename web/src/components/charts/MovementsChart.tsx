"use client";

import type { DecadeAggregation } from "@/lib/types";

interface MovementsChartProps {
  data: DecadeAggregation[];
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

/**
 * Stub: MovementsChart — Phase 2 D3 implementation pending
 * 
 * Will show stacked area chart of art movements by decade,
 * with historical event markers.
 */
export function MovementsChart({
  data,
  activeDecade,
  onDecadeClick,
}: MovementsChartProps) {
  const decades = [...new Set(data.map((d) => d.decade))].sort((a, b) => a - b);

  return (
    <div className="h-72 rounded-lg border bg-card flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-4xl mb-3">🎨</div>
        <p className="text-muted-foreground text-sm text-center mb-2">
          Movements visualization coming in Phase 2
        </p>
        <p className="text-xs text-muted-foreground/70 text-center">
          {data.length > 0
            ? `${decades.length} decades, ${HISTORICAL_EVENTS.length} historical events`
            : "No data available"}
        </p>
      </div>

      {decades.length > 0 && onDecadeClick && (
        <div className="border-t px-4 py-3 flex gap-2 overflow-x-auto">
          {decades.map((decade) => (
            <button
              key={decade}
              onClick={() => onDecadeClick(decade)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                activeDecade === decade
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent hover:bg-accent/80"
              }`}
            >
              {decade}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
