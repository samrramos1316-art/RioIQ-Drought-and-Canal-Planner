# RioIQ rebuild: architecture

Written 2026-11-15 against `upstream/app` at commit `c10655d`. This is the build plan for the
last stretch of the hackathon. It is meant to be handed out one section at a time.

**Status of this document.** This is the plan as written before the build. It has since been carried out; section 12 at the end lists where the plan was wrong and what was built instead. Read section 12 before relying on anything above it.
It was then checked three times: every path and number against the repo; a cross-review in which
each reviewer read the others' sections; and a final read. The cross-review found 30 problems,
all corrected here. Section 11 lists what was checked and what was not.

---

## 0. Ground rules (every agent reads this first)

1. **Version 1 stays.** The existing models, their settings and the fixed baseline list are not
   edited. They remain the reported system. New work sits beside them and is labelled ADDED.
2. **Nothing is tuned on test years.** Model choice uses validation years (2015 to 2018) or
   "the past chooses" (`v2.pick_by_past`). Every candidate's test score may be printed and is
   never used to choose.
3. **Declare, then run.** Each new experiment is written into `reports/decision.md` and committed
   before it is scored. Git order is the proof.
4. **Report whichever way it falls.** A tie or a loss is printed as plainly as a win.
5. **A win needs an interval.** A result counts as a win only if its interval excludes zero.
   This applies to the physical model's validation as well as to the forecasts.
6. **Nothing modelled is called measured.** Every dollar and acre-foot figure is a band and
   carries "modelled, not measured".
7. **The site must stay deployable after every merge.**
8. **Human-only paths** (section 8): an agent may prepare a change as a pull request. Only a
   human merges it.
9. **No agent adds a citation or a URL.** Humans open and confirm every link.
10. **If nobody on the team can explain a file, it is deleted.** The hackathon rules require the
    team to understand every part.

---

## 1. What exists today (verified)

### 1.1 Data flow
```
data/raw/usdm-counties.json
  -> drought.load_usdm            weekly drought class per county
  -> counties.nearest_river       436 counties within 50 km of five rivers (31 on the Rio Grande)
  -> drought.build_panel          inputs (sets H, L, E) and labels y, y_season, y_weeks
  -> alert.run_alert              4-week alert: train 2000-2014, threshold on 2015-2018, test 2019+
  -> outlook.run_outlook          6- and 12-month outlooks, forward chaining 2008-2025
  -> trigger / v2 / robustness    re-score those tables
  -> export.main                  data/processed/*.parquet and reports/metrics.json
  -> [by hand] app/forecast_pre2020.py, app/osm_canals.py
  -> [by hand] app/build_site.py  app/site/data/core.js and sim.js
  -> app/site/index.html, app.html (the live product)
```
Physical side: USGS canal lines (`canals.py`) -> soil texture at each segment's midpoint, 1 m down
(`leaks.py:download_soil`) -> texture-to-rate lookup (`config.py:136`) -> score = rate x county
chance (`leaks.py:122`) -> 20 ft width for every segment, greedy budget (`districts.py:sealant_plan`)
-> `build_site.py` (which also attaches OpenStreetMap detail, `add_osm_detail`, line 292)
-> `app/site/sim/engine.js`.

### 1.2 Numbers the frozen run must reproduce
From `reports/metrics.json`, latest week 2026-11-10: 4-week system cost **1912**, 6-month system
cost **2328**, 12-month error **14.0** weeks.

### 1.3 Known defects this plan fixes
| Defect | Where |
|---|---|
| Results are rewritten by the daily job while flagged final | `export.py:38` `IS_FINAL = True`; `refresh.py:169-170` |
| `robustness.json` (2324) disagrees with `metrics.json` (2328) | refresh reruns `v2` and `export`, not `robustness` |
| The daily job never rebuilds the site data | `.github/workflows/refresh.yml:39` stages no `app/site/data` |
| No sampling uncertainty | `robustness.py` varies seeds only |
| Trigger test counts three rows per county-year | `trigger.py:85` (1,674 rows = 31 x 18 x 3) |
| The forecast threshold assumes a calibrated probability | no calibration anywhere |
| One 20 ft width, every canal unlined | `config.py:168` |
| Simulation forecast is a random draw at fixed rates | `engine.js:344` |
| Single dollar headline | `platform.js:578` |
| The site build skips the data contract | `app/build_site.py` never calls `contract.validate_all` |
| A test overwrites tracked files | `tests/app/test_build_site.py` calls `build()` |
| Unused front ends | `demo/`, `app/embed/`, `app/streamlit_app.py` |
| Personal email in a public workflow | `refresh.yml` (use a noreply address) |

### 1.4 Things already in place (build on them, do not rebuild)
- A model frozen before 2020 and scored on 2020 onward: `app/forecast_pre2020.py` -> `app/data/pre2020.json`.
- A replay of real years with the frozen model's forecasts, against the D1 rule and always-seal:
  the "check" case in `app/site/js/platform.js` (around lines 600 to 630).
- Lining cost spread over 50 years: `app/canal.py:74` `lining_cost_per_af_range`.
- A range for the 12-month outlook: `mapfields.py:58-59` (`weeks_low`, `weeks_high`).
- The site already states the forecast-versus-rule tie in words: `landing.js:45-48`.
- `app/site/data/river.js` (the map for the home page's river opening) has no generator in the
  repo. Keep it as is. `build_site` must not delete it.

---

## 2. Target layout

**No folder is moved or renamed.** Renaming `src/farmdrought` or `app/` would break every import
and the deployment for no judged gain. Additions only:

```
data/manifest.json                     NEW  sha256 of every raw input, and the scoring cut-off
reports/frozen/v1/                     NEW  version 1 results, scored once, never rewritten
reports/frozen/round3/<item>.json      NEW  one file per new experiment; adding is allowed, changing is not
reports/live/                          NEW  what the daily job writes
reports/prospective/                   NEW  one dated forecast file per week, append-only
src/farmdrought/uncertainty.py         NEW  year-block bootstrap
src/farmdrought/prob_calibration.py    NEW  probability calibration (section 3.3)
src/farmdrought/allocation.py          NEW  budget-ranking backtest
src/farmdrought/daily.py               NEW  daily weather inputs
src/farmdrought/models.py, v3.py       NEW  model comparison
src/farmdrought/holdout.py             NEW  declared holdout
src/farmdrought/prospective.py         NEW  forecast log
src/farmdrought/canal_class.py         NEW  width class, exclusions, OpenStreetMap matching
src/farmdrought/seepage_calibration.py NEW  district calibration (section 4.3)
src/farmdrought/costs.py               NEW  the lining-cost functions moved out of app/canal.py
src/farmdrought/greenness.py           NEW  satellite signal (optional, section 4.6)
app/site/js/logic.js, logic.test.js    NEW  site logic with no page code, and its tests
.github/workflows/ci.yml               NEW
docs/OWNERS.md                         NEW
tests/pipeline/test_round3.py          NEW  evaluation tests (owner A)
tests/pipeline/test_physics.py         NEW  physical-model tests (owner B)
tests/pipeline/test_costs.py           NEW  tests for the moved cost functions
```
Two different things are both called "calibration". They get different file names on purpose:
`prob_calibration.py` is about forecast probabilities, `seepage_calibration.py` is about leakage.

---

## 3. Evaluation and models

### 3.0 Freeze first
- `config.py` CHANGE (human merges): add `SCORE_THROUGH = "2026-11-10"`.
- `drought.build_panel(buffer_km, score_through=None)` CHANGE: **truncate the class array at
  `SCORE_THROUGH` before the labels are built**, so no answer window crosses the cut-off.
- `export.py` CHANGE: split `main()` into
  - `evaluate()`: version 1 only (`run_alert`, `run_outlook`), plus `v2` and `robustness`.
    Writes `reports/frozen/v1/metrics.json`, `predictions.parquet`, `outlook.parquet`, with the
    manifest hash, git commit and seeds. Refuses to run if any raw file's hash differs.
  - `predict()`: this week's forecast, map fields, `run_leaks`, `run_districts`. Writes
    `data/processed/latest.parquet` and `reports/live/latest.json` (holding `latest_week`,
    `canal_priority`, `districts`, `map_fields`).
- **In the same commit**, update everything that reads the old locations: the paths in
  `config.py`, `contract.REAL_DIR` and `REAL_METRICS`, `build_site.py` (lines 404 and 453), and
  `tests/pipeline/test_contract.py`. Otherwise the site build breaks.
- `IS_FINAL` is removed.
- Each round-3 experiment (3.2 to 3.7) writes once to `reports/frozen/round3/<item>.json`.
- `app/data/pre2020.json`: its `test` block is a scored result. Write it once to
  `reports/frozen/`; the daily job writes only the live part.
- `refresh.py` CHANGE (lines 169-176): downloads go to `data/live/`; call `predict()`, `issues`,
  `build_site`, `prospective.log_week()`. Never `evaluate()`.
- **Reproduction.** The frozen and current files disagree by a few points (2324 against 2328).
  The cause is not established: it could be the stale robustness file, a week of new data, or a
  different machine. So: library versions stay pinned in `requirements-pipeline.txt`; run
  `evaluate()` once on the CI runner and commit that as the frozen file; later CI runs compare to
  it within 1% of each cost.

### 3.1 Uncertainty (`uncertainty.py`)
`year_block_bootstrap(per_year_a, per_year_b, weights=None, draws=10000, seed=0, block=1) -> dict`
- Unit of resampling: the calendar year of the issue date, all counties together.
- Returns `diff`, `lo`, `hi` (2.5 and 97.5 percentiles), `share_draws_a_better`, `years_a_better`,
  `n_years`.
- Also run with `block=2` (adjacent-year pairs), because 26- and 52-week answer windows cross
  year ends.
- Used by every system-minus-rule row: alert, onset, season, year, trigger, allocation, model
  comparison, holdout. Print `n_years` beside each interval. The alert has only 8.

### 3.2 Trigger, one decision per county-year
`trigger.run_trigger_annual(scored, month=3)`: March issue rows only (558 rows). The old
three-month table stays under `trigger`; the new key is `trigger_annual`. Add two rules, each
labelled ADDED: "D0 or worse now" and "class-conditional frequency" (below).

### 3.3 Probability calibration (`prob_calibration.py`)
- `calibrate_by_past(table, p_column, label, horizon, min_years=3) -> Series`: for test year Y,
  fit isotonic regression on forward-chained forecasts whose answer windows closed before
  1 January Y, then apply to Y. Start the chain at 2005, as `v2.py` does (`SELECT_START`). Fewer
  than three past years: leave unchanged.
- `class_frequency_by_past(table, label, horizon) -> Series`: P(yes | current class), from past
  years only. This is the fair probabilistic rule to compare against.
- `reliability(y, p, bins=10)` and `brier(y, p)`. Report skill against "usual" and against class
  frequency.
- Calibration matters for thresholds (3.2) and for the chance shown on the site. It does **not**
  change a ranking, because it keeps the order of probabilities.

### 3.4 Budget-ranking backtest (`allocation.py`): the main new result
`run_allocation(scored) -> dict`
- **Decision:** each March, fund k of the 31 Rio Grande counties at equal cost, k in {3, 5, 8, 10, 15}.
- **Model ranking:** raw `p_season`, highest first; ties by FIPS code.
- **Rule A:** current class `cls`, highest first, then `d2_streak`. **Rule B:** `cls`, then `mean12`.
  Ties by FIPS code.
- **Metric:** share of funded counties that then had a drought season, per year, averaged over
  years. Also print random choice (the base rate) and the oracle.
- **Comparison:** model minus the better rule, per k and averaged over k, with section 3.1 intervals.
- Reviewer's estimate that the interval excludes zero: about 40%.

### 3.5 Daily inputs (`daily.py`), higher risk
`download_daily(fips)`, `add_daily_features(table, lag_days=7)`. A row dated d uses days up to
d minus 7. Features (set D): 30/60/90-day precipitation as a percentile of earlier years (reuse
`flow.past_percentile`), the same for reference evapotranspiration and for precipitation minus
evapotranspiration, 30-day soil-moisture percentile, 14-day maximum temperature anomaly,
dry-day streak. Sources are in section 9 as VERIFY FIRST. Reanalysis data is revised history,
not what was known on the day: disclose it.

### 3.6 Model comparison (`models.py`, `v3.py`)
- `make_gbm(seed)`: scikit-learn `HistGradientBoostingClassifier`, fixed defaults.
- `SequenceModel`: a GRU over 52 weekly steps (PyTorch). Pretrain on all U.S. counties except the
  focus and holdout counties, set H only, labels closed before each block boundary; fine-tune on
  focus training rows.
- **Early stopping.** For the alert: 2015-2018. For each outlook fold: the last two years of that
  fold's own training rows. (Using 2015-2018 for every fold would let folds for 2008 to 2014 see
  later years.)
- Forest, boosting and GRU, each on H and on H+D, with the same masks from `alert.split_masks`
  and `outlook.folds`. Five seeds each; report mean and range.
- The GRU is the most expensive item here (hours of CPU time). Start it right after the freeze or
  drop it.

### 3.7 Declared holdout (`holdout.py`)
`holdout_counties(buffer_km=50)`: counties within 50 km of the Pecos, Canadian, Gila, San Juan,
Brazos and Arkansas rivers (all six names are present in the rivers file), minus the 436 counties
already used. Do **not** add them to `config.RIVERS`; that would change which counties count as
Rio Grande. Score once. Limit to state openly: same calendar years and a neighbouring climate, so
it is not independent in time.

### 3.8 Prospective log (`prospective.py`)
`log_week()` writes `reports/prospective/<date>.json`: per county, the class, each rule's call,
each model's probability and a model hash. `score_matured()` scores files whose answers are now
known. Files are never rewritten. One week of entries proves nothing yet; say so.

### 3.9 Text a human appends to `reports/decision.md` before any of section 3 is scored
> Evaluation round 3, written before any item below was scored. Version 1 and its baseline list
> are unchanged and remain the reported system. Scoring is frozen at 2026-11-10. Added, and
> labelled as added: year-block intervals (10,000 draws, seed 0); a March-only trigger test;
> in-fold calibration; the rules "D0 now" and "class-conditional frequency"; an allocation
> backtest (k = 3, 5, 8, 10, 15; rules A and B as defined in ARCHITECTURE.md); daily inputs lagged
> 7 days; boosting and a GRU chosen on validation years only; a holdout of six named rivers scored
> once; a weekly prospective log. The test years are not blind: earlier runs used them. A result
> counts as a win only if its interval excludes zero. Everything is reported whichever way it falls.

---

## 4. Physical model and simulation

### 4.1 Seepage from permeability (`leaks.py`, `config.py` CHANGE)
`q (gal / sq ft / day) = Ksat (micrometres per second) x 2.1205 x g x c`
(1 micrometre per second = 0.2835 ft/day; times 7.48052 gallons per cubic foot.)
- **ASSUMPTION:** this treats the hydraulic gradient as 1 and ignores any silt layer on the bed.
  State that wherever the model is described.
- Add to the existing soil query (`leaks.py`, the `chorizon h` join): `h.ksat_l, h.ksat_r, h.ksat_h`.
- Water-table depth: `muaggatt.wtdepannmin` (cm), joined on `mukey`. VERIFY with a one-row query.
- Keep the 1 m horizon rule. Store `ksat_low, ksat_typ, ksat_high, wt_cm` in `canal_soil.csv`.
- `g` (water-table factor): 1 when the table is deeper than 300 cm or missing, falling in a
  straight line to 0.1 at 100 cm. ASSUMPTION, sampled plus or minus 50%.
- `c`: the calibration factor from 4.3.
- Keep the old texture-table rate as a comparison column only.
- `def seepage_rate(ksat, wt_cm, c) -> float`

### 4.2 Width class, lined share, exclusions (`canal_class.py`, `districts.py` CHANGE)
- **Dependency.** The OpenStreetMap kind and the piped flag are attached today only inside the
  site build (`app/build_site.py:add_osm_detail`, lines 292-350), after the pipeline has run. So
  first move `dense`, `point_grid` and `line_near` (`build_site.py:246-264`) into
  `canal_class.py`, and read `app/data/osm_canals.json` there. `app/osm_canals.py` must run
  before `predict()`.
- `classify(row) -> "main" | "lateral" | "ditch"` from the segment name and the OpenStreetMap kind.
- Wetted width, all ASSUMPTION: main 20 to 40 ft, lateral 8 to 20 ft, ditch 3 to 8 ft. The repo
  holds no measured width anywhere.
- Lined share per district: a prior centred on 0.3, range 0 to 0.7, ASSUMPTION.
- **Never funded:** kind `drain`, a name matching the drain pattern in `leaks.py`, and segments
  whose piped length share is 0.5 or more. USGS code 33601 (142 of 12,171 segments) is believed
  to mean aqueduct; exclude it only after that is confirmed (section 9).
- **Caution on "piped".** It is only the OpenStreetMap `tunnel` tag (`app/osm_canals.py:55`), and
  many tagged ways are road culverts. Use it as a length share. Never display it as "lined".

### 4.3 Calibration to district losses (`seepage_calibration.py`, `app/reference/district_crosswalk.csv` NEW)
- `Loss_d = authorized_af x (1 - efficiency_pct / 100)` from `app/reference/districts.csv`
  (18 usable rows, sum 363,120 acre-feet). These are 1998 estimates on water rights, not measured
  diversions. Say so wherever the number appears.
- Raw model `M_d` = sum over the district's fundable segments of
  `Ksat x 2.1205 x g x length_ft x width x (1 - lined) x 273 / 325,851`.
  The 273-day season is an ASSUMPTION.
- One factor, fitted against the **whole** loss: `ln c = mean over districts of ln(Loss_d / M_d)`.
  Keep the residual standard deviation `sd`.
- The share of loss that is seepage, `s`, is uniform 0.5 to 0.9 (ASSUMPTION; loss also includes
  evaporation and spills). It is applied **only** in the simulation (4.7), never in the fit, so
  it is not counted twice.
- `def fit_factor(table) -> dict(c, sd, n)`
- Districts with no row use the pooled `c` and carry `calibrated: false`, shown on the page.
- The crosswalk between district names in the map and in the 1998 table needs a human check.

### 4.4 Leave-one-district-out test (same file)
Fit `c` on 17 districts, predict the 18th, repeat. Report median absolute percent error and rank
correlation. Do the same for two rivals, **each with its own single factor fitted inside the same
loop**: canal length alone, and the old texture table.
- **Pass** only if a bootstrap over districts of (rival error minus model error) excludes zero.
  Wording: "Held-out districts: median error X% (interval A to B), better than canal length alone."
- **Otherwise:** "The model did not predict held-out district losses better than canal length.
  Volumes are not reliable; only the ranking order is shown."
With 18 districts the interval will be wide. Print whichever applies. Do not adjust the model
after seeing the result.

### 4.5 Reconciliation and a fair cost benchmark
B produces the data; C renders it in the Sources tab of `platform.js`.
- Chart: modelled seepage as a share of authorised water per district, against the published
  bands of 10 to 40% and 40 to 60%. Label that those bands include evaporation.
- Benchmark: programme capital cost / (acre-feet per year x lifetime), lifetime 25 to 50 years,
  undiscounted, beside the sealant's yearly spend / yearly acre-feet kept, as a band.
  With the figures in `app/reference/costs.json`: 164,000,000 / (44,000 x 50) = $75 and
  164,000,000 / (44,000 x 25) = $149 per acre-foot. A human must confirm that 44,000 acre-feet
  is per year before it is shown.
- Reuse `lining_cost_per_af_range` and `LINING_LIFE_YEARS`. They move from `app/canal.py` to
  `src/farmdrought/costs.py`, with `tests/pipeline/test_costs.py` created in the same commit,
  **before** `app/canal.py` is deleted.

### 4.6 Satellite greenness signal (`greenness.py`): optional, exploratory only
- Idea: vegetation is greener beside a canal that leaks.
- Per segment: median NDVI in a 0 to 20 m strip minus a 40 to 100 m ring, cropland pixels removed
  from both, cloud-free dry-season scenes, 2022 to 2024.
- **No pass claim can be made from the data in the repo.** The only control available is the
  "piped" tag, which 4.2 says is mostly road culverts. Show the result as exploratory, and keep
  it out of the ranking, unless a human supplies segments confirmed as lined.
- It can show an association. It can never give a rate or a volume. 10 m pixels are coarser than
  many laterals. Data access is in section 9 as VERIFY FIRST.
- Do not start this before 4.1 to 4.4 are done.

### 4.7 Uncertainty in the simulation (`app/site/sim/engine.js` CHANGE)
- `samplePhysics(rng, scope) -> {seepMult, cut, widthMult, linedShare}`:
  `seepMult = s x exp(Normal(0, sd))` with `s` uniform 0.5 to 0.9 and `sd` from 4.3;
  `cut` uniform 0.28 to 0.87; `widthMult` per class; `linedShare` per district.
- Draw once per future in `fromToday`, before the policy loop, so every policy sees the same draw.
  Apply where `saved` is computed (`engine.js:178`).
- Remove the single 0.575 value tagged "published" (`engine.js:45`). Only the range is published.
- 300 futures. The page shows the 10th, 50th and 90th percentile, the number of futures that lose
  money, and the band with physics held fixed, so a reader can see how much is weather.

### 4.8 Headline simulation on real forecasts (`platform.js` CHANGE)
Make the headline a replay of 2008 to 2025 using the forecast each year's model really made and
the real reservoir record, with five policies as table rows (never, declared, D1 now, forecast,
always seal). `build_site.py` already packs the forecasts from 2008. The random futures become a
"stress test" tab.

### 4.9 Ranking with and without the forecast
`districts.py` CHANGE (B): `sealant_plan(canals, budget, use_forecast=True)`. Output km funded in
both plans, only with the forecast, only without it, and the rank correlation. C renders the
table. Print it even when the difference is small.

### 4.10 Wording rules for the site
- Every figure is a band and says "modelled, not measured".
- No single dollar headline. "Saved" becomes "modelled saving".
- Remove "Most canals are bare earth" (`app/site/index.html:59`); no source supports it. (D)
- Each assumption shows its source or the words "our assumption", and its range.

---

## 5. Repository, build and site

### 5.1 Delete list, in this order
Each step must leave all tests green before the next.
1. `refresh.py:175-176` (demo build) CHANGE; `refresh.yml:39` drop `demo/data.js`;
   `tests/pipeline/test_demo.py` DELETE.
2. `demo/` DELETE.
3. `app/embed/` DELETE.
4. Move the lining-cost functions to `src/farmdrought/costs.py` and add
   `tests/pipeline/test_costs.py` (section 4.5). Then DELETE `app/streamlit_app.py`,
   `app/theme.py`, `app/brief.py`, `app/tallies.py`, `app/canal.py`, `app/mapdata.py`,
   `app/make_river_lines.py`, `app/map_data/`, `app/requirements.txt`, and
   `tests/app/test_app.py`, `test_theme.py`, `test_brief.py`, `test_tallies.py`, `test_canal.py`,
   `test_mapdata.py`, `test_requirements_sync.py`.
5. `app/export_pitch_kit.py`, `app/pitch_kit/`, `tests/app/test_pitch_kit.py` DELETE, after any
   numbers needed for the video are copied out.
6. `app/demo_data/` DELETE. **Keep `app/make_demo_data.py` as a test helper** that writes to
   `tmp_path` (a hand-made fixture would have to satisfy every key the contract requires).
   Build that fixture path in `tests/app/test_contract.py` first, then remove `load_demo` and
   the demo fallback in `load()` from `app/contract.py`.
7. `requirements-app.txt`: drop `streamlit`, `plotly`.

**KEEP:** `app/reference/` (the calibration in 4.3 reads `districts.csv`;
`contract.load_reference` has no demo dependency and stays), `app/build_site.py`,
`app/contract.py`, `app/osm_canals.py`, `app/forecast_pre2020.py`, `app/make_demo_data.py`,
`app/data/`, `app/site/data/river.js`, `tools/board`, `notebooks/`.

Checked: `build_site.py`, `contract.py` and `forecast_pre2020.py` import nothing from the delete list.

### 5.2 Contract in the site build
`build_site.build(out_dir)` CHANGE: call `contract.validate_all` first; on any problem print the
list and exit non-zero, writing nothing. Write to a temporary folder, then replace. Tests pass
`tmp_path`, so they stop overwriting tracked files. Starts after the freeze (3.0) has merged,
because 3.0 changes the paths this reads.

### 5.3 CI
- `.github/workflows/ci.yml` NEW, on push and pull request:
  - `pytest tests`; `node app/site/sim/engine.test.js` and `logic.test.js`.
  - `build_site` into a temp folder.
  - A size gate.
  - A banned-word gate ("Headgate", "streamlit") searching `app/`, `src/` and `tests/` only.
  - A **frozen gate**: fail if `data/manifest.json` or an existing file under `reports/frozen/`
    changes, unless a pull request carries the label `re-evaluate` or a push to main has
    `[re-evaluate]` in its commit message. Adding a new file under `reports/frozen/round3/` is
    allowed. The split constants are already pinned by `tests/pipeline/test_config.py`.
  - A quick reproduction job: run `run_alert` and `run_outlook` with seed 0 and compare the three
    headline numbers to the frozen file within the tolerance in 3.0. The full `evaluate()`
    (which includes `v2` and `robustness` and takes over two hours) runs on manual dispatch only.
- `refresh.yml` CHANGE: a concurrency group; install both requirement files; run refresh, tests,
  `build_site`; stage `data/live`, `data/processed/latest.parquet`, `reports/live`,
  `reports/prospective`, `app/site/data`; `git pull --rebase` before push; a noreply commit email.

### 5.4 Site weight
`build_site` (B) writes `core.js` (this week, districts, limits, trigger), `geo.js` (map shapes)
and `canals.js`; C and D update the loaders. `index.html` loads `core.js` first and the rest with
`defer`. `river.js` is left untouched. Resize photos to 1,200 px wide. `plotly.min.js` goes with
the pitch kit.

### 5.5 Features that make the AI visible
| Feature | Pipeline provides | Rendered in |
|---|---|---|
| Why this county | a **what-if** per input group (own history, neighbours, long memory, El Nino): recompute the chance with that group set to its training median and report the three largest changes. Label it "what-if, not a cause". A forest's built-in importances are for all counties together and cannot be used per county. | `countyCard` in `platform.js` |
| Forecast versus rule, with intervals | section 3.1 intervals for trigger and allocation | `renderSources` in `platform.js`, `landing.js` |
| Uncertainty on the map | `weeks_low`, `weeks_high` (exist); calibration table | `scanmap.js` |
| Forecast log | `reports/prospective/` | `renderSources` |
| What the forecast changes | section 4.9 table | district view in `platform.js` |

### 5.6 Site logic tests
Move into `app/site/js/logic.js` (no page code, same wrapper as `engine.js`): `esc`, `usd`, `num`,
`tierFor`, `actionFor`, `planFor`, `canalNumbers`, `workTime` from `common.js`; `gal`, `money`,
`scopeP`, `simScope`, `hitRates` from `platform.js`. Tests: escaping of all five special
characters; the plan equals the pipeline's `spent_usd`; `simScope` week alignment.
This extraction lands before any feature work in `platform.js`.

---

## 6. Tests and acceptance

`tests/pipeline/test_round3.py` (owner A):
- `test_frozen_numbers_reproduce`: 1912, 2328, 14.0 within the tolerance in 3.0.
- `test_bootstrap_is_seeded_and_resamples_years`
- `test_trigger_annual_has_one_row_per_county_year`: 558 rows.
- `test_calibration_ignores_the_year_it_scores`: rewrite year Y's truths; output for Y unchanged.
- `test_allocation_ranks_use_only_issue_date_columns`
- `test_daily_inputs_respect_the_lag`
- `test_holdout_is_disjoint_from_the_436`
- `test_pretraining_excludes_focus_and_holdout`
- `test_outlook_early_stopping_uses_only_the_fold's_training_years`
- `test_prospective_files_are_never_rewritten`
- `test_decision_record_precedes_results` (git order)

`tests/pipeline/test_physics.py` (owner B):
- `test_unit_ksat_conversion`: 1 micrometre per second gives 2.1205.
- `test_total_seepage_under_total_loss`: summed calibrated seepage never exceeds summed `Loss_d`.
  Any district above its own `Loss_d` is listed and flagged on the page. (A per-district test
  cannot hold with one pooled factor.)
- `test_excluded_never_funded`
- `test_lodo_reported`: the metrics hold the model's numbers, both rivals' and the interval.
- `test_seepage_share_is_not_in_the_fit`

Engine (`engine.test.js`): the physics draw is shared across policies; zero `seepMult` gives
zero saving; bands widen when physics is sampled.

Site: `test_no_bare_dollar`: site strings containing "$" carry a band.

**Done means:** all of the above pass in CI on the final commit; `reports/frozen/v1/` exists and
CI reproduces it; the site builds from validated files; one product remains in the repo.

---

## 7. Order of work

**Phase 0 (hours 0 to 2). Serial. Nothing else merges until it is green.**
1. Humans: send the district and extension emails; confirm the deployment root (section 9);
   commit the section 3.9 text to `reports/decision.md`.
2. One agent: section 5.1 deletes; `ci.yml` skeleton. Start data downloads only. No training yet.

**Phase 1 (hours 2 to 6), parallel.**
- A: freeze (3.0), then 3.1, 3.2, 3.3, then 3.4 (allocation); 3.7 holdout list; 3.8 log;
  3.5 downloads continue.
- B: 4.1 soil query; 4.2 classes, including moving the map matching out of `build_site.py`.
  Then 5.2, once A's freeze has merged.
- C: 5.6 logic extraction.
- D: 4.10 wording in the HTML.
- E: CI gates.

**Checkpoint, hour 6.** A human merges the version 1 frozen output (`reports/frozen/v1/`). Read
the allocation result: is the interval clear of zero? If not, report the tie and move effort to
section 4. Start the GRU now or drop it.

**Phase 2 (hours 6 to 13), parallel.**
- A: 3.6 model comparison; 3.5 features; score the holdout once.
- B: 4.3, 4.4, data for 4.5 and 4.9; 5.4 build changes; then 4.6 only if time remains.
- C: 4.7, 4.8; render 4.5 and 4.9; section 5.5 features.
- D: map and page work for 5.5; loaders for 5.4.
- E: refresh fix.

**Checkpoint, hour 10.** Any outside reply? If not, the write-up names who was asked and when.

**Hour 13: feature freeze.** Round-3 result files are final. Fixes only.

**Phase 3 (hours 13 to 17), humans.** Write-up, AI tools list, video. `docs/OWNERS.md`. Each member
rehearses explaining their folders and one live change.

---

## 8. Rules for many agents

| Owner | Paths |
|---|---|
| A evaluation | in `src/farmdrought/`: `alert.py`, `outlook.py`, `trigger.py`, `v2.py`, `robustness.py`, `drought.py`, `features.py`, `refresh.py`, and the new files from section 3; `evaluate()` in `export.py`; `tests/pipeline/test_round3.py` |
| B physics and build | `leaks.py`, `districts.py`, `canal_class.py`, `seepage_calibration.py`, `costs.py`, `greenness.py`; `predict()` in `export.py`; lines 130 to 171 of `config.py`; `app/*.py` including `build_site.py`; `tests/app/`, `tests/pipeline/test_physics.py`, `test_costs.py` |
| C site logic | `app/site/js/logic.js`, `common.js`, `platform.js`, `app/site/sim/` |
| D site visuals | `scanmap.js`, `twin.js`, `landing.js`, `opening.js`, CSS, HTML |
| E CI | `.github/` only |
| **Human merges** | split constants and `SCORE_THROUGH` in `config.py`, `data/manifest.json`, `reports/frozen/`, `reports/decision.md`, the column lists in `contract.py`, every citation and URL |

- `export.py` is shared: A lands the `evaluate()` / `predict()` split first, then B works on `predict()`.
- `build_site.py` has one owner, B. C and D request fields; they do not edit it.
- `platform.js` has one owner, C. Nobody else edits it.
- One branch per agent; rebase on main; merge only when CI is green; no force-push.
- For human-only paths an agent opens a pull request and a human merges it.
- Tag `good-HH` every three hours. Deploy only from tags.
- Agents read a file in full before changing it. The reviewers who drafted this read
  `platform.js`, `build_site.py`, `contract.py`, `scanmap.js`, `twin.js`, `opening.js` and
  `streamlit_app.py` only in part.

**Three ways this fails, and the guard for each**
| Failure | Guard |
|---|---|
| Broken site at the deadline | three-hourly tags; deploy from tags; freeze at hour 13 |
| A late evaluation rerun changes the headline numbers | version 1 frozen by hour 6; the frozen gate in CI |
| An agent tunes on test years or invents a source | human-merged paths; `test_decision_record_precedes_results`; humans open every link |

---

## 9. Verify before building on it

These came from the reviewers' knowledge or from search summaries. None has been confirmed.
- **Deployment root.** There is no `vercel.json` in the repo. `platform.js:842` fetches `api/live`,
  a serverless function under `app/site/api/`. Confirm in the hosting dashboard which folder is
  deployed before deleting or moving anything.
- **Soil service fields.** `chorizon.ksat_l/ksat_r/ksat_h` (reviewer confident);
  `muaggatt.wtdepannmin` (reviewer believes so). Test with a one-row query.
- **USGS code 33601.** Believed to be aqueduct. Check the code list before excluding those segments.
- **Daily weather sources.** Open-Meteo archive (variable names, rate limits, licence), gridMET,
  NOAA nClimGrid-Daily. None was checked.
- **Satellite access.** Sentinel-2 through Microsoft Planetary Computer or Earth Search on AWS;
  USDA Cropland Data Layer for the crop mask. Access paths were not checked.
- **PyTorch on the CI runner.** It is installed on the machine used for this review; it is not in
  `requirements-pipeline.txt`.
- **The 44,000 acre-feet figure** in `app/reference/costs.json`: is it per year?
- **Prior-work claims.** The Bureau of Reclamation seepage index and the UC Berkeley drought
  comparison were read as search summaries only. Read the sources before citing them.
- **District crosswalk** between map names and the 1998 table.

---

## 10. Needs a human

- Emails to irrigation districts and Texas A&M extension, and anything quoted from a reply.
- Every citation and link.
- The district crosswalk.
- The deployment check.
- Merging changes to `reports/decision.md`, `reports/frozen/`, `data/manifest.json` and the split
  constants.
- `docs/OWNERS.md`: each file, a named person, three lines in their own words.
- The write-up, the AI tools list and the video.

---

## 11. What was checked, and what was not

**Check 1, against the repo.** 110 file paths in this document were tested: every one exists or
is declared NEW. Confirmed by direct reading: the three headline numbers and the latest week;
`refresh.py:169-176`; `export.py:38`; `config.py:136`; `engine.js:178` and `:344`;
`platform.js:578`; `mapfields.py:58-59`; `landing.js:45-48`; `osm_canals.py:55`;
`app/canal.py:74`; `build_site.py:246-292`; `contract.validate_all` exists; every function named
in 5.6 exists; the six holdout river names are in the rivers file; `d2_streak`, `mean12`,
`v2.pick_by_past`, `SELECT_START` and `flow.past_percentile` exist; the soil query joins
`chorizon`; 1,674 trigger rows and 558 county-years; 12,029 segments coded 33600 and 142 coded
33601; `robustness.json` holds 2324; the kept files import nothing from the delete list.

**Check 2, cross-review.** Each reviewer read the other two's sections against the code. Thirty
problems were raised and all are corrected above. The ones that would have caused damage:
- Moving the scored files would have broken the site build and the contract (now one commit).
- The freeze collided with the later experiments (now `frozen/v1/` and `frozen/round3/`).
- Outlook folds could have seen later years through early stopping (now per-fold).
- Label windows could have crossed the cut-off (now truncated before labels are built).
- The seepage share was counted twice (now only in the simulation).
- The canal classifier needed data that is attached later (now moved earlier).
- Two tests could not pass as written; two CI gates could not work as written.
- Agents were told to commit to human-only paths (now pull requests merged by a human).
- Per-county "top inputs" did not exist for a forest (now a stated what-if method).
- The physical validation had no interval, against rule 5 (now a bootstrap over districts).
- The satellite control rested on a tag known to be unreliable (now exploratory only).
- A cause for the 2324 / 2328 difference was stated as fact (now "not established").

**Check 3, final read.** Reviewer disagreements were settled by checking the repo: the canal
codes, where the map matching lives, and which tests import the demo loader.

**Not done.**
- No code in this plan has been written or run.
- The Python test suite has not been run during this review (`pyarrow` was missing on the
  machine used). The site's JavaScript tests pass, 17 of 17.
- Parts of `platform.js`, `build_site.py`, `contract.py`, `scanmap.js`, `twin.js`, `opening.js`
  and `streamlit_app.py` were not read in full by any reviewer.
- Nothing in section 9 has been verified.
- The probabilities quoted are reviewers' judgement, not measurements.

---

## 12. Corrections after the build (added Nov 15, 2026)

The sections above are left as they were written. This section says where they turned out wrong and what the repo holds instead. Results are in `reports/decision.md` and `reports/frozen/`.

**Errors in the plan**
- **Section 5.3, "pytest tests".** The two test folders cannot be collected together: both hold a file named `test_contract.py`. CI runs `tests/app` and `tests/pipeline` as two steps.
- **Section 5.1, the delete order.** Step 6 had to come before step 4: `tests/app/test_contract.py` needed its fixture path built before the demo loader could go. The end state is as listed.
- **Section 3.0, the freeze.** The frozen files were scored on a laptop (macOS, Python 3.13), not on the CI runner. The laptop gives 2,324 for the 6-month cost and the runner gave 2,328 earlier. CI now retrains version 1 on every push (`tools/reproduce.py`) and requires each headline number to be within 1% of the frozen one.
- **Section 4.3, "18 usable rows".** Only 14 districts could be fitted: four names in the 1998 table have no match in the district map under the no-guess rule (Adams Garden, HCMUD, HCWID#3, Santa Maria).
- **Section 4.4, the fallback wording.** "Only the ranking order is shown" was the declared fallback if the held-out test failed. The test failed and the ranking was not supported either (canal length alone orders the districts at 0.92), so the site says neither the volumes nor the order is a tested result.
- **Section 1.2.** The headline 6-month number that the frozen run reproduces is 2,324, not 2,328.

**Declared and delivered differently**
- **Section 3.5 (daily inputs) and the GRU in 3.6** were not built. Monthly NOAA county rain, temperature and Palmer drought index were used instead (`src/farmdrought/climate.py`), in the round-4 holdout test.
- **Section 3.6** was run in a cheap form: default gradient boosting against the forest (`boosting.py`). It lost.
- **Section 3.7 (the six-river holdout)** was run in round 4 (`holdout.py`), with one general model declared first. It tied the simple rule.
- **Section 4.6 (satellite greenness)** was not started.
- **New in round 4, not in this plan:** a check of the leak model against 16 measured canal tests (`ponding.py`, `data/round4/ponding_tests.csv`).
- **New files not in section 2:** `manifest.py`, `round3.py`, `boosting.py`, `climate.py`, `holdout.py`, `ponding.py`, `tools/reproduce.py`, `tools/hash_list_gate.py`, `tools/site_size.py`, `vercel.json`, `api/live.js`.

**Added after this section was first written (rounds 5 to 7)**
- `quarter.py`: a three-month outlook, tested on eight more unseen rivers (a tie with "D2 or worse now").
- `area.py`, `edge.py`: the Drought Monitor's county area shares as inputs; on 693 unseen western counties the three-month forecast beat that rule at a miss worth three false alarms.
- `east.py`, `costwindow.py`, `live_m.py`: a map-only version tested on 1,666 eastern counties, where it lost at that cost; the cost window; and a weekly forecast log for it.
- `data/round4/` with its own hash list, and `tools/verify.sh` and `tools/costratio.py`.

**Still open, and only people can close them**
- Section 9: the meaning of USGS code 33601; whether the 44,000 acre-feet figure is per year; the sealant price link; the district crosswalk (Donna, Bayview).
- Section 10: emails to districts, the write-up, the video, `docs/OWNERS.md`, and the names and tools list in `README.md`.
