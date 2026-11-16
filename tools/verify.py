"""verify.py: every check a reader can run in about a minute, with one command on any computer.

    python tools/verify.py

It runs both test folders, the five hash checks and (if Node is installed) the website's own
tests. It scores nothing and writes nothing. It works the same on Windows, macOS and Linux:
it sets the import path itself and starts Python in UTF-8 mode, so nothing has to be set by hand.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# -X utf8: read and write text files as UTF-8 whatever the computer's own default is
# (Windows would otherwise use its local code page and stumble on letters such as "ñ").
PYTHON = [sys.executable, "-X", "utf8"]
ENV = {**os.environ, "PYTHONPATH": str(ROOT / "src")}

CHECKS = [
    ("pipeline tests", PYTHON + ["-m", "pytest", "tests/pipeline", "-q"]),
    ("site build tests", PYTHON + ["-m", "pytest", "tests/app", "-q"]),
    ("raw inputs match data/manifest.json", PYTHON + ["-m", "farmdrought.manifest"]),
    ("frozen results match reports/frozen.sha256", PYTHON + ["-m", "farmdrought.manifest", "frozen"]),
    ("forecast log matches reports/prospective.sha256", PYTHON + ["-m", "farmdrought.manifest", "prospective"]),
    ("round 4 to 6 inputs match data/round4.sha256", PYTHON + ["-m", "farmdrought.manifest", "round4"]),
    ("three-month forecast log matches reports/prospective_m.sha256", PYTHON + ["-m", "farmdrought.manifest", "prospective_m"]),
]
NODE_CHECKS = [
    ("simulation tests", ["node", "app/site/sim/engine.test.js"]),
    ("site logic tests", ["node", "app/site/js/logic.test.js"]),
]


def main():
    checks = list(CHECKS)
    if shutil.which("node"):
        checks += NODE_CHECKS
    else:
        print("Node is not installed, so the website's own tests are skipped.")
    failed = []
    for name, command in checks:
        print(f"\n== {name}", flush=True)
        if subprocess.run(command, cwd=ROOT, env=ENV).returncode != 0:
            failed.append(name)
    print("\n" + ("all checks passed" if not failed else "FAILED: " + "; ".join(failed)))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
