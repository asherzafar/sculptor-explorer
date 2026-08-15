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

async function waitForEvolution(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("heading", { name: "Evolution of Sculpture" }),
  ).toBeVisible();
  await expect(page.getByTestId("evolution-filter-status")).toContainText(
    "20 sculptor birth decades",
  );
}

const requiredViewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 720, height: 450 },
] as const;

test("Evolution URLs canonicalize defaults, order, duplicates, and stale decades visibly", async ({
  page,
}) => {
  await page.goto("/evolution?geo=citz");
  await waitForEvolution(page);
  await expect(page).toHaveURL(/\/evolution$/);
  await expect(page.getByTestId("evolution-url-notice")).toContainText(
    "Unsupported Evolution URL options were reset",
  );

  await page.goto("/evolution?decade=abc&decade=1920&geo=bogus&unknown=1");
  await waitForEvolution(page);
  await expect(page).toHaveURL(/\/evolution$/);
  await expect(page.getByTestId("evolution-url-notice")).toBeVisible();

  await page.goto("/evolution?decade=1990");
  await waitForEvolution(page);
  await expect(page).toHaveURL(/\/evolution$/);
  await expect(page.getByTestId("evolution-url-notice")).toContainText(
    "not available in this data snapshot",
  );

  await page.goto("/evolution?decade=1920&geo=birth");
  await waitForEvolution(page);
  await expect(page).toHaveURL(/\/evolution\?geo=birth&decade=1920$/);
});

test("the required URL-state matrix remains complete at every review viewport", async ({
  page,
}) => {
  const states: ReadonlyArray<{
    url: string;
    canonical: string;
    geo: "citz" | "birth";
    decade: string;
    notice?: boolean;
    emptyFocus?: boolean;
  }> = [
    { url: "/evolution", canonical: "/evolution", geo: "citz", decade: "" },
    {
      url: "/evolution?geo=birth",
      canonical: "/evolution?geo=birth",
      geo: "birth",
      decade: "",
    },
    {
      url: "/evolution?decade=1920",
      canonical: "/evolution?decade=1920",
      geo: "citz",
      decade: "1920",
    },
    {
      url: "/evolution?decade=1920&geo=birth",
      canonical: "/evolution?geo=birth&decade=1920",
      geo: "birth",
      decade: "1920",
    },
    {
      url: "/evolution?geo=citz",
      canonical: "/evolution",
      geo: "citz",
      decade: "",
      notice: true,
    },
    {
      url: "/evolution?geo=birth&geo=citz&decade=1920",
      canonical: "/evolution?decade=1920",
      geo: "citz",
      decade: "1920",
      notice: true,
    },
    {
      url: "/evolution?geo=bogus&decade=abc&unknown=1",
      canonical: "/evolution",
      geo: "citz",
      decade: "",
      notice: true,
    },
    {
      url: "/evolution?decade=1810",
      canonical: "/evolution?decade=1810",
      geo: "citz",
      decade: "1810",
      emptyFocus: true,
    },
  ];

  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    for (const state of states) {
      await page.goto(state.url);
      await waitForEvolution(page);
      const current = new URL(page.url());
      expect(`${current.pathname}${current.search}`).toBe(state.canonical);
      await expect(
        page.getByLabel("Sculptor birth decade", { exact: true }),
      ).toHaveValue(state.decade);
      await expect(
        page.getByRole("button", {
          name: state.geo === "birth" ? "Birth country" : "Citizenship",
        }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("data-scope-note")).toBeVisible();
      if (state.notice) {
        await expect(page.getByTestId("evolution-url-notice")).toBeVisible();
      }
      if (state.emptyFocus) {
        await expect(
          page.getByText("No focus sculptors born in the 1810s"),
        ).toBeVisible();
      }
      if (viewport.width < 1280) {
        await expect(page.getByTestId("evolution-reflow-view")).toBeVisible();
        await expect(page.locator("svg[data-evolution-chart='true']")).toHaveCount(0);
      } else {
        await expect(page.getByTestId("evolution-wide-view")).toBeVisible();
      }
    }
  }
});

test("native controls, reload, back, and forward reproduce the same state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/evolution");
  await waitForEvolution(page);

  const birthCountry = page.getByRole("button", { name: "Birth country" });
  await birthCountry.click();
  await expect(page).toHaveURL(/\/evolution\?geo=birth$/);
  await expect(birthCountry).toHaveAttribute("aria-pressed", "true");

  const decade = page.getByLabel("Sculptor birth decade", { exact: true });
  await decade.selectOption("1920");
  await expect(page).toHaveURL(/\/evolution\?geo=birth&decade=1920$/);
  await expect(page.getByTestId("evolution-selected-decade")).toBeVisible();
  await expect(page.getByTestId("evolution-focus-list").getByRole("link")).toHaveCount(5);

  await decade.selectOption("1950");
  await expect(page).toHaveURL(/decade=1950$/);
  await page.goBack();
  await expect(page).toHaveURL(/decade=1920$/);
  await expect(decade).toHaveValue("1920");
  await page.goForward();
  await expect(decade).toHaveValue("1950");
  await page.reload();
  await waitForEvolution(page);
  await expect(
    page.getByLabel("Sculptor birth decade", { exact: true }),
  ).toHaveValue("1950");
  await expect(
    page.getByRole("button", { name: "Birth country" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("wide charts and the exact structured view share selected-decade totals", async (
  { page },
  testInfo,
) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/evolution?geo=birth&decade=1920");
  await waitForEvolution(page);
  await expect(page.getByTestId("evolution-wide-view")).toBeVisible();
  await expect(page.locator("svg[data-evolution-chart='true']")).toHaveCount(3);

  const widths = await page
    .locator("svg[data-evolution-chart='true']")
    .first()
    .locator("[data-evolution-decade-target]")
    .evaluateAll((targets) =>
      targets.map((target) => target.getBoundingClientRect().width),
    );
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(24);
  const invalidRects = await page
    .locator("svg[data-evolution-chart='true'] rect")
    .evaluateAll((rects) =>
      rects.flatMap((rect) => {
        const width = Number(rect.getAttribute("width"));
        return !Number.isFinite(width) || width < 0
          ? [{ outerHTML: rect.outerHTML, width }]
          : [];
      }),
    );
  expect(invalidRects).toEqual([]);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("svg[data-evolution-chart='true']")).toHaveCount(3);
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("evolution-1440px-selected.png"),
      fullPage: true,
    });
  }

  await page
    .getByTestId("evolution-wide-structured-disclosure")
    .locator("summary")
    .click();
  const row = page.locator("[data-evolution-decade-row='1920']").last();
  const geographyTotal = Number(await row.getAttribute("data-geography-total"));
  const movementTotal = Number(await row.getAttribute("data-movement-total"));
  const selectedGeographyTotal = await page
    .getByTestId("evolution-selected-geography")
    .locator("li")
    .evaluateAll((items) =>
      items.reduce((sum, item) => sum + Number(item.getAttribute("data-count")), 0),
    );
  const selectedMovementTotal = await page
    .getByTestId("evolution-selected-movements")
    .locator("li")
    .evaluateAll((items) =>
      items.reduce((sum, item) => sum + Number(item.getAttribute("data-count")), 0),
    );
  expect(selectedGeographyTotal).toBe(geographyTotal);
  expect(selectedMovementTotal).toBe(movementTotal);
  await expect(
    page.getByTestId("evolution-selected-geography").locator("[data-category='Other']"),
  ).toBeVisible();
  await expect(
    page.getByTestId("evolution-selected-geography").locator("[data-category='Unknown']"),
  ).toBeVisible();
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.getByTestId("evolution-selected-decade").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("evolution-1440px-selected-details.png"),
    });
  }

  const decadeTarget = page
    .locator("svg[data-evolution-chart='true']")
    .first()
    .locator("[data-evolution-decade-target][data-decade='1910']");
  await decadeTarget.hover();
  await expect(
    page.locator("svg[data-evolution-chart='true']").first().locator(".hover-band[opacity='0.1']"),
  ).toHaveCount(1);
  await decadeTarget.click();
  await expect(page).toHaveURL(/geo=birth&decade=1910$/);
});

test("390px and 720px use the complete structured task without requesting or mounting D3", async (
  { page },
  testInfo,
) => {
  const chartModuleRequests: string[] = [];
  const chartChunkNames = [
    "EvolutionCharts",
    "DecadeStackedArea",
    "GeographyChart",
    "MaterialsChart",
    "MovementsChart",
  ];
  page.on("request", (request) => {
    const url = decodeURIComponent(request.url());
    if (chartChunkNames.some((name) => url.includes(name))) {
      chartModuleRequests.push(request.url());
    }
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 720, height: 450 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/evolution");
    await waitForEvolution(page);
    await expect(page.getByTestId("evolution-reflow-view")).toBeVisible();
    await expect(page.locator("svg[data-evolution-chart='true']")).toHaveCount(0);
    expect(chartModuleRequests, `${viewport.width}px chart-module requests`).toEqual([]);
    await expect(
      page.getByTestId("evolution-reflow-overview").locator(":scope > li"),
    ).toHaveCount(20);
    await expect(
      page
        .getByTestId("evolution-materials-reflow-overview")
        .locator(":scope > li"),
    ).toHaveCount(19);
    await expect(page.getByTestId("evolution-focus-list").getByRole("link")).toHaveCount(48);
    await expect(page.getByText("Best viewed on desktop")).toHaveCount(0);
    await expect(page.getByTestId("data-scope-note")).toContainText("6,710");
    await expect(page.getByTestId("data-scope-note")).toContainText("962");
    await expect(page.getByTestId("data-scope-note")).toContainText("2,581");
    await expect(page.getByTestId("data-scope-note")).toContainText("132");
    await expect(page.getByTestId("data-scope-note")).toContainText("48");

    const overflow = await page.locator("#main-content").evaluate((main) => ({
      page: document.documentElement.scrollWidth > window.innerWidth + 1,
      main: main.scrollWidth > main.clientWidth + 1,
    }));
    expect(overflow).toEqual({ page: false, main: false });
    if (process.env.VISUAL_QA_CAPTURE === "1") {
      await page.screenshot({
        path: testInfo.outputPath(`evolution-${viewport.width}px-default.png`),
      });
      await page
        .getByTestId("evolution-reflow-overview")
        .locator(":scope > li")
        .nth(2)
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath(`evolution-${viewport.width}px-overview.png`),
      });
      if (viewport.width === 390) {
        await page.getByTestId("evolution-focus-list").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath("evolution-390px-focus.png"),
        });
        await page
          .getByTestId("evolution-materials-reflow-overview")
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath("evolution-390px-materials.png"),
        });
      }
    }
  }
});

test("selected, empty-focus, and unknown-death states preserve analytical truth", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/evolution?decade=1810");
  await waitForEvolution(page);
  await expect(page.getByTestId("evolution-selected-decade")).toBeVisible();
  await expect(page.getByText("No focus sculptors born in the 1810s")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the 1810s page →" })).toHaveAttribute(
    "href",
    "/decade/1810",
  );

  await page.goto("/evolution?decade=1950");
  await waitForEvolution(page);
  const focus = page.getByTestId("evolution-focus-list");
  await expect(focus.getByRole("link")).toHaveCount(4);
  await expect(focus).toContainText("1954–—");
  await expect(focus).not.toContainText("present");
  await expect(focus.getByRole("link", { name: /Anish Kapoor/ })).toHaveAttribute(
    "href",
    "/explore/Q327293",
  );
});

test("materials failure stays isolated and required-data failure stays complete", async ({
  page,
}) => {
  await page.route("**/data/materials_by_decade.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/evolution?decade=1920");
    await waitForEvolution(page);
    await expect(page.getByTestId("evolution-selected-decade")).toBeVisible();
    await expect(page.getByText("Materials data is temporarily unavailable")).toBeVisible();
    await expect(page.getByTestId("data-scope-note")).toContainText(
      "materials input is temporarily unavailable",
    );
    if (viewport.width === 390) {
      expect(await collectAxeViolations(page)).toEqual([]);
    }
  }
  await page.unroute("**/data/materials_by_decade.json");

  await page.route("**/data/geography_by_decade.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/evolution");
    await expect(page.getByText("The Evolution view could not be loaded")).toBeVisible();
    await expect(page.getByTestId("evolution-filter-status")).toHaveCount(0);
    if (viewport.width === 390) {
      expect(await collectAxeViolations(page)).toEqual([]);
    }
  }
});

test("keyboard order, native activation, focus, and target sizes remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/evolution");
  await waitForEvolution(page);

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  const citizenship = page.getByRole("button", { name: "Citizenship" });
  await expect(citizenship).toBeFocused();
  await page.keyboard.press("Tab");
  const birth = page.getByRole("button", { name: "Birth country" });
  await expect(birth).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/geo=birth$/);

  const focusStyle = await birth.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focusStyle.style).not.toBe("none");
  expect(focusStyle.width).toBeGreaterThanOrEqual(3);

  const targetSizes = await page.locator("#main-content").evaluate((main) =>
    Array.from(
      main.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), select, summary",
      ),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
  );
  expect(targetSizes.filter((target) => target.width < 24 || target.height < 24)).toEqual([]);
  expect(
    targetSizes.filter((target) => target.height < 44),
    "reflow actions and controls",
  ).toEqual([]);

  const visibleFocusableCount = await page.locator("body").evaluate((body) =>
    Array.from(
      body.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), select, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
  );
  expect(visibleFocusableCount).toBeLessThan(100);
});

test("Evolution states have no focused Axe WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      "/evolution",
      "/evolution?geo=birth",
      "/evolution?geo=birth&decade=1920",
      "/evolution?geo=citz&decade=abc",
      "/evolution?decade=1810",
    ]) {
      await page.goto(route);
      await waitForEvolution(page);
      expect(
        await collectAxeViolations(page),
        `${viewport.width}px ${route}`,
      ).toEqual([]);
    }
  }
});

test("forced colors, color-vision modes, reduced motion, and text spacing preserve the task", async ({
  page,
  context,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/evolution?geo=birth&decade=1920");
  await waitForEvolution(page);
  await expect(page.getByTestId("evolution-reflow-overview").locator("li")).toHaveCount(20);
  await expect(page.getByTestId("evolution-selected-geography")).toBeVisible();
  if (process.env.VISUAL_QA_CAPTURE === "1") {
    await page.screenshot({
      path: testInfo.outputPath("evolution-forced-colors-reduced-motion.png"),
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
      main.querySelectorAll<HTMLElement>("button, a[href], select"),
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

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/evolution?geo=birth&decade=1920");
  await waitForEvolution(page);
  const cdp = await context.newCDPSession(page);
  const visionDeficiencies = [
    "deuteranopia",
    "protanopia",
    "tritanopia",
    "achromatopsia",
  ] as const;
  for (const type of visionDeficiencies) {
    await cdp.send("Emulation.setEmulatedVisionDeficiency", { type });
    await expect(page.locator("svg[data-evolution-chart='true']")).toHaveCount(3);
    await expect(page.getByTestId("evolution-wide-structured-disclosure")).toBeVisible();
    if (
      process.env.VISUAL_QA_CAPTURE === "1" &&
      (type === "deuteranopia" || type === "achromatopsia")
    ) {
      await page.screenshot({
        path: testInfo.outputPath(`evolution-${type}.png`),
        fullPage: true,
      });
    }
  }
  await cdp.send("Emulation.setEmulatedVisionDeficiency", { type: "none" });
});

test("payload, feedback, CLS, and stable states stay within route budgets", async ({
  page,
}) => {
  const dataFiles = [
    "geography_by_decade.json",
    "geography_by_birth_country.json",
    "movements_by_decade.json",
    "materials_by_decade.json",
    "focus_sculptors.json",
  ];
  const combinedGzip = dataFiles.reduce(
    (sum, file) =>
      sum +
      gzipSync(
        readFileSync(new URL(`../../public/data/${file}`, import.meta.url)),
      ).byteLength,
    0,
  );
  expect(combinedGzip).toBeLessThanOrEqual(25 * 1024);

  await page.addInitScript(() => {
    const measuredWindow = window as Window & { __evolutionCls?: number };
    measuredWindow.__evolutionCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput) {
          measuredWindow.__evolutionCls =
            (measuredWindow.__evolutionCls ?? 0) + shift.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/evolution");
  await waitForEvolution(page);

  const duration = await page.evaluate(() => {
    const status = document.querySelector<HTMLElement>(
      "[data-testid='evolution-filter-status']",
    );
    const birth = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.trim() === "Birth country",
    );
    if (!status || !birth) throw new Error("Evolution controls missing");
    return new Promise<number>((resolve) => {
      const startedAt = performance.now();
      const observer = new MutationObserver(() => {
        if (status.textContent?.includes("recorded birth country")) {
          observer.disconnect();
          resolve(performance.now() - startedAt);
        }
      });
      observer.observe(status, { characterData: true, childList: true, subtree: true });
      birth.click();
    });
  });
  expect(duration).toBeLessThan(200);
  const cls = await page.evaluate(
    () => (window as Window & { __evolutionCls?: number }).__evolutionCls ?? 0,
  );
  expect(cls).toBeLessThanOrEqual(0.1);
});

test("default, selected, and invalid states emit no product console, request, or SVG errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(
      `request: ${request.url()} (${request.failure()?.errorText ?? "unknown failure"})`,
    ),
  );

  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    for (const route of [
      "/evolution",
      "/evolution?geo=birth&decade=1920",
      "/evolution?decade=abc&geo=bogus",
    ]) {
      await page.goto(route);
      await waitForEvolution(page);
      await page.waitForTimeout(50);
    }
  }
  expect(errors).toEqual([]);
});
