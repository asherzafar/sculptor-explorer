import assert from "node:assert/strict";
import test from "node:test";
import {
  createTimelineHref,
  defaultTimelineState,
  parseTimelineSearchParams,
  serializeTimelineState,
  sortTimelineSculptors,
  timelineSortDescription,
} from "../../src/app/timeline/timeline-state.ts";

const sculptors = [
  {
    id: "Q4",
    name: "Maya Lin",
    birthYear: 1959,
    deathYear: null,
    birthDecade: 1950,
    source: "original" as const,
  },
  {
    id: "Q2",
    name: "Constantin Brâncuși",
    birthYear: 1876,
    deathYear: 1957,
    birthDecade: 1870,
    source: "fabio" as const,
  },
  {
    id: "Q3",
    name: "Anna Hyatt Huntington",
    birthYear: 1876,
    deathYear: 1973,
    birthDecade: 1870,
    source: "fabio" as const,
  },
  {
    id: "Q1",
    name: "Auguste Rodin",
    birthYear: 1840,
    deathYear: 1917,
    birthDecade: 1840,
    source: "fabio" as const,
  },
];

test("bare and explicit default Timeline URLs resolve canonically", () => {
  assert.deepEqual(parseTimelineSearchParams(new URLSearchParams()), {
    state: defaultTimelineState,
    hadInvalidParameters: false,
    needsCanonicalization: false,
  });

  const explicit = parseTimelineSearchParams(
    new URLSearchParams("sort=alpha"),
  );
  assert.deepEqual(explicit.state, defaultTimelineState);
  assert.equal(explicit.hadInvalidParameters, false);
  assert.equal(explicit.needsCanonicalization, true);
  assert.equal(serializeTimelineState(explicit.state), "");
  assert.equal(createTimelineHref(explicit.state), "/timeline");
});

test("valid non-default sort state round-trips", () => {
  for (const sort of ["chrono", "lifespan"] as const) {
    const parsed = parseTimelineSearchParams(
      new URLSearchParams(`sort=${sort}`),
    );
    assert.equal(parsed.hadInvalidParameters, false);
    assert.equal(parsed.needsCanonicalization, false);
    assert.equal(serializeTimelineState(parsed.state), `sort=${sort}`);
    assert.equal(createTimelineHref(parsed.state), `/timeline?sort=${sort}`);
  }
});

test("invalid, duplicate, and unknown parameters reset visibly", () => {
  for (const query of [
    "sort=sideways",
    "sort=chrono&sort=lifespan",
    "unexpected=true",
  ]) {
    const parsed = parseTimelineSearchParams(new URLSearchParams(query));
    assert.deepEqual(parsed.state, defaultTimelineState);
    assert.equal(parsed.hadInvalidParameters, true);
    assert.equal(parsed.needsCanonicalization, true);
  }
});

test("all three Timeline sorts are deterministic and task-specific", () => {
  assert.deepEqual(
    sortTimelineSculptors(sculptors, "alpha").map(({ id }) => id),
    ["Q2", "Q3", "Q4", "Q1"],
  );
  assert.deepEqual(
    sortTimelineSculptors(sculptors, "chrono").map(({ id }) => id),
    ["Q1", "Q3", "Q2", "Q4"],
  );
  assert.deepEqual(
    sortTimelineSculptors(sculptors, "lifespan").map(({ id }) => id),
    ["Q3", "Q2", "Q1", "Q4"],
  );
  assert.match(timelineSortDescription("lifespan"), /unknown death years last/);
});
