/*
  logic.js: the site's arithmetic and wording rules, with no page code. It never touches the
  document, so it runs in the browser (as window.HGLogic) and in Node (for logic.test.js).

  TWO KINDS OF FUNCTION
    Plain ones need nothing but their arguments: esc, usd, num, pct, niceDate, workTime, gal,
    money, usesElephantButte, and the guards safeUrl, safeDecode, cssClass, finiteOrNull, percentOrNull, csvText, csvNumber.
    For the Sources step: sig, signed, verdictFor, forecastEffectSentence, levelLabel, perMillionGal.
    For the Simulation step: band, rangeText, rangeCell, rangeHeadline, replayBands and the fixed sentences.

    Bound ones read the generated data (window.HG and window.HG_SIM in the browser). They come
    from makeLogic(data), so a test can hand in a small made-up data object instead:
      tierFor, actionFor, planFor, canalNumbers, scopeP, simScope, replayScope, hitRates, USD_PER_AF.

  WHO USES IT
    js/common.js calls makeLogic once with the real data and republishes the functions under
    their old names on window.HGU. js/platform.js reads the rest from window.HGU.logic.
    sim/engine.js must be loaded first (the budget rule and the unit constants live there).
*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../sim/engine.js"));
  else root.HGLogic = factory(root.HGEngine);
})(typeof self !== "undefined" ? self : this, function (ENGINE) {
  "use strict";

  /* ---------- Formatting ---------- */
  const usd = (x) => {
    if (x == null || isNaN(x)) return "n/a";
    const a = Math.abs(x), sign = x < 0 ? "-" : "";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(2) + " billion";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + " million";
    return sign + "$" + Math.round(a).toLocaleString("en-US");
  };
  const num = (x, digits) => (x == null || isNaN(x)) ? "n/a"
    : Number(x).toLocaleString("en-US", { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
  const pct = (p) => (p == null ? "n/a" : Math.round(p * 100) + "%");
  const niceDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  /* Makes text safe to put inside HTML and inside a quoted attribute: & < > and both quotes. */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Guards for values that come from data and end up in the page or in a file ---------- */
  /* A web address is used as a link only if it is a string starting with https:// or http://.
     Anything else (javascript:, data:, a relative path, not a string) gives null: show no link. */
  const safeUrl = (url) => (typeof url === "string" && /^https?:\/\//.test(url) ? url : null);
  /* The part of a link after "#", decoded. A malformed percent sequence (say "%E0%A4%A" or a
     lone "%") makes the browser's decoder throw; then the text is returned as it came. */
  const safeDecode = (text) => {
    const raw = String(text == null ? "" : text);
    try { return decodeURIComponent(raw); } catch (error) { return raw; }
  };
  /* A value used as a CSS class must be one of the names we know. Anything else gives "". */
  const cssClass = (value, allowed) => (typeof value === "string" && allowed.indexOf(value) >= 0 ? value : "");
  const TIER_CLASSES = ["Low", "Watch", "Warning"];                 // .chip.Low, .chip.Watch, .chip.Warning in css/site.css
  const SEVERITY_CLASSES = ["Critical", "Important", "Context"];    // the issue list's severities
  /* A reading that should be a number: the number itself, or null if it is anything else. */
  const finiteOrNull = (x) => (typeof x === "number" && isFinite(x) ? x : null);
  /* A reading that should be a percentage: a real number from 0 to 100 inclusive, or null. */
  const percentOrNull = (x) => (typeof x === "number" && x >= 0 && x <= 100 ? x : null);
  /*
    One field of a CSV file.
    csvText: always in double quotes, with any double quote inside doubled. A field that starts
    with = + - @, a tab or a carriage return gets a single quote in front, so a spreadsheet shows
    it as text and does not run it as a formula.
    csvNumber: a real, finite number written bare (with a fixed number of decimals if asked);
    anything else is left empty.
  */
  const csvText = (value) => {
    const text = String(value == null ? "" : value);
    return '"' + (/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""') + '"';
  };
  const csvNumber = (value, digits) => (typeof value === "number" && isFinite(value) ? (digits == null ? String(value) : value.toFixed(digits)) : "");

  /* "3 hours", "2 days", "6 weeks": a length of working time (8-hour days, 5-day weeks) in plain words. */
  function workTime(days) {
    if (days < 1) return Math.max(1, Math.round(days * 8)) + (Math.round(days * 8) <= 1 ? " hour" : " hours");
    if (days < 15) return (days < 3 ? days.toFixed(1) : Math.round(days)) + " days";
    return Math.round(days / 5) + " weeks";
  }

  /* Water is shown in gallons, which people can picture. The engine works in acre-feet
     (the unit water agencies use: 1 acre-foot = 325,851 gallons), so it is converted here. */
  function gal(acreFeet, long) {
    const g = acreFeet * ENGINE.GALLONS_PER_ACRE_FOOT, unit = long ? " gallons" : " gal";
    return g >= 1e9 ? (g / 1e9).toFixed(g >= 1e10 ? 0 : 1) + " billion" + unit : g >= 1e6 ? num(g / 1e6, g < 1e7 ? 1 : 0) + " million" + unit : num(g) + unit;
  }
  /* Short money for tables and charts: "$1.26M", "$12k", "$950". */
  const money = (v) => (v < 0 ? "-" + money(-v) : v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? "$" + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + "M" : v >= 1e4 ? "$" + Math.round(v / 1e3) + "k" : "$" + num(v));

  const ELEPHANT_BUTTE = ["48141", "48229"];           // El Paso and Hudspeth draw on Elephant Butte
  const usesElephantButte = (d) => d.fips.length > 0 && d.fips.every((f) => ELEPHANT_BUTTE.indexOf(f) >= 0);

  /* ---------- The replay: real years, five policies ---------- */
  const MIN_WEEKS_IN_A_YEAR = 50;
  /* The five policies of the replay, in the order the table shows them. The engine (sim/engine.js)
     holds what each trigger does; nothing about them is decided here. */
  const REPLAY_POLICIES = [
    { trigger: "never", name: "Do nothing" },
    { trigger: "declared", name: "Wait for an official drought declaration" },
    { trigger: "d1", name: "Seal if already in moderate drought (D1)" },
    { trigger: "forecast", name: "Seal when the forecast warns" },
    { trigger: "always", name: "Seal every year" },
  ];
  /*
    Run a scope's weeks through the five policies. scope comes from replayScope(); overrides are
    the simulation's assumptions (budget, sealant effect, ...). Every figure is the engine's own:
    a row's totals are the sums of the engine's per-year results, which are kept in perYear.
    saving = what doing nothing costs in all (lost crops) minus what this policy costs in all
    (lost crops plus sealant). It is a modelled figure and can be negative.
  */
  /* The pairs of policies the page compares: [the one asked about, the one it is set against]. */
  const REPLAY_PAIRS = [["forecast", "d1"], ["forecast", "always"], ["d1", "always"]];
  const triggerIndex = (trigger) => REPLAY_POLICIES.findIndex((p) => p.trigger === trigger);
  /*
    Where two policies parted ways. Given each one's run from the engine, lists the years in which
    one sealed and the other did not, and what each of those years adds to the gap in modelled
    total cost (lost crops plus sealant; above zero means the first policy cost less that year).
    A year in which both made the same decision adds nothing, so the gaps of the listed years add
    up to the whole gap.
  */
  function decisionGap(runA, runB) {
    const differ = [];
    let gap = 0;
    runA.years.forEach((ya, k) => {
      const yb = runB.years[k], yearGap = (yb.loss + yb.spend) - (ya.loss + ya.spend);
      gap += yearGap;
      if (ya.acted !== yb.acted) differ.push({ year: ya.year, sealedA: ya.acted, sealedB: yb.acted, gap: yearGap });
    });
    return { differ, gap };
  }
  function replay(scope, overrides) {
    const runs = REPLAY_POLICIES.map((pol) => ENGINE.simulate(scope, { trigger: pol.trigger }, overrides));
    const nothing = runs[0].totals;
    return {
      firstYear: scope.firstYear, lastYear: scope.lastYear, years: runs[0].years.map((y) => y.year),
      // For each pair: the years the two decided differently, each year's share of the gap, and the whole gap.
      pairs: REPLAY_PAIRS.map(([a, b]) => Object.assign({ a, b }, decisionGap(runs[triggerIndex(a)], runs[triggerIndex(b)]))),
      rows: runs.map((run, i) => ({
        trigger: REPLAY_POLICIES[i].trigger, name: REPLAY_POLICIES[i].name,
        yearsSealed: run.totals.yearsActed, sealedYears: run.years.filter((y) => y.acted).map((y) => y.year),
        spend: run.totals.spend, keptAf: run.totals.savedAf, usedAf: run.totals.recoveredAf,
        loss: run.totals.loss, cost: run.totals.cost, saving: nothing.cost - run.totals.cost,
        perYear: run.years.map((y) => ({ year: y.year, sealed: y.acted, spend: y.spend, keptAf: y.savedAf, usedAf: y.recoveredAf, loss: y.loss })),
      })),
    };
  }
  /* ---------- Ranges: every modelled figure is shown as a middle with a low and a high ---------- */
  /* Low, middle and high of a list: its 10th, 50th and 90th percentiles (the engine's own rule). */
  function band(values) {
    const sorted = values.slice().sort((x, y) => x - y);
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    return { low: at(0.1), mid: at(0.5), high: at(0.9) };
  }
  /* A range in words: "$40.0M ($20.0M to $60.0M)". fmt turns a number into text. unit is what the
     range runs across ("draw" or "future"), used only when low and high are the same. */
  function rangeText(b, fmt, unit) {
    return fmt(b.low) === fmt(b.high) ? fmt(b.mid) + " (the same in every " + (unit || "draw") + ")" : fmt(b.mid) + " (" + fmt(b.low) + " to " + fmt(b.high) + ")";
  }
  /* The same range for a table cell: the middle on one line, the range in small text under it. */
  function rangeCell(b, fmt, unit) {
    return '<span class="rmid">' + esc(fmt(b.mid)) + '</span><small class="rng">' +
      (fmt(b.low) === fmt(b.high) ? "same in every " + esc(unit || "draw") : esc(fmt(b.low)) + " to " + esc(fmt(b.high))) + "</small>";
  }
  /* The same range as a headline: the low and the high in large type, the middle in small type
     under it. Used once, at the top of the Simulation step. */
  function rangeHeadline(b, fmt, unit) {
    const same = fmt(b.low) === fmt(b.high);
    return '<b class="hrange">' + esc(same ? fmt(b.mid) : fmt(b.low) + " to " + fmt(b.high)) + '</b><small class="hmid">' +
      (same ? "the same in every " + esc(unit || "draw") : "middle " + esc(fmt(b.mid))) + "</small>";
  }
  /* Acre-feet in thousands, for narrow table cells: 3,350 / 48.8 / 4.37. */
  const thousandAf = (af) => num(af / 1000, Math.abs(af) >= 1e5 ? 0 : Math.abs(af) >= 1e4 ? 1 : 2);
  /* Acre-feet as billions of gallons, for the same narrow cells: 1,091 / 15.9 / 1.42. The page
     shows water in gallons; a billion gallons is about 1,500 Olympic pools. */
  const billionGal = (af) => { const b = af * ENGINE.GALLONS_PER_ACRE_FOOT / 1e9; return num(b, Math.abs(b) >= 100 ? 0 : Math.abs(b) >= 10 ? 1 : 2); };

  /*
    The replay again, across many draws of what is not known about the canals (the engine's
    samplePhysics). The weather, the reservoirs and the forecasts are the real record and do not
    change; only the physical unknowns do. So years sealed is one number per policy, and the
    money and water figures are ranges: low, middle and high across the draws.
    options: { draws (300), seed, physicsOptions (handed to samplePhysics; a seepSd in it switches
    to the calibrated regime) }.
    Each row also has cost (one modelled total per draw, for comparing policies draw by draw),
    losesToNothing (draws where its total is higher than doing nothing's) and overBudget (draws
    where it sealed and a round cost more than the budget).
  */
  function replayBands(scope, overrides, options) {
    const opt = Object.assign({ draws: 300, seed: 11, physicsOptions: null }, options || {});
    const rng = ENGINE.makeRng(opt.seed), central = ENGINE.centralPhysics(opt.physicsOptions);
    const nothing = ENGINE.simulate(scope, { trigger: "never" }, overrides);     // no canal is touched: the same in every draw
    const lists = REPLAY_POLICIES.map(() => ({ spend: [], keptAf: [], loss: [], cost: [], saving: [], over: 0, first: null }));
    const pairYears = REPLAY_PAIRS.map(() => ({})), runs = [];
    for (let k = 0; k < opt.draws; k++) {
      const drawn = Object.assign({}, scope, { physics: ENGINE.samplePhysics(rng, opt.physicsOptions) });
      REPLAY_POLICIES.forEach((pol, i) => {
        const run = i === 0 ? nothing : ENGINE.simulate(drawn, { trigger: pol.trigger }, overrides), t = run.totals, list = lists[i];
        list.spend.push(t.spend); list.keptAf.push(t.savedAf); list.loss.push(t.loss); list.cost.push(t.cost); list.saving.push(nothing.totals.cost - t.cost);
        if (run.plan.overBudget && t.yearsActed > 0) list.over += 1;
        if (!list.first) list.first = run;
        runs[i] = run;
      });
      REPLAY_PAIRS.forEach(([a, b], j) => {
        const g = decisionGap(runs[triggerIndex(a)], runs[triggerIndex(b)]);
        g.differ.forEach((d) => { (pairYears[j][d.year] = pairYears[j][d.year] || { year: d.year, sealedA: d.sealedA, sealedB: d.sealedB, gaps: [] }).gaps.push(d.gap); });
      });
    }
    return {
      firstYear: scope.firstYear, lastYear: scope.lastYear, years: nothing.years.map((y) => y.year),
      draws: opt.draws, regime: central.regime, calibrated: central.calibrated,
      districts: scope.members, counties: scope.counties,
      // For each pair: the years the two decided differently (the same in every draw, because a
      // decision never looks at the canals) and the range of what each such year adds to the gap.
      pairs: REPLAY_PAIRS.map(([a, b], j) => ({ a, b,
        differ: Object.keys(pairYears[j]).map(Number).sort((x, y) => x - y).map((year) => ({
          year, sealedA: pairYears[j][year].sealedA, sealedB: pairYears[j][year].sealedB, gap: band(pairYears[j][year].gaps) })) })),
      rows: REPLAY_POLICIES.map((pol, i) => ({
        trigger: pol.trigger, name: pol.name,
        yearsSealed: lists[i].first.totals.yearsActed, sealedYears: lists[i].first.years.filter((y) => y.acted).map((y) => y.year),
        spend: band(lists[i].spend), keptAf: band(lists[i].keptAf), loss: band(lists[i].loss), saving: band(lists[i].saving),
        cost: lists[i].cost, losesToNothing: lists[i].cost.filter((c, k) => c > lists[0].cost[k]).length, overBudget: lists[i].over,
      })),
    };
  }

  /* A policy is called ahead of another only if its modelled total cost is lower in at least this share of the draws, */
  const REPLAY_CLEAR_SHARE = 0.9;
  /* and the two decided differently in at least this many years, */
  const REPLAY_MIN_YEARS_APART = 3;
  /* and no single year supplies more than this share of the gap between them. */
  const REPLAY_ONE_YEAR_SHARE = 0.5;
  /* The held-out test of the leak model, as the team reported it (reports/frozen/round3/seepage_calibration.json
     in the pipeline). Fixed wording: nothing here is computed. The Sources step also shows that file's own
     figures (HG.frozen.seepage, packed by app/build_site.py); a test checks the two agree. The simulation
     never reads them: it stays uncalibrated. */
  const HELD_OUT_SENTENCE = "We tested the leak model by hiding one district at a time and predicting its published 1998 water loss. " +
    "Across 14 districts its typical error was 32.7%, against 36.5% for canal length alone, and the two could not be told apart. " +
    "So the volumes and dollar figures here are not reliable and are not measurements. " +
    "The canal order on the map is an illustration of the method, not a tested ranking: we have not shown that it ranks canals better than canal length does.";
  /* The same finding in one line, for the top of the Simulation step. Fixed wording. The full
     sentence above is one tap away: in the step's fine print and at the top of the Sources step. */
  const TRUST_LINE = "Modelled, not measured. Our own test could not confirm the leak model, so these dollars and gallons are not reliable.";
  /* What the published losses used in that test are. Shown on the Sources step. Fixed wording. */
  const LOSSES_1998_SENTENCE = "The 1998 losses are estimates based on water rights, not measured, and include evaporation and spills.";
  /* The caption on the simulation's picture. The picture shows single figures for one run; they
     are allowed only because this caption is shown with them. */
  const TWIN_CAPTION = "One illustrative run, with each unknown at the middle of its range. Not a prediction.";
  /* The scored test's result, as the team reported it. Fixed wording: it is not computed here. */
  const SCORED_TEST_SENTENCE = "In the scored test on all 31 Rio Grande counties (558 county-years), the forecast and the 'already in moderate drought' rule could not be told apart.";
  /*
    How acting on the forecast compared with the D1 rule and with sealing every year. Written from
    the numbers, whichever way they fall, and deliberately hard to read as a win:
      - it always says in how many years the two policies decided differently;
      - "ahead" or "behind" is used only if the modelled total cost (lost crops plus sealant) is
        lower, or higher, in at least 9 draws in 10, AND the two decided differently in at least
        3 years, AND no single year supplies more than half of the gap;
      - otherwise it says "not distinguishable in this replay" and gives the reason. When one year
        supplies more than half of the gap, that year is named.
    Returns { text, vsD1, vsAlways }, each verdict "better", "worse", "same" or "indistinct".
  */
  function replayBandsSentence(result) {
    const row = (trigger) => result.rows.find((r) => r.trigger === trigger);
    const forecast = row("forecast"), n = result.draws, years = result.years.length;
    const yearWord = (c) => c + (c === 1 ? " year" : " years");
    const share = (count) => Math.round(100 * count / n) + "%";
    const against = (other, label, better) => {
      const pair = result.pairs.find((p) => p.a === "forecast" && p.b === other.trigger), apart = pair.differ;
      const who = "Against " + label + " (" + yearWord(other.yearsSealed) + " sealed): ";
      if (!apart.length) return { verdict: "same", text: who + "the two made the same decision in all " + yearWord(years) + ", so their modelled results are the same." };
      const lower = forecast.cost.filter((c, k) => c < other.cost[k]).length, higher = forecast.cost.filter((c, k) => c > other.cost[k]).length;
      // Which year, if any, supplies more than half of the gap (by the middle draw of each year's part).
      const size = apart.map((d) => Math.abs(d.gap.mid)), total = size.reduce((x, y) => x + y, 0);
      const top = size.indexOf(Math.max.apply(null, size)), oneYear = total > 0 && size[top] > REPLAY_ONE_YEAR_SHARE * total ? apart[top].year : null;
      const differed = "the two decided differently in " + apart.length + " of " + yearWord(years) + " (" + apart.map((d) => d.year).join(", ") + "). ";
      const leads = lower >= REPLAY_CLEAR_SHARE * n ? "lower" : higher >= REPLAY_CLEAR_SHARE * n ? "higher" : null;
      const counted = "The forecast had the " + (leads || "lower") + " modelled total cost in " + (leads === "higher" ? higher : lower) + " of " + n + " draws (" + share(leads === "higher" ? higher : lower) + ")";
      if (!leads) return { verdict: "indistinct", text: who + differed + counted + ", short of the 9 in 10 needed to call it either way: not distinguishable in this replay." };
      if (oneYear != null) {
        return { verdict: "indistinct", text: who + differed + counted + ", but " + oneYear + " alone supplies more than half of the gap, and one year is not evidence that " +
          (leads === "lower" ? "the forecast" : better) + " is better: not distinguishable in this replay." };
      }
      if (apart.length < REPLAY_MIN_YEARS_APART) {
        return { verdict: "indistinct", text: who + differed + counted + ", but " + yearWord(apart.length) + " of difference " + (apart.length === 1 ? "is" : "are") + " too few to tell two policies apart: not distinguishable in this replay." };
      }
      return { verdict: leads === "lower" ? "better" : "worse", text: who + differed + counted + ": in this replay it ended " + (leads === "lower" ? "ahead" : "behind") + "." };
    };
    const d1 = against(row("d1"), "the D1 rule", "the D1 rule"), always = against(row("always"), "sealing every year", "sealing every year");
    return { vsD1: d1.verdict, vsAlways: always.verdict,
             text: "In this replay, acting on the forecast sealed in " + forecast.yearsSealed + " of " + yearWord(years) + ". " + d1.text + " " + always.text };
  }
  /* For a view of several districts: how many counties' forecasts they share. Empty for one district. */
  function sharedForecastSentence(result) {
    if (!(result.districts > 1)) return "";
    return "The " + result.districts + " districts in this view draw on the forecasts of " + result.counties + (result.counties === 1 ? " county" : " counties") +
      ". Districts in the same county share one forecast, so they are not " + result.districts + " separate tests of it.";
  }
  /* Two plain lines from the counts: how often each policy ended worse than doing nothing, and
     how often a sealing round cost more than the budget. */
  function replayBandsLines(result) {
    const n = result.draws, acting = result.rows.filter((r) => r.trigger !== "never");
    const short = { declared: "waiting for a declaration", d1: "the D1 rule", forecast: "the forecast", always: "sealing every year" };
    const over = Math.max.apply(null, acting.map((r) => r.overBudget));
    return {
      worse: "Ended worse than doing nothing (a higher modelled total cost), out of " + n + " draws: " +
        acting.map((r) => short[r.trigger] + " in " + r.losesToNothing).join(", ") + ".",
      overBudget: over === 0 ? "In none of the " + n + " draws did a sealing round cost more than the budget."
        : "A sealing round cost more than the budget in " + over + " of " + n + " draws: the plan is made at the assumed canal width, and in those draws the canals were wider.",
    };
  }
  /* The table of ranges, one row per policy. Every figure in it is modelled.
     compact = true leaves out the crop-loss column and marks the forecast's row: that is the short
     table at the top of the Simulation step. The full table is in the step's fine print. */
  function replayBandsTable(result, compact) {
    const cell = (b, fmt) => '<td class="r">' + rangeCell(b, fmt) + "</td>";
    const loss = (r) => (compact ? "" : cell(r.loss, money));
    const rows = result.rows.map((r) => (r.trigger === "never"
      ? "<tr><td>" + esc(r.name) + '</td><td class="r">0</td><td class="r">none</td><td class="r">none</td>' + loss(r) + '<td class="r"></td></tr>'
      : "<tr" + (compact && r.trigger === "forecast" ? ' class="hl"' : "") + "><td>" + esc(r.name) + '</td><td class="r">' + esc(r.yearsSealed) + " of " + esc(result.years.length) + "</td>" +
        cell(r.spend, money) + cell(r.keptAf, billionGal) + loss(r) + cell(r.saving, money) + "</tr>")).join("");
    return '<div class="tableWrap"><table class="t replay"><tr><th>Policy</th><th class="r">Years sealed</th><th class="r">Sealant</th><th class="r">Water kept (billion gallons)</th>' +
      (compact ? "" : '<th class="r">Crop loss</th>') + '<th class="r">Saving vs nothing</th></tr>' +
      rows + "</table></div>";
  }

  /* ---------- The Sources step: verdict words, plain sentences and labels ---------- */
  /* A small number for a table: a whole number as it is, others whole above 100, two decimals above 1, three figures below. */
  const sig = (v) => (v == null || isNaN(v) ? "n/a" : Number.isInteger(v) || Math.abs(v) >= 100 ? num(v) : Math.abs(v) >= 1 ? num(v, 2) : String(Number(v.toPrecision(3))));
  /* The same with a plus sign on a number above zero, for a difference. */
  const signed = (v) => (v > 0 ? "+" : "") + sig(v);
  /*
    The verdict word for one comparison, from its interval and nothing else.
      row.diff, row.lo, row.hi   the difference (first-named minus second-named) and its interval
      row.lo2, row.hi2           a second interval made another way (pairs of years), if there is one
      row.lower                  true if a lower number is better, false if a higher one is
    Rule: the first-named is "ahead" or "behind" only if the interval lies wholly on one side of
    zero. If zero is inside it, or on its edge, the word is "not separated". If there are two
    intervals and they disagree, the word is also "not separated", and the note says they
    disagree. A row with no interval gets "no interval". A row that does not say which direction
    is better can only be "separated": its own stated word (row.stated) is used only if it is
    "ahead" or "behind", and only when the interval has already excluded zero. Whenever the
    stated word differs from the word this rule gives, it is quoted in the note.
  */
  function verdictFor(row) {
    const side = (lo, hi) => (lo == null || hi == null ? null : lo > 0 ? 1 : hi < 0 ? -1 : 0);
    const one = side(row.lo, row.hi), two = side(row.lo2, row.hi2);
    let word, note = "";
    if (one == null) word = "no interval";
    else if (one === 0) { word = "not separated"; if (two) note = "the interval from pairs of years excludes zero, this one does not: the two disagree"; }
    else if (two != null && two !== one) { word = "not separated"; note = "the interval from pairs of years includes zero: the two disagree"; }
    else if (typeof row.lower === "boolean") word = (row.lower ? one < 0 : one > 0) ? "ahead" : "behind";
    else if (row.stated === "ahead" || row.stated === "behind") word = row.stated;
    else { word = "separated"; if (!row.stated) note = "the results file does not say which direction is better"; }
    // a results file's own word is never used in place of the rule above; if it differs, it is quoted
    if (row.stated && row.stated !== word) note = (note ? note + "; " : "") + "the results file's own word is \"" + row.stated + "\"";
    return { word, note };
  }
  /*
    What the forecast changes in the sealant plan, in words. row is the pipeline's
    [km funded in both plans, km only with the forecast, km only without it, rank correlation,
    km that can be ranked]. A zero difference is said as plainly as a large one.
  */
  function forecastEffectSentence(row) {
    if (!row) return "No canal here can be ranked, so there is nothing to compare.";
    const both = row[0], onlyWith = row[1], onlyWithout = row[2], rho = row[3], km = (v) => num(v, 1) + " km";
    const funded = onlyWith === 0 && onlyWithout === 0
      ? (both === 0 ? "Neither plan funds any canal here at this budget, so the forecast changes nothing here."
                    : "The forecast changes nothing here: the same " + km(both) + " is funded with it and without it.")
      : "With the forecast in the ranking, " + km(onlyWith) + " is funded that would not be without it, and " + km(onlyWithout) +
        " that would be funded without it is not. " + km(both) + " is funded either way.";
    const order = rho == null ? "There are too few canals here to compare the two orders."
      : rho === 1 ? "The two orders are identical (rank correlation 1)."
      : "The two orders have a rank correlation of " + rho + " (1 would be the same order).";
    return funded + " " + order;
  }
  /* The leak classes as the page words them. The data keeps the pipeline's own names (the map
     colours and the tests are keyed by them); only the text shown changes. "Inspect first" read
     like a tested priority. It is a modelled class: the forecast warns and the soil is leaky. */
  const LEVEL_LABELS = { "Inspect first": "Leaky soil and forecast warning (modelled)" };
  const levelLabel = (level) => (Object.prototype.hasOwnProperty.call(LEVEL_LABELS, level) ? LEVEL_LABELS[level] : level);
  const LEVEL_NOTE = "\"" + LEVEL_LABELS["Inspect first"] + "\" is the highest modelled seepage class: the 6-month forecast warns for the county and the soil under the canal is leaky. " +
    "It comes from the model, not from an inspection, and it is not a field-tested priority.";
  /* What the stress test's forecast is. One sentence, shown with the stress test. Fixed wording. */
  const STRESS_TEST_SENTENCE = "In these random futures the forecast model is not run: whether a warning is given before each season is drawn at random, " +
    "using fixed rates for how often the forecast was right and how often it raised a false alarm in its test.";
  /* Dollars per acre-foot as dollars per million gallons (the unit the page shows water in). */
  const perMillionGal = (usdPerAf) => usdPerAf * 1e6 / ENGINE.GALLONS_PER_ACRE_FOOT;
  /* The caveat that must be shown with the lining-programme benchmark. Fixed wording. */
  const BENCHMARK_CAVEAT = "assumes the published 44,000 acre-feet is a yearly figure; not confirmed";

  /*
    The functions that read the data.
      data.HG         the generated core data (threshold, plan.assumptions, districts, trigger)
      data.SIM        the generated simulation data (weekly record, reservoirs, the frozen model)
      data.canals     the canals as objects (common.js builds them from HG.canals)
      data.published  the published figures (worstCaseRevenue, valleyIrrigationAf)
    engine is sim/engine.js; left out, the copy this file was loaded with is used.
  */
  function makeLogic(data, engine) {
    const HG = data.HG, SIM = data.SIM, canals = data.canals, PUBLISHED = data.published, E = engine || ENGINE;
    const FROZEN = SIM ? SIM.pre2020 : undefined;         // the forecast model trained only on data before 2020

    /* The advice that goes with a chance of a drought season (the same cut-offs as the canal plan). */
    function actionFor(p) {
      if (p >= HG.threshold) return { key: "seal", title: "Seal and repair before the season",
        text: "The chance of a drought season is over the warning line. Walk the canals at the top of the list, confirm they are unlined, and seal before the first irrigation." };
      if (p >= HG.threshold / 2) return { key: "inspect", title: "Inspect and prepare",
        text: "Not over the warning line yet. Inspect the canals at the top of the list and line up sealant so you can act quickly if the forecast rises." };
      return { key: "none", title: "No extra action",
        text: "The chance of a drought season is low. In a normal year canal leakage also refills groundwater, so sealing is not needed." };
    }
    const tierFor = (p) => (p >= HG.threshold ? "Warning" : p >= HG.threshold / 2 ? "Watch" : "Low");

    /*
      The budget plan. scopeCanals = the canals to choose from. pOverride = a "what if" chance of a
      drought season (null = use the model's forecast, which gives exactly the pipeline's order).
      Rule: rank by seepage rate x chance of drought, pay from the top down, stop at the first
      canal the money left cannot cover.
    */
    function planFor(scopeCanals, budget, pOverride) {
      const a = HG.plan.assumptions;
      const treatable = scopeCanals.filter((c) => c.rank != null);
      const ordered = treatable.slice().sort(pOverride == null
        ? (x, y) => x.rank - y.rank
        : (x, y) => (y.rate - x.rate) || (x.rank - y.rank));
      const p = { widthFt: a.wetted_width_ft, usdPerSqft: a.sealant_usd_per_sqft };
      const result = E.fundCanals(ordered, budget, p);
      const days = a.days_one_application_lasts;
      return {
        ordered, funded: result.funded, fundedIds: new Set(result.funded.map((c) => c.id)),
        spent: result.spent, km: result.km,
        savedLow: E.savedAcreFeet(result.gallonsPerDay, days, a.sealant_cut_low),
        savedHigh: E.savedAcreFeet(result.gallonsPerDay, days, a.sealant_cut_high),
        costAll: ordered.reduce((s, c) => s + c.usd, 0),
        sqft: result.km * E.FEET_PER_KM * a.wetted_width_ft,
      };
    }

    /*
      The three numbers that matter for one canal segment (or any list of them):
        usd      what the sealant costs (materials only; the pipeline's price per square foot)
        days     how long the job takes: km / (km one crew seals a day x crews). An assumption.
        afLow, afHigh  acre-feet of water kept in one application, across the range sealant tests found
        worthLow, worthHigh  what that water is worth to farms IF there is a shortage to fill
                             (net crop revenue per acre-foot; in a full year saved water earns nothing)
      params: { kmPerCrewDay, crews } from the simulation's assumptions.
    */
    const USD_PER_AF = PUBLISHED.worstCaseRevenue / PUBLISHED.valleyIrrigationAf;   // about $367, our own division
    function canalNumbers(list, params) {
      const a = HG.plan.assumptions;
      let km = 0, usd = 0, gallonsPerDay = 0;
      list.forEach((c) => {
        const sqft = c.km * E.FEET_PER_KM * a.wetted_width_ft;
        km += c.km; usd += sqft * a.sealant_usd_per_sqft; gallonsPerDay += sqft * (c.rate || 0);
      });
      const afLow = E.savedAcreFeet(gallonsPerDay, a.days_one_application_lasts, a.sealant_cut_low);
      const afHigh = E.savedAcreFeet(gallonsPerDay, a.days_one_application_lasts, a.sealant_cut_high);
      return { km, usd, days: km / (params.kmPerCrewDay * params.crews), crewDays: km / params.kmPerCrewDay,
               afLow, afHigh, worthLow: afLow * USD_PER_AF, worthHigh: afHigh * USD_PER_AF };
    }

    /* The chance of a drought season used by the planner: the "what if" value (severity), or the
       forecast. district = the open district, or null for the state view. */
    function scopeP(severity, district) {
      if (severity != null) return severity;
      if (district) return district.pSeason;
      const km = HG.districts.reduce((s, d) => s + d.canalKm, 0);       // state view: weighted by canal km
      return HG.districts.reduce((s, d) => s + d.pSeason * d.canalKm, 0) / km;
    }

    /* What the engine needs for a list of districts (members): its weekly record, its canals and
       the money at stake. rowsOf(fips) gives that county's forecasts as [[date made, chance], ...],
       oldest first; simScope and replayScope differ only in which forecasts they hand in. */
    function buildScope(members, rowsOf) {
      const system = members.length && usesElephantButte(members[0]) ? "Elephant Butte" : "Amistad-Falcon";
      const fips = Array.from(new Set([].concat.apply([], members.map((x) => x.fips))));
      const ids = new Set(members.map((x) => HG.districts.indexOf(x)));
      const list = canals.filter((c) => ids.has(c.district) && c.rank != null);
      const valleyKm = HG.districts.filter((x) => x.fips.some((f) => SIM.valley.indexOf(f) >= 0)).reduce((s, x) => s + x.canalKm, 0);
      const kmHere = members.reduce((s, x) => s + x.canalKm, 0), share = kmHere / valleyKm;
      // The monthly forecasts, per county. A week uses the newest one made on or before it.
      const frozen = fips.map(rowsOf), cursor = fips.map(() => -1);
      const start = new Date(SIM.week0 + "T12:00:00Z").getTime(), weeks = [];
      for (let i = 0; i < SIM.nWeeks; i++) {
        const date = new Date(start + i * 7 * 864e5), iso = date.toISOString().slice(0, 10);
        const cls = fips.map((f) => SIM.cls[f][i]).filter((ch) => ch !== ".").map(Number);
        const fc = [];
        frozen.forEach((rows, k) => { while (cursor[k] + 1 < rows.length && rows[cursor[k] + 1][0] <= iso) cursor[k]++; if (cursor[k] >= 0) fc.push(rows[cursor[k]][1]); });
        weeks.push({ date: iso, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1,
                     cls: cls.length ? Math.round(cls.reduce((a, b) => a + b, 0) / cls.length) : null,
                     forecast: fc.length ? fc.reduce((a, b) => a + b, 0) / fc.length : null,
                     pct: SIM.reservoirs[system][i] });
      }
      // Today's forecast from the frozen model, weighted by each district's canal km.
      const live = (FROZEN && FROZEN.live) || {};
      const pOf = (x) => { const v = x.fips.map((f) => live[f]).filter((p) => p != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : x.pSeason; };
      const pNow = members.reduce((s, x) => s + pOf(x) * x.canalKm, 0) / (kmHere || 1);
      return { weeks, canals: list.slice().sort((a, b) => a.rank - b.rank), canalsUnranked: list,
               demandAf: PUBLISHED.valleyIrrigationAf * share, revenueAtStake: PUBLISHED.worstCaseRevenue * share,
               share, system, pNow, ids: Array.from(ids), outsideValley: members.some((x) => !x.fips.some((f) => SIM.valley.indexOf(f) >= 0)), members: members.length,
               counties: fips.length };                               // how many distinct counties, and so how many forecasts, the members draw on
    }

    /* The scope the simulation's futures are built from: forecasts from the frozen model (trained
       only on data before 2020), which exist from 2020 on. */
    function simScope(members) {
      return buildScope(members, (f) => (FROZEN && FROZEN.monthly[f]) || []);
    }

    /*
      The scope for the REPLAY of the real record. Its forecasts are the pipeline's forward-chained
      ones (SIM.forecast): one a month for each river county from 2008, each made by a model
      trained only on years before the year it forecasts. Drought classes and reservoir levels
      are the real weekly record. Only whole years that have forecasts are kept, so the year
      still running is left out. Returns the scope with firstYear and lastYear, or null if the
      data holds no such year.
    */
    function replayScope(members) {
      const chained = (SIM && SIM.forecast) || {};
      const start = new Date(SIM.week0 + "T12:00:00Z").getTime();
      const scope = buildScope(members, (f) => {
        const rows = [];
        (chained[f] || []).forEach((p, i) => { if (p != null) rows.push([new Date(start + i * 7 * 864e5).toISOString().slice(0, 10), p]); });
        return rows;
      });
      // A year counts if the record covers it (50 weeks or more) and a forecast was made in it.
      const weeksIn = {}, forecastIn = {};
      scope.weeks.forEach((w) => { weeksIn[w.year] = (weeksIn[w.year] || 0) + 1; });
      const fips = Array.from(new Set([].concat.apply([], members.map((x) => x.fips))));
      fips.forEach((f) => (chained[f] || []).forEach((p, i) => { if (p != null) forecastIn[new Date(start + i * 7 * 864e5).getUTCFullYear()] = true; }));
      const years = Object.keys(weeksIn).map(Number).filter((y) => weeksIn[y] >= MIN_WEEKS_IN_A_YEAR && forecastIn[y]).sort((a, b) => a - b);
      if (!years.length) return null;
      // Keep one unbroken run of years, the latest one, so a drought streak never jumps a gap.
      let first = years[years.length - 1];
      while (years.indexOf(first - 1) >= 0) first--;
      const last = years[years.length - 1];
      return Object.assign({}, scope, { weeks: scope.weeks.filter((w) => w.year >= first && w.year <= last), firstYear: first, lastYear: last });
    }

    /* The frozen model's hit rates on 2020 to 2025, used to decide how often a simulated warning is right. */
    function hitRates() {
      const t = FROZEN ? FROZEN.test.preSeason.forecast : { recall: HG.trigger.rules[0].recall, falseAlarms: HG.trigger.rules[0].false_alarms, rows: HG.trigger.rows, droughtSeasons: HG.trigger.drought_seasons };
      return { recall: t.recall, falseAlarm: t.falseAlarms / Math.max(1, t.rows - t.droughtSeasons) };
    }

    /* What to hand the engine's samplePhysics. If the data ever carries a calibration spread
       (HG.calibration.seepSd, a number), it is passed through and the runs use the calibrated
       regime. Nothing writes it: the held-out test did not show the calibrated model predicting a
       hidden district better than canal length alone, so the runs stay uncalibrated. */
    function physicsOptions() {
      const c = HG.calibration;
      return c && typeof c.seepSd === "number" && isFinite(c.seepSd) && c.seepSd >= 0 ? { seepSd: c.seepSd } : {};
    }

    return { actionFor, tierFor, planFor, canalNumbers, USD_PER_AF, scopeP, simScope, replayScope, hitRates, physicsOptions };
  }

  return { usd, num, pct, niceDate, esc, safeUrl, safeDecode, cssClass, TIER_CLASSES, SEVERITY_CLASSES, finiteOrNull, percentOrNull, csvText, csvNumber,
           workTime, gal, money, usesElephantButte, REPLAY_POLICIES, replay,
           band, rangeText, rangeCell, rangeHeadline, thousandAf, billionGal, replayBands, replayBandsSentence, replayBandsLines, replayBandsTable,
           sharedForecastSentence, SCORED_TEST_SENTENCE, HELD_OUT_SENTENCE, TRUST_LINE, LOSSES_1998_SENTENCE, TWIN_CAPTION,
           sig, signed, verdictFor, forecastEffectSentence, LEVEL_LABELS, levelLabel, LEVEL_NOTE, STRESS_TEST_SENTENCE,
           perMillionGal, BENCHMARK_CAVEAT, makeLogic };
});
