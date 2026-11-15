"""live_m.py: this week's three-month chance from model M, and a log of it written before the answer is known.

ADDED after round 7 (reports/decision.md, "Round 7"). Model M is the round-6 forest on 48 inputs that
all come from the Drought Monitor map (edge.FEATURES_M). It has no El Nino input and no NOAA climate
input, so nothing in it is published after the forecast date, and it can be rebuilt every week from
the map alone.

WHAT THIS IS NOT. It is not a scored result. The live forest is trained on every row whose 13-week
answer is already known, for the 738 used counties and the 693 of round 6 (the same 1,431 counties
round 7 trained on). The scored test of M is reports/frozen/round3/east.json.

Two files are written:
  reports/live/quarter_m.json          this week's chance per Rio Grande county (replaced each run)
  reports/prospective_m/<date>.json    the same chances, written ONCE per issue week and never rewritten,
                                       with its hash in reports/prospective_m.sha256. Each entry says when
                                       its answer will be known, so it can be scored later with no way to peek.

Run it with:  PYTHONPATH=src python -m farmdrought.live_m
(The daily refresh runs it when the Drought Monitor changed.)
"""
import json
import sys
from datetime import datetime

import pandas as pd

from farmdrought.area import add_area_features, fetch_latest
from farmdrought.config import FOCUS_RIVER, LIVE, REPORTS, ROOT, SEASON_THRESHOLD, live_data
from farmdrought.drought import build_panel
from farmdrought.edge import FEATURES_M, blind_table, make_edge_forest, used_table
from farmdrought.manifest import add_new_listed
from farmdrought.quarter import LABEL, QUARTER_WEEKS, add_quarter_label

LIVE_OUTPUT = LIVE / "quarter_m.json"
LOG_FOLDER = REPORTS / "prospective_m"
LOG_LIST = "reports/prospective_m.sha256"
HEADER = ("A forecast log, written before the truth was known. NOTHING HERE IS SCORED YET: each forecast can be "
          "scored only after the date in its 'answer_known_after' field. This file is never rewritten.")


def newest_rows(panel, area_dates):
    """The Rio Grande counties' rows for the newest week that has both a drought class and area shares."""
    rows = panel[panel["river"] == FOCUS_RIVER]
    week = max(set(rows["date"]) & set(area_dates))
    return rows[rows["date"] == week]


def record(issue, chances, logged_at=None):
    """One issue week's log entry. chances: {fips: probability}."""
    issue = pd.Timestamp(issue)
    return {
        "header": HEADER, "issue_date": str(issue.date()),
        "logged_at": logged_at or datetime.now().astimezone().isoformat(timespec="seconds"),
        "model": {"name": "model M: the round-6 forest on 48 inputs from the Drought Monitor map only",
                  "inputs": FEATURES_M, "trained_on": "the 1,431 counties no longer blind (738 used + 693 of round 6), "
                  "every row whose 13-week answer was known on the issue date",
                  "scored_test": "reports/frozen/round3/east.json"},
        "forecast": {"horizon_weeks": QUARTER_WEEKS, "kind": "probability", "alarm_threshold": SEASON_THRESHOLD,
                     "question": "Will the next 13 weeks hold 8 or more weeks in a row at D2 or worse?",
                     "answer_known_after": str((issue + pd.Timedelta(weeks=QUARTER_WEEKS)).date())},
        "counties": {fips: round(float(p), 4) for fips, p in sorted(chances.items())},
    }


def log_week(entry, folder=None):
    """Write one issue week. Raises FileExistsError if it is already logged: a week's first record stands."""
    folder = LOG_FOLDER if folder is None else folder
    path = folder / f"{entry['issue_date']}.json"
    if path.exists():
        raise FileExistsError(f"{path.name} is already logged and is never rewritten")
    folder.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(entry, indent=1) + "\n")
    return path


def this_weeks_forecast():
    """Train M on every known answer and forecast the newest week. Returns (issue date, {fips: chance})."""
    with live_data():
        used = used_table()
        trained = pd.concat([used, blind_table(set(used["fips"]))], ignore_index=True)
        trained = add_area_features(add_quarter_label(trained))
        known = trained[LABEL].notna() & trained[FEATURES_M].notna().all(axis=1)
        model = make_edge_forest().fit(trained.loc[known, FEATURES_M], trained.loc[known, LABEL])
        from farmdrought.area import load_area
        newest = add_area_features(newest_rows(build_panel(), load_area()["date"].unique()))
        newest = newest.dropna(subset=FEATURES_M)
        chance = model.predict_proba(newest[FEATURES_M])[:, 1]
        return newest["date"].iloc[0], dict(zip(newest["fips"], chance))


def main():
    with live_data():
        newest, failed = fetch_latest()
    print("area shares newest week:", newest, "| states that failed:", ", ".join(failed) or "none")
    issue, chances = this_weeks_forecast()
    entry = record(issue, chances)
    LIVE.mkdir(parents=True, exist_ok=True)
    LIVE_OUTPUT.write_text(json.dumps({
        "issued": entry["issue_date"], "weeks_ahead": QUARTER_WEEKS, "model": "M",
        "what": "Chance of 8 straight weeks at D2 or worse inside the next 13 weeks, per Rio Grande county (model M, "
                "Drought Monitor inputs only). Not a scored result.",
        "counties": entry["counties"]}, indent=2) + "\n")
    print("wrote", LIVE_OUTPUT.relative_to(ROOT), "- issued", entry["issue_date"])
    try:
        print("logged", log_week(entry).relative_to(ROOT), "- not scored yet")
    except FileExistsError as already:
        print(already)
    listed = add_new_listed(ROOT, "reports/prospective_m", LOG_LIST)
    if listed:
        print(f"listed in {LOG_LIST}:", ", ".join(listed))


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.live_m")
    main()
