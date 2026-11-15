"""east.py: round 7. The map-only forecast, scored ONCE on the eastern counties never used.

ADDED in round 7. Written down first in reports/decision.md ("Round 7: the map-only forecast on
the eastern counties"). No earlier result is changed, and edge.py's scoring is not touched.

THREE QUESTIONS, each declared before any eastern county's answer was loaded
  7a  Somewhere else : does the forecast still cost less than "D2 or worse now" (cost = 3 x missed
                       + false alarms, warning line 0.25)?
  7b  Other costs    : for each cost ratio in config.COST_RATIOS, warn when the chance is at or
                       above the ratio (the break-even line) and compare with the CHEAPEST simple
                       policy at that ratio, picked on these same rows (which favours the rule).
  7c  Plain accuracy : at the 0.50 line, is the forecast right as often as "D2 or worse now"?

THE MODEL ("M")
  - answer: 8 straight weeks at D2 or worse inside the next 13 weeks (the three-month outlook)
  - the round-6 forest: 300 trees, depth 14, at least 10 rows per leaf, seed 0
  - 48 inputs, all from the Drought Monitor map (edge.FEATURES_M): no El Nino index and no NOAA
    climate record, so nothing in it is published after the forecast date
  - trained on the 1,431 counties that are no longer blind (738 used + 693 of round 6), forward
    chaining: a test year only sees answers known before it began
  M was suggested by a reviewer AFTER the round-6 blind figures were seen (reports/decision.md,
  "Round 6, checked"). So round 6 is M's development set, and this is its only blind test.

MODEL E, beside it. Round 6's model exactly as frozen (66 inputs, trained on the 738), scored on
the same rows ONLY if NOAA's climate record for the eastern counties is in data/round4
(climate_east.csv.gz and climate_east_normals.csv, listed in data/round4.sha256).

THE BLIND SET. Every county in the 31 eastern states and the District of Columbia with a map
shape, a complete drought record and area shares, never used before. No row of theirs is ever
in training.

Run it with:  PYTHONPATH=src python -m farmdrought.east
              (writes reports/frozen/round3/east.json once)
"""
import json
import sys

import pandas as pd
from scipy.stats import binomtest, wilcoxon
from sklearn.metrics import roc_auc_score

from farmdrought import climate
from farmdrought.area import AREA_FILE, add_area_features
from farmdrought.config import COST_RATIOS, D2_CLASS, FROZEN, ROOT, ROUND3, SEASON_THRESHOLD
from farmdrought.costwindow import RULE_ORDER, cheapest, miss_weight, window
from farmdrought.edge import (FEATURES_E, FEATURES_M, WEST_STATES, blind_table, county_table, make_edge_forest,
                              used_table, west_counties)
from farmdrought.evaluate import tally
from farmdrought.manifest import add_new_frozen_files, check_round4
from farmdrought.outlook import chain
from farmdrought.quarter import LABEL, QUARTER_WEEKS, add_quarter_label
from farmdrought.round3 import by_year, compare, cost_by_year, header, write_items

OUTPUT = "east.json"
DECLARED_IN = ('reports/decision.md, section "Round 7: the map-only forecast on the eastern counties (declared '
               'Nov 15, 2026, before any of those counties was loaded or scored)"')
EAST_STATES = ["Alabama", "Arkansas", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
               "Illinois", "Indiana", "Iowa", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
               "Michigan", "Minnesota", "Mississippi", "Missouri", "New Hampshire", "New Jersey", "New York",
               "North Carolina", "Ohio", "Pennsylvania", "Rhode Island", "South Carolina", "Tennessee", "Vermont",
               "Virginia", "West Virginia", "Wisconsin"]
D1_CLASS = D2_CLASS - 1
LIKELIER_LINE = 0.5        # 7c: say whichever outcome is likelier
USED_GROUPS = ["dev", "six", "eight"]     # the 738 counties of rounds 1 to 5


def east_counties(taken_fips):
    """County codes in the eastern states with a map shape, a complete drought record and area
    shares, that are not in taken_fips. Decided from the map and the input file; no answer is read."""
    with_area = set(pd.read_parquet(AREA_FILE, columns=["fips"])["fips"].unique())
    return [fips for fips in west_counties(taken_fips, states=EAST_STATES) if fips in with_area]


def has_east_climate():
    """True when NOAA's record for the eastern counties is in data/round4 (model E needs it)."""
    return climate.EAST_CLIMATE_CSV.exists() and climate.EAST_NORMALS_CSV.exists()


def forecasts(used, west, east, with_e):
    """Forecast every eastern row. Adds p_m (model M) and, when with_e, p_e (model E).
    No eastern row is ever in training: see the two train_on masks."""
    table = pd.concat([used, west, east], ignore_index=True)
    table = add_area_features(add_quarter_label(table))
    is_east = table["group"] == "east"
    missing = int(table[FEATURES_M].isna().any(axis=1).sum())
    if missing:
        raise ValueError(f"{missing} rows have a missing map input")
    table["p_m"] = chain(table, LABEL, QUARTER_WEEKS, FEATURES_M, make_edge_forest,
                         train_on=~is_east, predict_on=is_east)
    if with_e:
        table = climate.add_climate_features(table)
        missing = int(table.loc[table["group"] != "west", FEATURES_E].isna().any(axis=1).sum())
        if missing:
            raise ValueError(f"{missing} rows have a missing input for model E (is every county in data/round4?)")
        table["p_e"] = chain(table, LABEL, QUARTER_WEEKS, FEATURES_E, make_edge_forest,
                             train_on=table["group"].isin(USED_GROUPS), predict_on=is_east)
    return table


def scored_rows(table):
    """Eastern rows in the test years whose answer and whose full 52-week future are known."""
    known = (table["group"] == "east") & table["p_m"].notna() & table[LABEL].notna() & table["y_weeks"].notna()
    return table[known].reset_index(drop=True)


def rule_alarms(rows):
    """The four simple policies' warnings on these rows."""
    return pd.DataFrame({"D2 now": rows["cls"] >= D2_CLASS, "D1 now": rows["cls"] >= D1_CLASS,
                         "always warn": True, "never warn": False}, index=rows.index)


def yearly_cost(rows, alarm, r):
    """Cost per issue year when one missed drought season is worth r false alarms."""
    return by_year(rows.assign(alarm=alarm), lambda g: tally(g[LABEL], g["alarm"], miss_cost=r)["cost"])


def year_tests(comparison):
    """Two plain tests on the yearly differences (A minus B), beside the declared interval."""
    years = comparison["per_year"]
    diffs = [a - b for a, b in zip(years[comparison["a"]], years[comparison["b"]])]
    ahead, nonzero = sum(d < 0 for d in diffs), sum(d != 0 for d in diffs)
    return {"years_a_cheaper": ahead, "years": len(diffs),
            "sign_test_p_two_sided": round(float(binomtest(ahead, nonzero, 0.5).pvalue), 4) if nonzero else None,
            "signed_rank_p_two_sided": round(float(wilcoxon(diffs).pvalue), 4) if nonzero else None}


def somewhere_else(rows, p, name):
    """7a: cost at the 0.25 line minus the cost of "D2 or worse now" (a miss = 3 false alarms)."""
    model = cost_by_year(rows.assign(alarm=rows[p] >= SEASON_THRESHOLD), LABEL, "alarm")
    rule = cost_by_year(rows.assign(alarm=rows["cls"] >= D2_CLASS), LABEL, "alarm")
    result = compare(f"7a, 3-month cost: {name} at the 0.25 line minus 'D2 or worse now'", model, rule, None, True,
                     "all eastern blind counties: monthly issue rows, test years, full 52-week future known",
                     a_name=name, b_name="D2 now")
    result["year_tests"] = year_tests(result)
    return result


def other_costs(rows, p, name):
    """7b: one comparison per cost ratio. The model warns at the ratio; the rule is the cheapest
    of the four simple policies at that ratio, picked on these same rows."""
    rules, out = rule_alarms(rows), []
    for ratio in COST_RATIOS:
        r = miss_weight(ratio)
        rule_cost = {rule: yearly_cost(rows, rules[rule], r) for rule in RULE_ORDER}
        best = cheapest({rule: float(cost.sum()) for rule, cost in rule_cost.items()})
        result = compare(f"7b, cost ratio {ratio} (a miss = {r:.2f} false alarms): {name} warning at {ratio} "
                         f"minus the cheapest simple policy ('{best}')", yearly_cost(rows, rows[p] >= ratio, r),
                         rule_cost[best], None, True, "all eastern blind counties", a_name=name, b_name=best)
        result.update(cost_ratio=ratio, miss_weight=round(r, 4), warning_line=ratio,
                      rule_totals={rule: float(cost.sum()) for rule, cost in rule_cost.items()})
        out.append(result)
    return out


def plain_accuracy(rows, p, name):
    """7c: share of forecasts right at the 0.50 line minus the share for "D2 or worse now"."""
    y = rows[LABEL] == 1
    right = lambda alarm: by_year(rows.assign(right=(alarm == y)), lambda g: g["right"].mean())
    return compare(f"7c, share of forecasts right: {name} at the 0.50 line minus 'D2 or worse now'",
                   right(rows[p] >= LIKELIER_LINE), right(rows["cls"] >= D2_CLASS), by_year(rows, len), False,
                   "all eastern blind counties", a_name=name, b_name="D2 now")


def model_block(rows, p, name):
    """Everything reported for one model on the scored rows."""
    y = rows[LABEL] == 1
    counts = {}
    for label, alarm in {f"{name} at 0.25": rows[p] >= SEASON_THRESHOLD, f"{name} at 0.50": rows[p] >= LIKELIER_LINE,
                         **{rule: alarm for rule, alarm in rule_alarms(rows).items()}}.items():
        counts[label] = {**tally(rows[LABEL], alarm), "share_right": round(float((alarm == y).mean()), 3)}
    low, high = window(counts[f"{name} at 0.25"], counts["D2 now"], counts["D1 now"])
    return {
        "auc": round(float(roc_auc_score(y, rows[p])), 3),
        "policies": counts,
        "somewhere_else_7a": somewhere_else(rows, p, name),
        "other_costs_7b": other_costs(rows, p, name),
        "plain_accuracy_7c": plain_accuracy(rows, p, name),
        "cost_window_at_0.25": {"cheaper_than_d2_now_when_a_miss_costs_more_than": None if low is None else round(low, 2),
                                "cheaper_than_d1_now_when_a_miss_costs_less_than": None if high is None else round(high, 2)},
        "per_state": {state: {"counties": int(g["fips"].nunique()),
                              "cost_model": int(tally(g[LABEL], g[p] >= SEASON_THRESHOLD)["cost"]),
                              "cost_d2_now": int(tally(g[LABEL], g["cls"] >= D2_CLASS)["cost"])}
                      for state, g in rows.groupby("state")},
    }


def east_item(table, with_e):
    """The content of east.json (without its header). table: the output of forecasts()."""
    rows = scored_rows(table)
    return {
        "what": "Round 7. Model M (the three-month outlook from Drought Monitor inputs only) scored once on eastern "
                "counties never used before. Cost = r x missed + false alarms; lower is better, so a cost "
                "difference below zero favours the first-named.",
        "model_m": {"forest": "300 trees, depth 14, min leaf 10, sqrt inputs, seed 0", "inputs": FEATURES_M,
                    "trained_on": "the 1,431 counties no longer blind (738 used + 693 of round 6), forward chaining "
                                  "2008 to 2025",
                    "chosen_after_round_6_blind_figures": True},
        "blind_states": EAST_STATES, "cost_ratios": COST_RATIOS,
        "rows": int(len(rows)), "counties": int(rows["fips"].nunique()),
        "base_rate": round(float((rows[LABEL] == 1).mean()), 3),
        "model M": model_block(rows, "p_m", "model M"),
        "model E": (model_block(rows, "p_e", "model E") if with_e else
                    "not scored: NOAA's climate record for the eastern counties was not in data/round4"),
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
    used = used_table()
    west = blind_table(set(used["fips"]))
    taken = set(used["fips"]) | set(west["fips"])
    east = county_table(east_counties(taken), "east")
    with_e = has_east_climate()
    content = {**header(frozen), "declared_in": DECLARED_IN,
               "counties_in_training_m": int(len(taken)), "counties_in_training_e": int(used["fips"].nunique()),
               "western_states_of_round_6": WEST_STATES, **east_item(forecasts(used, west, east, with_e), with_e)}
    for path in write_items({OUTPUT: content}):
        print("wrote", path.relative_to(ROOT))
    add_new_frozen_files()


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.east")
    main()
