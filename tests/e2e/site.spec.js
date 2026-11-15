// What a judge would do first, in a real browser, at phone and laptop width: open both pages,
// open the platform, run the simulation and export the data. Fails on a page error, on sideways
// scroll of the page, and on any "serious" or "critical" accessibility finding (axe-core). Other
// findings are printed and listed in README.md.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}
const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function axe(page, where) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of result.violations) console.log(`axe ${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.help}`);
  expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`), where).toEqual([]);
}

async function openPlatform(page) {
  await page.goto("/app.html");
  await page.locator("#roleState").click();
  await expect(page.locator("#onboard")).not.toHaveClass(/open/);
}
const step = (page, name) => page.locator(`#stepper [data-step="${name}"]`).click();

test("the home page loads without errors, fits the screen and passes axe", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/index.html");
  await page.waitForLoadState("load");
  expect(await noSidewaysScroll(page)).toBe(true);
  await axe(page, "index.html");
  expect(errors).toEqual([]);
});

test("the platform loads, every step draws, and it passes axe", async ({ page }) => {
  const errors = watchErrors(page);
  await openPlatform(page);
  await expect(page.locator("#view h2")).toContainText("Texas");
  for (const name of ["risk", "budget", "sources"]) {
    await step(page, name);
    await expect(page.locator("#view h2")).toBeVisible();
    expect(await noSidewaysScroll(page), name).toBe(true);
  }
  await step(page, "budget");
  await expect(page.locator("#view")).toContainText("Seal again in the next 90 days?");
  await expect(page.locator("#view .meas").first()).toContainText("measured scale");
  await axe(page, "app.html, state view");
  // One district, from the table on the budget step.
  await page.locator('#view [data-act="district"]').first().click();
  await expect(page.locator("#scopeBtn")).toContainText("District");
  await step(page, "budget");
  await expect(page.locator("#view")).toContainText("Next 90 days: chance of a drought season");
  await axe(page, "app.html, one district");
  expect(errors).toEqual([]);
});

test("the simulation runs for one district", async ({ page }) => {
  const errors = watchErrors(page);
  await openPlatform(page);
  await step(page, "budget");
  await page.locator('#view [data-act="district"]').first().click();
  await step(page, "sim");
  const go = page.locator("#simGo");
  if (await go.isVisible()) await go.click();
  await expect(page.locator("#stage")).toHaveClass(/sim/, { timeout: 30000 });
  await expect(page.locator("#view")).toContainText(/draws/, { timeout: 30000 });
  expect(await noSidewaysScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test("the researcher export downloads every file", async ({ page }) => {
  await openPlatform(page);
  await page.locator("#exportBtn").click();
  await expect(page.locator("#exportBtn")).toHaveAttribute("aria-expanded", "true");
  for (const [kind, name] of [["drought", /^rioiq-drought-likelihood-.*\.csv$/], ["districts", /^rioiq-districts-.*\.csv$/],
                              ["canals", /^rioiq-canals-.*\.csv$/], ["plan", /^rioiq-budget-plan-state-of-texas-.*\.csv$/],
                              ["all", /^rioiq-all-data-.*\.json$/]]) {
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator(`[data-export="${kind}"]`).click()]);
    expect(download.suggestedFilename()).toMatch(name);
  }
});
