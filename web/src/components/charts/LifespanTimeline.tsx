"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import type { TimelineSculptor } from "@/lib/types";

/** Point events — single vertical dashed lines. */
const POINT_EVENTS = [
  { year: 1893, label: "NSS Founded", color: "#3D7A68" },
  { year: 1913, label: "Armory Show", color: "#D4A574" },
];

/** Period events — shaded spans between start/end years. */
const PERIOD_EVENTS = [
  { start: 1914, end: 1918, label: "WWI", color: "#3D2E25" },
  { start: 1939, end: 1945, label: "WWII", color: "#3D2E25" },
];

/** Continuous color gradient for birth year.
 *  Interpolates from warm sandstone (early) → cool verdigris (late)
 *  using the Verdigris & Marble palette endpoints. */
const COLOR_WARM = { r: 0x3D, g: 0x2E, b: 0x25 }; // data-1: umber
const COLOR_COOL = { r: 0x3D, g: 0x7A, b: 0x68 }; // data-2: verdigris
const YEAR_RANGE_START = 1800;
const YEAR_RANGE_END = 1970;

function getBirthYearColor(birthYear: number): string {
  const t = Math.max(0, Math.min(1,
    (birthYear - YEAR_RANGE_START) / (YEAR_RANGE_END - YEAR_RANGE_START)
  ));
  const r = Math.round(COLOR_WARM.r + t * (COLOR_COOL.r - COLOR_WARM.r));
  const g = Math.round(COLOR_WARM.g + t * (COLOR_COOL.g - COLOR_WARM.g));
  const b = Math.round(COLOR_WARM.b + t * (COLOR_COOL.b - COLOR_WARM.b));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Layout constants */
const LEFT_MARGIN = 200; // Name labels
const RIGHT_MARGIN = 24;
const TOP_MARGIN = 64;
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
  // Suppress ticks within 15 years of CURRENT_YEAR to avoid "Present" overlap
  const ticks = useMemo(() => {
    const start = Math.ceil(minYear / 20) * 20;
    const result: number[] = [];
    for (let y = start; y <= maxYear; y += 20) {
      if (Math.abs(y - CURRENT_YEAR) >= 15) result.push(y);
    }
    return result;
  }, [minYear, maxYear]);

  // Greedy stagger for event labels — avoid overlapping text
  // Collects all labels (point events + period events), sorts by x,
  // assigns vertical tiers so no two labels overlap horizontally.
  const eventLabelLayout = useMemo(() => {
    const LABEL_MIN_WIDTH = 70; // estimated px width of a label
    const TIER_HEIGHT = 14;     // vertical offset per tier
    const BASE_Y = TOP_MARGIN - 18;

    type LabelEntry = { key: string; x: number; label: string; color: string; tier: number };

    const entries: LabelEntry[] = [
      ...POINT_EVENTS.map((e) => ({
        key: `pt-${e.year}`,
        x: xScale(e.year),
        label: e.label,
        color: e.color,
        tier: 0,
      })),
      ...PERIOD_EVENTS.map((e) => ({
        key: `pd-${e.start}`,
        x: (xScale(e.start) + xScale(e.end)) / 2,
        label: e.label,
        color: e.color,
        tier: 0,
      })),
    ].sort((a, b) => a.x - b.x);

    // Greedy: for each label, check all previously placed labels.
    // If any overlap horizontally, bump to the next tier.
    for (let i = 0; i < entries.length; i++) {
      let tier = 0;
      for (let j = 0; j < i; j++) {
        if (
          entries[j].tier === tier &&
          Math.abs(entries[i].x - entries[j].x) < LABEL_MIN_WIDTH
        ) {
          tier++;
          j = -1; // re-check from start at new tier
        }
      }
      entries[i].tier = tier;
    }

    return entries.map((e) => ({ ...e, y: BASE_Y - e.tier * TIER_HEIGHT }));
  }, [xScale]);

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
        style={{ height: `${Math.max(chartHeight, 400)}px`, fontFamily: "var(--font-body), system-ui, sans-serif" }}
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

        {/* Period event spans (wars) — shaded rectangles */}
        {showEvents &&
          PERIOD_EVENTS.map((evt) => {
            const layoutEntry = eventLabelLayout.find((e) => e.key === `pd-${evt.start}`);
            return (
              <g key={`period-${evt.start}`}>
                <rect
                  x={xScale(evt.start)}
                  y={TOP_MARGIN - 10}
                  width={xScale(evt.end) - xScale(evt.start)}
                  height={chartHeight - BOTTOM_MARGIN - TOP_MARGIN + 10}
                  fill={evt.color}
                  opacity={0.08}
                />
                <text
                  x={(xScale(evt.start) + xScale(evt.end)) / 2}
                  y={layoutEntry?.y ?? TOP_MARGIN - 18}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={evt.color}
                  opacity={0.7}
                >
                  {evt.label}
                </text>
              </g>
            );
          })}

        {/* Point event markers — single dashed lines */}
        {showEvents &&
          POINT_EVENTS.map((evt) => {
            const layoutEntry = eventLabelLayout.find((e) => e.key === `pt-${evt.year}`);
            return (
              <g key={`event-${evt.year}`}>
                <line
                  x1={xScale(evt.year)}
                  y1={TOP_MARGIN - 10}
                  x2={xScale(evt.year)}
                  y2={chartHeight - BOTTOM_MARGIN}
                  stroke={evt.color}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  opacity={0.5}
                />
                <text
                  x={xScale(evt.year)}
                  y={layoutEntry?.y ?? TOP_MARGIN - 18}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={evt.color}
                  opacity={0.7}
                >
                  {evt.label}
                </text>
              </g>
            );
          })}

        {/* Sculptor bars */}
        {sorted.map((sculptor, i) => {
          const y = TOP_MARGIN + i * (BAR_HEIGHT + BAR_GAP);
          const barStart = xScale(sculptor.birthYear);
          const barEnd = xScale(sculptor.deathYear ?? CURRENT_YEAR);
          const barWidth = Math.max(barEnd - barStart, 2);
          const isHovered = hoveredId === sculptor.id;
          const isAlive = sculptor.deathYear === null;
          const color = getBirthYearColor(sculptor.birthYear);

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
          className="absolute z-50 pointer-events-none rounded-lg px-3 py-2 shadow-md bg-bg-primary"
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

      {/* Continuous gradient legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">{decades[0] ?? 1800}s</span>
        <div
          className="h-3 rounded-sm"
          style={{
            width: 200,
            background: `linear-gradient(to right, rgb(${COLOR_WARM.r}, ${COLOR_WARM.g}, ${COLOR_WARM.b}), rgb(${COLOR_COOL.r}, ${COLOR_COOL.g}, ${COLOR_COOL.b}))`,
          }}
        />
        <span className="text-xs text-muted-foreground">{decades[decades.length - 1] ?? 1970}s</span>
      </div>
    </div>
  );
}
