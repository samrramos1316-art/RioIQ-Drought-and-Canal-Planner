// Tests for logic.js. Run with:  node app/site/js/logic.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const L = require("./logic.js");
const E = require("../sim/engine.js");

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

/*
  A small made-up data object, shaped like the generated files.
  Sealant here costs 3280.84 ft x 10 ft x $0.01 = $328.084 for each kilometre of canal.
*/
const USD_PER_KM = 328.084;
function fake() {
  const X = { name: "X", fips: ["A", "B"], pSeason: 0.6, canalKm: 30 };          // in the "valley" (county A)
  const Y = { name: "Y", fips: ["C"], pSeason: 0.2, canalKm: 10 };               // outside it
  const Z = { name: "Z", fips: ["48141"], pSeason: 0.1, canalKm: 20 };           // El Paso: the other reservoir
  const HG = {
    threshold: 0.25,
    plan: { assumptions: { wetted_width_ft: 10, sealant_usd_per_sqft: 0.01, sealant_cut_low: 0.28, sealant_cut_high: 0.87, days_one_application_lasts: 90 } },
    districts: [X, Y, Z],
    trigger: { rows: 20, drought_seasons: 20, rules: [{ recall: 0.8, false_alarms: 5 }] },
  };
  // Six weeks from Tuesday 2019-12-31. "." = no drought reading that week.
  const SIM = {
    week0: "2019-12-31", nWeeks: 6, valley: ["A"],
    cls: { A: "012345", B: "1.4.0.", C: "......", "48141": "555555" },
    reservoirs: { "Amistad-Falcon": [50, 49, 48, 47, 46, 45], "Elephant Butte": [10, 11, 12, 13, 14, 15] },
    pre2020: {
      monthly: { A: [["2020-01-07", 0.1, 0], ["2020-01-21", 0.5, 1]], B: [["2020-01-14", 0.3, 0]] },
      live: { A: 0.4 },
      test: { preSeason: { forecast: { recall: 0.9, falseAlarms: 10, rows: 100, droughtSeasons: 60 } } },
    },
  };
  // In map order, not in rank order. usd is the pipeline's own cost figure for the canal.
  const canals = [
    { id: 0, name: "B", km: 2, rate: 2, rank: 2, usd: 656, district: 0 },
    { id: 1, name: "drain", km: 3, rate: null, rank: null, usd: 0, district: 0 },
    { id: 2, name: "D", km: 0.5, rate: 5, rank: 4, usd: 164, district: 1 },
    { id: 3, name: "A", km: 1, rate: 9, rank: 1, usd: 328, district: 0 },
    { id: 4, name: "C", km: 4, rate: 7, rank: 3, usd: 1312, district: 1 },
  ];
  const published = { worstCaseRevenue: 1000, valleyIrrigationAf: 10 };            // $100 for each acre-foot
  return { HG, SIM, canals, published, X, Y, Z };
}
const logic = (data) => L.makeLogic(data || fake());
const names = (list) => list.map((c) => c.name);

/* ---------- esc ---------- */
test("esc escapes all five characters that matter in HTML text and attributes: & < > and both quotes", () => {
  assert.strictEqual(L.esc("&"), "&amp;");
  assert.strictEqual(L.esc("<"), "&lt;");
  assert.strictEqual(L.esc(">"), "&gt;");
  assert.strictEqual(L.esc('"'), "&quot;");
  assert.strictEqual(L.esc("'"), "&#39;");
  assert.strictEqual(L.esc('<a href="x">Tom & Jerry</a>'), "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;");
  assert.strictEqual(L.esc("O'Brien"), "O&#39;Brien");
  assert.strictEqual(L.esc("&amp;"), "&amp;amp;");                        // escaping twice shows the first escape as text
});

test("esc leaves nothing that can open a tag or close an attribute, with either kind of quote", () => {
  const hostile = ['"><script>alert(1)</script>', "' onmouseover='alert(1)", "<img src=x onerror=alert(1)>", '</td><td class="x">', "a\" b' c<d>e&f"];
  for (const text of hostile) assert.ok(!/[<>"']/.test(L.esc(text)), text);
});

test("esc turns null and undefined into an empty string and other values into text", () => {
  assert.strictEqual(L.esc(null), "");
  assert.strictEqual(L.esc(undefined), "");
  assert.strictEqual(L.esc(0), "0");
  assert.strictEqual(L.esc(12.5), "12.5");
  assert.strictEqual(L.esc("plain text"), "plain text");
});

/* ---------- safeUrl, cssClass, finiteOrNull ---------- */
test("safeUrl keeps an address that starts with https:// or http:// exactly as it is", () => {
  assert.strictEqual(L.safeUrl("https://example.org/a?b=1&c=2"), "https://example.org/a?b=1&c=2");
  assert.strictEqual(L.safeUrl("http://example.org"), "http://example.org");
});

test("safeUrl gives null for anything that is not a plain web address", () => {
  const hostile = ["javascript:alert(1)", "JAVASCRIPT:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,<script>alert(1)</script>",
    "vbscript:x", "//example.org", "/relative/path", "example.org", "ftp://example.org", " https://example.org", "HTTPS://example.org", "https:/example.org", "https:example.org", "",
    null, undefined, 0, 12, {}, ["https://example.org"], { toString: () => "https://example.org" }];
  for (const url of hostile) assert.strictEqual(L.safeUrl(url), null, String(url));
});

test("safeUrl does not escape: a kept address with a quote or a tag in it still needs esc before it goes in an attribute", () => {
  const url = 'https://example.org/"><script>alert(1)</script>';
  assert.strictEqual(L.safeUrl(url), url);
  assert.ok(!/[<>"']/.test(L.esc(L.safeUrl(url))));
});

test("cssClass keeps a known class name and gives an empty string for anything else", () => {
  for (const tier of ["Low", "Watch", "Warning"]) assert.strictEqual(L.cssClass(tier, L.TIER_CLASSES), tier);
  for (const sev of ["Critical", "Important", "Context"]) assert.strictEqual(L.cssClass(sev, L.SEVERITY_CLASSES), sev);
  const hostile = ['Warning" onmouseover="alert(1)', "Warning x", "warning", " Warning", "Low'><script>", "<b>", "", null, undefined, 0, {}, ["Low"], "constructor", "length", "0"];
  for (const value of hostile) assert.strictEqual(L.cssClass(value, L.TIER_CLASSES), "", String(value));
  assert.strictEqual(L.cssClass("Critical", L.TIER_CLASSES), "");          // a severity is not a tier
});

test("finiteOrNull keeps a real number and gives null for everything else", () => {
  for (const x of [0, -0.5, 41.3, 100, 1e9]) assert.strictEqual(L.finiteOrNull(x), x);
  for (const x of [NaN, Infinity, -Infinity, null, undefined, "", "41.3", "<script>alert(1)</script>", true, {}, [41.3]]) assert.strictEqual(L.finiteOrNull(x), null, String(x));
});

test("percentOrNull keeps a real number from 0 to 100 inclusive and gives null for everything else", () => {
  for (const x of [0, 0.1, 38.7, 99.9, 100]) assert.strictEqual(L.percentOrNull(x), x);
  for (const x of [-0.1, -5, 100.1, 250, NaN, Infinity, -Infinity, null, undefined, "", "38.7", "50%", "<script>alert(1)</script>", true, {}, [50]]) {
    assert.strictEqual(L.percentOrNull(x), null, String(x));
  }
});

test("safeDecode decodes a well-formed link fragment", () => {
  assert.strictEqual(L.safeDecode("state"), "state");
  assert.strictEqual(L.safeDecode("d=Delta%20Lake%20Irrigation%20District"), "d=Delta Lake Irrigation District");
  assert.strictEqual(L.safeDecode("d=Ca%C3%B1on%20%26%20Sons"), "d=Ca\u00f1on & Sons");
  assert.strictEqual(L.safeDecode(""), "");
  assert.strictEqual(L.safeDecode(null), "");
  assert.strictEqual(L.safeDecode(undefined), "");
});

test("safeDecode returns a malformed fragment as it came, where the browser's decoder would throw", () => {
  for (const bad of ["%", "d=Delta%", "d=Delta%2", "%E0%A4%A", "d=%C3", "%zz", "state%"]) {
    assert.throws(() => decodeURIComponent(bad), URIError, bad);            // this is the failure being guarded
    assert.strictEqual(L.safeDecode(bad), bad);
  }
});

/* ---------- csvText, csvNumber ---------- */
test("csvText puts every text field in double quotes and doubles a double quote inside it", () => {
  assert.strictEqual(L.csvText("Main Canal"), '"Main Canal"');
  assert.strictEqual(L.csvText('The "Big" Ditch'), '"The ""Big"" Ditch"');
  assert.strictEqual(L.csvText("a,b"), '"a,b"');
  assert.strictEqual(L.csvText("two\nlines"), '"two\nlines"');
  assert.strictEqual(L.csvText("O'Brien Lateral"), '"O\'Brien Lateral"');
  assert.strictEqual(L.csvText("48061"), '"48061"');
  assert.strictEqual(L.csvText(""), '""');
  assert.strictEqual(L.csvText(null), '""');
  assert.strictEqual(L.csvText(undefined), '""');
  assert.strictEqual(L.csvText('","x'), '""",""x"');                        // cannot break out into a new field
});

test("csvText puts a single quote before a field that a spreadsheet would read as a formula", () => {
  assert.strictEqual(L.csvText("=SUM(A1:A9)"), '"\'=SUM(A1:A9)"');
  assert.strictEqual(L.csvText('=HYPERLINK("http://evil","x")'), '"\'=HYPERLINK(""http://evil"",""x"")"');
  assert.strictEqual(L.csvText("+1+1"), '"\'+1+1"');
  assert.strictEqual(L.csvText("-2+3"), '"\'-2+3"');
  assert.strictEqual(L.csvText("@SUM(1)"), '"\'@SUM(1)"');
  assert.strictEqual(L.csvText("\t=1+1"), '"\'\t=1+1"');
  assert.strictEqual(L.csvText("\r=1+1"), '"\'\r=1+1"');
  assert.strictEqual(L.csvText(-5), '"\'-5"');                              // a number passed as text is treated as text
});

test("csvText leaves a field alone when the risky character is not the first one", () => {
  assert.strictEqual(L.csvText("A=B"), '"A=B"');
  assert.strictEqual(L.csvText("Canal - East"), '"Canal - East"');
  assert.strictEqual(L.csvText("name@example"), '"name@example"');
  assert.strictEqual(L.csvText(" =1+1"), '" =1+1"');
});

test("csvNumber writes a real number bare, with fixed decimals if asked, and leaves anything else empty", () => {
  assert.strictEqual(L.csvNumber(9.35), "9.35");
  assert.strictEqual(L.csvNumber(0), "0");
  assert.strictEqual(L.csvNumber(-1.5), "-1.5");
  assert.strictEqual(L.csvNumber(288.984, 2), "288.98");
  assert.strictEqual(L.csvNumber(1225.2, 2), "1225.20");
  assert.strictEqual(L.csvNumber(0, 2), "0.00");
  for (const x of [NaN, Infinity, -Infinity, null, undefined, "", "12", "=1+1", "<b>", {}, [1]]) {
    assert.strictEqual(L.csvNumber(x), "", String(x));
    assert.strictEqual(L.csvNumber(x, 2), "", String(x));
  }
});

/* ---------- usd, num, pct, niceDate ---------- */
test("usd says n/a for a missing value and writes whole dollars under a million", () => {
  for (const x of [null, undefined, NaN, "abc"]) assert.strictEqual(L.usd(x), "n/a");
  assert.strictEqual(L.usd(0), "$0");
  assert.strictEqual(L.usd(0.4), "$0");
  assert.strictEqual(L.usd(1234.5), "$1,235");
  assert.strictEqual(L.usd(999999), "$999,999");
  assert.strictEqual(L.usd(-5), "-$5");
});

test("usd changes unit exactly at one million, one hundred million and one billion", () => {
  assert.strictEqual(L.usd(1e6), "$1.0 million");
  assert.strictEqual(L.usd(99.9e6), "$99.9 million");
  assert.strictEqual(L.usd(1e8), "$100 million");
  assert.strictEqual(L.usd(999e6), "$999 million");
  assert.strictEqual(L.usd(1e9), "$1.00 billion");
  assert.strictEqual(L.usd(-2.5e9), "-$2.50 billion");
  assert.strictEqual(L.usd(-1.5e6), "-$1.5 million");
});

test("num says n/a for a missing value, groups thousands and keeps the digits asked for", () => {
  for (const x of [null, undefined, NaN]) assert.strictEqual(L.num(x), "n/a");
  assert.strictEqual(L.num(0), "0");
  assert.strictEqual(L.num(1234.567), "1,235");
  assert.strictEqual(L.num(1234.567, 2), "1,234.57");
  assert.strictEqual(L.num(5, 2), "5.00");
  assert.strictEqual(L.num(-1234), "-1,234");
  assert.strictEqual(L.num("12"), "12");
});

test("pct rounds a share to a whole percent and says n/a for null", () => {
  assert.strictEqual(L.pct(null), "n/a");
  assert.strictEqual(L.pct(undefined), "n/a");
  assert.strictEqual(L.pct(0), "0%");
  assert.strictEqual(L.pct(0.25), "25%");
  assert.strictEqual(L.pct(0.254), "25%");
  assert.strictEqual(L.pct(1), "100%");
  assert.strictEqual(L.pct(-0.1), "-10%");
});

test("pct does not guard against NaN (today's behaviour)", () => {
  assert.strictEqual(L.pct(NaN), "NaN%");
});

test("niceDate writes an ISO day as month, day, year and does not slip a day", () => {
  assert.strictEqual(L.niceDate("2026-11-10"), "Nov 10, 2026");
  assert.strictEqual(L.niceDate("2020-01-01"), "Jan 1, 2020");
  assert.strictEqual(L.niceDate("2024-02-29"), "Feb 29, 2024");
});

/* ---------- workTime ---------- */
test("workTime counts hours under one day, never less than one hour", () => {
  assert.strictEqual(L.workTime(0), "1 hour");
  assert.strictEqual(L.workTime(-1), "1 hour");
  assert.strictEqual(L.workTime(0.125), "1 hour");
  assert.strictEqual(L.workTime(0.25), "2 hours");
  assert.strictEqual(L.workTime(0.99), "8 hours");
});

test("workTime changes to days at exactly 1 day, drops the decimal at 3 days, and changes to weeks at 15 days", () => {
  assert.strictEqual(L.workTime(1), "1.0 days");
  assert.strictEqual(L.workTime(2.99), "3.0 days");
  assert.strictEqual(L.workTime(3), "3 days");
  assert.strictEqual(L.workTime(14.9), "15 days");
  assert.strictEqual(L.workTime(15), "3 weeks");
  assert.strictEqual(L.workTime(100), "20 weeks");
});

/* ---------- gal, money ---------- */
test("gal turns acre-feet into gallons and changes unit at a million and a billion", () => {
  assert.strictEqual(L.gal(0), "0 gal");
  assert.strictEqual(L.gal(1), "325,851 gal");
  assert.strictEqual(L.gal(1, true), "325,851 gallons");
  assert.strictEqual(L.gal(10), "3.3 million gal");                       // 3,258,510
  assert.strictEqual(L.gal(100), "33 million gal");                       // no decimal from 10 million up
  assert.strictEqual(L.gal(10000), "3.3 billion gal");
  assert.strictEqual(L.gal(100000, true), "33 billion gallons");          // no decimal from 10 billion up
});

test("money shortens to k, M and B exactly at ten thousand, one million and one billion", () => {
  assert.strictEqual(L.money(0), "$0");
  assert.strictEqual(L.money(950), "$950");
  assert.strictEqual(L.money(9999), "$9,999");
  assert.strictEqual(L.money(1e4), "$10k");
  assert.strictEqual(L.money(999499), "$999k");
  assert.strictEqual(L.money(1e6), "$1.0M");
  assert.strictEqual(L.money(99.9e6), "$99.9M");
  assert.strictEqual(L.money(1e8), "$100M");
  assert.strictEqual(L.money(1e9), "$1.00B");
  assert.strictEqual(L.money(-5e6), "-$5.0M");
  assert.strictEqual(L.money(-12), "-$12");
});

/* ---------- tierFor, actionFor ---------- */
test("tierFor: Warning at the warning line, Watch at half of it, Low under that", () => {
  const { tierFor } = logic();                                            // the line is 0.25
  assert.strictEqual(tierFor(1), "Warning");
  assert.strictEqual(tierFor(0.25), "Warning");
  assert.strictEqual(tierFor(0.2499), "Watch");
  assert.strictEqual(tierFor(0.125), "Watch");
  assert.strictEqual(tierFor(0.1249), "Low");
  assert.strictEqual(tierFor(0), "Low");
  assert.strictEqual(tierFor(-0.3), "Low");
});

test("tierFor gives Low for a missing chance (null or NaN)", () => {
  const { tierFor } = logic();
  assert.strictEqual(tierFor(null), "Low");
  assert.strictEqual(tierFor(NaN), "Low");
});

test("actionFor uses the same two cut-offs as tierFor: seal, inspect, none", () => {
  const { actionFor } = logic();
  assert.strictEqual(actionFor(0.25).key, "seal");
  assert.strictEqual(actionFor(0.9).key, "seal");
  assert.strictEqual(actionFor(0.2499).key, "inspect");
  assert.strictEqual(actionFor(0.125).key, "inspect");
  assert.strictEqual(actionFor(0.1249).key, "none");
  assert.strictEqual(actionFor(0).key, "none");
  assert.strictEqual(actionFor(null).key, "none");
  assert.strictEqual(actionFor(NaN).key, "none");
  for (const p of [0.9, 0.2, 0]) { const a = actionFor(p); assert.ok(a.title.length > 0 && a.text.length > 0); }
});

test("actionFor's advice points at the top of the list, not at canals called the top ones", () => {
  const { actionFor } = logic();
  assert.strictEqual(actionFor(0.9).text, "The chance of a drought season is over the warning line. Walk the canals at the top of the list, confirm they are unlined, and seal before the first irrigation.");
  assert.strictEqual(actionFor(0.2).text, "Not over the warning line yet. Inspect the canals at the top of the list and line up sealant so you can act quickly if the forecast rises.");
  for (const p of [0.9, 0.2, 0]) assert.ok(actionFor(p).text.indexOf("the top canals") < 0);
});

test("the scan caption and the home page do not present the canal order or the leak figure as findings", () => {
  const scan = fs.readFileSync(path.join(__dirname, "scanmap.js"), "utf8"), home = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(scan.indexOf('say("A modelled sealing order", "forecast and soil combined, canal by canal");') >= 0);
  assert.ok(scan.indexOf("Which canals first") < 0);
  // The home page's leak figure is followed, in the same block, by the line that says what it is.
  const block = home.slice(home.indexOf('id="nGal"'), home.indexOf("</section>", home.indexOf('id="nGal"')));
  assert.ok(block.indexOf("<p class=\"caveat\">An upper estimate from published leak rates. Our own test could not confirm the model's volumes.</p>") >= 0);
  // The caveat is body-size text in the ink colour, and its panel has a backing so the canal drawing does not cross the words.
  const landing = fs.readFileSync(path.join(__dirname, "..", "css", "landing.css"), "utf8");
  assert.ok(/\.caveat \{ font: 400 1rem\/1\.5 var\(--sans\); color: var\(--ink\);/.test(landing));
  assert.ok(/\.beat \.copy\.backed \{ background: color-mix\(in srgb, var\(--ground\) 92%, transparent\);/.test(landing));
  assert.ok(home.indexOf('<section class="beat right" data-beat="1">\n      <div class="copy backed">') >= 0);
});

test("tierFor and actionFor follow the warning line in the data, not a fixed number", () => {
  const data = fake(); data.HG.threshold = 0.6;
  const { tierFor, actionFor } = logic(data);
  assert.strictEqual(tierFor(0.5), "Watch");
  assert.strictEqual(tierFor(0.29), "Low");
  assert.strictEqual(actionFor(0.6).key, "seal");
});

/* ---------- planFor ---------- */
test("planFor pays for canals in rank order and leaves out canals with no rank", () => {
  const data = fake(), plan = logic(data).planFor(data.canals, 1e9, null);
  assert.deepStrictEqual(names(plan.ordered), ["A", "B", "C", "D"]);       // the drain has no rank
  assert.deepStrictEqual(names(plan.funded), ["A", "B", "C", "D"]);
  assert.deepStrictEqual(Array.from(plan.fundedIds).sort(), [0, 2, 3, 4]);
  close(plan.km, 7.5);
  close(plan.spent, 7.5 * USD_PER_KM);                                     // $2,460.63
  assert.strictEqual(plan.costAll, 328 + 656 + 1312 + 164);                // the pipeline's own figures, added up
});

test("planFor: funded set, money spent, kilometres and water kept match a hand calculation", () => {
  // Budget $1,200. A costs $328.084 and B $656.168: $984.252 spent. C would cost $1,312.336.
  const data = fake(), plan = logic(data).planFor(data.canals, 1200, null);
  assert.deepStrictEqual(names(plan.funded), ["A", "B"]);
  close(plan.spent, 984.252);
  close(plan.km, 3);
  close(plan.sqft, 3 * 3280.84 * 10);                                      // 98,425.2 square feet
  // Leak: A 32,808.4 sq ft x 9 + B 65,616.8 sq ft x 2 = 426,509.2 gallons a day.
  // Kept in 90 days: x 90 x 0.28 / 325,851 = 32.9845 acre-feet, and x 0.87 = 102.4875.
  close(plan.savedLow, 426509.2 * 90 * 0.28 / 325851);
  close(plan.savedHigh, 426509.2 * 90 * 0.87 / 325851);
  assert.ok(Math.abs(plan.savedLow - 32.9845) < 1e-4 && Math.abs(plan.savedHigh - 102.4875) < 1e-4);
});

test("planFor stops at the first canal the money left cannot cover, even if a cheaper one comes after it", () => {
  // After A and B, $215.748 is left. C ($1,312.336) does not fit, so the plan stops.
  // D ($164.042) would fit, and is still not funded.
  const data = fake(), plan = logic(data).planFor(data.canals, 1200, null);
  assert.ok(1200 - plan.spent > 0.5 * USD_PER_KM);                         // D alone was affordable
  assert.ok(!plan.fundedIds.has(2));
  assert.deepStrictEqual(names(plan.funded), ["A", "B"]);
});

test("planFor funds a canal whose cost equals the money left, and not one that costs a cent more", () => {
  const data = fake(), { planFor } = logic(data);
  const costA = 1 * E.FEET_PER_KM * 10 * 0.01;
  assert.deepStrictEqual(names(planFor(data.canals, costA, null).funded), ["A"]);
  assert.deepStrictEqual(names(planFor(data.canals, costA - 0.01, null).funded), []);
  assert.strictEqual(planFor(data.canals, 0, null).spent, 0);
});

test("planFor with a what-if chance re-orders by seepage rate, highest first, and applies the same stop rule", () => {
  const data = fake(), { planFor } = logic(data);
  const all = planFor(data.canals, 1e9, 0.5);
  assert.deepStrictEqual(names(all.ordered), ["A", "C", "D", "B"]);        // rates 9, 7, 5, 2
  // Budget $1,200: A is paid ($328.084); C is next and does not fit; D and B are never reached.
  assert.deepStrictEqual(names(planFor(data.canals, 1200, 0.5).funded), ["A"]);
  // The what-if value itself does not change the order: any value that is not null gives the same list.
  assert.deepStrictEqual(names(planFor(data.canals, 1e9, 0).ordered), ["A", "C", "D", "B"]);
  assert.deepStrictEqual(names(planFor(data.canals, 1e9, undefined).ordered), ["A", "B", "C", "D"]);   // undefined counts as "no override"
});

test("planFor with a what-if chance breaks a tie in seepage rate by the pipeline's rank", () => {
  const data = fake();
  data.canals.forEach((c) => { if (c.rate != null) c.rate = 3; });
  assert.deepStrictEqual(names(logic(data).planFor(data.canals, 1e9, 0.8).ordered), ["A", "B", "C", "D"]);
});

test("planFor does not change the list it is given", () => {
  const data = fake(), before = names(data.canals);
  logic(data).planFor(data.canals, 1200, 0.5);
  assert.deepStrictEqual(names(data.canals), before);
});

/* ---------- canalNumbers ---------- */
test("canalNumbers: cost, crew time and acre-feet for one segment match a hand calculation", () => {
  // 2 km x 3,280.84 ft x 10 ft wide = 65,616.8 sq ft. Sealant at $0.01: $656.168.
  // Leak at 5 gallons per sq ft a day: 328,084 gallons a day.
  // Kept in 90 days: x 90 x 0.28 / 325,851 = 25.3727 acre-feet, and x 0.87 = 78.8366.
  const n = logic().canalNumbers([{ km: 2, rate: 5 }], { kmPerCrewDay: 4, crews: 2 });
  close(n.km, 2);
  close(n.usd, 656.168);
  close(n.crewDays, 0.5);                                                  // one crew: 2 km at 4 km a day
  close(n.days, 0.25);                                                     // two crews
  close(n.afLow, 328084 * 90 * 0.28 / 325851);
  close(n.afHigh, 328084 * 90 * 0.87 / 325851);
  assert.ok(Math.abs(n.afLow - 25.3727) < 1e-4 && Math.abs(n.afHigh - 78.8366) < 1e-4);
  close(n.worthLow, n.afLow * 100);                                        // $100 an acre-foot in the made-up data
  close(n.worthHigh, n.afHigh * 100);
});

test("canalNumbers adds segments up, and a segment with no seepage rate costs money but keeps no water", () => {
  const { canalNumbers, USD_PER_AF } = logic(), P = { kmPerCrewDay: 6, crews: 2 };
  assert.strictEqual(USD_PER_AF, 100);
  const one = canalNumbers([{ km: 2, rate: 5 }], P), two = canalNumbers([{ km: 2, rate: 5 }, { km: 3, rate: null }], P);
  close(two.km, 5);
  close(two.usd, 5 * USD_PER_KM);
  close(two.afLow, one.afLow);
  const none = canalNumbers([], P);
  assert.deepStrictEqual([none.km, none.usd, none.days, none.afLow, none.afHigh], [0, 0, 0, 0, 0]);
});

/* ---------- scopeP ---------- */
test("scopeP: a what-if value wins, then the open district's forecast, then the state average weighted by canal km", () => {
  const data = fake(), { scopeP } = logic(data);
  assert.strictEqual(scopeP(0.8, data.X), 0.8);
  assert.strictEqual(scopeP(0, data.X), 0);                                // a what-if of zero is still a what-if
  assert.strictEqual(scopeP(null, data.X), 0.6);
  // (0.6 x 30 + 0.2 x 10 + 0.1 x 20) / 60 km = 22 / 60
  close(scopeP(null, null), 22 / 60);
});

/* ---------- simScope ---------- */
test("simScope: one entry a week, seven days apart from the first week, with the calendar year and month of each", () => {
  const data = fake(), s = logic(data).simScope([data.X]);
  assert.deepStrictEqual(s.weeks.map((w) => w.date), ["2019-12-31", "2020-01-07", "2020-01-14", "2020-01-21", "2020-01-28", "2020-02-04"]);
  assert.deepStrictEqual(s.weeks.map((w) => w.year), [2019, 2020, 2020, 2020, 2020, 2020]);
  assert.deepStrictEqual(s.weeks.map((w) => w.month), [12, 1, 1, 1, 1, 2]);
});

test("simScope: week i reads position i of the drought record and of the reservoir record", () => {
  const data = fake(), s = logic(data).simScope([data.X]);
  // Counties A "012345" and B "1.4.0.": the average of the readings that exist, rounded (0.5 rounds up).
  assert.deepStrictEqual(s.weeks.map((w) => w.cls), [1, 1, 3, 3, 2, 5]);
  assert.deepStrictEqual(s.weeks.map((w) => w.pct), [50, 49, 48, 47, 46, 45]);
  assert.strictEqual(s.system, "Amistad-Falcon");
});

test("simScope: a week uses the newest forecast made on or before it, and never a later one", () => {
  const data = fake(), s = logic(data).simScope([data.X]);
  // A: 0.1 from 7 Jan, 0.5 from 21 Jan. B: 0.3 from 14 Jan. The week's value is the counties' average.
  const fc = s.weeks.map((w) => w.forecast);
  assert.strictEqual(fc[0], null);                                         // 31 Dec: nothing has been made yet
  close(fc[1], 0.1);                                                       // 7 Jan: made that very day counts
  close(fc[2], 0.2);                                                       // 14 Jan: (0.1 + 0.3) / 2
  close(fc[3], 0.4);                                                       // 21 Jan: (0.5 + 0.3) / 2
  close(fc[4], 0.4);
  close(fc[5], 0.4);
});

test("simScope: a week with no drought reading in any county has a null class, and no forecast gives null", () => {
  const data = fake(), s = logic(data).simScope([data.Y]);                 // county C: "......", no forecasts
  assert.ok(s.weeks.every((w) => w.cls === null && w.forecast === null));
});

test("simScope: canals are the members' ranked canals, once in rank order and once in map order", () => {
  const data = fake(), { simScope } = logic(data);
  const x = simScope([data.X]);
  assert.deepStrictEqual(names(x.canals), ["A", "B"]);                     // the drain is left out
  assert.deepStrictEqual(names(x.canalsUnranked), ["B", "A"]);
  assert.deepStrictEqual(x.ids, [0]);
  assert.deepStrictEqual(names(simScope([data.X, data.Y]).canals), ["A", "B", "C", "D"]);
});

test("simScope: demand and revenue at stake are the published figures times the share of valley canal km", () => {
  const data = fake(), { simScope } = logic(data);
  const x = simScope([data.X]);                                            // 30 km of the valley's 30 km
  assert.strictEqual(x.share, 1);
  assert.strictEqual(x.demandAf, 10);
  assert.strictEqual(x.revenueAtStake, 1000);
  assert.strictEqual(x.outsideValley, false);
  assert.strictEqual(x.members, 1);
  const xy = simScope([data.X, data.Y]);                                   // 40 km against the valley's 30
  close(xy.share, 40 / 30);
  close(xy.demandAf, 10 * 40 / 30);
  assert.strictEqual(xy.outsideValley, true);
  assert.strictEqual(xy.members, 2);
});

test("simScope: today's chance is the frozen model's, weighted by canal km, with the district's own forecast as the fallback", () => {
  const data = fake(), { simScope } = logic(data);
  close(simScope([data.X]).pNow, 0.4);                                     // county A has a live value; B has none
  close(simScope([data.Y]).pNow, 0.2);                                     // no live value: the district's pSeason
  close(simScope([data.X, data.Y]).pNow, (0.4 * 30 + 0.2 * 10) / 40);      // 0.35
});

test("simScope: an El Paso district reads the Elephant Butte reservoir record", () => {
  const data = fake(), s = logic(data).simScope([data.Z]);
  assert.strictEqual(s.system, "Elephant Butte");
  assert.deepStrictEqual(s.weeks.map((w) => w.pct), [10, 11, 12, 13, 14, 15]);
  assert.strictEqual(L.usesElephantButte(data.Z), true);
  assert.strictEqual(L.usesElephantButte(data.X), false);
  assert.strictEqual(L.usesElephantButte({ fips: [] }), false);
  assert.strictEqual(L.usesElephantButte({ fips: ["48141", "A"] }), false);   // every county must draw on it
});

test("simScope: an empty list gives every week, no canals and nothing at stake", () => {
  const s = logic().simScope([]);
  assert.strictEqual(s.weeks.length, 6);
  assert.deepStrictEqual([s.canals.length, s.share, s.demandAf, s.pNow, s.members], [0, 0, 0, 0, 0]);
});

test("simScope: without the frozen model there are no forecasts and today's chance is the district's own", () => {
  const data = fake(); delete data.SIM.pre2020;
  const s = logic(data).simScope([data.X]);
  assert.ok(s.weeks.every((w) => w.forecast === null));
  close(s.pNow, 0.6);
});

test("simScope output runs through the engine", () => {
  const data = fake(), run = E.simulate(logic(data).simScope([data.X, data.Y]), { trigger: "always" }, { budget: 1e6 });
  assert.strictEqual(run.plan.canals, 4);
  assert.strictEqual(run.years.length, 2);                                 // 2019 and 2020
});

/* ---------- hitRates ---------- */
test("hitRates: recall as published, and false alarms as a share of the seasons that were not droughts", () => {
  // The frozen model's test: 10 false alarms in 100 - 60 = 40 seasons with no drought.
  assert.deepStrictEqual(logic().hitRates(), { recall: 0.9, falseAlarm: 0.25 });
});

test("hitRates falls back to the pipeline's trigger test when there is no frozen model, and never divides by zero", () => {
  const data = fake(); delete data.SIM.pre2020;
  // 20 rows, 20 drought seasons: no season without a drought, so the divisor is held at 1.
  assert.deepStrictEqual(logic(data).hitRates(), { recall: 0.8, falseAlarm: 5 });
  data.HG.trigger.rows = 45;
  assert.deepStrictEqual(logic(data).hitRates(), { recall: 0.8, falseAlarm: 0.2 });
});

/* ---------- The real data files ---------- */
// data/core.js and data/sim.js set window.HG and window.HG_SIM. They are read, never written.
function realData() {
  const window = {};
  for (const file of ["core.js", "sim.js"]) {
    new Function("window", fs.readFileSync(path.join(__dirname, "..", "data", file), "utf8"))(window);
  }
  // The canal fields the plan needs, by their position in the generated list (see js/common.js).
  const canals = window.HG.canals.map((c, i) => ({ id: i, km: c[4], rate: c[5], district: c[7], rank: c[8], usd: c[9] }));
  return { HG: window.HG, SIM: window.HG_SIM, canals, published: { worstCaseRevenue: 1, valleyIrrigationAf: 1 } };
}

test("real data: the plan for the pipeline's example budget equals the pipeline's published totals", () => {
  const data = realData(), published = data.HG.plan;
  const inDistricts = data.canals.filter((c) => c.district >= 0);
  const plan = L.makeLogic(data).planFor(inDistricts, published.budget_usd, null);
  assert.ok(plan.funded.length > 0);
  assert.strictEqual(Math.round(plan.spent), published.spent_usd);
  assert.strictEqual(Math.round(plan.km * 10) / 10, published.sealed_km);
  assert.strictEqual(Math.round(plan.savedLow), published.saved_af_low);
  assert.strictEqual(Math.round(plan.savedHigh), published.saved_af_high);
  assert.strictEqual(Math.round(plan.costAll), published.cost_to_treat_everything_usd);
  assert.ok(plan.spent <= published.budget_usd);
});

test("real data: simScope lines every district's weeks up with the weekly record", () => {
  const data = realData(), { simScope } = L.makeLogic(data);
  for (const d of [data.HG.districts[0], data.HG.districts[data.HG.districts.length - 1]]) {
    const s = simScope([d]);
    assert.strictEqual(s.weeks.length, data.SIM.nWeeks);
    assert.strictEqual(s.weeks[0].date, data.SIM.week0);
    assert.strictEqual(s.weeks[s.weeks.length - 1].pct, data.SIM.reservoirs[s.system][data.SIM.nWeeks - 1]);
    for (let i = 1; i < s.weeks.length; i++) assert.strictEqual(Date.parse(s.weeks[i].date) - Date.parse(s.weeks[i - 1].date), 7 * 864e5);
  }
});

/* ---------- The replay of real years ---------- */
// Weekly data from Tuesday 2007-01-02: 2007, 2008 and 2009 whole, 2010 cut off after 30 weeks.
// County A has a forecast on the first week of each month from January 2008 to December 2009.
function replayFake(change) {
  const data = fake(), nWeeks = 52 * 3 + 30, start = Date.parse("2007-01-02T12:00:00Z");
  const dateOf = (i) => new Date(start + i * 7 * 864e5);
  const forecastA = [], seen = {};
  for (let i = 0; i < nWeeks; i++) {
    const d = dateOf(i), key = d.getUTCFullYear() + "-" + d.getUTCMonth(), year = d.getUTCFullYear();
    const first = !seen[key]; seen[key] = true;
    // 2008: a warning from March on. 2009: no warning all year.
    forecastA.push(first && (year === 2008 || year === 2009) ? (year === 2008 && d.getUTCMonth() >= 2 ? 0.6 : 0.1) : null);
  }
  data.SIM = {
    week0: "2007-01-02", nWeeks, valley: ["A"],
    cls: { A: "0".repeat(nWeeks), B: "0".repeat(nWeeks), C: "0".repeat(nWeeks), "48141": "0".repeat(nWeeks) },
    reservoirs: { "Amistad-Falcon": Array.from({ length: nWeeks }, () => 30), "Elephant Butte": Array.from({ length: nWeeks }, () => 30) },
    forecast: { A: forecastA },
    pre2020: null,
  };
  data.published = { worstCaseRevenue: 1e9, valleyIrrigationAf: 1e4 };     // $100,000 an acre-foot, so sealing can pay; 10,000 acre-feet wanted a year
  data.dateOf = dateOf;
  if (change) change(data);
  return data;
}

test("replayScope keeps only whole years that have forecasts, and says which", () => {
  const data = replayFake(), s = logic(data).replayScope([data.X]);
  assert.strictEqual(s.firstYear, 2008);                                   // 2007 has no forecast
  assert.strictEqual(s.lastYear, 2009);                                    // 2010 stops after 30 weeks
  assert.deepStrictEqual(Array.from(new Set(s.weeks.map((w) => w.year))), [2008, 2009]);
  assert.strictEqual(s.weeks.length, 53 + 52);                              // 2008 has 53 Tuesdays
  assert.strictEqual(s.weeks[0].date, "2008-01-01");
  assert.deepStrictEqual(names(s.canals), ["A", "B"]);                     // the same canals as the simulation's scope
});

test("replayScope gives each week the newest forward-chained forecast made on or before it", () => {
  const data = replayFake(), s = logic(data).replayScope([data.X]);
  const on = (date) => s.weeks.find((w) => w.date === date).forecast;
  assert.strictEqual(on("2008-01-01"), 0.1);                               // made that day
  assert.strictEqual(on("2008-02-26"), 0.1);                               // still February's
  assert.strictEqual(on("2008-03-04"), 0.6);                               // March's, the day it was made
  assert.strictEqual(on("2008-03-25"), 0.6);
  assert.strictEqual(on("2008-12-30"), 0.6);
  assert.strictEqual(on("2009-01-06"), 0.1);                               // a new year's forecast replaces it
  // The value never comes from a later week: every week's forecast was already made by then.
  s.weeks.forEach((w) => {
    let latest = null;
    data.SIM.forecast.A.forEach((p, i) => { if (p != null && data.dateOf(i).toISOString().slice(0, 10) <= w.date) latest = p; });
    assert.strictEqual(w.forecast, latest, w.date);
  });
});

test("replayScope uses the forward-chained forecasts, not the frozen model's", () => {
  const data = replayFake((d) => { d.SIM.pre2020 = { monthly: { A: [["2008-01-01", 0.99, 1]] }, live: {} }; });
  const lg = logic(data);
  assert.ok(lg.replayScope([data.X]).weeks.every((w) => w.forecast !== 0.99));
  assert.ok(lg.simScope([data.X]).weeks.some((w) => w.forecast === 0.99));
});

test("replayScope gives null when the data holds no year with forecasts", () => {
  const none = replayFake((d) => { delete d.SIM.forecast; });
  assert.strictEqual(logic(none).replayScope([none.X]), null);
  const data = replayFake();
  assert.strictEqual(logic(data).replayScope([data.Y]), null);             // county C has no forecast
});

test("replay: five rows in the table's order, each from the engine's own run of that policy", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]), over = { budget: 1e6 };
  const result = L.replay(scope, over);
  assert.deepStrictEqual(result.rows.map((r) => r.trigger), ["never", "declared", "d1", "forecast", "always"]);
  assert.deepStrictEqual(result.years, [2008, 2009]);
  assert.deepStrictEqual([result.firstYear, result.lastYear], [2008, 2009]);
  result.rows.forEach((row) => {
    const run = E.simulate(scope, { trigger: row.trigger }, over);
    assert.strictEqual(row.spend, run.totals.spend);
    assert.strictEqual(row.loss, run.totals.loss);
    assert.strictEqual(row.keptAf, run.totals.savedAf);
    assert.strictEqual(row.yearsSealed, run.totals.yearsActed);
  });
});

test("replay: each policy seals in the years its rule says, on a record made up to tell them apart", () => {
  // No drought class at all (so no declaration and no D1), a forecast warning in 2008 only, and
  // reservoirs at 30% throughout (a shortage every season).
  const data = replayFake(), result = L.replay(logic(data).replayScope([data.X]), { budget: 1e6 });
  const sealed = {}; result.rows.forEach((r) => { sealed[r.trigger] = r.sealedYears; });
  assert.deepStrictEqual(sealed, { never: [], declared: [], d1: [], forecast: [2008], always: [2008, 2009] });
  const by = {}; result.rows.forEach((r) => { by[r.trigger] = r; });
  assert.strictEqual(by.never.spend, 0);
  assert.strictEqual(by.never.saving, 0);
  assert.strictEqual(by.d1.loss, by.never.loss);
  close(by.always.spend, 2 * by.forecast.spend);
  assert.ok(by.forecast.loss < by.never.loss && by.always.loss < by.forecast.loss);
  // Saving is crop loss avoided minus sealant spent.
  close(by.forecast.saving, by.never.loss - by.forecast.loss - by.forecast.spend);
});

test("replay: a row's totals are the sums of its per-year results", () => {
  const data = replayFake(), result = L.replay(logic(data).replayScope([data.X]), { budget: 1e6 });
  result.rows.forEach((row) => {
    const sum = (key) => row.perYear.reduce((s, y) => s + y[key], 0);
    assert.deepStrictEqual(row.perYear.map((y) => y.year), [2008, 2009]);
    close(row.spend, sum("spend")); close(row.loss, sum("loss")); close(row.keptAf, sum("keptAf")); close(row.usedAf, sum("usedAf"));
    assert.strictEqual(row.yearsSealed, row.perYear.filter((y) => y.sealed).length);
  });
});

/* ---------- Ranges, and the replay across draws of the canal unknowns ---------- */
test("band gives the 10th, 50th and 90th percentile of a list, whatever its order", () => {
  const list = []; for (let i = 100; i >= 1; i--) list.push(i);            // 100 down to 1
  const same = (b, low, mid, high) => { close(b.low, low); close(b.mid, mid); close(b.high, high); };
  same(L.band(list), 10.9, 50.5, 90.1);                                    // position q x 99 in the sorted list
  assert.deepStrictEqual(L.band([7]), { low: 7, mid: 7, high: 7 });
  same(L.band([3, 1, 2]), 1.2, 2, 2.8);
  assert.deepStrictEqual(list[0], 100);                                    // the list is left as it was
});

test("band of 10 values: the high is below the largest and the low above the smallest, by the same amount (found in the code audit)", () => {
  const b = L.band([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  close(b.low, 1.9); close(b.mid, 5.5); close(b.high, 9.1);
  assert.ok(b.high < 10 && b.low > 1);
  close(10 - b.high, b.low - 1);
  assert.deepStrictEqual(L.band([4, 4, 4, 4]), { low: 4, mid: 4, high: 4 });   // equal values stay exactly equal
});

test("rangeText writes the middle with its low and high, and says so when there is no spread", () => {
  assert.strictEqual(L.rangeText({ low: 2e6, mid: 4e6, high: 6e6 }, L.money), "$4.0M ($2.0M to $6.0M)");
  assert.strictEqual(L.rangeText({ low: -73000, mid: 7.4e6, high: 18.7e6 }, L.money), "$7.4M (-$73k to $18.7M)");
  assert.strictEqual(L.rangeText({ low: 5, mid: 5, high: 5 }, L.money), "$5 (the same in every draw)");
  assert.strictEqual(L.rangeText({ low: 5, mid: 5, high: 5 }, L.money, "future"), "$5 (the same in every future)");
  // Two ends that print the same are treated as no spread, so a range never reads "$1.0M to $1.0M".
  assert.strictEqual(L.rangeText({ low: 1000001, mid: 1000002, high: 1000003 }, L.money), "$1.0M (the same in every draw)");
});

test("rangeCell puts the middle and the range in separate elements and escapes what the formatter returns", () => {
  assert.strictEqual(L.rangeCell({ low: 2e6, mid: 4e6, high: 6e6 }, L.money), '<span class="rmid">$4.0M</span><small class="rng">$2.0M to $6.0M</small>');
  assert.strictEqual(L.rangeCell({ low: 9, mid: 9, high: 9 }, L.money, "future"), '<span class="rmid">$9</span><small class="rng">same in every future</small>');
  assert.ok(L.rangeCell({ low: 1, mid: 2, high: 3 }, (v) => "<b>" + v + "</b>").indexOf("<b>") < 0);
});

test("billionGal writes acre-feet as billions of gallons with fewer decimals as the figure grows", () => {
  assert.strictEqual(L.billionGal(1000000), "326");      // 1,000,000 x 325,851 gallons = 325.851 billion
  assert.strictEqual(L.billionGal(48769), "15.9");
  assert.strictEqual(L.billionGal(4370), "1.42");
});

test("thousandAf writes acre-feet in thousands with fewer decimals as the figure grows", () => {
  assert.strictEqual(L.thousandAf(3349696), "3,350");
  assert.strictEqual(L.thousandAf(48769), "48.8");
  assert.strictEqual(L.thousandAf(4370), "4.37");
  assert.strictEqual(L.thousandAf(0), "0.00");
});

test("replayBands: years sealed do not depend on the canals, and each range is the 10th, 50th and 90th percentile across the draws", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]), over = { budget: 1e6 };
  const result = L.replayBands(scope, over, { draws: 60, seed: 4 });
  assert.strictEqual(result.draws, 60);
  assert.deepStrictEqual([result.regime, result.calibrated], ["uncalibrated", false]);
  const plain = L.replay(scope, over);
  result.rows.forEach((row, i) => {
    assert.deepStrictEqual(row.sealedYears, plain.rows[i].sealedYears);     // the same decisions as with no draw at all
    assert.strictEqual(row.cost.length, 60);
    assert.ok(row.spend.low <= row.spend.mid && row.spend.mid <= row.spend.high);
  });
  // Rebuild the forecast policy's figures draw by draw with the engine and compare.
  const rng = E.makeRng(4), nothing = E.simulate(scope, { trigger: "never" }, over).totals, spend = [], kept = [], loss = [], saving = [];
  for (let k = 0; k < 60; k++) {
    const t = E.simulate(Object.assign({}, scope, { physics: E.samplePhysics(rng) }), { trigger: "forecast" }, over).totals;
    spend.push(t.spend); kept.push(t.savedAf); loss.push(t.loss); saving.push(nothing.cost - t.cost);
  }
  const forecast = result.rows[3];
  assert.deepStrictEqual(forecast.spend, L.band(spend));
  assert.deepStrictEqual(forecast.keptAf, L.band(kept));
  assert.deepStrictEqual(forecast.loss, L.band(loss));
  assert.deepStrictEqual(forecast.saving, L.band(saving));
  assert.ok(forecast.spend.high > forecast.spend.low && forecast.keptAf.high > forecast.keptAf.low, "the canal unknowns spread the figures");
});

test("replayBands: doing nothing is the same in every draw, and the same seed gives the same result", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]);
  const a = L.replayBands(scope, { budget: 1e6 }, { draws: 40 }), never = a.rows[0];
  assert.deepStrictEqual([never.spend, never.keptAf, never.saving], [{ low: 0, mid: 0, high: 0 }, { low: 0, mid: 0, high: 0 }, { low: 0, mid: 0, high: 0 }]);
  assert.strictEqual(never.loss.low, never.loss.high);
  assert.deepStrictEqual([never.losesToNothing, never.overBudget], [0, 0]);
  assert.deepStrictEqual(L.replayBands(scope, { budget: 1e6 }, { draws: 40 }), a);
  assert.notDeepStrictEqual(L.replayBands(scope, { budget: 1e6 }, { draws: 40, seed: 12 }).rows[4].spend, a.rows[4].spend);
});

test("replayBands counts the draws where a round cost more than the budget and where a policy lost to doing nothing", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]);
  // A budget that is exactly the plan's cost: any draw with wider canals goes over it. About half do.
  const exact = E.fundCanals(scope.canals, Infinity, E.makeParams()).spent;
  const tight = L.replayBands(scope, { budget: exact }, { draws: 200 });
  const rng = E.makeRng(11); let wider = 0;
  for (let k = 0; k < 200; k++) if (E.samplePhysics(rng).widthMult > 1) wider++;
  assert.strictEqual(tight.rows[4].overBudget, wider);                      // "always" sealed in every draw
  assert.ok(wider > 70 && wider < 130, String(wider));
  assert.strictEqual(tight.rows[2].overBudget, 0);                          // the D1 rule never sealed here, so it never paid a bill
  assert.strictEqual(L.replayBands(scope, { budget: exact * 1.5 + 1 }, { draws: 200 }).rows[4].overBudget, 0);
  // When water is worth next to nothing, sealing costs more than it keeps: every sealing draw loses.
  const cheap = replayFake((d) => { d.published = { worstCaseRevenue: 10, valleyIrrigationAf: 1e4 }; });
  const lost = L.replayBands(logic(cheap).replayScope([cheap.X]), { budget: 1e6 }, { draws: 50 });
  assert.strictEqual(lost.rows[4].losesToNothing, 50);
  assert.strictEqual(lost.rows[3].losesToNothing, 50);
  assert.strictEqual(lost.rows[2].losesToNothing, 0);                       // never sealed: level with doing nothing, not worse
  assert.strictEqual(tight.rows[4].losesToNothing, 0);
});

test("replayBands passes a calibration spread through to the engine and reports the calibrated regime", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]);
  const cal = L.replayBands(scope, { budget: 1e6 }, { draws: 30, physicsOptions: { seepSd: 0.4 } });
  assert.deepStrictEqual([cal.regime, cal.calibrated], ["calibrated", true]);
  assert.notDeepStrictEqual(cal.rows[4].keptAf, L.replayBands(scope, { budget: 1e6 }, { draws: 30 }).rows[4].keptAf);
});

test("physicsOptions is empty today and carries a calibration spread once the data has one", () => {
  const data = fake();
  assert.deepStrictEqual(logic(data).physicsOptions(), {});
  data.HG.calibration = { seepSd: 0.35 };
  assert.deepStrictEqual(logic(data).physicsOptions(), { seepSd: 0.35 });
  for (const bad of [null, "0.3", NaN, -1, Infinity]) { data.HG.calibration = { seepSd: bad }; assert.deepStrictEqual(logic(data).physicsOptions(), {}, String(bad)); }
});

test("replay lists the years two policies decided differently and what each of those years adds to the gap", () => {
  // The made-up record: the forecast seals in 2008 only, sealing every year seals in 2008 and 2009,
  // and the D1 rule never seals. Every season is short of water, so sealing pays each time.
  const data = replayFake(), result = L.replay(logic(data).replayScope([data.X]), { budget: 1e6 });
  const by = {}; result.rows.forEach((r) => { by[r.trigger] = r; });
  const pair = (a, b) => result.pairs.find((p) => p.a === a && p.b === b);
  const yearCost = (row, year) => { const y = row.perYear.find((x) => x.year === year); return y.loss + y.spend; };
  assert.deepStrictEqual(result.pairs.map((p) => p.a + "/" + p.b), ["forecast/d1", "forecast/always", "d1/always"]);
  // Forecast against D1: they part in 2008 only, and that year is the whole gap.
  const fd = pair("forecast", "d1");
  assert.deepStrictEqual(fd.differ.map((d) => [d.year, d.sealedA, d.sealedB]), [[2008, true, false]]);
  close(fd.differ[0].gap, yearCost(by.d1, 2008) - yearCost(by.forecast, 2008));
  close(fd.gap, by.d1.cost - by.forecast.cost);
  close(fd.gap, fd.differ[0].gap);
  assert.ok(fd.gap > 0);                                                   // the forecast cost less
  // Forecast against sealing every year: they part in 2009 only, and there the forecast cost more.
  const fa = pair("forecast", "always");
  assert.deepStrictEqual(fa.differ.map((d) => [d.year, d.sealedA, d.sealedB]), [[2009, false, true]]);
  close(fa.gap, by.always.cost - by.forecast.cost);
  assert.ok(fa.gap < 0);
  // D1 against sealing every year: both years, and the two years' parts add up to the whole gap.
  const da = pair("d1", "always");
  assert.deepStrictEqual(da.differ.map((d) => d.year), [2008, 2009]);
  close(da.differ[0].gap + da.differ[1].gap, da.gap);
  close(da.gap, by.always.cost - by.d1.cost);
});

test("replayBands gives the same differing years as the plain replay, with a range for each year's part of the gap", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]), plain = L.replay(scope, { budget: 1e6 });
  const bands = L.replayBands(scope, { budget: 1e6 }, { draws: 50 });
  bands.pairs.forEach((p, j) => {
    assert.deepStrictEqual(p.differ.map((d) => [d.year, d.sealedA, d.sealedB]), plain.pairs[j].differ.map((d) => [d.year, d.sealedA, d.sealedB]));
    p.differ.forEach((d) => assert.ok(d.gap.low <= d.gap.mid && d.gap.mid <= d.gap.high && d.gap.high > d.gap.low));
  });
  // Draw by draw, the differing years' parts add up to the gap between the two totals.
  const fd = bands.pairs[0], forecast = bands.rows[3], d1 = bands.rows[2];
  const whole = L.band(d1.cost.map((c, k) => c - forecast.cost[k]));       // one differing year: it is the whole gap
  for (const key of ["low", "mid", "high"]) close(fd.differ[0].gap[key], whole[key]);
  assert.deepStrictEqual([bands.districts, bands.counties], [1, 2]);       // district X sits in counties A and B
});

/*
  A replay-bands result written by hand, to test the sentence on its own. Ten draws; the forecast's
  total is 600 in each. apart = the years the forecast and the other policy decided differently,
  as [year, that year's part of the gap].
*/
function handBands(d1Costs, d1Apart, alwaysCosts, alwaysApart) {
  const n = 10, row = (trigger, cost, sealed, extra) => Object.assign({ trigger, cost, yearsSealed: sealed, losesToNothing: 0, overBudget: 0 }, extra || {});
  const differ = (list) => list.map(([year, gap]) => ({ year, sealedA: gap > 0, sealedB: gap <= 0, gap: { low: gap, mid: gap, high: gap } }));
  return { draws: n, years: [2008, 2009, 2010, 2011, 2012, 2013], districts: 1, counties: 1,
    pairs: [{ a: "forecast", b: "d1", differ: differ(d1Apart) }, { a: "forecast", b: "always", differ: differ(alwaysApart) }],
    rows: [row("never", Array(n).fill(1000)), row("declared", Array(n).fill(950), 1, { losesToNothing: 2 }),
      row("d1", d1Costs, 3, { losesToNothing: 1 }), row("forecast", Array(n).fill(600), 2), row("always", alwaysCosts, 6, { overBudget: 4 })] };
}
const costs = (lowerCount, low, high) => Array.from({ length: 10 }, (x, k) => (k < lowerCount ? low : high));
const SPREAD = [[2008, 70], [2010, 60], [2012, 70]];                       // three years, none more than half of the 200
const ONE_YEAR = [[2008, 10], [2010, 10], [2012, 180]];                    // three years, 2012 is 90% of the 200

test("replayBandsSentence: the same decisions in every year are reported as the same, with no ahead or behind", () => {
  const s = L.replayBandsSentence(handBands(Array(10).fill(600), [], Array(10).fill(600), []));
  assert.deepStrictEqual([s.vsD1, s.vsAlways], ["same", "same"]);
  assert.strictEqual(s.text, "In this replay, acting on the forecast sealed in 2 of 6 years. " +
    "Against the D1 rule (3 years sealed): the two made the same decision in all 6 years, so their modelled results are the same. " +
    "Against sealing every year (6 years sealed): the two made the same decision in all 6 years, so their modelled results are the same.");
});

test("replayBandsSentence says ahead only with 9 draws in 10, three or more differing years and no year over half the gap", () => {
  const s = L.replayBandsSentence(handBands(costs(9, 800, 500), SPREAD, Array(10).fill(700), SPREAD));
  assert.deepStrictEqual([s.vsD1, s.vsAlways], ["better", "better"]);
  assert.ok(s.text.indexOf("Against the D1 rule (3 years sealed): the two decided differently in 3 of 6 years (2008, 2010, 2012). " +
    "The forecast had the lower modelled total cost in 9 of 10 draws (90%): in this replay it ended ahead.") > 0, s.text);
  assert.ok(s.text.indexOf("in 10 of 10 draws (100%): in this replay it ended ahead.") > 0, s.text);
});

test("replayBandsSentence: one year supplying more than half the gap is named, and the result is not called ahead (the real case)", () => {
  const s = L.replayBandsSentence(handBands(Array(10).fill(800), ONE_YEAR, Array(10).fill(700), SPREAD));
  assert.strictEqual(s.vsD1, "indistinct");
  assert.strictEqual(s.vsAlways, "better");
  assert.ok(s.text.indexOf("Against the D1 rule (3 years sealed): the two decided differently in 3 of 6 years (2008, 2010, 2012). " +
    "The forecast had the lower modelled total cost in 10 of 10 draws (100%), but 2012 alone supplies more than half of the gap, " +
    "and one year is not evidence that the forecast is better: not distinguishable in this replay.") > 0, s.text);
  const d1Part = s.text.slice(0, s.text.indexOf("Against sealing every year"));
  assert.ok(d1Part.indexOf("ahead") < 0 && d1Part.indexOf("behind") < 0, d1Part);
  // Exactly half is not "more than half": two equal years out of... four equal years, one of them a quarter.
  assert.strictEqual(L.replayBandsSentence(handBands(Array(10).fill(800), [[2008, 100], [2010, 50], [2012, 50]], Array(10).fill(700), SPREAD)).vsD1, "better");
});

test("replayBandsSentence says behind when the forecast's total is higher in 9 draws in 10 over several years, and names a dominant year instead when there is one", () => {
  const behind = [[2008, -70], [2010, -60], [2012, -70]];
  const s = L.replayBandsSentence(handBands(costs(9, 500, 800), behind, Array(10).fill(550), [[2008, -10], [2010, -10], [2012, -180]]));
  assert.deepStrictEqual([s.vsD1, s.vsAlways], ["worse", "indistinct"]);
  assert.ok(s.text.indexOf("The forecast had the higher modelled total cost in 9 of 10 draws (90%): in this replay it ended behind.") > 0, s.text);
  assert.ok(s.text.indexOf("The forecast had the higher modelled total cost in 10 of 10 draws (100%), but 2012 alone supplies more than half of the gap, " +
    "and one year is not evidence that sealing every year is better: not distinguishable in this replay.") > 0, s.text);
  assert.ok(s.text.indexOf("ahead") < 0);
});

test("replayBandsSentence: fewer than three differing years is not enough to call it, even with every draw one way", () => {
  const s = L.replayBandsSentence(handBands(Array(10).fill(800), [[2008, 100], [2010, 100]], Array(10).fill(700), [[2009, 50], [2011, 50]]));
  assert.deepStrictEqual([s.vsD1, s.vsAlways], ["indistinct", "indistinct"]);
  assert.ok(s.text.indexOf("the two decided differently in 2 of 6 years (2008, 2010). The forecast had the lower modelled total cost in 10 of 10 draws (100%), " +
    "but 2 years of difference are too few to tell two policies apart: not distinguishable in this replay.") > 0, s.text);
  // A single differing year is always more than half of its own gap, so the year is named.
  const one = L.replayBandsSentence(handBands(Array(10).fill(800), [[2011, 200]], Array(10).fill(700), SPREAD));
  assert.ok(one.text.indexOf("the two decided differently in 1 of 6 years (2011).") > 0 && one.text.indexOf("but 2011 alone supplies more than half of the gap") > 0, one.text);
});

test("replayBandsSentence: short of 9 draws in 10 it is not distinguishable, and the share is still stated", () => {
  // The forecast is lower in 8 of 10 against D1, and in 3 of 10 against sealing every year.
  const s = L.replayBandsSentence(handBands(costs(8, 800, 500), SPREAD, costs(3, 700, 550), SPREAD));
  assert.deepStrictEqual([s.vsD1, s.vsAlways], ["indistinct", "indistinct"]);
  assert.ok(s.text.indexOf("The forecast had the lower modelled total cost in 8 of 10 draws (80%), short of the 9 in 10 needed to call it either way: not distinguishable in this replay.") > 0, s.text);
  assert.ok(s.text.indexOf("in 3 of 10 draws (30%), short of the 9 in 10") > 0, s.text);
});

test("the sentence about the scored test is fixed wording, with only the numbers the team reported", () => {
  assert.strictEqual(L.SCORED_TEST_SENTENCE, "In the scored test on all 31 Rio Grande counties (558 county-years), the forecast and the 'already in moderate drought' rule could not be told apart.");
  assert.deepStrictEqual(L.SCORED_TEST_SENTENCE.match(/\d+/g), ["31", "558"]);
});

test("sharedForecastSentence counts the counties a view of several districts draws on, and says nothing for one district", () => {
  assert.strictEqual(L.sharedForecastSentence({ districts: 1, counties: 2 }), "");
  assert.strictEqual(L.sharedForecastSentence({ districts: 25, counties: 4 }),
    "The 25 districts in this view draw on the forecasts of 4 counties. Districts in the same county share one forecast, so they are not 25 separate tests of it.");
  assert.strictEqual(L.sharedForecastSentence({ districts: 3, counties: 1 }),
    "The 3 districts in this view draw on the forecasts of 1 county. Districts in the same county share one forecast, so they are not 3 separate tests of it.");
  // Counted from the data: X is in counties A and B, Y in C.
  const data = fake(), lg = logic(data);
  assert.strictEqual(lg.simScope([data.X]).counties, 2);
  assert.strictEqual(lg.simScope([data.X, data.Y]).counties, 3);
  assert.strictEqual(lg.simScope([data.X, data.X]).counties, 2);
});

test("replayBandsLines state the counts as they are, including zero", () => {
  const lines = L.replayBandsLines(handBands(Array(10).fill(700), SPREAD, Array(10).fill(650), SPREAD));
  assert.strictEqual(lines.worse, "Ended worse than doing nothing (a higher modelled total cost), out of 10 draws: waiting for a declaration in 2, the D1 rule in 1, the forecast in 0, sealing every year in 0.");
  assert.strictEqual(lines.overBudget, "A sealing round cost more than the budget in 4 of 10 draws: the plan is made at the assumed canal width, and in those draws the canals were wider.");
  const none = handBands(Array(10).fill(700), SPREAD, Array(10).fill(650), SPREAD); none.rows[4].overBudget = 0;
  assert.strictEqual(L.replayBandsLines(none).overBudget, "In none of the 10 draws did a sealing round cost more than the budget.");
});

/*
  "No bare dollar": on the simulation step every dollar figure must be part of a range, or be the
  sealant budget, which is an input and is labelled as one. This strips the allowed forms out of
  a piece of HTML or text and returns whatever dollar figures are left.

  ONE EXEMPTION, and only because of its caption: the picture on the left of the step (js/twin.js
  draws it on a canvas, so it is not in this HTML). It shows single figures for one run: crops lost
  and saved, gallons leaked and saved, and a closing "Sealing early saves ...". They are allowed
  because the caption TWIN_CAPTION is shown on the picture whenever the picture is shown. The
  test "the picture's caption..." below checks that tie.
*/
function bareDollars(html) {
  const left = html
    .replace(/<span class="rmid">[^<]*<\/span><small class="rng">[^<]*<\/small>/g, "")                      // a range in a table cell
    .replace(/<b class="hrange">[^<]*<\/b><small class="hmid">[^<]*<\/small>/g, "")                          // the headline range: low to high, with the middle under it
    .replace(/-?\$[\d.,]+[kMB]? \((?:-?\$[\d.,]+[kMB]? to -?\$[\d.,]+[kMB]?|the same in every (?:draw|future))\)/g, "")   // a range in a sentence
    .replace(/Sealant budget \(an input\) \$[\d.,]+(?: (?:million|billion))?/g, "");                         // the budget, labelled as an input
  return left.match(/-?\$[\d.,]+\s?(?:[kMB]|million|billion)?/g) || [];
}

test("no bare dollar: the checker itself catches a lone figure and passes the allowed forms", () => {
  assert.deepStrictEqual(bareDollars("<td>$4.0M</td>"), ["$4.0M"]);
  assert.deepStrictEqual(bareDollars("saved $169M in a typical future"), ["$169M"]);
  assert.deepStrictEqual(bareDollars('<span class="rmid">$4.0M</span> and then $2.0M'), ["$4.0M", "$2.0M"]);   // a middle with no range under it
  assert.deepStrictEqual(bareDollars("spent $1.3 million"), ["$1.3 million"]);
  assert.deepStrictEqual(bareDollars(L.rangeCell({ low: 2e6, mid: 4e6, high: 6e6 }, L.money)), []);
  assert.deepStrictEqual(bareDollars(L.rangeCell({ low: 5, mid: 5, high: 5 }, L.money)), []);
  assert.deepStrictEqual(bareDollars(L.rangeText({ low: -73000, mid: 7.4e6, high: 18.7e6 }, L.money) + "."), []);
  assert.deepStrictEqual(bareDollars(L.rangeText({ low: 5, mid: 5, high: 5 }, L.money, "future")), []);
  assert.deepStrictEqual(bareDollars("Sealant budget (an input) $1.3 million each round"), []);
  // The headline at the top of the Simulation step is a range too: low to high, and the middle beside it.
  assert.strictEqual(L.rangeHeadline({ low: 2e6, mid: 4e6, high: 6e6 }, L.money), '<b class="hrange">$2.0M to $6.0M</b><small class="hmid">middle $4.0M</small>');
  assert.strictEqual(L.rangeHeadline({ low: -73000, mid: 7.4e6, high: 18.7e6 }, L.money), '<b class="hrange">-$73k to $18.7M</b><small class="hmid">middle $7.4M</small>');
  assert.strictEqual(L.rangeHeadline({ low: 5, mid: 5, high: 5 }, L.money, "future"), '<b class="hrange">$5</b><small class="hmid">the same in every future</small>');
  assert.deepStrictEqual(bareDollars(L.rangeHeadline({ low: 2e6, mid: 4e6, high: 6e6 }, L.money)), []);
  assert.deepStrictEqual(bareDollars('<b class="hrange">$2.0M</b> and then $6.0M'), ["$2.0M", "$6.0M"]);   // a headline figure with no middle under it
});

test("no bare dollar: the replay table, its sentence and its count lines hold no lone dollar figure, for one district and for the state view", () => {
  const data = realData(); data.published = { worstCaseRevenue: 367e6, valleyIrrigationAf: 1e6 };   // a stand-in value of water, so the figures are not all zero
  const lg = L.makeLogic(data);
  const hasCanals = (d) => data.canals.some((c) => c.district === data.HG.districts.indexOf(d) && c.rank != null);
  const scopes = [[data.HG.districts.find(hasCanals)], data.HG.districts.filter((d) => hasCanals(d) && !L.usesElephantButte(d))];
  for (const members of scopes) {
    const scope = lg.replayScope(members), result = L.replayBands(scope, { budget: scope.canals.reduce((s, c) => s + c.usd, 0) + 1 }, { draws: 60 });
    const table = L.replayBandsTable(result), lines = L.replayBandsLines(result);
    assert.ok((table.match(/\$/g) || []).length >= 30, "the table does hold dollar figures");
    assert.deepStrictEqual(bareDollars(table), []);
    assert.deepStrictEqual(bareDollars(L.replayBandsSentence(result).text + lines.worse + lines.overBudget), []);
    // Every figure cell in the table is a range cell; only "years sealed", "none" and the empty cell are not.
    const cells = table.match(/<td class="r">.*?<\/td>/g);
    cells.forEach((c) => assert.ok(/rmid/.test(c) || /^<td class="r">(\d+ of \d+|0|none|)<\/td>$/.test(c), c));
    assert.strictEqual(cells.length, 5 * 5);
    // The short table at the top of the step: the same rows without the crop-loss column, the
    // forecast's row marked, water in billions of gallons, and still no lone dollar figure.
    const short = L.replayBandsTable(result, true), shortCells = short.match(/<td class="r">.*?<\/td>/g);
    assert.deepStrictEqual(bareDollars(short), []);
    assert.strictEqual(shortCells.length, 5 * 4);
    shortCells.forEach((c) => assert.ok(/rmid/.test(c) || /^<td class="r">(\d+ of \d+|0|none|)<\/td>$/.test(c), c));
    assert.ok(short.indexOf("Crop loss") < 0 && table.indexOf("Crop loss") >= 0);
    assert.ok(short.indexOf("Water kept (billion gallons)") >= 0 && !/acre|\baf\b/i.test(short));
    assert.strictEqual((short.match(/<tr class="hl">/g) || []).length, 1);
    assert.ok(short.indexOf('<tr class="hl"><td>Seal when the forecast warns</td>') >= 0);
    // Leaving the column out changes nothing else: each short row is the full row minus its crop-loss cell.
    result.rows.forEach((r) => assert.ok(short.indexOf(L.rangeCell(r.saving, L.money)) >= 0 || r.trigger === "never"));
  }
});

test("real data: the replay holds its invariants for one district and for the whole state view", () => {
  const data = realData(), lg = L.makeLogic(data);
  const hasCanals = (d) => data.canals.some((c) => c.district === data.HG.districts.indexOf(d) && c.rank != null);
  const stateView = data.HG.districts.filter((d) => hasCanals(d) && !L.usesElephantButte(d));
  const oneDistrict = [data.HG.districts.find(hasCanals)];
  for (const members of [oneDistrict, stateView]) {
    const scope = lg.replayScope(members), over = { budget: scope.canals.reduce((s, c) => s + c.usd, 0) + 1 };
    const result = L.replay(scope, over), by = {};
    result.rows.forEach((r) => { by[r.trigger] = r; });
    // The years: from the first forward-chained forecast to the last whole year, with none missing.
    assert.strictEqual(result.firstYear, 2008);
    assert.ok(result.lastYear >= 2025);
    assert.deepStrictEqual(result.years, Array.from({ length: result.lastYear - 2007 }, (x, i) => 2008 + i));
    assert.ok(scope.weeks.every((w) => w.pct != null && w.cls != null), "real reservoir levels and drought classes for every week");
    assert.ok(scope.weeks.every((w) => w.forecast != null), "a forecast for every week");
    // Doing nothing spends nothing and keeps nothing.
    assert.deepStrictEqual([by.never.spend, by.never.keptAf, by.never.yearsSealed, by.never.saving], [0, 0, 0, 0]);
    // Sealing every year seals in every year, and no other policy seals in more.
    assert.strictEqual(by.always.yearsSealed, result.years.length);
    for (const t of ["declared", "d1", "forecast"]) {
      assert.ok(by[t].yearsSealed <= by.always.yearsSealed);
      assert.ok(by[t].spend <= by.always.spend);
      assert.ok(by[t].sealedYears.every((y) => by.always.sealedYears.indexOf(y) >= 0));
    }
    // Totals are the sums of the engine's per-year results.
    result.rows.forEach((row) => {
      const run = E.simulate(scope, { trigger: row.trigger }, over), sum = (key) => run.years.reduce((s, y) => s + y[key], 0);
      close(row.spend, sum("spend")); close(row.loss, sum("loss")); close(row.keptAf, sum("savedAf"));
      assert.strictEqual(row.yearsSealed, run.years.filter((y) => y.acted).length);
      close(row.saving, by.never.loss - row.loss - row.spend);
      assert.ok(row.loss <= by.never.loss + 1e-6);                         // sealing never adds to crop loss
      assert.ok(row.usedAf <= row.keptAf + 1e-9);
    });
    // The same inputs give the same result.
    assert.deepStrictEqual(L.replay(lg.replayScope(members), over), result);
    // Across draws of the canal unknowns the decisions stay the same, and so do the years.
    const bands = L.replayBands(scope, over, { draws: 40 });
    bands.rows.forEach((row, i) => assert.deepStrictEqual(row.sealedYears, result.rows[i].sealedYears));
    assert.deepStrictEqual(bands.years, result.years);
    const sentence = L.replayBandsSentence(bands);
    const verdicts = ["better", "worse", "same", "indistinct"];
    assert.ok(verdicts.indexOf(sentence.vsD1) >= 0 && verdicts.indexOf(sentence.vsAlways) >= 0);
    // The differing years of the forecast and the D1 rule are the years exactly one of them sealed.
    const onlyOne = result.years.filter((y) => (by.forecast.sealedYears.indexOf(y) >= 0) !== (by.d1.sealedYears.indexOf(y) >= 0));
    assert.deepStrictEqual(bands.pairs[0].differ.map((d) => d.year), onlyOne);
    assert.deepStrictEqual(result.pairs[0].differ.map((d) => d.year), onlyOne);
    close(result.pairs[0].differ.reduce((s, d) => s + d.gap, 0), by.d1.cost - by.forecast.cost);
    // The sentence never says ahead or behind of the D1 rule unless they differ in three or more years.
    if (onlyOne.length < 3) assert.ok(sentence.vsD1 === "same" || sentence.vsD1 === "indistinct");
    assert.strictEqual(bands.counties, new Set([].concat.apply([], members.map((d) => d.fips))).size);
  }
});

test("the simulation's own scope is unchanged by the replay: it still reads the frozen model's forecasts", () => {
  const data = realData(), lg = L.makeLogic(data), d = data.HG.districts[0];
  const sim = lg.simScope([d]);
  assert.deepStrictEqual(Object.keys(sim), ["weeks", "canals", "canalsUnranked", "demandAf", "revenueAtStake", "share", "system", "pNow", "ids", "outsideValley", "members", "counties"]);
  assert.ok(sim.weeks.filter((w) => w.year < 2020).every((w) => w.forecast === null));   // the frozen model starts in 2020
  assert.ok(lg.replayScope([d]).weeks.filter((w) => w.year < 2020).every((w) => w.forecast !== null));
});

/* ---------- Fixed sentences ---------- */
test("the held-out test sentence is fixed wording and carries exactly the reported numbers", () => {
  assert.strictEqual(L.HELD_OUT_SENTENCE, "We tested the leak model by hiding one district at a time and predicting its published 1998 water loss. " +
    "Across 14 districts its typical error was 32.7%, against 36.5% for canal length alone, and the two could not be told apart. " +
    "So the volumes and dollar figures here are not reliable and are not measurements. " +
    "The canal order on the map is an illustration of the method, not a tested ranking: we have not shown that it ranks canals better than canal length does.");
  // Its numbers: the year of the published losses, then the three reported figures.
  assert.deepStrictEqual(L.HELD_OUT_SENTENCE.match(/\d+(?:\.\d+)?/g), ["1998", "14", "32.7", "36.5"]);
  // It must not tell the reader to trust the order of canals.
  assert.ok(!/treat the order|as the result/.test(L.HELD_OUT_SENTENCE));
  assert.strictEqual(L.LOSSES_1998_SENTENCE, "The 1998 losses are estimates based on water rights, not measured, and include evaporation and spills.");
  assert.strictEqual(L.esc(L.HELD_OUT_SENTENCE), L.HELD_OUT_SENTENCE);     // nothing in it needs escaping
});

test("the one-line honesty note is fixed wording, says the same as the held-out sentence, and is shorter", () => {
  assert.strictEqual(L.TRUST_LINE, "Modelled, not measured. Our own test could not confirm the leak model, so these dollars and gallons are not reliable.");
  assert.ok(L.TRUST_LINE.length < L.HELD_OUT_SENTENCE.length / 3);
  assert.ok(/not reliable/.test(L.TRUST_LINE) && /not reliable/.test(L.HELD_OUT_SENTENCE));
  assert.strictEqual(L.esc(L.TRUST_LINE), L.TRUST_LINE);                   // nothing in it needs escaping
});

test("the held-out sentence is placed on the Simulation step above the replay table, on the Budget plan above the ranked list, and on the Sources step", () => {
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  const body = (name) => { const a = page.indexOf("function " + name + "("); assert.ok(a >= 0, name); return page.slice(a, page.indexOf("\n  }\n", a)); };
  const before = (text, first, second, where) => { const i = text.indexOf(first), j = text.indexOf(second); assert.ok(i >= 0 && j >= 0 && i < j, where + ": " + first + " must come before " + second); };
  before(body("replayHtml"), "heldOutNote()", "bandsBlock(result", "Simulation step");
  // The top of the Simulation step shows the one-line note, with the way to the rest, ABOVE its short table;
  // the full sentence is in the step's fine print (replayHtml), which the step always fills in.
  before(body("simHeadHtml"), "trustLine()", "replayBandsTable(result, true)", "Simulation step: the honesty line comes before the short table");
  before(body("simHeadHtml"), "TAG_MODELLED", "rangeHeadline(", "Simulation step: the headline carries the modelled tag");
  assert.ok(body("simHeadHtml").indexOf("if (!scope) return trustLine()") >= 0, "the line is shown even when there is no replay to head the step");
  assert.ok(/const trustLine = \(\) => '<p class="trust">' \+ U\.esc\(window\.HGLogic\.TRUST_LINE\) \+ ' <button class="linkBtn" data-act="go" data-step="sources">How far to trust this &rarr;<\/button><\/p>';/.test(page));
  assert.ok(body("renderSimResult").indexOf('$("simNotes").innerHTML = replayHtml(c.over)') >= 0, "Simulation step: the fine print holds the full sentence");
  assert.ok(page.indexOf('<details class="more" id="simFine"><summary>Fine print for this run</summary><div id="simNotes"></div></details>') >= 0);
  // The Sources step opens with it, under the heading the Simulation step's link names.
  before(body("renderSources"), '"<h3>How far to trust this</h3>"', "heldOutNote()", "Sources step: the heading comes first");
  // What used to be spelled out on the Simulation step is on the Sources step.
  for (const piece of ["REPLAY_NOTE", "SAVING_NOTE", "PICK_NOTE", "window.HGLogic.SCORED_TEST_SENTENCE", "window.HGLogic.STRESS_TEST_SENTENCE", "window.HGLogic.TWIN_CAPTION"]) assert.ok(body("renderSources").indexOf(piece) >= 0, "Sources step: " + piece);
  before(body("bandsBlock"), "replayBandsTable(result)", "replayBandsSentence(result)", "the table is the first thing in the block");
  before(body("renderBudgetResult"), "heldOutNote() + ninetyDayHtml(d) + rows", "Simulate this plan", "Budget plan");
  assert.ok(body("renderSources").indexOf("heldOutNote()") >= 0, "Sources step");
  before(body("renderSources"), "heldOutNote()", "LOSSES_1998_SENTENCE", "Sources step: the note on the 1998 losses follows the sentence");
  // No copy calls the canals at the top of the list "the leakiest": the order is not a tested ranking.
  assert.ok(!/leakiest canals/.test(page));
  assert.ok(/const heldOutNote = \(\) => '<p class="note">' \+ U\.esc\(window\.HGLogic\.HELD_OUT_SENTENCE\) \+ "<\/p>";/.test(page));
  // The site does not load the pipeline's result file or a calibration: the engine stays uncalibrated.
  assert.ok(page.indexOf("seepage_calibration") < 0 && page.indexOf("HG.calibration") < 0);
});

test("the picture's caption is fixed wording and is shown whenever the picture is: both are switched by the same style rule", () => {
  assert.strictEqual(L.TWIN_CAPTION, "One illustrative run, with each unknown at the middle of its range. Not a prediction.");
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "site.css"), "utf8");
  const twin = fs.readFileSync(path.join(__dirname, "twin.js"), "utf8");
  // The page makes the caption once, at start-up, with the class that follows the picture, and puts it on the stage.
  assert.ok(page.indexOf('const twinCaption = U.el("p", { id: "twinCaption", class: "simOnly" });') >= 0);
  assert.ok(page.indexOf("twinCaption.textContent = window.HGLogic.TWIN_CAPTION;") >= 0);
  assert.ok(page.indexOf('$("stage").appendChild(twinCaption);') >= 0);
  assert.ok(page.indexOf("twinCaption") < page.indexOf("window.HGTwin.create("), "made before the picture is");
  // One rule hides the picture's canvas (#twin) and everything with class simOnly unless the stage is in picture mode.
  assert.ok(/\.stage:not\(\.sim\) #twin, \.stage:not\(\.sim\) \.simOnly \{ display: none !important; \}/.test(css));
  // Nothing else hides the caption, and it has its own place above the play bar.
  assert.ok(/#twinCaption \{ position: absolute;[^}]*bottom: 52px;/.test(css));
  assert.strictEqual((css.match(/#twinCaption/g) || []).length, 1);
  // These are the single figures the caption covers; if the picture gains another, this list must be looked at again.
  for (const label of ["Crops lost so far", "Crops saved so far", "Water saved from leaking", "Water leaked out of canals", "In this illustrative run, sealing early kept "]) assert.ok(twin.indexOf(label) >= 0, label);
  assert.strictEqual((twin.match(/money\(/g) || []).length, 4, "four dollar figures are drawn on the picture: crops lost, crops saved, and the closing line's crops kept and sealant bill");
  // The closing line reports this one run; it does not state a saving as a fact.
  assert.ok(twin.indexOf('"In this illustrative run, sealing early kept " + money(kept) + " of crops"') >= 0);
  assert.ok(!/Sealing early "? ?\+? ?\(?.{0,20}saves/.test(twin) && twin.indexOf("saves ") < 0, "no \"saves\" on the picture");
});

/* ---------- The Sources step: verdict words, the forecast's effect on the plan, labels ---------- */
test("a verdict word comes only from whether the interval excludes zero", () => {
  // lower is better (a cost): an interval wholly below zero puts the first-named ahead
  assert.deepStrictEqual(L.verdictFor({ lo: -745, hi: -237, lo2: -779, hi2: -214, lower: true }), { word: "ahead", note: "" });
  assert.strictEqual(L.verdictFor({ lo: 475, hi: 1539, lo2: 555, hi2: 1415, lower: true }).word, "behind");
  // higher is better (a share): the same intervals read the other way round
  assert.strictEqual(L.verdictFor({ lo: 0.001, hi: 0.046, lower: false }).word, "ahead");
  assert.strictEqual(L.verdictFor({ lo: -0.0049, hi: -0.0015, lower: false }).word, "behind");
  // zero inside the interval, or exactly on its edge, is a tie whatever the difference looks like
  assert.strictEqual(L.verdictFor({ diff: -1079, lo: -2211, hi: 23, lower: true }).word, "not separated");
  assert.strictEqual(L.verdictFor({ diff: 0.0185, lo: 0, hi: 0.0556, lower: false }).word, "not separated");
  assert.strictEqual(L.verdictFor({ lo: -0.5, hi: 0, lower: true }).word, "not separated");
  // two intervals that disagree are a tie, and the note says so (the 4-week alert against "D1 now")
  const split = L.verdictFor({ lo: -884, hi: 11.02, lo2: -723, hi2: -146, lower: true });
  assert.strictEqual(split.word, "not separated");
  assert.ok(/disagree/.test(split.note));
  const other = L.verdictFor({ lo: -5, hi: -1, lo2: -6, hi2: 1, lower: true });
  assert.strictEqual(other.word, "not separated");
  assert.ok(/disagree/.test(other.note));
  // no interval, no verdict
  assert.strictEqual(L.verdictFor({ diff: 3, lo: null, hi: null, lower: true }).word, "no interval");
  assert.strictEqual(L.verdictFor({ diff: 3 }).word, "no interval");
  // a row that does not say which direction is better: its own word is used only once zero is excluded
  assert.strictEqual(L.verdictFor({ lo: -1, hi: 2, stated: "ahead" }).word, "not separated");
  assert.strictEqual(L.verdictFor({ lo: 1, hi: 2, stated: "ahead" }).word, "ahead");
  assert.strictEqual(L.verdictFor({ lo: 1, hi: 2, stated: "behind" }).word, "behind");
  assert.strictEqual(L.verdictFor({ lo: 1, hi: 2, stated: "a clear win" }).word, "separated");
  assert.strictEqual(L.verdictFor({ lo: 1, hi: 2 }).word, "separated");
  // a file's own word never replaces the rule; where it differs it is quoted beside the verdict
  assert.deepStrictEqual(L.verdictFor({ lo: 0.234, hi: 0.775, lower: false, stated: "agrees" }), { word: "ahead", note: "the results file's own word is \"agrees\"" });
  assert.deepStrictEqual(L.verdictFor({ lo: -1, hi: 2, lower: true, stated: "a clear win" }), { word: "not separated", note: "the results file's own word is \"a clear win\"" });
  assert.deepStrictEqual(L.verdictFor({ lo: -819, hi: 1537, lower: true, stated: "not separated" }), { word: "not separated", note: "" });
});

test("numbers in the results tables: whole, two decimals or three figures, with a sign on a difference", () => {
  assert.strictEqual(L.sig(-19823), "-19,823");
  assert.strictEqual(L.sig(11.025), "11.03");
  assert.strictEqual(L.sig(-59), "-59");                                   // a whole number gets no decimals
  assert.strictEqual(L.sig(0.001111), "0.00111");
  assert.strictEqual(L.sig(0), "0");
  assert.strictEqual(L.sig(null), "n/a");
  assert.strictEqual(L.signed(0.0202), "+0.0202");
  assert.strictEqual(L.signed(-421), "-421");
  assert.strictEqual(L.signed(0), "0");
});

test("what the forecast changes is said plainly, including when it changes nothing", () => {
  // [km in both, km only with the forecast, km only without it, rank correlation, km ranked]
  assert.strictEqual(L.forecastEffectSentence([279.7, 101, 101, 0.775, 4808]),
    "With the forecast in the ranking, 101.0 km is funded that would not be without it, and 101.0 km that would be funded without it is not. " +
    "279.7 km is funded either way. The two orders have a rank correlation of 0.775 (1 would be the same order).");
  assert.strictEqual(L.forecastEffectSentence([15.6, 0, 0, 1, 55.2]),
    "The forecast changes nothing here: the same 15.6 km is funded with it and without it. The two orders are identical (rank correlation 1).");
  assert.strictEqual(L.forecastEffectSentence([0, 0, 0, 0.947, 62.7]),
    "Neither plan funds any canal here at this budget, so the forecast changes nothing here. The two orders have a rank correlation of 0.947 (1 would be the same order).");
  assert.ok(/too few canals/.test(L.forecastEffectSentence([1.2, 0, 0, null, 1.2])));
  assert.strictEqual(L.forecastEffectSentence(null), "No canal here can be ranked, so there is nothing to compare.");
});

test("the top leak class is worded as a modelled class, and the other classes keep their names", () => {
  assert.strictEqual(L.levelLabel("Inspect first"), "Leaky soil and forecast warning (modelled)");
  for (const level of ["Watch", "Low", "Unknown soil", "Drain"]) assert.strictEqual(L.levelLabel(level), level);
  assert.ok(/not a field-tested priority/.test(L.LEVEL_NOTE) && /highest modelled seepage class/.test(L.LEVEL_NOTE));
  // The page never prints the old words: every place a class is shown goes through levelLabel.
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  assert.ok(page.indexOf("Inspect first") < 0);
  assert.ok(page.indexOf("U.esc(levelLabel(c.level))") >= 0 && page.indexOf("U.esc(levelLabel(l))") >= 0);
});

test("the stress test says its forecast is drawn at random, and the benchmark carries its caveat", () => {
  assert.strictEqual(L.STRESS_TEST_SENTENCE, "In these random futures the forecast model is not run: whether a warning is given before each season is drawn at random, " +
    "using fixed rates for how often the forecast was right and how often it raised a false alarm in its test.");
  assert.strictEqual(L.BENCHMARK_CAVEAT, "The 44,000 acre-feet is a yearly figure: the source says the programme is \"expected to save close to 44,000 acre feet of water each year\"");
  assert.ok(L.safeUrl(L.BENCHMARK_SOURCE));
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  assert.ok(page.indexOf("U.esc(window.HGLogic.STRESS_TEST_SENTENCE)") >= 0);
  assert.ok(page.indexOf("U.esc(window.HGLogic.BENCHMARK_CAVEAT) + \" (\" + anchor(\"source\", window.HGLogic.BENCHMARK_SOURCE)") >= 0);
  // The engine really does draw the warning from the two rates (sim/engine.js).
  const engine = fs.readFileSync(path.join(__dirname, "..", "sim", "engine.js"), "utf8");
  assert.ok(engine.indexOf("warned[y] = library[from].dry ? rng() < opt.recall : rng() < opt.falseAlarm;") >= 0);
  close(L.perMillionGal(325851 / 1e6), 1);                                 // $1 per million gallons
  close(L.perMillionGal(74.5), 74.5 * 1e6 / E.GALLONS_PER_ACRE_FOOT);
});

test("the packed frozen summary agrees with the fixed sentences and holds no per-year lists", () => {
  const HG = realData().HG, fz = HG.frozen;
  // the held-out sentence's three figures are the frozen file's own
  assert.strictEqual(fz.seepage.n, 14);
  assert.strictEqual((fz.seepage.models.M1.medianError * 100).toFixed(1), "32.7");
  assert.strictEqual((fz.seepage.models.length.medianError * 100).toFixed(1), "36.5");
  assert.strictEqual(fz.seepage.passes, false);
  assert.strictEqual(L.verdictFor({ lo: fz.seepage.gaps.length_minus_M1.lo, hi: fz.seepage.gaps.length_minus_M1.hi, lower: false }).word, "not separated");
  // every comparison is a short list of eight plain values: no per-year numbers travel to the page
  const rows = [].concat.apply([], fz.groups.map((g) => g.rows));
  assert.ok(rows.length >= 20);
  rows.forEach((r) => { assert.strictEqual(r.length, 8); r.forEach((v) => assert.ok(v === null || typeof v !== "object")); });
  // the two results the decision log spells out, read straight from the packed rows
  const find = (name) => { const a = rows.find((r) => r[0] === name); return { lo: a[2], hi: a[3], lo2: a[4], hi2: a[5], lower: a[7] }; };
  assert.strictEqual(L.verdictFor(find("6-month system cost minus D1 now")).word, "not separated");
  assert.strictEqual(L.verdictFor(find("4-week system cost minus D1 now")).word, "not separated");     // its two intervals disagree
  assert.strictEqual(L.verdictFor(find("4-week system cost minus Persistence")).word, "ahead");
  const avg = fz.allocation.average;
  assert.strictEqual(L.verdictFor({ lo: avg.vsA.lo, hi: avg.vsA.hi, lower: false }).word, "not separated");
  assert.strictEqual(L.verdictFor({ lo: avg.vsB.lo, hi: avg.vsB.hi, lower: false }).word, "ahead");
  assert.strictEqual(avg.vsB.yearsBetter, 4);
  // what the forecast changes: one row for all districts and one per district
  assert.strictEqual(HG.forecastEffect.districts.length, HG.districts.length);
  assert.strictEqual(HG.forecastEffect.overall.length, 5);
  // the site still carries no calibration for the simulation
  assert.strictEqual(HG.calibration, undefined);
});

/* ---------- Found in the code audit ---------- */
test("money and gal change unit where the rounded figure would reach 1,000: no \"$1000k\" and no \"1,000 million gal\"", () => {
  assert.strictEqual(L.money(999499), "$999k");
  assert.strictEqual(L.money(999500), "$1.0M");
  assert.strictEqual(L.money(999999), "$1.0M");
  assert.strictEqual(L.money(-999600), "-$1.0M");
  assert.strictEqual(L.money(999.4e6), "$999M");
  assert.strictEqual(L.money(999.5e6), "$1.00B");
  const af = (gallons) => gallons / E.GALLONS_PER_ACRE_FOOT;
  assert.strictEqual(L.gal(af(999.4e6)), "999 million gal");
  assert.strictEqual(L.gal(af(999.6e6)), "1.0 billion gal");
  assert.strictEqual(L.gal(af(999.9e6), true), "1.0 billion gallons");
});

test("planFor and canalNumbers price canals at the width they are given, and at the pipeline's width when given none", () => {
  const data = fake(), { planFor, canalNumbers } = logic(data);           // the pipeline's width here is 10 ft
  const narrow = planFor(data.canals, 1e9, null), wide = planFor(data.canals, 1e9, null, 20);
  close(narrow.costEvery, 7.5 * USD_PER_KM);                               // the engine's bill for all 7.5 km
  close(wide.costEvery, 2 * 7.5 * USD_PER_KM);                             // twice the width, twice the sealant
  close(wide.spent, 2 * narrow.spent); close(wide.sqft, 2 * narrow.sqft); close(wide.savedLow, 2 * narrow.savedLow);
  assert.strictEqual(wide.costAll, narrow.costAll);                        // the pipeline's own figure does not move
  // The bug: a budget that funds every canal at 10 ft does not fund them all at 20 ft.
  assert.strictEqual(planFor(data.canals, narrow.costEvery, null, 10).funded.length, 4);
  assert.ok(planFor(data.canals, narrow.costEvery, null, 20).funded.length < 4);
  assert.strictEqual(planFor(data.canals, wide.costEvery, null, 20).funded.length, 4);
  const P = { kmPerCrewDay: 4, crews: 2 }, one = canalNumbers([{ km: 2, rate: 5 }], P), two = canalNumbers([{ km: 2, rate: 5 }], Object.assign({ widthFt: 20 }, P));
  close(two.usd, 2 * one.usd); close(two.afLow, 2 * one.afLow); close(two.days, one.days);
  // The plan's bill and the engine's bill are the same number at every width on the slider.
  for (const widthFt of [10, 20, 33, 40]) {
    const engine = E.fundCanals(planFor(data.canals, 0, null).ordered, Infinity, E.makeParams({ widthFt, usdPerSqft: 0.01 })).spent;
    close(planFor(data.canals, 0, null, widthFt).costEvery, engine);
  }
});

test("budgetScale: the slider's top is the cost of everything rounded UP to a whole step, so \"fund everything\" can be reached", () => {
  assert.deepStrictEqual(L.budgetScale(2460.63), { step: 100, max: 2500 });
  assert.deepStrictEqual(L.budgetScale(20000.5), { step: 500, max: 20500 });
  assert.deepStrictEqual(L.budgetScale(1261948.33), { step: 5000, max: 1265000 });
  assert.deepStrictEqual(L.budgetScale(500), { step: 100, max: 500 });      // already a whole step
  assert.deepStrictEqual(L.budgetScale(0), { step: 100, max: 100 });
  // On the real canals, at every width on the slider, the top of the slider funds every rankable canal.
  const data = realData(), lg = L.makeLogic(data), inDistricts = data.canals.filter((c) => c.district >= 0);
  const rankable = inDistricts.filter((c) => c.rank != null).length;
  for (const widthFt of [10, 20, 21, 30, 40]) {
    const scale = L.budgetScale(lg.planFor(inDistricts, 0, null, widthFt).costEvery);
    assert.strictEqual(scale.max % scale.step, 0);
    assert.strictEqual(lg.planFor(inDistricts, scale.max, null, widthFt).funded.length, rankable, widthFt + " ft");
  }
  // The old ceiling (the pipeline's 20 ft cost) does not fund them all at 30 ft.
  assert.ok(lg.planFor(inDistricts, lg.planFor(inDistricts, 0, null).costAll, null, 30).funded.length < rankable);
});

test("simScope: several counties are weighted by the ranked canal km in each, with the plain mean when there is none", () => {
  // District X sits in counties A and B. Put 1 km of its ranked canal in A and 2 km in B.
  const data = fake();
  data.canals[3].fips = "A"; data.canals[0].fips = "B"; data.canals[1].fips = "A";   // the drain has no rank and must not count
  const s = logic(data).simScope([data.X]), fc = s.weeks.map((w) => w.forecast);
  close(fc[1], 0.1);                                                       // 7 Jan: only A has a forecast
  close(fc[2], (0.1 * 1 + 0.3 * 2) / 3);                                   // 14 Jan: A 0.1, B 0.3
  close(fc[3], (0.5 * 1 + 0.3 * 2) / 3);                                   // 21 Jan: A 0.5, B 0.3
  // Drought class, A "012345" and B "1.4.0.": week 0 (0 x 1 + 1 x 2) / 3 = 0.67, rounds to 1; week 2 (2 + 8) / 3 = 3.33, rounds to 3;
  // week 4 (4 x 1 + 0 x 2) / 3 = 1.33, rounds to 1 (the plain mean, 2, was the old answer).
  assert.deepStrictEqual(s.weeks.map((w) => w.cls), [1, 1, 3, 3, 1, 5]);
  // No ranked canal km in either county (the made-up canals carry no county): the plain mean, as before.
  const plain = logic(fake()).simScope([fake().X]);
  close(plain.weeks[2].forecast, 0.2);
  assert.deepStrictEqual(plain.weeks.map((w) => w.cls), [1, 1, 3, 3, 2, 5]);
  // All the km in one county: the other county's readings do not move the answer.
  const oneSided = fake(); oneSided.canals[3].fips = "A"; oneSided.canals[0].fips = "A";
  close(logic(oneSided).simScope([oneSided.X]).weeks[3].forecast, 0.5);
});

test("the note for Elephant Butte districts is fixed wording and is shown in the district list, on the result headline and on the risk profile", () => {
  assert.strictEqual(L.EXTRAPOLATED_NOTE, "extrapolated: Valley water rules and crop values applied to another reservoir");
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  const body = (name) => { const a = page.indexOf("function " + name + "("); assert.ok(a >= 0, name); return page.slice(a, page.indexOf("\n  }\n", a)); };
  assert.ok(body("renderPickRows").indexOf("window.HGLogic.EXTRAPOLATED_NOTE") >= 0);
  assert.ok(body("simHeadHtml").indexOf("extrapolatedNote(") >= 0);
  assert.ok(body("renderRisk").indexOf("extrapolatedNote(d)") >= 0);
  assert.ok(page.indexOf("const extrapolatedNote = (d) => (d && usesElephantButte(d) ?") >= 0);   // only for those districts
});

test("stepFromQuery accepts only a step the page knows; anything else gives the fallback", () => {
  const steps = ["risk", "budget", "sim", "sources"];
  assert.strictEqual(L.stepFromQuery("?step=sim", steps, "risk"), "sim");
  assert.strictEqual(L.stepFromQuery("?noscan&step=sources", steps, "risk"), "sources");
  assert.strictEqual(L.stepFromQuery("?step=budget&noscan", steps, "risk"), "budget");
  for (const bad of ["", "?noscan", "?step=", "?step=simulation", "?step=Sim", "?step=constructor", "?step=toString", "?mystep=sim", "?step=sim%20", null, undefined]) {
    assert.strictEqual(L.stepFromQuery(bad, steps, "risk"), "risk", String(bad));
  }
  // The page hands it its own list of steps and never calls a step it does not have.
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  assert.ok(page.indexOf("state.step = window.HGLogic.stepFromQuery(location.search, Object.keys(STEPS), state.step);") >= 0);
  assert.ok(page.indexOf("const STEPS = { risk: renderRisk, budget: renderBudget, sim: renderSim, sources: renderSources };") >= 0);
});

test("leakAcreFeet counts the leak the way the engine counts the water kept, so leaked and saved add up", () => {
  const data = replayFake(), scope = logic(data).replayScope([data.X]), central = E.centralPhysics();
  const gallonsPerDay = E.fundCanals(scope.canals, Infinity, E.makeParams()).gallonsPerDay;
  const run = E.simulate(Object.assign({}, scope, { physics: central }), { trigger: "always" }, { budget: 1e9 });
  const sealedWeek = run.years[0].weekly.find((w) => w.sealed && w.saved > 0);
  const leak = L.leakAcreFeet(gallonsPerDay, 7, central);
  close(sealedWeek.saved, leak * central.cut);                             // saved = the leak x the share the sealant stops
  assert.ok(sealedWeek.saved < leak);                                      // so what still leaks is never below zero
  // The old counter took every canal as unlined; the middle physics takes about a third as lined.
  close(L.leakAcreFeet(gallonsPerDay, 7, null), E.savedAcreFeet(gallonsPerDay, 7, 1));
  close(leak, E.savedAcreFeet(gallonsPerDay, 7, 1) * central.widthMult * (1 - central.linedShare));
  close(L.leakAcreFeet(1000, 7, { calibrated: true, seepMult: 0.7, widthMult: 1.4, linedShare: 0.5 }), E.savedAcreFeet(700, 7, 1));
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  assert.ok(page.indexOf("window.HGLogic.leakAcreFeet(E.fundCanals(scope.canals, Infinity, P).gallonsPerDay, 7, E.centralPhysics(L.physicsOptions()))") >= 0);
});

test("wording found in the audit: the home page's leak, the sealant rounds, the what-if buttons, the counties over the warning line", () => {
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8"), home = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  // The leak figure covers every district's canals (El Paso to Brownsville), so it is not tied to the two reservoirs of the beat before.
  const block = home.slice(home.indexOf('id="nGal"'), home.indexOf("</section>", home.indexOf('id="nGal"')));
  assert.ok(block.indexOf("from Texas Rio Grande irrigation canals, El Paso to Brownsville.") >= 0);
  assert.ok(block.indexOf("that water") < 0);
  // Three rounds do not cover the season (February is never sealed), and the page no longer says they do.
  assert.ok(!/cover (a|the) season/.test(page));
  assert.ok(page.indexOf('" days each; up to " + P.applications') >= 0 && page.indexOf('" from March"') >= 0);
  // 25%, 50% and 80% gave one and the same plan, so there is one what-if left.
  assert.ok(!/Moderate \(25%\)|Severe \(50%\)|Extreme \(80%\)/.test(page));
  const data = fake(), { planFor } = logic(data);
  assert.deepStrictEqual(names(planFor(data.canals, 1200, 0.25).funded), names(planFor(data.canals, 1200, 1).funded));
  // Counties over the warning line are counted from the pipeline's own label.
  assert.ok(page.indexOf('HG.river.filter((c) => c.tier === "Warning").length') >= 0);
  assert.ok(page.indexOf("c.pSeason >= HG.threshold") < 0);
  realData().HG.river.forEach((c) => assert.ok(L.TIER_CLASSES.indexOf(c.tier) >= 0, c.fips));
});

/* ---------- The three-month forecast ---------- */
const QUARTER_TEST = { forecasts: 148995, counties: 693, auc: 0.957, shareRight: 0.895, shareRightRule: 0.903, missed: 3938, missedRule: 5270,
  falseAlarms: 11769, falseAlarmsRule: 9145, cost: 23583, costRule: 24955, costGap: -1372, costGapLow: -2386, costGapHigh: -420, costChange: -0.055, years: 18 };

test("quarterScorecard: numbers first, and it says the three-month forecast wins on cost, not on share right", () => {
  const rows = L.quarterScorecard(QUARTER_TEST, { diff: -58, lo: -276, hi: 171 });
  assert.deepStrictEqual(rows, [
    { label: "3 months ahead", text: "beats the best simple rule on cost, not on share right. Cost 5.5% lower on 693 unseen counties (interval -2,386 to -420). " +
      "Missed 3,938 drought seasons vs 5,270; false alarms 11,769 vs 9,145; share right 89.5% vs 90.3%." },
    { label: "6 months ahead", text: "ties the best simple rule on cost (gap -58, interval -276 to +171)." },
  ]);
  assert.ok(rows.map((r) => r.label + " " + r.text).join(" ").split(/\s+/).length <= 60, "about 60 words at most");
});

const EAST_TEST = { forecasts: 358190, counties: 1666, costGap: 2646, costGapLow: 1206, costGapHigh: 4286, costChange: 0.086, years: 18, yearsCheaper: 1 };

test("quarterScorecard: an eastern loss is worded as a loss, from the interval", () => {
  const rows = L.quarterScorecard(null, null, EAST_TEST);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].label, "3 months ahead, East");
  assert.strictEqual(rows[0].text, "loses to the best simple rule on cost at 3 to 1, on 1,666 eastern counties scored once " +
    "(cost 8.6% higher, interval +1,206 to +4,286; cheaper in 1 of 18 years). The edge is a western result.");
  assert.match(rows[0].text, /^loses to the best simple rule/);
  assert.ok(!/beats/.test(rows[0].text));
});

test("quarterScorecard: an eastern tie or win is worded from the interval too", () => {
  assert.match(L.quarterScorecard(null, null, { ...EAST_TEST, costGapLow: -300, costGapHigh: 500 })[0].text, /^ties the best simple rule/);
  assert.match(L.quarterScorecard(null, null, { ...EAST_TEST, costGapLow: -900, costGapHigh: -100, costChange: -0.03 })[0].text, /^beats the best simple rule/);
  assert.deepStrictEqual(L.quarterScorecard(QUARTER_TEST, null, null).map((r) => r.label), ["3 months ahead"]);
});

test("quarterScorecard: the word comes from the interval, and missing data gives no row", () => {
  assert.deepStrictEqual(L.quarterScorecard(null, null), []);
  assert.deepStrictEqual(L.quarterScorecard(undefined, undefined), []);
  assert.deepStrictEqual(L.quarterScorecard(null, { diff: -58, lo: -276, hi: 171 }).map((r) => r.label), ["6 months ahead"]);
  assert.deepStrictEqual(L.quarterScorecard(QUARTER_TEST, null).map((r) => r.label), ["3 months ahead"]);
  // An interval that reaches zero is a tie, whatever the gap looks like.
  const tie = L.quarterScorecard(Object.assign({}, QUARTER_TEST, { costGapHigh: 0 }), null)[0].text;
  assert.ok(tie.indexOf("ties the best simple rule on cost. ") === 0 && tie.indexOf("beats") < 0, tie);
  // An interval wholly above zero: the forecast cost more.
  const worse = L.quarterScorecard(Object.assign({}, QUARTER_TEST, { costGapLow: 100, costGapHigh: 900, costChange: 0.02 }), null)[0].text;
  assert.ok(worse.indexOf("loses to the best simple rule on cost. Cost 2.0% higher") === 0, worse);
  // If its share right were the higher one, the words "not on share right" would be untrue and are left out.
  const both = L.quarterScorecard(Object.assign({}, QUARTER_TEST, { shareRight: 0.91 }), null)[0].text;
  assert.ok(both.indexOf("beats the best simple rule on cost. ") === 0, both);
  assert.strictEqual(L.quarterScorecard(null, { diff: -900, lo: -1500, hi: -200 })[0].text, "beats the best simple rule on cost (gap -900, interval -1,500 to -200).");
});

test("real data: the scorecard reads the packed three-month test and the six-month row, and the pages take their figures from the data", () => {
  const HG = realData().HG, t = HG.quarter.test;
  const season = HG.frozen.groups.find((g) => g.section === "season"), row = season.rows.find((r) => r[0] === "6-month system cost minus D1 now");
  const rows = L.quarterScorecard(t, { diff: row[1], lo: row[2], hi: row[3] });
  assert.strictEqual(rows.length, 2);
  for (const figure of [L.num(t.counties), L.num(t.missed), L.num(t.missedRule), L.num(t.falseAlarms), L.num(t.falseAlarmsRule), L.signed(t.costGapLow), L.signed(t.costGapHigh)]) {
    assert.ok(rows[0].text.indexOf(figure) >= 0, figure);
  }
  assert.ok(rows[0].text.indexOf("beats the best simple rule on cost, not on share right.") === 0);   // today's result
  assert.ok(rows[1].text.indexOf("ties ") === 0);
  // None of the test's figures is typed into the pages.
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8"), landing = fs.readFileSync(path.join(__dirname, "landing.js"), "utf8");
  for (const typed of ["693", "3,938", "5,270", "11,769", "9,145", "89.5", "90.3", "2,386"]) assert.ok(page.indexOf(typed) < 0 && landing.indexOf(typed) < 0, typed);
  const body = page.slice(page.indexOf("function renderSources("));
  assert.ok(body.indexOf('"<h3>How far to trust this</h3>" +\n      scorecardHtml() +\n      heldOutNote()') >= 0, "the scorecard opens the section");
  assert.ok(landing.indexOf("q && q.costGapHigh < 0") >= 0, "the home page says \"beat\" only if the interval is wholly below zero");
});

test("quarterChance: the plain mean of the counties that have a three-month chance, and null when there is none", () => {
  const data = fake();
  assert.strictEqual(logic(data).quarterChance(["A", "B"]), null);         // no HG.quarter: the page renders as before
  data.HG.quarter = { chance: { A: 0.2, B: 0.4 } };
  const { quarterChance } = logic(data);
  close(quarterChance(["A", "B"]), 0.3);
  close(quarterChance(["A", "C"]), 0.2);                                   // county C has none
  assert.strictEqual(quarterChance(["C"]), null);
  assert.strictEqual(quarterChance([]), null);
  data.HG.quarter = {};
  assert.strictEqual(logic(data).quarterChance(["A"]), null);
  const real = realData();
  real.HG.districts.forEach((d) => { const p = L.makeLogic(real).quarterChance(d.fips); assert.ok(p != null && p >= 0 && p <= 1, d.name); });
});

/* ---------- The researcher export ---------- */
test("csvTable: a header line, then one line per row; numbers bare, yes/no, empty for null, text quoted and kept from formulas", () => {
  const text = L.csvTable({ columns: ["a", "b", "c", "d"], rows: [[1.5, true, null, "=SUM(A1)"], [0, false, undefined, 'say "hi"']] });
  assert.strictEqual(text, 'a,b,c,d\n1.5,yes,,"\'=SUM(A1)"\n0,no,,"say ""hi"""\n');
  assert.deepStrictEqual(L.tableObjects({ columns: ["a", "b"], rows: [[1, undefined]] }), [{ a: 1, b: null }]);
});

test("researchExport: districts, canals and the plan come from the same data and the same rule as the page", () => {
  const data = fake();
  data.HG.week = "2026-11-10";
  data.HG.quarter = { chance: { A: 0.2, B: 0.4 } };
  data.HG.river = [{ fips: "A", name: "County A", pSeason: 0.6, tier: "Warning", weeks: 10, weeksLow: 2, weeksHigh: 20, reservoir: "Amistad-Falcon", reservoirPct: 40 }];
  data.HG.texas = [{ fips: "A", name: "County A", dm: 2 }, { fips: "C", name: "County C", dm: 0 }];
  data.HG.dmLabels = ["None", "D0", "D1"];
  data.canals[0].line = [[-97.1, 26.1], [-97.2, 26.2]];
  const lg = logic(data), params = { widthFt: 10, kmPerCrewDay: 5, crews: 1 };
  const plan = lg.planFor(data.canals, 1000, null);
  const out = lg.researchExport(plan, params, { scope: "State of Texas", budget: 1000, severity: null });
  const T = out.tables, col = (t, name) => t.columns.indexOf(name);
  // Drought: every county once, sorted; the 3-month chance even where there is no 6-month one.
  assert.deepStrictEqual(T.drought.rows.map((r) => r[0]), ["A", "B", "C"]);
  const a = T.drought.rows[0];
  assert.strictEqual(a[col(T.drought, "drought_now")], "D1");
  assert.strictEqual(lg.researchExport(null, params, {}).tables.drought.rows.length, 3);
  assert.strictEqual(a[col(T.drought, "chance_drought_season_6_months")], 0.6);
  assert.strictEqual(T.drought.rows[1][col(T.drought, "chance_drought_season_3_months")], 0.4);
  assert.strictEqual(T.drought.rows[2][col(T.drought, "chance_drought_season_6_months")], null);
  // Districts: one row each, with quarterChance's figure.
  assert.strictEqual(T.districts.rows.length, 3);
  close(T.districts.rows[0][col(T.districts, "chance_drought_season_3_months")], 0.3);
  // Canals: every segment, the line as WKT, unranked ones kept.
  assert.strictEqual(T.canals.rows.length, data.canals.length);
  assert.strictEqual(T.canals.rows[0][col(T.canals, "geometry_wkt")], "LINESTRING(-97.1 26.1, -97.2 26.2)");
  assert.strictEqual(T.canals.rows[1][col(T.canals, "sealing_rank")], null);
  // Plan: the rankable canals in planFor's order; funded matches planFor; costs are canalNumbers'.
  assert.deepStrictEqual(T.plan.rows.map((r) => r[col(T.plan, "canal")]), names(plan.ordered));
  assert.deepStrictEqual(T.plan.rows.filter((r) => r[col(T.plan, "funded")]).map((r) => r[col(T.plan, "canal")]), names(plan.funded));
  close(T.plan.rows[0][col(T.plan, "sealant_usd")], Math.round(lg.canalNumbers([plan.ordered[0]], params).usd * 1e4) / 1e4);
  assert.strictEqual(T.plan.rows[0][col(T.plan, "plan_drought_chance")], "forecast");
  assert.strictEqual(out.about.dataWeek, "2026-11-10");
  assert.strictEqual(lg.researchExport(null, params, {}).tables.plan, null);   // no rankable canal: no plan table
});

test("real data: the export has every county with a forecast, every district and every canal, and its CSVs parse", () => {
  const data = realData(), lg = L.makeLogic(data);
  const out = lg.researchExport(lg.planFor(data.canals.filter((c) => c.district >= 0), 1e9, null), { widthFt: 20, kmPerCrewDay: 5, crews: 1 }, {});
  assert.strictEqual(out.tables.districts.rows.length, data.HG.districts.length);
  assert.strictEqual(out.tables.canals.rows.length, data.HG.canals.length);
  for (const f of Object.keys(data.HG.quarter.chance)) assert.ok(out.tables.drought.rows.some((r) => r[0] === f), f);
  assert.ok(out.tables.drought.rows.every((r) => r[1] != null), "every county has its state");
  for (const t of Object.values(out.tables)) {
    const lines = L.csvTable(t).trim().split("\n");
    assert.strictEqual(lines.length, t.rows.length + 1);
  }
  assert.doesNotThrow(() => JSON.stringify(out));
});

test("the home page words the canal figures and the six-month forecast no more strongly than the tests show", () => {
  const landing = fs.readFileSync(path.join(__dirname, "landing.js"), "utf8");
  assert.ok(landing.indexOf("a cost, a crew time and a modelled upper estimate of the water kept.") >= 0);
  assert.ok(landing.indexOf("The six-month forecast matched the simple rule and did not beat it:") >= 0);
  // The old wording is kept out by CI's banned-phrase step (.github/workflows/ci.yml), which searches this folder too.
});

/* ---------- The 90-day decision (round 8, A1) ---------- */
test("ninetyDay: the three-month chance against the declared line, and null without either", () => {
  const data = fake();
  assert.strictEqual(logic(data).ninetyDay(["A"]), null);
  data.HG.quarter = { chance: { A: 0.2, B: 0.4 }, test: { line: 0.25 } };
  const n = logic(data).ninetyDay(["A", "B"]);
  close(n.p, 0.3); assert.strictEqual(n.line, 0.25); assert.strictEqual(n.seal, true);
  assert.strictEqual(logic(data).ninetyDay(["A"]).seal, false);
  assert.strictEqual(logic(data).ninetyDay(["C"]), null);
});

test("ninetyDaySentence: pinned wording, and every number in it is read from the data", () => {
  const t = { counties: 693, costChange: -0.055, missWeight: 3, breakEven: 2 }, east = { counties: 1666, costGapLow: 1206 };
  assert.strictEqual(L.ninetyDaySentence(t, east),
    "This three-month forecast was tested blind on 693 western counties and cost 5.5% less than the best simple rule (\"severe drought now\") when a missed drought season counts as 3 false alarms. " +
    "It is no cheaper than that rule when a miss counts as about 2.0 false alarms or fewer. A map-only version of it lost its blind test on 1,666 eastern counties. " +
    "The Rio Grande counties were used to design it, so they are not part of that test.");
  // Change each number in the data and the sentence follows it.
  const other = L.ninetyDaySentence({ counties: 700, costChange: -0.061, missWeight: 4, breakEven: 2.4 }, { counties: 1700, costGapLow: 1 });
  for (const figure of ["700 western", "6.1% less", "counts as 4 false", "about 2.4 false", "1,700 eastern"]) assert.ok(other.indexOf(figure) >= 0, figure);
  assert.ok(L.ninetyDaySentence(t, { counties: 1666, costGapLow: -5 }).indexOf("eastern") < 0, "the east sentence only when it was a loss");
  assert.strictEqual(L.ninetyDaySentence(null), null);
  assert.strictEqual(L.NINETY_DAY_COST_NOTE, "If sealant is cheap next to the water it saves, sealing every round can be the cheapest choice; " +
    "the forecast matters most when the budget does not cover every canal.");
  // The real build carries every number, and the page types none of them.
  const real = realData().HG.quarter;
  assert.strictEqual(real.test.line, 0.25);
  assert.ok(L.ninetyDaySentence(real.test, real.east).indexOf(" western counties and cost ") > 0);
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  assert.ok(page.indexOf("ninetyDayHtml(d) + rows") >= 0, "the decision is on the budget step");
  assert.ok(page.indexOf("U.esc(sentence)") >= 0 && page.indexOf("U.esc(window.HGLogic.NINETY_DAY_COST_NOTE)") >= 0);
  for (const typed of ["5.5%", "1,666", "693 western"]) assert.ok(page.indexOf(typed) < 0, typed);
});

/* ---------- Leak volumes at measured scale (round 8, A3) ---------- */
test("measured scale: the model's volume times the frozen factor, with its label and sentence", () => {
  const scale = { factor: 0.425, tests: 15 };
  assert.deepStrictEqual(L.scaledAf({ afLow: 100, afHigh: 200 }, scale), { afLow: 42.5, afHigh: 85 });
  assert.strictEqual(L.measuredScaleLabel(scale), "Scaled to 15 measured canals (x0.425)");
  assert.strictEqual(L.measuredScaleSentence(scale), "Water figures here are the leak model's upper estimates. In 15 measured unlined canals the measured rate was a median 0.425 times the model's rate (round 4), " +
    "so at measured scale each water figure would be about 0.425 times as large. Crop loss and saving would shrink with it.");
  assert.ok(L.measuredScaleLabel({ factor: 0.5, tests: 9 }).indexOf("9 measured canals (x0.5)") > 0, "both numbers come from the data");
  const real = realData().HG.leakScale;
  assert.strictEqual(real.factor, 0.425); assert.strictEqual(real.tests, 15);
  assert.strictEqual(real.source, "reports/frozen/round3/ponding.json");
});

test("no leak volume without its measured-scale partner on the platform", () => {
  const page = fs.readFileSync(path.join(__dirname, "platform.js"), "utf8");
  // Table cells use the paired forms only.
  assert.ok(!/af\((g\.n|n|r\.n)\) \+ "<\/td>|afMid\((n|r\.n)\) \+ "<\/td>/.test(page), "a bare volume in a table cell");
  assert.ok(page.indexOf("afPair(g.n)") >= 0 && page.indexOf("afMidPair(n)") >= 0 && page.indexOf("afMidPair(r.n)") >= 0);
  // The big figure, the map tip and the simulation each carry the partner.
  const triple = page.slice(page.indexOf("function triple("), page.indexOf("function gauge("));
  assert.ok(triple.indexOf("measuredScaleLabel(SCALE)") >= 0 && triple.indexOf("af(scaled(n))") >= 0);
  assert.ok(page.indexOf('"<dt>Measured scale</dt><dd>about " + af(scaled(n))') >= 0);
  assert.ok(page.indexOf("U.esc(window.HGLogic.measuredScaleSentence(SCALE))") >= 0);
  // Every other use of af( or afMid( is inside one of those (the two definitions and the pairs).
  const uses = page.split("\n").filter((line) => /[^A-Za-z](af|afMid)\(/.test(line) && !/afPair|afMidPair|scaled\(n\)|const af =|const afMid =/.test(line));
  assert.deepStrictEqual(uses.map((l) => l.trim().slice(0, 40)), [
    "'<div class=\"save\"><dt>Water kept</dt><d",
    "return \"<b>\" + U.esc(c.name) + \"</b><dl>",
  ]);
  for (const typed of ["0.425", "0.43"]) assert.ok(page.indexOf(typed) < 0, typed);
});
