"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import type { TimelineSculptor } from "@/lib/types";

/** Historical events shown as vertical markers on the timeline. */
const HISTORICAL_EVENTS = [
  { year: 1893, label: "NSS Founded", color: "#f59e0b" },
  { year: 1913, label: "Armory Show", color: "#8b5cf6" },
  { year: 1914, label: "WWI Start", color: "#ef4444" },
  { year: 1918, label: "WWI End", color: "#ef4444" },
  { year: 1939, label: "WWII Start", color: "#ef4444" },
  { year: 1945, label: "WWII End", color: "#ef4444" },
];

/** Color palette for birth decades. */
const DECADE_COLORS: Record<number, string> = {
  1800: "#94a3b8", // slate
  1810: "#78716c", // stone
  1820: "#a1887f", // warm gray
  1830: "#7c6f64", // brown-gray
  1840: "#3b82f6", // blue
  1850: "#2563eb", // blue-dark
  1860: "#059669", // emerald
  1870: "#10b981", // green
  1880: "#f59e0b", // amber
  1890: "#f97316", // orange
  1900: "#ef4444", // red
  1910: "#dc2626", // red-dark
  1920: "#8b5cf6", // violet
  1930: "#7c3aed", // violet-dark
  1940: "#ec4899", // pink
  1950: "#db2777", // pink-dark
  1960: "#06b6d4", // cyan
  1970: "#0891b2", // cyan-dark
};

function getDecadeColor(decade: number): string {
  return DECADE_COLORS[decade] || "#6b7280";
}

/** Layout constants */
const LEFT_MARGIN = 200; // Name labels
const RIGHT_MARGIN = 24;
const TOP_MARGIN = 40;
const BOTTOM_MARGIN = 60;
const BAR_HEIGHT = 16;
const BAR_GAP = 6;
const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  data: TimelineSculptor[];
  showEvents?: boolean;
}

interface TooltipState {
  sculptor: TimelineSculptor;
  x: number;
  y: number;
}

export function LifespanTimeline({ data, showEvents = true }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort by birth year, then by name
  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => a.birthYear - b.birthYear || a.name.localeCompare(b.name)),
    [data]
  );

  // Compute time range
  const minYear = useMemo(
    () => Math.min(...sorted.map((s) => s.birthYear)) - 5,
    [sorted]
  );
  const maxYear = useMemo(() => {
    const latestDeath = Math.max(
      ...sorted.map((s) => s.deathYear ?? CURRENT_YEAR)
    );
    return Math.max(latestDeath, CURRENT_YEAR) + 5;
  }, [sorted]);

  // SVG dimensions
  const chartWidth = 900;
  const chartHeight =
    TOP_MARGIN + sorted.length * (BAR_HEIGHT + BAR_GAP) + BOTTOM_MARGIN;
  const plotWidth = chartWidth - LEFT_MARGIN - RIGHT_MARGIN;

  // Scale: year → x pixel
  const xScale = useCallback(
    (year: number) =>
      LEFT_MARGIN +
      ((year - minYear) / (maxYear - minYear)) * plotWidth,
    [minYear, maxYear, plotWidth]
  );

  // Generate tick years (every 20 years, rounded)
  const ticks = useMemo(() => {
    const start = Math.ceil(minYear / 20) * 20;
    const result: number[] = [];
    for (let y = start; y <= maxYear; y += 20) result.push(y);
    return result;
  }, [minYear, maxYear]);

  // Decade legend entries (only decades present in data)
  const decades = useMemo(() => {
    const set = new Set(sorted.map((s) => s.birthDecade));
    return Array.from(set).sort((a, b) => a - b);
  }, [sorted]);

  const handleMouseEnter = useCallback(
    (sculptor: TimelineSculptor, e: React.MouseEvent) => {
      setHoveredId(sculptor.id);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          sculptor,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top - 10,
        });
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeline data available.</p>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full min-w-[700px]"
        style={{ height: `${Math.max(chartHeight, 400)}px` }}
      >
        {/* X-axis grid lines + labels */}
        {ticks.map((year) => (
          <g key={`tick-${year}`}>
            <line
              x1={xScale(year)}
              y1={TOP_MARGIN - 10}
              x2={xScale(year)}
              y2={chartHeight - BOTTOM_MARGIN}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={xScale(year)}
              y={chartHeight - BOTTOM_MARGIN + 20}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {year}
            </text>
          </g>
        ))}

        {/* Historical event markers */}
        {showEvents &&
          HISTORICAL_EVENTS.map((evt) => (
            <g key={`event-${evt.year}`}>
              <line
                x1={xScale(evt.year)}
                y1={TOP_MARGIN - 10}
                x2={xScale(evt.year)}
                y2={chartHeight - BOTTOM_MARGIN}
                stroke={evt.color}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                opacity={0.7}
              />
              <text
                x={xScale(evt.year)}
                y={TOP_MARGIN - 16}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill={evt.color}
              >
                {evt.label}
              </text>
            </g>
          ))}

        {/* Sculptor bars */}
        {sorted.map((sculptor, i) => {
          const y = TOP_MARGIN + i * (BAR_HEIGHT + BAR_GAP);
          const barStart = xScale(sculptor.birthYear);
          const barEnd = xScale(sculptor.deathYear ?? CURRENT_YEAR);
          const barWidth = Math.max(barEnd - barStart, 2);
          const isHovered = hoveredId === sculptor.id;
          const isAlive = sculptor.deathYear === null;
          const color = getDecadeColor(sculptor.birthDecade);

          return (
            <g
              key={sculptor.id}
              onMouseEnter={(e) => handleMouseEnter(sculptor, e)}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer"
            >
              {/* Name label */}
              <text
                x={LEFT_MARGIN - 8}
                y={y + BAR_HEIGHT / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fontWeight={isHovered ? 700 : 400}
                className="fill-foreground"
                opacity={hoveredId && !isHovered ? 0.4 : 1}
              >
                {sculptor.name}
              </text>

              {/* Life bar */}
              <rect
                x={barStart}
                y={y}
                width={barWidth}
                height={BAR_HEIGHT}
                rx={3}
                fill={color}
                opacity={hoveredId && !isHovered ? 0.25 : 0.85}
                stroke={isHovered ? color : "none"}
                strokeWidth={isHovered ? 2 : 0}
              />

              {/* Living indicator (open-ended bar) */}
              {isAlive && (
                <>
                  <rect
                    x={barEnd - 8}
                    y={y}
                    width={8}
                    height={BAR_HEIGHT}
                    fill={color}
                    opacity={0.4}
                    rx={0}
                  />
                  <line
                    x1={barEnd}
                    y1={y + 2}
                    x2={barEnd + 6}
                    y2={y + BAR_HEIGHT / 2}
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.6}
                  />
                  <line
                    x1={barEnd}
                    y1={y + BAR_HEIGHT - 2}
                    x2={barEnd + 6}
                    y2={y + BAR_HEIGHT / 2}
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.6}
                  />
                </>
              )}

              {/* Birth year on bar (if bar is wide enough) */}
              {barWidth > 60 && (
                <text
                  x={barStart + 6}
                  y={y + BAR_HEIGHT / 2 + 4}
                  fontSize={9}
                  fill="white"
                  fontWeight={500}
                >
                  {sculptor.birthYear}
                </text>
              )}

              {/* Death year on bar (if bar is wide enough) */}
              {barWidth > 60 && sculptor.deathYear && (
                <text
                  x={barEnd - 6}
                  y={y + BAR_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="white"
                  fontWeight={500}
                >
                  {sculptor.deathYear}
                </text>
              )}
            </g>
          );
        })}

        {/* "Present" marker */}
        <g>
          <line
            x1={xScale(CURRENT_YEAR)}
            y1={TOP_MARGIN - 10}
            x2={xScale(CURRENT_YEAR)}
            y2={chartHeight - BOTTOM_MARGIN}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.3}
          />
          <text
            x={xScale(CURRENT_YEAR)}
            y={chartHeight - BOTTOM_MARGIN + 20}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
            fontStyle="italic"
          >
            Present
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg border bg-popover px-3 py-2 shadow-md"
          style={{
            left: `${Math.min(tooltip.x, chartWidth - 200)}px`,
            top: `${tooltip.y - 60}px`,
          }}
        >
          <p className="font-semibold text-sm">{tooltip.sculptor.name}</p>
          <p className="text-xs text-muted-foreground">
            {tooltip.sculptor.birthYear} –{" "}
            {tooltip.sculptor.deathYear ?? "present"}
          </p>
          {tooltip.sculptor.deathYear && (
            <p className="text-xs text-muted-foreground">
              Lived {tooltip.sculptor.deathYear - tooltip.sculptor.birthYear} years
            </p>
          )}
        </div>
      )}

      {/* Decade Color Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {decades.map((decade) => (
          <div key={decade} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: getDecadeColor(decade) }}
            />
            <span className="text-xs text-muted-foreground">{decade}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}
