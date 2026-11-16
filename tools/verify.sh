#!/usr/bin/env bash
# The same checks as tools/verify.py, for people who prefer to call a shell script.
# Run it from anywhere:  bash tools/verify.sh     (on Windows use:  python tools/verify.py)
set -euo pipefail
cd "$(dirname "$0")/.."
python tools/verify.py
