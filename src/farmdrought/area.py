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
from farmdrought.config import LIVE_DATA, NEIGHBOR_KM, live_is_on
from farmdrought.counties import km, load_county_centers

AREA_FILE = ROUND4_DATA / "usdm_area.parquet"
# ADDED for the live forecast (live_m.py): weeks newer than the snapshot, saved by fetch_latest().
# data/round4 is hashed and never written by the refresh, so the new weeks sit in data/live.
LIVE_AREA_FILE = LIVE_DATA / "usdm_area_new.parquet"
SERVICE = "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent"
STATE_ABBREVIATIONS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
    "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
    "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY", "72": "PR"}
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


def pack(data):
    """Rows as the service sends them (MapDate, FIPS, D0..D4 in percent) -> the packed layout:
    fips, date, and each class in hundredths of a percent (6718 means 67.18%)."""
    out = pd.DataFrame({"fips": data["FIPS"].astype(str).str.zfill(5),
                        "date": pd.to_datetime(data["MapDate"].astype(str), format="%Y%m%d")})
    for name in CLASSES:
        out[name] = (data[name] * 100).round().astype("int16")
    return out.drop_duplicates(["fips", "date"]).sort_values(["fips", "date"]).reset_index(drop=True)


def fetch_latest(today=None, get=None):
    """Download every week newer than the snapshot, state by state, and save them in
    data/live/usdm_area_new.parquet (the snapshot in data/round4 is never touched). A state that
    fails is skipped and named; the weeks already saved stay. Returns (newest date, states that failed)."""
    import io

    import requests
    get = get or (lambda url, params: requests.get(url, params=params, timeout=120,
                                                   headers={"User-Agent": "farmdrought"}).text)
    have = pd.read_parquet(AREA_FILE, columns=["fips", "date"])
    states = sorted({fips[:2] for fips in have["fips"].unique()} & set(STATE_ABBREVIATIONS))
    start = (LIVE_AREA_FILE.exists() and pd.read_parquet(LIVE_AREA_FILE, columns=["date"])["date"].max()
             or have["date"].max())
    end = pd.Timestamp(today) if today is not None else pd.Timestamp.today().normalize()
    frames, failed = [], []
    for code in states:
        try:
            text = get(SERVICE, {"aoi": STATE_ABBREVIATIONS[code], "startdate": f"{start.month}/{start.day}/{start.year}",
                                 "enddate": f"{end.month}/{end.day}/{end.year}", "statisticsType": 1})
            frames.append(pack(pd.read_csv(io.StringIO(text), dtype={"FIPS": str, "MapDate": str})))
        except Exception:
            failed.append(STATE_ABBREVIATIONS[code])
    fresh = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["fips", "date"] + CLASSES)
    fresh = fresh[fresh["date"] > have["date"].max()]
    if LIVE_AREA_FILE.exists():
        fresh = pd.concat([pd.read_parquet(LIVE_AREA_FILE), fresh], ignore_index=True)
    fresh = fresh.drop_duplicates(["fips", "date"]).sort_values(["fips", "date"]).reset_index(drop=True)
    if len(fresh):
        LIVE_AREA_FILE.parent.mkdir(parents=True, exist_ok=True)
        fresh.to_parquet(LIVE_AREA_FILE, index=False)
    newest = fresh["date"].max() if len(fresh) else have["date"].max()
    return str(pd.Timestamp(newest).date()), failed


def load_area():
    """The packed file as shares: fips, date, a_d1, a_d2, a_d3 (0 to 1) and dsci (0 to 5).
    Inside `with live_data():` the newer weeks saved by fetch_latest() are added; scoring never
    runs inside it, so no scored row can see them."""
    raw = pd.read_parquet(AREA_FILE)
    if live_is_on() and LIVE_AREA_FILE.exists():
        raw = pd.concat([raw, pd.read_parquet(LIVE_AREA_FILE)], ignore_index=True).drop_duplicates(["fips", "date"])
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
