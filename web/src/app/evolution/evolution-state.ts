import type { DecadeAggregation, LegacySculptor } from "../../lib/types";

export type GeoSource = "citz" | "birth";

export interface EvolutionUrlState {
  geo: GeoSource;
  decade: number | null;
}

export interface ParsedEvolutionState {
  state: EvolutionUrlState;
  hadInvalidParameters: boolean;
  needsCanonicalization: boolean;
}

export interface ReconciledEvolutionState {
  state: EvolutionUrlState;
  changed: boolean;
  invalidDecade: boolean;
}

export interface EvolutionCategoryCount {
  category: string;
  count: number;
}

export interface EvolutionDecadeProjection {
  decade: number;
  total: number;
  categories: EvolutionCategoryCount[];
  leading: EvolutionCategoryCount[];
}

export interface EvolutionSeriesProjection {
  categories: string[];
  chartData: DecadeAggregation[];
  decades: EvolutionDecadeProjection[];
  totalRecords: number;
  unknownRecords: number;
}

export interface EvolutionProjection {
  geography: Record<GeoSource, EvolutionSeriesProjection>;
  movements: EvolutionSeriesProjection;
  materials: EvolutionSeriesProjection;
  artistDecades: number[];
  focusSculptors: LegacySculptor[];
}

export const defaultEvolutionState: EvolutionUrlState = {
  geo: "citz",
  decade: null,
};

const ALLOWED_PARAMETERS = new Set(["geo", "decade"]);
const OTHER_CATEGORY = "Other";
const UNKNOWN_CATEGORY = "Unknown";
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function parseEvolutionSearchParams(
  params: URLSearchParams,
): ParsedEvolutionState {
  let hadInvalidParameters = false;

  for (const key of params.keys()) {
    if (!ALLOWED_PARAMETERS.has(key)) hadInvalidParameters = true;
  }
  for (const key of ALLOWED_PARAMETERS) {
    if (params.getAll(key).length > 1) hadInvalidParameters = true;
  }

  const geoValues = params.getAll("geo");
  const rawGeo = geoValues.length === 1 ? geoValues[0] : null;
  let geo: GeoSource = defaultEvolutionState.geo;
  if (rawGeo === "birth") {
    geo = "birth";
  } else if (rawGeo !== null) {
    // The explicit default is intentionally non-canonical, as are empty and
    // unsupported values.
    hadInvalidParameters = true;
  }

  const decadeValues = params.getAll("decade");
  const rawDecade = decadeValues.length === 1 ? decadeValues[0] : null;
  let decade: number | null = null;
  if (rawDecade !== null) {
    if (/^(?:18|19|20)\d0$/.test(rawDecade)) {
      decade = Number(rawDecade);
    } else {
      hadInvalidParameters = true;
    }
  }

  const state = { geo, decade };
  return {
    state,
    hadInvalidParameters,
    needsCanonicalization: params.toString() !== serializeEvolutionState(state),
  };
}

export function serializeEvolutionState(state: EvolutionUrlState): string {
  const params = new URLSearchParams();
  if (state.geo === "birth") params.set("geo", "birth");
  if (state.decade !== null) params.set("decade", String(state.decade));
  return params.toString();
}

export function createEvolutionHref(state: EvolutionUrlState): string {
  const query = serializeEvolutionState(state);
  return query ? `/evolution?${query}` : "/evolution";
}

export function reconcileEvolutionState(
  state: EvolutionUrlState,
  availableDecades: readonly number[],
): ReconciledEvolutionState {
  const invalidDecade =
    state.decade !== null && !new Set(availableDecades).has(state.decade);
  const reconciled = invalidDecade ? { ...state, decade: null } : state;
  return {
    state: reconciled,
    changed:
      serializeEvolutionState(reconciled) !== serializeEvolutionState(state),
    invalidDecade,
  };
}

function categoryTotals(data: readonly DecadeAggregation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of data) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.count);
  }
  return totals;
}

function rankedCategoryEntries(
  entries: Iterable<[string, number]>,
): Array<[string, number]> {
  return [...entries].sort(
    (left, right) =>
      right[1] - left[1] || collator.compare(left[0], right[0]),
  );
}

/**
 * Build the single display projection shared by the SVG, responsive overview,
 * and selected-decade rankings. Unknown source values remain explicit; only
 * the non-leading recorded long tail is rolled into Other.
 */
export function projectEvolutionSeries(
  data: readonly DecadeAggregation[],
  topN = 6,
): EvolutionSeriesProjection {
  const totals = categoryTotals(data);
  const leadingCategories = rankedCategoryEntries(
    [...totals.entries()].filter(
      ([category]) =>
        category !== OTHER_CATEGORY && category !== UNKNOWN_CATEGORY,
    ),
  )
    .slice(0, topN)
    .map(([category]) => category);
  const leadingSet = new Set(leadingCategories);
  const hasUnknown = (totals.get(UNKNOWN_CATEGORY) ?? 0) > 0;
  const hasOther = [...totals.entries()].some(
    ([category, count]) =>
      count > 0 &&
      category !== UNKNOWN_CATEGORY &&
      (category === OTHER_CATEGORY || !leadingSet.has(category)),
  );
  const categories = [
    ...leadingCategories,
    ...(hasOther ? [OTHER_CATEGORY] : []),
    ...(hasUnknown ? [UNKNOWN_CATEGORY] : []),
  ];

  const byDecade = new Map<number, Map<string, number>>();
  for (const row of data) {
    if (!byDecade.has(row.decade)) byDecade.set(row.decade, new Map());
    const counts = byDecade.get(row.decade)!;
    const category =
      row.category === UNKNOWN_CATEGORY
        ? UNKNOWN_CATEGORY
        : leadingSet.has(row.category)
          ? row.category
          : OTHER_CATEGORY;
    counts.set(category, (counts.get(category) ?? 0) + row.count);
  }

  const decades = [...byDecade.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([decade, counts]) => {
      const ranked = categories
        .map((category) => ({ category, count: counts.get(category) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort(
          (left, right) =>
            right.count - left.count ||
            collator.compare(left.category, right.category),
        );
      return {
        decade,
        total: ranked.reduce((sum, entry) => sum + entry.count, 0),
        categories: ranked,
        leading: ranked.slice(0, 3),
      };
    });

  const chartData = decades.flatMap((row) =>
    categories.map((category) => ({
      decade: row.decade,
      category,
      count:
        row.categories.find((entry) => entry.category === category)?.count ?? 0,
    })),
  );

  return {
    categories,
    chartData,
    decades,
    totalRecords: data.reduce((sum, row) => sum + row.count, 0),
    unknownRecords: totals.get(UNKNOWN_CATEGORY) ?? 0,
  };
}

function sortFocusSculptors(
  sculptors: readonly LegacySculptor[],
): LegacySculptor[] {
  return [...sculptors].sort(
    (left, right) =>
      (left.birthYear ?? Number.POSITIVE_INFINITY) -
        (right.birthYear ?? Number.POSITIVE_INFINITY) ||
      collator.compare(left.name, right.name) ||
      collator.compare(left.qid, right.qid),
  );
}

export function projectEvolutionData(input: {
  geographyByCitizenship: readonly DecadeAggregation[];
  geographyByBirthCountry: readonly DecadeAggregation[];
  movements: readonly DecadeAggregation[];
  materials: readonly DecadeAggregation[];
  focusSculptors: readonly LegacySculptor[];
}): EvolutionProjection {
  const geography = {
    citz: projectEvolutionSeries(input.geographyByCitizenship),
    birth: projectEvolutionSeries(input.geographyByBirthCountry),
  };
  const movements = projectEvolutionSeries(input.movements);
  const materials = projectEvolutionSeries(input.materials);
  const artistDecades = [
    ...new Set(
      [...geography.citz.decades, ...geography.birth.decades, ...movements.decades].map(
        (row) => row.decade,
      ),
    ),
  ].sort((left, right) => left - right);

  return {
    geography,
    movements,
    materials,
    artistDecades,
    focusSculptors: sortFocusSculptors(input.focusSculptors),
  };
}

export function evolutionDecade(
  projection: EvolutionSeriesProjection,
  decade: number | null,
): EvolutionDecadeProjection | null {
  if (decade === null) return null;
  return projection.decades.find((row) => row.decade === decade) ?? null;
}

export function focusSculptorsForDecade(
  sculptors: readonly LegacySculptor[],
  decade: number | null,
): LegacySculptor[] {
  if (decade === null) return [...sculptors];
  return sculptors.filter((sculptor) => sculptor.birthDecade === decade);
}
