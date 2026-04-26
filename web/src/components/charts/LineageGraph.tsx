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
 * - Dark surface (`--color-bg-sidebar`) — networks read better on dark.
 * - All colors come from CSS variables defined in globals.css. No hardcoded hex.
 * - Sculptor nodes: circles, sized by degree, colored by movement (data palette).
 * - Mentor nodes: diamonds, sandstone fill — clearly non-sculptor silhouette.
 * - Edges: thin, low opacity. Hover lifts to verdigris.
 * - Click: sculptors → detail page; mentors → Wikidata in a new tab.
 *
 * Filtering pipeline (applied inside useMemo):
 * 1. Optional `edgeType` filter (`all` | `influenced_by` | `student_of`).
 * 2. Optional `hideMentors` drops edges where the source is an external mentor.
 * 3. Optional `selectedMovements` keeps an edge only if either endpoint
 *    sculptor's movement is in the set (mentors pass through their sculptor).
 * 4. Optional `focusQid` keeps only nodes within `hops` of the focus node
 *    (BFS over the already-filtered edge set).
 * 5. Optional `minDegree` drops nodes whose post-filter degree is too low —
 *    "backbone" view to surface the canon spine.
 * Isolated (zero-edge) sculptors are always hidden.
 */

interface Props {
  sculptors: LegacySculptor[];
  edges: LegacyEdge[];
  externalMentors?: ExternalMentor[];
  height?: number;

  // ---- Filter props (all optional; component is usable without filters) ----
  /** QID to centre an ego-network around. When set, only nodes within `hops` are rendered. */
  focusQid?: string | null;
  /** BFS depth for ego-network (1, 2, or 3). Ignored when focusQid is null. */
  hops?: number;
  /** Hide external mentor nodes (and any edge sourced from a mentor). */
  hideMentors?: boolean;
  /** Movement slugs to retain. Empty set = no movement filter. */
  selectedMovements?: Set<string>;
  /** Restrict to a single Wikidata relation type. */
  edgeType?: "all" | "influenced_by" | "student_of";
  /** Backbone slider — drop any node whose post-filter degree is below this. */
  minDegree?: number;
}

type NodeKind = "sculptor" | "mentor";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  name: string;
  /** Movement slug for sculptors; occupation string for mentors. */
  movement: string;
  movementLabel: string;
  degree: number;
  hasMovement: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationType: "influenced_by" | "student_of";
}

/**
 * Resolve a CSS custom property (e.g. `--color-data-3`) on the document root
 * with a hex fallback for SSR/initial paint. Trimmed because Tailwind v4 emits
 * trailing whitespace on some platforms.
 */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function LineageGraph({
  sculptors,
  edges,
  externalMentors = [],
  height = 640,
  focusQid = null,
  hops = 2,
  hideMentors = false,
  selectedMovements,
  edgeType = "all",
  minDegree = 0,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth || 900);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Build the filtered bipartite graph. */
  const { nodes, links, movementColor, neighborMap, totals } = useMemo(() => {
    const sculptorMap = new Map(sculptors.map((s) => [s.qid, s]));
    const mentorMap = new Map(externalMentors.map((m) => [m.qid, m]));

    // Step 1: structural validity (target must be a known sculptor; source
    // must be a known sculptor or mentor). Same as before — this is what
    // makes the graph bipartite-ish.
    let pool = edges.filter((e) => {
      const targetOk = sculptorMap.has(e.toQid);
      const sourceOk = sculptorMap.has(e.fromQid) || mentorMap.has(e.fromQid);
      return targetOk && sourceOk;
    });

    const totalEdges = pool.length;
    const totalSculptors = new Set<string>();
    const totalMentors = new Set<string>();
    pool.forEach((e) => {
      totalSculptors.add(e.toQid);
      if (sculptorMap.has(e.fromQid)) totalSculptors.add(e.fromQid);
      else if (mentorMap.has(e.fromQid)) totalMentors.add(e.fromQid);
    });

    // Step 2: edge-type filter.
    if (edgeType !== "all") {
      pool = pool.filter((e) => e.relationType === edgeType);
    }

    // Step 3: hide-mentors.
    if (hideMentors) {
      pool = pool.filter((e) => !mentorMap.has(e.fromQid));
    }

    // Step 4: movement filter — keep an edge if either endpoint sculptor's
    // movement is in the selected set. Mentors don't carry a movement, so
    // they pass through whenever their connected sculptor matches.
    if (selectedMovements && selectedMovements.size > 0) {
      pool = pool.filter((e) => {
        const tgt = sculptorMap.get(e.toQid);
        const src = sculptorMap.get(e.fromQid);
        const movs = [tgt?.movement, src?.movement].filter(
          (m): m is string => !!m && m !== "No movement listed"
        );
        return movs.some((m) => selectedMovements.has(m));
      });
    }

    // Step 5: optional ego-network. We BFS over the post-filter edge set,
    // walking edges as undirected for exploration (a viewer types "Rodin"
    // expecting to see who taught him AND who he taught).
    if (focusQid) {
      const adj = new Map<string, Set<string>>();
      pool.forEach((e) => {
        if (!adj.has(e.fromQid)) adj.set(e.fromQid, new Set());
        if (!adj.has(e.toQid)) adj.set(e.toQid, new Set());
        adj.get(e.fromQid)!.add(e.toQid);
        adj.get(e.toQid)!.add(e.fromQid);
      });
      const inRange = new Set<string>([focusQid]);
      let frontier: string[] = [focusQid];
      for (let depth = 0; depth < hops; depth++) {
        const next: string[] = [];
        for (const id of frontier) {
          const ns = adj.get(id);
          if (!ns) continue;
          ns.forEach((n) => {
            if (!inRange.has(n)) {
              inRange.add(n);
              next.push(n);
            }
          });
        }
        frontier = next;
        if (frontier.length === 0) break;
      }
      pool = pool.filter((e) => inRange.has(e.fromQid) && inRange.has(e.toQid));
    }

    // Step 6: derive degrees from the post-filter pool, then optionally
    // apply the `minDegree` backbone cut. We DO NOT re-cascade after the
    // cut — this is intentionally the "show me the spine" lens, not a
    // precise k-core. Cheap and legible.
    const degreeMap = new Map<string, number>();
    pool.forEach((e) => {
      degreeMap.set(e.fromQid, (degreeMap.get(e.fromQid) ?? 0) + 1);
      degreeMap.set(e.toQid, (degreeMap.get(e.toQid) ?? 0) + 1);
    });
    let connectedQids = new Set<string>(
      [...degreeMap.entries()]
        .filter(([, d]) => d >= Math.max(1, minDegree))
        .map(([id]) => id)
    );
    if (minDegree > 0) {
      pool = pool.filter(
        (e) => connectedQids.has(e.fromQid) && connectedQids.has(e.toQid)
      );
      // Recompute degree against the trimmed pool so node radii reflect
      // what's actually drawn (not the pre-trim count).
      degreeMap.clear();
      pool.forEach((e) => {
        degreeMap.set(e.fromQid, (degreeMap.get(e.fromQid) ?? 0) + 1);
        degreeMap.set(e.toQid, (degreeMap.get(e.toQid) ?? 0) + 1);
      });
      connectedQids = new Set(degreeMap.keys());
    }

    // Movement palette — built from currently-visible sculptors so colors
    // remain stable as filters change (movements not on screen don't
    // consume palette slots).
    const movements = Array.from(
      new Set(
        Array.from(connectedQids)
          .map((qid) => sculptorMap.get(qid)?.movement)
          .filter((m): m is string => !!m && m !== "No movement listed")
      )
    ).sort();
    const PALETTE_VARS = [
      "--color-data-2",
      "--color-data-3",
      "--color-data-4",
      "--color-data-6",
      "--color-data-5",
      "--color-data-1",
      "--color-data-8",
    ];
    const PALETTE_FALLBACKS = [
      "#3D7A68",
      "#6B8F84",
      "#D4A574",
      "#A8B5A3",
      "#8B7B6B",
      "#3D2E25",
      "#2A2D3A",
    ];
    const NO_MOVEMENT = cssVar("--color-text-tertiary", "#6B706D");
    const movementColor = (movement: string, hasMovement: boolean) => {
      if (!hasMovement) return NO_MOVEMENT;
      const idx = movements.indexOf(movement);
      const i = idx >= 0 ? idx % PALETTE_VARS.length : 0;
      return cssVar(PALETTE_VARS[i], PALETTE_FALLBACKS[i]);
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

    const links: GraphLink[] = pool.map((e) => ({
      source: e.fromQid,
      target: e.toQid,
      relationType: e.relationType,
    }));

    const neighborMap = new Map<string, Set<string>>();
    pool.forEach((e) => {
      if (!neighborMap.has(e.fromQid)) neighborMap.set(e.fromQid, new Set());
      if (!neighborMap.has(e.toQid)) neighborMap.set(e.toQid, new Set());
      neighborMap.get(e.fromQid)!.add(e.toQid);
      neighborMap.get(e.toQid)!.add(e.fromQid);
    });

    return {
      nodes,
      links,
      movementColor,
      neighborMap,
      totals: {
        sculptors: totalSculptors.size,
        mentors: totalMentors.size,
        edges: totalEdges,
      },
    };
  }, [
    sculptors,
    edges,
    externalMentors,
    edgeType,
    hideMentors,
    selectedMovements,
    focusQid,
    hops,
    minDegree,
  ]);

  /** Render — runs once per filtered-data change. */
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Resolve theme colors that D3 will paint with.
    const COLORS = {
      bg: cssVar("--color-bg-sidebar", "#1A1D1C"),
      marble: cssVar("--color-bg-primary", "#FAFAF9"),
      verdigris: cssVar("--color-accent-primary", "#3D7A68"),
      sandstoneFill: cssVar("--color-data-4", "#D4A574"),
      sandstoneStroke: cssVar("--color-data-4", "#D4A574"),
      mentorStroke: cssVar("--color-data-5", "#8B7B6B"),
      noMovementStroke: cssVar("--color-text-tertiary", "#6B706D"),
    };
    const FONT_BODY = cssVar("--font-body", "system-ui, sans-serif");

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    const link = g
      .append("g")
      .attr("stroke", COLORS.marble)
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 0.75)
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line");

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

    const radius = (d: GraphNode) =>
      d.kind === "mentor"
        ? 2.5 + Math.sqrt(d.degree) * 1.6
        : 3 + Math.sqrt(d.degree) * 2.2;

    node
      .filter((d) => d.kind === "sculptor")
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => movementColor(d.movement, d.hasMovement))
      .attr("stroke", (d) =>
        d.hasMovement ? COLORS.marble : COLORS.noMovementStroke
      )
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", (d) => (d.hasMovement ? "none" : "2 2"));

    node
      .filter((d) => d.kind === "mentor")
      .append("rect")
      .attr("x", (d) => -radius(d))
      .attr("y", (d) => -radius(d))
      .attr("width", (d) => radius(d) * 2)
      .attr("height", (d) => radius(d) * 2)
      .attr("transform", "rotate(45)")
      .attr("fill", COLORS.sandstoneFill)
      .attr("fill-opacity", 0.6)
      .attr("stroke", COLORS.mentorStroke)
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", 0.9);

    node
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => radius(d) + 4)
      .attr("y", 3)
      .attr("font-size", 10)
      .attr("font-family", FONT_BODY)
      .attr("fill", (d) =>
        d.kind === "mentor" ? COLORS.sandstoneFill : COLORS.marble
      )
      .attr("font-style", (d) => (d.kind === "mentor" ? "italic" : "normal"))
      // Label visibility scales with zoom-out density. Focus mode (small N)
      // can afford to show every label; the global view can't.
      .attr("opacity", (d) => {
        if (focusQid) return 1;
        if (d.kind === "mentor") return d.degree >= 2 ? 0.9 : 0;
        return d.degree >= 3 ? 0.85 : 0;
      })
      .attr("pointer-events", "none");

    node.append("title").text((d) =>
      d.kind === "mentor"
        ? `${d.name} — ${d.movementLabel} (external mentor)`
        : `${d.name} — ${d.movementLabel}`
    );

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
  }, [nodes, links, movementColor, width, height, router, focusQid]);

  /** Hover highlighting — style updates only, no simulation restart. */
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const VERDIGRIS = cssVar("--color-accent-primary", "#3D7A68");
    const MARBLE = cssVar("--color-bg-primary", "#FAFAF9");
    const neighbors = hoveredId
      ? neighborMap.get(hoveredId) ?? new Set()
      : null;

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
          ? VERDIGRIS
          : MARBLE;
      });
  }, [hoveredId, neighborMap]);

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="rounded-md p-8 text-sm"
        style={{
          backgroundColor: cssVar("--color-bg-sidebar", "#1A1D1C"),
          color: cssVar("--color-sidebar-text-muted", "#9CA3A0"),
          minHeight: 220,
        }}
      >
        <p>
          No connections match these filters. Try widening the movement
          selection, increasing the hop radius, or lowering the minimum-degree
          threshold.
        </p>
        <p className="mt-2 opacity-70">
          {totals.edges > 0
            ? `Underlying graph: ${totals.sculptors} sculptors · ${totals.mentors} mentors · ${totals.edges} connections.`
            : "The full graph also has no edges — this is a data-availability gap, not a filter problem."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md"
      style={{
        backgroundColor: cssVar("--color-bg-sidebar", "#1A1D1C"),
        height,
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block" }}
      />

      {/* Stats overlay */}
      <div
        className="absolute top-3 left-3 text-xs"
        style={{ color: cssVar("--color-sidebar-text-muted", "#9CA3A0") }}
      >
        <div>
          {nodes.filter((n) => n.kind === "sculptor").length} sculptors ·{" "}
          {nodes.filter((n) => n.kind === "mentor").length} mentors ·{" "}
          {links.length} connections
        </div>
        <div className="mt-0.5 opacity-70">
          Drag to rearrange · scroll to zoom
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 text-xs flex items-center gap-4"
        style={{ color: cssVar("--color-sidebar-text-muted", "#9CA3A0") }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: cssVar("--color-data-3", "#6B8F84"),
            }}
          />
          Sculptor
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5"
            style={{
              backgroundColor: cssVar("--color-data-4", "#D4A574"),
              transform: "rotate(45deg)",
              border: `1px solid ${cssVar("--color-data-5", "#8B7B6B")}`,
            }}
          />
          External mentor
        </span>
      </div>
    </div>
  );
}
