"""districts.py: drought risk per irrigation district, and where a sealant budget should go.

THE CHAIN, one step further than leaks.py:
  1. WHEN    : the 6-month forecast gives each county a chance of a drought season (p_season).
  2. WHERE   : the USGS canal map (canals.py).
  3. HOW LEAKY: the soil under each canal and its published seepage rate (leaks.py).
  4. WHOSE   : which irrigation district each canal lies inside (this file).
  5. HOW MUCH: share a sealant budget out, most valuable canal first (this file).

DISTRICT BOUNDARIES: Texas Commission on Environmental Quality (TCEQ), public map service of
water districts. We take three kinds that deliver irrigation water: Irrigation Districts,
Water Control & Improvement Districts and Water Improvement Districts.
    https://gisweb.tceq.texas.gov/arcgis/rest/services/iwud/WaterDistricts_PRD/MapServer
We found NO public boundary file for districts in New Mexico or Colorado, so this file covers
the Texas part of the Rio Grande only. Canals elsewhere keep their county-level priority.

THE SEALANT RULE: every dollar of sealant treats the same area of canal (one price per square
foot, one assumed width). So a dollar saves the most water where the soil leaks fastest, and
that water matters most where a drought season is most likely. We therefore rank canals by
    score = seepage rate x chance of a drought season      (the same score as leaks.py)
and pay for canals from the top of the list down until the budget is spent.

WHAT THIS IS NOT (say this to the judges): nobody measured these canals. We do not know which
are already lined, how wide they are, or any district's real budget. It is a first plan for
where to send an inspector with a sealant truck, not a promise of water saved.

Run it with:  PYTHONPATH=src python -m farmdrought.districts            (summarize)
              PYTHONPATH=src python -m farmdrought.districts download   (fetch the boundaries)
"""
import json
import sys

import pandas as pd
import requests

from farmdrought.canals import inside_county
from farmdrought.config import (CANALS_GEOJSON, DISTRICTS_GEOJSON, DISTRICTS_RAW, FEET_PER_KM, GALLONS_PER_ACRE_FOOT,
                                LEAKY_SOIL_RATE,
                                LATEST, MIN_DISTRICT_CANAL_KM, SEALANT_BUDGET_USD, SEALANT_CUT, SEALANT_DAYS,
                                SEALANT_USD_PER_SQFT, SEASON_THRESHOLD, WETTED_WIDTH_FT)
from farmdrought.leaks import rate_canals

SERVICE = "https://gisweb.tceq.texas.gov/arcgis/rest/services/iwud/WaterDistricts_PRD/MapServer"
# layer number in the service -> kind of district
LAYERS = {3: "Irrigation District", 13: "Water Control & Improvement District", 14: "Water Improvement District"}
SOURCE = "Texas Commission on Environmental Quality, Water Districts map service (active districts)"


def download_districts(county_names):
    """Download the boundary of every active district based in our Texas Rio Grande counties."""
    names = ",".join(f"'{name}'" for name in sorted(county_names))
    features = []
    for layer in LAYERS:
        reply = requests.get(f"{SERVICE}/{layer}/query", timeout=300, headers={"User-Agent": "Mozilla/5.0"}, params={
            "where": f"COUNTY IN ({names}) AND STATUS = 'A'",   # 'A' = active
            "outFields": "NAME,DISTRICT_ID,TYPE,COUNTY", "outSR": 4326, "geometryPrecision": 5, "f": "geojson"})
        reply.raise_for_status()
        page = reply.json()
        if "features" not in page:
            raise RuntimeError(f"the TCEQ service returned an error: {page}")
        print(f"{LAYERS[layer]}: {len(page['features'])} boundaries")
        features += page["features"]
    DISTRICTS_RAW.parent.mkdir(parents=True, exist_ok=True)
    with open(DISTRICTS_RAW, "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, separators=(",", ":"))


def load_districts():
    """Return {district name: (properties, list of polygons)} from the downloaded file."""
    with open(DISTRICTS_RAW) as f:
        features = json.load(f)["features"]
    districts = {}
    for feature in features:
        geometry = feature["geometry"]
        polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
        districts[feature["properties"]["NAME"]] = (feature["properties"], polygons)
    return districts


def assign_districts(canals, districts):
    """Give each canal segment the district its middle point lies inside ("" if none).

    Only Texas segments are checked (county FIPS codes starting with 48), because the
    boundaries are Texas only. If two districts overlap, the first one found is kept.
    """
    def find(row):
        if not row.fips.startswith("48"):
            return ""
        return next((name for name, (_, polygons) in districts.items()
                     if inside_county(row.lon, row.lat, polygons)), "")
    return [find(row) for row in canals.itertuples()]


def sealant_plan(canals, budget=SEALANT_BUDGET_USD, use_forecast=True):
    """Add the sealant columns to the canal table. Returns the table.

    use_forecast=True (the default) ranks by score = seepage rate x chance of a drought season.
    use_forecast=False ranks by seepage rate alone: the county's drought chance is not looked at.
    Which canals can be treated, and what each one costs, is the same either way. Only the order
    changes. forecast_effect() below runs both and reports what the forecast changed.

    A canal can be treated ("eligible") if it is inside a district, is not a drain and its soil
    has a published seepage rate. In leaks.py those are exactly the canals with a score above 0.
      seal_sqft : area to treat = length x assumed wetted width
      seal_usd  : cost of one application
      seal_rank : 1 = treat first. Highest score first; ties go to the leakier soil.
      funded    : True while the running total of seal_usd still fits inside the budget
      saved_af_low / saved_af_high : acre-feet of water one application might save, IF the
                  canal is bare earth and carries water for the whole 90 days
    """
    canals = canals.copy()
    eligible = (canals["district"] != "") & (canals["score"] > 0)
    canals["seal_sqft"] = (canals["length_km"] * FEET_PER_KM * WETTED_WIDTH_FT).where(eligible)
    canals["seal_usd"] = canals["seal_sqft"] * SEALANT_USD_PER_SQFT
    if use_forecast:
        order = canals[eligible].sort_values(["score", "seepage_rate", "id"], ascending=[False, False, True]).index
    else:   # the same list, leakiest soil first; ties go to the lower id, as above
        order = canals[eligible].sort_values(["seepage_rate", "id"], ascending=[False, True]).index
    canals["seal_rank"] = pd.Series(range(1, len(order) + 1), index=order)
    running_total = canals.loc[order, "seal_usd"].cumsum()
    canals["funded"] = False
    canals.loc[order, "funded"] = running_total <= budget
    # water lost through the treated area in 90 days, in acre-feet, times the share a sealant stops
    lost_af = canals["seepage_rate"] * canals["seal_sqft"] * SEALANT_DAYS / GALLONS_PER_ACRE_FOOT
    canals["saved_af_low"], canals["saved_af_high"] = lost_af * SEALANT_CUT[0], lost_af * SEALANT_CUT[1]
    return canals


def rank_correlation(rank_a, rank_b):
    """Spearman's rank correlation between two orders of the same canals. 1 = the same order,
    0 = unrelated, -1 = exactly reversed. None when there are fewer than two canals, or when
    one of the orders has no spread, because then there is nothing to compare.

    Both lists are ranked again from 1 first, so a part of a longer list (one district's canals
    out of all of them) can be handed in as it is.
    """
    a, b = pd.Series(list(rank_a)).rank(), pd.Series(list(rank_b)).rank()
    if len(a) < 2 or a.std() == 0 or b.std() == 0:
        return None
    return round(float(a.corr(b)), 3)


def forecast_effect(canals, budget=SEALANT_BUDGET_USD):
    """What the drought forecast changes in the sealant plan.

    The plan is made twice with the same canals and the same budget: once ranked by seepage rate
    x chance of a drought season (the plan the site shows), and once ranked by seepage rate alone.
    For all districts together ("overall") and for each district it reports:
      both_km             canal funded in both plans
      only_forecast_km    canal funded only when the forecast is used
      only_no_forecast_km canal funded only when it is not
      rank_correlation    Spearman's correlation between the two orders (1 = the same order)
      ranked_km           canal that can be ranked at all
    It is a description of the rule, not a test: nothing here says which plan saves more water.
    A small or zero difference is reported as it is.
    """
    with_forecast = sealant_plan(canals, budget, use_forecast=True)
    without = sealant_plan(canals, budget, use_forecast=False)
    table = pd.DataFrame({
        "district": with_forecast["district"], "km": with_forecast["length_km"],
        "rank_with": with_forecast["seal_rank"], "rank_without": without["seal_rank"],
        "funded_with": with_forecast["funded"], "funded_without": without["funded"]})
    table = table[table["rank_with"].notna()]                 # only the canals that can be ranked

    def describe(rows):
        km = lambda keep: round(float(rows.loc[keep, "km"].sum()), 1)
        return {"ranked_km": round(float(rows["km"].sum()), 1),
                "both_km": km(rows["funded_with"] & rows["funded_without"]),
                "only_forecast_km": km(rows["funded_with"] & ~rows["funded_without"]),
                "only_no_forecast_km": km(~rows["funded_with"] & rows["funded_without"]),
                "rank_correlation": rank_correlation(rows["rank_with"], rows["rank_without"])}

    return {"budget_usd": budget,
            "what": "The sealant plan made twice with the same budget: ranked by seepage rate x chance of a drought "
                    "season, and ranked by seepage rate alone. A description of the rule, not a test of it.",
            "overall": describe(table),
            "districts": [{"district": name, **describe(rows)} for name, rows in sorted(table.groupby("district"))]}


def risk_level(p):
    """The same three levels as the rest of the project: Warning at 0.25, Watch at half of that."""
    return "Warning" if p >= SEASON_THRESHOLD else "Watch" if p >= SEASON_THRESHOLD / 2 else "Low"


def run_districts(latest, budget=SEALANT_BUDGET_USD):
    """Build the "districts" block of metrics.json and write the two map files."""
    if not DISTRICTS_RAW.exists():
        return {"source": SOURCE, "districts": [], "note": "The district file was not downloaded."}
    districts = load_districts()
    canals = rate_canals(latest)                               # one row per canal, with level and score
    canals["district"] = assign_districts(canals, districts)
    # A district with almost no mapped canal is a town water utility, not a canal network.
    # Its canals count as "no district", so the budget is only shared among listed districts.
    km_in = canals.groupby("district")["length_km"].sum()
    canals.loc[canals["district"].map(km_in) < MIN_DISTRICT_CANAL_KM, "district"] = ""
    canals = sealant_plan(canals, budget)
    county_name = latest.set_index("fips")["county"]

    rows, shapes = [], []
    for name, (properties, polygons) in districts.items():
        own = canals[canals["district"] == name]
        km = float(own["length_km"].sum())
        if km == 0:
            continue  # no canals of its own (see the 5 km rule above)
        funded = own[own["funded"]]
        # the district's drought risk = its counties' forecast, weighted by the canal km in each
        p = float((own["p_season"] * own["length_km"]).sum() / km)
        row = {
            "district": name, "kind": LAYERS[{"ID": 3, "WCID": 13, "WID": 14}.get(properties["TYPE"], 3)],
            "counties": sorted({county_name[fips] for fips in own["fips"]}),
            "p_season": round(p, 3), "risk": risk_level(p),
            "canal_km": round(km, 1),
            "treatable_km": round(float(own.loc[own["seal_rank"].notna(), "length_km"].sum()), 1),
            # km on soil that counts as leaky (loam or sandier), whatever the forecast says.
            # Drains are left out: they are never sealed. (This used to count only the canals that
            # were on leaky soil AND had a forecast warning, under the same name.)
            "leaky_soil_km": round(float(own.loc[(own["seepage_rate"] >= LEAKY_SOIL_RATE) & (own["level"] != "Drain"),
                                                 "length_km"].sum()), 1),
            "sealed_km": round(float(funded["length_km"].sum()), 1),
            "sealant_sqft": int(round(funded["seal_sqft"].sum())),
            "sealant_usd": int(round(funded["seal_usd"].sum())),
            "budget_share": round(float(funded["seal_usd"].sum() / budget), 3),
            "saved_af_low": int(round(funded["saved_af_low"].sum())),
            "saved_af_high": int(round(funded["saved_af_high"].sum())),
            "first_canals": [n for n in funded.sort_values("seal_rank")["name"].unique() if n][:5],
        }
        rows.append(row)
        geometry = {"type": "MultiPolygon", "coordinates": polygons}
        shapes.append({"type": "Feature", "properties": row, "geometry": geometry})
    rows.sort(key=lambda row: (-row["sealant_usd"], -row["p_season"]))

    # Map file 1: the district shapes, each carrying its row
    with open(DISTRICTS_GEOJSON, "w") as f:
        json.dump({"type": "FeatureCollection", "features": shapes}, f, separators=(",", ":"))
    # Map file 2: add district and sealant fields to every canal line
    with open(CANALS_GEOJSON) as f:
        map_file = json.load(f)
    assert len(map_file["features"]) == len(canals), "the map file and the canal table must hold the same segments"
    for feature, row in zip(map_file["features"], canals.itertuples()):
        ranked = not pd.isna(row.seal_rank)
        feature["properties"].update({
            "district": row.district, "seal_rank": int(row.seal_rank) if ranked else None,
            "seal_usd": round(row.seal_usd, 2) if ranked else None, "funded": bool(row.funded)})
    with open(CANALS_GEOJSON, "w") as f:
        json.dump(map_file, f, separators=(",", ":"))

    listed = canals[canals["district"].isin([row["district"] for row in rows])]
    funded = listed[listed["funded"]]
    return {
        "source": SOURCE,
        "map_file": "data/processed/districts.geojson",
        "budget_usd": budget,
        "assumptions": {"wetted_width_ft": WETTED_WIDTH_FT, "sealant_usd_per_sqft": SEALANT_USD_PER_SQFT,
                        "sealant_cut_low": SEALANT_CUT[0], "sealant_cut_high": SEALANT_CUT[1],
                        "days_one_application_lasts": SEALANT_DAYS},
        "rule": "Canals inside a district are ranked by seepage rate x chance of a drought season. The budget pays "
                "for canals from the top of the list down. A district's risk is its counties' 6-month forecast, "
                "weighted by canal km.",
        "n_districts": len(rows),
        "canal_km_in_districts": round(float(listed["length_km"].sum()), 1),
        "treatable_km": round(float(listed.loc[listed["seal_rank"].notna(), "length_km"].sum()), 1),
        "cost_to_treat_everything_usd": int(round(listed["seal_usd"].sum())),
        "sealed_km": round(float(funded["length_km"].sum()), 1),
        "spent_usd": int(round(funded["seal_usd"].sum())),
        "saved_af_low": int(round(funded["saved_af_low"].sum())),
        "saved_af_high": int(round(funded["saved_af_high"].sum())),
        "districts": rows,
        # ADDED: the same plan with and without the forecast in the ranking (see forecast_effect)
        "forecast_effect": forecast_effect(canals, budget),
        "note": "Texas districts only: we found no public boundary file for New Mexico or Colorado districts. "
                "The plan assumes every canal is bare earth, 20 feet of wetted width and full of water for 90 "
                "days. None of that was measured, and lined canals are not excluded because no data says which "
                "are lined. The sealant price is materials only. The sealant has not been field-tested on the "
                "Rio Grande. Water saved is a rough range, not a forecast.",
    }


if __name__ == "__main__":
    latest = pd.read_parquet(LATEST)
    if sys.argv[1:] == ["download"]:
        texas = latest[(latest["river"] == "Rio Grande") & latest["fips"].str.startswith("48")]
        download_districts(set(texas["county"]))
    result = run_districts(latest)
    print(result["note"], "\n")
    print({k: v for k, v in result.items() if k not in ("districts", "note", "rule", "assumptions")}, "\n")
    print(pd.DataFrame(result["districts"]).drop(columns=["kind", "first_canals"]).to_string(index=False))
