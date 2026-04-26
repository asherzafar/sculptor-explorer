"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ExternalMentor,
  LegacyEdge,
  LegacySculptor,
} from "@/lib/types";
import {
  loadEdges,
  loadExternalMentors,
  loadSculptors,
} from "@/lib/data";
import { LineageGraph } from "@/components/charts/LineageGraph";
import { formatDisplayValue } from "@/lib/utils";

/**
 * LineageContent — filter UI + URL-backed state for the lineage graph.
 *
 * URL params:
 *   - focus    QID to centre the ego network on (e.g. ?focus=Q5598)
 *   - hops     1 | 2 | 3 (default 2)
 *   - mentors  "hide" to drop external-mentor nodes; default shows them
 *   - edge     "influenced_by" | "student_of" | (omitted = all)
 *   - minDeg   integer, drop nodes below this post-filter degree
 *   - mov      comma-separated movement slugs to retain
 *
 * All defaults map to omitted params to keep shareable URLs short.
 */

const HOP_OPTIONS = [1, 2, 3] as const;
type HopValue = (typeof HOP_OPTIONS)[number];
const EDGE_OPTIONS = [
  { key: "all", label: "All connections" },
  { key: "influenced_by", label: "Influenced by" },
  { key: "student_of", label: "Student of" },
] as const;
type EdgeValue = (typeof EDGE_OPTIONS)[number]["key"];

const MAX_MOVEMENT_PILLS = 12;

export function LineageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [edges, setEdges] = useState<LegacyEdge[]>([]);
  const [sculptors, setSculptors] = useState<LegacySculptor[]>([]);
  const [mentors, setMentors] = useState<ExternalMentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [e, s, m] = await Promise.all([
          loadEdges(),
          loadSculptors(),
          loadExternalMentors(),
        ]);
        setEdges(e);
        setSculptors(s);
        setMentors(m);
      } catch (err) {
        console.error("Failed to load lineage data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---- URL → state ----
  const focusQid = searchParams.get("focus");
  const hops: HopValue = (() => {
    const n = Number(searchParams.get("hops"));
    return n === 1 || n === 2 || n === 3 ? (n as HopValue) : 2;
  })();
  const hideMentors = searchParams.get("mentors") === "hide";
  const edgeType: EdgeValue = (() => {
    const v = searchParams.get("edge");
    return v === "influenced_by" || v === "student_of" ? v : "all";
  })();
  const minDegree = Math.max(0, Number(searchParams.get("minDeg") || 0));
  const selectedMovements = useMemo(() => {
    const raw = searchParams.get("mov");
    if (!raw) return new Set<string>();
    return new Set(raw.split(",").filter(Boolean));
  }, [searchParams]);

  // ---- mutate URL helpers ----
  function update(mutate: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  // ---- derived UI options ----
  const focusSculptor = useMemo(
    () => (focusQid ? sculptors.find((s) => s.qid === focusQid) : undefined),
    [focusQid, sculptors]
  );

  /** Movement pills: top N by edge-incidence, so the bar reflects what's
   *  actually visualised (not just what exists in the cache). */
  const movementOptions = useMemo(() => {
    const sculptorMovement = new Map(
      sculptors.map((s) => [s.qid, s.movement])
    );
    const counts = new Map<string, number>();
    edges.forEach((e) => {
      [e.fromQid, e.toQid].forEach((qid) => {
        const m = sculptorMovement.get(qid);
        if (m && m !== "No movement listed") {
          counts.set(m, (counts.get(m) ?? 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_MOVEMENT_PILLS)
      .map(([slug, count]) => ({
        slug,
        label: formatDisplayValue(slug, { isMovement: true }),
        count,
      }));
  }, [sculptors, edges]);

  // ---- search-typeahead ----
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    // Sync input with URL when focus changes externally (e.g. clear button).
    setSearchInput(focusSculptor?.name ?? "");
  }, [focusSculptor?.name]);

  const searchMatches = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q || q === focusSculptor?.name.toLowerCase()) return [];
    return sculptors
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchInput, sculptors, focusSculptor]);

  function setFocus(qid: string | null) {
    update((p) => {
      if (qid) p.set("focus", qid);
      else p.delete("focus");
    });
  }
  function setHops(h: HopValue) {
    update((p) => {
      if (h === 2) p.delete("hops");
      else p.set("hops", String(h));
    });
  }
  function setHideMentors(hide: boolean) {
    update((p) => {
      if (hide) p.set("mentors", "hide");
      else p.delete("mentors");
    });
  }
  function setEdgeType(v: EdgeValue) {
    update((p) => {
      if (v === "all") p.delete("edge");
      else p.set("edge", v);
    });
  }
  function setMinDegree(n: number) {
    update((p) => {
      if (n <= 0) p.delete("minDeg");
      else p.set("minDeg", String(n));
    });
  }
  function toggleMovement(slug: string) {
    update((p) => {
      const cur = new Set(selectedMovements);
      if (cur.has(slug)) cur.delete(slug);
      else cur.add(slug);
      if (cur.size === 0) p.delete("mov");
      else p.set("mov", Array.from(cur).join(","));
    });
  }
  function clearAll() {
    router.replace("?", { scroll: false });
    setSearchInput("");
  }

  const anyFilterActive =
    !!focusQid ||
    hideMentors ||
    edgeType !== "all" ||
    minDegree > 0 ||
    selectedMovements.size > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-text-secondary">Loading lineage network...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Lineage
        </h1>
        <p className="text-text-secondary max-w-3xl">
          Influence and student-teacher relationships between sculptors,
          sourced from Wikidata. Click a sculptor to see their details; click a
          mentor to open their Wikidata page. Use the filters below to focus on
          a single sculptor&apos;s ego network, isolate a movement, or surface
          the most-connected backbone of the graph.
        </p>
      </div>

      {/* ------------- Filter bar ------------- */}
      <div className="mb-4 grid gap-4 rounded-md bg-bg-secondary p-4 lg:grid-cols-2">
        {/* Search → ego network */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary">
            Focus on a sculptor (ego network)
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchInput(focusSculptor?.name ?? "");
                } else if (e.key === "Enter" && searchMatches[0]) {
                  setFocus(searchMatches[0].qid);
                }
              }}
              placeholder="Type a name (e.g. Rodin, Brâncuși)"
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
            />
            {searchMatches.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border-subtle bg-bg-primary shadow-sm">
                {searchMatches.map((s) => (
                  <li
                    key={s.qid}
                    className="cursor-pointer px-3 py-2 text-sm text-text-primary hover:bg-accent-muted"
                    onClick={() => {
                      setFocus(s.qid);
                      setSearchInput(s.name);
                    }}
                  >
                    <span>{s.name}</span>
                    {s.movement && s.movement !== "No movement listed" && (
                      <span className="ml-2 text-xs text-text-tertiary">
                        {formatDisplayValue(s.movement, { isMovement: true })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hops slider — only useful when a focus is set */}
          <div
            className={`flex items-center gap-2 ${
              focusQid ? "" : "opacity-50"
            }`}
          >
            <span className="text-xs text-text-secondary">Hops:</span>
            {HOP_OPTIONS.map((h) => (
              <button
                key={h}
                disabled={!focusQid}
                onClick={() => setHops(h)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  hops === h && focusQid
                    ? "bg-accent-primary text-white"
                    : "bg-bg-primary text-text-secondary hover:bg-accent-muted"
                }`}
              >
                {h}
              </button>
            ))}
            {focusQid && (
              <button
                onClick={() => setFocus(null)}
                className="ml-auto text-xs text-accent-primary hover:underline"
              >
                Clear focus
              </button>
            )}
          </div>
        </div>

        {/* Edge type + mentors + backbone */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Connection type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EDGE_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEdgeType(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    edgeType === key
                      ? "bg-accent-primary text-white"
                      : "bg-bg-primary text-text-secondary hover:bg-accent-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={!hideMentors}
                onChange={(e) => setHideMentors(!e.target.checked)}
                className="h-4 w-4 accent-accent-primary"
              />
              Show external mentors ({mentors.length})
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">
                Min connections: {minDegree || "—"}
              </span>
              <input
                type="range"
                min={0}
                max={20}
                value={minDegree}
                onChange={(e) => setMinDegree(Number(e.target.value))}
                className="w-32 accent-accent-primary"
                aria-label="Minimum-degree backbone slider"
              />
            </div>
          </div>
        </div>

        {/* Movement pills — full width across both cols */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Filter by movement (top {MAX_MOVEMENT_PILLS} by edge count)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {movementOptions.map(({ slug, label, count }) => {
              const active = selectedMovements.has(slug);
              return (
                <button
                  key={slug}
                  onClick={() => toggleMovement(slug)}
                  title={`${count} edges`}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent-primary text-white"
                      : "bg-bg-primary text-text-secondary hover:bg-accent-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {anyFilterActive && (
              <button
                onClick={clearAll}
                className="ml-auto px-2.5 py-1 text-xs text-accent-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------- Graph ------------- */}
      <LineageGraph
        sculptors={sculptors}
        edges={edges}
        externalMentors={mentors}
        height={680}
        focusQid={focusQid}
        hops={hops}
        hideMentors={hideMentors}
        selectedMovements={selectedMovements}
        edgeType={edgeType}
        minDegree={minDegree}
      />

      <div className="mt-6 max-w-3xl text-sm text-text-secondary space-y-2">
        <p>
          <strong className="text-text-primary">What you&apos;re seeing:</strong>{" "}
          circles are sculptors; diamonds are external mentors — painters,
          composers, architects, and other teachers who trained sculptors but
          aren&apos;t classified as sculptors themselves in Wikidata. Node size
          reflects how many connections each person has. Dashed outlines mark
          sculptors without a recorded art movement.
        </p>
        <p className="text-text-tertiary">
          Connections come from Wikidata&apos;s <code>influencedBy</code> and{" "}
          <code>studentOf</code> properties. The graph reflects gaps in
          Wikidata as much as art-historical reality — see{" "}
          <a href="/transparency" className="text-accent-primary hover:underline">
            /transparency
          </a>{" "}
          for what we know we&apos;re missing.
        </p>
      </div>
    </div>
  );
}
