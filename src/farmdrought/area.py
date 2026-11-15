"""area.py: how much of each county's AREA is in drought, as extra inputs.

ADDED in round 6 (reports/decision.md, "Round 6"). Used only by the model in edge.py.

WHY. The drought file the rest of the project uses holds one number per county per week: the
worst drought class anywhere in the county. A county with severe drought over 3% of its area
and one with 100% look the same in it. The U.S. Drought Monitor also publishes the share of
each county's area in each class, every week, on the same day as the map. That is what this
file reads.

WHERE THE DATA COMES FROM. The Drought Monitor's own data service, one request per state:
  https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent
      ?aoi=<state, e.g. TX>&startdate=1/1/2000&enddate=11/10/2026&statisticsType=1
Each row: the map date, the county, and the percent of its area at D0 or worse, D1 or worse,
D2 or worse, D3 or worse and D4 (cumulative, so D0 >= D1 >= D2 ...). cut() packs the 48 states
into one small file, data/round4/usdm_area.parquet, with the percents stored as whole
hundredths of a percent (6718 means 67.18%).

TWO SETS OF INPUTS, all from the map of the issue date or earlier
  A (14, the county itself)  a_d1, a_d2, a_d3 : share of area at D1+/D2+/D3+ (0 to 1)
                             dsci             : the five cumulative shares added up (0 to 5)
                             and lags, averages and one change of those (see FEATURES_A)
  NB (5, its neighbours)     the average D2 share and the average dsci over ALL counties whose
                             centre is within 150 km, now and 4 weeks ago, and the neighbours'
                             dsci minus the county's own
"""
import glob

import numpy as np
import pandas as pd

from farmdrought.climate import ROUND4_DATA
from farmdrought.config import NEIGHBOR_KM
from farmdrought.counties import km, load_county_centers

AREA_FILE = ROUND4_DATA / "usdm_area.parquet"
FEATURES_A = ["a_d1", "a_d2", "a_d3", "dsci", "a_d2_l4", "a_d2_l13", "dsci_l4", "dsci_l13", "dsci_l26",
              "dsci_m13", "dsci_m26", "a_d2_m8", "a_d1_m13", "dsci_chg4"]
FEATURES_NB = ["nb_a2", "nb_dsci", "nb_dsci_l4", "nb_a2_l4", "nb_dsci_minus"]
CLASSES = ["D0", "D1", "D2", "D3", "D4"]


def cut(folder):
    """Pack the downloaded state files (one CSV per state and period, in `folder`) into
    data/round4/usdm_area.parquet. Run once, by hand."""
    frames = [pd.read_csv(path, dtype={"FIPS": str, "MapDate": str}, usecols=["MapDate", "FIPS"] + CLASSES)
              for path in sorted(glob.glob(f"{folder}/*.csv"))]
    data = pd.concat(frames, ignore_index=True)
    out = pd.DataFrame({"fips": data["FIPS"].str.zfill(5), "date": pd.to_datetime(data["MapDate"], format="%Y%m%d")})
    for name in CLASSES:
        out[name] = (data[name] * 100).round().astype("int16")     # hundredths of a percent, 0 to 10000
    out = out.drop_duplicates(["fips", "date"]).sort_values(["fips", "date"]).reset_index(drop=True)
    out.to_parquet(AREA_FILE, index=False)
    print(f"saved {out['fips'].nunique()} counties, {out['date'].min().date()} to {out['date'].max().date()}")


def load_area():
    """The packed file as shares: fips, date, a_d1, a_d2, a_d3 (0 to 1) and dsci (0 to 5)."""
    raw = pd.read_parquet(AREA_FILE)
    share = {name: raw[name] / 10000 for name in CLASSES}
    return pd.DataFrame({"fips": raw["fips"], "date": raw["date"], "a_d1": share["D1"], "a_d2": share["D2"],
                         "a_d3": share["D3"], "dsci": share["D0"] + share["D1"] + share["D2"] + share["D3"] + share["D4"]})


def own_features(area, fips_list):
    """Set A for the listed counties. One row per county per week; a lag or average is NaN
    until enough earlier weeks exist. Every value looks only backwards."""
    wanted = area[area["fips"].isin(set(fips_list))]
    out = []
    for fips, county in wanted.groupby("fips"):
        county = county.sort_values("date").set_index("date")
        f = pd.DataFrame({"fips": fips, "a_d1": county["a_d1"], "a_d2": county["a_d2"], "a_d3": county["a_d3"],
                          "dsci": county["dsci"]}, index=county.index)
        f["a_d2_l4"], f["a_d2_l13"] = f["a_d2"].shift(4), f["a_d2"].shift(13)
        f["dsci_l4"], f["dsci_l13"], f["dsci_l26"] = f["dsci"].shift(4), f["dsci"].shift(13), f["dsci"].shift(26)
        f["dsci_m13"], f["dsci_m26"] = f["dsci"].rolling(13).mean(), f["dsci"].rolling(26).mean()
        f["a_d2_m8"], f["a_d1_m13"] = f["a_d2"].rolling(8).mean(), f["a_d1"].rolling(13).mean()
        f["dsci_chg4"] = f["dsci"] - f["dsci_l4"]
        out.append(f.reset_index())
    return pd.concat(out, ignore_index=True)


def neighbour_features(area, fips_list):
    """Set NB for the listed counties: averages over ALL counties within 150 km (not only the
    listed ones), from the same week or 4 weeks earlier."""
    centers = load_county_centers()
    everyone = [f for f in area["fips"].unique() if f in centers]
    lon = np.array([centers[f][0] for f in everyone])
    lat = np.array([centers[f][1] for f in everyone])
    column_of = {fips: i for i, fips in enumerate(everyone)}
    # one table per quantity: a row per week, a column per county
    d2 = area.pivot(index="date", columns="fips", values="a_d2").reindex(columns=everyone)
    dsci = area.pivot(index="date", columns="fips", values="dsci").reindex(columns=everyone)
    out = []
    for fips in fips_list:
        i = column_of[fips]
        near = np.where(km(lon[i], lat[i], lon, lat) <= NEIGHBOR_KM)[0]
        near = near[near != i]                                     # the county is not its own neighbour
        near_d2, near_dsci = d2.iloc[:, near].mean(axis=1), dsci.iloc[:, near].mean(axis=1)
        out.append(pd.DataFrame({"fips": fips, "date": d2.index, "nb_a2": near_d2.values, "nb_dsci": near_dsci.values,
                                 "nb_dsci_l4": near_dsci.shift(4).values, "nb_a2_l4": near_d2.shift(4).values,
                                 "nb_dsci_minus": (near_dsci - dsci[fips]).values}))
    return pd.concat(out, ignore_index=True)


def add_area_features(table):
    """Add sets A and NB to any table that has "fips" and "date" columns (the weekly map dates)."""
    area = load_area()
    counties = list(table["fips"].unique())
    table = table.merge(own_features(area, counties), on=["fips", "date"], how="left", validate="many_to_one")
    return table.merge(neighbour_features(area, counties), on=["fips", "date"], how="left", validate="many_to_one")
