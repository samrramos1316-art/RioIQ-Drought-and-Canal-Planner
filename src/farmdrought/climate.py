"""climate.py: NOAA's county climate record as extra inputs, for ANY county in the lower 48.

ADDED in round 4 (reports/decision.md, "Round 4"). Used only by the general model in
holdout.py. Version 1 does not use this file.

WHERE THE DATA COMES FROM. NOAA's county climate record (nClimDiv), the same source weather.py
uses for the 31 Rio Grande counties. NOAA publishes one file per measurement, with one line per
county per year and twelve monthly values on each line. Four files are used:
    pcpncy  rain (inches)                 tmpccy  average temperature (deg F)
    pdsicy  Palmer drought index (PDSI)   zndxcy  Palmer Z index
The Palmer index is NOAA's own soil-moisture bookkeeping: rain coming in, evaporation going
out. Below zero is dry. The Z index is the same idea for a single month.

The four files are about 40 MB each, far too big to keep. extract() keeps only the counties
and years this project needs and saves two small files in data/round4:
    climate_counties.csv.gz  fips, year, month, rain_in, temp_f, pdsi, zndx   (1997 onward)
    climate_normals.csv      fips, month, rain_normal, temp_normal            (1901-1999 mean)

THREE SETS OF INPUTS
  W (5)  rain3, rain6, rain12  : rain over the last 3/6/12 months / normal rain for those months
         heat3, heat12         : temperature over the last 3/12 months minus normal (deg F)
  P (6)  pdsi, pdsi_chg3, pdsi_min12 : Palmer index now, its change in 3 months, its low in 12
         z1, z3, z6                  : Palmer Z index averaged over the last 1/3/6 months
  N (2)  norm_rain, norm_temp  : the county's normal yearly rain and normal temperature

"Normal" is the county's own 1901 to 1999 average. That period ends before the drought record
starts (2000), so a normal never contains a training or test year.

LEAKAGE RULE (the same as weather.py): NOAA publishes a month's value about a week into the
NEXT month. A forecast made in month M therefore only uses months up to M-2.

HONEST NOTE: NOAA revises this record. The values here are today's version of history, not
exactly what was published on each day in the past.
"""
import glob

import pandas as pd

from farmdrought.config import ROOT

ROUND4_DATA = ROOT / "data" / "round4"
CLIMATE_CSV = ROUND4_DATA / "climate_counties.csv.gz"
NORMALS_CSV = ROUND4_DATA / "climate_normals.csv"
# Round 6 added more counties. The first pair of files is never rewritten (its hashes are
# recorded), so the new counties sit in a second pair with the same columns.
MORE_CLIMATE_CSV = ROUND4_DATA / "climate_west.csv.gz"
MORE_NORMALS_CSV = ROUND4_DATA / "climate_west_normals.csv"
# Round 7 may add the eastern counties the same way (only model E needs them; see east.py).
EAST_CLIMATE_CSV = ROUND4_DATA / "climate_east.csv.gz"
EAST_NORMALS_CSV = ROUND4_DATA / "climate_east_normals.csv"

FEATURES_W = ["rain3", "rain6", "rain12", "heat3", "heat12"]
FEATURES_P = ["pdsi", "pdsi_chg3", "pdsi_min12", "z1", "z3", "z6"]
FEATURES_N = ["norm_rain", "norm_temp"]
NORMAL_YEARS = (1901, 1999)   # the years that define "normal"
FIRST_YEAR_KEPT = 1997        # 12-month windows for the first drought-map year (2000) need 1998
PUBLISH_LAG_MONTHS = 2        # a forecast in month M uses months up to M-2

# NOAA numbers the 48 contiguous states alphabetically (01 Alabama ... 48 Wyoming), not with
# the usual FIPS state codes. This list is the FIPS codes in that alphabetical order, so the
# NOAA code of a state is its position here plus one.
FIPS_IN_NOAA_ORDER = ["01", "04", "05", "06", "08", "09", "10", "12", "13", "16", "17", "18", "19", "20", "21", "22",
                      "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38",
                      "39", "40", "41", "42", "44", "45", "46", "47", "48", "49", "50", "51", "53", "54", "55", "56"]
NOAA_TO_FIPS = {f"{i + 1:02d}": fips for i, fips in enumerate(FIPS_IN_NOAA_ORDER)}
# column name here -> the code in NOAA's file name
NOAA_FILES = {"rain_in": "pcpncy", "temp_f": "tmpccy", "pdsi": "pdsicy", "zndx": "zndxcy"}


# NOAA marks a month that is not published yet with a negative code: -9.99 in the rain file and
# -99.9 or -99.99 in the others. A real value is never that low, so anything at or below these
# floors is skipped. (Rain is never negative; the Palmer indexes stay well inside -20.)
MISSING_AT_OR_BELOW = {"pcpncy": -9.0, "tmpccy": -90.0, "pdsicy": -90.0, "zndxcy": -90.0}


def read_noaa_file(path, wanted, missing_at_or_below=-90.0):
    """Read one NOAA county file. Returns a table: fips, year, month, value.

    Each line: characters 1-2 NOAA state code, 3-5 county, 6-7 what is measured, 8-11 year,
    then 12 monthly values. A value at or below missing_at_or_below means "not published yet"
    and is skipped.
    wanted : the set of county codes (FIPS) to keep.
    """
    rows = []
    with open(path) as f:
        for line in f:
            state = NOAA_TO_FIPS.get(line[:2])
            if state is None or state + line[2:5] not in wanted:
                continue
            year = int(line[7:11])
            for month, value in enumerate(line[11:].split(), start=1):
                if float(value) > missing_at_or_below:
                    rows.append((state + line[2:5], year, month, float(value)))
    return pd.DataFrame(rows, columns=["fips", "year", "month", "value"])


def extract(noaa_folder, fips_list, climate_csv=None, normals_csv=None):
    """Cut two small files out of NOAA's four big ones (run once, by hand).

    noaa_folder : a folder holding the four downloaded files (climdiv-pcpncy-..., and so on)
    fips_list   : the counties to keep
    climate_csv, normals_csv : where to save (the first pair of files by default)
    """
    climate_csv = CLIMATE_CSV if climate_csv is None else climate_csv
    normals_csv = NORMALS_CSV if normals_csv is None else normals_csv
    wanted, months = set(fips_list), None
    for column, code in NOAA_FILES.items():
        path = sorted(glob.glob(f"{noaa_folder}/climdiv-{code}-*"))[-1]
        table = read_noaa_file(path, wanted, MISSING_AT_OR_BELOW[code]).rename(columns={"value": column})
        months = table if months is None else months.merge(table, on=["fips", "year", "month"], how="outer")
        print(f"{path.split('/')[-1]}: {table['fips'].nunique()} counties")
    # "normal" for each calendar month, from 1901-1999 only
    old = months[months["year"].between(*NORMAL_YEARS)]
    normals = old.groupby(["fips", "month"])[["rain_in", "temp_f"]].mean().reset_index()
    normals = normals.rename(columns={"rain_in": "rain_normal", "temp_f": "temp_normal"})
    ROUND4_DATA.mkdir(parents=True, exist_ok=True)
    normals.to_csv(normals_csv, index=False)
    recent = months[months["year"] >= FIRST_YEAR_KEPT].sort_values(["fips", "year", "month"])
    recent.to_csv(climate_csv, index=False)
    print(f"saved {recent['fips'].nunique()} counties, {recent['year'].min()} to {recent['year'].max()}")


def monthly_features():
    """Build sets W, P and N for every county and month. The row for month m describes the
    months UP TO AND INCLUDING m. The publication lag is applied later, in add_climate_features.
    """
    data = pd.read_csv(CLIMATE_CSV, dtype={"fips": str})
    normals = pd.read_csv(NORMALS_CSV, dtype={"fips": str})
    for more_csv, more_normals in [(MORE_CLIMATE_CSV, MORE_NORMALS_CSV), (EAST_CLIMATE_CSV, EAST_NORMALS_CSV)]:
        if more_csv.exists() and more_normals.exists():             # the counties added in rounds 6 and 7
            more = pd.read_csv(more_csv, dtype={"fips": str})
            shared = set(more["fips"]) & set(data["fips"])
            if shared:
                raise ValueError(f"{more_csv.name} repeats {len(shared)} counties that an earlier climate file holds")
            data = pd.concat([data, more], ignore_index=True)
            normals = pd.concat([normals, pd.read_csv(more_normals, dtype={"fips": str})], ignore_index=True)
    data = data.merge(normals, on=["fips", "month"], how="left")
    data["period"] = pd.PeriodIndex.from_fields(year=data["year"], month=data["month"], freq="M")
    out = []
    for fips, county in data.groupby("fips"):
        county = county.sort_values("period").set_index("period")
        feats = pd.DataFrame({"fips": fips}, index=county.index)
        for k in (3, 6, 12):
            # rain in the last k months / normal rain for those same k calendar months
            feats[f"rain{k}"] = county["rain_in"].rolling(k).sum() / county["rain_normal"].rolling(k).sum()
        for k in (3, 12):
            # average of (temperature - normal) over the last k months
            feats[f"heat{k}"] = (county["temp_f"] - county["temp_normal"]).rolling(k).mean()
        feats["pdsi"] = county["pdsi"]
        feats["pdsi_chg3"] = county["pdsi"] - county["pdsi"].shift(3)
        feats["pdsi_min12"] = county["pdsi"].rolling(12).min()
        feats["z1"] = county["zndx"]
        feats["z3"] = county["zndx"].rolling(3).mean()
        feats["z6"] = county["zndx"].rolling(6).mean()
        out.append(feats.reset_index())
    feats = pd.concat(out, ignore_index=True)
    # Set N: one value per county. Yearly rain = the twelve monthly normals added up.
    yearly = normals.groupby("fips").agg(norm_rain=("rain_normal", "sum"), norm_temp=("temp_normal", "mean"))
    return feats.merge(yearly.reset_index(), on="fips", how="left")


def add_climate_features(table):
    """Add sets W, P and N to any table that has "fips" and "date" columns.

    A row dated in month M gets the numbers for month M-2 (the publication lag). A county that
    is not in the climate file gets NaN.
    """
    table = table.copy()
    table["period"] = table["date"].dt.to_period("M") - PUBLISH_LAG_MONTHS
    table = table.merge(monthly_features(), on=["fips", "period"], how="left")
    return table.drop(columns="period")
