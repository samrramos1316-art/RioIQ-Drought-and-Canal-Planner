"""reproduce.py: retrain version 1 on this computer and compare with the frozen numbers.

Why: the frozen results in reports/frozen/v1/metrics.json were scored once. This script shows
that the code in the repo still gives those numbers. It trains the 4-week alert and both
outlooks again (seed 0, weeks up to config.SCORE_THROUGH) and compares three headline numbers:

    4-week alert cost, 6-month outlook cost, 12-month outlook error (weeks)

Random forests are not bit-for-bit identical on different computers (see "machine_note" in the
frozen file: 2,324 on the laptop, 2,328 on GitHub's computer), so each number must be within
TOLERANCE of the frozen one, not equal to it. It writes nothing.

Run it with:  python tools/reproduce.py      (a few minutes)
"""
import json
import sys
from pathlib import Path

# Put the pipeline (src/) on the import path, so this script runs without setting PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from farmdrought.alert import run_alert
from farmdrought.config import FROZEN, SCORE_THROUGH
from farmdrought.outlook import run_outlook

TOLERANCE = 0.01   # 1%, the figure ARCHITECTURE.md section 3.0 sets


def main():
    with open(FROZEN / "metrics.json") as f:
        frozen = json.load(f)
    panel, alert = run_alert(score_through=SCORE_THROUGH)
    _, season, year = run_outlook(panel)
    rows = [("4-week alert cost", alert["headline"]["system_cost"], frozen["headline"]["system_cost"]),
            ("6-month outlook cost", season["focus"]["system_cost"], frozen["season"]["focus"]["system_cost"]),
            ("12-month outlook error", year["focus"]["mae_system"], frozen["year"]["focus"]["mae_system"])]
    failed = False
    for name, now, then in rows:
        gap = abs(now - then) / then
        ok = gap <= TOLERANCE
        failed = failed or not ok
        print(f"{name:24s} now {now:>8}  frozen {then:>8}  gap {gap:.2%}  {'ok' if ok else 'OUTSIDE 1%'}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
