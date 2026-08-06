import type { SculptorIndexEntry } from "../../lib/types";

export const EXPLORE_PAGE_SIZE = 50;

export const exploreSortOptions = [
  { value: "birth-asc", label: "Birth year — oldest first" },
  { value: "birth-desc", label: "Birth year — newest first" },
  { value: "name-asc", label: "Name — A to Z" },
  { value: "name-desc", label: "Name — Z to A" },
  { value: "death-asc", label: "Death year — earliest first" },
  { value: "death-desc", label: "Death year — latest first" },
  { value: "movement-asc", label: "Movement — A to Z" },
  { value: "movement-desc", label: "Movement — Z to A" },
  { value: "gender-asc", label: "Recorded gender — A to Z" },
  { value: "gender-desc", label: "Recorded gender — Z to A" },
  { value: "citizenship-asc", label: "Citizenship — A to Z" },
  { value: "citizenship-desc", label: "Citizenship — Z to A" },
  { value: "decade-asc", label: "Birth decade — oldest first" },
  { value: "decade-desc", label: "Birth decade — newest first" },
] as const;

export const exploreFilterOptions = [
  { value: "all", label: "All movement records" },
  { value: "with-movement", label: "Recorded movement only" },
  { value: "without-movement", label: "Missing movement only" },
] as const;

export type ExploreSort = (typeof exploreSortOptions)[number]["value"];
export type ExploreFilter = (typeof exploreFilterOptions)[number]["value"];

export interface ExploreUrlState {
  query: string;
  sort: ExploreSort;
  filter: ExploreFilter;
  page: number;
}

export interface ParsedExploreState {
  state: ExploreUrlState;
  hadInvalidParameters: boolean;
}

export const defaultExploreState: ExploreUrlState = {
  query: "",
  sort: "birth-asc",
  filter: "all",
  page: 1,
};

const allowedParameters = new Set(["q", "sort", "filter", "page"]);
const allowedSorts = new Set<ExploreSort>(
  exploreSortOptions.map((option) => option.value),
);
const allowedFilters = new Set<ExploreFilter>(
  exploreFilterOptions.map((option) => option.value),
);
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

function normalizeQuery(value: string): string {
  return value.trim().slice(0, 120);
}

export function normalizeExploreText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseExploreSearchParams(
  searchParams: URLSearchParams,
): ParsedExploreState {
  let hadInvalidParameters = false;

  for (const key of searchParams.keys()) {
    if (!allowedParameters.has(key)) hadInvalidParameters = true;
  }
  for (const key of allowedParameters) {
    if (searchParams.getAll(key).length > 1) hadInvalidParameters = true;
  }

  const rawQuery = searchParams.get("q") ?? "";
  const query = normalizeQuery(rawQuery);
  if (rawQuery !== query) hadInvalidParameters = true;

  const rawSort = searchParams.get("sort");
  const sort = rawSort && allowedSorts.has(rawSort as ExploreSort)
    ? (rawSort as ExploreSort)
    : defaultExploreState.sort;
  if (rawSort !== null && !allowedSorts.has(rawSort as ExploreSort)) {
    hadInvalidParameters = true;
  }

  const rawFilter = searchParams.get("filter");
  const filter = rawFilter && allowedFilters.has(rawFilter as ExploreFilter)
    ? (rawFilter as ExploreFilter)
    : defaultExploreState.filter;
  if (rawFilter !== null && !allowedFilters.has(rawFilter as ExploreFilter)) {
    hadInvalidParameters = true;
  }

  const rawPage = searchParams.get("page");
  let page = defaultExploreState.page;
  if (rawPage !== null) {
    if (/^[1-9]\d*$/.test(rawPage)) {
      const parsed = Number(rawPage);
      if (Number.isSafeInteger(parsed)) page = parsed;
      else hadInvalidParameters = true;
    } else {
      hadInvalidParameters = true;
    }
  }

  return {
    state: { query, sort, filter, page },
    hadInvalidParameters,
  };
}

export function serializeExploreState(state: ExploreUrlState): string {
  const params = new URLSearchParams();
  const query = normalizeQuery(state.query);
  if (query) params.set("q", query);
  if (state.sort !== defaultExploreState.sort) params.set("sort", state.sort);
  if (state.filter !== defaultExploreState.filter) {
    params.set("filter", state.filter);
  }
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

export function createExploreHref(state: ExploreUrlState): string {
  const query = serializeExploreState(state);
  return query ? `/explore?${query}` : "/explore";
}

export function clampExplorePage(page: number, resultCount: number): number {
  const totalPages = Math.max(1, Math.ceil(resultCount / EXPLORE_PAGE_SIZE));
  return Math.min(Math.max(1, page), totalPages);
}

function hasRecordedMovement(sculptor: SculptorIndexEntry): boolean {
  return Boolean(
    sculptor.movement && sculptor.movement !== "No movement listed",
  );
}

function compareNullable(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
  direction: 1 | -1,
): number {
  const leftMissing = left === null || left === undefined || left === "";
  const rightMissing = right === null || right === undefined || right === "";
  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;

  const comparison =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : collator.compare(String(left), String(right));
  return comparison * direction;
}

function sortField(sort: ExploreSort): keyof SculptorIndexEntry {
  if (sort.startsWith("birth-")) return "birthYear";
  if (sort.startsWith("death-")) return "deathYear";
  if (sort.startsWith("movement-")) return "movement";
  if (sort.startsWith("gender-")) return "gender";
  if (sort.startsWith("citizenship-")) return "citizenship";
  if (sort.startsWith("decade-")) return "birthDecade";
  return "name";
}

export function applyExploreState(
  sculptors: readonly SculptorIndexEntry[],
  state: ExploreUrlState,
): SculptorIndexEntry[] {
  const normalizedQuery = normalizeExploreText(state.query);
  const field = sortField(state.sort);
  const direction = state.sort.endsWith("-desc") ? -1 : 1;

  return sculptors
    .filter((sculptor) => {
      if (state.filter === "with-movement" && !hasRecordedMovement(sculptor)) {
        return false;
      }
      if (
        state.filter === "without-movement" &&
        hasRecordedMovement(sculptor)
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        normalizeExploreText(sculptor.name).includes(normalizedQuery) ||
        Boolean(
          sculptor.nativeName &&
            normalizeExploreText(sculptor.nativeName).includes(normalizedQuery),
        )
      );
    })
    .toSorted((left, right) => {
      const primary = compareNullable(left[field], right[field], direction);
      if (primary !== 0) return primary;
      const byName = collator.compare(left.name, right.name);
      if (byName !== 0) return byName;
      return collator.compare(left.qid, right.qid);
    });
}

export function toggleExploreSort(
  current: ExploreSort,
  field:
    | "name"
    | "birth"
    | "death"
    | "movement"
    | "gender"
    | "citizenship"
    | "decade",
): ExploreSort {
  const ascending = `${field}-asc` as ExploreSort;
  const descending = `${field}-desc` as ExploreSort;
  if (current === ascending) return descending;
  return ascending;
}
