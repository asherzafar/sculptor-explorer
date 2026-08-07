"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import type { TimelineSculptor } from "@/lib/types";
import {
  sortTimelineSculptors,
  timelineSortDescription,
  type TimelineSort,
} from "@/app/timeline/timeline-state";

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
const ROW_HEIGHT = 24;
const CURRENT_YEAR = new Date().getFullYear();

export type SortMode = TimelineSort;

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
  const containerRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const sorted = useMemo(
    () => sortTimelineSculptors(data, sortMode),
    [data, sortMode],
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
    TOP_MARGIN + sorted.length * ROW_HEIGHT + BOTTOM_MARGIN;
  const plotWidth = chartWidth - LEFT_MARGIN - RIGHT_MARGIN;

  // D3 scale: year → x pixel
  const xScale = useMemo(
    () => d3.scaleLinear().domain([minYear, maxYear]).range([LEFT_MARGIN, chartWidth - RIGHT_MARGIN]),
    [minYear, maxYear, chartWidth]
  );

  // Resolve the ordered ramp from design tokens in CSS rather than embedding
  // a second copy of the palette in component code.
  const warmColorWeight = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([minYear, Math.min(maxYear, 1970)])
      .range([100, 0])
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
  const openEndedCount = useMemo(
    () => sorted.filter((sculptor) => sculptor.deathYear === null).length,
    [sorted],
  );

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
          x: Math.max(12, Math.min(e.clientX - rect.left, rect.width - 220)),
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
      <p className="text-text-tertiary text-sm">No timeline data available.</p>
    );
  }

  return (
    <figure ref={containerRef} className="relative w-full">
      <figcaption className="mb-3">
        <p className="font-display text-xl text-text-primary">
          Visual lifespan overview
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Select any row to open that sculptor’s record. A structured version
          of the same sorted records follows the chart.
        </p>
      </figcaption>
      <p id="timeline-chart-description" className="sr-only">
        Horizontal position and bar length encode recorded birth and death
        years. For {openEndedCount} records without a death year, an open-ended
        bar extends to {CURRENT_YEAR} only as a display convention. Birth year
        is also written in each bar, so exact dates do not depend on color.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        role="img"
        aria-label={`Timeline of ${sorted.length} focus sculptor lifespans from ${minYear} to ${maxYear}, in ${timelineSortDescription(sortMode)}.`}
        aria-describedby="timeline-chart-description"
        data-testid="timeline-chart"
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
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--color-text-primary)"
                  opacity={0.85}
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
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--color-text-primary)"
                  opacity={0.85}
                >
                  {evt.label}
                </text>
              </g>
            );
          })}

        {/* Sculptor bars */}
        {sorted.map((sculptor, i) => {
          const rowY = TOP_MARGIN + i * ROW_HEIGHT;
          const y = rowY + (ROW_HEIGHT - BAR_HEIGHT) / 2;
          const barStart = xScale(sculptor.birthYear);
          const barEnd = xScale(sculptor.deathYear ?? CURRENT_YEAR);
          const barWidth = Math.max(barEnd - barStart, 2);
          const isHovered = hoveredId === sculptor.id;
          const isOpenEnded = sculptor.deathYear === null;
          const color = `color-mix(in oklch, var(--color-data-1) ${warmColorWeight(
            sculptor.birthYear,
          )}%, var(--color-data-2))`;

          const handleClick = () => {
            router.push(`/explore/${sculptor.id}`);
          };

          return (
            <g
              key={sculptor.id}
              data-sculptor-id={sculptor.id}
              onMouseEnter={(e) => handleMouseEnter(sculptor, e)}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              className="cursor-pointer"
            >
              <rect
                x={0}
                y={rowY}
                width={chartWidth}
                height={ROW_HEIGHT}
                fill="transparent"
                pointerEvents="all"
                data-timeline-row-target="true"
              />
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

              {/* A missing death year is drawn open-ended, not asserted alive. */}
              {isOpenEnded && (
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

        {/* Current-year marker */}
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
            {CURRENT_YEAR}
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg px-3 py-2 shadow-md bg-bg-primary"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 60}px`,
          }}
        >
          <p className="font-semibold text-sm">{tooltip.sculptor.name}</p>
          <p className="text-xs text-text-secondary">
            {tooltip.sculptor.birthYear} –{" "}
            {tooltip.sculptor.deathYear ?? "death year not recorded"}
          </p>
          {tooltip.sculptor.deathYear && (
            <p className="text-xs text-text-secondary">
              Lived {tooltip.sculptor.deathYear - tooltip.sculptor.birthYear} years
            </p>
          )}
          {tooltip.sculptor.deathYear === null ? (
            <p className="text-xs text-text-secondary">
              Bar shown through {CURRENT_YEAR} as a display convention
            </p>
          ) : null}
        </div>
      )}

      {/* Continuous gradient legend using design tokens */}
      <div className="mt-4 flex flex-wrap items-center justify-start gap-2 text-xs text-text-secondary">
        <span>Birth decade:</span>
        <span>{decades[0] ?? 1800}s</span>
        <div
          aria-hidden="true"
          className="h-3 rounded-sm"
          style={{
            width: 200,
            background: "linear-gradient(to right, var(--color-data-1), var(--color-data-2))",
          }}
        />
        <span>{decades[decades.length - 1] ?? 1970}s</span>
      </div>
    </figure>
  );
}
