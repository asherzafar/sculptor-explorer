import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

interface AxeViolation {
  id: string;
  impact: string | null;
  nodes: string[];
}

async function collectAxeViolations(
  page: import("@playwright/test").Page,
): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: { runOnly: { type: "tag"; values: string[] } },
          ) => Promise<{
            violations: Array<{
              id: string;
              impact: string | null;
              nodes: Array<{ target: string[] }>;
            }>;
          }>;
        };
      }
    ).axe;
    const results = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.flatMap((node) => node.target),
    }));
  });
}

async function waitForMigration(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Migration" })).toBeVisible();
  await expect(page.getByTestId("migration-filter-status")).toContainText(
    "335 recorded endpoint pairs",
  );
}

test("Migration defaults, malformed state, and stale state serialize canonically", async ({
  page,
}) => {
  await page.goto("/migration?stay=0&unexpected=true");
  await waitForMigration(page);
  await expect(page).toHaveURL(/\/migration$/);
  await expect(page.getByTestId("migration-url-notice")).toContainText(
    "Unsupported Migration URL options were reset",
  );

  await page.goto(
    "/migration?decade=1970&from=Poland&to=Germany",
  );
  await waitForMigration(page);
  await expect(page).toHaveURL(
    /\/migration\?from=Poland&to=Germany$/,
  );
  await expect(page.getByTestId("migration-url-notice")).toContainText(
    "birth decade is not available",
  );

  await page.goto(
    "/migration?decade=1960&from=Poland&to=Germany",
  );
  await expect(page.getByTestId("migration-filter-status")).toContainText(
    "recorded endpoint pair",
  );
  await expect(page).toHaveURL(/\/migration\?decade=1960$/);
  await expect(page.getByTestId("migration-url-notice")).toContainText(
    "endpoint pair is not available",
  );
});

test("decade, same-country, pair, reload, back, and forward reproduce one view", async ({
  page,
}) => {
  await page.goto("/migration");
  await waitForMigration(page);

  const polandGermany = page.getByRole("button", {
    name: /Select Poland to Germany, 31 sculptors/,
  });
  await polandGermany.click();
  await expect(page).toHaveURL(
    /\/migration\?from=Poland&to=Germany$/,
  );
  await expect(
    page.getByText("Selected endpoint pair", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "August Kiss" })).toHaveAttribute(
    "href",
    "/explore/Q456366",
  );

  await page.reload();
  await expect(polandGermany).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "August Kiss" })).toBeVisible();

  await page.getByLabel("Birth decade").selectOption("1960");
  await expect(page).toHaveURL(/\/migration\?decade=1960$/);
  await expect(page.getByTestId("migration-url-notice")).toContainText(
    "not available in the new filters",
  );

  await page.goBack();
  await expect(page).toHaveURL(
    /\/migration\?from=Poland&to=Germany$/,
  );
  await expect(page.getByTestId("migration-url-notice")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "August Kiss" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/migration\?decade=1960$/);
  await expect(page.getByTestId("migration-url-notice")).toHaveCount(0);

  const sameCountry = page.getByRole("checkbox", {
    name: "Include same-country endpoints",
  });
  await sameCountry.focus();
  await page.keyboard.press("Space");
  await expect(sameCountry).toBeChecked();
  await expect(page).toHaveURL(/\/migration\?decade=1960&stay=1$/);
});

test("390px and 720px use the same structured task without mounting the Sankey", async ({
  page,
}) => {
  const chartModuleRequests: string[] = [];
  page.on("request", (request) => {
    if (decodeURIComponent(request.url()).includes("MigrationSankey")) {
      chartModuleRequests.push(request.url());
    }
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 720, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/migration");
    await waitForMigration(page);

    await expect(page.getByTestId("migration-reflow-view")).toBeVisible();
    await expect(page.getByTestId("migration-wide-view")).toHaveCount(0);
    await expect(page.getByTestId("migration-sankey")).toHaveCount(0);
    await expect(page.getByText(/Best viewed on desktop/i)).toHaveCount(0);
    await expect(
      page.getByTestId("migration-leading-pairs").locator(":scope > li"),
    ).toHaveCount(20);

    const layout = await page.locator("#main-content").evaluate((main) => ({
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      mainOverflow: main.scrollWidth > main.clientWidth + 1,
      clippedTargets: Array.from(
        main.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input, select, summary",
        ),
      )
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > window.innerWidth + 1;
        }).length,
    }));
    expect(layout).toEqual({
      pageOverflow: false,
      mainOverflow: false,
      clippedTargets: 0,
    });
    expect(chartModuleRequests, `${viewport.width}px chart module requests`).toEqual(
      [],
    );
  }
});

test("the wide Sankey and structured view expose one filtered pair source", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/migration");
  await waitForMigration(page);
  await expect(page.getByTestId("migration-wide-view")).toBeVisible();
  await expect(page.getByTestId("migration-reflow-view")).toHaveCount(0);
  await expect(page.getByTestId("migration-sankey")).toBeVisible();
  await expect(page.getByRole("img", { name: /335 pairs in the current filters/ })).toBeVisible();

  await page
    .getByRole("checkbox", { name: "Include same-country endpoints" })
    .check();
  await expect(page.getByTestId("migration-filter-status")).toContainText(
    "415 recorded endpoint pairs",
  );
  await expect(page.getByRole("img", { name: /415 pairs in the current filters/ })).toBeVisible();

  await page.getByTestId("migration-all-pairs-disclosure").locator("summary").click();
  await expect(
    page.getByTestId("migration-remaining-pairs").locator(":scope > li"),
  ).toHaveCount(395);
  await page.getByRole("button", {
    name: /Select France to France, 340 sculptors/,
  }).click();
  await expect(page).toHaveURL(
    /\/migration\?stay=1&from=France&to=France$/,
  );
  await expect(
    page
      .locator("#migration-pair-detail")
      .getByText("Same endpoint country", { exact: true }),
  ).toBeVisible();
});

test("keyboard focus and mobile targets operate every consequential action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/migration");
  await waitForMigration(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  const decade = page.getByLabel("Birth decade");
  await expect(decade).toBeFocused();
  await page.keyboard.press("Tab");
  const sameCountry = page.getByRole("checkbox", {
    name: "Include same-country endpoints",
  });
  await expect(sameCountry).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sameCountry).toBeChecked();
  await page.keyboard.press("Tab");
  const firstPair = page
    .getByTestId("migration-leading-pairs")
    .getByRole("button")
    .first();
  await expect(firstPair).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstPair).toHaveAttribute("aria-pressed", "true");

  const focusStyle = await firstPair.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focusStyle.style).not.toBe("none");
  expect(focusStyle.width).toBeGreaterThanOrEqual(3);

  const targetHeights = await page.locator("#main-content").evaluate((main) => {
    const targets = [
      main.querySelector<HTMLElement>("select"),
      main.querySelector<HTMLElement>("label:has(input[type='checkbox'])"),
      main.querySelector<HTMLElement>("[data-flow-from]"),
      main.querySelector<HTMLElement>("details summary"),
      main.querySelector<HTMLElement>("#migration-pair-detail a[href]"),
    ].filter((element): element is HTMLElement => Boolean(element));
    return targets.map((element) => element.getBoundingClientRect().height);
  });
  expect(targetHeights.length).toBeGreaterThanOrEqual(5);
  for (const height of targetHeights) expect(height).toBeGreaterThanOrEqual(44);
});

test("Migration data and interaction feedback stay inside route budgets", async ({
  page,
}) => {
  const compressedMigration = gzipSync(
    readFileSync(
      new URL("../../public/data/migration.json", import.meta.url),
    ),
  );
  expect(compressedMigration.byteLength).toBeLessThan(80 * 1024);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/migration");
  await waitForMigration(page);
  await expect(page.getByTestId("migration-sankey")).toHaveCount(0);

  const visibleFocusableCount = await page.locator("body").evaluate((body) =>
    Array.from(
      body.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, select, summary, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
  );
  expect(visibleFocusableCount).toBeLessThan(100);

  const duration = await page.evaluate(() => {
    const status = document.querySelector<HTMLElement>(
      "[data-testid='migration-filter-status']",
    );
    const checkbox = document.querySelector<HTMLInputElement>(
      "input[type='checkbox']",
    );
    if (!status || !checkbox) throw new Error("Migration controls missing");

    return new Promise<number>((resolve) => {
      const startedAt = performance.now();
      const observer = new MutationObserver(() => {
        if (status.textContent?.includes("415 recorded endpoint pairs")) {
          observer.disconnect();
          resolve(performance.now() - startedAt);
        }
      });
      observer.observe(status, {
        characterData: true,
        childList: true,
        subtree: true,
      });
      checkbox.click();
    });
  });
  expect(duration).toBeLessThan(200);
});

test("desktop and mobile Migration states have no Axe WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      "/migration",
      "/migration?stay=1&from=France&to=France",
      "/migration?decade=1880",
    ]) {
      await page.goto(route);
      await expect(page.getByTestId("migration-filter-status")).toBeVisible();
      expect(
        await collectAxeViolations(page),
        `${viewport.width}px ${route}`,
      ).toEqual([]);
    }
  }
});

test("representative Migration states emit no console, page, or request errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("requestfailed", (request) => {
    errors.push(
      `request: ${request.url()} (${request.failure()?.errorText ?? "unknown failure"})`,
    );
  });

  for (const state of [
    {
      viewport: { width: 1440, height: 900 },
      route: "/migration?stay=1&from=France&to=France",
    },
    {
      viewport: { width: 390, height: 844 },
      route: "/migration?decade=1880",
    },
  ]) {
    errors.length = 0;
    await page.setViewportSize(state.viewport);
    await page.goto(state.route);
    await expect(page.getByTestId("migration-filter-status")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(errors, `${state.viewport.width}px ${state.route}`).toEqual([]);
    if (process.env.VISUAL_QA_CAPTURE === "1") {
      await page.screenshot({
        path: testInfo.outputPath(
          `migration-${state.viewport.width}px-${state.route.includes("from=") ? "selected" : "decade"}.png`,
        ),
        fullPage: true,
      });
    }
  }
});

test("text spacing, forced colors, and reduced motion preserve the pair task", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/migration?stay=1&from=France&to=France");
  await expect(page.getByTestId("migration-structured-view")).toBeVisible();
  await expect(
    page
      .locator("#migration-pair-detail")
      .getByText("Same endpoint country", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Abel Lafleur" })).toBeVisible();
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("migration-forced-colors-reduced-motion.png"),
      fullPage: true,
    });
  }

  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      * { letter-spacing: 0.12em !important; line-height: 1.5 !important; word-spacing: 0.16em !important; }
      p { margin-block-end: 2em !important; }
    `,
  });
  const layout = await page.locator("#main-content").evaluate((main) => ({
    horizontalOverflow: main.scrollWidth > main.clientWidth + 1,
    clippedControls: Array.from(
      main.querySelectorAll<HTMLElement>("button, a[href], input, select, summary"),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }).length,
  }));
  expect(layout).toEqual({ horizontalOverflow: false, clippedControls: 0 });
});

test("Migration reports complete empty and degraded data states", async ({ page }) => {
  await page.route("**/data/migration.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        meta: {
          totalIncluded: 1,
          eligible: 1,
          withBothCountries: 1,
          crossedBorders: 0,
          sameCountry: 1,
          missingBirthCountry: 0,
          missingDeathCountry: 0,
          livingExcluded: 0,
          topFlows: [],
        },
        flows: [
          {
            from: "France",
            to: "France",
            count: 1,
            sameCountry: true,
            sculptors: [{ qid: "Q1", name: "Example" }],
          },
        ],
        flowsByBirthDecade: {},
      }),
    }),
  );
  await page.goto("/migration");
  await expect(
    page.getByText("No endpoint-country pairs for this view", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("migration-sankey")).toHaveCount(0);

  await page.unroute("**/data/migration.json");
  await page.route("**/data/migration.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/migration");
  await expect(
    page.getByText("The Migration view could not be loaded", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/No partial endpoint-country view/)).toBeVisible();
});
