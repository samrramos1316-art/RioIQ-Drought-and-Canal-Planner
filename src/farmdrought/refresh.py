"""refresh.py: fetch the newest data, then rebuild this week's outputs. This is the "live data" step.

HOW LIVE CAN THIS BE? Each source updates on its own clock:
  U.S. Drought Monitor  : once a week (Thursdays). THE FORECAST CAN ONLY CHANGE WEEKLY.
  El Nino index (NOAA)  : once a month
  County weather (NOAA) : once a month
  Reservoir storage     : once a day
  Canals, soil, district boundaries : fixed (not refreshed here)
So running this every day gives a new reservoir reading daily and a new forecast weekly.

WHAT IT DOES:
  1. Download the fresh files into data/live. A download is checked BEFORE it is saved.
     If a source fails, the saved file is kept and the failure is reported.
     data/raw and notebooks/oni.txt are NEVER written here: they are the snapshot the frozen
     results were scored on (see data/manifest.json).
  2. If anything changed, rerun the export's predict step (this week's forecast, the canal
     levels and the sealant plan). Nothing is scored here: the test results were scored once
     by `python -m farmdrought.export evaluate` and are kept in reports/frozen/v1/. Version 2
     is no longer rerun either.
  3. Rebuild the issues list (reports/issues.json, see issues.py).
     It is rebuilt on every run, because weather alerts change by the hour.
  4. Write reports/refresh.json: what was fetched, how new it is, and what failed.

HONEST NOTE: new data cannot move a reported score. The scores were made once from the snapshot
in data/raw, which this file never touches; only this week's forecast reads data/live. The
models, inputs, thresholds and rules never change here. Only the data does.

Run it with:  PYTHONPATH=src python -m farmdrought.refresh
              PYTHONPATH=src python -m farmdrought.refresh --download-only   (skip the reruns)
"""
import json
import subprocess
import sys
from datetime import datetime, timezone

import pandas as pd
import requests

from farmdrought.config import (FOCUS_RIVER, ONI_TXT, REPORTS, RESERVOIR_DIR, RESERVOIR_FILES, ROOT, USDM_JSON,
                                live_copy, live_data, raw_path)

REFRESH_JSON = REPORTS / "refresh.json"
BROWSER = {"User-Agent": "Mozilla/5.0"}  # some government servers refuse requests with no browser name
# The three sources, all public with no key (checked Nov 14, 2026)
USDM_URL = "https://raw.githubusercontent.com/sustainable-fsa/usdm-counties/main/usdm-counties.json"
ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"
RESERVOIR_URL = "https://www.waterdatafortexas.org/reservoirs/individual/{file}"
# NOAA lists the 12 overlapping 3-month seasons by these names. Our file keeps them in this order.
SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"]
ONI_FIRST_YEAR = 1998  # our file starts here: two years before the drought record


def fetch(url):
    """Download a text file. Raises an error on any failure, so the caller keeps the old file."""
    reply = requests.get(url, headers=BROWSER, timeout=300)
    reply.raise_for_status()
    return reply.text


def week_of(usdm):
    """The date of the newest week in a Drought Monitor file."""
    return str((pd.Timestamp(usdm["week0"]) + pd.Timedelta(weeks=usdm["weeks"] - 1)).date())


def save_live(path, text):
    """Save a download as the live copy of a raw input (never over the snapshot itself)."""
    target = live_copy(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)


def refresh_drought():
    """Weekly drought class per county. Returns (newest week, did it change?)."""
    old = json.loads(raw_path(USDM_JSON).read_text())   # the last download, or the snapshot
    text = fetch(USDM_URL)
    new = json.loads(text)
    # Checks before replacing: same counties in the same order, one value per week, never shorter.
    assert new["counties"] == old["counties"], "the county list changed"
    assert all(len(series) == new["weeks"] for series in new["series"]), "a county is missing weeks"
    assert new["weeks"] >= old["weeks"], "the new file is shorter than the saved one"
    changed = new["series"] != old["series"]
    if changed:
        save_live(USDM_JSON, text)
    return week_of(new), changed


def oni_table(noaa_text):
    """Turn NOAA's El Nino file into our layout: one line per year, 12 season values.

    NOAA's file has one line per season:  "DJF 1950 25.01 -1.32"  (season, year, total, anomaly).
    We keep the anomaly. NOAA files NDJ under the year it STARTS in, the same as our file.
    """
    years = {}
    for line in noaa_text.splitlines()[1:]:  # the first line is the header
        season, year, _, anomaly = line.split()
        if int(year) >= ONI_FIRST_YEAR:
            years.setdefault(int(year), {})[season] = anomaly
    lines = []
    for year in sorted(years):
        # a year in progress has only its first seasons, and they must be in order with no gap
        values = [years[year][s] for s in SEASONS if s in years[year]]
        assert list(years[year]) == SEASONS[:len(values)], f"El Nino seasons out of order in {year}"
        lines.append(f"{year} " + " ".join(values))
    return lines


def refresh_enso():
    """Monthly El Nino index. Returns (newest season, did it change?)."""
    lines = oni_table(fetch(ONI_URL))
    old_lines = [line for line in raw_path(ONI_TXT).read_text().splitlines() if not line.startswith("#")]
    assert len(lines) >= len(old_lines), "the new El Nino file is shorter than the saved one"
    changed = lines != old_lines
    if changed:
        header = (f"# NOAA CPC ONI anomaly, seasons {' '.join(SEASONS)} "
                  f"(source: cpc.ncep.noaa.gov/data/indices/oni.ascii.txt, fetched {datetime.now().date()})")
        save_live(ONI_TXT, "\n".join([header] + lines) + "\n")
    last_year, *values = lines[-1].split()
    return f"{SEASONS[len(values) - 1]} {last_year}", changed


def refresh_reservoirs():
    """Daily reservoir storage, one file per lake. Returns (oldest of the newest readings, changed?)."""
    newest, changed = [], False
    for files in RESERVOIR_FILES.values():
        for name in files:
            text = fetch(RESERVOIR_URL.format(file=name))
            rows = [line for line in text.splitlines() if line and not line.startswith("#")]
            assert rows[0].startswith("date,") and len(rows) > 1000, f"{name} does not look like a reservoir file"
            newest.append(rows[-1].split(",")[0])  # the date of the last row
            path = RESERVOIR_DIR / name
            if text != raw_path(path).read_text():
                save_live(path, text)
                changed = True
    return min(newest), changed


def refresh_weather():
    """Monthly county rain and temperature (version 2 only). Two 40 MB files, so they are only
    downloaded when the month the forecast needs is missing from the saved file."""
    from farmdrought.drought import build_panel
    from farmdrought.weather import PUBLISH_LAG_MONTHS, WEATHER_CSV, download_weather

    newest = lambda: pd.read_csv(raw_path(WEATHER_CSV)).assign(p=lambda t: t["year"] * 100 + t["month"])["p"].max()
    needed = pd.Timestamp.today().to_period("M") - PUBLISH_LAG_MONTHS
    before = newest()
    if before < needed.year * 100 + needed.month:
        panel = build_panel()
        download_weather(sorted(panel.loc[panel["river"] == FOCUS_RIVER, "fips"].unique()),
                         path=live_copy(WEATHER_CSV))
    after = newest()
    return f"{after // 100}-{after % 100:02d}", bool(after != before)


def run(*command):
    """Run one pipeline step as its own program, and stop if it fails."""
    print(">>>", " ".join(command), flush=True)
    subprocess.run([sys.executable, *command], check=True, cwd=ROOT)


def main():
    with live_data():   # compare each download with the newest copy we hold, not with the snapshot
        _main()


def _main():
    sources = {"drought_monitor": ("weekly", refresh_drought), "el_nino_index": ("monthly", refresh_enso),
               "reservoirs": ("daily", refresh_reservoirs), "county_weather": ("monthly", refresh_weather)}
    report = {"refreshed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "sources": {}}
    for name, (updates, download) in sources.items():
        try:
            newest, changed = download()
            report["sources"][name] = {"updates": updates, "newest": newest, "changed": changed, "ok": True}
        except Exception as error:  # the saved file is kept, and the failure is written down
            report["sources"][name] = {"updates": updates, "ok": False, "changed": False, "error": str(error)[:200]}
        print(name, report["sources"][name], flush=True)

    changed = lambda name: report["sources"][name]["changed"]
    # Did the inputs of the main forecasts change? (Reservoirs only feed the second 6-month
    # forecast and the reservoir tiles.) This is recorded so a reader knows what kind of day it was.
    report["forecast_inputs_changed"] = (changed("drought_monitor") or changed("el_nino_index")
                                         or changed("county_weather"))
    report["outputs_rebuilt"] = "--download-only" not in sys.argv and any(changed(name) for name in sources)
    if report["outputs_rebuilt"]:
        run("-m", "farmdrought.export")      # predict only: this week's forecast, never the scores
        run("-m", "farmdrought.prospective") # write the new forecast down before its answer is known
        if report["sources"]["drought_monitor"]["changed"]:
            # Model M's three-month chance (Drought Monitor inputs only): new weekly area shares,
            # this week's forecast, and the log written before the answer is known. If it fails the
            # last good file stays and the failure is reported, like a failed download.
            try:
                run("-m", "farmdrought.live_m")
                report["quarter_m"] = {"ok": True}
            except subprocess.CalledProcessError as error:
                report["quarter_m"] = {"ok": False, "error": str(error)[:200]}
    if "--download-only" not in sys.argv:
        # The issues list reads live weather alerts and the rain forecast, so it is rebuilt on
        # every run, even on a day when no saved file changed.
        run("-m", "farmdrought.issues")
    REFRESH_JSON.write_text(json.dumps(report, indent=2) + "\n")
    print("wrote", REFRESH_JSON.name, "| outputs rebuilt:", report["outputs_rebuilt"])


if __name__ == "__main__":
    main()
