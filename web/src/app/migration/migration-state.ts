import type { MigrationData, MigrationFlow } from "../../lib/types";

export interface MigrationUrlState {
  decade: number | null;
  includeSameCountry: boolean;
  from: string | null;
  to: string | null;
}

export interface ParsedMigrationState {
  state: MigrationUrlState;
  hadInvalidParameters: boolean;
  needsCanonicalization: boolean;
}

export interface ReconciledMigrationState {
  state: MigrationUrlState;
  changed: boolean;
  invalidDecade: boolean;
  stalePair: boolean;
}

export const defaultMigrationState: MigrationUrlState = {
  decade: null,
  includeSameCountry: false,
  from: null,
  to: null,
};

const ALLOWED_PARAMETERS = new Set(["decade", "stay", "from", "to"]);
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

function normalizeCountry(value: string): string {
  return value.trim().slice(0, 120);
}

function hasOneValue(params: URLSearchParams, key: string): boolean {
  return params.getAll(key).length <= 1;
}

export function parseMigrationSearchParams(
  params: URLSearchParams,
): ParsedMigrationState {
  let hadInvalidParameters = false;

  for (const key of params.keys()) {
    if (!ALLOWED_PARAMETERS.has(key)) hadInvalidParameters = true;
  }
  for (const key of ALLOWED_PARAMETERS) {
    if (!hasOneValue(params, key)) hadInvalidParameters = true;
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

  const stayValues = params.getAll("stay");
  const rawStay = stayValues.length === 1 ? stayValues[0] : null;
  const includeSameCountry = rawStay === "1";
  if (rawStay !== null && rawStay !== "1") hadInvalidParameters = true;

  const fromValues = params.getAll("from");
  const toValues = params.getAll("to");
  const rawFrom = fromValues.length === 1 ? fromValues[0] : null;
  const rawTo = toValues.length === 1 ? toValues[0] : null;
  let from: string | null = null;
  let to: string | null = null;

  if (rawFrom !== null || rawTo !== null) {
    const normalizedFrom = rawFrom === null ? "" : normalizeCountry(rawFrom);
    const normalizedTo = rawTo === null ? "" : normalizeCountry(rawTo);
    const pairIsComplete = Boolean(normalizedFrom && normalizedTo);
    const pairIsCanonical =
      rawFrom === normalizedFrom && rawTo === normalizedTo;
    const sameCountryIsVisible =
      normalizedFrom !== normalizedTo || includeSameCountry;

    if (pairIsComplete && pairIsCanonical && sameCountryIsVisible) {
      from = normalizedFrom;
      to = normalizedTo;
    } else {
      hadInvalidParameters = true;
    }
  }

  const state = { decade, includeSameCountry, from, to };

  return {
    state,
    hadInvalidParameters,
    needsCanonicalization: params.toString() !== serializeMigrationState(state),
  };
}

export function serializeMigrationState(state: MigrationUrlState): string {
  const params = new URLSearchParams();
  if (state.decade !== null) params.set("decade", String(state.decade));
  if (state.includeSameCountry) params.set("stay", "1");
  if (state.from && state.to) {
    params.set("from", normalizeCountry(state.from));
    params.set("to", normalizeCountry(state.to));
  }
  return params.toString();
}

export function createMigrationHref(state: MigrationUrlState): string {
  const query = serializeMigrationState(state);
  return query ? `/migration?${query}` : "/migration";
}

export function flowsForMigrationState(
  data: MigrationData,
  state: Pick<MigrationUrlState, "decade" | "includeSameCountry">,
): MigrationFlow[] {
  const slice =
    state.decade === null
      ? data.flows
      : (data.flowsByBirthDecade[String(state.decade)] ?? []);
  return state.includeSameCountry
    ? slice
    : slice.filter((flow) => !flow.sameCountry);
}

export function sortMigrationFlows(
  flows: readonly MigrationFlow[],
): MigrationFlow[] {
  return [...flows].sort(
    (left, right) =>
      right.count - left.count ||
      collator.compare(left.from, right.from) ||
      collator.compare(left.to, right.to),
  );
}

export function findMigrationFlow(
  flows: readonly MigrationFlow[],
  from: string | null,
  to: string | null,
): MigrationFlow | null {
  if (!from || !to) return null;
  return flows.find((flow) => flow.from === from && flow.to === to) ?? null;
}

export function reconcileMigrationState(
  state: MigrationUrlState,
  data: MigrationData,
): ReconciledMigrationState {
  const availableDecades = new Set(
    Object.keys(data.flowsByBirthDecade).map(Number),
  );
  const invalidDecade =
    state.decade !== null && !availableDecades.has(state.decade);
  const decade = invalidDecade ? null : state.decade;
  const candidate = { ...state, decade };
  const visibleFlows = flowsForMigrationState(data, candidate);
  const stalePair =
    Boolean(state.from && state.to) &&
    findMigrationFlow(visibleFlows, state.from, state.to) === null;
  const reconciled = stalePair
    ? { ...candidate, from: null, to: null }
    : candidate;

  return {
    state: reconciled,
    changed: serializeMigrationState(reconciled) !== serializeMigrationState(state),
    invalidDecade,
    stalePair,
  };
}
