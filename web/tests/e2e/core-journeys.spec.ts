import { expect, test } from "@playwright/test";

test("root navigation and Timeline sort state round-trip through the URL", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(
    page.getByRole("heading", { name: "Focus Sculptors — Lifespans" }),
  ).toBeVisible();

  const lifespan = page.getByRole("button", { name: "Lifespan" });
  await lifespan.click();
  await expect(page).toHaveURL(/\/timeline\?sort=lifespan$/);
  await expect(lifespan).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Lifespan" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Alphabetical" }).click();
  await expect(page).toHaveURL(/\/timeline\??$/);
});

test("Migration filters load from, mutate, and survive the URL", async ({ page }) => {
  await page.goto("/migration?decade=1880&stay=1");
  await expect(page.getByRole("heading", { name: "Migration" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1880s" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const sameCountry = page.getByRole("checkbox", {
    name: "Include same-country endpoints",
  });
  await expect(sameCountry).toBeChecked();

  await page.getByRole("button", { name: "1890s" }).click();
  await expect(page).toHaveURL(/decade=1890/);
  await expect(page.getByRole("button", { name: "1890s" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("checkbox", { name: "Include same-country endpoints" })
    .click();
  await expect(page).not.toHaveURL(/stay=1/);

  await page.reload();
  await expect(page.getByRole("button", { name: "1890s" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("checkbox", { name: "Include same-country endpoints" }),
  ).not.toBeChecked();
});

test("Lineage restores a focused institution view and clears it cleanly", async ({
  page,
}) => {
  await page.goto(
    "/lineage?focus=Q30755&hops=1&nodes=sculptor%2Cinstitution",
  );
  await expect(page.getByRole("heading", { name: "Lineage" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Focus on a sculptor (ego network)" }),
  ).toHaveValue("Auguste Rodin");
  await expect(page.getByRole("button", { name: "1", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("checkbox", { name: /Show institution hubs/ }),
  ).toBeChecked();

  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/lineage\??$/);
  await expect(
    page.getByRole("textbox", { name: "Focus on a sculptor (ego network)" }),
  ).toHaveValue("");
});

test("public provenance exposes source age, methodology, and exclusions", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.getByText("3,543 published sculptors")).toBeVisible();
  await expect(page.getByText(/Exported June 5, 2026 under methodology A\.3/)).toBeVisible();

  await page.goto("/transparency");
  await expect(
    page.getByText(/Artifact 2026-08-02\.1 · source snapshot exported June 5, 2026 · methodology A\.3/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Evidence-backed exclusions" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Johann Albrecht Siegwitz" })).toBeVisible();
});

test("movement labels link only when a generated aggregate route exists", async ({
  page,
}) => {
  await page.goto("/explore");
  const search = page.getByPlaceholder("Search by name (diacritics optional)…");

  await search.fill("Johann Philipp Mihm");
  await expect(page.getByText("Baroque", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Baroque", exact: true })).toHaveCount(0);

  await search.fill("Edwin Landseer");
  await page.getByRole("link", { name: "Romanticism", exact: true }).click();
  await expect(page).toHaveURL(/\/movement\/romanticism$/);
  await expect(page.getByRole("heading", { name: "Romanticism" })).toBeVisible();

  await page.goto("/explore/Q1695873");
  await expect(page.getByText("Baroque", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Baroque", exact: true })).toHaveCount(0);
});

test("analytical routes expose source, denominator, freshness, and limitations", async ({
  page,
}) => {
  const routes = [
    "/timeline",
    "/explore",
    "/evolution",
    "/migration",
    "/lineage",
    "/decade/1880",
    "/movement/cubism",
  ];

  for (const route of routes) {
    await page.goto(route);
    const note = page.getByRole("note", {
      name: "Data scope and limitations",
    });
    await expect(note).toBeVisible();
    await expect(note).toContainText("Source");
    await expect(note).toContainText("Scope");
    await expect(note).toContainText("Snapshot");
    await expect(note).toContainText("Limits");
    await expect(note).toContainText("June 5, 2026");
  }
});

test("mobile navigation keeps all primary destinations reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");

  const mobileNav = page.locator("header nav");
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole("link", { name: "Transparency" }).click();
  await expect(page).toHaveURL(/\/transparency$/);
  await expect(
    page.getByRole("heading", { name: "Transparency Audit" }),
  ).toBeVisible();
});
