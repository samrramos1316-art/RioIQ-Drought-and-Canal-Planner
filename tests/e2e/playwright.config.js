// Browser checks for app/site (round 8, A4). Run from this folder:  npm ci && npx playwright test
// The site is served as plain files, exactly as Vercel serves it, by serve.js (the /api/live function
// is not run, so the page falls back to its saved reservoir reading).
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: ".",
  timeout: 60000,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "off" },
  webServer: {
    command: "node serve.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // isMobile: the phone lays the page out as a phone does, so content wider than the screen
    // widens the layout (the bug the home page had) instead of being hidden by the window size.
    { name: "phone", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "laptop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
  ],
});
