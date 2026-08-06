import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPLORE_PAGE_SIZE,
  applyExploreState,
  clampExplorePage,
  createExploreHref,
  defaultExploreState,
  parseExploreSearchParams,
  serializeExploreState,
  toggleExploreSort,
} from "../../src/app/explore/explore-state.ts";

const sculptors = [
  {
    qid: "Q2",
    name: "Constantin Brâncuși",
    nativeName: "コンスタンティン・ブランクーシ",
    nativeLang: "ja",
    birthYear: 1876,
    deathYear: 1957,
    birthDecade: 1870,
    movement: "modern art",
    gender: "male",
    citizenship: "Romania",
  },
  {
    qid: "Q3",
    name: "Auguste Rodin",
    nativeName: null,
    nativeLang: null,
    birthYear: 1840,
    deathYear: 1917,
    birthDecade: 1840,
    movement: "Impressionism",
    gender: "male",
    citizenship: "France",
  },
  {
    qid: "Q1",
    name: "Auguste Rodin",
    nativeName: null,
    nativeLang: null,
    birthYear: 1840,
    deathYear: 1917,
    birthDecade: 1840,
    movement: "Impressionism",
    gender: "male",
    citizenship: "France",
  },
  {
    qid: "Q4",
    name: "Unclassified Sculptor",
    nativeName: null,
    nativeLang: null,
    birthYear: 1900,
    deathYear: null,
    birthDecade: 1900,
    movement: "No movement listed",
    gender: null,
    citizenship: null,
  },
];

test("bare and explicit default URLs resolve to one deterministic state", () => {
  const bare = parseExploreSearchParams(new URLSearchParams());
  assert.deepEqual(bare, {
    state: defaultExploreState,
    hadInvalidParameters: false,
  });

  const explicit = parseExploreSearchParams(
    new URLSearchParams("sort=birth-asc&filter=all&page=1"),
  );
  assert.deepEqual(explicit.state, defaultExploreState);
  assert.equal(explicit.hadInvalidParameters, false);
  assert.equal(serializeExploreState(explicit.state), "");
  assert.equal(createExploreHref(explicit.state), "/explore");
});

test("valid state round-trips in a stable parameter order", () => {
  const parsed = parseExploreSearchParams(
    new URLSearchParams(
      "page=3&filter=with-movement&sort=name-desc&q=Rodin",
    ),
  );
  assert.equal(parsed.hadInvalidParameters, false);
  assert.equal(
    serializeExploreState(parsed.state),
    "q=Rodin&sort=name-desc&filter=with-movement&page=3",
  );
  assert.equal(
    createExploreHref(parsed.state),
    "/explore?q=Rodin&sort=name-desc&filter=with-movement&page=3",
  );
});

test("invalid, duplicate, unknown, and unsafe page parameters use defaults", () => {
  const parsed = parseExploreSearchParams(
    new URLSearchParams(
      "q=%20Rodin%20&q=duplicate&sort=sideways&filter=unknown&page=0&extra=1",
    ),
  );
  assert.equal(parsed.hadInvalidParameters, true);
  assert.deepEqual(parsed.state, {
    query: "Rodin",
    sort: "birth-asc",
    filter: "all",
    page: 1,
  });

  const unsafePage = parseExploreSearchParams(
    new URLSearchParams("page=999999999999999999999"),
  );
  assert.equal(unsafePage.hadInvalidParameters, true);
  assert.equal(unsafePage.state.page, 1);
});

test("query matching is diacritic-insensitive and includes native names", () => {
  const byRomanizedName = applyExploreState(sculptors, {
    ...defaultExploreState,
    query: "Brancusi",
  });
  assert.deepEqual(byRomanizedName.map((sculptor) => sculptor.qid), ["Q2"]);

  const byNativeName = applyExploreState(sculptors, {
    ...defaultExploreState,
    query: "ブランクーシ",
  });
  assert.deepEqual(byNativeName.map((sculptor) => sculptor.qid), ["Q2"]);
});

test("movement filtering and sorting combinations are deterministic", () => {
  const withMovement = applyExploreState(sculptors, {
    ...defaultExploreState,
    filter: "with-movement",
    sort: "name-asc",
  });
  assert.deepEqual(
    withMovement.map((sculptor) => sculptor.qid),
    ["Q1", "Q3", "Q2"],
  );

  const withoutMovement = applyExploreState(sculptors, {
    ...defaultExploreState,
    filter: "without-movement",
  });
  assert.deepEqual(withoutMovement.map((sculptor) => sculptor.qid), ["Q4"]);
  assert.deepEqual(
    applyExploreState(sculptors, {
      ...defaultExploreState,
      query: "not present",
    }),
    [],
  );
});

test("page clamping and sort toggles cover first, middle, and last states", () => {
  const resultCount = EXPLORE_PAGE_SIZE * 2 + 7;
  assert.equal(clampExplorePage(1, resultCount), 1);
  assert.equal(clampExplorePage(2, resultCount), 2);
  assert.equal(clampExplorePage(99, resultCount), 3);
  assert.equal(clampExplorePage(0, 0), 1);
  assert.equal(toggleExploreSort("birth-asc", "birth"), "birth-desc");
  assert.equal(toggleExploreSort("birth-desc", "name"), "name-asc");
});
