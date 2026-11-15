"""losses.py: what drought has actually cost Rio Grande farmers, from crop insurance records.

DATA: USDA Risk Management Agency, "Cause of Loss" files. One file per year. Each row is
one county + crop + cause of loss + month, with the insurance payout ("indemnity") in dollars.
    https://pubfs-rma.fpac.usda.gov/pub/Web_Data_Files/Summary_of_Business/cause_of_loss/colsom_<year>.zip

The yearly files cover every U.S. county (about 40 MB each unzipped), so download_losses()
keeps only the 31 Rio Grande counties and saves one small CSV. That CSV is committed.

WHAT THIS IS NOT: these are INSURED losses only. Uninsured crops, most pasture and cattle
losses are not in here. Dollars are not adjusted for inflation.

Run it with:  PYTHONPATH=src python -m farmdrought.losses            (summarize)
              PYTHONPATH=src python -m farmdrought.losses download   (rebuild the CSV)
"""
import io
import sys

import pandas as pd
import requests

from farmdrought.config import FOCUS_RIVER, LOSS_YEARS, LOSSES_CSV

URL = "https://pubfs-rma.fpac.usda.gov/pub/Web_Data_Files/Summary_of_Business/cause_of_loss/colsom_{year}.zip"
# The files have no header row. They have 30 columns separated by "|". We need these six
# (positions counted from 0, checked by hand against the 2011 and 2025 files):
COLUMNS = {0: "year", 1: "state_code", 3: "county_code", 6: "crop", 12: "cause", 28: "indemnity"}
SOURCE = "USDA Risk Management Agency, Cause of Loss files"


def download_losses(fips):
    """Download every year, keep the rows of the given counties, and save one CSV."""
    years = []
    for year in range(LOSS_YEARS[0], LOSS_YEARS[1] + 1):
        reply = requests.get(URL.format(year=year), timeout=300)
        reply.raise_for_status()
        raw = pd.read_csv(io.BytesIO(reply.content), compression="zip", sep="|", header=None, dtype=str,
                          usecols=list(COLUMNS), encoding="latin-1").rename(columns=COLUMNS)
        raw["fips"] = raw["state_code"] + raw["county_code"]  # 2-digit state + 3-digit county
        kept = raw[raw["fips"].isin(fips)]
        years.append(kept[["year", "fips", "crop", "cause", "indemnity"]])
        print(year, len(kept), "rows")
    table = pd.concat(years)
    # Older files write crops in capitals ("COTTON"), newer ones do not ("Cotton"). Make them match.
    table["crop"], table["cause"] = table["crop"].str.strip().str.title(), table["cause"].str.strip()
    LOSSES_CSV.parent.mkdir(parents=True, exist_ok=True)
    table.to_csv(LOSSES_CSV, index=False)


def run_losses(counties):
    """Build the "losses" block of metrics.json.

    counties : table with fips, county and state for the 31 Rio Grande counties
    """
    if not LOSSES_CSV.exists():
        # The contract says: never invent data. Write empty lists and the reason.
        return {"source": SOURCE, "years": list(LOSS_YEARS), "causes_included": [], "total_usd": 0,
                "by_year": [], "by_county": [], "note": "The loss file was not downloaded, so there is nothing to report."}
    table = pd.read_csv(LOSSES_CSV, dtype={"fips": str})
    drought = table[table["cause"].str.contains("Drought", case=False, na=False)]   # a row with no cause is not a drought row
    # "Failure of Irrigation Supply" is a separate cause in the files. It is closely related
    # (no water in the canal), but it is NOT in the total. It is reported on its own line.
    irrigation = table[table["cause"].str.contains("Irrigation Supply", case=False, na=False)]
    by_year = drought.groupby("year")["indemnity"].sum().reindex(range(LOSS_YEARS[0], LOSS_YEARS[1] + 1), fill_value=0)
    by_county = drought.groupby("fips")["indemnity"].sum()
    names = counties.drop_duplicates("fips").set_index("fips")
    return {
        "source": SOURCE,
        "years": list(LOSS_YEARS),
        "causes_included": sorted(drought["cause"].unique()),
        # the total is the sum of the rounded yearly figures, so the two always agree
        "total_usd": int(by_year.round().sum()),
        "by_year": [{"year": int(year), "usd": round(float(usd))} for year, usd in by_year.items()],
        # every Rio Grande county is listed, largest loss first (0 if it had no drought claims)
        "by_county": sorted([{"fips": fips, "county": names.loc[fips, "county"], "state": names.loc[fips, "state"],
                              "usd": round(float(by_county.get(fips, 0)))} for fips in names.index],
                            key=lambda entry: -entry["usd"]),
        "note": "Insured crop losses only, paid for the cause 'Drought'. Not all drought losses: uninsured "
                "crops and most pasture and cattle losses are missing. Dollars are not adjusted for inflation. "
                f"The latest year may still be incomplete. Losses for the separate cause 'Failure of Irrigation "
                f"Supply' are not in the total. They were ${irrigation['indemnity'].sum():,.0f} over the same years.",
        # ---- extra, beyond the agreed keys ----
        "irrigation_supply_usd": round(float(irrigation["indemnity"].sum())),
        "top_crops": [{"crop": crop, "usd": round(float(usd))} for crop, usd in
                      drought.groupby("crop")["indemnity"].sum().sort_values(ascending=False).head(5).items()],
    }


if __name__ == "__main__":
    from farmdrought.drought import build_panel

    panel = build_panel()
    counties = panel.loc[panel["river"] == FOCUS_RIVER, ["fips", "county", "state"]].drop_duplicates()
    if sys.argv[1:] == ["download"]:
        download_losses(set(counties["fips"]))
    result = run_losses(counties)
    print(result["note"], "\n\nTotal:", f"${result['total_usd']:,}", "\n")
    print(pd.DataFrame(result["by_year"]).to_string(index=False), "\n")
    print(pd.DataFrame(result["by_county"]).to_string(index=False), "\n")
    print(pd.DataFrame(result["top_crops"]).to_string(index=False))
    print("\nEvery cause of loss in the file:\n", pd.read_csv(LOSSES_CSV)["cause"].value_counts().to_string())
