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

async function waitForExplore(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("heading", { name: "Explore Sculptors" }),
  ).toBeVisible();
  await expect(page.getByTestId("results-summary")).toBeVisible();
}

test("Explore defaults and valid shared state serialize deterministically", async ({
  page,
}) => {
  await page.goto("/explore?sort=birth-asc&filter=all&page=1");
  await waitForExplore(page);
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByLabel("Search names")).toHaveValue("");
  await expect(page.getByLabel("Sort results")).toHaveValue("birth-asc");
  await expect(page.getByLabel("Movement record")).toHaveValue("all");
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–50 of 3,543 matching sculptors",
  );
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr").first(),
  ).toContainText("Carl Friedrich Voigt");

  await page.goto(
    "/explore?page=1&filter=with-movement&sort=name-desc&q=Rodin",
  );
  await waitForExplore(page);
  await expect(page).toHaveURL(
    /\/explore\?q=Rodin&sort=name-desc&filter=with-movement$/,
  );
  await expect(page.getByLabel("Search names")).toHaveValue("Rodin");
  await expect(page.getByLabel("Sort results")).toHaveValue("name-desc");
  await expect(page.getByLabel("Movement record")).toHaveValue(
    "with-movement",
  );
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–1 of 1 matching sculptors",
  );
});

test("invalid and out-of-range parameters reset visibly and canonically", async ({
  page,
}) => {
  await page.goto(
    "/explore?sort=sideways&filter=unknown&page=0&unexpected=true",
  );
  await waitForExplore(page);
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByTestId("url-notice")).toContainText(
    "invalid and were reset",
  );
  await expect(page.getByLabel("Sort results")).toHaveValue("birth-asc");

  await page.goto("/explore?page=999");
  await waitForExplore(page);
  await expect(page).toHaveURL(/\/explore\?page=71$/);
  await expect(page.getByTestId("url-notice")).toContainText(
    "outside the available range",
  );
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 3,501–3,543 of 3,543 matching sculptors",
  );
});

test("query, sorting, filtering, reload, back, and forward preserve results", async ({
  page,
}) => {
  await page.goto("/explore");
  await waitForExplore(page);

  await page.getByLabel("Search names").fill("Rodin");
  await expect(page).toHaveURL(/\/explore\?q=Rodin$/);
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–1 of 1 matching sculptors",
  );

  await page.getByLabel("Sort results").selectOption("name-desc");
  await expect(page).toHaveURL(/q=Rodin&sort=name-desc$/);
  await page.getByLabel("Movement record").selectOption("with-movement");
  await expect(page).toHaveURL(
    /q=Rodin&sort=name-desc&filter=with-movement$/,
  );

  await page.goBack();
  await expect(page.getByLabel("Movement record")).toHaveValue("all");
  await expect(page.getByLabel("Search names")).toHaveValue("Rodin");
  await page.goForward();
  await expect(page.getByLabel("Movement record")).toHaveValue(
    "with-movement",
  );

  await page.reload();
  await waitForExplore(page);
  await expect(page.getByLabel("Search names")).toHaveValue("Rodin");
  await expect(page.getByLabel("Sort results")).toHaveValue("name-desc");
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–1 of 1 matching sculptors",
  );
});

test("first, middle, last, empty, and filtered pages remain bounded", async ({
  page,
}) => {
  await page.goto("/explore");
  await waitForExplore(page);
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr"),
  ).toHaveCount(50);

  await page.goto("/explore?page=36");
  await waitForExplore(page);
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1,751–1,800 of 3,543 matching sculptors",
  );
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr"),
  ).toHaveCount(50);

  await page.goto("/explore?page=71");
  await waitForExplore(page);
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr"),
  ).toHaveCount(43);

  await page.goto("/explore?filter=with-movement&page=20");
  await waitForExplore(page);
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 951–962 of 962 matching sculptors (3,543 total)",
  );
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr"),
  ).toHaveCount(12);

  await page.goto("/explore?q=no-sculptor-can-match-this-value");
  await waitForExplore(page);
  await expect(
    page.getByText("No sculptors match these filters", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 0–0 of 0 matching sculptors",
  );
});

test("sculptor and movement links remain deterministic", async ({ page }) => {
  await page.goto("/explore?q=Edwin%20Landseer");
  await waitForExplore(page);
  await expect(
    page.getByRole("link", { name: "Edwin Landseer", exact: true }).first(),
  ).toHaveAttribute("href", "/explore/Q328369");
  await expect(
    page.getByRole("link", { name: "Romanticism", exact: true }).first(),
  ).toHaveAttribute("href", "/movement/romanticism");

  await page.goto("/explore?q=Johann%20Philipp%20Mihm");
  await waitForExplore(page);
  await expect(page.getByText("Baroque", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Baroque", exact: true }),
  ).toHaveCount(0);
});

test("skip link, keyboard order, and visible focus reach the first find action", async ({
  page,
}) => {
  await page.goto("/explore");
  await waitForExplore(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Search names")).toBeFocused();

  const focusStyle = await page.getByLabel("Search names").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focusStyle.style).not.toBe("none");
  expect(focusStyle.width).toBeGreaterThanOrEqual(3);

  await page.keyboard.type("Rodin");
  await expect(page).toHaveURL(/\/explore\?q=Rodin$/);
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–1 of 1 matching sculptors",
  );
});

test("shared skip link bypasses navigation on every current route type", async ({
  page,
}) => {
  const routes = [
    "/timeline",
    "/explore",
    "/evolution",
    "/migration",
    "/lineage",
    "/about",
    "/transparency",
    "/explore/Q30755",
    "/decade/1880",
    "/movement/cubism",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  }
});

test("390px list is task-equivalent to the desktop table", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore?filter=with-movement&page=2");
  await waitForExplore(page);

  const mobileList = page.getByTestId("mobile-result-list");
  await expect(mobileList).toBeVisible();
  await expect(mobileList.locator(":scope > li")).toHaveCount(50);
  await expect(page.getByTestId("desktop-result-table")).toBeHidden();
  await expect(mobileList.locator("dt").filter({ hasText: "Lifespan" }).first()).toBeVisible();
  await expect(
    mobileList.locator("dt").filter({ hasText: "Recorded gender" }).first(),
  ).toBeVisible();
  const mobileFirstHref = await mobileList.locator("li a[href^='/explore/']").first().getAttribute("href");

  await page.setViewportSize({ width: 1200, height: 900 });
  const desktopTable = page.getByTestId("desktop-result-table");
  await expect(desktopTable).toBeVisible();
  await expect(desktopTable.locator("tbody tr")).toHaveCount(50);
  const desktopFirstHref = await desktopTable
    .locator("tbody tr a[href^='/explore/']")
    .first()
    .getAttribute("href");
  expect(desktopFirstHref).toBe(mobileFirstHref);
});

test("Explore targets and contextual links meet measured accessibility bounds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore?q=Edwin%20Landseer");
  await waitForExplore(page);

  const undersizedTargets = await page.locator("#main-content").evaluate((main) =>
    Array.from(
      main.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex='-1'])",
      ),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute("aria-label") ||
            element.textContent?.trim() ||
            element.tagName,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((target) => target.width < 24 || target.height < 24),
  );
  expect(undersizedTargets).toEqual([]);

  const linkEvidence = await page
    .getByRole("link", { name: "Edwin Landseer", exact: true })
    .first()
    .evaluate((element) => {
      function rgb(value: string): [number, number, number] {
        const numbers = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
        return [numbers[0], numbers[1], numbers[2]];
      }
      function luminance([red, green, blue]: [number, number, number]) {
        const channel = (value: number) => {
          const normalized = value / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
      }
      const foreground = getComputedStyle(element).color;
      const container = element.closest("article") ?? element.parentElement;
      const background = getComputedStyle(container as Element).backgroundColor;
      const light = Math.max(luminance(rgb(foreground)), luminance(rgb(background)));
      const dark = Math.min(luminance(rgb(foreground)), luminance(rgb(background)));
      return { foreground, background, ratio: (light + 0.05) / (dark + 0.05) };
    });
  expect(linkEvidence.foreground).toBe("rgb(46, 99, 84)");
  expect(linkEvidence.ratio).toBeGreaterThanOrEqual(4.5);
});

test("pagination bounds DOM, focusable elements, data weight, and search latency", async ({
  page,
}) => {
  const compressedIndex = gzipSync(
    readFileSync(new URL("../../public/data/sculptors_index.json", import.meta.url)),
  );
  expect(compressedIndex.byteLength).toBeLessThan(500 * 1024);

  await page.goto("/explore");
  await waitForExplore(page);
  await expect(
    page.getByTestId("desktop-result-table").locator("tbody tr"),
  ).toHaveCount(EXPECTED_PAGE_SIZE);
  await expect(page.getByTestId("mobile-result-list").locator(":scope > li")).toHaveCount(
    EXPECTED_PAGE_SIZE,
  );

  const visibleFocusableCount = await page.locator("body").evaluate((body) =>
    Array.from(
      body.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
  );
  expect(visibleFocusableCount).toBeLessThan(150);

  const startedAt = await page.evaluate(() => performance.now());
  await page.getByLabel("Search names").fill("Rodin");
  await expect(page.getByTestId("results-summary")).toContainText(
    "Showing 1–1 of 1 matching sculptors",
  );
  const duration = await page.evaluate((start) => performance.now() - start, startedAt);
  expect(duration).toBeLessThan(200);
});

test("representative Explore states have no Axe WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const states = [
    "/explore",
    "/explore?page=36",
    "/explore?page=71",
    "/explore?q=no-sculptor-can-match-this-value",
    "/explore?sort=sideways&filter=unknown&page=0&unexpected=true",
    "/explore?filter=with-movement&page=20",
  ];

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const state of states) {
      await page.goto(state);
      await waitForExplore(page);
      expect(
        await collectAxeViolations(page),
        `${viewport.width}px ${state}`,
      ).toEqual([]);
    }
  }
});

test("text spacing, forced colors, and reduced motion preserve Explore tasks", async (
  { page },
  testInfo,
) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/explore?filter=with-movement&page=20");
  await waitForExplore(page);
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("explore-forced-colors-reduced-motion.png"),
    });
  }
  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      * { letter-spacing: 0.12em !important; line-height: 1.5 !important; word-spacing: 0.16em !important; }
      p { margin-block-end: 2em !important; }
    `,
  });

  await expect(page.getByLabel("Search names")).toBeVisible();
  await expect(page.getByLabel("Sort results")).toBeVisible();
  await expect(page.getByLabel("Movement record")).toHaveValue("with-movement");
  await expect(page.getByTestId("mobile-result-list")).toBeVisible();
  await expect(
    page.getByTestId("mobile-result-list").locator(":scope > li"),
  ).toHaveCount(12);

  const layout = await page.locator("#main-content").evaluate((main) => ({
    horizontalOverflow: main.scrollWidth > main.clientWidth + 1,
    clippedControls: Array.from(
      main.querySelectorAll<HTMLElement>("input, select, button, a[href]"),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.left < -1 ||
          rect.right > document.documentElement.clientWidth + 1
        );
      })
      .map(
        (element) =>
          element.getAttribute("aria-label") || element.textContent?.trim(),
      ),
  }));
  expect(layout).toEqual({ horizontalOverflow: false, clippedControls: [] });
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("explore-text-spacing.png"),
    });
  }
});

const EXPECTED_PAGE_SIZE = 50;
