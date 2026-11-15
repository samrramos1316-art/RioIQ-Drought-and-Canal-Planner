"""holdout.py: one general forecast, scored ONCE on six rivers it has never seen.

ADDED in round 4. Everything this file does was written down first, in reports/decision.md
("Round 4: one general forecast, tested on six rivers it has never seen"). Read that section
before this file. Version 1 is not changed and stays the reported Rio Grande system.

THE QUESTION. On the Rio Grande the 6-month forecast only ties the rule "D1 or worse now".
Does a forecast that (a) learns from every river and (b) also sees NOAA's rain, temperature
and soil-moisture record beat that rule on rivers that were never used for anything?

THE MODEL ("G", the general model)
  - the version 1 forest, settings unchanged (outlook.make_classifier)
  - trained on all 436 counties along the five development rivers
  - inputs: version 1's 34, plus climate.py's sets P, W and N (47 in all)
  - forward chaining exactly as version 1: a test year only sees answers known before it began
  - warns when the probability is 0.25 or more (the fixed break-even line)

THE HOLDOUT. Counties whose centre is within 50 km of the Pecos, Canadian, Gila, San Juan,
Brazos or Arkansas river, minus the 436 counties already used. No holdout county is ever in
a training row: the training mask below is "not a holdout county".

WHAT IS REPORTED. Cost = 3 x missed + false alarms (lower is better). The primary number is
G's cost minus the rule's cost over all holdout counties, with a year-block interval. It is a
win only if that interval lies wholly below zero.

Run it with:  PYTHONPATH=src python -m farmdrought.holdout
              (writes reports/frozen/round3/holdout.json once; it refuses to run twice)
"""
import json
import sys

import pandas as pd
from sklearn.metrics import roc_auc_score

from farmdrought.climate import FEATURES_N, FEATURES_P, FEATURES_W, add_climate_features
from farmdrought.config import D2_CLASS, FOCUS_RIVER, FROZEN, ROOT, ROUND3, SCORE_THROUGH, SEASON_THRESHOLD, SEASON_WEEKS
from farmdrought.drought import build_panel
from farmdrought.evaluate import tally
from farmdrought.manifest import add_new_frozen_files, check_round4
from farmdrought.outlook import FEATURES_SEASON, chain, issue_rows, make_classifier
from farmdrought.round3 import compare, cost_by_year, header, write_items

OUTPUT = "holdout.json"
DECLARED_IN = ('reports/decision.md, section "Round 4: one general forecast, tested on six rivers it has never seen '
               '(declared Nov 15, 2026, before any holdout county was loaded, trained on or scored)"')
HOLDOUT_RIVERS = ["Pecos", "Canadian", "Gila", "San Juan", "Brazos", "Arkansas"]
FEATURES_G = FEATURES_SEASON + FEATURES_P + FEATURES_W + FEATURES_N   # the general model's 47 inputs
D1_CLASS = D2_CLASS - 1


def development_table():
    """Monthly issue rows for the 436 counties on the five development rivers."""
    return issue_rows(build_panel(score_through=SCORE_THROUGH))


def holdout_table(used_fips):
    """Monthly issue rows for the holdout counties: near one of the six rivers, and not used before."""
    return issue_rows(build_panel(score_through=SCORE_THROUGH, rivers=HOLDOUT_RIVERS, exclude=used_fips))


def forecasts(dev, hold):
    """Train on development rows only and forecast every row. Returns one table holding both
    groups, with a True/False column "holdout" and two forecasts:
        p_general : model G (all development counties, 47 inputs)
        p_v1      : version 1's recipe (Rio Grande rows only, 34 inputs)
    """
    table = pd.concat([dev.assign(holdout=False), hold.assign(holdout=True)], ignore_index=True)
    table = add_climate_features(table)
    missing = int(table[FEATURES_G].isna().any(axis=1).sum())
    if missing:
        raise ValueError(f"{missing} rows have no climate inputs (is every county in data/round4?)")
    everyone = pd.Series(True, index=table.index)
    season = dict(label="y_season", horizon=SEASON_WEEKS, make_model=make_classifier, predict_on=everyone)
    table["p_general"] = chain(table, features=FEATURES_G, train_on=~table["holdout"], **season)
    table["p_v1"] = chain(table, features=FEATURES_SEASON, train_on=table["river"] == FOCUS_RIVER, **season)
    return table


def scored_rows(table):
    """Rows in the test years whose full 52-week future is known: the same rule as version 1."""
    known = table["p_general"].notna() & table["y_season"].notna() & table["y_weeks"].notna()
    return table[known].reset_index(drop=True)


def alarms(rows):
    """Every policy's warnings on these rows, as True/False columns."""
    return pd.DataFrame({
        "general": rows["p_general"] >= SEASON_THRESHOLD,
        "v1": rows["p_v1"] >= SEASON_THRESHOLD,
        "d1": rows["cls"] >= D1_CLASS,           # the rule: "D1 or worse now"
        "d2": rows["cls"] >= D2_CLASS,           # persistence: "D2 or worse now"
        "always": True,
        "never": False,
    }, index=rows.index)


def policy_summary(rows):
    """Cost, precision, recall and plain accuracy of each policy on these rows."""
    out, fires = {}, alarms(rows)
    for name in fires:
        counts = tally(rows["y_season"], fires[name])
        counts["accuracy"] = round(float((fires[name] == (rows["y_season"] == 1)).mean()), 3)
        out[name] = counts
    return out


def cost_table(rows, years):
    """Each policy's cost per issue year. A year with no rows counts as zero cost."""
    fires = alarms(rows)
    return {name: cost_by_year(rows.assign(alarm=fires[name]), "y_season", "alarm").reindex(years, fill_value=0.0)
            for name in fires}


def block(rows, years, rows_used):
    """Everything reported for one group of rows (all holdout counties, or one river)."""
    cost = cost_table(rows, years)
    y = rows["y_season"]
    both_answers = y.nunique() == 2      # AUC needs at least one yes and one no
    return {
        "rows": int(len(rows)), "counties": int(rows["fips"].nunique()), "base_rate": round(float(y.mean()), 3),
        "policies": policy_summary(rows),
        "auc": {"general": round(float(roc_auc_score(y, rows["p_general"])), 3) if both_answers else None,
                "v1": round(float(roc_auc_score(y, rows["p_v1"])), 3) if both_answers else None},
        "general_minus_d1": compare("6-month cost: general model minus 'D1 or worse now'", cost["general"], cost["d1"],
                                    None, True, rows_used, a_name="general", b_name="D1 now"),
        "v1_minus_d1": compare("6-month cost: version 1 (Rio Grande-trained) minus 'D1 or worse now'", cost["v1"],
                               cost["d1"], None, True, rows_used, a_name="v1", b_name="D1 now"),
    }


def summary_row(name, comparison):
    """One row for the website's results table, taken from a compare() result."""
    primary = comparison["block1"]
    return {"name": name, "value": primary["diff"], "lo": primary["lo"], "hi": primary["hi"],
            "n_years": primary["n_years"], "verdict": primary["direction"], "lower_is_better": True}


def holdout_item(table):
    """The content of holdout.json (without its header). table: the output of forecasts()."""
    scored = scored_rows(table)
    hold, dev = scored[scored["holdout"]], scored[~scored["holdout"]]
    years = sorted(int(y) for y in hold["date"].dt.year.unique())
    everything = block(hold, years, "all holdout counties: monthly issue rows, test years, full 52-week future known")
    cost = cost_table(hold, years)
    # Rows where the county is NOT at D1 on the issue date: the rule cannot warn there.
    quiet = hold[hold["cls"] < D1_CLASS]
    quiet_cost = cost_table(quiet, years)
    rivers = {river: block(group, years, f"holdout counties nearest the {river}")
              for river, group in hold.groupby("river")}
    rg = dev[dev["river"] == FOCUS_RIVER]
    return {
        "what": "A general 6-month forecast (trained on the 436 development counties, 47 inputs) scored once on "
                "counties along six rivers that were never used. Cost = 3 x missed + false alarms; lower is better, "
                "so a difference below zero favours the model. Version 1 stays the reported Rio Grande system.",
        "model": {"forest": "version 1 settings (80 trees, depth 10, min leaf 20, sqrt inputs, seed 0)",
                  "trained_on": "all 436 development counties, forward chaining 2008 to 2025",
                  "inputs": FEATURES_G, "threshold": SEASON_THRESHOLD},
        "holdout_rivers": HOLDOUT_RIVERS,
        "counties_per_river": {river: int(n) for river, n in hold.groupby("river")["fips"].nunique().items()},
        "states": sorted(hold["state"].unique()),
        "primary": everything["general_minus_d1"],
        "all_holdout": everything,
        "also": [
            compare("6-month cost: general model minus 'D2 or worse now'", cost["general"], cost["d2"], None, True,
                    "all holdout counties", a_name="general", b_name="D2 now"),
            compare("6-month cost: general model minus always warning", cost["general"], cost["always"], None, True,
                    "all holdout counties", a_name="general", b_name="always warn"),
            compare("6-month cost: general model minus version 1", cost["general"], cost["v1"], None, True,
                    "all holdout counties", a_name="general", b_name="v1"),
        ],
        "not_at_d1": {
            "rows": int(len(quiet)), "base_rate": round(float(quiet["y_season"].mean()), 3),
            "auc_general": round(float(roc_auc_score(quiet["y_season"], quiet["p_general"])), 3),
            "general_minus_never": compare("rows not at D1 on the issue date: general model minus never warning",
                                           quiet_cost["general"], quiet_cost["never"], None, True,
                                           "holdout rows where the county is below D1 on the issue date",
                                           a_name="general", b_name="never warn"),
        },
        "per_river": rivers,
        "development_check": {
            "what": "The same run's numbers on the Rio Grande (NOT blind: seen in development). They must match "
                    "the declaration: general 2598, version 1 2324, 'D1 now' 2382.",
            "rio_grande": {name: counts["cost"] for name, counts in policy_summary(rg).items()},
        },
        # Short rows for the website's results table (app/build_site.py reads this key).
        "site_summary": [summary_row("Six unseen rivers: general model minus 'D1 or worse now' (cost)",
                                     everything["general_minus_d1"]),
                         summary_row("Six unseen rivers: version 1 minus 'D1 or worse now' (cost)",
                                     everything["v1_minus_d1"])]
                        + [summary_row(f"{river}: general model minus 'D1 or worse now' (cost)", b["general_minus_d1"])
                           for river, b in rivers.items()],
    }


def main():
    if (ROUND3 / OUTPUT).exists():
        write_items({OUTPUT: None})   # raises: already scored, and this test is run once
    problems = check_round4()
    if problems:
        raise RuntimeError("an input under data/round4 differs from data/round4.sha256, so nothing was scored:\n  "
                           + "\n  ".join(problems))
    with open(FROZEN / "metrics.json") as f:
        frozen = json.load(f)
    dev = development_table()
    hold = holdout_table(set(dev["fips"]))
    content = {**header(frozen), "declared_in": DECLARED_IN, **holdout_item(forecasts(dev, hold))}
    for path in write_items({OUTPUT: content}):
        print("wrote", path.relative_to(ROOT))
    add_new_frozen_files()            # record the new file's hash; existing lines are never changed


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.holdout")
    main()
