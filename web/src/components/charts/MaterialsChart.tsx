"use client";

import type { DecadeAggregation } from "@/lib/types";

interface MaterialsChartProps {
  data: DecadeAggregation[];
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
}

/**
 * Stub: MaterialsChart — Phase 2 D3 implementation pending
 * 
 * Will show stacked area chart of sculpture materials by decade
 * (from Met + AIC museum collections).
 */
export function MaterialsChart({
  data,
  activeDecade,
  onDecadeClick,
}: MaterialsChartProps) {
  const decades = [...new Set(data.map((d) => d.decade))].sort((a, b) => a - b);
  const categories = [...new Set(data.map((d) => d.category))];

  return (
    <div className="h-72 rounded-lg border border-border-subtle bg-bg-secondary flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-4xl mb-3" aria-hidden="true">🪨</div>
        <p className="text-text-secondary text-sm text-center mb-2">
          Materials visualization coming in Phase 2
        </p>
        <p className="text-xs text-text-tertiary text-center">
          {data.length > 0
            ? `${decades.length} decades, ${categories.length} materials`
            : "Run pipeline with museum queries to populate"}
        </p>
      </div>

      {decades.length > 0 && onDecadeClick && (
        <div className="border-t border-border-subtle px-4 py-3 flex gap-2 overflow-x-auto">
          {decades.map((decade) => {
            const active = activeDecade === decade;
            return (
              <button
                key={decade}
                onClick={() => onDecadeClick(decade)}
                aria-pressed={active}
                className={`px-2 py-1 text-xs rounded-md transition-colors tabular-nums ${
                  active
                    ? "bg-accent-primary text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-accent-muted hover:text-accent-primary"
                }`}
              >
                {decade}s
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
