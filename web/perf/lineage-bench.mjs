#!/usr/bin/env node
/**
 * Phase 5b.0 — perf benchmark for the LineageGraph d3-force simulation.
 *
 * Headless run of the same force configuration the page uses, against
 * synthetic graphs at the size points that bracket Phase 5:
 *
 *   - now              : current /lineage today
 *   - +institutions    : Phase 5b target (P69 + institutional rendering)
 *   - +movements       : Phase 5b.5 on top of 5b (~150 movement nodes)
 *   - stress           : 1.5× the largest plausible Phase-5 size, headroom check
 *
 * Measures total wall time and time per tick for the simulation alone
 * (no SVG rendering — that cost is bounded by node/edge count and
 * tested separately in Playwright once 5b.4 lands).
 *
 * Decision thresholds, applied to the +institutions row:
 *   < 2.5s  → green; ship institutions on by default
 *   2.5–4s  → yellow; ship the view-mode selector with institutions off by default
 *   > 4s    → red; plan Canvas/WebGL fallback before user-visible 5b work
 *
 * Run:  node perf/lineage-bench.mjs
 */
import * as d3 from "d3";
import { performance } from "node:perf_hooks";

/** Synthetic graph generator.
 *
 *  Matches the LineageGraph topology roughly: most nodes are degree-1 or 2
 *  ("sculptors"), a small minority are high-degree ("hubs": ENSBA-style
 *  institutions or central mentors). Power-law-ish degree distribution
 *  via preferential attachment so the layout cost reflects real data,
 *  not a uniform random graph.
 */
function buildGraph(nodeCount, edgeCount, hubCount = 50) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: String(i),
    isHub: i < hubCount,
  }));

  // Preferential-attachment edges. Each new edge picks endpoints with
  // probability proportional to degree, so hubs accumulate links.
  const degree = new Int32Array(nodeCount);
  const links = [];
  // Seed: connect first few hubs to each other so degree isn't all zero.
  for (let i = 0; i < Math.min(hubCount, 5); i++) {
    for (let j = i + 1; j < Math.min(hubCount, 5); j++) {
      links.push({ source: String(i), target: String(j) });
      degree[i]++;
      degree[j]++;
    }
  }
  const totalDegreeWeight = () => {
    let s = 0;
    for (let i = 0; i < nodeCount; i++) s += degree[i] + 1;
    return s;
  };
  const pickByDegree = () => {
    const total = totalDegreeWeight();
    let r = Math.random() * total;
    for (let i = 0; i < nodeCount; i++) {
      r -= degree[i] + 1;
      if (r <= 0) return i;
    }
    return nodeCount - 1;
  };
  while (links.length < edgeCount) {
    const a = pickByDegree();
    const b = pickByDegree();
    if (a === b) continue;
    links.push({ source: String(a), target: String(b) });
    degree[a]++;
    degree[b]++;
  }
  return { nodes, links };
}

/** Build the simulation with the exact forces /lineage uses.
 *  Caller controls which forces are active so we can isolate cost. */
function makeSim({ nodes, links }, opts = {}) {
  const {
    link = true,
    charge = true,
    center = true,
    collide = true,
    width = 1200,
    height = 680,
    institutional = false,
  } = opts;
  const simNodes = nodes.map((n) => ({ ...n }));
  const simLinks = links.map((l) => ({ ...l }));
  const sim = d3.forceSimulation(simNodes).alphaDecay(0.03).stop();
  if (link)
    sim.force(
      "link",
      d3
        .forceLink(simLinks)
        .id((d) => d.id)
        .distance(institutional ? 72 : 60)
        .strength(institutional ? 0.35 : 0.6),
    );
  if (charge)
    sim.force(
      "charge",
      d3
        .forceManyBody()
        .strength(institutional ? -80 : -120)
        .theta(institutional ? 1.5 : 0.9),
    );
  if (center) sim.force("center", d3.forceCenter(width / 2, height / 2));
  if (collide)
    sim.force(
      "collide",
      d3.forceCollide().radius((d) => (d.isHub ? 8 : 4) + 3),
    );
  return sim;
}

/** Run a simulation and return time-to-perceptually-settled (alpha=0.02)
 *  and time-to-fully-converged (alpha=0.001). The browser ticks via
 *  requestAnimationFrame so users perceive "done" near alpha=0.02; the
 *  strict bound is academic but useful as a worst-case anchor. */
function simulate(graph, opts = {}) {
  const sim = makeSim(graph, opts);
  const t0 = performance.now();
  let settledMs = null;
  let settledTicks = null;
  let ticks = 0;
  while (sim.alpha() > sim.alphaMin()) {
    sim.tick();
    ticks++;
    if (settledMs === null && sim.alpha() < 0.02) {
      settledMs = performance.now() - t0;
      settledTicks = ticks;
    }
    if (ticks > 2000) break;
  }
  const total = performance.now() - t0;
  return { settledMs, settledTicks, total, ticks };
}

const sizes = [
  { name: "now", nodes: 4300, edges: 1400, hubs: 30, institutional: false },
  { name: "+institutions (5b)", nodes: 7700, edges: 4800, hubs: 80, institutional: true },
  { name: "+movements (5b.5)", nodes: 7850, edges: 5400, hubs: 100, institutional: true },
  { name: "stress (1.5×)", nodes: 12000, edges: 8000, hubs: 120, institutional: true },
];

function medianRun(graph, opts) {
  simulate(graph, opts); // warm-up
  const runs = [simulate(graph, opts), simulate(graph, opts), simulate(graph, opts)];
  runs.sort((a, b) => a.total - b.total);
  return runs[1];
}

console.log("");
console.log("LineageGraph d3-force simulation benchmark (headless)");
console.log("Settled = time to alpha<0.02 (perceptually still). Full = alpha<0.001.");
console.log("=".repeat(82));
console.log(
  `${"scenario".padEnd(22)}  ${"nodes".padStart(6)}  ${"edges".padStart(6)}  ${"settled".padStart(8)}  ${"full".padStart(7)}  verdict`,
);
console.log("-".repeat(82));

for (const s of sizes) {
  const graph = buildGraph(s.nodes, s.edges, s.hubs);
  const m = medianRun(graph, { institutional: s.institutional });
  const settledSec = (m.settledMs / 1000).toFixed(2);
  const totalSec = (m.total / 1000).toFixed(2);
  // Verdict is on perceived-settled time, not full-convergence.
  const verdict =
    m.settledMs < 1500 ? " green" : m.settledMs < 3000 ? " yellow" : " RED (consider Canvas/WebGL or opt-in toggle)";
  console.log(
    `${s.name.padEnd(22)}  ${String(s.nodes).padStart(6)}  ${String(s.edges).padStart(6)}  ${(settledSec + "s").padStart(8)}  ${(totalSec + "s").padStart(7)} ${verdict}`,
  );
}

console.log("-".repeat(82));
console.log("Thresholds (settled time): <1.5s green · 1.5-3s yellow · >3s red");

// Per-force breakdown at the +institutions size — which force dominates?
console.log("");
console.log("Force-cost breakdown at +institutions size (7700 nodes / 4800 edges):");
console.log("-".repeat(82));
const benchSize = sizes[1];
const graph = buildGraph(benchSize.nodes, benchSize.edges, benchSize.hubs);
const variants = [
  { name: "all forces (5b.4 tuned)", opts: { institutional: true } },
  { name: "minus collide", opts: { institutional: true, collide: false } },
  { name: "minus charge", opts: { institutional: true, charge: false } },
  { name: "minus link", opts: { institutional: true, link: false } },
];
for (const v of variants) {
  const m = medianRun(graph, v.opts);
  console.log(
    `  ${v.name.padEnd(24)}  settled ${(m.settledMs / 1000).toFixed(2)}s   full ${(m.total / 1000).toFixed(2)}s`,
  );
}

console.log("");
console.log(
  "Notes: headless simulation only — SVG rendering is separately bounded by",
);
console.log(
  "       node/edge count and is tested in Playwright once 5b.4 lands.",
);
console.log("");
