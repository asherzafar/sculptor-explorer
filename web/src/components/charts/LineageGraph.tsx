"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import type { LegacyEdge, LegacySculptor } from "@/lib/types";
import { formatDisplayValue } from "@/lib/utils";

/**
 * LineageGraph — D3 force-directed network of sculptor influence.
 *
 * Per DESIGN_SYSTEM:
 * - Dark background (#1C1C1A) — networks read better on dark
 * - Nodes: circles sized by total degree, colored by movement
 * - Edges: thin, low opacity
 * - Hover: highlight node + neighbors, dim everything else
 * - Click: navigate to sculptor detail
 * - Gentle physics — constellation, not a hairball
 * - Only renders sculptors that appear in at least one edge (isolated nodes hidden)
 */

interface Props {
  sculptors: LegacySculptor[];
  edges: LegacyEdge[];
  height?: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string; // qid
  name: string;
  movement: string;
  movementLabel: string;
  degree: number;
  hasMovement: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationType: "influenced_by" | "student_of";
}

/** Data color palette (dark-mode friendly versions of --color-data-*). */
const MOVEMENT_PALETTE = [
  "#D4A574", // warm tan
  "#6B8F84", // verdigris light
  "#A8B5A3", // sage
  "#DFE8DF", // pale
  "#C4A584", // ochre
  "#8BA89E", // teal
  "#B8A88A", // bronze
];
const NO_MOVEMENT_COLOR = "#5C6560"; // text-secondary — dim grey

export function LineageGraph({ sculptors, edges, height = 640 }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [width, setWidth] = useState(900);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth || 900);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Build nodes + links, filtering to sculptors with at least one edge. */
  const { nodes, links, movementColor, neighborMap } = useMemo(() => {
    const sculptorMap = new Map(sculptors.map((s) => [s.qid, s]));

    // Only include edges where BOTH endpoints are known sculptors
    const validEdges = edges.filter(
      (e) => sculptorMap.has(e.fromQid) && sculptorMap.has(e.toQid)
    );

    // Collect QIDs that appear in at least one valid edge
    const connectedQids = new Set<string>();
    validEdges.forEach((e) => {
      connectedQids.add(e.fromQid);
      connectedQids.add(e.toQid);
    });

    // Degree map
    const degreeMap = new Map<string, number>();
    validEdges.forEach((e) => {
      degreeMap.set(e.fromQid, (degreeMap.get(e.fromQid) ?? 0) + 1);
      degreeMap.set(e.toQid, (degreeMap.get(e.toQid) ?? 0) + 1);
    });

    // Movement color scale (stable by movement name ordering)
    const movements = Array.from(
      new Set(
        Array.from(connectedQids)
          .map((qid) => sculptorMap.get(qid)?.movement)
          .filter((m): m is string => !!m && m !== "No movement listed")
      )
    ).sort();
    const movementColor = (movement: string, hasMovement: boolean) => {
      if (!hasMovement) return NO_MOVEMENT_COLOR;
      const idx = movements.indexOf(movement);
      return MOVEMENT_PALETTE[idx % MOVEMENT_PALETTE.length];
    };

    const nodes: GraphNode[] = Array.from(connectedQids).map((qid) => {
      const s = sculptorMap.get(qid)!;
      const hasMovement = !!s.movement && s.movement !== "No movement listed";
      return {
        id: qid,
        name: s.name,
        movement: s.movement,
        movementLabel: hasMovement
          ? formatDisplayValue(s.movement, { isMovement: true })
          : "No movement",
        degree: degreeMap.get(qid) ?? 0,
        hasMovement,
      };
    });

    const links: GraphLink[] = validEdges.map((e) => ({
      source: e.fromQid,
      target: e.toQid,
      relationType: e.relationType,
    }));

    // Neighbor lookup for hover highlighting
    const neighborMap = new Map<string, Set<string>>();
    validEdges.forEach((e) => {
      if (!neighborMap.has(e.fromQid)) neighborMap.set(e.fromQid, new Set());
      if (!neighborMap.has(e.toQid)) neighborMap.set(e.toQid, new Set());
      neighborMap.get(e.fromQid)!.add(e.toQid);
      neighborMap.get(e.toQid)!.add(e.fromQid);
    });

    return { nodes, links, movementColor, neighborMap };
  }, [sculptors, edges]);

  /** D3 force simulation — runs once per data change. */
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom + pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    // Link rendering
    const link = g
      .append("g")
      .attr("stroke", "#FAFAF9")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 0.75)
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line");

    // Node group
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => router.push(`/explore/${d.id}`))
      .on("mouseenter", (_event, d) => setHoveredId(d.id))
      .on("mouseleave", () => setHoveredId(null));

    // Node circles — radius by degree, with gentle scaling
    const radius = (d: GraphNode) => 3 + Math.sqrt(d.degree) * 2.2;

    node
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => movementColor(d.movement, d.hasMovement))
      .attr("stroke", (d) => (d.hasMovement ? "#FAFAF9" : "#9CA3A0"))
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", (d) => (d.hasMovement ? "none" : "2 2"));

    // Labels — only visible for higher-degree nodes by default
    node
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => radius(d) + 4)
      .attr("y", 3)
      .attr("font-size", 10)
      .attr("font-family", "system-ui, sans-serif")
      .attr("fill", "#FAFAF9")
      .attr("opacity", (d) => (d.degree >= 3 ? 0.85 : 0))
      .attr("pointer-events", "none");

    // Title (native tooltip fallback)
    node.append("title").text((d) => `${d.name} — ${d.movementLabel}`);

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    node.call(drag);

    // Force simulation — gentle physics
    const simulation = d3
      .forceSimulation<GraphNode, GraphLink>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(60)
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<GraphNode>().radius((d) => radius(d) + 3)
      )
      .alphaDecay(0.03);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, movementColor, width, height, router]);

  /** Hover highlighting — update styles without restarting simulation. */
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const neighbors = hoveredId ? neighborMap.get(hoveredId) ?? new Set() : null;

    svg
      .selectAll<SVGGElement, GraphNode>("g > g > g")
      .transition()
      .duration(150)
      .style("opacity", (d) => {
        if (!hoveredId) return 1;
        if (d.id === hoveredId) return 1;
        if (neighbors?.has(d.id)) return 1;
        return 0.15;
      });

    svg
      .selectAll<SVGLineElement, GraphLink>("line")
      .transition()
      .duration(150)
      .attr("stroke-opacity", (d) => {
        if (!hoveredId) return 0.25;
        const sourceId = (d.source as GraphNode).id;
        const targetId = (d.target as GraphNode).id;
        return sourceId === hoveredId || targetId === hoveredId ? 0.8 : 0.05;
      })
      .attr("stroke", (d) => {
        const sourceId = (d.source as GraphNode).id;
        const targetId = (d.target as GraphNode).id;
        return sourceId === hoveredId || targetId === hoveredId
          ? "#3D7A68"
          : "#FAFAF9";
      });
  }, [hoveredId, neighborMap]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-md bg-bg-secondary p-8">
        <p className="text-sm text-text-secondary">
          No lineage connections available yet. Wikidata&apos;s influence graph for
          sculptors is sparse — this view will fill in as the dataset grows.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md"
      style={{ backgroundColor: "#1C1C1A", height }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block" }}
      />

      {/* Stats overlay */}
      <div className="absolute top-3 left-3 text-xs text-white/60">
        <div>{nodes.length} sculptors · {links.length} connections</div>
        <div className="mt-0.5 text-white/40">Drag to rearrange · scroll to zoom</div>
      </div>
    </div>
  );
}
