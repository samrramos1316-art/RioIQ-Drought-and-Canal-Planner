"""drought.py: load the drought history and build the county-week panel.

The "panel" is one big table with one row per river county per week. Each row holds the
county's details, the 24 model inputs, and the truth we want to predict.

Classes: 0 none, 1 D0, 2 D1, 3 D2 (severe), 4 D3, 5 D4.
"""
import json

import numpy as np
import pandas as pd

from farmdrought.config import (ALERT_WEEKS, BUFFER_KM, D2_CLASS, NEIGHBOR_KM, ONI_TXT, SEASON_RUN,
                                SEASON_WEEKS, USDM_JSON, YEAR_WEEKS, raw_path)
from farmdrought.counties import km, load_county_centers, load_river_points, nearest_river
from farmdrought.features import FEATURES_H, enso_features, history_features, load_oni, long_memory_features


def load_usdm(path=None):
    """Read the U.S. Drought Monitor file (the snapshot in data/raw, unless a path is given or
    the caller is inside config.live_data(), where a newer copy in data/live is preferred).

    Returns a dict with:
      fips, county, state : one entry per county
      dates               : the map date of each week (weekly, Tuesdays)
      classes             : array (counties, weeks), the worst drought class in the county
                            that week. NaN where the county has no data.
    """
    with open(raw_path(USDM_JSON) if path is None else path) as f:
        raw = json.load(f)
    # Each county's history is one string with one character per week.
    # "0" to "5" is the drought class. "." means missing.
    classes = np.array([[np.nan if ch == "." else int(ch) for ch in series] for series in raw["series"]])
    return {
        "fips": raw["counties"],
        "county": raw["county_names"],
        "state": raw["state_names"],
        "dates": pd.date_range(raw["week0"], periods=raw["weeks"], freq="7D"),
        "classes": classes,
    }


def label_alert(classes, horizon=ALERT_WEEKS):
    """Truth for the 4-week alert: 1 if the county is at D2 or worse in ANY of the next
    `horizon` weeks, otherwise 0.

    The window starts at week t+1, so the current week is never part of its own answer.
    The last `horizon` weeks get NaN: their future has not happened yet.
    """
    n_counties, n_weeks = classes.shape
    y = np.full((n_counties, n_weeks), np.nan)
    for t in range(n_weeks - horizon):
        future = classes[:, t + 1 : t + 1 + horizon]  # weeks t+1 .. t+horizon
        y[:, t] = future.max(axis=1) >= D2_CLASS
    return y


def label_season(classes, horizon=SEASON_WEEKS, run=SEASON_RUN):
    """Truth for the 6-month outlook: 1 if the next `horizon` weeks contain `run` or more
    weeks IN A ROW at D2 or worse. That is the trigger for a USDA aid payment.

    Only weeks inside the window (t+1 .. t+horizon) count. If a drought started before
    the window, only the part inside the window counts toward the run.
    """
    in_d2 = classes >= D2_CLASS
    n_counties, n_weeks = classes.shape
    y = np.full((n_counties, n_weeks), np.nan)
    for t in range(n_weeks - horizon):
        # Walk through the window week by week, tracking the current run of D2 weeks
        # and the longest run seen so far. Both start at zero at the start of the window.
        current = np.zeros(n_counties)
        longest = np.zeros(n_counties)
        for week in range(t + 1, t + 1 + horizon):
            current = np.where(in_d2[:, week], current + 1, 0)
            longest = np.maximum(longest, current)
        y[:, t] = longest >= run
    return y


def label_weeks(classes, horizon=YEAR_WEEKS):
    """Truth for the 12-month outlook: how many of the next `horizon` weeks are at D2 or worse."""
    in_d2 = classes >= D2_CLASS
    n_counties, n_weeks = classes.shape
    y = np.full((n_counties, n_weeks), np.nan)
    for t in range(n_weeks - horizon):
        y[:, t] = in_d2[:, t + 1 : t + 1 + horizon].sum(axis=1)
    return y


def d2_streak(classes):
    """Weeks in a row at D2 or worse, counting the current week. 0 if not in D2 now."""
    in_d2 = classes >= D2_CLASS
    streak = np.zeros(classes.shape)
    streak[:, 0] = in_d2[:, 0]
    for t in range(1, classes.shape[1]):
        streak[:, t] = np.where(in_d2[:, t], streak[:, t - 1] + 1, 0)
    return streak


def build_panel(buffer_km=BUFFER_KM, score_through=None, rivers=None, exclude=(), counties=None):
    """Build the county-week table for the river counties (436 of them at the default 50 km).

    score_through : None (the default) uses every week in the file, exactly as before. A date
                    (for example config.SCORE_THROUGH) drops every later week BEFORE the inputs
                    and the truths are built, so no answer window can reach past that date: a
                    row whose window would cross it gets NaN, as if the file ended there.

    rivers        : None (the default) uses the five rivers in config.RIVERS, exactly as before.
                    A list of other river names builds the same table for those rivers instead
                    (used only by the holdout test, holdout.py).
    exclude       : county codes to leave out even if they are near one of the rivers (the
                    holdout test passes the 436 counties already used). Empty by default.

    counties      : None (the default) picks counties by distance to a river, as above. A list
                    of county codes builds the table for exactly those counties instead (used
                    only by the round-6 test, edge.py). They are not along one river, so their
                    "river" column holds the STATE name: the input "river_mean" is then the
                    average class across the listed counties of the same state.

    Columns: date, fips, county, state, river, lat, lon, d2_streak, the inputs (sets H, L
    and E), and the three truths: y (4-week), y_season (6-month) and y_weeks (12-month).
    A truth is NaN when its future is not known yet.
    Rows from each county's first year are dropped, because the inputs look back 52 weeks.
    """
    usdm = load_usdm()
    if score_through is not None:
        in_time = usdm["dates"] <= pd.Timestamp(score_through)
        usdm = {**usdm, "dates": usdm["dates"][in_time], "classes": usdm["classes"][:, in_time]}
    centers = load_county_centers()

    # 1. Keep counties that have a shape on the map and no missing weeks at all,
    #    so every county has the same full history.
    keep = [i for i, f in enumerate(usdm["fips"])
            if f in centers and not np.isnan(usdm["classes"][i]).any()]
    all_classes = usdm["classes"][keep]
    lon = np.array([centers[usdm["fips"][i]][0] for i in keep])
    lat = np.array([centers[usdm["fips"][i]][1] for i in keep])

    # 2. A river county is one whose center is within 50 km of one of the five rivers.
    river, distance = nearest_river(lon, lat, load_river_points(names=rivers))
    left_out = set(exclude)
    chosen = np.array([j for j in np.where(distance <= buffer_km)[0] if usdm["fips"][keep[j]] not in left_out])
    if counties is not None:
        listed = set(counties)
        chosen = np.array([j for j in range(len(keep)) if usdm["fips"][keep[j]] in listed])
        river = np.array([usdm["state"][i] for i in keep])        # the group for "river_mean" is the state

    # 3. Neighbors of each river county: ALL counties within 150 km, except itself.
    neighbors = []
    for j in chosen:
        near = np.where(km(lon[j], lat[j], lon, lat) <= NEIGHBOR_KM)[0]
        neighbors.append(near[near != j])

    # 4. Inputs and truth, each as an array of shape (river counties, weeks).
    classes = all_classes[chosen]
    columns = history_features(classes, all_classes, neighbors, usdm["dates"])
    columns["d2_streak"] = d2_streak(classes)
    columns.update(long_memory_features(classes, river[chosen]))  # set L, for the outlooks
    columns["y"] = label_alert(classes)
    columns["y_season"] = label_season(classes)
    columns["y_weeks"] = label_weeks(classes)

    # 5. Flatten to one row per county per week. ravel() lists county 1's weeks, then
    #    county 2's, and so on. So county details repeat and the dates tile.
    n_weeks = classes.shape[1]
    panel = pd.DataFrame({name: values.ravel() for name, values in columns.items()})
    for name, values in [("fips", usdm["fips"]), ("county", usdm["county"]), ("state", usdm["state"])]:
        panel[name] = np.repeat([values[keep[j]] for j in chosen], n_weeks)
    panel["river"] = np.repeat(river[chosen], n_weeks)
    panel["lat"] = np.repeat(lat[chosen], n_weeks)
    panel["lon"] = np.repeat(lon[chosen], n_weeks)
    panel["date"] = np.tile(usdm["dates"], len(chosen))
    # Set E (El Nino index) is the same for every county, so its weekly values tile too
    for name, values in enso_features(usdm["dates"], load_oni(raw_path(ONI_TXT))).items():
        panel[name] = np.tile(values, len(chosen))

    # 6. Drop rows where an input is missing (the first 52 weeks of the record).
    #    Rows with a missing y are KEPT: they are the newest weeks, used for "latest".
    return panel.dropna(subset=FEATURES_H).reset_index(drop=True)
