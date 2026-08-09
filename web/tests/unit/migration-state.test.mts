import assert from "node:assert/strict";
import test from "node:test";
import {
  createMigrationHref,
  defaultMigrationState,
  findMigrationFlow,
  flowsForMigrationState,
  parseMigrationSearchParams,
  reconcileMigrationState,
  serializeMigrationState,
  sortMigrationFlows,
} from "../../src/app/migration/migration-state.ts";
import type { MigrationData, MigrationFlow } from "../../src/lib/types.ts";

const differentPair: MigrationFlow = {
  from: "Poland",
  to: "Germany",
  count: 3,
  sameCountry: false,
  sculptors: [{ qid: "Q1", name: "One" }],
};
const secondPair: MigrationFlow = {
  from: "Spain",
  to: "France",
  count: 2,
  sameCountry: false,
  sculptors: [{ qid: "Q2", name: "Two" }],
};
const samePair: MigrationFlow = {
  from: "France",
  to: "France",
  count: 10,
  sameCountry: true,
  sculptors: [{ qid: "Q3", name: "Three" }],
};

const data: MigrationData = {
  meta: {
    totalIncluded: 20,
    eligible: 15,
    withBothCountries: 15,
    crossedBorders: 5,
    sameCountry: 10,
    missingBirthCountry: 1,
    missingDeathCountry: 2,
    livingExcluded: 2,
    topFlows: [differentPair],
  },
  flows: [secondPair, samePair, differentPair],
  flowsByBirthDecade: {
    "1880": [samePair, differentPair],
    "1890": [secondPair],
  },
};

test("bare and explicit-default Migration URLs resolve canonically", () => {
  assert.deepEqual(parseMigrationSearchParams(new URLSearchParams()), {
    state: defaultMigrationState,
    hadInvalidParameters: false,
    needsCanonicalization: false,
  });

  const explicit = parseMigrationSearchParams(
    new URLSearchParams("stay=0"),
  );
  assert.deepEqual(explicit.state, defaultMigrationState);
  assert.equal(explicit.hadInvalidParameters, true);
  assert.equal(explicit.needsCanonicalization, true);
  assert.equal(createMigrationHref(explicit.state), "/migration");
});

test("decade, same-country, and raw pair state round-trip in stable order", () => {
  const parsed = parseMigrationSearchParams(
    new URLSearchParams(
      "to=France&from=France&stay=1&decade=1880",
    ),
  );
  assert.equal(parsed.hadInvalidParameters, false);
  assert.deepEqual(parsed.state, {
    decade: 1880,
    includeSameCountry: true,
    from: "France",
    to: "France",
  });
  assert.equal(
    serializeMigrationState(parsed.state),
    "decade=1880&stay=1&from=France&to=France",
  );
  assert.equal(
    createMigrationHref(parsed.state),
    "/migration?decade=1880&stay=1&from=France&to=France",
  );
});

test("malformed, duplicate, incomplete, and unknown state resets visibly", () => {
  for (const query of [
    "decade=1885",
    "decade=1880&decade=1890",
    "stay=yes",
    "from=Poland",
    "from=Poland&to=Germany&to=France",
    "from=France&to=France",
    "unexpected=true",
  ]) {
    const parsed = parseMigrationSearchParams(new URLSearchParams(query));
    assert.equal(parsed.hadInvalidParameters, true, query);
    assert.equal(parsed.needsCanonicalization, true, query);
  }
});

test("data reconciliation resets stale decades and unavailable pairs", () => {
  const staleDecade = reconcileMigrationState(
    {
      ...defaultMigrationState,
      decade: 1970,
      from: "Poland",
      to: "Germany",
    },
    data,
  );
  assert.equal(staleDecade.invalidDecade, true);
  assert.equal(staleDecade.stalePair, false);
  assert.deepEqual(staleDecade.state, {
    ...defaultMigrationState,
    from: "Poland",
    to: "Germany",
  });

  const stalePair = reconcileMigrationState(
    {
      ...defaultMigrationState,
      decade: 1890,
      from: "Poland",
      to: "Germany",
    },
    data,
  );
  assert.equal(stalePair.invalidDecade, false);
  assert.equal(stalePair.stalePair, true);
  assert.deepEqual(stalePair.state, {
    ...defaultMigrationState,
    decade: 1890,
  });
});

test("the structured and chart paths share one deterministic filtered array", () => {
  assert.deepEqual(
    flowsForMigrationState(data, defaultMigrationState),
    [secondPair, differentPair],
  );
  assert.deepEqual(
    flowsForMigrationState(data, {
      ...defaultMigrationState,
      includeSameCountry: true,
    }),
    [secondPair, samePair, differentPair],
  );
  assert.deepEqual(
    flowsForMigrationState(data, {
      ...defaultMigrationState,
      decade: 1880,
    }),
    [differentPair],
  );
  assert.deepEqual(sortMigrationFlows(data.flows), [samePair, differentPair, secondPair]);
  assert.equal(
    findMigrationFlow(data.flows, "Poland", "Germany"),
    differentPair,
  );
  assert.equal(findMigrationFlow(data.flows, "Other (born)", "France"), null);
});
