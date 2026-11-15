# RioIQ: Rio Grande drought forecast and canal sealing planner

**Track:** AI + Climate | **Team:** Team Credo | **Live site:** https://hackathon-drought.vercel.app | **Video:** [TEAM: paste the video link]

## The problem

Farms and towns on the Texas Rio Grande get their water through earth canals, and part of it soaks into the ground on the way. In a drought year that lost water is the difference between a crop and a ploughed-under field. An irrigation district can seal its leakiest canals before the season, but it has to decide months ahead, with a small budget, which canals and whether this is the year.

## What we built

1. **A drought forecast.** For each of the 31 Rio Grande counties: the chance of a severe-drought season (8 or more weeks in a row at D2 or worse) in the next three months and in the next six, a 4-week alert and a 12-month outlook.
2. **A canal ranking.** Every mapped canal segment in the Texas districts, with the soil under it and a modelled seepage rate, ranked so a budget goes to the leakiest canals first.
3. **A simulation.** One district, several, or all of them, replayed through the real years 2008 to 2025 and through 300 possible futures: doing nothing beside sealing early. Every dollar and gallon figure is a range and is labelled "modelled, not measured".
4. **A website** (plain HTML and JavaScript, no build step): an intro page and a platform with four steps (risk, budget plan, simulation, sources).

## How the forecast works

- **Inputs, six-month outlook (34):** each county's weekly U.S. Drought Monitor class and its history, its neighbours within 150 km, how drought-prone it has been over one to three years, the time of year, and the Pacific El Nino index.
- **Inputs, three-month outlook (66):** those 34, plus NOAA's county rain, temperature and Palmer drought index (13), plus the share of the county's area in each drought class and the same for its neighbours (19).
- **Model:** a random forest for each question (80 trees for the six-month outlook, 300 for the three-month one).
- **Testing:** always by time. For each test year from 2008 to 2025 a fresh model is trained only on answers that were fully known before that year began.
- **Compared with simple rules**, such as "the county is already in moderate drought (D1) now". A result counts as a win only if its year-block bootstrap interval excludes zero.

## Results, stated the way they fell

Cost = 3 x missed drought seasons + false alarms (our assumption). Lower is better.

| Test | Our forecast | Best simple rule | Difference (95% interval) | Verdict |
|---|---|---|---|---|
| 6-month outlook, Rio Grande, 2008-2025 | 2,324 | 2,382 ("D1 now") | -58 (-276 to 171) | tie |
| 4-week alert, Rio Grande, 2019-2026 | 1,912 | 1,971 ("worsening") | -59 (-316 to 232) | tie |
| 12-month outlook, average error in weeks | 14.0 | 14.5 ("same as now") | -0.5 (interval crosses zero) | tie |
| 6-month outlook against "wait for D2" | 2,324 | 3,133 | 26% cheaper | ahead |
| **Six rivers never used (166 counties, 35,690 forecasts)**, general model | 14,334 | 14,041 ("D1 now") | +293 (-819 to 1,537) | tie |
| Same holdout, against "wait for D2" | 14,334 | 15,966 | -1,632 (-2,429 to -894) | ahead |
| Which counties to fund first (March, 18 years), share that then had a drought season | 0.726 | 0.711 (rule A), 0.705 (rule B) | +0.015 (-0.003 to 0.035); +0.020 (0.001 to 0.046) | tie with A; unsettled against B (depends on how equal ranks are broken) |
| 3-month outlook, eight more rivers never used (136 counties, 29,240 forecasts), cost | 4,666 | 4,718 ("D2 now") | -52 (-200 to 64) | tie |
| **3-month outlook with area inputs, 693 western counties never used (148,995 forecasts), cost** | **23,583** | 24,955 ("D2 now") | **-1,372 (-2,386 to -420)** | **ahead: 5.5% less cost, in all 17 states** |
| The same on the Rio Grande (not blind) | 1,219 | 1,402 ("D2 now") | -183 (-290 to -82) | ahead: 13% less cost |

In plain words:

- **Three months ahead, the forecast beats the best simple rule, when a missed drought season costs three false alarms.** Given how much of each county's area is in drought (not just its worst class), it cost 5.5% less than "severe drought now" on 693 counties it had never seen, and the whole interval is below zero. It missed a quarter fewer drought seasons (3,938 against 5,270) and raised more false alarms (11,769 against 9,145).
- **The win depends on that cost rule.** The 3-to-1 ratio has been fixed since the project's first commit. At 3 to 1 or steeper the model wins; at 2 to 1 or at equal costs the two tie. At the 0.25 warning line the model is right in 89.5% of forecasts and the rule in 90.3%.
- **No simple rule built from the same area data comes close** (the best one found after the fact still loses to the model by 1,231, interval -2,083 to -449).
- **Six months ahead it ties the best simple rule** ("moderate drought now"), on the Rio Grande and on six rivers it had never seen, with about 78 to 79% of forecasts right ("D2 now" is right 81% of the time there but misses far more drought seasons). It is clearly better than waiting for severe drought to appear.
- **One approach, both horizons.** The best rule of thumb changes with the horizon: "moderate drought now" at six months, "severe drought now" at three. A forest trained for each horizon matches or beats the better one each time.
- **Things we tried that did not help:** rain, temperature and soil-moisture inputs at six months; gradient boosting; recalibrating the probability; a warning line picked from past years. All are reported in `reports/decision.md`.
- **The start of a severe drought six months ahead** in a county that is not yet dry is close to unforecastable from these inputs (AUC about 0.6).

## The leak model, and how far to trust it

- Seepage rates come from a published table by soil texture (Texas A&M, 1998, quoting 1946 measurements).
- **Against 1998 district loss estimates** it did not predict held-out districts better than canal length alone (32.7% against 36.5% median error; the interval includes zero).
- **Against 16 measured tests on unlined canals** (Texas A&M ponding tests, 1998-2005):
  - Soil permeability put the canals in roughly the right order (rank correlation 0.58, interval 0.23 to 0.78), but its level is about 14 times too high.
  - The soil-texture table, which is what the site ranks canals with, is closer in level (the measured leak was about half its rate) but its order is not shown to be better than chance (0.25, interval -0.23 to 0.63).
  - So every leak volume on the site is an upper estimate, and the canal order is an illustration of the method.
- No public source says which canals are already lined, so every canal is treated as bare earth.
- Sealant price, effect and life are published figures; nothing was field-tested on the Rio Grande.

## What this project does not claim

1. It does not decide or predict any government payment, and it is not financial or legal advice.
2. It does not tell anyone how to allocate water.
3. No number of gallons or dollars saved has been measured. Every such figure is modelled and shown as a range.
4. It was built for 31 Rio Grande counties and the Texas districts below them.

## Repository map

| Path | What it holds |
|---|---|
| `app/site/` | The website. `index.html` (intro), `app.html` (platform), `js/`, `css/`, `sim/engine.js` (the simulation), `data/` (built files) |
| `app/build_site.py` | Builds `app/site/data/` from the pipeline's outputs, after checking them against the data contract (`app/contract.py`) |
| `src/farmdrought/` | The pipeline: drought panel and inputs, the three forecasts, the tests against simple rules, the canal and leak model |
| `data/raw/` | The snapshot every frozen result was scored on (hashes in `data/manifest.json`) |
| `data/round4/` | Inputs added for rounds 4 to 6: NOAA county climate cuts, the Drought Monitor's county area shares, measured canal tests and their sources (hashes in `data/round4.sha256`) |
| `reports/frozen/` | Results scored once and never rewritten (hashes in `reports/frozen.sha256`, enforced in CI) |
| `reports/decision.md` | Every experiment, written down before it was run, and what it showed |
| `reports/prospective/` | Each week's forecast, logged before the answer is known |
| `tests/` | `tests/app`, `tests/pipeline`; the site's own tests sit beside the code (`*.test.js`) |
| `tools/` | Small scripts used by CI (`reproduce.py`, `site_size.py`, `hash_list_gate.py`) |
| `ARCHITECTURE.md` | The build plan for the last stretch, with its corrections |

## Run it

```bash
pip install -r requirements-pipeline.txt -r requirements-app.txt

# tests
python -m pytest tests/app -q
PYTHONPATH=src python -m pytest tests/pipeline -q
node app/site/sim/engine.test.js && node app/site/js/logic.test.js

# retrain version 1 and compare with the frozen numbers (a few minutes)
PYTHONPATH=src python tools/reproduce.py

# rebuild the website's data and open it
python app/build_site.py
cd app/site && python -m http.server 8000
```

A daily job (`.github/workflows/refresh.yml`) downloads the newest drought map and reservoir readings and rebuilds this week's forecast. It never re-scores a model.

## Sources

- Drought classes: U.S. Drought Monitor (NDMC, USDA, NOAA), https://droughtmonitor.unl.edu ; county archive by the Montana Climate Office ; county area shares from the Drought Monitor's data service, https://usdmdataservices.unl.edu
- El Nino index: NOAA Climate Prediction Center, https://www.cpc.ncep.noaa.gov
- County rain, temperature and Palmer drought index: NOAA nClimDiv, https://www.ncei.noaa.gov/pub/data/cirs/climdiv/
- River lines: Natural Earth (public domain), https://www.naturalearthdata.com ; canal detail: OpenStreetMap contributors
- Canal lines: U.S. Geological Survey, National Hydrography Dataset, https://www.usgs.gov/national-hydrography ; soils: USDA NRCS Soil Survey (SSURGO)
- Reservoir storage: Texas Water Development Board, https://waterdatafortexas.org
- Insured drought losses: USDA Risk Management Agency, Cause of Loss files
- District efficiency and seepage rates: Texas A&M (Fipps), 1998, https://gfipps.tamu.edu/files/2019/12/RGV-Potential-Water-Savings.pdf
- Measured canal seepage tests: Texas A&M (Leigh and Fipps), 2002-2008; each report is listed in `data/round4/ponding_sources.md`
- Sealant price and reapplication: U.S. Bureau of Reclamation, https://www.usbr.gov/research/projects/detail.cfm?id=845
- Sealant field results: Desert Research Institute, https://www.researchgate.net/publication/270766967_Field_Demonstration_of_Polyacrylamide_in_an_Unlined_Irrigation_Canal ; Lund et al. 2021, https://www.sciencedirect.com/science/article/abs/pii/S0378377421001633
- Valley lining programme ($164 million, 44,000 acre-feet, 12 districts): https://smartwatermagazine.com/news/smart-water-magazine/nadbank-backs-164-million-water-conservation-push-in-texas-and-mexico
- Stories and photographs on the intro page carry their own source links there.
- Libraries: pandas, NumPy, scikit-learn, pyarrow, requests, dataretrieval, pytest. The website uses no library.


## AI tools used, and what for

- **Claude Code** (Anthropic's coding assistant): wrote most of the code under our direction, including the data pipeline, the forecasting and test scripts, the simulation engine, the website and the automated tests. We also used it to run the experiments, to audit the code for bugs and data leakage, and to draft documentation, including this README and `reports/decision.md`.
- **Perplexity:** research. Finding and reading sources on the Rio Grande, irrigation districts, canal seepage and sealants, and drought programmes.

What the team did: chose the problem and the users, decided what to build and what to test, set the rules in `reports/decision.md` (declare before running, nothing tuned on test years, report ties and losses), reviewed results, and made every call on wording and claims. The forecast itself is a random forest (scikit-learn); no large language model is part of the product or of any prediction.

Licence: MIT for the code (see `LICENSE`). Data and photographs keep their sources' terms.
