"use client";

import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { EmptyState } from "@/components/EmptyState";
import type { EvolutionSeriesProjection } from "@/app/evolution/evolution-state";

/**
 * Layout constants — follow .windsurfrules chart rules:
 * no chart border, horizontal gridlines only, design tokens for all colors.
 */
const MARGIN = { top: 20, right: 16, bottom: 36, left: 40 };
const HEIGHT = 220;

/** One row per decade, categories as keys (wide format for D3 stack) */
type WideRow = { decade: number; [category: string]: number };

interface Props {
  projection: EvolutionSeriesProjection;
  activeDecade?: number | null;
  onDecadeClick?: (decade: number) => void;
  /** Ordered category names → CSS custom property colors */
  colorMap?: Record<string, string>;
  /** Label for the y-axis */
  yLabel?: string;
}

/**
 * DecadeStackedArea — Evolution's D3 renderer for a route-projected series.
 *
 * Pattern: D3 for math + rendering inside useEffect, React owns the SVG ref.
 * Follows the established LifespanTimeline D3-React pattern.
 */
export function DecadeStackedArea({
  projection,
  activeDecade,
  onDecadeClick,
  colorMap,
  yLabel,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Projection decisions live in the route-local pure helper. The chart only
  // pivots that already-reconciled projection into D3's wide stack shape.
  const categories = projection.categories;
  const wide = useMemo(
    () =>
      projection.decades.map((row) => {
        const wideRow: WideRow = { decade: row.decade };
        for (const category of categories) {
          wideRow[category] =
            row.categories.find((entry) => entry.category === category)?.count ??
            0;
        }
        return wideRow;
      }),
    [categories, projection.decades],
  );

  // ── 1. Default color map: cycle through --color-data-* tokens ──────────
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

  // ── 2. D3 render effect ────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || wide.length === 0 || categories.length === 0) return;

    const svgNode = svgRef.current;
    const container = svgNode.parentElement;
    if (!container) return;

    const render = () => {
      const width = container.clientWidth;
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
      const svg = d3.select(svgNode);
      svg.selectAll("*").remove();
      svg.attr("width", Math.max(width, 0)).attr("height", HEIGHT);
      if (innerW <= 0 || innerH <= 0) return;

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
      const decades = wide.map((row) => row.decade);
      const xScale = d3
        .scaleLinear()
        .domain([decades[0], decades[decades.length - 1]])
        .range([0, innerW]);
      const bands = decades.map((decade, index) => {
        const center = xScale(decade);
        const left =
          index === 0
            ? 0
            : (xScale(decades[index - 1]) + center) / 2;
        const right =
          index === decades.length - 1
            ? innerW
            : (center + xScale(decades[index + 1])) / 2;
        return { decade, x: left, width: Math.max(0, right - left) };
      });

      const series = d3
        .stack<WideRow>()
        .keys(categories)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone)(wide);
      const maxY = Math.max(
        1,
        d3.max(series, (seriesRow) =>
          d3.max(seriesRow, (point) => point[1]),
        ) ?? 0,
      );
      const yScale = d3
        .scaleLinear()
        .domain([0, maxY])
        .range([innerH, 0])
        .nice();

      g.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale.ticks(4))
        .join("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", (tick) => yScale(tick))
        .attr("y2", (tick) => yScale(tick))
        .attr("stroke", "var(--color-border-grid)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

      const area = d3
        .area<d3.SeriesPoint<WideRow>>()
        .x((point) => xScale(point.data.decade))
        .y0((point) => yScale(point[0]))
        .y1((point) => yScale(point[1]))
        .curve(d3.curveMonotoneX);
      g.append("g")
        .attr("class", "areas")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("data-evolution-category", (seriesRow) => seriesRow.key)
        .attr(
          "fill",
          (seriesRow) =>
            resolvedColorMap[seriesRow.key] ?? "var(--color-data-5)",
        )
        .attr("stroke", "var(--color-bg-primary)")
        .attr("stroke-width", 1)
        .attr("opacity", activeDecade != null ? 0.45 : 0.8)
        .attr("d", area);

      const activeBand = bands.find((band) => band.decade === activeDecade);
      if (activeBand) {
        g.append("rect")
          .attr("x", activeBand.x)
          .attr("y", 0)
          .attr("width", activeBand.width)
          .attr("height", innerH)
          .attr("fill", "var(--color-accent-primary)")
          .attr("fill-opacity", 0.12)
          .attr("stroke", "var(--color-accent-primary)")
          .attr("stroke-width", 2)
          .attr("pointer-events", "none");
      }

      if (onDecadeClick) {
        const hoverBands = g.append("g").attr("class", "hover-bands");
        hoverBands
          .selectAll("rect")
          .data(bands)
          .join("rect")
          .attr("x", (band) => band.x)
          .attr("y", 0)
          .attr("width", (band) => band.width)
          .attr("height", innerH)
          .attr("fill", "var(--color-accent-primary)")
          .attr("opacity", 0)
          .attr("pointer-events", "none")
          .attr("class", "hover-band");

        g.append("g")
          .attr("class", "click-targets")
          .selectAll("rect")
          .data(bands)
          .join("rect")
          .attr("data-evolution-decade-target", "true")
          .attr("data-decade", (band) => band.decade)
          .attr("x", (band) => band.x)
          .attr("y", 0)
          .attr("width", (band) => band.width)
          .attr("height", innerH)
          .attr("fill", "transparent")
          .attr("cursor", "pointer")
          .on("mouseenter", (_, band) => {
            hoverBands
              .selectAll<SVGRectElement, (typeof bands)[number]>(".hover-band")
              .attr("opacity", (candidate) =>
                candidate.decade === band.decade ? 0.1 : 0,
              );
          })
          .on("mouseleave", () => {
            hoverBands.selectAll(".hover-band").attr("opacity", 0);
          })
          .on("click", (_, band) => onDecadeClick(band.decade));
      }

      const xAxis = d3
        .axisBottom(xScale)
        .tickValues(decades.filter((_, index) => index % 2 === 0))
        .tickFormat((tick) => `${tick}s`)
        .tickSize(0)
        .tickPadding(8);
      const xAxisGroup = g
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerH})`)
        .call(xAxis);
      xAxisGroup.select(".domain").remove();
      xAxisGroup
        .selectAll("text")
        .attr("fill", "var(--color-text-tertiary)")
        .attr("font-size", "11px")
        .attr("font-family", "var(--font-body), system-ui, sans-serif");

      const yAxisGroup = g
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).ticks(4).tickSize(0).tickPadding(6));
      yAxisGroup.select(".domain").attr("stroke", "var(--color-border-axis)");
      yAxisGroup
        .selectAll("text")
        .attr("fill", "var(--color-text-tertiary)")
        .attr("font-size", "10px")
        .attr("font-family", "var(--font-body), system-ui, sans-serif");

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
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(container);
    return () => observer.disconnect();
  }, [wide, categories, resolvedColorMap, activeDecade, onDecadeClick, yLabel]);

  if (projection.decades.length === 0) {
    // No-data state for the stacked area. We deliberately do *not* explain
    // *why* the data is empty here — that's the caller's job (a chart
    // can be empty because of upstream pipeline issues, an active filter,
    // or simply a sparse decade). Keeping the message neutral lets each
    // page provide its own framing if it wants to.
    return (
      <EmptyState
        variant="block"
        title="No data for this view"
        description="This chart has nothing to plot for the current selection."
      />
    );
  }

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        className="w-full overflow-visible"
        data-evolution-chart="true"
        role="img"
        aria-label={`Stacked area chart of ${categories.join(", ")} by decade${
          yLabel ? `; vertical axis: ${yLabel}` : ""
        }.`}
      />
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
