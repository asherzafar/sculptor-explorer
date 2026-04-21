"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import type { LegacyEdge, LegacySculptor, ExternalMentor } from "@/lib/types";
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
  externalMentors?: ExternalMentor[];
  height?: number;
}

type NodeKind = "sculptor" | "mentor";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string; // qid
  kind: NodeKind;
  name: string;
  /** For sculptors: movement slug/label; for mentors: occupation */
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

export function LineageGraph({ sculptors, edges, externalMentors = [], height = 640 }: Props) {
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

  /** Build a bipartite graph: sculptor nodes + external mentor nodes. */
  const { nodes, links, movementColor, neighborMap } = useMemo(() => {
    const sculptorMap = new Map(sculptors.map((s) => [s.qid, s]));
    const mentorMap = new Map(externalMentors.map((m) => [m.qid, m]));

    // An edge is valid if the target is a known sculptor AND the source
    // is either a known sculptor or a known external mentor. This keeps
    // cross-media mentor arcs (composers → sculptors, painters → sculptors).
    const validEdges = edges.filter((e) => {
      const targetOk = sculptorMap.has(e.toQid);
      const sourceOk = sculptorMap.has(e.fromQid) || mentorMap.has(e.fromQid);
      return targetOk && sourceOk;
    });

    // Collect connected QIDs and compute degrees
    const connectedQids = new Set<string>();
    const degreeMap = new Map<string, number>();
    validEdges.forEach((e) => {
      connectedQids.add(e.fromQid);
      connectedQids.add(e.toQid);
      degreeMap.set(e.fromQid, (degreeMap.get(e.fromQid) ?? 0) + 1);
      degreeMap.set(e.toQid, (degreeMap.get(e.toQid) ?? 0) + 1);
    });

    // Movement color scale (sculptors only — mentors use occupation-based grey)
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
      const sculptor = sculptorMap.get(qid);
      if (sculptor) {
        const hasMovement =
          !!sculptor.movement && sculptor.movement !== "No movement listed";
        return {
          id: qid,
          kind: "sculptor",
          name: sculptor.name,
          movement: sculptor.movement,
          movementLabel: hasMovement
            ? formatDisplayValue(sculptor.movement, { isMovement: true })
            : "No movement",
          degree: degreeMap.get(qid) ?? 0,
          hasMovement,
        };
      }
      // External mentor — sits outside the sculptor table
      const mentor = mentorMap.get(qid);
      const occ = mentor?.occupation ?? null;
      return {
        id: qid,
        kind: "mentor",
        name: mentor?.name ?? qid,
        movement: occ ?? "",
        movementLabel: occ
          ? `${occ.charAt(0).toUpperCase()}${occ.slice(1)}`
          : "Mentor",
        degree: degreeMap.get(qid) ?? 0,
        hasMovement: false,
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
  }, [sculptors, edges, externalMentors]);

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

    // Node group — click routing differs by kind: sculptors go to detail
    // page; mentors open Wikidata in a new tab since we have no internal
    // page for them (they aren't classified as sculptors in our dataset).
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        if (d.kind === "sculptor") {
          router.push(`/explore/${d.id}`);
        } else if (typeof window !== "undefined") {
          window.open(`https://www.wikidata.org/wiki/${d.id}`, "_blank");
        }
      })
      .on("mouseenter", (_event, d) => setHoveredId(d.id))
      .on("mouseleave", () => setHoveredId(null));

    // Radius by degree — mentors render smaller by default since they
    // typically have low degree and shouldn't dominate visually.
    const radius = (d: GraphNode) =>
      d.kind === "mentor"
        ? 2.5 + Math.sqrt(d.degree) * 1.6
        : 3 + Math.sqrt(d.degree) * 2.2;

    // Sculptors: circles colored by movement
    node
      .filter((d) => d.kind === "sculptor")
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => movementColor(d.movement, d.hasMovement))
      .attr("stroke", (d) => (d.hasMovement ? "#FAFAF9" : "#9CA3A0"))
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", (d) => (d.hasMovement ? "none" : "2 2"));

    // Mentors: diamonds (rotated squares) in muted amber — clearly
    // non-sculptor silhouettes against the sculptor circles.
    node
      .filter((d) => d.kind === "mentor")
      .append("rect")
      .attr("x", (d) => -radius(d))
      .attr("y", (d) => -radius(d))
      .attr("width", (d) => radius(d) * 2)
      .attr("height", (d) => radius(d) * 2)
      .attr("transform", "rotate(45)")
      .attr("fill", "#B8A88A") // bronze
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#D4A574")
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", 0.9);

    // Labels — higher-degree sculptors, plus ALL mentors with degree >= 2
    // (mentors are the more interesting find since they're the new data).
    node
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => radius(d) + 4)
      .attr("y", 3)
      .attr("font-size", 10)
      .attr("font-family", "system-ui, sans-serif")
      .attr("fill", (d) => (d.kind === "mentor" ? "#D4A574" : "#FAFAF9"))
      .attr("font-style", (d) => (d.kind === "mentor" ? "italic" : "normal"))
      .attr("opacity", (d) => {
        if (d.kind === "mentor") return d.degree >= 2 ? 0.9 : 0;
        return d.degree >= 3 ? 0.85 : 0;
      })
      .attr("pointer-events", "none");

    // Title (native tooltip fallback)
    node.append("title").text((d) =>
      d.kind === "mentor"
        ? `${d.name} — ${d.movementLabel} (external mentor)`
        : `${d.name} — ${d.movementLabel}`
    );

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
        <div>
          {nodes.filter((n) => n.kind === "sculptor").length} sculptors ·{" "}
          {nodes.filter((n) => n.kind === "mentor").length} mentors ·{" "}
          {links.length} connections
        </div>
        <div className="mt-0.5 text-white/40">Drag to rearrange · scroll to zoom</div>
      </div>

      {/* Legend — shape key */}
      <div className="absolute bottom-3 left-3 text-xs text-white/70 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#6B8F84" }}
          />
          Sculptor
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5"
            style={{
              backgroundColor: "#B8A88A",
              transform: "rotate(45deg)",
              border: "1px solid #D4A574",
            }}
          />
          External mentor
        </span>
      </div>
    </div>
  );
}
