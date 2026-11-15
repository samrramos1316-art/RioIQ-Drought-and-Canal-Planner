"""manifest.py: a fingerprint of every raw input, so a scored result can say what it was scored on.

data/manifest.json holds the sha256 of every file under data/raw (all folders) and of
notebooks/oni.txt, plus the scoring cut-off (config.SCORE_THROUGH). export.evaluate() refuses to
run when any of those files differs from the manifest: a frozen result must come from the exact
inputs it names. The daily refresh never writes data/raw or notebooks/oni.txt: it saves its
downloads in data/live (see refresh.py and config.live_data), so this check keeps passing after
a refresh. export.predict() (this week's forecast) reads data/live and does not check the
manifest. A few files under data/raw are not scored inputs and are left out (NOT_SCORED_INPUTS).

The same idea guards the RESULTS: reports/frozen.sha256 lists the sha256 of every file under
reports/frozen. A scored file is never rewritten, so a listed file whose bytes changed, a listed
file that is gone, or a file that is there but not listed is a problem. A new result is added
with "frozen-add", which only ever appends lines for files not yet listed. The forecast log
under reports/prospective has the same rule and its own list, reports/prospective.sha256.

These local checks compare the working tree with itself, so they guard against ACCIDENTS only:
editing a file and its line together passes them. The barrier against that is the CI step that
compares each list with the base branch (tools/hash_list_gate.py).

Run it with:  PYTHONPATH=src python -m farmdrought.manifest              (check the raw inputs)
              PYTHONPATH=src python -m farmdrought.manifest build        (write a new manifest)
              PYTHONPATH=src python -m farmdrought.manifest frozen       (check the frozen results)
              PYTHONPATH=src python -m farmdrought.manifest frozen-add   (list new result files)
              PYTHONPATH=src python -m farmdrought.manifest prospective       (check the forecast log)
              PYTHONPATH=src python -m farmdrought.manifest prospective-add   (list new forecast files)
"""
import hashlib
import json
import sys
from pathlib import Path

from farmdrought.config import FROZEN, ROOT, SCORE_THROUGH

MANIFEST_PATH = Path("data") / "manifest.json"   # relative to the repo root
# Files that live under data/raw but are NOT inputs to any version 1 score. They were added after
# the freeze for the round-3 physical model. The manifest neither lists nor checks them, so
# adding one does not look like a changed snapshot. Keep this list short and explicit.
NOT_SCORED_INPUTS = ["data/raw/canals/canal_ksat.csv"]


def sha256_of(path):
    """The sha256 of a file's bytes, as 64 hex characters."""
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def input_hashes(root=ROOT):
    """{path relative to root: sha256} for every raw input that exists now.

    Hidden files (a name starting with a dot, like .DS_Store) are not inputs and are skipped,
    and so are the files named in NOT_SCORED_INPUTS.
    """
    root = Path(root)
    files = [p for p in (root / "data" / "raw").rglob("*") if p.is_file() and not p.name.startswith(".")
             and p.relative_to(root).as_posix() not in NOT_SCORED_INPUTS]
    oni = root / "notebooks" / "oni.txt"
    if oni.exists():
        files.append(oni)
    return {p.relative_to(root).as_posix(): sha256_of(p) for p in sorted(files)}


def build_manifest(root=ROOT):
    """Write data/manifest.json under `root` from the files as they are now. Returns its content."""
    manifest = {"score_through": SCORE_THROUGH, "files": input_hashes(root)}
    path = Path(root) / MANIFEST_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def check_manifest(root=ROOT):
    """Compare the files as they are now with data/manifest.json. Returns [] when all agree.

    Otherwise a list with one line per problem: the path, then "(changed)", "(missing)" for a
    file the manifest names that is gone, or "(new)" for a file the manifest does not name. A
    missing manifest, or one made for a different cut-off, is also a problem.
    """
    path = Path(root) / MANIFEST_PATH
    if not path.exists():
        return [f"{MANIFEST_PATH.as_posix()} (missing)"]
    manifest = json.loads(path.read_text())
    recorded, now = manifest["files"], input_hashes(root)
    problems = []
    if manifest.get("score_through") != SCORE_THROUGH:
        problems.append(f"score_through (manifest {manifest.get('score_through')}, config {SCORE_THROUGH})")
    for name in sorted(set(recorded) | set(now)):
        if name not in now:
            problems.append(f"{name} (missing)")
        elif name not in recorded:
            problems.append(f"{name} (new)")
        elif recorded[name] != now[name]:
            problems.append(f"{name} (changed)")
    return problems


def guard_scored_writer(output, force=False, frozen_metrics=None):
    """Called by a script that writes scored numbers by hand (version 2, the robustness checks,
    the pre-2020 forecast) BEFORE it does any work. Raises RuntimeError when:
      - a raw input differs from data/manifest.json (always: scored numbers must come from the
        snapshot the frozen results name), or
      - the results are frozen, the output file exists, and force is False. Rewriting a scored
        file after the freeze has to be asked for by name, with --force.
    """
    problems = check_manifest()
    if problems:
        raise RuntimeError("the raw inputs do not match data/manifest.json, so nothing was run:\n  "
                           + "\n  ".join(problems))
    frozen_metrics = FROZEN / "metrics.json" if frozen_metrics is None else frozen_metrics
    if frozen_metrics.exists() and Path(output).exists() and not force:
        raise RuntimeError(f"{Path(output).name} already exists and the results are frozen, so nothing was run. "
                           "To replace it on purpose, run the same command again with --force")


# Two folders hold files that are written once and never rewritten. Each has a list of hashes
# beside it: (the folder, its list), both relative to the repo root.
FROZEN_LIST = Path("reports") / "frozen.sha256"
PROSPECTIVE_LIST = Path("reports") / "prospective.sha256"
# data/round4 holds the inputs added for rounds 4 and 5 (the NOAA climate cut, the measured
# canal tests). They are not in data/manifest.json, which describes exactly what version 1 was
# scored on, so they get a hash list of their own, checked the same way.
ROUND4_LIST = Path("data") / "round4.sha256"
APPEND_ONLY = {"frozen": (Path("reports") / "frozen", FROZEN_LIST),
               "prospective": (Path("reports") / "prospective", PROSPECTIVE_LIST),
               "round4": (Path("data") / "round4", ROUND4_LIST)}


def check_round4(root=ROOT):
    """The round-4 and round-5 inputs under data/round4 against data/round4.sha256."""
    return check_listed(root, *APPEND_ONLY["round4"])


def listed_files(root, folder):
    """{path relative to root: sha256} for every file under `folder` as it is now."""
    root = Path(root)
    files = [p for p in (root / folder).rglob("*") if p.is_file() and not p.name.startswith(".")]
    return {p.relative_to(root).as_posix(): sha256_of(p) for p in sorted(files)}


def read_list(root, list_path):
    """The recorded {path: sha256}, from lines of "<sha256>  <path>". Empty if there is no list."""
    path = Path(root) / list_path
    if not path.exists():
        return {}
    return {name: digest for digest, name in (line.split(maxsplit=1) for line in path.read_text().splitlines() if line)}


def check_listed(root, folder, list_path):
    """Compare a write-once folder with its list. Returns [] when all agree, else one line per
    problem: "(changed)", "(missing)" or "(not listed)"."""
    recorded, now = read_list(root, list_path), listed_files(root, folder)
    problems = []
    for name in sorted(set(recorded) | set(now)):
        if name not in now:
            problems.append(f"{name} (missing)")
        elif name not in recorded:
            problems.append(f"{name} (not listed)")
        elif recorded[name] != now[name]:
            problems.append(f"{name} (changed)")
    return problems


def add_new_listed(root, folder, list_path):
    """Append to the list the files that are not listed yet. A line that is already there is
    NEVER changed: a file whose bytes changed stays a problem. Returns the names added."""
    recorded, now = read_list(root, list_path), listed_files(root, folder)
    new = [name for name in now if name not in recorded]
    if new:
        with open(Path(root) / list_path, "a") as f:
            f.writelines(f"{now[name]}  {name}\n" for name in new)
    return new


def check_frozen(root=ROOT):
    """The scored results under reports/frozen against reports/frozen.sha256."""
    return check_listed(root, *APPEND_ONLY["frozen"])


def add_new_frozen_files(root=ROOT):
    return add_new_listed(root, *APPEND_ONLY["frozen"])


def check_prospective(root=ROOT):
    """The forecast log under reports/prospective against reports/prospective.sha256."""
    return check_listed(root, *APPEND_ONLY["prospective"])


def add_new_prospective_files(root=ROOT):
    return add_new_listed(root, *APPEND_ONLY["prospective"])


if __name__ == "__main__":
    if sys.argv[1:] in (["frozen"], ["prospective"], ["round4"]):
        folder, list_path = APPEND_ONLY[sys.argv[1]]
        problems = check_listed(ROOT, folder, list_path)
        print("\n".join(problems) if problems else f"every file under {folder} matches {list_path}")
        sys.exit(1 if problems else 0)
    if sys.argv[1:] in (["frozen-add"], ["prospective-add"], ["round4-add"]):
        print("added:", ", ".join(add_new_listed(ROOT, *APPEND_ONLY[sys.argv[1][:-4]])) or "nothing new")
        sys.exit(0)
    if sys.argv[1:] == ["build"]:
        print(f"wrote {MANIFEST_PATH} with {len(build_manifest()['files'])} files")
    else:
        problems = check_manifest()
        print("\n".join(problems) if problems else "every raw input matches data/manifest.json")
        sys.exit(1 if problems else 0)
