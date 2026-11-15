#!/usr/bin/env bash
# Check everything a reader can check in about a minute: both test folders and the four hash lists.
# It scores nothing and writes nothing. Run it from the repository root:  bash scripts/verify.sh
set -euo pipefail
export PYTHONPATH=src
python -m pytest tests/pipeline -q
python -m pytest tests/app -q
python -m farmdrought.manifest
python -m farmdrought.manifest frozen
python -m farmdrought.manifest prospective
python -m farmdrought.manifest round4
python -m farmdrought.manifest prospective_m
echo "all checks passed"
