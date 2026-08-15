"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MousePointerClick, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataScopeNote } from "@/components/DataScopeNote";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import {
  loadFocusSculptors,
  loadGeographyByBirthCountry,
  loadGeographyByDecade,
  loadMaterialsByDecade,
  loadMovementsByDecade,
} from "@/lib/data";
import { dataSnapshot } from "@/lib/snapshot";
import type { DecadeAggregation, LegacySculptor } from "@/lib/types";
import { formatDisplayValue } from "@/lib/utils";
import {
  createEvolutionHref,
  evolutionDecade,
  focusSculptorsForDecade,
  parseEvolutionSearchParams,
  projectEvolutionData,
  reconcileEvolutionState,
  type EvolutionCategoryCount,
  type EvolutionProjection,
  type EvolutionSeriesProjection,
  type EvolutionUrlState,
  type GeoSource,
} from "./evolution-state";

// At 1280 CSS px the desktop shell leaves every committed geography decade
// band at least 24px wide. Narrower layouts use the structured task instead.
const WIDE_EVOLUTION_QUERY = "(min-width: 1280px)";
const focusClass =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent-hover";

interface LoadedEvolutionData {
  geographyByCitizenship: DecadeAggregation[];
  geographyByBirthCountry: DecadeAggregation[];
  movements: DecadeAggregation[];
  materials: DecadeAggregation[];
  focusSculptors: LegacySculptor[];
  materialsUnavailable: boolean;
}

type EvolutionChartsModule = typeof import("@/components/charts/EvolutionCharts");
function loadEvolutionCharts(moduleName: string): Promise<EvolutionChartsModule> {
  return import(
    `@/components/charts/${moduleName}`
  ) as Promise<EvolutionChartsModule>;
}

function useWideEvolution(): boolean {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(WIDE_EVOLUTION_QUERY);
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isWide;
}

function categoryLabel(
  category: string,
  kind: "geography" | "movement" | "material",
): string {
  if (category === "Other" || category === "Unknown") return category;
  return formatDisplayValue(category, {
    isMovement: kind === "movement",
    isName: kind === "geography",
  });
}

export function EvolutionContent() {
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const parsed = useMemo(
    () => parseEvolutionSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const initialUrlState = useRef(parsed.state);
  const [loaded, setLoaded] = useState<LoadedEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiredDataUnavailable, setRequiredDataUnavailable] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [chartModule, setChartModule] = useState<EvolutionChartsModule | null>(
    null,
  );
  const [chartModuleUnavailable, setChartModuleUnavailable] = useState(false);
  const [urlNotice, setUrlNotice] = useState<string | null>(() =>
    parsed.hadInvalidParameters
      ? "Unsupported Evolution URL options were reset to the canonical view."
      : null,
  );
  const isWide = useWideEvolution();

  useEffect(() => {
    if (!isWide || chartModule || chartModuleUnavailable) return;
    let active = true;
    loadEvolutionCharts("EvolutionCharts")
      .then((module) => {
        if (active) setChartModule(module);
      })
      .catch(() => {
        if (active) setChartModuleUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [chartModule, chartModuleUnavailable, isWide]);

  const projection = useMemo<EvolutionProjection | null>(() => {
    if (!loaded) return null;
    return projectEvolutionData(loaded);
  }, [loaded]);
  const reconciled = useMemo(
    () =>
      projection
        ? reconcileEvolutionState(parsed.state, projection.artistDecades)
        : null,
    [parsed.state, projection],
  );
  const state = reconciled?.state ?? parsed.state;

  useEffect(() => {
    if (!parsed.needsCanonicalization) return;
    window.history.replaceState(null, "", createEvolutionHref(parsed.state));
  }, [parsed]);

  useEffect(() => {
    if (!projection || !reconciled?.changed) return;
    window.history.replaceState(
      null,
      "",
      createEvolutionHref(reconciled.state),
    );
  }, [projection, reconciled]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const results = await Promise.allSettled([
        loadGeographyByDecade(),
        loadGeographyByBirthCountry(),
        loadMovementsByDecade(),
        loadFocusSculptors(),
        loadMaterialsByDecade(),
      ]);
      if (!active) return;

      const [citizenship, birthCountry, movements, focusSculptors, materials] =
        results;
      if (
        citizenship.status === "rejected" ||
        birthCountry.status === "rejected" ||
        movements.status === "rejected" ||
        focusSculptors.status === "rejected"
      ) {
        setRequiredDataUnavailable(true);
        setLoading(false);
        return;
      }

      const nextLoaded: LoadedEvolutionData = {
        geographyByCitizenship: citizenship.value,
        geographyByBirthCountry: birthCountry.value,
        movements: movements.value,
        focusSculptors: focusSculptors.value,
        materials: materials.status === "fulfilled" ? materials.value : [],
        materialsUnavailable: materials.status === "rejected",
      };
      const initialReconciliation = reconcileEvolutionState(
        initialUrlState.current,
        projectEvolutionData(nextLoaded).artistDecades,
      );
      if (initialReconciliation.invalidDecade) {
        setUrlNotice(
          "The shared birth decade is not available in this data snapshot and was reset.",
        );
      }
      setLoaded(nextLoaded);
      setLoading(false);
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => setUrlNotice(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const commitState = useCallback(
    (nextState: EvolutionUrlState) => {
      const next = projection
        ? reconcileEvolutionState(nextState, projection.artistDecades).state
        : nextState;
      const href = createEvolutionHref(next);
      setUrlNotice(null);
      if (`${window.location.pathname}${window.location.search}` !== href) {
        window.history.pushState(null, "", href);
      }
    },
    [projection],
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading Evolution data" />
      </div>
    );
  }

  if (
    requiredDataUnavailable ||
    !loaded ||
    !projection ||
    projection.artistDecades.length === 0
  ) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Evolution of Sculpture"
          subtitle="Recorded geography and movement labels over sculptor birth time."
        />
        <EmptyState
          title="The Evolution view could not be loaded"
          description="Reload the page to retry. No partial geography or movement projection is being presented as complete."
        />
      </div>
    );
  }

  const activeGeography = projection.geography[state.geo];
  const selectedGeography = evolutionDecade(activeGeography, state.decade);
  const selectedMovements = evolutionDecade(projection.movements, state.decade);
  const filteredSculptors = focusSculptorsForDecade(
    projection.focusSculptors,
    state.decade,
  );
  const missingMovementRecords = Math.max(
    0,
    dataSnapshot.includedSculptors - projection.movements.totalRecords,
  );
  const geographyLabel =
    state.geo === "birth" ? "recorded birth country" : "display citizenship";
  const materialsScope = loaded.materialsUnavailable
    ? "The independent materials input is temporarily unavailable."
    : `Materials uses ${projection.materials.totalRecords.toLocaleString()} categorized, dated museum objects.`;
  const ArtistCharts = chartModule?.EvolutionArtistCharts;
  const MaterialChart = chartModule?.EvolutionMaterialChart;

  const selectDecade = (decade: number) =>
    commitState({ ...state, decade: state.decade === decade ? null : decade });

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Evolution of Sculpture"
        subtitle="How do recorded geography and movement labels change by sculptor birth decade?"
      />
      <DataScopeNote
        compactMobile
        className="mb-6"
        source="Wikidata P27/P19/P17/P135 for geography and movement labels; matched Met and Art Institute of Chicago object metadata for materials."
        scope={`Geography uses all ${dataSnapshot.eligibleCandidates.toLocaleString()} analytically eligible candidates and contains ${activeGeography.unknownRecords.toLocaleString()} Unknown ${geographyLabel} records. Movement uses ${projection.movements.totalRecords.toLocaleString()} records with P135 labels; ${missingMovementRecords.toLocaleString()} published sculptors lack one. ${materialsScope} The ${projection.focusSculptors.length.toLocaleString()} focus sculptors are a curated follow-through roster, not an analytical denominator.`}
        limits="These views have incompatible denominators. Citizenship is not identity, residence, or culture; birth country is not later residence; P135 does not prove membership or influence. Other is a display rollup and Unknown is missing source data. Materials use object dates from bounded focus-list-biased searches, not artist birth decades or overall practice."
      />

      <EvolutionControls
        state={state}
        decades={projection.artistDecades}
        onChange={commitState}
      />

      {urlNotice ? (
        <div
          role="status"
          data-testid="evolution-url-notice"
          className="mb-6 rounded-md border border-border-axis bg-bg-secondary px-4 py-3 text-sm text-text-primary"
        >
          {urlNotice}
        </div>
      ) : null}

      {isWide && showHint ? (
        <div className="mb-8 flex w-fit items-center gap-2 rounded-md bg-accent-muted px-3 py-2 text-sm text-accent-hover">
          <MousePointerClick aria-hidden="true" className="h-4 w-4" />
          <span>Click a chart decade or use the birth-decade control.</span>
          <button
            type="button"
            onClick={() => setShowHint(false)}
            className={`ml-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded hover:bg-bg-secondary ${focusClass}`}
            aria-label="Dismiss chart interaction hint"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <section aria-labelledby="evolution-artist-overview-heading">
        <h2
          id="evolution-artist-overview-heading"
          className="font-display text-2xl text-text-primary"
        >
          Birth-decade overview
        </h2>
        <p className="mt-1 mb-5 max-w-4xl text-sm text-text-secondary">
          Each decade uses the same projected categories and totals in the
          visual and structured paths. Geography and movement are measured
          against sculptor birth decade.
        </p>

        {isWide ? (
          <>
            {ArtistCharts ? (
              <ArtistCharts
                geoSource={state.geo}
                geography={activeGeography}
                movements={projection.movements}
                activeDecade={state.decade}
                onDecadeClick={selectDecade}
              />
            ) : chartModuleUnavailable ? (
              <ChartUnavailable />
            ) : (
              <ChartFallback label="Preparing visual overviews" />
            )}
            <details
              data-testid="evolution-wide-structured-disclosure"
              className="mt-8"
            >
              <summary
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm px-2 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
              >
                Read exact birth-decade overview ({projection.artistDecades.length} decades)
              </summary>
              <div className="mt-4">
                <ArtistDecadeOverview
                  decades={projection.artistDecades}
                  geography={activeGeography}
                  movements={projection.movements}
                  geoSource={state.geo}
                  activeDecade={state.decade}
                  testId="evolution-wide-structured-overview"
                />
              </div>
            </details>
          </>
        ) : (
          <div data-testid="evolution-reflow-view">
            <ArtistDecadeOverview
              decades={projection.artistDecades}
              geography={activeGeography}
              movements={projection.movements}
              geoSource={state.geo}
              activeDecade={state.decade}
              testId="evolution-reflow-overview"
            />
          </div>
        )}
      </section>

      {state.decade !== null ? (
        <SelectedDecadeDetails
          decade={state.decade}
          geoSource={state.geo}
          geography={selectedGeography}
          movements={selectedMovements}
          onClear={() => commitState({ ...state, decade: null })}
        />
      ) : null}

      <FocusRoster
        sculptors={filteredSculptors}
        total={projection.focusSculptors.length}
        decade={state.decade}
        onClear={() => commitState({ ...state, decade: null })}
      />

      <section
        aria-labelledby="evolution-materials-heading"
        className="mt-14"
      >
        <h2
          id="evolution-materials-heading"
          className="font-display text-2xl text-text-primary"
        >
          Materials over museum-object time
        </h2>
        <p className="mt-1 mb-5 max-w-4xl text-sm text-text-secondary">
          This separate view asks which material categories appear in the
          bounded museum sample. Its object-date axis and denominator never
          inherit the sculptor birth-decade selection above.
        </p>
        {loaded.materialsUnavailable ? (
          <EmptyState
            title="Materials data is temporarily unavailable"
            description="The geography, movement, and focus tasks remain complete. Reload to retry the independent museum-object view."
          />
        ) : (
          <>
            {isWide ? (
              MaterialChart ? (
                <MaterialChart materials={projection.materials} />
              ) : chartModuleUnavailable ? (
                <ChartUnavailable />
              ) : (
                <ChartFallback label="Preparing materials overview" />
              )
            ) : (
              <MaterialsDecadeOverview
                projection={projection.materials}
                testId="evolution-materials-reflow-overview"
              />
            )}
            {isWide ? (
              <details className="mt-6" data-testid="evolution-materials-disclosure">
                <summary
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm px-2 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
                >
                  Read exact museum-object decade overview ({projection.materials.decades.length} decades)
                </summary>
                <div className="mt-4">
                  <MaterialsDecadeOverview
                    projection={projection.materials}
                    testId="evolution-materials-wide-overview"
                  />
                </div>
              </details>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function EvolutionControls({
  state,
  decades,
  onChange,
}: {
  state: EvolutionUrlState;
  decades: number[];
  onChange: (state: EvolutionUrlState) => void;
}) {
  return (
    <fieldset className="mb-6 rounded-md border border-border-axis px-4 py-4">
      <legend className="px-1 text-sm font-semibold text-text-primary">
        Evolution controls
      </legend>
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <div>
          <span id="evolution-geo-label" className="text-sm text-text-secondary">
            Geography source
          </span>
          <div
            aria-labelledby="evolution-geo-label"
            className="mt-1 grid grid-cols-2 gap-2"
          >
            {([
              ["citz", "Citizenship"],
              ["birth", "Birth country"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={state.geo === value}
                onClick={() => onChange({ ...state, geo: value })}
                className={`min-h-11 rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${focusClass} ${
                  state.geo === value
                    ? "border-accent-hover bg-accent-hover text-bg-primary"
                    : "border-border-axis bg-bg-primary text-text-primary hover:bg-bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm text-text-secondary">
          Sculptor birth decade
          <select
            aria-label="Sculptor birth decade"
            value={state.decade ?? ""}
            onChange={(event) =>
              onChange({
                ...state,
                decade: event.currentTarget.value
                  ? Number(event.currentTarget.value)
                  : null,
              })
            }
            className={`mt-1 min-h-11 w-full rounded-sm border border-border-axis bg-bg-primary px-3 py-2 text-sm text-text-primary ${focusClass}`}
          >
            <option value="">All birth decades</option>
            {decades.map((decade) => (
              <option key={decade} value={decade}>
                {decade}s
              </option>
            ))}
          </select>
        </label>
      </div>
      <p
        role="status"
        aria-live="polite"
        data-testid="evolution-filter-status"
        className="mt-3 text-xs text-text-secondary"
      >
        {decades.length} sculptor birth decades · geography source: {state.geo === "birth" ? "recorded birth country" : "display citizenship"} · {state.decade === null ? "all decades shown" : `${state.decade}s selected`}.
      </p>
    </fieldset>
  );
}

function ChartFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex min-h-64 items-center justify-center rounded-md bg-bg-secondary text-sm text-text-secondary"
    >
      {label}…
    </div>
  );
}

function ChartUnavailable() {
  return (
    <EmptyState
      variant="block"
      title="The visual overview could not be loaded"
      description="Use the exact structured overview below for the complete category counts."
    />
  );
}

function LeadingCounts({
  entries,
  kind,
}: {
  entries: EvolutionCategoryCount[];
  kind: "geography" | "movement" | "material";
}) {
  if (entries.length === 0) {
    return <span className="text-text-secondary">No recorded categories</span>;
  }
  return (
    <span>
      {entries.map((entry, index) => (
        <span key={entry.category}>
          {index > 0 ? " · " : ""}
          {categoryLabel(entry.category, kind)} {entry.count.toLocaleString()}
        </span>
      ))}
    </span>
  );
}

function ArtistDecadeOverview({
  decades,
  geography,
  movements,
  geoSource,
  activeDecade,
  testId,
}: {
  decades: number[];
  geography: EvolutionSeriesProjection;
  movements: EvolutionSeriesProjection;
  geoSource: GeoSource;
  activeDecade: number | null;
  testId: string;
}) {
  return (
    <ol data-testid={testId} className="space-y-3">
      {decades.map((decade) => {
        const geo = evolutionDecade(geography, decade);
        const movement = evolutionDecade(movements, decade);
        const active = decade === activeDecade;
        return (
          <li
            key={decade}
            data-evolution-decade-row={decade}
            data-geography-total={geo?.total ?? 0}
            data-movement-total={movement?.total ?? 0}
            className={`rounded-md bg-bg-secondary px-4 py-3 ${
              active ? "outline-2 outline-offset-2 outline-accent-hover" : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg text-text-primary">
                {decade}s
              </h3>
              {active ? (
                <span className="text-xs font-semibold text-text-primary">
                  Selected
                </span>
              ) : null}
            </div>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-text-primary">
                  {geoSource === "birth" ? "Birth country" : "Citizenship"} · {geo?.total.toLocaleString() ?? "0"} sculptors
                </dt>
                <dd className="mt-0.5 text-sm text-text-secondary">
                  <LeadingCounts entries={geo?.leading ?? []} kind="geography" />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-primary">
                  Recorded movement · {movement?.total.toLocaleString() ?? "0"} labels
                </dt>
                <dd className="mt-0.5 text-sm text-text-secondary">
                  <LeadingCounts entries={movement?.leading ?? []} kind="movement" />
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}

function SelectedDecadeDetails({
  decade,
  geoSource,
  geography,
  movements,
  onClear,
}: {
  decade: number;
  geoSource: GeoSource;
  geography: ReturnType<typeof evolutionDecade>;
  movements: ReturnType<typeof evolutionDecade>;
  onClear: () => void;
}) {
  return (
    <section
      aria-labelledby="evolution-selected-heading"
      data-testid="evolution-selected-decade"
      className="mt-12"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="evolution-selected-heading"
            className="font-display text-2xl text-text-primary"
          >
            {decade}s selected birth decade
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Complete projected category rankings for this shared state.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/decade/${decade}`}
            className={`inline-flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
          >
            Open the {decade}s page →
          </Link>
          <Button type="button" variant="outline" onClick={onClear}>
            Clear birth decade
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CategoryRanking
          title={geoSource === "birth" ? "Recorded birth country" : "Display citizenship"}
          row={geography}
          kind="geography"
          testId="evolution-selected-geography"
        />
        <CategoryRanking
          title="Recorded movement labels"
          row={movements}
          kind="movement"
          testId="evolution-selected-movements"
        />
      </div>
    </section>
  );
}

function CategoryRanking({
  title,
  row,
  kind,
  testId,
}: {
  title: string;
  row: ReturnType<typeof evolutionDecade>;
  kind: "geography" | "movement";
  testId: string;
}) {
  return (
    <div className="rounded-md bg-bg-secondary px-4 py-4">
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">
        {row?.total.toLocaleString() ?? "0"} records
      </p>
      {row && row.categories.length > 0 ? (
        <ol data-testid={testId} className="mt-3 space-y-1.5">
          {row.categories.map((entry, index) => (
            <li
              key={entry.category}
              data-category={entry.category}
              data-count={entry.count}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-2 text-sm text-text-secondary"
            >
              <span>{index + 1}.</span>
              <span>{categoryLabel(entry.category, kind)}</span>
              <span className="tabular-nums text-text-primary">
                {entry.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-text-secondary">
          No recorded categories for this decade.
        </p>
      )}
    </div>
  );
}

function FocusRoster({
  sculptors,
  total,
  decade,
  onClear,
}: {
  sculptors: LegacySculptor[];
  total: number;
  decade: number | null;
  onClear: () => void;
}) {
  return (
    <section aria-labelledby="evolution-focus-heading" className="mt-12">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2
          id="evolution-focus-heading"
          className="font-display text-2xl text-text-primary"
        >
          {decade === null ? "Curated focus sculptors" : `${decade}s focus sculptors`}
        </h2>
        <span className="text-sm text-text-secondary">
          {sculptors.length} of {total}
        </span>
      </div>
      <p className="mb-4 max-w-4xl text-sm text-text-secondary">
        Named follow-through from the curated 48-person roster; it does not
        define the geography or movement populations above.
      </p>
      {sculptors.length === 0 ? (
        <EmptyState
          title={`No focus sculptors born in the ${decade}s`}
          description="The analytical decade remains valid; the curated follow-through roster has no matching person."
          action={
            <Button type="button" variant="outline" onClick={onClear}>
              Clear birth decade
            </Button>
          }
        />
      ) : (
        <ol
          data-testid="evolution-focus-list"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {sculptors.map((sculptor) => (
            <li key={sculptor.qid}>
              <Link
                href={`/explore/${sculptor.qid}`}
                className={`group flex min-h-11 h-full flex-col justify-center rounded-md bg-bg-secondary px-4 py-3 text-text-primary hover:bg-accent-muted ${focusClass}`}
              >
                <span className="font-medium group-hover:underline">
                  {sculptor.name}
                </span>
                <span className="mt-0.5 text-sm text-text-secondary">
                  {sculptor.birthYear ?? "—"}–{sculptor.deathYear ?? "—"}
                  {sculptor.deathYear === null ? (
                    <span className="sr-only">; death year not recorded</span>
                  ) : null}
                </span>
                {sculptor.movement ? (
                  <span className="mt-1 text-xs text-text-secondary">
                    {formatDisplayValue(sculptor.movement, { isMovement: true })}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function MaterialsDecadeOverview({
  projection,
  testId,
}: {
  projection: EvolutionSeriesProjection;
  testId: string;
}) {
  if (projection.decades.length === 0) {
    return (
      <EmptyState
        title="No categorized museum objects are available"
        description="No material-over-object-time claim is being shown for an empty projection."
      />
    );
  }
  return (
    <ol data-testid={testId} className="space-y-3">
      {projection.decades.map((row) => (
        <li
          key={row.decade}
          data-material-decade-row={row.decade}
          data-material-total={row.total}
          className="rounded-md bg-bg-secondary px-4 py-3"
        >
          <h3 className="font-display text-lg text-text-primary">
            {row.decade}s object dates · {row.total.toLocaleString()} object
            {row.total === 1 ? "" : "s"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            <LeadingCounts entries={row.leading} kind="material" />
          </p>
        </li>
      ))}
    </ol>
  );
}
