import assert from "node:assert/strict";
import test from "node:test";
import type { LegacySculptor } from "../../src/lib/types.ts";
import {
  createEvolutionHref,
  focusSculptorsForDecade,
  parseEvolutionSearchParams,
  projectEvolutionSeries,
  reconcileEvolutionState,
  serializeEvolutionState,
} from "../../src/app/evolution/evolution-state.ts";

test("Evolution URL state serializes only geo then decade", () => {
  const parsed = parseEvolutionSearchParams(
    new URLSearchParams("decade=1920&geo=birth"),
  );
  assert.deepEqual(parsed.state, { geo: "birth", decade: 1920 });
  assert.equal(parsed.hadInvalidParameters, false);
  assert.equal(parsed.needsCanonicalization, true);
  assert.equal(serializeEvolutionState(parsed.state), "geo=birth&decade=1920");
  assert.equal(
    createEvolutionHref(parsed.state),
    "/evolution?geo=birth&decade=1920",
  );
});

test("explicit defaults, duplicates, malformed values, and unknown keys reset", () => {
  const explicitDefault = parseEvolutionSearchParams(
    new URLSearchParams("geo=citz"),
  );
  assert.deepEqual(explicitDefault.state, { geo: "citz", decade: null });
  assert.equal(explicitDefault.hadInvalidParameters, true);
  assert.equal(serializeEvolutionState(explicitDefault.state), "");

  const invalid = parseEvolutionSearchParams(
    new URLSearchParams("geo=birth&geo=citz&decade=abc&unexpected=1"),
  );
  assert.deepEqual(invalid.state, { geo: "citz", decade: null });
  assert.equal(invalid.hadInvalidParameters, true);
  assert.equal(invalid.needsCanonicalization, true);
});

test("data-stale decades reconcile without changing the geography source", () => {
  const stale = reconcileEvolutionState(
    { geo: "birth", decade: 1990 },
    [1800, 1810, 1920, 2000],
  );
  assert.deepEqual(stale.state, { geo: "birth", decade: null });
  assert.equal(stale.changed, true);
  assert.equal(stale.invalidDecade, true);

  const current = reconcileEvolutionState(
    { geo: "birth", decade: 1920 },
    [1800, 1810, 1920, 2000],
  );
  assert.deepEqual(current.state, { geo: "birth", decade: 1920 });
  assert.equal(current.changed, false);
});

test("one projection preserves totals and keeps Other separate from Unknown", () => {
  const projection = projectEvolutionSeries(
    [
      { decade: 1800, category: "A", count: 5 },
      { decade: 1800, category: "B", count: 3 },
      { decade: 1800, category: "C", count: 2 },
      { decade: 1800, category: "Other", count: 4 },
      { decade: 1800, category: "Unknown", count: 1 },
      { decade: 1810, category: "A", count: 1 },
      { decade: 1810, category: "C", count: 5 },
      { decade: 1810, category: "D", count: 2 },
      { decade: 1810, category: "Unknown", count: 2 },
    ],
    2,
  );

  assert.deepEqual(projection.categories, ["C", "A", "Other", "Unknown"]);
  assert.equal(projection.totalRecords, 25);
  assert.equal(projection.unknownRecords, 3);
  assert.deepEqual(projection.decades[0], {
    decade: 1800,
    total: 15,
    categories: [
      { category: "Other", count: 7 },
      { category: "A", count: 5 },
      { category: "C", count: 2 },
      { category: "Unknown", count: 1 },
    ],
    leading: [
      { category: "Other", count: 7 },
      { category: "A", count: 5 },
      { category: "C", count: 2 },
    ],
  });
  for (const row of projection.decades) {
    const chartTotal = projection.chartData
      .filter((entry) => entry.decade === row.decade)
      .reduce((sum, entry) => sum + entry.count, 0);
    assert.equal(chartTotal, row.total);
  }
});

test("focus roster selection uses only the recorded sculptor birth decade", () => {
  const sculptors = [
    { qid: "Q1", name: "One", birthDecade: 1800 },
    { qid: "Q2", name: "Two", birthDecade: 1810 },
    { qid: "Q3", name: "Three", birthDecade: null },
  ] as LegacySculptor[];
  assert.deepEqual(
    focusSculptorsForDecade(sculptors, 1810).map((record) => record.qid),
    ["Q2"],
  );
  assert.equal(focusSculptorsForDecade(sculptors, null).length, 3);
});
