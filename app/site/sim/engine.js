/*
  engine.js: the "do nothing vs act" simulation. No drawing code, so it runs in the browser
  and in Node (for the tests in engine.test.js).

  THE IDEA
  The same weeks of weather and reservoir levels are run through several POLICIES. The water,
  the drought and the prices are identical for every policy. Only the decision differs:

    never     do nothing to the canals
    declared  wait until drought is officially severe (8 straight weeks at D2 or worse),
              then wait for the paperwork, then seal
    d1        seal before the season if the county is ALREADY in drought (D1 or worse)
    forecast  seal before the season if our 6-month forecast is at or over the warning line
    always    seal every year, whatever the forecast says

  EACH WEEK OF THE IRRIGATION SEASON
    1. Farms want  (a year's irrigation water) / (weeks in the season).
    2. The reservoirs decide how much of that is delivered (the "shortage curve" below).
    3. If canals were sealed in the last ~90 days, less water seeps away. That saved water
       only counts if there is a shortage to fill. Saved water in a full year earns nothing.
       It can also never be more than the water released that week: an empty canal saves nothing.
    4. Every acre-foot still missing costs the same crop revenue.

  Every number that is not measured is a parameter in DEFAULTS with a tag:
    "pipeline"   = comes from our own tested outputs
    "published"  = a figure from a named report
    "assumption" = our own choice; the page shows a slider for it
*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HGEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const GALLONS_PER_ACRE_FOOT = 325851;
  const FEET_PER_KM = 3280.84;
  const D1 = 2;   // drought classes are numbered 0 = none, 1 = D0, 2 = D1, 3 = D2, 4 = D3, 5 = D4
  const D2 = 3;

  const DEFAULTS = {
    budget:        { value: 100000, tag: "assumption", label: "Sealing budget per year ($)" },
    threshold:     { value: 0.25,   tag: "pipeline",   label: "Forecast warning line" },
    usdPerSqft:    { value: 0.004,  tag: "published",  label: "Sealant price per square foot ($, materials only)" },
    widthFt:       { value: 20,     tag: "assumption", label: "Wetted canal width (feet)" },
    cut:           { value: 0.575,  tag: "assumption", label: "Share of seepage the sealant stops (the middle of the published range, 28% to 87%)" },
    daysLast:      { value: 90,     tag: "published",  label: "Days one application lasts" },
    seasonStart:   { value: 2,      tag: "assumption", label: "Irrigation season starts (month)" },
    seasonEnd:     { value: 10,     tag: "assumption", label: "Irrigation season ends (month)" },
    decisionMonth: { value: 3,      tag: "pipeline",   label: "Month the pre-season decision is made" },
    fullAt:        { value: 50,     tag: "assumption", label: "Reservoirs at or over this % full: farms get all their water" },
    zeroAt:        { value: 15,     tag: "assumption", label: "Reservoirs at or under this % full: farms get none" },
    paperworkWeeks:{ value: 8,      tag: "assumption", label: "Weeks from a drought declaration to canal work starting" },
    reliefShare:   { value: 0.3,    tag: "assumption", label: "Share of farm losses later repaid as public relief" },
    jobsPerMillion:{ value: 16.95,  tag: "published",  label: "Jobs at risk per $1 million of crop revenue lost" },
    kmPerCrewDay:  { value: 6,      tag: "assumption", label: "Kilometres of canal one crew seals in a working day" },
    crews:         { value: 2,      tag: "assumption", label: "Crews working at the same time" },
    // One application lasts about 90 days and the season is about nine months, so three
    // applications are bought from March on (about 270 days of cover; February is not sealed). Each one is paid for in full.
    applications:  { value: 3,      tag: "assumption", label: "Sealant applications in a season you act (each lasts about 90 days)" },
    // The ranges samplePhysics() draws from (see PHYSICAL UNCERTAINTY below). Used only when a
    // run asks for physics; a plain run never reads them.
    cutLow:         { value: 0.28, tag: "published",  label: "Share of seepage the sealant stops: lowest in the published tests" },
    cutHigh:        { value: 0.87, tag: "published",  label: "Share of seepage the sealant stops: highest in the published tests" },
    seepShareLow:   { value: 0.5,  tag: "assumption", label: "Share of a district's canal loss that is seepage: lowest" },
    seepShareHigh:  { value: 0.9,  tag: "assumption", label: "Share of a district's canal loss that is seepage: highest" },
    widthMultLow:   { value: 0.5,  tag: "assumption", label: "Real wetted width as a multiple of the assumed width: lowest (no width is measured)" },
    widthMultHigh:  { value: 1.5,  tag: "assumption", label: "Real wetted width as a multiple of the assumed width: highest (no width is measured)" },
    linedShareLow:  { value: 0,    tag: "assumption", label: "Share of canal length already lined: lowest" },
    linedShareMode: { value: 0.3,  tag: "assumption", label: "Share of canal length already lined: most likely" },
    linedShareHigh: { value: 0.7,  tag: "assumption", label: "Share of canal length already lined: highest" },
  };

  /* Plain values out of DEFAULTS, with any overrides on top. */
  function makeParams(overrides) {
    const p = {};
    for (const key in DEFAULTS) p[key] = DEFAULTS[key].value;
    return Object.assign(p, overrides || {});
  }

  /* Share of irrigation water NOT delivered, from how full the reservoirs are (0 = none missing, 1 = all). */
  function shortage(pctFull, p) {
    if (pctFull == null) return 0;
    if (pctFull >= p.fullAt) return 0;
    if (pctFull <= p.zeroAt) return 1;
    return (p.fullAt - pctFull) / (p.fullAt - p.zeroAt);
  }

  /*
    The budget rule (the same rule the pipeline uses): pay for canals from the top of the list
    down, and STOP at the first canal the money left cannot cover.
    canals: [{ km, rate (gallons lost per square foot per day), ... }], already in priority order.
  */
  function fundCanals(canals, budget, p) {
    const funded = [];
    let spent = 0, km = 0, gallonsPerDay = 0;
    for (const canal of canals) {
      const sqft = canal.km * FEET_PER_KM * p.widthFt;
      const cost = sqft * p.usdPerSqft;
      if (spent + cost > budget) break;
      spent += cost; km += canal.km; gallonsPerDay += sqft * canal.rate;
      funded.push(canal);
    }
    return { funded, spent, km, gallonsPerDay };
  }

  /* Acre-feet a set of sealed canals stops leaking in a given number of days. */
  function savedAcreFeet(gallonsPerDay, days, cut) {
    return gallonsPerDay * days * cut / GALLONS_PER_ACRE_FOOT;
  }

  /* A draw from the standard Normal distribution (mean 0, standard deviation 1), by the
     Box-Muller method. It always takes two numbers from rng. */
  function normal(rng) {
    const u = 1 - rng(), v = rng();                     // 1 - rng() is in (0, 1], so the logarithm is finite
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /*
    PHYSICAL UNCERTAINTY. The plan's leak and cost figures rest on things nobody has measured:
    how wide the canals are, how much of their length is already lined, how much of a district's
    loss is seepage, and how well the sealant works here. samplePhysics() draws one possible
    set of answers. Every range is in DEFAULTS; only the sealant range is published.

    What is drawn:
      cut         share of seepage the sealant stops: uniform 0.28 to 0.87, the published range.
      widthMult   real wetted width / assumed width, one value for every canal: uniform 0.5 to
                  1.5 (opts.widthLow, opts.widthHigh), so its middle is the assumed width.
                  ASSUMPTION: no width is measured.
      linedShare  share of canal length already lined: triangular on 0 to 0.7, most likely 0.3.
                  ASSUMPTION.
      s           share of a district's canal loss that is seepage (the rest is evaporation and
                  spills): uniform 0.5 to 0.9. ASSUMPTION. Used only in the calibrated regime.
      seepMult    see the two regimes.
      widthMultByClass  only if opts.widthByClass = { class: [low ft, high ft] } is given: the same
                  position in each class's range, as a multiple of opts.baseWidthFt (default: the
                  assumed width). The engine does not use it yet; canals carry no class today.

    THERE ARE TWO REGIMES, and the draw says which one it is (regime, calibrated).

    "uncalibrated" (no opts.seepSd; this is today). Each canal's leak rate is a published rate
      for its soil. It is a rate, not a share of anybody's total loss, so the seepage share s
      has nothing to apply to: s is null and seepMult is 1. The water kept is scaled by
      widthMult x (1 - linedShare), because a wider canal leaks over more area and a lined
      stretch does not leak. The bill is scaled by widthMult.

    "calibrated" (opts.seepSd given, with rates the pipeline has fitted to each district's
      published loss). The district total already reflects whatever widths and lining really
      exist, so scaling by them again would count the same doubt twice. The water kept is
      scaled by seepMult = s x exp(Normal(0, sd)) only: s because the published loss also
      includes evaporation and spills, and sd for the fit's leftover spread. widthMult and
      linedShare are still drawn, but only widthMult is used, and only for the bill.

    In both regimes the bill scales with widthMult and never with linedShare: sealant is bought
    by area, for every stretch, because nobody knows which stretches are lined.

    The same rng and the same opts always give the same draw. It always takes six numbers from
    rng, in both regimes, so the other values do not depend on the regime.
  */
  function samplePhysics(rng, opts) {
    const o = opts || {}, D = DEFAULTS;
    const or = (v, fallback) => (v == null ? fallback : v);
    const uniform = (low, high) => low + (high - low) * rng();
    const calibrated = o.seepSd != null;
    const share = uniform(D.seepShareLow.value, D.seepShareHigh.value), z = normal(rng);
    const s = calibrated ? share : null;
    const seepMult = calibrated ? share * Math.exp(o.seepSd * z) : 1;
    const cut = uniform(D.cutLow.value, D.cutHigh.value);
    const widthLow = or(o.widthLow, D.widthMultLow.value), widthHigh = or(o.widthHigh, D.widthMultHigh.value);
    const where = rng();                                 // how far along the width range, shared by every class
    const widthMult = widthLow + (widthHigh - widthLow) * where;
    // Triangular distribution on [a, b] with its peak at c.
    const a = D.linedShareLow.value, b = D.linedShareHigh.value, c = D.linedShareMode.value, u = rng();
    const linedShare = u < (c - a) / (b - a) ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
    const draw = { regime: calibrated ? "calibrated" : "uncalibrated", calibrated, s, seepMult, cut, widthMult, linedShare };
    if (o.widthByClass) {
      const base = or(o.baseWidthFt, D.widthFt.value);
      draw.widthMultByClass = {};
      for (const cls in o.widthByClass) draw.widthMultByClass[cls] = (o.widthByClass[cls][0] + (o.widthByClass[cls][1] - o.widthByClass[cls][0]) * where) / base;
    }
    return draw;
  }

  /*
    The physics with every unknown at its MEDIAN: what "physics held fixed" means. Half of the
    draws of each unknown fall below its value here and half above, so the fixed bands sit in
    the middle of the sampled ones and differ from them in width, not in position.
    (For the lined share the median is not the most likely value: the range runs further above
    0.3 than below it. seepMult's median is taken as the median of s; the calibration spread
    multiplies by a factor whose median is 1.)
  */
  function centralPhysics(opts) {
    const o = opts || {}, D = DEFAULTS, calibrated = o.seepSd != null;
    const or = (v, fallback) => (v == null ? fallback : v);
    const s = (D.seepShareLow.value + D.seepShareHigh.value) / 2;
    const a = D.linedShareLow.value, b = D.linedShareHigh.value, c = D.linedShareMode.value;
    const linedShare = (c - a) / (b - a) >= 0.5 ? a + Math.sqrt(0.5 * (b - a) * (c - a)) : b - Math.sqrt(0.5 * (b - a) * (b - c));
    return { regime: calibrated ? "calibrated" : "uncalibrated", calibrated, s: calibrated ? s : null, seepMult: calibrated ? s : 1,
             cut: (D.cutLow.value + D.cutHigh.value) / 2,
             widthMult: (or(o.widthLow, D.widthMultLow.value) + or(o.widthHigh, D.widthMultHigh.value)) / 2, linedShare };
  }

  /*
    Run one policy through a list of weeks.

    scope:  { weeks: [{ year, month, cls, forecast, pct }], one entry per week, oldest first
              canals: priority-ordered list for fundCanals (the policy's own order is chosen below)
              canalsUnranked: the same canals in map order (used when policy.ranked is false)
              demandAf: acre-feet of irrigation water the scope wants in a full year
              revenueAtStake: crop revenue lost in a year with no irrigation water at all ($)
              physics: optional, a draw from samplePhysics(). Left out, nothing below changes. }
    policy: { trigger: "never" | "declared" | "d1" | "forecast" | "always", ranked: true/false }
    Returns { years: [one summary per year], totals }.
  */
  function simulate(scope, policy, overrides) {
    const p = makeParams(overrides);
    const valuePerAf = scope.demandAf > 0 ? scope.revenueAtStake / scope.demandAf : 0;
    const plan = fundCanals(policy.ranked === false ? scope.canalsUnranked : scope.canals, p.budget, p);
    const weeksActive = Math.ceil(p.daysLast / 7);
    // Physical uncertainty, only if the scope carries a draw. These rules are ASSUMPTIONS
    // (the two regimes are explained above samplePhysics):
    //   - The plan (which canals) is made at the assumed width; the real width changes the bill
    //     in proportion. So a round can cost more than the budget.
    //   - The bill does NOT shrink with the lined share: nobody knows which stretches are lined,
    //     so sealant is bought for all of it, and what goes on lined stretches saves nothing.
    //   - Water kept, uncalibrated: scales with widthMult x (1 - linedShare). The seepage share
    //     is not applied, because the rates are published rates, not a share of a total loss.
    //   - Water kept, calibrated: scales with seepMult only. Width and lining are already inside
    //     the district totals the rates were fitted to.
    //   - Either way the drawn sealant effect is used.
    const physics = scope.physics || null;
    const roundCost = physics ? plan.spent * physics.widthMult : plan.spent;
    const keepMult = !physics ? 1 : physics.calibrated ? physics.seepMult : physics.widthMult * (1 - physics.linedShare);
    const leakPerDay = physics ? plan.gallonsPerDay * keepMult : plan.gallonsPerDay;
    const cut = physics ? physics.cut : p.cut;

    // Group the weeks by year, keeping their order.
    const byYear = [];
    for (const week of scope.weeks) {
      if (!byYear.length || byYear[byYear.length - 1].year !== week.year) byYear.push({ year: week.year, weeks: [] });
      byYear[byYear.length - 1].weeks.push(week);
    }

    let d2Run = 0;   // straight weeks at D2 or worse so far (carries across years, like the real record)
    const years = byYear.map(({ year, weeks }) => {
      const inSeason = (w) => w.month >= p.seasonStart && w.month <= p.seasonEnd;
      // A year's irrigation water is spread evenly over the weeks of the season. For a whole
      // year that is the season weeks actually in it (39 or 40). A run can also start part-way
      // through a year; dividing by only the weeks that are left would squeeze a full year's
      // water into them, so a part-year is divided by a full season's weeks instead.
      const fullSeasonWeeks = Math.round((p.seasonEnd - p.seasonStart + 1) * 52 / 12);
      const wholeYear = weeks.length >= 50;
      const seasonWeeks = wholeYear ? (weeks.filter(inSeason).length || 1) : fullSeasonWeeks;
      const demandWeek = scope.demandAf / seasonWeeks;

      const out = { year, demandAf: 0, deliveredAf: 0, recoveredAf: 0, unmetAf: 0, savedAf: 0,
                    spend: 0, loss: 0, acted: false, actedWeek: null, warnedWeek: null,
                    declaredWeek: null, weeksD2: 0, weeksShort: 0, droughtSeason: false, weekly: [] };
      let sealedUntil = -1;       // index of the last week the sealant still works
      let workStartsAt = null;    // for the "declared" policy: the week the paperwork is done
      let decided = false;        // the pre-season decision is made once a year
      let applied = 0;            // sealant applications so far this year

      weeks.forEach((week, i) => {
        d2Run = week.cls != null && week.cls >= D2 ? d2Run + 1 : 0;
        if (week.cls != null && week.cls >= D2) out.weeksD2 += 1;
        if (d2Run >= 8) out.droughtSeason = true;
        if (out.warnedWeek == null && week.forecast != null && week.forecast >= p.threshold) out.warnedWeek = i;
        if (out.declaredWeek == null && d2Run >= 8) out.declaredWeek = i;

        // --- The decision. A policy may only look at this week and earlier weeks. ---
        let act = false, reapplied = false;
        if (!out.acted && plan.spent > 0) {
          const t = policy.trigger;
          // The pre-season decision is made in the decision month. If a run starts after the
          // season has ended (say in November), there is nothing to decide until next spring.
          if (!decided && week.month >= p.decisionMonth && week.month <= p.seasonEnd && (t === "forecast" || t === "d1" || t === "always")) {
            decided = true;
            if (t === "always") act = true;
            if (t === "forecast") act = week.forecast != null && week.forecast >= p.threshold;
            if (t === "d1") act = week.cls != null && week.cls >= D1;
          }
          if (t === "declared") {
            if (workStartsAt == null && d2Run >= 8) workStartsAt = i + p.paperworkWeeks;
            if (workStartsAt != null && i >= workStartsAt && week.month <= p.seasonEnd) act = true;
          }
        }
        if (act) {
          out.acted = true; out.actedWeek = i; out.spend += roundCost; applied = 1;
          sealedUntil = i + weeksActive - 1;
        }
        // A further application once the last one has worn off, if the plan allows it and the
        // season is still running. Each one is paid for in full.
        if (out.acted && !act && i === sealedUntil + 1 && applied < p.applications && inSeason(week)) {
          applied += 1; out.spend += roundCost; reapplied = true;
          sealedUntil = i + weeksActive - 1;
        }

        // --- The water. Identical for every policy except the "saved" line. ---
        let demand = 0, missing = 0, saved = 0, recovered = 0;
        if (inSeason(week)) {
          demand = demandWeek;
          missing = demand * shortage(week.pct, p);
          if (i <= sealedUntil) saved = savedAcreFeet(leakPerDay, 7, cut);
          saved = Math.min(saved, demand - missing);   // a canal cannot keep more water than was released into it
          recovered = Math.min(saved, missing);     // saved water is only worth something in a shortage
          if (missing > 0) out.weeksShort += 1;
        }
        out.demandAf += demand;
        out.deliveredAf += demand - missing;
        out.recoveredAf += recovered;
        out.unmetAf += missing - recovered;
        out.savedAf += saved;
        out.loss += (missing - recovered) * valuePerAf;
        out.weekly.push({ date: week.date, month: week.month, pct: week.pct, cls: week.cls, forecast: week.forecast,
                          demand, missing, recovered, saved, sealed: i <= sealedUntil,
                          spend: act || reapplied ? roundCost : 0, loss: (missing - recovered) * valuePerAf });
      });

      out.relief = out.loss * p.reliefShare;                       // public money paid AFTER the loss
      out.jobs = out.loss / 1e6 * p.jobsPerMillion;
      out.falseAlarm = out.acted && out.recoveredAf === 0;         // paid for sealing, no shortage to fill
      return out;
    });

    const totals = { spend: 0, loss: 0, relief: 0, recoveredAf: 0, savedAf: 0, unmetAf: 0, jobsWorstYear: 0,
                     yearsActed: 0, falseAlarms: 0, weeksD2: 0, weeksShort: 0 };
    for (const y of years) {
      totals.spend += y.spend; totals.loss += y.loss; totals.relief += y.relief;
      totals.recoveredAf += y.recoveredAf; totals.savedAf += y.savedAf; totals.unmetAf += y.unmetAf;
      totals.jobsWorstYear = Math.max(totals.jobsWorstYear, y.jobs);
      totals.yearsActed += y.acted ? 1 : 0; totals.falseAlarms += y.falseAlarm ? 1 : 0;
      totals.weeksD2 += y.weeksD2; totals.weeksShort += y.weeksShort;
    }
    totals.cost = totals.spend + totals.loss;                      // what the region pays in all: sealing + lost crops
    totals.publicMoney = totals.spend + totals.relief;             // what the public purse pays: sealing + relief
    const result = { policy, plan: { spent: roundCost, km: plan.km, canals: plan.funded.length }, years, totals };
    if (physics) {
      result.physics = physics;                                    // the draw this run used
      result.plan.overBudget = roundCost > p.budget;               // wider canals than assumed: a round costs more than the budget
    }
    return result;
  }

  /* A small seeded random number generator, so the same seed always gives the same futures. */
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /*
    Many possible futures. Each future is built by picking whole years from the real record
    (so droughts keep their real shape, and each year keeps the forecast the model really made).
    The first year leans dry or wet according to today's forecast: with chance pNow it is drawn
    from the years that had a drought season, otherwise from the years that did not.
    Every policy is run through the SAME futures.
    Returns, per policy, the list of totals (one per future), plus low / middle / high summaries.
  */
  function forward(scope, policies, overrides, options) {
    const opt = Object.assign({ years: 5, draws: 200, seed: 7, pNow: null }, options || {});
    const rng = makeRng(opt.seed);
    const record = {};                                  // year -> its weeks
    for (const w of scope.weeks) (record[w.year] = record[w.year] || []).push(w);
    const full = Object.keys(record).filter((y) => record[y].length >= 50).map(Number);
    const dryRun = simulate(scope, { trigger: "never" }, overrides);
    const dry = new Set(dryRun.years.filter((y) => y.droughtSeason).map((y) => y.year));
    const dryYears = full.filter((y) => dry.has(y)), wetYears = full.filter((y) => !dry.has(y));
    const pick = (list) => list[Math.floor(rng() * list.length)];

    const results = policies.map(() => []);
    for (let d = 0; d < opt.draws; d++) {
      const weeks = [];
      for (let n = 1; n <= opt.years; n++) {
        let source = pick(full);
        if (n === 1 && opt.pNow != null && dryYears.length && wetYears.length) {
          source = rng() < opt.pNow ? pick(dryYears) : pick(wetYears);
        }
        for (const w of record[source]) weeks.push(Object.assign({}, w, { year: n }));
      }
      const future = Object.assign({}, scope, { weeks });
      policies.forEach((policy, i) => results[i].push(simulate(future, policy, overrides).totals));
    }

    const quantile = (values, q) => {
      const sorted = values.slice().sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    };
    return policies.map((policy, i) => {
      const summary = {};
      for (const key of ["cost", "loss", "spend", "publicMoney", "recoveredAf"]) {
        const values = results[i].map((t) => t[key]);
        summary[key] = { low: quantile(values, 0.1), mid: quantile(values, 0.5), high: quantile(values, 0.9) };
      }
      return { policy, draws: results[i], summary };
    });
  }

  /*
    FROM TODAY, FORWARD. This is the simulation the platform shows first.

    What it LEARNS FROM: the "library", whole years of the real record that ended before the
    cut-off (2020). Each library year holds two things per week: the drought class, and how
    much the reservoirs rose or fell that week.

    Where it STARTS: today. The reservoirs start at today's live reading, and the first season
    leans dry or wet according to the forecast the frozen model makes from this week's data.

    How one future is built:
      1. For each coming year, pick a library year at random. For the first season, pick from
         the dry library years with chance pNow, otherwise from the wet ones.
      2. Storage starts at today's level and moves by that library year's weekly rises and falls.
      3. The forecast is not perfect. Before a season that turns out dry it warns with chance
         `recall`; before a season that turns out wet it still warns with chance `falseAlarm`.
         Both come from the frozen model's test on 2020 to 2025.
      4. Shocks (optional) push storage down or up at a chosen moment, in every policy alike.
    Every policy is run through the same futures.

    options: { startDate "YYYY-MM-DD", pctNow, pNow, years, draws, seed, cutoffYear,
               recall, falseAlarm, shocks: [{ year: 1.., month, points }], secondDryYear,
               physics: true | false (default false), physicsOptions: passed to samplePhysics(),
               withFixed: false leaves out the second run with physics held fixed (it halves the work) }
    Returns { policies: [{ policy, draws, summary, losesToNothing }], sample: [simulate() result
              per policy for the middle future], cases: { best, likely, worst } (three futures to
              watch, each { sample, sourceYears }), fan: weekly low / mid / high storage,
              libraryYears, dryYears }.
    losesToNothing: in how many futures this policy cost more in total than doing nothing
              (null if no policy in the list has the trigger "never").

    WITH physics: true, each future also gets ONE draw of the physical unknowns, made before the
    policy loop, so every policy in a future faces the same canals. The draws come from their
    own random stream, so the weather of each future is the same as with physics off. Added to
    the result:
      physics: { regime, calibrated, central, draws: [the draw of each future] }
      fixedPhysics: { policies: [{ policy, draws, summary, losesToNothing, overBudget }] }  the
              same futures with the physics held at its median values. The gap between the two
              sets of bands is the part of the spread that is physical uncertainty, not weather.
      overBudget on each policy: in how many futures it sealed and a round cost more than the
              budget, because the canals were wider than assumed.
      cases[...].sampleFixed: the future to watch, run with the physics at its median values.
    Note that the median physics is not the plain run. Uncalibrated, it takes about a third of
    the length as lined, so it keeps about two thirds of the water a plain run does.
  */
  function fromToday(scope, policies, overrides, options) {
    const opt = Object.assign({ years: 5, draws: 300, seed: 11, pNow: 0.3, pctNow: 50, cutoffYear: 2020,
                                recall: 0.9, falseAlarm: 0.3, shocks: [], secondDryYear: false,
                                physics: false, physicsOptions: null, withFixed: true }, options || {});
    const rng = makeRng(opt.seed);
    const WEEK = 7 * 864e5;

    // The library: full years before the cut-off.
    const record = {};
    for (const w of scope.weeks) if (w.year < opt.cutoffYear) (record[w.year] = record[w.year] || []).push(w);
    const libraryYears = Object.keys(record).map(Number).filter((y) => record[y].length >= 50);
    const library = {};
    for (const y of libraryYears) {
      const weeks = record[y];
      let run = 0, dry = false;
      const rows = weeks.map((w, i) => {
        run = w.cls != null && w.cls >= D2 ? run + 1 : 0;
        if (run >= 8) dry = true;
        const before = i > 0 ? weeks[i - 1].pct : null;
        return { cls: w.cls, change: w.pct != null && before != null ? w.pct - before : 0 };
      });
      library[y] = { rows, dry };
    }
    const dryYears = libraryYears.filter((y) => library[y].dry), wetYears = libraryYears.filter((y) => !library[y].dry);
    const pick = (list) => list[Math.floor(rng() * list.length)];

    // The calendar: one entry a week from the start date to the end of the last simulated year.
    const start = new Date(opt.startDate + "T12:00:00Z").getTime(), startYear = new Date(start).getUTCFullYear();
    // Which year holds the first season still to come: this year if the start date is before
    // the season ends, otherwise next year. Today's forecast (pNow), the second-dry-year option
    // and the shocks are all counted from that season, and the run covers opt.years seasons.
    const seasonEndMonth = makeParams(overrides).seasonEnd;
    const firstSeason = new Date(start).getUTCMonth() + 1 <= seasonEndMonth ? 0 : 1;
    const lastYear = startYear + firstSeason + opt.years - 1;
    const calendar = [];
    for (let t = start; new Date(t).getUTCFullYear() <= lastYear; t += WEEK) {
      const d = new Date(t), jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
      calendar.push({ date: d.toISOString().slice(0, 10), year: d.getUTCFullYear(), month: d.getUTCMonth() + 1,
                      weekOfYear: Math.min(51, Math.floor((t - jan1) / WEEK)) });
    }

    // Physics has its own stream of random numbers, so switching it on does not change the weather.
    const physicsRng = opt.physics ? makeRng((opt.seed ^ 0x9E3779B9) >>> 0) : null;
    const central = opt.physics ? centralPhysics(opt.physicsOptions) : null;
    const results = policies.map(() => []), resultsFixed = policies.map(() => []), futures = [], physicsDraws = [];
    // In how many futures a policy sealed and a round cost more than the budget (physics on only).
    const overBudget = policies.map(() => 0), overBudgetFixed = policies.map(() => 0);
    const paidOver = (run) => (run.plan.overBudget && run.totals.yearsActed > 0 ? 1 : 0);
    for (let n = 0; n < opt.draws; n++) {
      const source = {}, warned = {};
      for (let y = startYear; y <= lastYear; y++) {
        const season = y - startYear - firstSeason;         // 0 = the first season still to come, 1 = the one after
        let from = pick(libraryYears);
        if (dryYears.length && wetYears.length) {
          if (season === 0) from = rng() < opt.pNow ? pick(dryYears) : pick(wetYears);
          if (season === 1 && opt.secondDryYear) from = pick(dryYears);
        }
        source[y] = from;
        warned[y] = library[from].dry ? rng() < opt.recall : rng() < opt.falseAlarm;
      }
      let pct = opt.pctNow;
      const hit = new Set();
      const weeks = calendar.map((c, i) => {
        const row = library[source[c.year]].rows[Math.min(c.weekOfYear, library[source[c.year]].rows.length - 1)];
        if (i > 0) pct += row.change;
        for (const shock of opt.shocks) {                    // each shock hits once, in its month
          if (!hit.has(shock) && c.year === startYear + firstSeason + shock.year - 1 && c.month === shock.month) { hit.add(shock); pct += shock.points; }
        }
        pct = Math.max(0, Math.min(100, pct));
        return { date: c.date, year: c.year, month: c.month, cls: row.cls, forecast: warned[c.year] ? 1 : 0, pct };
      });
      const future = Object.assign({}, scope, { weeks });
      future.sourceYears = Object.keys(source).map((y) => source[y]);   // the real years this future borrows, in order
      if (opt.physics) {
        future.physics = samplePhysics(physicsRng, opt.physicsOptions);   // once per future, before the policy loop
        physicsDraws.push(future.physics);
        if (opt.withFixed) {
          const fixed = Object.assign({}, future, { physics: central });
          policies.forEach((policy, i) => { const run = simulate(fixed, policy, overrides); resultsFixed[i].push(run.totals); overBudgetFixed[i] += paidOver(run); });
        }
      }
      futures.push(future);
      policies.forEach((policy, i) => { const run = simulate(future, policy, overrides); results[i].push(run.totals); if (opt.physics) overBudget[i] += paidOver(run); });
    }

    const quantile = (values, q) => {
      const sorted = values.slice().sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    };
    // Low, middle and high of each total across the futures, and how often a policy loses to doing nothing.
    const nothing = policies.findIndex((policy) => policy.trigger === "never");
    const summarise = (all, over) => policies.map((policy, i) => {
      const summary = {};
      for (const key of ["cost", "loss", "spend", "publicMoney", "recoveredAf"]) {
        const values = all[i].map((t) => t[key]);
        summary[key] = { low: quantile(values, 0.1), mid: quantile(values, 0.5), high: quantile(values, 0.9) };
      }
      const entry = { policy, draws: all[i], summary,
                      losesToNothing: nothing < 0 ? null : all[i].filter((t, k) => t.cost > all[nothing][k].cost).length };
      if (over) entry.overBudget = over[i];
      return entry;
    });
    // Line the futures up from mildest to harshest by what doing nothing costs, then pick three
    // to show: a mild one (9 in 10 are harsher), the middle one, and a harsh one (9 in 10 are milder).
    const order = results[0].map((t, i) => [t.cost, i]).sort((a, b) => a[0] - b[0]);
    const at = (q) => order[Math.min(order.length - 1, Math.floor(q * order.length))][1];
    const middle = at(0.5);
    const showCase = (index) => {
      const shown = { sample: policies.map((policy) => simulate(futures[index], policy, overrides)), sourceYears: futures[index].sourceYears };
      // With physics on, the same future again with every unknown at its median: one fixed thing to draw.
      if (opt.physics && opt.withFixed) shown.sampleFixed = policies.map((policy) => simulate(Object.assign({}, futures[index], { physics: central }), policy, overrides));
      return shown;
    };
    const out = {
      cases: { best: showCase(at(0.1)), likely: showCase(middle), worst: showCase(at(0.9)) },
      policies: summarise(results, opt.physics ? overBudget : null),
      sample: policies.map((policy) => simulate(futures[middle], policy, overrides)),
      fan: calendar.map((c, i) => {
        const values = futures.map((f) => f.weeks[i].pct);
        return { date: c.date, low: quantile(values, 0.1), mid: quantile(values, 0.5), high: quantile(values, 0.9) };
      }),
      libraryYears, dryYears,
    };
    if (opt.physics) {
      out.physics = { regime: central.regime, calibrated: central.calibrated, central, draws: physicsDraws };
      if (opt.withFixed) out.fixedPhysics = { policies: summarise(resultsFixed, overBudgetFixed) };
    }
    return out;
  }

  return { DEFAULTS, makeParams, shortage, fundCanals, savedAcreFeet, simulate, forward, fromToday, makeRng,
           normal, samplePhysics, centralPhysics, GALLONS_PER_ACRE_FOOT, FEET_PER_KM };
});
