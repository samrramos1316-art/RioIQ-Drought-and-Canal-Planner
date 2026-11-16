"""costratio.py: what is the real cost ratio of sealing a canal on the Rio Grande?

ADDED for round 7 (reports/decision.md). It prints a range, not one number, and scores nothing.

    ratio = cost of one sealant application / value of the water it saves if a drought season comes
    r     = 1 / ratio - 1     (how many false alarms one missed drought season is worth)

Every input is one the project already uses:
  price     config.SEALANT_USD_PER_SQFT   $0.004 per square foot, MATERIALS ONLY (a best case)
  rate      config.SEEPAGE_GAL_SQFT_DAY   Texas A&M table, gallons per square foot per day
  measured  0.5                           16 measured canals leaked about half the table rate
  cut       config.SEALANT_CUT            the sealant stops 28% to 87% of seepage
  days      config.SEALANT_DAYS           one application lasts about 90 days
  value     the website's own division: worst-case crop revenue / Valley irrigation water,
            $495,823,372 / 1,349,369 acre-feet = about $367 per acre-foot (app/site/js/common.js)

WHAT THIS LEAVES OUT, and which way it pushes:
  - Labour, equipment and water to apply the sealant are not in the price: the true ratio is HIGHER.
  - A drought season does not always cut deliveries, so saved water is not always worth the
    full crop value: the true ratio is HIGHER.
So the figures below are LOWER bounds on the ratio. Nobody at a district has given us a real one.

Run it with:  python tools/costratio.py
"""
import sys
from pathlib import Path

# Put the pipeline (src/) on the import path, so this script runs without setting PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from farmdrought.config import (COST_RATIOS, GALLONS_PER_ACRE_FOOT, SEALANT_CUT, SEALANT_DAYS, SEALANT_USD_PER_SQFT,
                                SEEPAGE_GAL_SQFT_DAY)

USD_PER_ACRE_FOOT = 495_823_372 / 1_349_369     # the website's figure (app/site/js/common.js)
MEASURED_SHARE = 0.5                             # measured leaks were about half the table rate
TABLE_7 = ["Clay", "Silty clay loam", "Clay loam", "Silt loam", "Loam", "Fine sandy loam", "Sandy loam"]


def ratio(rate, cut, measured_share=MEASURED_SHARE, price=SEALANT_USD_PER_SQFT):
    """Cost of one application / value of the water it saves, per square foot of canal."""
    gallons_saved = rate * SEALANT_DAYS * cut * measured_share
    return price / (gallons_saved / GALLONS_PER_ACRE_FOOT * USD_PER_ACRE_FOOT)


def scenarios():
    rates = sorted(SEEPAGE_GAL_SQFT_DAY[soil] for soil in TABLE_7)
    middle_cut = sum(SEALANT_CUT) / 2
    return {
        "sealing helps least (clay, weakest sealant)": ratio(rates[0], SEALANT_CUT[0]),
        "middle (silt loam, middle sealant)": ratio(rates[len(rates) // 2], middle_cut),
        "sealing helps most (sandy loam, strongest sealant, table rate)": ratio(rates[-1], SEALANT_CUT[1], 1.0),
    }


def main():
    print(f"water value: ${USD_PER_ACRE_FOOT:,.0f} per acre-foot; price: ${SEALANT_USD_PER_SQFT} per sq ft, materials only")
    for name, value in scenarios().items():
        nearest = min(COST_RATIOS, key=lambda c: abs(c - value))
        print(f"  {name:62s} ratio {value:.3f}   r = {1 / value - 1:5.0f}   nearest declared ratio {nearest}")
    print("These are LOWER bounds on the ratio: labour is not in the price, and a drought season does not always cut deliveries.")


if __name__ == "__main__":
    main()
