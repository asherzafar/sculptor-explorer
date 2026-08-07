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

async function waitForTimeline(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("heading", { name: "Focus Sculptors — Lifespans" }),
  ).toBeVisible();
  await expect(page.getByTestId("timeline-sort-status")).toContainText(
    "48 records",
  );
}

test("Timeline defaults and shared sort URLs serialize canonically", async ({
  page,
}) => {
  await page.goto("/timeline?sort=alpha");
  await waitForTimeline(page);
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(
    page.getByRole("button", { name: "Alphabetical" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("timeline-sort-status")).toContainText(
    "alphabetical order by last name",
  );

  await page.goto("/timeline?sort=sideways&unexpected=true");
  await waitForTimeline(page);
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByTestId("timeline-url-notice")).toContainText(
    "Unsupported Timeline URL options were reset",
  );
});

test("sort, reload, back, and forward keep one deterministic record order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/timeline");
  await waitForTimeline(page);

  await page.getByRole("button", { name: "Chronological" }).click();
  await expect(page).toHaveURL(/\/timeline\?sort=chrono$/);
  await expect(page.getByTestId("timeline-sort-status")).toContainText(
    "chronological order by birth year",
  );

  const desktopDisclosure = page.getByTestId("timeline-desktop-records");
  await desktopDisclosure.locator("summary").click();
  await expect(
    page.getByTestId("timeline-desktop-list").getByRole("link").first(),
  ).toHaveAttribute("href", "/explore/Q2572996");

  await page.getByRole("button", { name: "Lifespan" }).click();
  await expect(page).toHaveURL(/\/timeline\?sort=lifespan$/);
  await expect(page.getByTestId("timeline-sort-status")).toContainText(
    "unknown death years last",
  );

  await page.goBack();
  await expect(page).toHaveURL(/\/timeline\?sort=chrono$/);
  await expect(
    page.getByRole("button", { name: "Chronological" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page).toHaveURL(/\/timeline\?sort=lifespan$/);
  await page.reload();
  await waitForTimeline(page);
  await expect(
    page.getByRole("button", { name: "Lifespan" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("wide chart and structured list keep deterministic sculptor targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/timeline?sort=chrono");
  await waitForTimeline(page);

  await expect(page.getByTestId("timeline-chart")).toBeVisible();
  const firstRowTarget = page
    .getByTestId("timeline-chart")
    .locator("[data-sculptor-id='Q2572996'] [data-timeline-row-target]");
  const targetBox = await firstRowTarget.boundingBox();
  expect(targetBox?.height).toBeGreaterThanOrEqual(24);

  await page
    .getByTestId("timeline-chart")
    .locator("[data-sculptor-id='Q2572996']")
    .click();
  await expect(page).toHaveURL(/\/explore\/Q2572996$/);
  await expect(page.getByRole("heading", { name: "Hiram Powers" })).toBeVisible();
});

test("390px reflow keeps every name beside its dates and targets usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/timeline?sort=chrono");
  await waitForTimeline(page);

  await expect(page.getByTestId("timeline-reflow-view")).toBeVisible();
  await expect(page.getByTestId("timeline-wide-view")).toBeHidden();
  const list = page.getByTestId("timeline-mobile-list");
  await expect(list.locator(":scope > li")).toHaveCount(48);
  await expect(list.getByRole("link").first()).toContainText("Hiram Powers");
  await expect(list.getByRole("link").first()).toContainText("1805–1873");
  await expect(list.getByRole("link").last()).toContainText(
    "death year not recorded",
  );

  const layout = await page.locator("#main-content").evaluate((main) => ({
    pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    mainOverflow: main.scrollWidth > main.clientWidth + 1,
    clippedTargets: Array.from(
      main.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
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

  const undersizedTargets = await page.locator("#main-content").evaluate((main) =>
    Array.from(
      main.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
      .filter((target) => target.width < 24 || target.height < 24),
  );
  expect(undersizedTargets).toEqual([]);
});

test("keyboard order, activation, and focus expose sort and record actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/timeline");
  await waitForTimeline(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Alphabetical" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const chronological = page.getByRole("button", { name: "Chronological" });
  await expect(chronological).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/timeline\?sort=chrono$/);

  const focusStyle = await chronological.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focusStyle.style).not.toBe("none");
  expect(focusStyle.width).toBeGreaterThanOrEqual(3);

  const firstRecord = page
    .getByTestId("timeline-mobile-list")
    .getByRole("link")
    .first();
  await firstRecord.focus();
  await expect(firstRecord).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/explore\/Q2572996$/);
});

test("Timeline data and sort feedback stay within route budgets", async ({ page }) => {
  const compressedTimeline = gzipSync(
    readFileSync(
      new URL("../../public/data/timeline_sculptors.json", import.meta.url),
    ),
  );
  expect(compressedTimeline.byteLength).toBeLessThan(20 * 1024);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/timeline");
  await waitForTimeline(page);
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
  expect(visibleFocusableCount).toBeLessThan(80);

  const duration = await page.evaluate(() => {
    const status = document.querySelector<HTMLElement>(
      "[data-testid='timeline-sort-status']",
    );
    const chronological = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "Chronological");
    if (!status || !chronological) throw new Error("Timeline controls missing");

    return new Promise<number>((resolve) => {
      const startedAt = performance.now();
      const observer = new MutationObserver(() => {
        if (status.textContent?.includes("chronological order by birth year")) {
          observer.disconnect();
          resolve(performance.now() - startedAt);
        }
      });
      observer.observe(status, {
        characterData: true,
        childList: true,
        subtree: true,
      });
      chronological.click();
    });
  });
  expect(duration).toBeLessThan(200);
});

test("desktop and mobile Timeline states have no Axe WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/timeline", "/timeline?sort=lifespan"]) {
      await page.goto(route);
      await waitForTimeline(page);
      expect(
        await collectAxeViolations(page),
        `${viewport.width}px ${route}`,
      ).toEqual([]);
    }
  }
});

test("text spacing, forced colors, and reduced motion preserve the reflow task", async (
  { page },
  testInfo,
) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/timeline?sort=lifespan");
  await waitForTimeline(page);
  await expect(page.getByTestId("timeline-mobile-list")).toBeVisible();
  await expect(page.getByTestId("timeline-mobile-list").getByRole("link")).toHaveCount(
    48,
  );
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("timeline-forced-colors-reduced-motion.png"),
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
      main.querySelectorAll<HTMLElement>("button, a[href]"),
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
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("timeline-text-spacing.png"),
      fullPage: true,
    });
  }
});

test("Timeline reports a complete degraded-data state", async ({ page }) => {
  await page.route("**/data/timeline_sculptors.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/timeline");
  await expect(
    page.getByText("The Timeline could not be loaded", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("timeline-chart")).toHaveCount(0);
  await expect(page.getByText(/No partial lifespan view/)).toBeVisible();
});
