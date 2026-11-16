// What a judge would do first, in a real browser, at phone and laptop width: open both pages,
// open the platform, run the simulation and export the data. Fails on a page error, on sideways
// scroll of the page, and on any "serious" or "critical" accessibility finding (axe-core). Other
// findings are printed and listed in README.md.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// The three-month forecast has an issue date (HG.quarter.issued) and the page calls it out of date
// after 31 days. So that these tests keep passing after that day, every test runs on a fixed day:
// the issue date plus 12 days, set BEFORE the page loads. The date is read from the site's own data.
const siteData = {};
new Function("window", fs.readFileSync(path.join(__dirname, "..", "..", "app", "site", "data", "core.js"), "utf8"))(siteData);
const ISSUED = siteData.HG.quarter.issued;                                   // "2026-11-03"
const daysAfterIssue = (n) => new Date(new Date(ISSUED + "T12:00:00").getTime() + n * 86400000);
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(daysAfterIssue(12)); });

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
  await expect(page.locator("#view")).toContainText("Chance of a drought season in the 13 weeks from");
  await expect(page.locator("#view")).toContainText("issued");
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

// The paragraph straight under the "Seal again in the next 90 days?" heading: the decision, or the reason there is none.
const ninetyDayHead = (page) => page.locator("#view h3", { hasText: "Seal again in the next 90 days?" }).locator("xpath=following-sibling::p[1]");
async function openDistrict(page, name) {
  await page.goto("/app.html?noscan#d=" + encodeURIComponent(name));
  await expect(page.locator("#scopeBtn")).toContainText("District");
  await step(page, "budget");
}

test("a district's 90-day block says when the three-month forecast was issued, and that it is updated by hand", async ({ page }) => {
  const errors = watchErrors(page);
  await openDistrict(page, "Delta Lake Irrigation District");
  await expect(ninetyDayHead(page)).toContainText("issued Nov 3, 2026, 12 days ago");
  await expect(ninetyDayHead(page)).toContainText("79 days left");
  await expect(page.locator("#view")).toContainText("updated by hand, not by the daily refresh");
  expect(errors).toEqual([]);
});

test("a district's 90-day chance is weighted by canal length: Cameron County 2 is 24% and wait, not 38% and seal again", async ({ page }) => {
  await openDistrict(page, "Cameron County Irrigation District 2");
  const head = ninetyDayHead(page);
  await expect(head).toContainText("24%");
  await expect(head).toContainText("this says wait");
  await expect(head).not.toContainText("38%");
  await expect(head).not.toContainText("this says seal again");
});

test("forty days after it was issued the three-month forecast is out of date: a district and the state view give no decision", async ({ page }) => {
  await page.clock.setFixedTime(daysAfterIssue(40));                         // before the page loads
  await openDistrict(page, "Cameron County Irrigation District 2");
  let head = ninetyDayHead(page);
  await expect(head).toContainText("out of date");
  await expect(head).toContainText("no 90-day decision is shown");
  await expect(head).not.toContainText(/seal again|wait/i);
  await openPlatform(page);                                                  // the state view
  await step(page, "budget");
  head = ninetyDayHead(page);
  await expect(head).toContainText("out of date");
  await expect(head).not.toContainText(/seal again|wait/i);
});
