"use client";

import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import type { DecadeAggregation } from "@/lib/types";

/**
 * Layout constants — follow .windsurfrules chart rules:
 * no chart border, horizontal gridlines only, design tokens for all colors.
 */
const MARGIN = { top: 20, right: 16, bottom: 36, left: 40 };
const HEIGHT = 220;

/** One row per decade, categories as keys (wide format for D3 stack) */
type WideRow = { decade: number; [category: string]: number };

interface Props {
  data: DecadeAggregation[];
  /** Top N categories to show; remainder collapsed into "Other" */
  topN?: number;
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
  /** Ordered category names → CSS custom property colors */
  colorMap?: Record<string, string>;
  /** Label for the y-axis */
  yLabel?: string;
}

/**
 * DecadeStackedArea — reusable D3 stacked area chart for tidy decade data.
 *
 * Pattern: D3 for math + rendering inside useEffect, React owns the SVG ref.
 * Follows the established LifespanTimeline D3-React pattern.
 */
export function DecadeStackedArea({
  data,
  topN = 6,
  activeDecade,
  onDecadeClick,
  colorMap,
  yLabel,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // ── 1. Pivot tidy → wide, determine top categories ─────────────────────
  const { wide, categories } = useMemo(() => {
    if (data.length === 0) return { wide: [], categories: [] };

    // Collect all category totals (excluding "Other" and "Unknown")
    const totals = new Map<string, number>();
    for (const row of data) {
      if (row.category === "Other" || row.category === "Unknown") continue;
      totals.set(row.category, (totals.get(row.category) ?? 0) + row.count);
    }

    // Top N by total count (excluding Other/Unknown)
    const sorted = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([cat]) => cat);

    // Always put "Other" last if it exists in data
    const hasOther = data.some(
      (d) => d.category === "Other" || d.category === "Unknown"
    );
    const finalCategories = hasOther ? [...sorted, "Other"] : sorted;

    // Pivot: group by decade
    const byDecade = new Map<number, WideRow>();
    for (const row of data) {
      if (!byDecade.has(row.decade)) {
        byDecade.set(row.decade, { decade: row.decade });
      }
      const wide = byDecade.get(row.decade)!;
      // Collapse Unknown → Other
      const cat =
        row.category === "Unknown"
          ? "Other"
          : sorted.includes(row.category)
          ? row.category
          : "Other";
      wide[cat] = (wide[cat] ?? 0) + row.count;
    }

    // Fill missing categories with 0
    const wideRows = [...byDecade.values()].sort((a, b) => a.decade - b.decade);
    for (const row of wideRows) {
      for (const cat of finalCategories) {
        if (row[cat] === undefined) row[cat] = 0;
      }
    }

    return { wide: wideRows, categories: finalCategories };
  }, [data, topN]);

  // ── 2. Default color map: cycle through --color-data-* tokens ──────────
  const resolvedColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const tokens = [
      "var(--color-data-2)", // verdigris
      "var(--color-data-4)", // sandstone
      "var(--color-data-3)", // sage
      "var(--color-data-8)", // navy
      "var(--color-data-5)", // warm grey
      "var(--color-data-6)", // pale green
      "var(--color-data-1)", // umber (darkest — good for Other)
    ];
    categories.forEach((cat, i) => {
      map[cat] = colorMap?.[cat] ?? tokens[i % tokens.length];
    });
    return map;
  }, [categories, colorMap]);

  // ── 3. D3 render effect ────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || wide.length === 0 || categories.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth ?? 500;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", HEIGHT);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Scales
    const decades = wide.map((d) => d.decade);
    const xScale = d3
      .scaleLinear()
      .domain([decades[0], decades[decades.length - 1]])
      .range([0, innerW]);

    const stack = d3
      .stack<WideRow>()
      .keys(categories)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(wide);

    const maxY = d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 0;
    const yScale = d3.scaleLinear().domain([0, maxY]).range([innerH, 0]).nice();

    // Horizontal gridlines — as per .windsurfrules
    const yTicks = yScale.ticks(4);
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yTicks)
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "var(--color-border-grid)")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Area generator
    const area = d3
      .area<d3.SeriesPoint<WideRow>>()
      .x((d) => xScale(d.data.decade))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Stacked areas
    g.append("g")
      .attr("class", "areas")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", (s) => resolvedColorMap[s.key] ?? "var(--color-data-5)")
      .attr("opacity", activeDecade != null ? 0.35 : 0.75)
      .attr("d", area);

    // Active decade highlight band
    if (activeDecade != null) {
      const bandWidth = innerW / Math.max(decades.length - 1, 1);
      g.append("rect")
        .attr("x", xScale(activeDecade) - bandWidth / 2)
        .attr("y", 0)
        .attr("width", bandWidth)
        .attr("height", innerH)
        .attr("fill", "var(--color-accent-primary)")
        .attr("opacity", 0.15)
        .attr("pointer-events", "none");
    }

    // Hover highlight bands — visible on hover for affordance
    if (onDecadeClick) {
      const bandW = innerW / Math.max(decades.length - 1, 1);

      // Hover bands (subtle, appear on hover)
      const hoverBands = g.append("g").attr("class", "hover-bands");
      hoverBands
        .selectAll("rect")
        .data(decades)
        .join("rect")
        .attr("x", (d) => xScale(d) - bandW / 2)
        .attr("y", 0)
        .attr("width", bandW)
        .attr("height", innerH)
        .attr("fill", "var(--color-accent-primary)")
        .attr("opacity", 0)
        .attr("pointer-events", "none")
        .attr("class", "hover-band");

      // Click target overlay — invisible rects per decade for click handling + hover
      g.append("g")
        .attr("class", "click-targets")
        .selectAll("rect")
        .data(decades)
        .join("rect")
        .attr("x", (d) => xScale(d) - bandW / 2)
        .attr("y", 0)
        .attr("width", bandW)
        .attr("height", innerH)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("mouseenter", function (_, d) {
          // Show hover band
          hoverBands
            .selectAll<SVGRectElement, number>(".hover-band")
            .attr("opacity", (bandDecade) => (bandDecade === d ? 0.08 : 0));
        })
        .on("mouseleave", function () {
          // Hide all hover bands
          hoverBands.selectAll(".hover-band").attr("opacity", 0);
        })
        .on("click", (_, d) => onDecadeClick(d));
    }

    // X axis — bottom, decade ticks
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(decades.filter((_, i) => i % 2 === 0)) // every other decade
      .tickFormat((d) => `${d}s`)
      .tickSize(0)
      .tickPadding(8);

    const xAxisG = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);

    xAxisG.select(".domain").remove();
    xAxisG
      .selectAll("text")
      .attr("fill", "var(--color-text-tertiary)")
      .attr("font-size", "11px")
      .attr("font-family", "var(--font-body), system-ui, sans-serif");

    // Y axis — left, minimal
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(6);

    const yAxisG = g.append("g").attr("class", "y-axis").call(yAxis);
    yAxisG.select(".domain").attr("stroke", "var(--color-border-axis)");
    yAxisG
      .selectAll("text")
      .attr("fill", "var(--color-text-tertiary)")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-body), system-ui, sans-serif");

    // Optional y-axis label
    if (yLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -MARGIN.left + 10)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-tertiary)")
        .attr("font-size", "10px")
        .attr("font-family", "var(--font-body), system-ui, sans-serif")
        .text(yLabel);
    }
  }, [wide, categories, resolvedColorMap, activeDecade, onDecadeClick, yLabel]);

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No data available.
      </p>
    );
  }

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full overflow-visible" />
      {/* Colour legend — direct labels preferred per .windsurfrules */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {categories.map((cat) => (
          <span
            key={cat}
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: resolvedColorMap[cat] }}
            />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
