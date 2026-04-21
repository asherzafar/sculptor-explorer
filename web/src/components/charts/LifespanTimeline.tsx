"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import type { TimelineSculptor } from "@/lib/types";

/** Point events — single vertical dashed lines. */
const POINT_EVENTS = [
  { year: 1893, label: "NSS Founded", color: "var(--color-accent-primary)" },
  { year: 1913, label: "Armory Show", color: "var(--color-data-4)" },
];

/** Period events — shaded spans between start/end years. */
const PERIOD_EVENTS = [
  { start: 1914, end: 1918, label: "WWI", color: "var(--color-data-1)" },
  { start: 1939, end: 1945, label: "WWII", color: "var(--color-data-1)" },
];

/** Layout constants */
const LEFT_MARGIN = 140; // Name labels (reduced from 200)
const RIGHT_MARGIN = 40; // Balanced with left
const TOP_MARGIN = 64;
const BOTTOM_MARGIN = 60;
const BAR_HEIGHT = 16;
const BAR_GAP = 6;
const CURRENT_YEAR = new Date().getFullYear();

export type SortMode = "chrono" | "alpha" | "lifespan";

interface Props {
  data: TimelineSculptor[];
  showEvents?: boolean;
  sortMode?: SortMode;
}

interface TooltipState {
  sculptor: TimelineSculptor;
  x: number;
  y: number;
}

/**
 * LifespanTimeline — D3-powered lifespan visualization
 * 
 * Uses d3-scale for mapping years to pixels, d3-axis for the x-axis,
 * and CSS custom properties (design tokens) for colors.
 */
export function LifespanTimeline({ data, showEvents = true, sortMode = "alpha" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sort based on sortMode prop
  const sorted = useMemo(() => {
    const arr = [...data];
    // Last name = final whitespace-separated token. Works for compound
    // names like "Anna Hyatt Huntington" (-> Huntington), "Daniel Chester
    // French" (-> French), and "Constantin Brâncuși" (-> Brâncuși).
    const lastName = (s: TimelineSculptor) => {
      const parts = s.name.trim().split(/\s+/);
      return parts[parts.length - 1];
    };
    switch (sortMode) {
      case "alpha":
        return arr.sort(
          (a, b) =>
            lastName(a).localeCompare(lastName(b)) ||
            a.name.localeCompare(b.name),
        );
      case "lifespan": {
        const lifespan = (s: TimelineSculptor) =>
          (s.deathYear ?? CURRENT_YEAR) - s.birthYear;
        return arr.sort((a, b) => lifespan(b) - lifespan(a) || a.name.localeCompare(b.name));
      }
      case "chrono":
      default:
        return arr.sort((a, b) => a.birthYear - b.birthYear || a.name.localeCompare(b.name));
    }
  }, [data, sortMode]);

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

  // D3 scale: year → x pixel
  const xScale = useMemo(
    () => d3.scaleLinear().domain([minYear, maxYear]).range([LEFT_MARGIN, chartWidth - RIGHT_MARGIN]),
    [minYear, maxYear, chartWidth]
  );

  // Color scale: birth year → color using D3 interpolation between design tokens
  // We use CSS variables for the endpoints, but compute interpolation in D3
  const colorScale = useMemo(() => {
    // Extract RGB values from CSS variables (or use fallbacks)
    // --color-data-1: #3D2E25 (warm/umber), --color-data-2: #3D7A68 (cool/verdigris)
    const warmColor = d3.rgb("#3D2E25");
    const coolColor = d3.rgb("#3D7A68");
    return d3.scaleLinear<string>()
      .domain([minYear, Math.min(maxYear, 1970)])
      .range([warmColor.formatHex(), coolColor.formatHex()])
      .clamp(true);
  }, [minYear, maxYear]);

  // Generate tick years using D3 axis logic
  const ticks = useMemo(() => {
    const tickCount = Math.max(5, Math.floor(plotWidth / 80));
    return xScale.ticks(tickCount).filter((y) => Math.abs(y - CURRENT_YEAR) >= 15);
  }, [xScale, plotWidth]);

  // Greedy stagger for event labels
  const eventLabelLayout = useMemo(() => {
    const LABEL_MIN_WIDTH = 70;
    const TIER_HEIGHT = 14;
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

    for (let i = 0; i < entries.length; i++) {
      let tier = 0;
      for (let j = 0; j < i; j++) {
        if (
          entries[j].tier === tier &&
          Math.abs(entries[i].x - entries[j].x) < LABEL_MIN_WIDTH
        ) {
          tier++;
          j = -1;
        }
      }
      entries[i].tier = tier;
    }

    return entries.map((e) => ({ ...e, y: BASE_Y - e.tier * TIER_HEIGHT }));
  }, [xScale]);

  // Decade legend entries
  const decades = useMemo(() => {
    const set = new Set(sorted.map((s) => s.birthDecade));
    return Array.from(set).sort((a, b) => a - b);
  }, [sorted]);

  // D3 render effect: draws axes using D3
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Clear previous axes
    svg.selectAll(".d3-axis").remove();
    
    // Create bottom axis with D3
    const axisGroup = svg.append("g")
      .attr("class", "d3-axis")
      .attr("transform", `translate(0, ${chartHeight - BOTTOM_MARGIN})`);
    
    const axis = d3.axisBottom(xScale)
      .tickValues(ticks)
      .tickFormat(d3.format("d"))
      .tickSize(0)
      .tickPadding(10);
    
    axisGroup.call(axis);
    
    // Style axis text with CSS custom properties
    axisGroup.selectAll("text")
      .attr("font-size", "11px")
      .attr("fill", "var(--color-muted-foreground)")
      .attr("font-family", "var(--font-body), system-ui, sans-serif");
    
    // Remove axis domain line
    axisGroup.select(".domain").remove();
  }, [xScale, ticks, chartHeight]);

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
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full min-w-[700px]"
        style={{ height: `${Math.max(chartHeight, 400)}px`, fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        {/* X-axis grid lines — D3 handles the axis labels in useEffect */}
        {ticks.map((year) => (
          <line
            key={`grid-${year}`}
            x1={xScale(year)}
            y1={TOP_MARGIN - 10}
            x2={xScale(year)}
            y2={chartHeight - BOTTOM_MARGIN}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
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
          const color = colorScale(sculptor.birthYear);

          const handleClick = () => {
            router.push(`/explore/${sculptor.id}`);
          };

          return (
            <g
              key={sculptor.id}
              onMouseEnter={(e) => handleMouseEnter(sculptor, e)}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
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

      {/* Continuous gradient legend using design tokens */}
      <div className="mt-4 flex items-center justify-start gap-2">
        <span className="text-xs text-muted-foreground">{decades[0] ?? 1800}s</span>
        <div
          className="h-3 rounded-sm"
          style={{
            width: 200,
            background: "linear-gradient(to right, var(--color-data-1), var(--color-data-2))",
          }}
        />
        <span className="text-xs text-muted-foreground">{decades[decades.length - 1] ?? 1970}s</span>
      </div>
    </div>
  );
}
