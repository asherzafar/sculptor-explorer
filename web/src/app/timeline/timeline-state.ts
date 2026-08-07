import type { TimelineSculptor } from "@/lib/types";

export type TimelineSort = "alpha" | "chrono" | "lifespan";

export interface TimelineUrlState {
  sort: TimelineSort;
}

export interface ParsedTimelineState {
  state: TimelineUrlState;
  hadInvalidParameters: boolean;
  needsCanonicalization: boolean;
}

export const defaultTimelineState: TimelineUrlState = { sort: "alpha" };

const VALID_SORTS = new Set<TimelineSort>([
  "alpha",
  "chrono",
  "lifespan",
]);

const nameCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

function lastName(sculptor: TimelineSculptor): string {
  const parts = sculptor.name.trim().split(/\s+/);
  return parts.at(-1) ?? sculptor.name;
}

export function parseTimelineSearchParams(
  params: URLSearchParams,
): ParsedTimelineState {
  const sortValues = params.getAll("sort");
  const hasUnknownParameters = Array.from(params.keys()).some(
    (key) => key !== "sort",
  );
  const hasDuplicateSort = sortValues.length > 1;
  const rawSort = hasDuplicateSort ? undefined : sortValues[0];
  const hasInvalidSort =
    rawSort !== undefined && !VALID_SORTS.has(rawSort as TimelineSort);
  const sort =
    rawSort && VALID_SORTS.has(rawSort as TimelineSort)
      ? (rawSort as TimelineSort)
      : defaultTimelineState.sort;
  const state = { sort };

  return {
    state,
    hadInvalidParameters:
      hasUnknownParameters || hasDuplicateSort || hasInvalidSort,
    needsCanonicalization: params.toString() !== serializeTimelineState(state),
  };
}

export function serializeTimelineState(state: TimelineUrlState): string {
  if (state.sort === defaultTimelineState.sort) return "";
  return new URLSearchParams({ sort: state.sort }).toString();
}

export function createTimelineHref(state: TimelineUrlState): string {
  const query = serializeTimelineState(state);
  return query ? `/timeline?${query}` : "/timeline";
}

export function sortTimelineSculptors(
  sculptors: TimelineSculptor[],
  sort: TimelineSort,
): TimelineSculptor[] {
  const records = [...sculptors];
  const tieBreak = (a: TimelineSculptor, b: TimelineSculptor) =>
    nameCollator.compare(a.name, b.name) || nameCollator.compare(a.id, b.id);

  if (sort === "alpha") {
    return records.sort(
      (a, b) =>
        nameCollator.compare(lastName(a), lastName(b)) || tieBreak(a, b),
    );
  }

  if (sort === "chrono") {
    return records.sort(
      (a, b) => a.birthYear - b.birthYear || tieBreak(a, b),
    );
  }

  return records.sort((a, b) => {
    const aLifespan =
      a.deathYear === null ? null : a.deathYear - a.birthYear;
    const bLifespan =
      b.deathYear === null ? null : b.deathYear - b.birthYear;
    if (aLifespan === null && bLifespan === null) return tieBreak(a, b);
    if (aLifespan === null) return 1;
    if (bLifespan === null) return -1;
    return bLifespan - aLifespan || tieBreak(a, b);
  });
}

export function timelineSortDescription(sort: TimelineSort): string {
  if (sort === "chrono") return "chronological order by birth year";
  if (sort === "lifespan") {
    return "known lifespan length, longest first; unknown death years last";
  }
  return "alphabetical order by last name";
}
