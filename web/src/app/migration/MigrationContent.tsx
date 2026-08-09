"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, X } from "lucide-react";
import { DataScopeNote } from "@/components/DataScopeNote";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { loadMigration } from "@/lib/data";
import type { MigrationData, MigrationFlow } from "@/lib/types";
import {
  createMigrationHref,
  findMigrationFlow,
  flowsForMigrationState,
  parseMigrationSearchParams,
  reconcileMigrationState,
  sortMigrationFlows,
  type MigrationUrlState,
} from "./migration-state";

const LEADING_PAIR_COUNT = 20;
const WIDE_SANKEY_QUERY = "(min-width: 1280px)";
const focusClass =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent-hover";
type MigrationSankeyModule = typeof import("@/components/charts/MigrationSankey");
function loadMigrationChart(moduleName: string): Promise<MigrationSankeyModule> {
  return import(
    `@/components/charts/${moduleName}`
  ) as Promise<MigrationSankeyModule>;
}
const MigrationSankey = lazy(
  () =>
    loadMigrationChart("MigrationSankey").then(
      (module) => ({ default: module.MigrationSankey }),
    ),
);
const migrationSankeyFallback = (
  <div
    role="status"
    className="flex min-h-64 items-center justify-center rounded-md bg-bg-secondary text-sm text-text-secondary"
  >
    Preparing the visual overview…
  </div>
);

function isRollupFlow(flow: MigrationFlow): boolean {
  return flow.from.startsWith("Other (") || flow.to.startsWith("Other (");
}

function useWideSankey(): boolean {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(WIDE_SANKEY_QUERY);
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isWide;
}

export function MigrationContent() {
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const parsed = useMemo(
    () => parseMigrationSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const initialUrlState = useRef(parsed.state);
  const [data, setData] = useState<MigrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredFlow, setHoveredFlow] = useState<MigrationFlow | null>(null);
  const [urlNotice, setUrlNotice] = useState<string | null>(() =>
    parsed.hadInvalidParameters
      ? "Unsupported Migration URL options were reset to the canonical view."
      : null,
  );
  const isWideSankey = useWideSankey();

  const reconciled = useMemo(
    () => (data ? reconcileMigrationState(parsed.state, data) : null),
    [data, parsed.state],
  );
  const state = reconciled?.state ?? parsed.state;

  useEffect(() => {
    if (!parsed.needsCanonicalization) return;
    window.history.replaceState(null, "", createMigrationHref(parsed.state));
  }, [parsed]);

  useEffect(() => {
    if (!data || !reconciled?.changed) return;
    window.history.replaceState(null, "", createMigrationHref(reconciled.state));
  }, [data, reconciled]);

  useEffect(() => {
    let active = true;

    async function load() {
      const migration = await loadMigration();
      if (active) {
        setData(migration);
        if (migration) {
          const initialReconciliation = reconcileMigrationState(
            initialUrlState.current,
            migration,
          );
          if (
            initialReconciliation.invalidDecade &&
            initialReconciliation.stalePair
          ) {
            setUrlNotice(
              "The shared decade and endpoint pair are not available in this snapshot and were reset.",
            );
          } else if (initialReconciliation.invalidDecade) {
            setUrlNotice(
              "The shared birth decade is not available in this snapshot and was reset.",
            );
          } else if (initialReconciliation.stalePair) {
            setUrlNotice(
              "The shared endpoint pair is not available in the current filters and was reset.",
            );
          }
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setHoveredFlow(null);
      setUrlNotice(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const commitState = useCallback(
    (nextState: MigrationUrlState) => {
      const next = data
        ? reconcileMigrationState(nextState, data)
        : { state: nextState, stalePair: false };
      const href = createMigrationHref(next.state);
      setHoveredFlow(null);
      setUrlNotice(
        next.stalePair
          ? "The selected endpoint pair is not available in the new filters and was reset."
          : null,
      );
      if (`${window.location.pathname}${window.location.search}` !== href) {
        window.history.pushState(null, "", href);
      }
    },
    [data],
  );

  const availableDecades = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.flowsByBirthDecade)
      .map(Number)
      .filter((decade) => decade >= 1800)
      .sort((left, right) => left - right);
  }, [data]);

  const sliceFlows = useMemo(() => {
    if (!data) return [];
    return state.decade === null
      ? data.flows
      : (data.flowsByBirthDecade[String(state.decade)] ?? []);
  }, [data, state.decade]);
  const visibleFlows = useMemo(
    () => (data ? flowsForMigrationState(data, state) : []),
    [data, state],
  );
  const rankedFlows = useMemo(
    () => sortMigrationFlows(visibleFlows),
    [visibleFlows],
  );
  const selectedFlow = useMemo(
    () => findMigrationFlow(visibleFlows, state.from, state.to),
    [state.from, state.to, visibleFlows],
  );
  const detailFlow = selectedFlow ?? hoveredFlow;

  const sliceStats = useMemo(() => {
    const total = sliceFlows.reduce((sum, flow) => sum + flow.count, 0);
    const crossed = sliceFlows.reduce(
      (sum, flow) => sum + (flow.sameCountry ? 0 : flow.count),
      0,
    );
    const stayed = total - crossed;
    return {
      total,
      crossed,
      stayed,
      pct: total > 0 ? Math.round((crossed / total) * 100) : 0,
      visibleRecords: visibleFlows.reduce((sum, flow) => sum + flow.count, 0),
    };
  }, [sliceFlows, visibleFlows]);

  const selectFlow = useCallback(
    (flow: MigrationFlow) => {
      if (isRollupFlow(flow)) {
        setHoveredFlow(flow);
        setUrlNotice(
          "“Other” is an overview rollup, not a country. Choose a recorded country pair from the ranked list to create a shareable selection.",
        );
        return;
      }
      commitState({ ...state, from: flow.from, to: flow.to });
    },
    [commitState, state],
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
          subtitle="Recorded birth- and death-country endpoints for published sculptors."
        />
        <EmptyState
          variant="block"
          title="The Migration view could not be loaded"
          description="Reload the page to retry. No partial endpoint-country view is being presented as complete."
        />
      </div>
    );
  }

  const meta = data.meta;
  const excludedCount =
    meta.livingExcluded + meta.missingBirthCountry + meta.missingDeathCountry;
  const subtitle =
    state.decade === null
      ? `${meta.crossedBorders.toLocaleString()} of ${meta.eligible.toLocaleString()} eligible sculptors have different recorded birth and death countries. This does not reconstruct a migration path.`
      : `Which recorded birth/death-country endpoints differ for eligible sculptors born in the ${state.decade}s?`;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader className="mb-5" title="Migration" subtitle={subtitle} />

      <DataScopeNote
        compactMobile
        className="mb-5"
        source="Wikidata place of birth and place of death, resolved to country (P19/P20 → P17) and passed through the documented country-name normalization table."
        scope={`${meta.eligible.toLocaleString()} non-living published sculptors with both endpoint countries; ${meta.livingExcluded.toLocaleString()} living people, ${meta.missingBirthCountry.toLocaleString()} non-living records without birth country, and ${meta.missingDeathCountry.toLocaleString()} without death country are excluded.`}
        limits="Different endpoints do not prove when, why, how often, or how permanently someone moved; matching endpoints do not prove they stayed in one country. Multi-successor historical states remain unresolved where a modern mapping would impose an editorial claim. “Other” is a wide-chart display rollup, not a country."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MigrationStatBlock
          label="Different endpoint countries"
          value={sliceStats.crossed.toLocaleString()}
          sub={`${sliceStats.pct}% of ${sliceStats.total.toLocaleString()} eligible records ${state.decade === null ? "in the full view" : "in this decade view"}`}
          accent
        />
        <MigrationStatBlock
          label="Same endpoint country"
          value={sliceStats.stayed.toLocaleString()}
          sub={
            state.includeSameCountry
              ? "Included in the current pair list and overview."
              : "Excluded from the pair list by default; use the control below to include them."
          }
        />
        <MigrationStatBlock
          label="Excluded from the full view"
          value={excludedCount.toLocaleString()}
          sub={`${meta.livingExcluded.toLocaleString()} living, ${meta.missingBirthCountry.toLocaleString()} no birth country, ${meta.missingDeathCountry.toLocaleString()} no death country`}
        />
      </div>

      <fieldset className="mb-5" aria-describedby="migration-filter-status">
        <legend className="mb-2 text-sm font-medium text-text-primary">
          Filter endpoint pairs
        </legend>
        <div className="grid gap-3 sm:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-text-primary">
            Birth decade
            <select
              value={state.decade ?? ""}
              onChange={(event) =>
                commitState({
                  ...state,
                  decade: event.currentTarget.value
                    ? Number(event.currentTarget.value)
                    : null,
                })
              }
              className={`min-h-11 rounded-md border border-border-axis bg-bg-primary px-3 py-2 text-base font-normal text-text-primary ${focusClass}`}
            >
              <option value="">All birth decades</option>
              {availableDecades.map((decade) => (
                <option key={decade} value={decade}>
                  {decade}s
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm text-text-primary hover:bg-accent-muted motion-reduce:transition-none">
            <input
              type="checkbox"
              checked={state.includeSameCountry}
              onChange={(event) =>
                commitState({
                  ...state,
                  includeSameCountry: event.currentTarget.checked,
                })
              }
              className={`h-5 w-5 shrink-0 accent-accent-primary ${focusClass}`}
            />
            <span>Include same-country endpoints</span>
          </label>
        </div>
        <p
          id="migration-filter-status"
          data-testid="migration-filter-status"
          className="mt-2 text-xs text-text-secondary"
          aria-live="polite"
        >
          {rankedFlows.length.toLocaleString()} recorded endpoint pair
          {rankedFlows.length === 1 ? "" : "s"} representing{" "}
          {sliceStats.visibleRecords.toLocaleString()} sculptor
          {sliceStats.visibleRecords === 1 ? "" : "s"} in the current
          structured view.
        </p>
      </fieldset>

      {urlNotice ? (
        <div
          role="status"
          data-testid="migration-url-notice"
          className="mb-5 rounded-md border border-border-axis bg-bg-secondary px-4 py-3 text-sm text-text-primary"
        >
          {urlNotice}
        </div>
      ) : null}

      {isWideSankey ? (
        <div data-testid="migration-wide-view">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0" aria-labelledby="migration-overview-heading">
              <div className="mb-3">
                <h2
                  id="migration-overview-heading"
                  className="font-display text-xl text-text-primary"
                >
                  Endpoint overview
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-text-secondary">
                  Corridor width shows the number of records in the same
                  filtered pair array used by the ranked view below. Position
                  is layout, not geography or a reconstructed journey.
                </p>
              </div>
              <Suspense fallback={migrationSankeyFallback}>
                <MigrationSankey
                  flows={visibleFlows}
                  onFlowHover={setHoveredFlow}
                  onFlowClick={selectFlow}
                  highlightedFlow={
                    selectedFlow
                      ? { from: selectedFlow.from, to: selectedFlow.to }
                      : null
                  }
                />
              </Suspense>
              <p className="mt-3 text-xs text-text-tertiary">
                Hover a corridor for a preview. Select exact country pairs
                from the structured view to create a reproducible URL. The
                overview keeps the top 18 countries on each side and groups
                the long tail into <em>Other (born)</em> and{" "}
                <em>Other (died)</em>; those labels are rollups, not countries.
              </p>
            </section>

            <FlowDetailPanel
              flow={detailFlow}
              selected={Boolean(selectedFlow)}
              onClear={() =>
                commitState({ ...state, from: null, to: null })
              }
            />
          </div>

          <div className="mt-10 max-w-5xl">
            <RankedPairView
              flows={rankedFlows}
              selectedFlow={selectedFlow}
              includeSameCountry={state.includeSameCountry}
              onSelect={selectFlow}
            />
          </div>
        </div>
      ) : (
        <div data-testid="migration-reflow-view">
          <RankedPairView
            flows={rankedFlows}
            selectedFlow={selectedFlow}
            includeSameCountry={state.includeSameCountry}
            onSelect={selectFlow}
          />
          <div className="mt-6">
            <FlowDetailPanel
              flow={selectedFlow}
              selected={Boolean(selectedFlow)}
              onClear={() =>
                commitState({ ...state, from: null, to: null })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RankedPairView({
  flows,
  selectedFlow,
  includeSameCountry,
  onSelect,
}: {
  flows: MigrationFlow[];
  selectedFlow: MigrationFlow | null;
  includeSameCountry: boolean;
  onSelect: (flow: MigrationFlow) => void;
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const leading = flows.slice(0, LEADING_PAIR_COUNT);
  const remaining = flows.slice(LEADING_PAIR_COUNT);

  return (
    <section
      aria-labelledby="migration-ranked-heading"
      data-testid="migration-structured-view"
    >
      <div className="mb-3">
        <h2
          id="migration-ranked-heading"
          className="font-display text-xl text-text-primary"
        >
          Ranked endpoint pairs
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          {includeSameCountry
            ? "Different- and same-country endpoint pairs are ranked together by record count."
            : "Different-country endpoint pairs are ranked by record count; include same-country endpoints with the control above."}{" "}
          Every row names the recorded countries directly. The chart&apos;s
          “Other” rollups do not appear here.
        </p>
      </div>

      {flows.length === 0 ? (
        <EmptyState
          variant="block"
          title="No endpoint-country pairs for this view"
          description="No eligible recorded pairs match the current filters. Choose another birth decade or include same-country endpoints."
        />
      ) : (
        <>
          <PairList
            flows={leading}
            start={1}
            selectedFlow={selectedFlow}
            onSelect={onSelect}
            testId="migration-leading-pairs"
          />
          {remaining.length > 0 ? (
            <details
              open={showRemaining}
              onToggle={(event) => setShowRemaining(event.currentTarget.open)}
              className="mt-4"
              data-testid="migration-all-pairs-disclosure"
            >
              <summary
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm px-2 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
              >
                Browse the remaining {remaining.length.toLocaleString()} pair
                {remaining.length === 1 ? "" : "s"} ({flows.length.toLocaleString()} total)
              </summary>
              {showRemaining ? (
                <div className="mt-3">
                  <PairList
                    flows={remaining}
                    start={LEADING_PAIR_COUNT + 1}
                    selectedFlow={selectedFlow}
                    onSelect={onSelect}
                    testId="migration-remaining-pairs"
                  />
                </div>
              ) : null}
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}

function PairList({
  flows,
  start,
  selectedFlow,
  onSelect,
  testId,
}: {
  flows: MigrationFlow[];
  start: number;
  selectedFlow: MigrationFlow | null;
  onSelect: (flow: MigrationFlow) => void;
  testId: string;
}) {
  return (
    <ol start={start} className="overflow-hidden" data-testid={testId}>
      {flows.map((flow, index) => {
        const selected =
          selectedFlow?.from === flow.from && selectedFlow.to === flow.to;
        return (
          <li
            key={`${flow.from}->${flow.to}`}
            value={start + index}
            className={index % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"}
          >
            <button
              type="button"
              aria-pressed={selected}
              aria-controls="migration-pair-detail"
              aria-label={`Select ${flow.from} to ${flow.to}, ${flow.count.toLocaleString()} sculptor${flow.count === 1 ? "" : "s"}`}
              data-flow-from={flow.from}
              data-flow-to={flow.to}
              onClick={() => onSelect(flow)}
              className={`grid min-h-11 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-sm border px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none ${focusClass} ${
                selected
                  ? "border-accent-primary bg-accent-muted text-text-primary"
                  : "border-transparent text-text-primary hover:bg-accent-muted"
              }`}
            >
              <span className="text-text-secondary tabular-nums">
                {start + index}.
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                <span>{flow.from}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 text-text-tertiary"
                  aria-hidden="true"
                />
                <span>{flow.to}</span>
              </span>
              <span className="tabular-nums text-text-secondary">
                {flow.count.toLocaleString()}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function FlowDetailPanel({
  flow,
  selected,
  onClear,
}: {
  flow: MigrationFlow | null;
  selected: boolean;
  onClear: () => void;
}) {
  const liveProps = selected
    ? ({ "aria-live": "polite", "aria-atomic": true } as const)
    : ({} as const);

  if (!flow) {
    return (
      <aside
        id="migration-pair-detail"
        className="rounded-md bg-bg-secondary p-4 text-sm text-text-secondary"
        aria-label="Selected endpoint pair detail"
      >
        <p className="font-medium text-text-primary">Choose an endpoint pair</p>
        <p className="mt-1">
          Use the ranked list to inspect its count and deterministic sculptor
          links. On wide screens, hovering the Sankey provides a temporary
          overview preview without changing the shared URL.
        </p>
      </aside>
    );
  }

  const rollup = isRollupFlow(flow);

  return (
    <aside
      id="migration-pair-detail"
      className="rounded-md bg-bg-secondary p-4"
      aria-label="Selected endpoint pair detail"
      {...liveProps}
    >
      <div className="mb-2 flex min-h-11 items-start justify-between gap-2">
        <div className="pt-1 text-xs uppercase tracking-[0.12em] text-text-secondary">
          {rollup
            ? "Overview rollup"
            : flow.sameCountry
              ? "Same endpoint country"
              : "Selected endpoint pair"}
        </div>
        {selected ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selected endpoint pair"
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-text-secondary hover:bg-bg-primary hover:text-text-primary ${focusClass}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="font-display text-lg font-semibold leading-tight text-text-primary">
        {flow.from}{" "}
        <ArrowRight
          className="mb-0.5 inline h-4 w-4 text-text-tertiary"
          aria-hidden="true"
        />{" "}
        {flow.to}
      </div>
      <div className="mt-1 text-sm tabular-nums text-text-secondary">
        {flow.count.toLocaleString()} sculptor{flow.count === 1 ? "" : "s"}
      </div>

      {rollup ? (
        <p className="mt-2 text-xs leading-snug text-text-secondary">
          This is a display rollup of several smaller recorded country pairs,
          not a country and not a shareable raw pair. Its sample may contain
          several true birth or death countries.
        </p>
      ) : null}

      {flow.sculptors.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1.5 text-xs uppercase tracking-[0.12em] text-text-secondary">
            Sample
            {flow.sculptors.length < flow.count
              ? ` (${flow.sculptors.length} of ${flow.count})`
              : ""}
          </div>
          <ul className="grid gap-1">
            {flow.sculptors.map((sculptor) => (
              <li key={sculptor.qid}>
                <Link
                  href={`/explore/${sculptor.qid}`}
                  prefetch={false}
                  className={`flex min-h-11 items-center rounded-sm px-2 text-sm font-medium text-accent-hover hover:bg-bg-primary hover:underline ${focusClass}`}
                >
                  {sculptor.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-secondary">
          No sample names are published for this pair.
        </p>
      )}
    </aside>
  );
}

function MigrationStatBlock({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-bg-secondary p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-text-secondary">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-semibold tabular-nums leading-tight ${
          accent ? "text-accent-hover" : "text-text-primary"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs leading-snug text-text-secondary">{sub}</div>
    </div>
  );
}
