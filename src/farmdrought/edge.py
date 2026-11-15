"""edge.py: can the forecast BEAT the best simple rule? Scored ONCE on 693 western counties.

ADDED in round 6. Written down first in reports/decision.md ("Round 6: can the forecast beat
the best simple rule?"). Version 1 is not changed.

THE IDEA. Until now the model and the rule both read one number per county: the worst drought
class anywhere in it. area.py adds how much of the county's AREA is in each class, and the same
for its neighbours. The rule cannot see that.

THE MODEL ("E")
  - answer: 8 straight weeks at D2 or worse inside the next 13 weeks (the three-month outlook)
  - a forest of 300 trees, depth 14, at least 10 rows per leaf, seed 0
  - 66 inputs: the 47 of rounds 4 and 5, plus 14 on the county's own area and 5 on its neighbours'
  - trained on all 738 counties used in rounds 1 to 5, forward chaining (a test year only sees
    answers known before it began)
  - warns at 0.25, the fixed break-even line

THE BLIND SET. Every county in 17 western states with a complete drought record that was never
used before: 693 counties. No row of theirs is ever in training.

Run it with:  PYTHONPATH=src python -m farmdrought.edge
              (writes reports/frozen/round3/edge.json once; about 15 minutes)
"""
import json
import sys

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score

from farmdrought.area import FEATURES_A, FEATURES_NB, add_area_features
from farmdrought.climate import add_climate_features
from farmdrought.config import D2_CLASS, FOCUS_RIVER, FROZEN, LIVE, ROOT, ROUND3, SCORE_THROUGH, SEASON_THRESHOLD
from farmdrought.counties import load_county_centers
from farmdrought.drought import build_panel, load_usdm
from farmdrought.evaluate import tally
from farmdrought.holdout import FEATURES_G, development_table, holdout_table
from farmdrought.manifest import add_new_frozen_files, check_round4
from farmdrought.outlook import chain, issue_rows, make_classifier
from farmdrought.quarter import LABEL, QUARTER_WEEKS, add_quarter_label, new_holdout_table
from farmdrought.round3 import compare, cost_by_year, header, write_items

OUTPUT = "edge.json"
LIVE_OUTPUT = LIVE / "edge.json"
DECLARED_IN = ('reports/decision.md, section "Round 6: can the forecast beat the best simple rule? Area inputs, '
               'tested on 693 western counties never used (declared Nov 15, 2026, before any of those counties was '
               'loaded or scored)"')
WEST_STATES = ["Arizona", "California", "Colorado", "Idaho", "Kansas", "Montana", "Nebraska", "Nevada", "New Mexico",
               "North Dakota", "Oklahoma", "Oregon", "South Dakota", "Texas", "Utah", "Washington", "Wyoming"]
FEATURES_E = FEATURES_G + FEATURES_A + FEATURES_NB      # 47 + 14 + 5 = 66 inputs
D1_CLASS = D2_CLASS - 1


def make_edge_forest(seed=0):
    """The larger forest declared for model E."""
    return RandomForestClassifier(n_estimators=300, max_depth=14, min_samples_leaf=10, max_features="sqrt",
                                  random_state=seed, n_jobs=-1)


def used_table():
    """Monthly issue rows for the 738 counties used in rounds 1 to 5, with a "group" column:
    "dev" (the 436), "six" (round 4's rivers) or "eight" (round 5's rivers)."""
    dev = development_table()
    six = holdout_table(set(dev["fips"]))
    eight = new_holdout_table(set(dev["fips"]) | set(six["fips"]))
    return pd.concat([dev.assign(group="dev"), six.assign(group="six"), eight.assign(group="eight")], ignore_index=True)


def west_counties(used_fips):
    """County codes in the 17 western states with a complete drought record and a map shape,
    that are not in used_fips. Decided from the map alone; no outcome is read."""
    usdm, centers = load_usdm(), load_county_centers()
    return [fips for i, fips in enumerate(usdm["fips"])
            if usdm["state"][i] in WEST_STATES and fips in centers and fips not in used_fips
            and not np.isnan(usdm["classes"][i]).any()]


def blind_table(used_fips):
    """Monthly issue rows for the never-used western counties."""
    return issue_rows(build_panel(score_through=SCORE_THROUGH, counties=west_counties(used_fips))).assign(group="west")


def forecasts(used, blind):
    """Train on used rows only and forecast every row. Adds:
        p_edge  : model E (66 inputs, all used counties, the larger forest)
        p_round5: the round-5 model (47 inputs, the 436 development counties, version 1 forest)
    and a True/False column "blind"."""
    table = pd.concat([used.assign(blind=False), blind.assign(blind=True)], ignore_index=True)
    table = add_area_features(add_quarter_label(add_climate_features(table)))
    missing = int(table[FEATURES_E].isna().any(axis=1).sum())
    if missing:
        raise ValueError(f"{missing} rows have a missing input (is every county in data/round4?)")
    everyone = pd.Series(True, index=table.index)
    table["p_edge"] = chain(table, LABEL, QUARTER_WEEKS, FEATURES_E, make_edge_forest,
                            train_on=~table["blind"], predict_on=everyone)
    table["p_round5"] = chain(table, LABEL, QUARTER_WEEKS, FEATURES_G, make_classifier,
                              train_on=table["group"] == "dev", predict_on=everyone)
    return table


def scored_rows(table):
    """Rows in the test years whose answer and whose full 52-week future are known."""
    known = table["p_edge"].notna() & table[LABEL].notna() & table["y_weeks"].notna()
    return table[known].reset_index(drop=True)


def alarms(rows):
    """Every policy's warnings on these rows."""
    return pd.DataFrame({
        "model E": rows["p_edge"] >= SEASON_THRESHOLD,
        "round-5 model": rows["p_round5"] >= SEASON_THRESHOLD,
        "D2 now": rows["cls"] >= D2_CLASS,
        "D1 now": rows["cls"] >= D1_CLASS,
    }, index=rows.index)


def block(rows, rows_used):
    """Everything reported for one group of rows."""
    y, fires = rows[LABEL] == 1, alarms(rows)
    policies = {}
    for name in fires:
        counts = tally(rows[LABEL], fires[name])
        counts["share_right"] = round(float((fires[name] == y).mean()), 3)
        policies[name] = counts
    cost = {name: cost_by_year(rows.assign(alarm=fires[name]), LABEL, "alarm") for name in fires}
    pair = lambda a, b, words: compare(f"3-month cost: {words}", cost[a], cost[b], None, True, rows_used, a_name=a, b_name=b)
    return {
        "rows": int(len(rows)), "counties": int(rows["fips"].nunique()), "base_rate": round(float(y.mean()), 3),
        "auc": {"model E": round(float(roc_auc_score(y, rows["p_edge"])), 3),
                "round-5 model": round(float(roc_auc_score(y, rows["p_round5"])), 3)},
        "policies": policies,
        "edge_minus_d2": pair("model E", "D2 now", "model E minus 'D2 or worse now'"),
        "edge_minus_d1": pair("model E", "D1 now", "model E minus 'D1 or worse now'"),
        "edge_minus_round5": pair("model E", "round-5 model", "model E minus the round-5 model (what the area inputs add)"),
        "round5_minus_d2": pair("round-5 model", "D2 now", "the round-5 model minus 'D2 or worse now'"),
    }


def summary_row(name, comparison):
    """One row for the website's results table."""
    primary = comparison["block1"]
    return {"name": name, "value": primary["diff"], "lo": primary["lo"], "hi": primary["hi"],
            "n_years": primary["n_years"], "verdict": primary["direction"], "lower_is_better": True}


def edge_item(table):
    """The content of edge.json (without its header). table: the output of forecasts()."""
    scored = scored_rows(table)
    west, used = scored[scored["blind"]], scored[~scored["blind"]]
    everything = block(west, "all blind western counties: monthly issue rows, test years, full 52-week future known")
    rio_grande = block(used[used["river"] == FOCUS_RIVER], "Rio Grande counties (NOT blind)")
    saving = everything["edge_minus_d2"]["block1"]["diff"] / everything["policies"]["D2 now"]["cost"]
    return {
        "what": "Model E (the three-month outlook with area inputs) scored once on western counties never used "
                "before. Cost = 3 x missed + false alarms; lower is better, so a difference below zero favours "
                "the first-named.",
        "model": {"forest": "300 trees, depth 14, min leaf 10, sqrt inputs, seed 0", "inputs": FEATURES_E,
                  "trained_on": "all 738 used counties, forward chaining 2008 to 2025", "line": SEASON_THRESHOLD},
        "blind_states": WEST_STATES,
        "primary": everything["edge_minus_d2"],
        "cost_change_against_d2_now": round(float(saving), 4),
        "blind": everything,
        "per_state": {state: {"counties": int(g["fips"].nunique()),
                              "cost_model": int(tally(g[LABEL], g["p_edge"] >= SEASON_THRESHOLD)["cost"]),
                              "cost_d2_now": int(tally(g[LABEL], g["cls"] >= D2_CLASS)["cost"])}
                      for state, g in west.groupby("state")},
        "rio_grande_not_blind": rio_grande,
        "site_summary": [
            summary_row("3-month outlook with area inputs, 693 unseen western counties: model minus 'D2 or worse now' (cost)",
                        everything["edge_minus_d2"]),
            summary_row("The same: model minus 'D1 or worse now' (cost)", everything["edge_minus_d1"]),
            summary_row("The same: what the area inputs add over the round-5 model (cost)", everything["edge_minus_round5"]),
            summary_row("3-month outlook with area inputs, Rio Grande (not blind): model minus 'D2 or worse now' (cost)",
                        rio_grande["edge_minus_d2"]),
        ],
    }


def this_weeks_forecast(used):
    """The newest three-month chance for each Rio Grande county from model E, trained on every
    used row whose answer is known. Not a scored result: its answer is not known yet."""
    table = add_area_features(add_quarter_label(add_climate_features(used)))
    known = table[LABEL].notna() & table[FEATURES_E].notna().all(axis=1)
    model = make_edge_forest().fit(table.loc[known, FEATURES_E], table.loc[known, LABEL])
    newest = table[(table["river"] == FOCUS_RIVER) & (table["date"] == table["date"].max())]
    chance = model.predict_proba(newest[FEATURES_E])[:, 1]
    return {"issued": str(newest["date"].iloc[0].date()), "weeks_ahead": QUARTER_WEEKS,
            "what": "Chance of 8 straight weeks at D2 or worse inside the next 13 weeks, per Rio Grande county (model E).",
            "counties": {fips: round(float(p), 4) for fips, p in zip(newest["fips"], chance)}}


def main():
    if (ROUND3 / OUTPUT).exists():
        write_items({OUTPUT: None})   # raises: already scored, and this test is run once
    problems = check_round4()
    if problems:
        raise RuntimeError("an input under data/round4 differs from data/round4.sha256, so nothing was scored:\n  "
                           + "\n  ".join(problems))
    with open(FROZEN / "metrics.json") as f:
        frozen = json.load(f)
    used = used_table()
    blind = blind_table(set(used["fips"]))
    content = {**header(frozen), "declared_in": DECLARED_IN, "counties_already_used": int(used["fips"].nunique()),
               **edge_item(forecasts(used, blind))}
    for path in write_items({OUTPUT: content}):
        print("wrote", path.relative_to(ROOT))
    add_new_frozen_files()
    LIVE_OUTPUT.write_text(json.dumps(this_weeks_forecast(used), indent=2) + "\n")
    print("wrote", LIVE_OUTPUT.relative_to(ROOT))


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.edge")
    main()
