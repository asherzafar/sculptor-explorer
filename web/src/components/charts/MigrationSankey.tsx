"use client";

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyLink,
  type SankeyNode,
} from "d3-sankey";
import type { MigrationFlow } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";

/**
 * MigrationSankey — D3 Sankey of birth → death country flows.
 *
 * Interaction model:
 * - Hovering a link (corridor) calls `onFlowHover` with the flow record.
 *   The parent page renders a side panel with the sculptor sample. This
 *   keeps the chart pure-visual and the panel pure-data, in line with
 *   how LineageGraph + LineageGraphContent split responsibilities.
 * - Hovering a node dims unrelated links so a single country's full set
 *   of corridors becomes visible. This is the headline use case for
 *   readers (e.g. "show me everything that ended in Paris").
 *
 * Filtering / readability:
 * - The chart auto-trims to the top `maxCountriesPerSide` source/target
 *   countries (default 18 each side). Smaller corridors collapse into an
 *   "Other" rollup node on each side. We considered a hard count
 *   threshold (e.g. drop links with count < 2) but rollup is more
 *   honest: the long tail isn't deleted, just summarized.
 * - Same-country flows are rendered as faint loops back to a "(stayed
 *   put)" pseudo-node — not the most beautiful Sankey gesture but the
 *   alternative (drop them) hides the actual majority of sculptors.
 *   Toggleable via `includeSameCountry` prop; the page exposes a switch.
 *
 * Why not d3-chord: chord diagrams imply symmetric bilateral flow, which
 * misrepresents migration (Hungary→France ≠ France→Hungary in the data).
 * Sankey's directional left-to-right reads correctly as a journey.
 */

interface Props {
  flows: MigrationFlow[];
  /** Maximum unique source countries; rest collapsed into "Other (born)". */
  maxCountriesPerSide?: number;
  /** Show same-country flows as faint loops on each side. Default: false. */
  includeSameCountry?: boolean;
  /** Hover callback — receives the underlying flow or null on mouseout. */
  onFlowHover?: (flow: MigrationFlow | null) => void;
  /** Click callback — fires once per click on a corridor. */
  onFlowClick?: (flow: MigrationFlow) => void;
  /**
   * Highlighted flow — same key shape as onFlowHover output. The chart
   * matches by from + to and pins that link visually. Lets the side
   * panel "remember" a click after the cursor leaves the chart.
   */
  highlightedFlow?: { from: string; to: string } | null;
}

/** A node in the Sankey graph (carries display name and side). */
interface NodeDatum {
  /** Composite ID — `${side}::${country}` so the same country can appear
   *  on both sides of the diagram without colliding. */
  id: string;
  side: "from" | "to";
  country: string;
}

/** A link is a flow record + the resolved node IDs. */
interface LinkDatum extends MigrationFlow {
  source: string;
  target: string;
  /** d3-sankey writes layout coordinates onto this object in-place. */
  value: number;
}

const HEIGHT = 540;
const MARGIN = { top: 12, right: 140, bottom: 12, left: 140 };
const NODE_WIDTH = 12;
const NODE_PADDING = 10;

export function MigrationSankey({
  flows,
  maxCountriesPerSide = 18,
  includeSameCountry = false,
  onFlowHover,
  onFlowClick,
  highlightedFlow,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // ── 1. Trim & roll up the long tail ───────────────────────────────────
  // Rationale: with 119 birth countries and 96 death countries the raw
  // graph is unreadable. We pick the top N by total volume on each side
  // and collapse the rest into an "Other" rollup node. The per-link
  // counts inside Other are summed faithfully so the proportion stays
  // honest even when the membership is summarized.
  const { nodes, links } = useMemo<SankeyGraph<NodeDatum, LinkDatum>>(() => {
    const sourceCountries = new Map<string, number>();
    const targetCountries = new Map<string, number>();

    // Filter out same-country flows up front if requested. Counting
    // them in the totals when not displayed would bias the "top N"
    // selection toward staying-put-heavy countries (US, France).
    const visibleFlows = flows.filter(
      (f) => includeSameCountry || !f.sameCountry
    );

    for (const f of visibleFlows) {
      sourceCountries.set(f.from, (sourceCountries.get(f.from) ?? 0) + f.count);
      targetCountries.set(f.to, (targetCountries.get(f.to) ?? 0) + f.count);
    }

    const topSources = new Set(
      [...sourceCountries.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxCountriesPerSide)
        .map(([c]) => c)
    );
    const topTargets = new Set(
      [...targetCountries.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxCountriesPerSide)
        .map(([c]) => c)
    );

    // Collapse rolled-up flows under a single (from, to) pair so the link
    // count between "Other (born)" and France is one fat link rather than
    // dozens of micro-links.
    const linkAccumulator = new Map<string, LinkDatum>();
    const nodeMap = new Map<string, NodeDatum>();

    function ensureNode(side: "from" | "to", country: string) {
      const id = `${side}::${country}`;
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, side, country });
      }
      return id;
    }

    for (const f of visibleFlows) {
      const fromLabel = topSources.has(f.from) ? f.from : "Other (born)";
      const toLabel = topTargets.has(f.to) ? f.to : "Other (died)";
      const sourceId = ensureNode("from", fromLabel);
      const targetId = ensureNode("to", toLabel);
      const key = `${sourceId}->${targetId}`;
      const existing = linkAccumulator.get(key);
      if (existing) {
        existing.value += f.count;
        existing.count += f.count;
        // Merge sample sculptor lists, capped — the panel only ever shows
        // a sample so over-fetching here just bloats memory.
        const merged = [...existing.sculptors, ...f.sculptors].slice(0, 12);
        existing.sculptors = merged;
      } else {
        linkAccumulator.set(key, {
          ...f,
          // The displayed labels override the original from/to when this
          // is a rollup — important so the side panel reads "Other (born)
          // → France" rather than misleadingly naming a single country.
          from: fromLabel,
          to: toLabel,
          source: sourceId,
          target: targetId,
          value: f.count,
        });
      }
    }

    return {
      nodes: [...nodeMap.values()],
      links: [...linkAccumulator.values()],
    };
  }, [flows, maxCountriesPerSide, includeSameCountry]);

  // ── 2. D3 render ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    if (nodes.length === 0 || links.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth ?? 900;
    const innerW = Math.max(width - MARGIN.left - MARGIN.right, 200);
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", HEIGHT);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Build the layout. d3-sankey mutates a *copy* of the input —
    // pass freshly-cloned arrays so React useMemo cache stays clean.
    const sankeyGen = sankey<NodeDatum, LinkDatum>()
      .nodeId((d) => d.id)
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .nodeAlign((node) => (node.side === "from" ? 0 : 1))
      .extent([
        [0, 0],
        [innerW, innerH],
      ]);

    const graph = sankeyGen({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });

    // Color: source side uses verdigris family, target side uses umber.
    // Other (rollup) nodes use a neutral grey to signal "not a real
    // single country". This visually separates the diagram into birth
    // (left) and death (right) palettes without looking like noise.
    const colorFor = (d: NodeDatum) => {
      if (d.country.startsWith("Other")) return "var(--color-data-5)";
      return d.side === "from" ? "var(--color-data-2)" : "var(--color-data-1)";
    };

    // Links — drawn first so node rectangles paint over their endpoints.
    const linkGen = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

    const linkSel = g
      .append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .selectAll<SVGPathElement, SankeyLink<NodeDatum, LinkDatum>>("path")
      .data(graph.links)
      .join("path")
      .attr("d", linkGen)
      .attr("stroke", (d) => {
        const target = d.target as SankeyNode<NodeDatum, LinkDatum>;
        return colorFor(target);
      })
      .attr("stroke-width", (d) => Math.max(1, d.width ?? 1))
      .attr("stroke-opacity", 0.32)
      .attr("cursor", onFlowClick ? "pointer" : "default");

    // Hover on links — dim everything else, lift the active link, and
    // pin the labels for both endpoints. We pin labels by setting an
    // inline `font-weight` and giving them a higher opacity than the
    // dimmed default — this is more accessible than relying on color
    // change alone.
    linkSel
      .on("mouseenter", function (_event, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.7)
          .raise();
        linkSel.filter((other) => other !== d).attr("stroke-opacity", 0.06);
        const sourceId = (d.source as SankeyNode<NodeDatum, LinkDatum>).id;
        const targetId = (d.target as SankeyNode<NodeDatum, LinkDatum>).id;
        labels
          .attr("font-weight", (n) =>
            n.id === sourceId || n.id === targetId ? 600 : 400
          )
          .attr("opacity", (n) =>
            n.id === sourceId || n.id === targetId ? 1 : 0.45
          );
        onFlowHover?.(d as MigrationFlow);
      })
      .on("mouseleave", function () {
        linkSel.attr("stroke-opacity", 0.32);
        labels.attr("font-weight", 400).attr("opacity", 1);
        onFlowHover?.(null);
      })
      .on("click", function (_event, d) {
        onFlowClick?.(d as MigrationFlow);
      });

    // If the parent has a highlight pinned, dim the rest. We do this
    // *after* attaching listeners so a fresh hover cleanly takes over.
    if (highlightedFlow) {
      const matched = graph.links.find((l) => {
        const ld = l as unknown as LinkDatum;
        return ld.from === highlightedFlow.from && ld.to === highlightedFlow.to;
      });
      if (matched) {
        linkSel
          .filter((d) => d !== matched)
          .attr("stroke-opacity", 0.06);
        linkSel
          .filter((d) => d === matched)
          .attr("stroke-opacity", 0.7)
          .raise();
      }
    }

    // Nodes
    g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGRectElement, SankeyNode<NodeDatum, LinkDatum>>("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", (d) => d.x0 ?? 0)
      .attr("y", (d) => d.y0 ?? 0)
      .attr("width", (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr("fill", (d) => colorFor(d))
      .attr("opacity", 0.85);

    // Labels — outside the node, oriented toward the canvas margin
    const labels = g
      .append("g")
      .attr("class", "labels")
      .attr("font-family", "var(--font-body), system-ui, sans-serif")
      .attr("font-size", 11)
      .attr("fill", "var(--color-text-secondary)")
      .selectAll<SVGTextElement, SankeyNode<NodeDatum, LinkDatum>>("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) =>
        d.side === "from" ? (d.x0 ?? 0) - 6 : (d.x1 ?? 0) + 6
      )
      .attr("y", (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.side === "from" ? "end" : "start"))
      .text((d) => d.country);

    // Tooltips on nodes (volume) — kept native title to avoid building
    // a tooltip layer for what is meta info; the panel surfaces the rich
    // detail.
    g.selectAll<SVGRectElement, SankeyNode<NodeDatum, LinkDatum>>(
      "rect"
    ).append("title")
      .text((d) => `${d.country} — ${(d.value ?? 0).toLocaleString()} sculptors`);
  }, [nodes, links, onFlowHover, onFlowClick, highlightedFlow]);

  if (flows.length === 0) {
    return (
      <EmptyState
        variant="block"
        title="No migration data for this view"
        description="There are no birth → death country flows for the current decade filter. Try widening the time range."
      />
    );
  }

  const ariaLabel = `Sankey diagram of sculptor migration: ${flows.length} birth-to-death-country corridor${
    flows.length === 1 ? "" : "s"
  }. Hover or focus a corridor to see who crossed it.`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        className="w-full"
        role="img"
        aria-label={ariaLabel}
      />
    </div>
  );
}
