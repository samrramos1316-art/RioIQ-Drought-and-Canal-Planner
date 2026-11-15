// Tests for engine.js. Run with:  node --test app/site/sim/engine.test.js
const test = require("node:test");
const assert = require("node:assert");
const E = require("./engine.js");

// A made-up scope: `years` years of weeks. pct = reservoir % full, cls = drought class, forecast = 0..1.
function scope(years, fill) {
  const weeks = [];
  for (let y = 0; y < years; y++) {
    for (let w = 0; w < 52; w++) {
      const month = Math.min(12, Math.floor(w / 4.34) + 1);
      weeks.push(Object.assign({ year: 2000 + y, month, cls: 0, forecast: 0, pct: 80 }, fill(y, w, month)));
    }
  }
  const canals = [{ km: 10, rate: 9 }, { km: 5, rate: 7 }, { km: 20, rate: 2 }];
  return { weeks, canals, canalsUnranked: canals.slice().reverse(), demandAf: 100000, revenueAtStake: 50e6 };
}
const dry = scope(3, () => ({ pct: 30, cls: 3, forecast: 0.6 }));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("same inputs give the identical result", () => {
  const a = E.simulate(dry, { trigger: "forecast" }), b = E.simulate(dry, { trigger: "forecast" });
  assert.deepStrictEqual(a.totals, b.totals);
  const f1 = E.forward(dry, [{ trigger: "forecast" }], {}, { seed: 3, draws: 20 });
  const f2 = E.forward(dry, [{ trigger: "forecast" }], {}, { seed: 3, draws: 20 });
  assert.deepStrictEqual(f1[0].summary, f2[0].summary);
});

test("water balances every year: wanted = delivered + recovered + still missing", () => {
  for (const trigger of ["never", "declared", "d1", "forecast", "always"]) {
    for (const y of E.simulate(dry, { trigger }).years) close(y.demandAf, y.deliveredAf + y.recoveredAf + y.unmetAf);
  }
});

test("with no canal budget, every policy gives the same outcome", () => {
  const base = E.simulate(dry, { trigger: "never" }, { budget: 0 }).totals;
  for (const trigger of ["declared", "d1", "forecast", "always"]) {
    assert.deepStrictEqual(E.simulate(dry, { trigger }, { budget: 0 }).totals, base);
  }
});

test("a year with no irrigation water loses exactly the published worst case", () => {
  const empty = scope(1, () => ({ pct: 5 }));
  close(E.simulate(empty, { trigger: "never" }).totals.loss, empty.revenueAtStake);
});

test("a full reservoir means no loss, and sealing then earns nothing (a false alarm)", () => {
  const wet = scope(1, () => ({ pct: 90, forecast: 0.9 }));
  const run = E.simulate(wet, { trigger: "forecast" });
  assert.strictEqual(run.totals.loss, 0);
  assert.strictEqual(run.totals.falseAlarms, 1);
  assert.ok(run.totals.spend > 0);
});

test("the forecast policy with the forecast swapped for the D1 rule equals the D1 policy", () => {
  const s = scope(4, (y, w) => ({ pct: 30, cls: (y + w) % 4 }));
  s.weeks.forEach((w) => { w.forecast = w.cls >= 2 ? 1 : 0; });
  assert.deepStrictEqual(E.simulate(s, { trigger: "forecast" }).totals, E.simulate(s, { trigger: "d1" }).totals);
});

test("a decision never uses later weeks", () => {
  const a = scope(1, () => ({ pct: 30, forecast: 0.6 }));
  const b = scope(1, (y, w) => ({ pct: 30, forecast: w > 20 ? 0 : 0.6 }));   // only the future differs
  assert.strictEqual(E.simulate(a, { trigger: "forecast" }).years[0].actedWeek,
                     E.simulate(b, { trigger: "forecast" }).years[0].actedWeek);
});

test("acting in a dry year costs less in total than doing nothing", () => {
  assert.ok(E.simulate(dry, { trigger: "forecast" }).totals.cost < E.simulate(dry, { trigger: "never" }).totals.cost);
});

test("the budget stops at the first canal it cannot cover", () => {
  const p = E.makeParams();
  const cost = (km) => km * E.FEET_PER_KM * p.widthFt * p.usdPerSqft;
  const plan = E.fundCanals(dry.canals, cost(10) + cost(5) - 1, p);   // enough for canal 1, not for canal 2
  assert.strictEqual(plan.funded.length, 1);
});

/* ---- From today, forward ---- */
const today = { startDate: "2026-11-14", pctNow: 38.7, pNow: 0.3, draws: 40, seed: 5 };
// A record with wet years (even) and dry years (odd) before 2020, and absurd years after it.
function history() {
  const s = scope(26, (y, w) => (2000 + y >= 2020 ? { pct: 999, cls: 5 } : y % 2 ? { pct: 30 - w * 0.2, cls: 3 } : { pct: 60 + w * 0.1, cls: 0 }));
  return s;
}

test("from today: the same seed gives the same futures", () => {
  const a = E.fromToday(history(), [{ trigger: "never" }, { trigger: "forecast" }], {}, today);
  const b = E.fromToday(history(), [{ trigger: "never" }, { trigger: "forecast" }], {}, today);
  assert.deepStrictEqual(a.policies[1].summary, b.policies[1].summary);
});

test("from today: storage starts at today's reading and the calendar starts today", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }], {}, today);
  assert.strictEqual(run.fan[0].date, "2026-11-14");
  assert.strictEqual(run.fan[0].low, 38.7);
  assert.strictEqual(run.fan[0].high, 38.7);
});

test("from today: nothing from 2020 or later is learned from", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }], {}, today);
  assert.ok(run.libraryYears.every((y) => y < 2020));
  assert.ok(run.fan.every((w) => w.high <= 100));            // the absurd 999% years never appear
});

test("from today: with no canal budget every policy gives the same futures", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }, { trigger: "forecast" }, { trigger: "always" }], { budget: 0 }, today);
  assert.deepStrictEqual(run.policies[1].draws, run.policies[0].draws);
  assert.deepStrictEqual(run.policies[2].draws, run.policies[0].draws);
});

test("from today: a missed delivery (a storage shock) never makes losses smaller", () => {
  const base = E.fromToday(history(), [{ trigger: "never" }], {}, today);
  const hit = E.fromToday(history(), [{ trigger: "never" }], {}, Object.assign({}, today, { shocks: [{ year: 1, month: 2, points: -10 }] }));
  assert.ok(hit.policies[0].summary.loss.mid >= base.policies[0].summary.loss.mid);
});

test("a second application costs a second round and never recovers less water", () => {
  const one = E.simulate(dry, { trigger: "always" }, { applications: 1 }).totals, two = E.simulate(dry, { trigger: "always" }, { applications: 2 }).totals;
  close(two.spend, 2 * one.spend);
  assert.ok(two.recoveredAf > one.recoveredAf);
});

test("from today: the three futures to watch run from mild to harsh and use only library years", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }, { trigger: "forecast" }], {}, today);
  const cost = (k) => run.cases[k].sample[0].totals.cost;
  assert.ok(cost("best") <= cost("likely") && cost("likely") <= cost("worst"));
  assert.strictEqual(run.cases.likely.sample[0].totals.cost, run.sample[0].totals.cost);
  for (const k of ["best", "likely", "worst"]) assert.ok(run.cases[k].sourceYears.every((y) => y < 2020));
});

test("sealing cannot save water that was never released", () => {
  // Reservoirs far below the "farms get none" line all year: nothing flows, so nothing is saved.
  const weeks = [];
  for (let i = 0; i < 52; i++) weeks.push({ date: "2030-01-01", year: 2030, month: 1 + Math.floor(i / 4.34), cls: 4, forecast: 1, pct: 5 });
  const scope = { weeks, canals: [{ km: 10, rate: 2 }], canalsUnranked: [{ km: 10, rate: 2 }], demandAf: 1000, revenueAtStake: 367000 };
  const run = E.simulate(scope, { trigger: "always" }, { budget: 1e6 });
  assert.strictEqual(run.totals.recoveredAf, 0);
  assert.strictEqual(run.totals.savedAf, 0);
});

/* ---- Physical uncertainty (off unless a run asks for it) ---- */
const band = (b) => b.high - b.low;
// A draw written by hand. Uncalibrated unless said otherwise; every multiplier neutral unless set.
const fixedDraw = (over) => Object.assign({ regime: "uncalibrated", calibrated: false, s: null, seepMult: 1, cut: 0.575, widthMult: 1, linedShare: 0 }, over);
const withPhysics = (s, over) => Object.assign({}, s, { physics: fixedDraw(over) });
const calibratedDraw = (over) => Object.assign({ regime: "calibrated", calibrated: true, s: 1, seepMult: 1 }, over);
const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;
const median = (list) => { const sorted = list.slice().sort((a, b) => a - b); return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2; };

test("without a physics draw, simulate gives the totals it gave before physics was added", () => {
  // These numbers were printed by the engine before the physics code was written.
  const a = E.simulate(dry, { trigger: "forecast" }).totals;
  assert.strictEqual(a.spend, 82677.16799999999);
  assert.strictEqual(a.loss, 78693186.32146509);
  assert.strictEqual(a.recoveredAf, 14042.198785641282);
  assert.strictEqual(a.cost, 78775863.48946509);
  const b = E.simulate(dry, { trigger: "declared" }, { budget: 5000 }).totals;
  assert.strictEqual(b.spend, 35433.072);
  assert.strictEqual(b.loss, 80597900.1538608);
  assert.strictEqual(b.savedAf, 10232.771120849713);
  assert.strictEqual(E.simulate(dry, { trigger: "forecast" }).physics, undefined);
});

test("without the physics option, the futures give the bands they gave before physics was added", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }, { trigger: "forecast" }], {}, today);
  assert.deepStrictEqual(run.policies[0].summary.cost, { low: 40000000.00000054, mid: 118000000.00000083, high: 184000000.0000006 });
  assert.deepStrictEqual(run.policies[1].summary.cost, { low: 37687192.59172699, mid: 112517242.32631084, high: 177061577.77517995 });
  assert.deepStrictEqual(run.policies[1].summary.spend, { low: 55118.111999999994, mid: 82677.16799999999, high: 110236.22399999999 });
  assert.deepStrictEqual(run.policies[1].summary.recoveredAf, { low: 7815.10882602216, mid: 12428.04059397327, high: 18722.931714188377 });
  assert.deepStrictEqual(run.cases.likely.sourceYears, [2003, 2002, 2009, 2002, 2019, 2003]);
  assert.deepStrictEqual(run.fan[30], { date: "2027-06-12", low: 32.899999999999935, mid: 39.8, high: 41.599999999999994 });
  assert.strictEqual(run.physics, undefined);
  assert.strictEqual(run.fixedPhysics, undefined);
  const older = E.forward(dry, [{ trigger: "forecast" }], {}, { seed: 3, draws: 20 });
  assert.strictEqual(older[0].summary.cost.mid, 131293105.81577514);
});

test("switching physics on does not change the weather of any future", () => {
  const policies = [{ trigger: "never" }, { trigger: "forecast" }];
  const off = E.fromToday(history(), policies, {}, today), on = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true }));
  assert.deepStrictEqual(on.fan, off.fan);
  assert.deepStrictEqual(on.policies[0].draws, off.policies[0].draws);       // doing nothing has no canals in it
  assert.deepStrictEqual(on.cases.likely.sourceYears, off.cases.likely.sourceYears);
});

test("every policy in one future faces the same physics draw, and different futures face different draws", () => {
  const policies = [{ trigger: "never" }, { trigger: "forecast" }, { trigger: "always" }];
  const run = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true }));
  for (const key of ["best", "likely", "worst"]) {
    const [nothing, forecast, always] = run.cases[key].sample.map((r) => r.physics);
    for (const part of ["seepMult", "cut", "widthMult", "linedShare"]) {
      assert.strictEqual(typeof nothing[part], "number");
      assert.strictEqual(forecast[part], nothing[part]);
      assert.strictEqual(always[part], nothing[part]);
    }
  }
  assert.strictEqual(run.physics.draws.length, today.draws);
  for (const part of ["cut", "widthMult", "linedShare"]) {
    assert.strictEqual(new Set(run.physics.draws.map((d) => d[part])).size, today.draws, part + " differs in every future");
  }
});

test("in every future, each policy's totals are the ones the future's one recorded draw implies", () => {
  // The same futures with physics off give each policy's bill at the assumed width. With physics
  // on, every policy's bill in future k must be that bill times future k's width multiplier.
  // A fresh draw for each policy would break this for all but one of them.
  const policies = [{ trigger: "never" }, { trigger: "forecast" }, { trigger: "always" }, { trigger: "d1" }];
  const off = E.fromToday(history(), policies, {}, today), on = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true }));
  let sealedTwice = 0;
  for (let k = 0; k < today.draws; k++) {
    const draw = on.physics.draws[k];
    for (const i of [1, 2, 3]) {
      close(on.policies[i].draws[k].spend, off.policies[i].draws[k].spend * draw.widthMult);
    }
    // Two policies that both sealed: their bills are in the ratio they had at the assumed width.
    const a = on.policies[1].draws[k], b = on.policies[2].draws[k];
    if (a.spend > 0 && b.spend > 0) { sealedTwice++; close(a.spend / b.spend, off.policies[1].draws[k].spend / off.policies[2].draws[k].spend); }
  }
  assert.ok(sealedTwice > 10, `${sealedTwice} futures where both policies sealed`);
  // Two entries with the same rule are the same in every future.
  const twins = E.fromToday(history(), [{ trigger: "always" }, { trigger: "always" }], {}, Object.assign({}, today, { physics: true }));
  assert.deepStrictEqual(twins.policies[0].draws, twins.policies[1].draws);
});

test("with physics on, the weekly and yearly spend add up to the total bill", () => {
  const run = E.simulate(withPhysics(dry, { widthMult: 1.3 }), { trigger: "always" });
  const plain = E.simulate(dry, { trigger: "always" });
  const weekly = run.years.reduce((s, y) => s + y.weekly.reduce((t, w) => t + w.spend, 0), 0);
  close(weekly, run.totals.spend);
  close(run.years.reduce((s, y) => s + y.spend, 0), run.totals.spend);
  close(run.totals.spend, 1.3 * plain.totals.spend);
  // Each round on the weekly record is the round's bill, not the plan's nominal cost.
  const rounds = run.years[0].weekly.filter((w) => w.spend > 0).map((w) => w.spend);
  assert.ok(rounds.length >= 1);
  rounds.forEach((r) => close(r, run.plan.spent));
  close(run.plan.spent, 1.3 * plain.plan.spent);
});

test("uncalibrated: the seepage share is never applied, whatever the draw carries", () => {
  const base = E.simulate(withPhysics(dry), { trigger: "always" }).totals;
  for (const seepMult of [0, 0.5, 0.7, 3]) {
    const t = E.simulate(withPhysics(dry, { seepMult, s: seepMult }), { trigger: "always" }).totals;
    assert.strictEqual(t.savedAf, base.savedAf);
    assert.strictEqual(t.spend, base.spend);
  }
  // And a sampled uncalibrated draw carries no share at all.
  const rng = E.makeRng(1);
  for (let i = 0; i < 50; i++) {
    const d = E.samplePhysics(rng, i % 2 ? {} : undefined);
    assert.deepStrictEqual([d.regime, d.calibrated, d.s, d.seepMult], ["uncalibrated", false, null, 1]);
  }
});

test("uncalibrated: water kept scales with width and with the unlined share; the bill scales with width only", () => {
  const plain = E.simulate(dry, { trigger: "always" }).totals;
  const neutral = E.simulate(withPhysics(dry), { trigger: "always" }).totals;
  close(neutral.savedAf, plain.savedAf);
  assert.strictEqual(neutral.spend, plain.spend);
  const lined = E.simulate(withPhysics(dry, { linedShare: 1 }), { trigger: "always" }).totals;
  assert.strictEqual(lined.savedAf, 0);                                       // all lined: nothing to keep
  assert.strictEqual(lined.spend, plain.spend);                               // and the sealant is still bought
  const half = E.simulate(withPhysics(dry, { linedShare: 0.5 }), { trigger: "always" }).totals;
  close(half.savedAf, plain.savedAf / 2);
  assert.strictEqual(half.spend, plain.spend);
  const wide = E.simulate(withPhysics(dry, { widthMult: 2 }), { trigger: "always" });
  close(wide.totals.savedAf, 2 * plain.savedAf);
  close(wide.totals.spend, 2 * plain.spend);
  assert.strictEqual(wide.plan.canals, E.simulate(dry, { trigger: "always" }).plan.canals);   // the same canals: the plan is made at the assumed width
  const both = E.simulate(withPhysics(dry, { widthMult: 1.5, linedShare: 0.4 }), { trigger: "always" }).totals;
  close(both.savedAf, plain.savedAf * 1.5 * 0.6);
  close(both.spend, plain.spend * 1.5);
});

test("calibrated: water kept scales with the seepage multiplier only; width moves the bill and nothing else", () => {
  const plain = E.simulate(dry, { trigger: "always" }).totals;
  const cal = (over) => E.simulate(Object.assign({}, dry, { physics: fixedDraw(calibratedDraw(over)) }), { trigger: "always" }).totals;
  close(cal({ seepMult: 0.6 }).savedAf, 0.6 * plain.savedAf);
  assert.strictEqual(cal({ seepMult: 0.6 }).spend, plain.spend);
  // Width and lining do not touch the water kept: they are already inside the district totals.
  close(cal({ seepMult: 0.6, widthMult: 1.5, linedShare: 0.5 }).savedAf, 0.6 * plain.savedAf);
  close(cal({ seepMult: 0.6, widthMult: 1.5, linedShare: 0.5 }).spend, 1.5 * plain.spend);
  assert.strictEqual(cal({ seepMult: 1, linedShare: 1 }).savedAf, cal({ seepMult: 1, linedShare: 0 }).savedAf);
  // No seepage at all: nothing kept, the same bill, and the same loss as doing nothing.
  const none = cal({ seepMult: 0 });
  assert.strictEqual(none.savedAf, 0);
  assert.strictEqual(none.spend, plain.spend);
  assert.strictEqual(none.loss, E.simulate(dry, { trigger: "never" }).totals.loss);
});

test("the two regimes give different water for the same width and lining, and the same bill", () => {
  const draw = { widthMult: 1.4, linedShare: 0.5, seepMult: 0.7, s: 0.7 };
  const un = E.simulate(withPhysics(dry, draw), { trigger: "always" }).totals;
  const cal = E.simulate(withPhysics(dry, calibratedDraw(draw)), { trigger: "always" }).totals;
  close(un.savedAf / cal.savedAf, (1.4 * 0.5) / 0.7);
  assert.strictEqual(un.spend, cal.spend);
});

test("the drawn sealant effect is used in place of the fixed one, in both regimes", () => {
  for (const regime of [{}, calibratedDraw({})]) {
    const low = E.simulate(withPhysics(dry, Object.assign({ cut: 0.28 }, regime)), { trigger: "always" }).totals;
    const high = E.simulate(withPhysics(dry, Object.assign({ cut: 0.87 }, regime)), { trigger: "always" }).totals;
    close(high.savedAf / low.savedAf, 0.87 / 0.28);
    assert.strictEqual(high.spend, low.spend);
    // A slider value for the sealant effect is ignored once a draw is supplied.
    assert.strictEqual(E.simulate(withPhysics(dry, Object.assign({ cut: 0.28 }, regime)), { trigger: "always" }, { cut: 0.8 }).totals.savedAf, low.savedAf);
  }
});

test("with physics sampled the bands are wider than with physics held fixed, and sit around the same middle", () => {
  const policies = [{ trigger: "never" }, { trigger: "always" }];
  for (const physicsOptions of [null, { seepSd: 0.4 }]) {
    const run = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true, draws: 400, physicsOptions }));
    const sampled = run.policies[1].summary, fixed = run.fixedPhysics.policies[1].summary;
    assert.ok(fixed.recoveredAf.mid > 0, "sealing keeps water in this fixture");
    assert.ok(band(sampled.recoveredAf) > band(fixed.recoveredAf), `${band(sampled.recoveredAf)} vs ${band(fixed.recoveredAf)}`);
    assert.ok(band(sampled.spend) > band(fixed.spend));
    assert.ok(sampled.recoveredAf.low < fixed.recoveredAf.low && sampled.recoveredAf.high > fixed.recoveredAf.high);
    // Centred: the middle bill of the sampled futures is the bill with physics fixed.
    assert.ok(Math.abs(sampled.spend.mid / fixed.spend.mid - 1) < 0.03, `spend middle ratio ${sampled.spend.mid / fixed.spend.mid}`);
    assert.ok(fixed.spend.mid > sampled.spend.low && fixed.spend.mid < sampled.spend.high);
    // Doing nothing involves no canal, so physics cannot move it.
    assert.deepStrictEqual(run.fixedPhysics.policies[0].draws, run.policies[0].draws);
    assert.strictEqual(run.fixedPhysics.policies[1].draws.length, 400);
  }
});

test("physics held fixed is the median of every unknown, not the most likely value", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }], {}, Object.assign({}, today, { physics: true }));
  const c = run.physics.central;
  close(c.cut, 0.575);
  close(c.widthMult, 1);
  close(c.linedShare, 0.7 - Math.sqrt(0.14));                                 // 0.3258: half the triangle's area lies below it
  assert.ok(c.linedShare > 0.3);
  assert.deepStrictEqual([c.regime, c.calibrated, c.s, c.seepMult], ["uncalibrated", false, null, 1]);
  assert.deepStrictEqual([run.physics.regime, run.physics.calibrated], ["uncalibrated", false]);
  const calibrated = E.fromToday(history(), [{ trigger: "never" }], {}, Object.assign({}, today, { physics: true, physicsOptions: { seepSd: 0.5 } }));
  assert.deepStrictEqual([calibrated.physics.regime, calibrated.physics.calibrated], ["calibrated", true]);
  close(calibrated.physics.central.s, 0.7);
  close(calibrated.physics.central.seepMult, 0.7);
  // The medians are the medians of what is actually drawn.
  const rng = E.makeRng(77), draws = [];
  for (let i = 0; i < 20000; i++) draws.push(E.samplePhysics(rng, { seepSd: 0.5 }));
  const central = E.centralPhysics({ seepSd: 0.5 });
  for (const key of ["s", "seepMult", "cut", "widthMult", "linedShare"]) {
    const m = median(draws.map((d) => d[key]));
    assert.ok(Math.abs(m - central[key]) < 0.012 * (key === "seepMult" || key === "widthMult" ? 2 : 1), `${key}: sampled median ${m}, central ${central[key]}`);
  }
  // Taken together: the fixed bill multiplier is the middle of the sampled ones, and the fixed
  // water multiplier (what is kept of the plain run's water) is their average, in both regimes.
  // Its median is a little lower (about a tenth, uncalibrated), because a product of medians
  // is not the median of the product.
  for (const opts of [undefined, { seepSd: 0.4 }]) {
    const r = E.makeRng(5), list = [], c = E.centralPhysics(opts);
    for (let i = 0; i < 40000; i++) list.push(E.samplePhysics(r, opts));
    const kept = (d) => (d.calibrated ? d.seepMult : d.widthMult * (1 - d.linedShare)) * d.cut;
    assert.ok(Math.abs(median(list.map((d) => d.widthMult)) - c.widthMult) < 0.01);
    assert.ok(Math.abs(mean(list.map((d) => d.widthMult)) - c.widthMult) < 0.01);
    const centre = kept(c), avg = mean(list.map(kept)), mid = median(list.map(kept));
    assert.ok(Math.abs(avg / centre - 1) < (opts ? 0.11 : 0.03), `average kept ${avg} vs fixed ${centre}`);
    assert.ok(mid / centre > 0.85 && mid / centre < 1.02, `median kept ${mid} vs fixed ${centre}`);
  }
  // A width range that is not centred on 1 moves the central width with it.
  close(E.centralPhysics({ widthLow: 1, widthHigh: 2 }).widthMult, 1.5);
});

test("the count of futures where a policy loses to doing nothing matches the futures themselves", () => {
  // Reservoirs always full: sealing is paid for and never fills a shortage, so it loses every time.
  const wet = scope(26, () => ({ pct: 90, cls: 0 }));
  const policies = [{ trigger: "never" }, { trigger: "always" }];
  for (const physics of [false, true]) {
    const run = E.fromToday(wet, policies, {}, Object.assign({}, today, { physics, pctNow: 90 }));
    assert.strictEqual(run.policies[0].losesToNothing, 0);
    assert.strictEqual(run.policies[1].losesToNothing, today.draws);
    if (physics) assert.strictEqual(run.fixedPhysics.policies[1].losesToNothing, today.draws);
  }
  // Starting right at the full-supply line, some futures turn dry (sealing pays) and some stay full (it does not).
  const mixed = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true, pctNow: 50, draws: 200 }));
  for (const set of [mixed.policies, mixed.fixedPhysics.policies]) {
    const lost = set[1].losesToNothing;
    assert.ok(lost > 0 && lost < 200, `${lost} of 200`);
    assert.strictEqual(lost, set[1].draws.filter((t, k) => t.cost > set[0].draws[k].cost).length);
  }
  // With no "do nothing" policy in the list there is nothing to compare with.
  assert.strictEqual(E.fromToday(wet, [{ trigger: "always" }], {}, Object.assign({}, today, { pctNow: 90 })).policies[0].losesToNothing, null);
});

test("the count of futures where a round cost more than the budget is the futures with wider canals where the policy sealed", () => {
  // The budget is exactly what the three canals cost at the assumed width, so any width
  // multiplier above 1 makes a round cost more than the budget.
  const p = E.makeParams(), budget = E.fundCanals(dry.canals, Infinity, p).spent;
  const policies = [{ trigger: "never" }, { trigger: "always" }, { trigger: "forecast" }];
  const run = E.fromToday(history(), policies, { budget }, Object.assign({}, today, { physics: true, draws: 200 }));
  const wider = run.physics.draws.map((d) => d.widthMult > 1);
  assert.strictEqual(run.policies[0].overBudget, 0);                           // doing nothing never pays a bill
  assert.strictEqual(run.policies[1].overBudget, wider.filter(Boolean).length);                    // "always" seals in every future
  assert.strictEqual(run.policies[2].overBudget, wider.filter((w, k) => w && run.policies[2].draws[k].yearsActed > 0).length);
  assert.ok(run.policies[1].overBudget > 60 && run.policies[1].overBudget < 140, `${run.policies[1].overBudget} of 200`);   // about half
  assert.ok(run.policies[2].overBudget <= run.policies[1].overBudget);
  // At the median width a round costs exactly the budget, never more.
  assert.strictEqual(run.fixedPhysics.policies[1].overBudget, 0);
  // With room in the budget for the widest canals, it never happens.
  const roomy = E.fromToday(history(), policies, { budget: budget * 1.5 + 1 }, Object.assign({}, today, { physics: true, draws: 200 }));
  assert.strictEqual(roomy.policies[1].overBudget, 0);
  // One run says so itself; with physics off the field is not there at all.
  assert.strictEqual(E.simulate(withPhysics(dry, { widthMult: 1.2 }), { trigger: "always" }, { budget }).plan.overBudget, true);
  assert.strictEqual(E.simulate(withPhysics(dry, { widthMult: 0.9 }), { trigger: "always" }, { budget }).plan.overBudget, false);
  assert.strictEqual("overBudget" in E.simulate(dry, { trigger: "always" }, { budget }).plan, false);
  assert.strictEqual("overBudget" in E.fromToday(history(), policies, { budget }, today).policies[1], false);
});

test("samplePhysics stays inside its ranges over many draws and covers most of each", () => {
  const rng = E.makeRng(42), draws = [];
  for (let i = 0; i < 5000; i++) draws.push(E.samplePhysics(rng, { seepSd: 0.4 }));
  const range = (key) => [Math.min(...draws.map((d) => d[key])), Math.max(...draws.map((d) => d[key]))];
  const inside = (key, low, high) => { const [a, b] = range(key); assert.ok(a >= low && b <= high, `${key}: ${a} to ${b}`); assert.ok(a < low + 0.05 * (high - low) && b > high - 0.05 * (high - low), `${key} covers its range`); };
  inside("s", 0.5, 0.9);
  inside("cut", 0.28, 0.87);
  inside("widthMult", 0.5, 1.5);
  inside("linedShare", 0, 0.7);
  assert.ok(draws.every((d) => d.seepMult > 0 && d.regime === "calibrated"));
  // Flat ranges have their average in the middle. The width range is centred on the assumed width.
  assert.ok(Math.abs(mean(draws.map((d) => d.widthMult)) - 1) < 0.015);
  assert.ok(Math.abs(mean(draws.map((d) => d.cut)) - 0.575) < 0.01);
  assert.ok(Math.abs(mean(draws.map((d) => d.s)) - 0.7) < 0.007);
});

test("the lined share follows a triangle that peaks at 0.3, not somewhere near it", () => {
  // Checked against the triangle's own formulas. A peak at 0.35 in place of 0.3 would give a
  // median of 0.350, a mean of 0.350 and 36.7% of draws under 0.3; each check below rejects that.
  const rng = E.makeRng(2024), lined = [];
  for (let i = 0; i < 40000; i++) lined.push(E.samplePhysics(rng).linedShare);
  const below = (x) => lined.filter((v) => v < x).length / lined.length;
  assert.ok(Math.abs(median(lined) - (0.7 - Math.sqrt(0.14))) < 0.005, `median ${median(lined)}`);          // 0.3258
  assert.ok(Math.abs(mean(lined) - 1 / 3) < 0.004, `mean ${mean(lined)}`);                                  // (0 + 0.3 + 0.7) / 3
  assert.ok(Math.abs(below(0.3) - 0.3 / 0.7) < 0.01, `share under 0.3: ${below(0.3)}`);                     // 42.9%: the area left of the peak
  assert.ok(Math.abs(below(0.15) - 0.15 * 0.15 / 0.21) < 0.008, `share under 0.15: ${below(0.15)}`);        // 10.7%
  assert.ok(Math.abs(below(0.5) - (1 - 0.2 * 0.2 / 0.28)) < 0.008, `share under 0.5: ${below(0.5)}`);       // 85.7%
});

test("samplePhysics gives the same draws for the same seed and different draws for another seed", () => {
  const take = (seed) => { const rng = E.makeRng(seed); return [E.samplePhysics(rng), E.samplePhysics(rng), E.samplePhysics(rng)]; };
  assert.deepStrictEqual(take(9), take(9));
  assert.notDeepStrictEqual(take(9), take(10));
  assert.notDeepStrictEqual(take(9)[0], take(9)[1]);
});

test("samplePhysics: a calibration switches the regime, and leaves the other draws as they were", () => {
  const un = E.samplePhysics(E.makeRng(1)), cal = E.samplePhysics(E.makeRng(1), { seepSd: 0.5 });
  assert.deepStrictEqual([un.regime, un.calibrated, un.seepMult, un.s], ["uncalibrated", false, 1, null]);
  assert.deepStrictEqual([cal.regime, cal.calibrated], ["calibrated", true]);
  assert.ok(cal.s >= 0.5 && cal.s <= 0.9 && cal.seepMult !== cal.s);
  for (const key of ["cut", "widthMult", "linedShare"]) assert.strictEqual(cal[key], un[key], key);
  const zero = E.samplePhysics(E.makeRng(1), { seepSd: 0 });                  // a spread of zero is still a calibration
  assert.strictEqual(zero.calibrated, true);
  assert.strictEqual(zero.seepMult, zero.s);
});

test("samplePhysics: a calibration spread widens the seepage multiplier around the seepage share", () => {
  const ratios = [], rng = E.makeRng(7);
  for (let i = 0; i < 4000; i++) { const d = E.samplePhysics(rng, { seepSd: 0.5 }); ratios.push(Math.log(d.seepMult / d.s)); }
  const m = mean(ratios), sd = Math.sqrt(mean(ratios.map((r) => (r - m) * (r - m))));
  assert.ok(Math.abs(m) < 0.03, `mean ${m}`);
  assert.ok(Math.abs(sd - 0.5) < 0.03, `sd ${sd}`);
});

test("samplePhysics: the width range can be set, and per-class widths come back only when asked for", () => {
  const narrow = E.samplePhysics(E.makeRng(3), { widthLow: 1, widthHigh: 1 });
  assert.strictEqual(narrow.widthMult, 1);
  assert.strictEqual(narrow.widthMultByClass, undefined);
  const rng = E.makeRng(3);
  for (let i = 0; i < 200; i++) {
    const d = E.samplePhysics(rng, { widthByClass: { main: [20, 40], ditch: [3, 8] } });
    assert.deepStrictEqual(Object.keys(d.widthMultByClass), ["main", "ditch"]);
    assert.ok(d.widthMultByClass.main >= 1 && d.widthMultByClass.main <= 2);          // 20 to 40 ft over the 20 ft base
    assert.ok(d.widthMultByClass.ditch >= 0.15 && d.widthMultByClass.ditch <= 0.4);   // 3 to 8 ft over 20 ft
  }
});

test("the Normal draw has the bell curve's mean, spread, tails and fourth moment", () => {
  const rng = E.makeRng(123), n = 100000, z = [];
  for (let i = 0; i < n; i++) z.push(E.normal(rng));
  const m = mean(z), sd = Math.sqrt(mean(z.map((v) => (v - m) * (v - m))));
  assert.ok(z.every(Number.isFinite));
  assert.ok(Math.abs(m) < 0.015, `mean ${m}`);
  assert.ok(Math.abs(sd - 1) < 0.015, `sd ${sd}`);
  const outside = (x) => z.filter((v) => Math.abs(v) > x).length / n, above = (x) => z.filter((v) => v > x).length / n;
  assert.ok(Math.abs(outside(1) - 0.3173) < 0.006, `outside 1: ${outside(1)}`);
  assert.ok(Math.abs(outside(1.96) - 0.05) < 0.003, `outside 1.96: ${outside(1.96)}`);
  assert.ok(Math.abs(outside(3) - 0.0027) < 0.0008, `outside 3: ${outside(3)}`);
  assert.ok(Math.abs(above(0) - 0.5) < 0.006 && Math.abs(above(1.645) - 0.05) < 0.003, "the two sides match");
  assert.ok(Math.abs(mean(z.map((v) => v * v * v)) ) < 0.05, "no lean to either side");
  assert.ok(Math.abs(mean(z.map((v) => v * v * v * v)) - 3) < 0.12, `fourth moment ${mean(z.map((v) => v * v * v * v))}`);   // 3 for a bell curve
});

test("every physics range is listed in DEFAULTS with a tag, and only the sealant range is tagged published", () => {
  const keys = ["cutLow", "cutHigh", "seepShareLow", "seepShareHigh", "widthMultLow", "widthMultHigh", "linedShareLow", "linedShareMode", "linedShareHigh"];
  for (const key of keys) {
    assert.ok(E.DEFAULTS[key] && typeof E.DEFAULTS[key].value === "number" && E.DEFAULTS[key].label.length > 0, key);
    assert.strictEqual(E.DEFAULTS[key].tag, key.indexOf("cut") === 0 ? "published" : "assumption", key);
  }
  assert.deepStrictEqual([E.DEFAULTS.widthMultLow.value, E.DEFAULTS.widthMultHigh.value], [0.5, 1.5]);   // centred on the assumed width
  assert.ok(/no width is measured/.test(E.DEFAULTS.widthMultLow.label) && /no width is measured/.test(E.DEFAULTS.widthMultHigh.label));
  assert.strictEqual(E.DEFAULTS.cut.value, 0.575);                            // the page's slider still starts here
  assert.strictEqual(E.DEFAULTS.cut.tag, "assumption");                       // only the range is published, not its middle
});

test("with physics on, each future to watch also comes with the physics at its median, in the same weather", () => {
  const policies = [{ trigger: "never" }, { trigger: "always" }];
  const run = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true }));
  for (const key of ["best", "likely", "worst"]) {
    const c = run.cases[key];
    assert.deepStrictEqual(c.sampleFixed.map((r) => r.physics), [run.physics.central, run.physics.central]);
    // The same weeks of weather as the sampled run, week for week.
    assert.deepStrictEqual(c.sampleFixed[1].years.map((y) => y.weekly.map((w) => [w.date, w.pct, w.cls])), c.sample[1].years.map((y) => y.weekly.map((w) => [w.date, w.pct, w.cls])));
    assert.deepStrictEqual(c.sampleFixed[0].totals, c.sample[0].totals);                 // doing nothing does not depend on the canals
    close(c.sampleFixed[1].totals.spend * c.sample[1].physics.widthMult, c.sample[1].totals.spend);   // the bill at the median width is the nominal bill
  }
  assert.strictEqual(E.fromToday(history(), policies, {}, today).cases.likely.sampleFixed, undefined);   // not there with physics off
});

test("the lined share's triangle peaks at 0.3: its mean, median, quartiles and cumulative shares rule out a peak at 0.25 or 0.35", () => {
  // Analytic values for a triangle on 0 to 0.7. With the peak at 0.30: mean 0.3333, share under 0.3 = 0.4286.
  // With the peak at 0.25: mean 0.3167, share under 0.3 = 0.4921. At 0.35: mean 0.3500, share 0.3673.
  const rng = E.makeRng(31337), lined = [], n = 200000;
  for (let i = 0; i < n; i++) lined.push(E.samplePhysics(rng).linedShare);
  const sorted = lined.slice().sort((a, b) => a - b), q = (p) => sorted[Math.floor(p * n)];
  const below = (x) => lined.filter((v) => v < x).length / n;
  assert.ok(Math.abs(mean(lined) - (0 + 0.3 + 0.7) / 3) < 0.0015, `mean ${mean(lined)}`);
  assert.ok(Math.abs(below(0.3) - 0.3 / 0.7) < 0.004, `share under 0.3: ${below(0.3)}`);
  assert.ok(Math.abs(below(0.2) - 0.2 * 0.2 / 0.21) < 0.003, `share under 0.2: ${below(0.2)}`);             // 0.1905
  assert.ok(Math.abs(below(0.4) - (1 - 0.3 * 0.3 / 0.28)) < 0.004, `share under 0.4: ${below(0.4)}`);       // 0.6786
  assert.ok(Math.abs(q(0.25) - Math.sqrt(0.25 * 0.21)) < 0.002, `lower quartile ${q(0.25)}`);               // 0.2291
  assert.ok(Math.abs(q(0.5) - (0.7 - Math.sqrt(0.5 * 0.28))) < 0.002, `median ${q(0.5)}`);                  // 0.3258
  assert.ok(Math.abs(q(0.75) - (0.7 - Math.sqrt(0.25 * 0.28))) < 0.002, `upper quartile ${q(0.75)}`);       // 0.4354
  // The variance too: (a2 + b2 + c2 - ab - ac - bc) / 18 = (0.09 + 0.49 - 0.21) / 18.
  const m = mean(lined), variance = mean(lined.map((v) => (v - m) * (v - m)));
  assert.ok(Math.abs(variance - 0.37 / 18) < 0.0003, `variance ${variance}`);
});

test("Normal draws are independent of each other and 68.3% fall within one standard deviation", () => {
  const rng = E.makeRng(271828), n = 400000, z = [];
  for (let i = 0; i < n; i++) z.push(E.normal(rng));
  const m = mean(z), sd = Math.sqrt(mean(z.map((v) => (v - m) * (v - m))));
  const within = (x) => z.filter((v) => Math.abs(v) < x).length / n;
  assert.ok(Math.abs(within(1) - 0.6827) < 0.003, `within 1 sd: ${within(1)}`);
  assert.ok(Math.abs(within(0.5) - 0.3829) < 0.003, `within half an sd: ${within(0.5)}`);
  assert.ok(Math.abs(within(2) - 0.9545) < 0.0015, `within 2 sd: ${within(2)}`);
  assert.ok(Math.abs(within(2.5) - 0.9876) < 0.0008, `within 2.5 sd: ${within(2.5)}`);
  // One draw says nothing about the next, or about the one after that; nor does its size.
  const corr = (lag, f) => { let s = 0; for (let i = 0; i + lag < n; i++) s += f(z[i]) * f(z[i + lag]); return s / (n - lag); };
  for (const lag of [1, 2, 3]) assert.ok(Math.abs(corr(lag, (v) => (v - m) / sd)) < 0.006, `lag ${lag} correlation ${corr(lag, (v) => (v - m) / sd)}`);
  assert.ok(Math.abs(corr(1, (v) => v * v - 1) / 2) < 0.006, "sizes of successive draws are unrelated");
  assert.ok(Math.abs(mean(z.map((v) => v * v * v * v)) - 3) < 0.06, "fourth moment 3");
  assert.ok(Math.abs(mean(z.map((v) => Math.pow(v, 6))) - 15) < 0.6, "sixth moment 15");
});

test("withFixed: false leaves out the fixed-physics run and changes nothing else", () => {
  const policies = [{ trigger: "never" }, { trigger: "always" }];
  const full = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true }));
  const lean = E.fromToday(history(), policies, {}, Object.assign({}, today, { physics: true, withFixed: false }));
  assert.strictEqual(lean.fixedPhysics, undefined);
  assert.strictEqual(lean.cases.likely.sampleFixed, undefined);
  assert.deepStrictEqual(lean.policies, full.policies);
  assert.deepStrictEqual(lean.physics, full.physics);
  assert.deepStrictEqual(lean.fan, full.fan);
});

// ---- A run that starts part-way through a year (found in the code audit) ----
test("a part-year does not squeeze a whole year's water into the weeks that are left", () => {
  // One whole dry year, and the same year with only its weeks from October on.
  const whole = scope(1, () => ({ pct: 30 }));
  const tail = Object.assign({}, whole, { weeks: whole.weeks.filter((w) => w.month >= 10) });
  const wholeYear = E.simulate(whole, { trigger: "never" }).years[0];
  const lateStart = E.simulate(tail, { trigger: "never" }).years[0];
  const weeksLeft = tail.weeks.filter((w) => w.month <= 10).length;                 // season weeks still to come
  assert.ok(lateStart.demandAf < wholeYear.demandAf * (weeksLeft + 1) / 39);        // about weeksLeft / 39 of a year
  assert.ok(lateStart.demandAf > 0);
});

test("from today: a run that starts in January covers five seasons, not six, and today's chance applies to this year", () => {
  const january = Object.assign({}, today, { startDate: "2026-01-10", pNow: 1 });   // certain drought this coming season
  const run = E.fromToday(history(), [{ trigger: "never" }], {}, january);
  const sample = run.cases.likely.sample[0];
  assert.strictEqual(sample.years.length, 5);
  assert.strictEqual(sample.years[0].year, 2026);
  assert.strictEqual(sample.years[4].year, 2030);
  // pNow = 1 means the first season still to come (2026) is always a dry library year (odd years here).
  for (const which of ["best", "likely", "worst"]) assert.strictEqual(run.cases[which].sourceYears[0] % 2, 1);   // the list is in year order, 2026 first
});

test("from today: a run that starts after the season covers the next five seasons", () => {
  const run = E.fromToday(history(), [{ trigger: "never" }], {}, today);              // 14 November 2026
  const years = run.cases.likely.sample[0].years.map((y) => y.year);
  assert.deepStrictEqual(years.filter((y) => y > 2026), [2027, 2028, 2029, 2030, 2031]);
});
