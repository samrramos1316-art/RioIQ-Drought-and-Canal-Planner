"""quarter.py: a three-month outlook, scored ONCE on eight rivers never used before.

ADDED in round 5. Everything here was written down first, in reports/decision.md ("Round 5: a
three-month outlook, tested on eight more unseen rivers"). Version 1 is not changed.

THE QUESTION IT ANSWERS. "Will the next 13 weeks contain 8 or more weeks in a row of severe
drought (D2 or worse)?" Thirteen weeks is about how long one sealant application lasts, so it is
the question a district faces each time it decides whether to seal again.

THE MODEL. The general model of round 4 (holdout.py) with only the answer changed:
  - the version 1 forest, settings unchanged
  - the same 47 inputs (version 1's 34 plus NOAA's rain, temperature and drought index)
  - trained on the 436 development counties, forward chaining: a test year only sees answers
    that were known before it began
Two warning lines, neither chosen on data: 0.25 (break-even when a miss costs three false
alarms) and 0.50 (say whichever outcome is likelier).

THE NEW HOLDOUT. Counties within 50 km of eight more rivers, minus every county used in
rounds 1 to 4 (the 436 development counties and the 166 of round 4).

Run it with:  PYTHONPATH=src python -m farmdrought.quarter
              (writes reports/frozen/round3/quarter.json once, and reports/live/quarter.json)
"""
import json
import sys

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from farmdrought.climate import add_climate_features
from farmdrought.config import D2_CLASS, FOCUS_RIVER, FROZEN, LIVE, ROOT, ROUND3, SCORE_THROUGH, SEASON_RUN, SEASON_THRESHOLD
from farmdrought.drought import build_panel, label_season, load_usdm
from farmdrought.evaluate import tally
from farmdrought.holdout import FEATURES_G, HOLDOUT_RIVERS, development_table, holdout_table
from farmdrought.manifest import add_new_frozen_files
from farmdrought.outlook import chain, issue_rows, make_classifier
from farmdrought.round3 import compare, cost_by_year, header, write_items

OUTPUT = "quarter.json"
LIVE_OUTPUT = LIVE / "quarter.json"
DECLARED_IN = ('reports/decision.md, section "Round 5: a three-month outlook, tested on eight more unseen rivers '
               '(declared Nov 15, 2026, before any of those counties was loaded or scored)"')
QUARTER_WEEKS = 13
QUARTER_RIVERS = ["Red", "North Platte", "South Platte", "Green", "Yellowstone", "Sacramento", "San Joaquin", "Humboldt"]
LIKELIER_LINE = 0.5        # warn when a drought season is the likelier outcome
D1_CLASS = D2_CLASS - 1
LABEL = "y_quarter"


def add_quarter_label(table):
    """Add the 13-week answer to a table of county-weeks (columns fips, date).

    It is built from the same drought file, cut at config.SCORE_THROUGH, with the same rule as
    the 6-month answer (drought.label_season) and a 13-week window. NaN where the 13 weeks are
    not over yet.
    """
    usdm = load_usdm()
    in_time = usdm["dates"] <= pd.Timestamp(SCORE_THROUGH)
    dates, classes = usdm["dates"][in_time], usdm["classes"][:, in_time]
    row_of = {fips: i for i, fips in enumerate(usdm["fips"])}
    counties = list(table["fips"].unique())
    answers = label_season(classes[[row_of[f] for f in counties]], horizon=QUARTER_WEEKS, run=SEASON_RUN)
    long = pd.DataFrame({"fips": np.repeat(counties, len(dates)), "date": np.tile(dates, len(counties)),
                         LABEL: answers.ravel()})
    return table.merge(long, on=["fips", "date"], how="left", validate="many_to_one")


def new_holdout_table(used_fips):
    """Monthly issue rows for counties near the eight new rivers that were never used before."""
    return issue_rows(build_panel(score_through=SCORE_THROUGH, rivers=QUARTER_RIVERS, exclude=used_fips))


def forecasts(dev, hold):
    """Train on development rows only, forecast every row. Adds the column p_quarter and a
    True/False column "holdout"."""
    table = pd.concat([dev.assign(holdout=False), hold.assign(holdout=True)], ignore_index=True)
    table = add_quarter_label(add_climate_features(table))
    missing = int(table[FEATURES_G].isna().any(axis=1).sum())
    if missing:
        raise ValueError(f"{missing} rows have no climate inputs (is every county in data/round4?)")
    everyone = pd.Series(True, index=table.index)
    table["p_quarter"] = chain(table, LABEL, QUARTER_WEEKS, FEATURES_G, make_classifier,
                               train_on=~table["holdout"], predict_on=everyone)
    return table


def scored_rows(table):
    """Rows in the test years whose answer is known and whose full 52-week future is known
    (the same rows version 1 scores)."""
    known = table["p_quarter"].notna() & table[LABEL].notna() & table["y_weeks"].notna()
    return table[known].reset_index(drop=True)


def alarms(rows):
    """Every policy's warnings on these rows, as True/False columns."""
    return pd.DataFrame({
        "model at 0.25": rows["p_quarter"] >= SEASON_THRESHOLD,
        "model at 0.50": rows["p_quarter"] >= LIKELIER_LINE,
        "D2 now": rows["cls"] >= D2_CLASS,
        "D1 now": rows["cls"] >= D1_CLASS,
        "never warn": False,
    }, index=rows.index)


def block(rows, rows_used):
    """Everything reported for one group of rows."""
    y, fires = rows[LABEL] == 1, alarms(rows)
    years = rows["date"].dt.year
    policies = {}
    for name in fires:
        counts = tally(rows[LABEL], fires[name])
        right = fires[name] == y
        by_year = right.groupby(years).mean()
        counts.update(share_right=round(float(right.mean()), 3), lowest_year=round(float(by_year.min()), 3),
                      highest_year=round(float(by_year.max()), 3))
        policies[name] = counts
    cost = {name: cost_by_year(rows.assign(alarm=fires[name]), LABEL, "alarm") for name in fires}
    return {
        "rows": int(len(rows)), "counties": int(rows["fips"].nunique()), "years": int(years.nunique()),
        "base_rate": round(float(y.mean()), 3), "auc": round(float(roc_auc_score(y, rows["p_quarter"])), 3),
        "policies": policies,
        "model_minus_d2": compare("3-month cost: model at 0.25 minus 'D2 or worse now'", cost["model at 0.25"],
                                  cost["D2 now"], None, True, rows_used, a_name="model", b_name="D2 now"),
        "model_minus_d1": compare("3-month cost: model at 0.25 minus 'D1 or worse now'", cost["model at 0.25"],
                                  cost["D1 now"], None, True, rows_used, a_name="model", b_name="D1 now"),
    }


def summary_row(name, comparison):
    """One row for the website's results table, taken from a compare() result."""
    primary = comparison["block1"]
    return {"name": name, "value": primary["diff"], "lo": primary["lo"], "hi": primary["hi"],
            "n_years": primary["n_years"], "verdict": primary["direction"], "lower_is_better": True}


def quarter_item(table):
    """The content of quarter.json (without its header). table: the output of forecasts()."""
    scored = scored_rows(table)
    hold, dev = scored[scored["holdout"]], scored[~scored["holdout"]]
    everything = block(hold, "all new holdout counties: monthly issue rows, test years, full 52-week future known")
    rio_grande = block(dev[dev["river"] == FOCUS_RIVER], "Rio Grande counties (NOT blind: seen in development)")
    return {
        "what": "A 3-month outlook (8 straight D2 weeks inside the next 13 weeks) from the general model, scored "
                "once on counties along eight rivers never used before. share_right is the share of forecasts "
                "that were right. Cost = 3 x missed + false alarms; lower is better.",
        "model": {"forest": "version 1 settings", "trained_on": "the 436 development counties, forward chaining",
                  "inputs": FEATURES_G, "lines": [SEASON_THRESHOLD, LIKELIER_LINE]},
        "holdout_rivers": QUARTER_RIVERS,
        "counties_per_river": {river: int(n) for river, n in hold.groupby("river")["fips"].nunique().items()},
        "states": sorted(hold["state"].unique()),
        "new_holdout": everything,
        "per_river": {river: {"counties": int(g["fips"].nunique()), "base_rate": round(float((g[LABEL] == 1).mean()), 3),
                              "share_right_model_050": round(float(((g["p_quarter"] >= LIKELIER_LINE) == (g[LABEL] == 1)).mean()), 3),
                              "share_right_d2_now": round(float(((g["cls"] >= D2_CLASS) == (g[LABEL] == 1)).mean()), 3)}
                      for river, g in hold.groupby("river")},
        "rio_grande_not_blind": rio_grande,
        "site_summary": [
            summary_row("3-month outlook, eight unseen rivers: model minus 'D2 or worse now' (cost)", everything["model_minus_d2"]),
            summary_row("3-month outlook, eight unseen rivers: model minus 'D1 or worse now' (cost)", everything["model_minus_d1"]),
            summary_row("3-month outlook, Rio Grande (not blind): model minus 'D2 or worse now' (cost)", rio_grande["model_minus_d2"]),
        ],
    }


def this_weeks_forecast(dev):
    """The newest 3-month chance for each Rio Grande county, from one forest trained on every
    development row whose 13-week answer is known. Not a scored result: its answer is not known yet."""
    table = add_quarter_label(add_climate_features(dev))
    known = table[LABEL].notna()
    model = make_classifier().fit(table.loc[known, FEATURES_G], table.loc[known, LABEL])
    newest = table[(table["river"] == FOCUS_RIVER) & (table["date"] == table["date"].max())]
    chance = model.predict_proba(newest[FEATURES_G])[:, 1]
    return {"issued": str(newest["date"].iloc[0].date()), "weeks_ahead": QUARTER_WEEKS,
            "what": "Chance of 8 straight weeks at D2 or worse inside the next 13 weeks, per Rio Grande county.",
            "counties": {fips: round(float(p), 3) for fips, p in zip(newest["fips"], chance)}}


def main():
    if (ROUND3 / OUTPUT).exists():
        write_items({OUTPUT: None})   # raises: already scored, and this test is run once
    with open(FROZEN / "metrics.json") as f:
        frozen = json.load(f)
    dev = development_table()
    round4 = holdout_table(set(dev["fips"]))                       # only to know which counties are used
    used = set(dev["fips"]) | set(round4["fips"])
    hold = new_holdout_table(used)
    content = {**header(frozen), "declared_in": DECLARED_IN, "counties_already_used": len(used),
               "round4_rivers_excluded": HOLDOUT_RIVERS, **quarter_item(forecasts(dev, hold))}
    for path in write_items({OUTPUT: content}):
        print("wrote", path.relative_to(ROOT))
    add_new_frozen_files()
    LIVE_OUTPUT.write_text(json.dumps(this_weeks_forecast(dev), indent=2) + "\n")
    print("wrote", LIVE_OUTPUT.relative_to(ROOT))


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.quarter")
    main()
