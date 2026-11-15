"""ponding.py: the leak model against MEASURED seepage on real canals.

ADDED in round 4. Declared in reports/decision.md ("Round 4, leak model: a check against
measured canal tests") before any measured rate was set beside a model figure. Run once.

THE DATA. A ponding test dams a stretch of canal at both ends and measures how fast the water
level falls. Texas A&M (Leigh and Fipps) published 57 of them, 1998 to 2005, on Rio Grande
district canals. data/round4/ponding_tests.csv is that table, typed in from the reports named
in data/round4/ponding_sources.md. 16 tests are on unlined (bare earth) canals.

THE COMPARISON. The tests give a soil texture but no coordinates, so each model gives ONE rate
per soil texture:
  texture table : the 1946 rates the website uses (config.SEEPAGE_GAL_SQFT_DAY)
  permeability  : the median soil-survey permeability of this project's own canal segments on
                  that texture, times 2.1205 (no water-table factor, no fitted factor)

WHAT IS REPORTED
  1. Rank agreement: Spearman correlation between model rate and measured rate over the unlined
     tests, with a bootstrap over tests. A model passes only if the interval is wholly above 0.
  2. Level: the median of (measured rate / model rate).
  3. Beside them, not tested: the same for seepage-only tests, and lined against unlined.

Run it with:  PYTHONPATH=src python -m farmdrought.ponding
"""
import json
import sys

import numpy as np
import pandas as pd

from farmdrought.climate import ROUND4_DATA
from farmdrought.config import (CANAL_KSAT_CSV, CANAL_SOIL_CSV, FROZEN, KSAT_TO_GAL_SQFT_DAY, ROOT, ROUND3,
                                SEEPAGE_GAL_SQFT_DAY)
from farmdrought.manifest import add_new_frozen_files, check_round4
from farmdrought.round3 import header, write_items

OUTPUT = "ponding.json"
PONDING_CSV = ROUND4_DATA / "ponding_tests.csv"
DECLARED_IN = ('reports/decision.md, section "Round 4, leak model: a check against measured canal tests (declared '
               'Nov 15, 2026, before the measured rates were joined to any model figure)"')
DRAWS, SEED = 10000, 0
MIN_DISTINCT_RATES = 3     # an order needs at least three different model rates to mean anything
# The table's keys in lower case, so a texture can be matched by name whatever its capitals.
TABLE = {name.lower(): rate for name, rate in SEEPAGE_GAL_SQFT_DAY.items()}


def permeability_by_texture():
    """{texture in lower case: median permeability rate} over this project's canal segments."""
    soil = pd.read_csv(CANAL_SOIL_CSV, dtype=str)
    ksat = pd.read_csv(CANAL_KSAT_CSV, dtype={"id": str})
    both = soil.merge(ksat, on="id").dropna(subset=["soil", "ksat_typ"])
    median = both.groupby(both["soil"].str.lower())["ksat_typ"].median()
    return (median * KSAT_TO_GAL_SQFT_DAY).to_dict()


def textures_in(note):
    """The soil textures a test names, in lower case. "silty clay, silty clay loam" gives two.
    Text in brackets is a remark, not a texture. "Fine sandy clay loam" is read as sandy clay loam."""
    names = [part.strip().lower() for part in str(note).split("(")[0].split(",")]
    return ["sandy clay loam" if name == "fine sandy clay loam" else name for name in names if name]


def model_rate(note, rates):
    """A model's rate for a test: the average over the textures it names that have a rate.
    NaN when none of them has one."""
    found = [rates[name] for name in textures_in(note) if name in rates]
    return float(np.mean(found)) if found else np.nan


def spearman(a, b):
    """Spearman rank correlation: the ordinary correlation of the two lists of ranks."""
    return float(pd.Series(a).rank().corr(pd.Series(b).rank()))


def rank_agreement(model, measured):
    """Spearman correlation with a bootstrap interval over tests (tests are drawn again with
    replacement; a draw where every model rate is the same has no correlation and is skipped)."""
    model, measured = np.asarray(model, float), np.asarray(measured, float)
    if len(set(model)) < MIN_DISTINCT_RATES:
        # With one or two different model rates the "order" is a single split of the tests, and
        # many resamples have no order at all. An interval from the rest would look far surer
        # than it is, so none is given. (Added after the first run: see ponding_errata.json.)
        return {"spearman": round(spearman(model, measured), 3), "lo": None, "hi": None, "n_tests": int(len(model)),
                "draws_used": 0, "passes": None,
                "note": f"no interval: the model gives fewer than {MIN_DISTINCT_RATES} different rates across these tests"}
    rng, values = np.random.default_rng(SEED), []
    for _ in range(DRAWS):
        pick = rng.integers(0, len(model), len(model))
        if len(set(model[pick])) > 1 and len(set(measured[pick])) > 1:
            values.append(spearman(model[pick], measured[pick]))
    lo, hi = np.percentile(values, [2.5, 97.5])
    return {"spearman": round(spearman(model, measured), 3), "lo": round(float(lo), 3), "hi": round(float(hi), 3),
            "n_tests": int(len(model)), "draws_used": len(values), "passes": bool(lo > 0)}


def model_block(tests, column):
    """Rank agreement and level for one model on one set of tests."""
    rows = tests.dropna(subset=[column])
    ratio = rows["seepage_gal_ft2_day"] / rows[column]
    return {**rank_agreement(rows[column], rows["seepage_gal_ft2_day"]),
            "median_measured_over_model": round(float(ratio.median()), 3),
            "median_model_rate": round(float(rows[column].median()), 2),
            "median_measured_rate": round(float(rows["seepage_gal_ft2_day"].median()), 2)}


def ponding_item(tests):
    """The content of ponding.json (without its header). tests: the table in ponding_tests.csv."""
    tests = tests.dropna(subset=["seepage_gal_ft2_day"]).copy()
    ksat_rates = permeability_by_texture()
    tests["rate_table"] = [model_rate(note, TABLE) for note in tests["soil_note"]]
    tests["rate_permeability"] = [model_rate(note, ksat_rates) for note in tests["soil_note"]]
    unlined = tests[tests["lining"].str.startswith("unlined")]
    lined = tests[~tests["lining"].str.startswith("unlined") & (tests["lining"] != "CONFLICT")]
    seepage_only = unlined[unlined["test_type"] == "seepage"]
    out = {
        "what": "Measured ponding tests on unlined canals against each model's rate for the test's soil texture. "
                "Rates in gallons per square foot per day.",
        "unlined_tests": int(len(unlined)),
        "dropped_no_texture_rate": {"texture table": int(unlined["rate_table"].isna().sum()),
                                    "permeability": int(unlined["rate_permeability"].isna().sum())},
        "primary": {"texture table": model_block(unlined, "rate_table"),
                    "permeability": model_block(unlined, "rate_permeability")},
        "seepage_only": {"texture table": model_block(seepage_only, "rate_table"),
                         "permeability": model_block(seepage_only, "rate_permeability")},
        "lined_against_unlined": {
            "lined_tests": int(len(lined)), "lined_median": round(float(lined["seepage_gal_ft2_day"].median()), 2),
            "unlined_tests": int(len(unlined)), "unlined_median": round(float(unlined["seepage_gal_ft2_day"].median()), 2),
            "note": "Not tested. Most lined tests were on old, cracked concrete."},
        "tests": [{"district": None if pd.isna(r.district) else r.district, "soil": r.soil_note, "type": r.test_type,
                   "measured": r.seepage_gal_ft2_day,
                   "texture_table": None if pd.isna(r.rate_table) else round(r.rate_table, 2),
                   "permeability": None if pd.isna(r.rate_permeability) else round(r.rate_permeability, 2)}
                  for r in unlined.itertuples()],
    }
    out["site_summary"] = [
        {"name": f"Leak model against measured canal tests: rank agreement, {name} ({b['n_tests']} unlined tests)",
         "value": b["spearman"], "lo": b["lo"], "hi": b["hi"], "n_years": None,
         "verdict": "agrees" if b["passes"] else "not shown", "lower_is_better": False}
        for name, b in out["primary"].items()]
    return out


def main():
    if (ROUND3 / OUTPUT).exists():
        write_items({OUTPUT: None})   # raises: already run, and this check is run once
    problems = check_round4()
    if problems:
        raise RuntimeError("an input under data/round4 differs from data/round4.sha256, so nothing was scored:\n  "
                           + "\n  ".join(problems))
    with open(FROZEN / "metrics.json") as f:
        frozen = json.load(f)
    content = {**header(frozen), "declared_in": DECLARED_IN, **ponding_item(pd.read_csv(PONDING_CSV))}
    for path in write_items({OUTPUT: content}):
        print("wrote", path.relative_to(ROOT))
    add_new_frozen_files()


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python -m farmdrought.ponding")
    main()
