"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { loadMigration } from "@/lib/data";
import type { MigrationData, MigrationFlow } from "@/lib/types";
import { MigrationSankey } from "@/components/charts/MigrationSankey";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/StatBlock";
import { DataScopeNote } from "@/components/DataScopeNote";

/**
 * MigrationContent — client component for /migration.
 *
 * URL state contract:
 *   ?decade=1880   filter the Sankey to sculptors born in that decade.
 *                  When absent, show all decades aggregated.
 *   ?stay=1        include same-country flows ("Born in France → Died
*                  in France"). Off by default so different-country
*                  endpoints remain legible; the toggle exposes the full
*                  eligible denominator without implying continuous residence.
 *
 * Both keys are shareable: the page link reproduces the exact decade +
 * toggle state. Default state always uses no params (clean URL).
 */
export function MigrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<MigrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredFlow, setHoveredFlow] = useState<MigrationFlow | null>(null);
  const [pinnedFlow, setPinnedFlow] = useState<MigrationFlow | null>(null);

  const decadeParam = searchParams.get("decade");
  const activeDecade = decadeParam ? Number(decadeParam) : null;
  const includeSameCountry = searchParams.get("stay") === "1";

  const setActiveDecade = useCallback(
    (decade: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (decade == null) {
        params.delete("decade");
      } else {
        params.set("decade", String(decade));
      }
      const qs = params.toString();
      router.replace(`/migration${qs ? `?${qs}` : ""}`, { scroll: false });
      // Pinned flow may not exist in the new decade — clear it.
      setPinnedFlow(null);
    },
    [searchParams, router]
  );

  const toggleSameCountry = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (includeSameCountry) {
      params.delete("stay");
    } else {
      params.set("stay", "1");
    }
    const qs = params.toString();
    router.replace(`/migration${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, includeSameCountry]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const m = await loadMigration();
        if (!cancelled) setData(m);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pick the flow set for the chart based on the decade filter. Falls
  // back gracefully if a stale ?decade= param has no entries.
  const flowsForChart = useMemo(() => {
    if (!data) return [];
    if (activeDecade != null) {
      return data.flowsByBirthDecade[String(activeDecade)] ?? [];
    }
    return data.flows;
  }, [data, activeDecade]);

  const decadesAvailable = useMemo(() => {
    if (!data) return [] as number[];
    return Object.keys(data.flowsByBirthDecade)
      .map((d) => Number(d))
      .filter((d) => d >= 1800)
      .sort((a, b) => a - b);
  }, [data]);

  // Stats specific to the active slice — recomputed when the slice or
  // toggle changes so the headline stays honest under filtering.
  const sliceStats = useMemo(() => {
    let total = 0;
    let crossed = 0;
    for (const f of flowsForChart) {
      total += f.count;
      if (!f.sameCountry) crossed += f.count;
    }
    const stayed = total - crossed;
    const pct = total > 0 ? Math.round((crossed / total) * 100) : 0;
    return { total, crossed, stayed, pct };
  }, [flowsForChart]);

  // The flow displayed in the side panel: pinned wins over hover so a
  // click "sticks" until the user clicks elsewhere or clears.
  const detailFlow = pinnedFlow ?? hoveredFlow;

  // Stable Sankey props — without these, hovering any corridor re-renders
  // the parent (hoveredFlow state change), which would otherwise pass a
  // fresh `onFlowClick` closure and a fresh `highlightedFlow` object into
  // MigrationSankey. The Sankey's D3 effect depends on those references,
  // so the entire SVG would be torn down and rebuilt on every mouseenter.
  // useCallback + useMemo keep the references stable across hover ticks.
  const handleFlowClick = useCallback((f: MigrationFlow) => {
    setPinnedFlow((cur) => (cur === f ? null : f));
  }, []);

  const highlightedFlow = useMemo(
    () =>
      pinnedFlow ? { from: pinnedFlow.from, to: pinnedFlow.to } : null,
    [pinnedFlow]
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading migration data" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Migration"
          subtitle="Birth → death country flows for the published sculptor set."
        />
        <EmptyState
          variant="block"
          title="Migration data not available"
          description="Re-run the pipeline (`pipeline/export_json.py`) to generate `migration.json`. This page reads from that file."
        />
      </div>
    );
  }

  const meta = data.meta;
  const subtitle =
    activeDecade != null
      ? `Recorded birth and death countries for eligible sculptors born in the ${activeDecade}s.`
      : `${meta.crossedBorders.toLocaleString()} of ${meta.eligible.toLocaleString()} eligible sculptors have different recorded birth and death countries. This endpoint comparison does not reconstruct a migration path.`;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Migration" subtitle={subtitle} />

      <DataScopeNote
        className="mb-6"
        source="Wikidata place of birth and place of death, resolved to country (P19/P20 → P17) and passed through the documented country-name normalization table."
        scope={`${meta.eligible.toLocaleString()} non-living published sculptors with both endpoint countries; ${meta.livingExcluded.toLocaleString()} living and ${(meta.missingBirthCountry + meta.missingDeathCountry).toLocaleString()} non-living records with a missing endpoint are excluded.`}
        limits="Different endpoint countries do not prove when, why, or how often a person moved; same-country endpoints do not prove they stayed there. Multi-successor historical states remain unresolved where a modern mapping would impose an editorial claim."
      />

      {/* Headline stats — slice-aware. Reads as a sentence rather than a row of cards. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label="Different endpoint countries"
          value={`${sliceStats.crossed.toLocaleString()}`}
          sub={`${sliceStats.pct}% of ${sliceStats.total.toLocaleString()} in view`}
          accent
        />
        <StatBlock
          label="Same endpoint country"
          value={`${sliceStats.stayed.toLocaleString()}`}
          sub={
            includeSameCountry
              ? "Shown as faint loops in the chart."
              : "Hidden by default — toggle below to include."
          }
        />
        <StatBlock
          label="Excluded from the view"
          value={`${meta.livingExcluded + meta.missingBirthCountry + meta.missingDeathCountry}`}
          sub={`${meta.livingExcluded} living, ${meta.missingBirthCountry} no birth country, ${meta.missingDeathCountry} no death country`}
        />
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-text-tertiary">Filter by birth decade:</span>
        <div className="flex flex-wrap gap-1.5">
          <DecadeChip
            label="All"
            active={activeDecade == null}
            onClick={() => setActiveDecade(null)}
          />
          {decadesAvailable.map((d) => (
            <DecadeChip
              key={d}
              label={`${d}s`}
              active={activeDecade === d}
              onClick={() => setActiveDecade(d)}
            />
          ))}
        </div>

        <label className="ml-auto inline-flex items-center gap-2 cursor-pointer select-none text-text-secondary hover:text-text-primary transition-colors">
          <input
            type="checkbox"
            checked={includeSameCountry}
            onChange={toggleSameCountry}
            className="accent-accent-primary"
          />
          Include same-country endpoints
        </label>
      </div>

      {/* Sankey + side panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <MigrationSankey
            flows={flowsForChart}
            includeSameCountry={includeSameCountry}
            onFlowHover={setHoveredFlow}
            onFlowClick={handleFlowClick}
            highlightedFlow={highlightedFlow}
          />
          <p className="mt-3 text-xs text-text-tertiary">
            Hover a corridor to inspect its records. Click to pin. The
            chart shows top {18} countries on each side; smaller flows
            collapse into <em>Other (born)</em> / <em>Other (died)</em>.
          </p>
        </section>

        <FlowDetailPanel
          flow={detailFlow}
          pinned={Boolean(pinnedFlow)}
          onClear={() => {
            setPinnedFlow(null);
            setHoveredFlow(null);
          }}
        />
      </div>

      {/* Top corridors callouts — clickable; clicking pins the flow */}
      {activeDecade == null && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Top corridors across the full dataset
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            The most frequent different-country endpoint pairs in the full
            eligible set. Counts describe this project&apos;s published records,
            not the prevalence or causes of migration in sculpture history.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {meta.topFlows.map((f, i) => (
              <li key={`${f.from}->${f.to}`}>
                <button
                  type="button"
                  onClick={() => setPinnedFlow(f)}
                  className="w-full text-left rounded-md bg-bg-secondary hover:bg-accent-muted p-3 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-tertiary tabular-nums w-5">
                      {i + 1}.
                    </span>
                    <span className="font-medium text-text-primary">
                      {f.from}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent-primary transition-colors" />
                    <span className="font-medium text-text-primary">
                      {f.to}
                    </span>
                    <span className="ml-auto text-text-tertiary tabular-nums">
                      {f.count}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

// ── small components, page-local ────────────────────────────────────────

function DecadeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "px-2.5 py-1 rounded-full text-xs font-medium bg-accent-primary text-white"
          : "px-2.5 py-1 rounded-full text-xs font-medium bg-bg-secondary text-text-secondary hover:bg-accent-muted hover:text-text-primary transition-colors"
      }
    >
      {label}
    </button>
  );
}

function FlowDetailPanel({
  flow,
  pinned,
  onClear,
}: {
  flow: MigrationFlow | null;
  pinned: boolean;
  onClear: () => void;
}) {
  // The panel is a passive sidebar by default. We only mark it as a
  // polite live region when the user has *pinned* a corridor (an
  // explicit click action), so screen-reader users don't hear an
  // announcement on every mouse-hover tick across the Sankey. Hover
  // is a noisy signal; pin is intent.
  const liveProps = pinned
    ? ({ "aria-live": "polite", "aria-atomic": true } as const)
    : ({} as const);
  if (!flow) {
    return (
      <aside
        className="rounded-md bg-bg-secondary p-4 text-sm text-text-tertiary self-start"
        aria-label="Migration corridor detail"
      >
        <p className="font-medium text-text-secondary mb-1">
          Hover a corridor
        </p>
        <p>
          The detail panel will show a sample of sculptors with that recorded
          birth-country → death-country pair. Click a corridor to pin it.
        </p>
      </aside>
    );
  }

  const isRollup =
    flow.from.startsWith("Other (") || flow.to.startsWith("Other (");

  return (
    <aside
      className="rounded-md bg-bg-secondary p-4 self-start"
      aria-label="Migration corridor detail"
      {...liveProps}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-xs uppercase tracking-[0.12em] text-text-tertiary">
          {flow.sameCountry ? "Same endpoint country" : "Endpoint pair"}
        </div>
        {pinned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Clear pinned corridor"
            className="h-6 px-2 -mr-2"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="font-display text-lg font-semibold text-text-primary leading-tight">
        {flow.from}{" "}
        <ArrowRight className="inline h-4 w-4 text-text-tertiary mb-0.5" aria-hidden="true" />{" "}
        {flow.to}
      </div>
      <div className="mt-1 text-sm text-text-secondary tabular-nums">
        {flow.count.toLocaleString()} sculptor{flow.count === 1 ? "" : "s"}
      </div>

      {isRollup && (
        <p className="mt-2 text-xs text-text-tertiary leading-snug">
          This corridor is a rollup of small flows below the chart&apos;s
          display threshold. The sample list below may include several
          true source / destination countries.
        </p>
      )}

      {flow.sculptors.length > 0 && (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-[0.12em] text-text-tertiary mb-1.5">
            Sample{flow.sculptors.length < flow.count ? ` (${flow.sculptors.length} of ${flow.count})` : ""}
          </div>
          <ul className="grid gap-1">
            {flow.sculptors.map((s) => (
              <li key={s.qid}>
                <Link
                  href={`/explore/${s.qid}`}
                  className="text-sm text-text-primary hover:text-accent-primary hover:underline transition-colors"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
