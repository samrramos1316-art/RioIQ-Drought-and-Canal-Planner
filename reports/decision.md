# Decision record: choices fixed before the final run

**Written:** Saturday Nov 14, 2026, 7:20 AM PT. Committed before the final run that writes `metrics.json` with `is_final: true`.

## What this file is for

It lists every choice that could change the results, fixed in writing before the final numbers are produced. After this commit, nothing below is changed, whatever the final run shows.

## An honest statement about what we had already seen

These choices were **not** made blind. The design was chosen after exploratory runs on the same test years (the scripts in `notebooks/`), and provisional runs of this code had already shown test-year results. So the test years are not a perfectly untouched sample. What we can say is:

- No setting was changed after seeing a test-year result from this code.
- The 4-week alarm threshold was picked on validation years only (a test proves it never sees test rows).
- The outlook threshold of 0.25 follows from the cost rule. It was not tuned.

## Fixed choices

**Scope.** Rio Grande counties: a county is in if its center is within 50 km of the river (31 counties). Models are trained on these counties only. The Colorado, Missouri, Mississippi and Ohio are a transfer test.

**Target.** Severe drought: class D2 or worse on the U.S. Drought Monitor, worst class anywhere in the county.

**Cost rule.** Cost = 3 x missed + false alarms. The 3 is our assumption.

| Product | Model and settings | Inputs | Trained on |
|---|---|---|---|
| 4-week alert | Random forest classifier: 100 trees, depth 12, leaf 100, `sqrt` features, balanced class weights, seed 0 | Set H (24 history inputs) | Rio Grande rows, 2000 to 2014 |
| 6-month outlook | Random forest classifier: 80 trees, depth 10, leaf 20, `sqrt` features, seed 0 | Sets H + L + E | Rio Grande rows, forward chaining |
| 12-month outlook | Random forest regressor: 80 trees, depth 10, leaf 20, `sqrt` features, seed 0 | Sets H + L | Rio Grande rows, forward chaining |

**Splits.**

- 4-week alert: train on 2000 to 2014, pick the threshold on 2015 to 2018, test on 2019 to the last labeled week of 2026. A row belongs to a block only if its whole 4-week answer window ends inside it.
- Outlooks: for each test year from 2008 to 2025, train only on rows whose answer window ended before January 1 of that year.

**Thresholds.**

- 4-week alert: **0.36**, the cheapest of the values 0.01, 0.02, ... 1.01 on the Rio Grande validation rows.
- 6-month outlook: 0.25, the break-even point when a miss costs 3 false alarms.

**Baselines the system must beat.**

- 4-week alert: Persistence, D1 now, Worsening, Calendar. The honesty check compares the system with the cheapest of them, not only with persistence.
- 6-month outlook: Persistence, D1 now, Usual for the county, Always warn, Never warn.
- 12-month outlook: Same as now, Same as the last 52 weeks, Usual for the county.

**Extra inputs are ablations only.** River flow and snowpack are tested as extra inputs, with and without, on the same rows. They do not become part of the system whichever way the test falls, because the inputs above were fixed first.

## Validation numbers behind the 4-week threshold

Rio Grande rows, validation years 2015 to 2018 (6,324 county-weeks). Lower cost is better.

| Policy | Cost |
|---|---|
| Our system at threshold 0.36 | 636 |
| Worsening | 655 |
| Persistence | 715 |
| D1 now | 933 |
| Calendar (it chose "never warn") | 3,651 |

These numbers come from `reports/alert_run.txt`.

## Choices made while building, each before seeing its own test result

- The threshold search uses a plain grid from 0.01 to 1.01.
- The Calendar baseline picks its threshold per river, on that river's validation rows.
- One outlook file holds both outlooks, so only issue dates whose full 52-week future is known are scored.
- Flow and snowpack percentiles compare each date with all earlier years back to 1990.
- Snow stations are chosen by rule: SNOTEL stations in hydrologic units 1301 and 1302 with records starting before 1990.

## What will be reported, whichever way it falls

- `honesty_check_pass` for the 4-week alert.
- `beats_every_baseline` for both outlooks.
- The onset result, the transfer result on each river, and the flow and snowpack ablations.

## Addendum, written after the final run (Nov 14, 2026)

This section was added after the final run. Nothing above was edited.

**What "fixed before the final run" does and does not mean.** This record was committed about two minutes before the final run, but after a provisional run of the same code had already shown test-year results. The model settings, inputs and targets came from exploratory scripts in `notebooks/`, which tried several horizons, targets and input sets on the same 2008 to 2025 test years. So this is a record of what was frozen for the final run. It is not a blind pre-registration.

**What an outside review and our own checks found afterwards** (all numbers are in `reports/robustness.json`):

- **No leakage was found.** Features, labels, splits and thresholds were checked and are clean.
- **6-month outlook:** its win over the "D1 or worse now" rule depends on the random seed. Across 10 seeds it beat that rule 3 times. Treat it as a tie.
- **4-week alert:** it beat the Worsening rule with 8 of 10 seeds. A rule that was not in our list, "D2 now, or D1 and worse than 4 or 8 weeks ago", costs 1,840 on the test years against 1,912 for the system, and it was also cheaper on the validation years (622 against 636).
- **12-month outlook:** it beat our three listed baselines with all 10 seeds. But the plain average of two of them ("same as now" and "same as the last 52 weeks") is off by 13.21 weeks, against 14.00 for the system.
- **100 km county rule (53 counties):** the 4-week alert narrowly loses to the Worsening rule (3,269 against 3,243). Both outlooks still beat their listed baselines.
- **El Nino timing:** the 6-month outlook uses a value NOAA publishes a few days into the month, around the days the outlook is issued.

The system was not changed in response to any of this. Changing it now would be tuning on the test years.

## Pivot: canal action (written Nov 14, 2026, before the first run of the reservoir forecast or the trigger test in this code)

The project now asks a decision question: before the irrigation season, should a district seal its leakiest canals this year? Nothing above changes. The settings below were fixed before this code produced any result.

**What we had already seen.** A sandbox run of the trigger test on the existing forecast, before this section was written: issued January to March, the forecast caught 93% of drought seasons and the "D1 or worse now" rule caught 92%. So we expected a tie for the existing forecast. The reservoir forecast had never been run.

**Reservoir forecast (`p_season_res`).** The same 6-month forest with the same settings, trained on Rio Grande rows with the same forward chaining. Inputs are H + L + E plus five reservoir inputs (set R): percent full, its change over 12 and 52 weeks, its rank against the same calendar month in earlier years (back to 1990), and a flag for whether the county has a reservoir. The existing forecast `p_season` is not changed, and the reservoir forecast does not replace it whichever way the test falls.

**County-to-reservoir table.** Ten Texas counties from Val Verde to Cameron use Amistad-Falcon (the two lakes summed). Sierra, Dona Ana, El Paso and Hudspeth use Elephant Butte. The other 17 counties have none. This table is our assumption.

**Trigger test.** Rio Grande rows of the outlook test years, issued in January, February or March. Five rules: our forecast at 0.25, our forecast with reservoirs at 0.25, D1 or worse now, D2 or worse now, seal every year. Value = (drought seasons caught - cost ratio x times fired) / rows, for cost ratios 0.02, 0.05, 0.10, 0.18, 0.25 and 0.50. A forecast "beats the D1 rule" only if its value is higher at cost ratio 0.25.

**Losses.** USDA crop insurance payouts for the cause "Drought", the 31 counties, 2000 to 2025, not adjusted for inflation. "Failure of Irrigation Supply" is reported on its own line and is not in the total.

**What will be reported, whichever way it falls:** both `beats_d1_rule` flags, the 6-month cost with and without reservoir inputs, and the trigger table for the 14 reservoir counties alone.

**Canal map (added later on Nov 14).** Canal and ditch lines for the 31 counties from the U.S. Geological Survey's National Hydrography Dataset (feature type 336). It is a map and a count of km per county. It is not a model input and no result depends on it.

**Canal priority (added later on Nov 14).** A rule, not a trained model: a canal segment is "Inspect first" when the 6-month forecast warns for its county (0.25 or more) and the soil under it is loam or sandier (a published seepage rate of 7.48 gallons per square foot per day or more). Soil comes from the USDA soil survey at the segment's middle point, about 1 meter down. Seepage rates come from Fipps (Texas A&M, 1998). The two cut-offs (0.25 and 7.48) were fixed before the first run. After the first run showed that 6,400 km of canal sat on sandy soils missing from the main table, we added the report's own figures for sand (the low end of its range, 9.34) and for sandy clay loam (one measured canal, 1.69). That raised "Inspect first" from 551 km to 1,421 km. The rule was not tested against measured leaks, because we have none.

## Version 2 (written Nov 14, 2026, before the first run of `v2.py`)

Version 1 above stays as it is and stays the reported system. Version 2 is a second forecast for the Rio Grande that tries to improve on it. It is reported whichever way it falls.

**Why this is not blind.** We have already seen version 1's test-year results. The ideas below came from them: the outside review showed that a simple rule matched the 4-week alert and that an average of two baselines beat the 12-month outlook. So the list of candidates is informed by the test years. What is protected is the choice among them: no candidate is ever chosen using a year it is then scored on.

**Candidates** (the same list for all three products):

- Forest settings: version 1's own, the same with 300 trees, a shallower forest, and a deeper forest.
- Inputs: version 1's own, or the same plus five weather inputs (rain over the last 3, 6 and 12 months against normal, and temperature over the last 3 and 12 months against normal, from NOAA's county record, lagged two months for publication).
- Blend: the forest alone, or 75% or 50% forest with the rest given to a simple rule, or the simple rule alone. The simple rules are "D1 or worse now" (6-month), the average of "same as now" and "same as the last 52 weeks" (12-month), and "Worsening" over 4 weeks or over 4 or 8 weeks (4-week).

**How one is chosen.**

- Outlooks: for each test year from 2008 to 2025, every candidate is scored on the earlier years whose answers were fully known before January 1, and the cheapest is used for that year. Candidates are forecast from 2005 (the first year the 12-month forest has any training rows), only to give the early years some past to judge on. Ties go to version 1.
- 4-week alert: each candidate's threshold is picked on the validation years 2015 to 2018, and the candidate with the lowest validation cost is used. The test years are scored once.
- The 6-month threshold stays 0.25. Cost stays 3 x missed + false alarms.

**What will be reported:** version 2 against version 1 and against the best simple rule for each product, which candidate was chosen each year, the weather inputs on their own, and the result across 5 random seeds. If version 2 is worse, that is what we report.

**Version 2 results (added after the run; nothing above was edited except the start year, 2004 to 2005, fixed before any result existed because the 12-month forest has no training rows for 2004).** All numbers are in `reports/v2.json`.

| Product | Version 1 | Version 2 | Best simple rule | Seeds where v2 beat v1 |
|---|---|---|---|---|
| 4-week alert (cost) | 1,912 | 1,742 | 1,840 | 5 of 5 |
| 6-month outlook (cost) | 2,324 | 2,433 | 2,382 | 3 of 5 |
| 12-month outlook (weeks off) | 14.00 | 13.46 | 13.21 | 5 of 5 |

- **4-week alert: improved.** The validation years chose a deeper forest with weather inputs, blended 75% forest and 25% the "worsening over 4 or 8 weeks" rule. It beats version 1 and the best simple rule. Two cautions: the choice rests on 4 validation years, and that simple rule came from a review made after the test results were known.
- **6-month outlook: not improved.** Choosing by past years did worse than version 1. Version 1 stays, and it still only ties the "D1 or worse now" rule.
- **12-month outlook: better than version 1, but not better than the simple rule.** In 14 of 18 years the past chose the simple rule alone over any forest. The honest reading is that the average of two baselines is the better 12-month forecast.
- **Weather inputs alone did not help** any product (4-week 2,050; 6-month 2,559; 12-month 14.12).

Nothing was changed after seeing these results.

## Districts and the sealant plan (added Nov 14, 2026)

A rule, not a trained model. It adds two links to the canal chain: which irrigation district each canal lies inside, and how an example sealant budget is shared out.

- **Boundaries:** active Irrigation, Water Control & Improvement and Water Improvement districts from the Texas Commission on Environmental Quality, for the Texas Rio Grande counties. A district is listed if it holds at least 5 km of mapped canal (30 districts). We found no public boundary file for New Mexico or Colorado districts, so those states are not covered.
- **District risk:** the 6-month forecast of the district's counties, weighted by canal km. Warning at 0.25, Watch at half of that.
- **Sealant rule:** canals inside a district are ranked by seepage rate x chance of a drought season. The budget pays for canals from the top down. Drains and canals on soil with no published rate are left out.
- **Assumptions, none measured:** every canal is bare earth, has 20 feet of wetted width and carries water for 90 days. The budget ($100,000) is an example. The sealant price ($0.004 per square foot, materials only), its effect (28% to 87% less seepage) and its life (about 3 months) are the same published figures the app's calculator uses.
- **Not tested:** there are no measured leaks or lining records to check the plan against. The rule and its figures were fixed before the first run and not changed after it.

## Live refresh (added Nov 14, 2026)

A daily job downloads the newest drought map, El Nino index, reservoir readings and (monthly) weather, then reruns everything with the same code and settings. Two honest notes:

- **Scores can move.** Each new week gives a few more weeks their real answer, so test-year numbers can shift slightly from one refresh to the next. No model, input, threshold or rule is changed by a refresh.
- **Different computers give slightly different forests.** The first run on GitHub's computer gave version 2 of the 4-week alert a cost of 1,739, against 1,742 on the laptop that produced the numbers above. The cause is rounding inside the forest training, not a change in data or code. The job's own check caught the mismatch and saved nothing. Since then a refresh always reruns version 2 and the export on the same computer, so every published number comes from one run.
- **What moved when GitHub's computer took over (Nov 15, 2026).** The same data and code gave: 6-month outlook cost 2,328 (2,324 on the laptop), version 2 of the 4-week alert 1,739 (1,742), and version 2 of the 6-month outlook won with 2 of 5 seeds (3 of 5). The 4-week alert (1,912), the 12-month outlook (14.0 weeks), the canal levels and the sealant plan did not change. No conclusion changed: the 6-month outlook still ties the "D1 or worse now" rule (2,382). The seed checks in `reports/robustness.json` were run on the laptop and were not rerun.

## Evaluation round 3 (written Nov 15, 2026, before any item below was scored)

Version 1 and its baseline list are unchanged and remain the reported system. Scoring is frozen at 2026-11-10. Added, and labelled as added: year-block intervals (10,000 draws, seed 0); a March-only trigger test; in-fold calibration; the rules "D0 now" and "class-conditional frequency"; an allocation backtest (k = 3, 5, 8, 10, 15; rules A and B as defined in ARCHITECTURE.md); daily inputs lagged 7 days; boosting and a GRU chosen on validation years only; a holdout of six named rivers scored once; a weekly prospective log. The test years are not blind: earlier runs used them. A result counts as a win only if its interval excludes zero. Everything is reported whichever way it falls.

**Physical model, declared at the same time.** Seepage is recomputed from soil-survey permeability, with one factor fitted to the 1998 district loss figures. It is tested by leaving each district out in turn, against two rivals (canal length alone, and the old texture table), each with its own fitted factor. It passes only if a bootstrap over districts of (rival error minus model error) excludes zero. The model is not adjusted after that result is seen.

**What was already known when this was written.** On the machine used for this round (macOS, Python 3.13, the pinned library versions) the unchanged version 1 code gives a 4-week cost of 1912, a 6-month cost of 2324 and a 12-month error of 14.0 weeks. The committed `reports/metrics.json`, produced by the GitHub runner, has 2328 for the 6-month cost. Same code and same data, so the 4-point difference comes from the machine. No round-3 item had been run.

## Physical model: choices fixed on Nov 15, 2026 after the soil download and before any calibration or held-out test was run

The soil download showed two things, written here before the model is fitted or tested so that neither can be adjusted afterwards.

**What was seen.** Permeability exists for 11,710 of 12,171 canal segments. Its spread across soil textures is about 1,400 times (clay to sand), against about 7 times in the 1946 texture table, and the two orderings agree with a rank correlation of 0.70 across texture classes. A water-table depth is recorded for 3,924 segments (0 to 168 cm) and is missing for 8,247.

**What is fixed now.**
- Primary model (M1): seepage = permeability x 2.1205 x water-table factor x one fitted factor, as specified in ARCHITECTURE.md sections 4.1 and 4.3. A missing water-table depth is read as "no water table found in the surveyed profile" and gets a factor of 1. That reading is our assumption.
- Sensitivity model (M2): the same without the water-table factor. It is reported beside M1 whichever does better; it does not replace M1.
- Rivals, each with its own single fitted factor inside the same leave-one-district-out loop: canal length alone, and the 1946 texture table.
- Canal width by class and the lined share are assumptions with ranges (section 4.2). They are not fitted.
- The test, its metric (median absolute percent error on the held-out district, and rank correlation) and its pass rule (a bootstrap over districts of rival error minus model error must exclude zero) are those already declared above. With 18 districts the interval will be wide.
- Known weakness, stated before the result: one fitted factor can move the level of modelled seepage but not its spread, so canals on sand will dominate any ranking built on M1 or M2. If the held-out test does not pass, the site keeps the ranking order only as an illustration and says the volumes are not reliable.
- Nothing here is changed after the held-out result is seen.

**Canal classes, fixed on Nov 15, 2026 before any fit (added after the class distribution was seen, before any calibration or held-out result existed).** Names and map kinds cannot tell a main canal from a lateral: 93% of district segments have no name and nearly all matched ones are simply "canal". So a fourth class, "unknown", is used instead of guessing. Wetted width is an assumption in every class: main 20 to 40 ft (middle 30), lateral 8 to 20 ft (middle 14), ditch 3 to 8 ft (middle 5.5), unknown 8 to 40 ft (middle 20, the value the project used for every canal before). The fit uses the middle of each range. Because about 93% of district segments are "unknown", the classes change little; that is stated on the site rather than hidden.

## Seepage test: result and what follows (written Nov 15, 2026, after the held-out test was run once)

The test was run once, as declared, and it did not pass. The result is in `reports/frozen/round3/seepage_calibration.json` and its erratum, and is not changed by anything written here.

- **The result.** On held-out districts the permeability model (M1) had a median error of 32.7%, against 36.5% for canal length alone. The interval for the difference of the two medians runs from -0.165 to +0.279, so it includes zero. By the rule fixed above, the model did not predict held-out district losses better than canal length. The 1946 texture table (31.3%) and the model without the water-table factor (M2, 28.3%) are not separated from the others either.
- **Volumes are not reliable.** No acre-foot or dollar figure built on this model is a result. Where the site shows volumes they are illustrations of the arithmetic, and it must say so.
- **The test does not support the ranking either.** Canal length alone puts the districts in nearly the right order: a rank correlation of 0.92 between length and loss. Most of every model's rank correlation is therefore district size. With size taken out, M1's rank correlation is 0.62, with an interval from 0.07 to 0.92, on 14 districts. These three figures come from the checker's recomputation after the result was known. They are descriptive only, they were not declared in advance, and they are not in the frozen file (which reports held-out rank correlations of 0.89 for M1 and 0.90 for length).
- **The water-table factor made the model worse.** M1, which has it, had a higher median held-out error than M2, which does not (32.7% against 28.3%). That difference was not tested and is not claimed as a finding. M1 stays the primary model because it was declared as such; M2 does not replace it.
- **Districts.** 14 districts were fitted, not the 18 expected: four names in the 1998 table have no match in the district map under the no-guess rule, and one matched district has no authorised water. "Adams Garden" is one letter away from the map's "Adams Gardens Irrigation District 19". It was left unmatched by the no-guess rule before the run, and it was not added after the result was seen.
- **What follows.** Nothing is recalibrated, refitted or rerun. No width, factor, segment set or rule is changed in the light of this result. The site stays uncalibrated: the sealant plan and the canal ranking it shows are the ones built before this test, and the fitted factors are not applied to them.

## Declared but not run (written Nov 15, 2026)

The round-3 declaration above names five items that had not been done when this section was written. Their status then:

- **Daily inputs lagged 7 days.** Not built. Not run. No result.
- **Gradient boosting chosen on validation years.** Not built. Not run. No result. If a boosting comparison is run later today it gets its own declaration below, written before its code.
- **A GRU chosen on validation years.** Not built. Not run. No result.
- **A holdout of six named rivers, scored once.** Not built. Not run. No result.
- **A weekly prospective log.** Not built. No forecast had been logged, so nothing can be scored from it yet.

Nothing in the reported results depends on any of these. They were declared and not delivered.

## Round 3: two results stated more completely (written Nov 15, 2026, after the results; every number is from the frozen files)

Two results in `reports/frozen/round3/` were reported too briefly. Nothing is rerun or changed here.

- **Budget ranking (`allocation.json`, averaged over k).** The forecast against rule B: +0.020, interval 0.001 to 0.046, 18 years. That interval excludes zero, so by the declared standard the forecast is ahead of rule B on the k-average. Two cautions belong with it: it is one of several comparisons made on the same years (the allocation file alone holds twelve against a named rule: rules A and B at five budgets and on the average), and a percentile interval from 18 years runs narrow. The forecast against rule A: +0.015, interval -0.003 to 0.035, not separated. Against the better of the two rules, picked after both were seen, it is not separated either.
- **4-week alert against "D1 now" (`intervals_v1.json`).** System cost 1,912 against 2,333, a difference of -421 over 8 years. With single-year blocks the interval is -884 to 11, which includes zero: not separated. With two-year blocks it is -723 to -146, which excludes zero: system better. The two disagree. Both are shown, and neither was declared as the primary one, so this comparison is reported as unsettled rather than as a win.

## Gradient boosting comparison: declared Nov 15, 2026, before any of its code was written or run

A cheap version of the model comparison in ARCHITECTURE.md section 3.6. No GRU. Declared here first; the commit that adds this section comes before the commit that adds the code.

- **What is compared.** The 6-month outlook only. A gradient-boosting classifier against the frozen version 1 forest, and against the simple rule "D1 or worse now".
- **The model.** scikit-learn `HistGradientBoostingClassifier` with its default settings and `random_state=0`. Nothing is tuned: no settings are tried, and none are chosen on any year.
- **Same inputs and same splits as the forest.** The same input list (history, long memory and El Nino), trained on Rio Grande counties only, with the same forward chaining: for each test year from 2008 to 2025 the model is trained only on rows whose 26-week answer was fully known before 1 January of that year. Scoring is cut off at 2026-11-10, and the rows scored are exactly the Rio Grande rows in the frozen outlook file.
- **Same alarm rule as the forest.** Warn when the probability is 0.25 or more. That is the fixed break-even threshold used everywhere in this project; it is not chosen on any data, past or present.
- **The outcome.** The cost rule (3 x missed + false alarms) summed over the scored rows: boosting cost minus the frozen forest's cost, and boosting cost minus the "D1 now" rule's cost, each with a year-block bootstrap (10,000 draws, seed 0; single years, and adjacent pairs of years). Lower is better.
- **What counts as a win.** Only an interval that excludes zero, by the direction label already used in round 3. A tie or a loss is reported as plainly as a win.
- **Once.** It is run one time. After any number is seen only a crash may be fixed. The forest stays the reported system whatever the result.
- **What was already known when this was written.** The frozen forest costs 2,324 and "D1 now" 2,382 on these rows. No boosting model had been trained on this data.

## What the frozen gate does and does not stop (written Nov 15, 2026)

`reports/frozen.sha256` lists the hash of every scored file, and `python -m farmdrought.manifest frozen` checks the files against it. That local command compares the working tree with itself. It catches an accident, such as a script that rewrites a scored file. It does not stop someone who changes a scored file and its hash line in the same commit, or who deletes the list and builds it again. The barrier against that is in CI: a step that compares the list with the list on the base branch and fails if any line that was there has changed or gone (`tools/hash_list_gate.py`). That step has not yet run on GitHub.

## Three corrections to wording above (written Nov 15, 2026; the earlier sections are left as they were)

- **"The water-table factor made the model worse."** That heading, in the section on the seepage test, claims more than was shown. Read it as: M1, which has the water-table factor, had the higher held-out error than M2, which does not (32.7% against 28.3%), and the difference was not tested. It is not evidence that the factor hurts.
- **The budget ranking against rule B.** The interval on the k-average (+0.020, from 0.001 to 0.046) clears zero because the forecast was ahead in 4 of the 18 years, behind in none, and level in the other 14. So the result rests on four years. That is thin, and it is stated here so that the interval is not read as more than it is.
- **"Left unmatched by the no-guess rule before the run."** This was said of the district "Adams Garden". Git cannot show it. The commit that added the calibration code and the commit that added its result and the name crosswalk were made 17 seconds apart (09:56:41 and 09:56:58), and the crosswalk file first appears in the second. The order of events is the coder's account, not something the history proves. What the history does show is that the matching rule in the code never changed after that first commit.

## Gradient boosting: what the result looks like inside, and what it does not show (written Nov 15, 2026)

The figures in this section are the checker's, computed after the result was known. They are descriptive only, were not declared in advance, and are not in the frozen file. They were not recomputed by the coder, and nothing was tuned or rerun.

- The default model fitted its training rows almost exactly in the early folds.
- 60% of its forecasts were below 0.05 or above 0.95, against 14% for the forest. It was far more sure of itself than the forest.
- At the 0.25 warning line it missed 848 drought seasons, against 431 for the forest.
- Its ranking skill was only a little lower: an AUC of 0.837 against 0.868.

This is one untuned model at one fixed warning line. It does not show that boosting cannot work here.

## Round 4: one general forecast, tested on six rivers it has never seen (declared Nov 15, 2026, before any holdout county was loaded, trained on or scored)

Round 3 left the six-river holdout declared and unopened. This section says exactly what will be scored on it, before it is opened. The commit that adds this section comes before the commit that adds the code.

**Why a new model.** On the Rio Grande the 6-month forecast ties the rule "D1 or worse now". The forecast and the rule read the same drought map, so the new idea is to give the forecast information the rule cannot see, and to let it learn from more places.

**What development showed (on the 436 river counties already used; none of this is blind).** Seven candidates were tried, all with the version 1 forest settings unless named, forward-chained exactly as version 1. Cost is 3 x missed + false alarms at the fixed 0.25 warning line, minus the cost of "D1 or worse now", with a year-block interval (18 years):

| Candidate | Rio Grande | Colorado | Missouri | Mississippi | Ohio |
|---|---|---|---|---|---|
| Version 1 (Rio Grande rows, 34 inputs) | -58 (-276 to 171) | +11 (-78 to 112) | +1680 | +2833 | +1513 |
| Rio Grande rows + drought index + weather | +135 (-70 to 358) | +14 | +867 | +2338 | +1391 |
| All five rivers + drought index + weather | +242 (-104 to 598) | +73 (-87 to 250) | -920 (-1910 to 1) | -2273 (-3559 to -1067) | -1078 (-1635 to -601) |
| All five rivers + drought index + weather + climate normals | +216 (-105 to 545) | +49 (-94 to 215) | -1010 (-1903 to -181) | -2156 (-3493 to -920) | -1346 (-1970 to -790) |
| The same with a larger forest | +158 | +40 | -1052 | -1965 | -1221 |
| Regularised gradient boosting, same inputs | +301 | +90 | -341 | -483 | -1286 |

What this says, on used data: on the two dry western rivers nothing beats the simple rule, with or without the new inputs. On the three wetter rivers a model trained on every river with the new inputs is clearly ahead of it. On rows where the county is not yet at D1 (where the rule cannot warn) the forecasts barely rank Rio Grande counties (AUC 0.58 to 0.63): the start of a severe drought six months ahead is close to unforecastable there from these inputs.

**The model that will be scored (called G, the general model).** Chosen because it has the lowest total cost over the five development rivers (20,364 against 20,571 and 20,655 for the next two).
- Forest: version 1's settings unchanged (80 trees, depth 10, at least 20 rows per leaf, square-root inputs per split, seed 0).
- Training rows: all 436 river counties on the five development rivers. Forward chaining as version 1: for each test year 2008 to 2025, only rows whose 26-week answer was fully known before 1 January of that year.
- Inputs (47): version 1's 34 (history, long memory, El Nino); 6 from NOAA's county drought index files (Palmer index now, its change over 3 months, its lowest value in 12 months; the Palmer Z index for 1, 3 and 6 months); 5 from NOAA's county rain and temperature files (rain over 3, 6 and 12 months as a share of normal, temperature over 3 and 12 months minus normal); 2 climate normals (the county's 1901 to 1999 yearly rain and mean temperature).
- Publication lag: a forecast made in month M uses NOAA values up to month M-2, as weather.py already does.
- Warning line: 0.25, the fixed break-even value. Not chosen on any data.

**The holdout.** Every county whose centre is within 50 km of the Pecos, Canadian, Gila, San Juan, Brazos or Arkansas river (lower 48 states, the same map file and distance rule as before), minus the 436 counties already used. A county belongs to the nearest of the six. No holdout county is in any training row. The scored rows are monthly issue rows from 2008 to 2025 whose full 52-week future was known by 2026-11-10, the same rule as version 1.

**Primary outcome, and what counts as a win.** Cost of G minus cost of "D1 or worse now" over all holdout counties together, with a year-block bootstrap (10,000 draws, seed 0). Single-year blocks are the primary interval; two-year blocks are printed beside it. It is a win only if the primary interval lies wholly below zero. If the two block sizes disagree it is reported as unsettled. A tie or a loss is printed as plainly as a win.

**Also reported, none of them the win criterion.** The same comparison per river. Version 1 (trained on Rio Grande rows) on the holdout, which is the test round 3 declared. G against "D2 now" and against always warning. AUC, precision, recall and plain accuracy for G, version 1 and the rule. Rows where the county is not at D1 on the issue date, against never warning. Each river's base rate beside its result.

**A prediction, written before the result.** G's lead over the rule will be larger on rivers where a drought season is rarer, and on a river where it happens in more than about four years in ten we expect a tie, as on the Rio Grande and the Colorado.

**Limits, stated now.** The holdout shares its calendar years with everything else and several of its rivers border the Rio Grande basin, so it is new places, not new time. NOAA's county values are a revised record, not what was published on the day. G was picked from six candidates on used counties. Version 1 stays the reported Rio Grande system whatever this shows: on the Rio Grande G was already seen in development and does not beat the rule.

**Once.** The holdout is scored one time. After any holdout number is seen only a crash may be fixed.

## Round 4 result: the general forecast ties the simple rule on six unseen rivers (written Nov 15, 2026, after the holdout was scored once)

The holdout was scored one time, as declared. The result is in `reports/frozen/round3/holdout.json` and is not changed by anything written here. Nothing was rerun.

- **The primary result is a tie.** On 166 counties along six rivers that were never used (35,690 forecasts, 18 years), the general model cost 14,334 against 14,041 for "D1 or worse now": a difference of +293, interval -819 to 1,537 with single-year blocks and -807 to 1,505 with two-year blocks. Both include zero. By the declared rule this is not a win. The model was ahead in 8 of the 18 years.
- **Version 1 also ties it there.** The forest trained only on Rio Grande rows, applied unchanged to these counties, cost 14,086: +45, interval -696 to 946.
- **What the general model does do on places it never saw.** It is right in 79.4% of forecasts (the rule: 75.9%), 72.6% of its warnings are followed by a drought season (the rule: 65.0%), and it catches 74.4% of drought seasons (the rule: 80.1%). It ranks counties with an AUC of 0.854. It is clearly cheaper than "D2 or worse now" (-1,632, interval -2,429 to -894) and than always warning (-7,700, interval -12,951 to -2,324). Under a cost rule where a miss counts three times a false alarm, the rule's extra warnings pay for themselves, which is why the two tie on cost while the model is ahead on plain accuracy. Accuracy was not the declared outcome and is not claimed as a win.
- **Where the rule cannot warn.** On the 18,873 rows where the county was below D1, the general model cost less than never warning: -194, interval -389 to -36. That is a secondary result, one of several comparisons, and the ranking there is weak (AUC 0.63).
- **The prediction written in advance was wrong.** We expected the model's lead to be larger where drought seasons are rarer. The rarest river, the Arkansas (32% of rows), gave +225 (-352 to 855); the two most drought-prone, the Gila and the Pecos, gave -30 and -60. No river is separated from zero.
- **By river (general model minus the rule):** Arkansas +225, Brazos +80, Canadian +20, Gila -30, Pecos -60, San Juan +58. The Gila and San Juan have 6 and 4 counties.
- **What follows.** Version 1 stays the reported Rio Grande system. The general model is not adopted. The honest statement for the product is: the forecast is about as good as the best simple rule at deciding whether to warn, on the Rio Grande and on six rivers it never saw, and it is better than the rules people usually reach for first (wait for D2, or always act). What it adds over the rule is a probability and an order of counties, not a better yes or no.

**Two corrections to the declaration above.** (1) It says "seven candidates" in one place and "six" in another. Eleven new candidates were tried on the used counties before the declaration: the six in the table's last five rows and second row, plus Rio Grande rows with the drought index only, the two western rivers with three input sets, all rivers with climate normals only, and an average of the larger forest and the boosting model. None of the unlisted ones did better than the one chosen on the total over the five rivers. (2) The result file records that two source files differed from the commit when it ran (`app/build_site.py` and `src/farmdrought/districts.py`). Both were being edited for the website at the time; neither is imported by `holdout.py`, `climate.py`, `drought.py` or `outlook.py`.

**A note on the climate files.** NOAA has moved its county files to a new address since `weather.py` was written; the old address forwards to it. The four files used were the versions dated 2026-11-05. `data/round4/` holds only the cut needed here, and is not part of `data/manifest.json`, which still describes exactly the inputs version 1 was scored on.

## Round 4, leak model: a check against measured canal tests (declared Nov 15, 2026, before the measured rates were joined to any model figure)

Round 3 tested the leak model against 1998 district estimates and it did not pass. This is a second, smaller test on different data: ponding tests, in which a stretch of canal is dammed at both ends and the fall in water level is measured. Texas A&M (Leigh and Fipps) published 57 such tests from 1998 to 2005 on Rio Grande district canals; 16 are on unlined canals. The table of tests was typed in from the published reports today and is saved as `data/round4/ponding_tests.csv` with its sources.

**What was already known when this was written.** The count of tests, their soil textures and lining, the range of the measured rates (unlined 0.15 to 13.85 gallons per square foot per day; lined 0.09 to 34.31), and two single values (the highest, Maverick Lateral 8E, and the lowest, Rancho Viejo Main Canal). No measured rate had been set beside any model figure.

**What is compared.** The tests carry a soil texture but no coordinates, so a canal cannot be matched to its soil-survey unit. Each model therefore gives one rate per soil texture:
- **Texture table (the model the website uses):** the 1946 rates in `config.SEEPAGE_GAL_SQFT_DAY`.
- **Permeability (the round-3 model without its water-table factor and without a fitted factor):** the median soil-survey permeability of this project's own canal segments on that texture, times 2.1205.
- A test's texture is matched to the table by name, ignoring case. "Fine sandy clay loam" is read as sandy clay loam. Where a test names two textures the two rates are averaged. A texture with no rate in the table (silty clay) is not used; a test left with no texture is dropped, and the number dropped is reported.

**Outcomes.** (1) Rank agreement: Spearman correlation between each model's rate and the measured rate over the unlined tests, with a bootstrap over tests (10,000 draws, seed 0). A model passes only if its interval lies wholly above zero. (2) Level: the median of measured rate divided by model rate, for each model. (3) Reported beside them, not tested: the same on the seepage-only tests alone, and the median measured rate of lined against unlined canals.

**Limits, stated now.** Sixteen tests at most, five of them from one district, chosen by the districts and not sampled. The Maverick test was made two weeks after dredging. With so few tests an interval that excludes zero is unlikely, and a fail here means "not shown", not "shown to be wrong". The test is run once and the models are not adjusted after it.

## Round 4, leak model: result of the check against measured canal tests (written Nov 15, 2026, after it was run once)

Run once, as declared. The result is in `reports/frozen/round3/ponding.json`. Nothing was adjusted or rerun.

- **Order, permeability model: passes the declared rule, thinly.** Over the 16 unlined tests the rank correlation between the permeability rate and the measured rate is 0.58, interval 0.23 to 0.78, which lies above zero. It should be read with care: the model gives only five different rates across the 16 tests, and 11 tests share one value (19.08, the median for the loam-and-clay-loam group). The agreement is that the four tests on clay and silty clay measured low and the one on fine sandy loam did not. It is support for "clay canals leak less", not for a fine ranking of canals.
- **Order, texture table (the one the website uses): not shown.** Rank correlation 0.25, interval -0.23 to 0.63, on 15 tests (one test's texture, silty clay, has no rate in the table).
- **Level: both models are too high.** The measured rate was a median of 0.43 times the texture table's rate (0.78 times on the 8 seepage-only tests) and 0.07 times the permeability rate. So on these canals the website's leak figures are about twice what was measured, and raw permeability overstates seepage by more than ten times. This agrees with round 3, where the fitted factor was well below one. Every leak volume on the website stays labelled an upper estimate.
- **Seepage-only tests alone.** Too few to say anything: for the permeability model a third of the bootstrap draws had no variation in the model rate and were skipped, so that interval is not reliable and is not used.
- **Lined against unlined (not tested).** The 38 lined tests had a higher median loss (1.94) than the 16 unlined ones (1.25). Most lined tests were on old, cracked concrete. This matters for the website's assumption that every canal is bare earth: an old lining does not mean a canal holds water.
- **What follows.** Nothing is refitted. The website keeps the texture table, keeps "upper estimate" on every volume, and now says that measured tests on 16 canals came in at roughly half the table's rate.

## Round 5: a three-month outlook, tested on eight more unseen rivers (declared Nov 15, 2026, before any of those counties was loaded or scored)

**Why.** The 6-month outlook is right in about 78% of forecasts and no change to the model has moved that: six months of weather is not in any input. A shorter horizon is more forecastable, and one horizon matches the decision exactly: a sealant application lasts about 90 days, so "will the next 13 weeks hold a drought season?" is the question a district faces each time it decides whether to seal again. This adds a forecast for that question. It does not replace version 1, and the 6-month results stay as reported.

**The answer it predicts.** 1 if the next 13 weeks contain 8 or more weeks in a row at D2 or worse, otherwise 0. The same rule as the 6-month outlook with a 13-week window.

**The model.** The general model of round 4 with nothing changed but the answer: the version 1 forest settings (80 trees, depth 10, at least 20 rows per leaf, seed 0), the same 47 inputs, trained on the 436 development counties by the same forward chaining (for each test year 2008 to 2025, only rows whose 13-week answer was known before 1 January of that year). Two warning lines are reported and neither is chosen on data: 0.25 (the break-even line for a miss costing three false alarms) and 0.50 (the line at which a forecast simply says the likelier outcome, which is the one plain accuracy is about).

**What development showed (602 used counties; not blind).**

| | Rio Grande (31 counties) | Six rivers of round 4 (166) |
|---|---|---|
| Base rate of a yes | 38.5% | 28.6% |
| Right, model at 0.25 | 87.4% | 88.3% |
| Right, model at 0.50 | 87.6% | 88.6% |
| Right, "D2 or worse now" | 88.1% | 88.5% |
| Right, "D1 or worse now" | 78.2% | 78.7% |
| AUC | 0.937 | 0.944 |
| Cost at 0.25 minus "D2 now" | -66 (-147 to 8) | -169 (-375 to 24) |
| Cost at 0.25 minus "D1 now" | -235 (-558 to 52) | -1,668 (-2,559 to -731) |

So on used data the model is right about 87 to 88 times in 100, and so is the rule "the county is in severe drought now". The version 1 recipe (Rio Grande rows, 34 inputs) gave nearly the same figures (87.0% and 86.4% at 0.25).

**The new holdout.** Every county whose centre is within 50 km of the Red, North Platte, South Platte, Green, Yellowstone, Sacramento, San Joaquin or Humboldt river (same map file, same lower-48 box, same distance rule), minus the 602 counties already used in rounds 1 to 4. The file may hold more than one river of a given name; every one inside the box counts. No such county has been loaded for any purpose. Scored rows: monthly issue rows 2008 to 2025 whose full 52-week future was known by 2026-11-10.

**What is reported.** Share of forecasts right, precision, recall and AUC, at both lines, beside "D2 or worse now", "D1 or worse now" and never warning, with the lowest and highest single-year accuracy. Two declared comparisons, each with a year-block interval (10,000 draws, seed 0; single years primary, pairs beside it): cost at the 0.25 line minus the cost of "D2 or worse now", and minus "D1 or worse now". A comparison is a win only if its primary interval lies wholly below zero.

**Predictions, written before the result.** The model will be right in 85 to 90 of 100 forecasts. It will tie "D2 or worse now" and beat "D1 or worse now".

**Limits, stated now.** New places, not new time. The horizon was chosen after seeing that six months could not be improved, and after seeing the figures above on used counties; only the new holdout is blind. A three-month warning gives a district less time to act than a six-month one.

**Once.** Scored one time. After any number from the new holdout is seen only a crash may be fixed.

## Round 5 result: the three-month outlook is right 90 times in 100 on eight unseen rivers, and ties the rule "severe drought now" (written Nov 15, 2026, after the new holdout was scored once)

Scored one time, as declared. The result is in `reports/frozen/round3/quarter.json`. Nothing was rerun.

- **Accuracy on places never seen.** 136 counties along the Red, North Platte, South Platte, Green, Yellowstone, Sacramento, San Joaquin and Humboldt rivers; 29,240 forecasts over 18 years; a drought season followed in 23.9% of them. The model was right in **90.4%** of forecasts at both warning lines. Its worst single year was 83.3% and its best 96.9% (at the 0.25 line). AUC 0.957. At 0.25, 76.5% of warnings were followed by a drought season and 86.6% of drought seasons had been warned about.
- **It ties the rule "D2 or worse now".** That rule was right in 90.7% of the same forecasts. On cost the model is at 4,666 against 4,718: -52, interval -200 to 64 (pairs of years: -241 to 69). Not separated. The model was ahead in 6 of 18 years.
- **It beats the rule "D1 or worse now".** 4,666 against 6,476: -1,810, interval -2,437 to -1,153 (pairs: -2,462 to -1,109). A win by the declared rule, ahead in 16 of 18 years. That rule is right in only 79.8% of forecasts at this horizon, because a county in moderate drought often does not reach eight severe weeks within three months.
- **The predictions.** "Right in 85 to 90 of 100": it was 90.4, just above the range. "Ties D2 now, beats D1 now": both held.
- **On the Rio Grande (not blind).** 87.4% right at 0.25 and 87.6% at 0.50, AUC 0.937, against 88.1% for "D2 now". Cost 1,336 against 1,402: -66, interval -147 to 8. Not separated.
- **What this means.** Three months ahead, the forecast is right about nine times in ten on places it never saw, and about 87 times in 100 on the Rio Grande. A county's current drought class already tells most of that story, so the model does not beat the best simple rule here either. What changes with the horizon is which rule is the best one: at six months it is "D1 now", at three months it is "D2 now". The model matches the better rule at each horizon without being told which to use, and gives a probability.
- **What follows.** The website shows the three-month chance beside the six-month one. Version 1 and every earlier result stay as reported. This week's three-month chances for the 31 Rio Grande counties are in `reports/live/quarter.json` (issued 2026-11-03; not a scored result).

**A note on the climate file.** `data/round4/climate_counties.csv.gz` and `climate_normals.csv` were cut again from the same NOAA files (dated 2026-11-05) to add the 136 new counties. The rows of the 602 counties already in them are unchanged: a dry run before the scoring reproduced the round-4 development figures exactly.
