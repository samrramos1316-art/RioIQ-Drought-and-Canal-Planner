"""Tests for build_site.py: the website's data files match the pipeline's outputs."""
import json

import pytest

from app import contract
from app import build_site
from app.build_site import OUT, build
from app.contract import REPO_ROOT


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    """The website's data files, built ONCE into a temporary folder. The tracked files in
    app/site/data are never written by a test."""
    folder = tmp_path_factory.mktemp("site_data")
    build(folder)
    return folder


def _read(folder, name):
    """Load a generated JavaScript data file as a Python dict."""
    text = (folder / name).read_text(encoding="utf-8")
    return json.loads(text[text.index("{"):text.rindex("}") + 1])


def test_a_test_build_leaves_the_tracked_site_data_untouched(tmp_path):
    # Arrange: the tracked files' bytes and modification times
    tracked = sorted(OUT.glob("*.js"))
    before = {path.name: (path.stat().st_mtime_ns, path.read_bytes()) for path in tracked}

    # Act: a full build into a temporary folder
    build(tmp_path)

    # Assert: the build wrote its two files there, and nothing in app/site/data moved
    assert sorted(path.name for path in tmp_path.iterdir()) == ["core.js", "sim.js"]
    assert {"core.js", "sim.js"} <= set(before)
    assert {path.name: (path.stat().st_mtime_ns, path.read_bytes()) for path in tracked} == before
    assert sorted(OUT.glob("*.js")) == tracked


def test_core_matches_the_pipeline(site):
    core = _read(site, "core.js")
    metrics = json.loads((REPO_ROOT / "reports" / "metrics.json").read_text())
    assert len(core["texas"]) == 254                      # every Texas county is on the map
    assert len(core["river"]) == 14                       # the Texas counties on the Rio Grande
    assert len(core["districts"]) == metrics["districts"]["n_districts"]
    # Every canal the pipeline ranked is there, and their costs add up to the pipeline's total.
    ranked = [c for c in core["canals"] if c[8] is not None]
    assert abs(sum(c[9] for c in ranked) - metrics["districts"]["cost_to_treat_everything_usd"]) < 5
    assert core["threshold"] == metrics["trigger"]["threshold"]


def test_history_lines_up_week_by_week(site):
    sim = _read(site, "sim.js")
    n = sim["nWeeks"]
    for fips, classes in sim["cls"].items():
        assert len(classes) == n and len(sim["forecast"][fips]) == n
    for series in sim["reservoirs"].values():
        assert len(series) == n


def test_openstreetmap_adds_detail_without_touching_the_plan(site):
    core = _read(site, "core.js")
    if core["osm"] is None:                               # app/osm_canals.py has not been run
        return
    extra = [c for c in core["canals"] if c[13] == 1]     # canals only OpenStreetMap has
    assert len(extra) == core["osm"]["added"] > 0
    # They have no soil reading, so they are never ranked or priced.
    assert all(c[1] is None and c[5] is None and c[8] is None and c[9] is None for c in extra)
    assert all(len(c) == 14 for c in core["canals"])      # every canal carries kind, piped and source


def test_scan_base_map_and_frozen_model_are_packed(site):
    core, sim = _read(site, "core.js"), _read(site, "sim.js")
    assert core["base"]["nCounties"] > 3000 and len(core["base"]["states"]) > 40
    assert {lake["name"] for lake in core["lakes"]} == {"Amistad", "Falcon", "Elephant Butte"}
    assert sim["week0"].startswith("2000")                # the history now starts with the drought record
    frozen = sim["pre2020"]
    if frozen is not None:                                # app/forecast_pre2020.py has been run
        assert frozen["trainedOn"]["to"] < "2020-01-01"   # nothing after the cut-off was learned from
        assert set(frozen["live"]) == {c["fips"] for c in core["river"]}


def test_forecast_effect_is_packed_one_row_per_district(site):
    core = _read(site, "core.js")
    metrics = json.loads((REPO_ROOT / "reports" / "metrics.json").read_text())
    pipeline = metrics["districts"]["forecast_effect"]
    packed = core["forecastEffect"]

    # the overall row is the pipeline's, in the order [both, only with, only without, correlation, ranked]
    o = pipeline["overall"]
    assert packed["overall"] == [o["both_km"], o["only_forecast_km"], o["only_no_forecast_km"], o["rank_correlation"], o["ranked_km"]]
    assert packed["budgetUsd"] == metrics["districts"]["budget_usd"]
    # one row per district, in the order of core["districts"]
    assert len(packed["districts"]) == len(core["districts"])
    by_name = {r["district"]: r for r in pipeline["districts"]}
    for district, row in zip(core["districts"], packed["districts"]):
        assert row is None or row[0] == by_name[district["name"]]["both_km"]
    # both plans spend the same budget on canals that cost the same per km, so they fund the same length
    assert abs((o["both_km"] + o["only_forecast_km"]) - metrics["districts"]["sealed_km"]) < 0.2
    # the long lists stay out of core["plan"], which keeps only the rule, the assumptions and the totals
    assert "forecast_effect" not in core["plan"] and "districts" not in core["plan"]


def test_frozen_results_are_packed_as_a_short_summary(site):
    core = _read(site, "core.js")
    frozen = core["frozen"]
    folder = REPO_ROOT / "reports" / "frozen" / "round3"

    # every comparison is one short list of plain values: [name, diff, lo, hi, lo2, hi2, years, lower is better]
    rows = [row for group in frozen["groups"] for row in group["rows"]]
    assert len(rows) >= 20
    assert all(len(row) == 8 and not any(isinstance(v, (list, dict)) for v in row) for row in rows)
    # a row is the file's own numbers (to 4 significant figures), for example the 6-month outlook against "D1 now"
    intervals = json.loads((folder / "intervals_v1.json").read_text())
    source = next(c for c in intervals["season"] if c["name"] == "6-month system cost minus D1 now")
    packed = next(row for row in rows if row[0] == source["name"])
    assert packed[1:4] == [source["block1"]["diff"], source["block1"]["lo"], source["block1"]["hi"]]
    assert packed[6] == source["block1"]["n_years"] and packed[7] is True
    # the allocation table: five budgets and the average, with the model minus each rule
    allocation = json.loads((folder / "allocation.json").read_text())
    assert [r["k"] for r in frozen["allocation"]["perK"]] == allocation["ks"]
    average = frozen["allocation"]["average"]
    assert average["model"] == round(allocation["average_over_k"]["mean"]["model"], 3)
    assert average["vsB"]["lo"] > 0 and average["vsA"]["lo"] < 0 < average["vsA"]["hi"]
    # the held-out seepage test, with the sentence as corrected by the second erratum
    seepage = json.loads((folder / "seepage_calibration.json").read_text())
    assert frozen["seepage"]["passes"] is seepage["passes"] is False
    assert frozen["seepage"]["n"] == seepage["held_out"]["n_districts"]
    assert "does not support the ranking either" in frozen["seepage"]["sentence"]
    assert {e["file"] for e in frozen["errata"]} == {p.name for p in folder.glob("*errata*.json")}
    # it is a summary: small, and with no per-year numbers
    text = json.dumps(frozen, separators=(",", ":"))
    assert len(text) < 15_000 and "per_year" not in text


def test_a_results_file_with_its_own_site_summary_is_included(tmp_path):
    # Arrange: a made-up later-round file that carries the rows it wants shown
    from app.build_site import frozen_summary
    (tmp_path / "holdout_rivers.json").write_text(json.dumps({
        "what": "A made-up holdout.",
        "site_summary": [{"name": "Holdout rivers: system cost minus D1 now", "value": -12.0, "lo": -40.0, "hi": 9.0,
                          "n_years": 7, "verdict": "not separated"}],
        # a comparison elsewhere in the same file is NOT picked up as well: the file chose what to show
        "detail": [{"name": "one river", "block1": {"diff": 1.0, "lo": 0.5, "hi": 2.0, "n_years": 7}}]}))

    # Act
    summary = frozen_summary(tmp_path)

    # Assert: the row is passed on as it is; the files that are not there are simply left out
    assert summary["extra"] == [{"file": "holdout_rivers", "what": "A made-up holdout.", "rows": [
        {"name": "Holdout rivers: system cost minus D1 now", "diff": -12.0, "lo": -40.0, "hi": 9.0, "n": 7,
         "stated": "not separated", "lower": None}]}]
    assert summary["groups"] == [] and summary["allocation"] is None and summary["seepage"] is None
    assert frozen_summary(tmp_path / "no-such-folder") is None


def test_reconciliation_is_plain_division_of_packed_and_published_figures(site):
    core = _read(site, "core.js")
    recon = core["reconcile"]
    costs = json.loads((REPO_ROOT / "app" / "reference" / "costs.json").read_text())

    # the programme benchmark: capital cost / (acre-feet a year x life), life 25 to 50 years
    programme = costs["valley_program"]
    assert recon["benchmark"]["lifeYears"] == [25, 50]
    assert recon["benchmark"]["programmeUsdPerAf"] == [round(programme["usd"] / (programme["af_per_year"] * 50), 1),
                                                       round(programme["usd"] / (programme["af_per_year"] * 25), 1)]
    assert recon["benchmark"]["programmeUsdPerAf"] == [74.5, 149.1]
    # the sealant: every ranked canal's cost / the water one application is modelled to keep, low to high
    a = core["plan"]["assumptions"]
    ranked = [c for c in core["canals"] if c[8] is not None]
    gallons_a_day = sum(c[5] * c[4] * 3280.84 * a["wetted_width_ft"] for c in ranked)
    kept_high = gallons_a_day * a["days_one_application_lasts"] * a["sealant_cut_high"] / costs["gallons_per_af"]
    low, high = recon["benchmark"]["sealantUsdPerAf"]
    assert abs(low - sum(c[9] for c in ranked) / kept_high) < 0.01 and low < high
    # each district row: a share band that rises with the days, and the district's own 1998 loss
    assert recon["bandsPct"] == [[10, 40], [40, 60]] and recon["days"][0] < recon["days"][1]
    assert len(recon["districts"]) == 14                  # the districts the frozen calibration could match
    for row in recon["districts"]:
        assert 0 < row["seepShare"][0] < row["seepShare"][1]
        assert 0 < row["lossShare"] < 1
        assert core["districts"][row["district"]]["name"]  # points at a district on the map
    san_benito = next(r for r in recon["districts"] if r["name"] == "CCID#2 (San Benito)")
    assert san_benito["lossShare"] == 0.6                 # 40% efficiency in the 1998 table


def test_the_build_refuses_inputs_that_break_the_contract(tmp_path, monkeypatch):
    # Arrange: a copy of the real metrics file with one required key removed
    broken = json.loads(contract.REAL_METRICS.read_text())
    del broken["headline"]
    bad_metrics = tmp_path / "metrics.json"
    bad_metrics.write_text(json.dumps(broken))
    monkeypatch.setattr(contract, "REAL_METRICS", bad_metrics)
    out = tmp_path / "site_data"

    # Act / Assert: the build stops with the problem in plain words, and writes nothing
    with pytest.raises(SystemExit) as stopped:
        build(out)
    message = str(stopped.value)
    assert "NOT built" in message and "missing key 'headline'" in message
    assert not out.exists()


def test_the_build_refuses_when_a_handoff_file_is_missing(tmp_path, monkeypatch):
    # Arrange: point the contract at an empty folder
    monkeypatch.setattr(contract, "REAL_DIR", tmp_path)
    out = tmp_path / "site_data"

    # Act / Assert
    with pytest.raises(SystemExit, match="missing real file"):
        build(out)
    assert not out.exists()


def test_deployment_files_route_the_live_reading_and_keep_the_site_deployable():
    # Arrange
    config = json.loads((REPO_ROOT / "vercel.json").read_text())
    ignored = [line.strip() for line in (REPO_ROOT / ".vercelignore").read_text().splitlines()
               if line.strip() and not line.startswith("#")]

    # Assert: the page's relative "api/live" is sent to the root function, which reuses the one handler
    assert {"source": "/app/site/api/live", "destination": "/api/live"} in config["rewrites"]
    assert {"source": "/", "destination": "/app/site/", "permanent": False} in config["redirects"]
    assert 'require("../app/site/api/live.js")' in (REPO_ROOT / "api" / "live.js").read_text()
    assert (REPO_ROOT / "app" / "site" / "api" / "live.js").exists()
    # nothing the site or the function reads is kept out of the deployment
    assert all(line.startswith("/") for line in ignored)                  # root folders only
    assert not {"/app", "/api", "/vercel.json"} & set(ignored)
    assert not any(line.startswith("/app") or line.startswith("/api") for line in ignored)


def tracked_site_sizes(gate):
    """The size gate's own listing of tracked files, or a skip when this is not a git checkout
    (for example a clean export of the files): the gate lists files with `git ls-files`."""
    import subprocess
    try:
        return gate.tracked_sizes()
    except (subprocess.CalledProcessError, FileNotFoundError) as error:
        pytest.skip(f"not a git checkout, so the tracked files cannot be listed ({type(error).__name__})")


def test_site_size_gate_passes_on_the_tracked_files_today():
    # Arrange / Act
    gate = load_tool("site_size")
    today = tracked_site_sizes(gate)

    # Assert
    assert "app/site/data/core.js" in today and gate.problems(today) == []


def test_site_size_gate_names_a_file_that_grew():
    # Arrange: made-up sizes, so this runs with or without git
    gate = load_tool("site_size")
    sizes = {"app/site/data/core.js": int(3.3 * gate.MB), "app/site/photos/new.jpg": int(1.2 * gate.MB),
             "app/site/data/sim.js": int(0.25 * gate.MB)}

    # Act
    found = gate.problems(sizes)

    # Assert: a core.js of 3.3 MB and a 1.2 MB photo are over their limits; sim.js is not
    assert len(found) == 2 and "core.js is 3.30 MB, over its limit of 3.2 MB" in found[0]
    assert "new.jpg is 1.20 MB, over its limit of 1.0 MB" in found[1]
    assert gate.problems({"app/site/data/core.js": int(2.9 * gate.MB)}) == []
    assert any("in all" in line for line in gate.problems({f"app/site/{i}": 0.9 * gate.MB for i in range(60)}))


def load_tool(name):
    """Load a script from tools/ as a module (tools is not a package)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(name, REPO_ROOT / "tools" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_hash_list_gate_catches_a_changed_or_removed_line_against_the_base_branch(tmp_path):
    # Arrange: a temporary git repository whose main branch holds a list of two hashes
    import shutil
    import subprocess
    if shutil.which("git") is None:
        pytest.skip("git is not installed, so a temporary repository cannot be made")
    gate = load_tool("hash_list_gate")

    def git(*args):
        subprocess.run(["git", "-c", "user.name=Test", "-c", "user.email=test@example.com", *args],
                       cwd=tmp_path, check=True, capture_output=True)

    listed = tmp_path / "reports" / "frozen.sha256"
    listed.parent.mkdir()
    listed.write_text("aaa  reports/frozen/one.json\nbbb  reports/frozen/two.json\n")
    git("init", "-q", "-b", "main")
    git("add", ".")
    git("commit", "-q", "-m", "base")
    git("checkout", "-q", "-b", "work")
    name = "reports/frozen.sha256"

    # Act / Assert: a new line is allowed
    listed.write_text(listed.read_text() + "ccc  reports/frozen/three.json\n")
    found, notes = gate.check("main", [name], cwd=str(tmp_path))
    assert found == [] and "all 2 lines from the base are unchanged; 1 new line(s)" in notes[0]
    # editing a scored file's hash line (the way to slip a changed result past the local check) is caught
    listed.write_text("aaa  reports/frozen/one.json\nZZZ  reports/frozen/two.json\nccc  reports/frozen/three.json\n")
    assert gate.check("main", [name], cwd=str(tmp_path))[0] == [
        "reports/frozen.sha256: the recorded hash of reports/frozen/two.json was changed"]
    # so is dropping a line, and so is deleting the list and building it again without that file
    listed.write_text("aaa  reports/frozen/one.json\n")
    assert gate.check("main", [name], cwd=str(tmp_path))[0] == [
        "reports/frozen.sha256: the line for reports/frozen/two.json was removed"]
    listed.unlink()
    assert gate.check("main", [name], cwd=str(tmp_path))[0] == [
        "reports/frozen.sha256 was deleted; it existed on the base branch"]
    # a list that the base does not have, and a base that does not exist, pass and say why
    (tmp_path / "reports" / "prospective.sha256").write_text("ddd  reports/prospective/2027-01-05.json\n")
    found, notes = gate.check("main", ["reports/prospective.sha256"], cwd=str(tmp_path))
    assert found == [] and "does not exist on the base" in notes[0]
    for missing in ("", "0000000000000000000000000000000000000000", "origin/no-such-branch"):
        found, notes = gate.check(missing, [name], cwd=str(tmp_path))
        assert found == [] and "nothing was checked" in notes[0]


def test_three_month_outlook_is_packed_from_the_live_and_frozen_files(tmp_path):
    (tmp_path / "live").mkdir()
    (tmp_path / "frozen" / "round3").mkdir(parents=True)
    (tmp_path / "live" / "edge.json").write_text(json.dumps(
        {"issued": "2026-11-03", "weeks_ahead": 13, "counties": {"48061": 0.2264, "48127": 0.2499}}))
    policy = lambda right, missed: {"share_right": right, "missed": missed, "false_alarms": 7, "cost": 3 * missed + 7}
    group = {"policies": {"model E": policy(0.9, 10), "D2 now": policy(0.91, 14)}, "rows": 100, "counties": 5,
             "auc": {"model E": 0.95}}
    (tmp_path / "frozen" / "round3" / "edge.json").write_text(json.dumps(
        {"blind": group, "rio_grande_not_blind": group, "cost_change_against_d2_now": -0.055,
         "primary": {"block1": {"diff": -12.0, "lo": -20.0, "hi": -4.0, "n_years": 18}}}))
    packed = build_site.quarter_outlook(tmp_path)
    assert packed["chance"] == {"48061": 0.226, "48127": 0.249}       # 0.2499 is not rounded up onto the warning line
    assert packed["weeksAhead"] == 13 and packed["test"]["forecasts"] == 100
    assert packed["test"]["missed"] == 10 and packed["test"]["missedRule"] == 14
    assert packed["test"]["costGap"] == -12 and packed["test"]["costGapHigh"] == -4


def test_three_month_outlook_is_left_out_when_a_file_is_missing(tmp_path):
    assert build_site.quarter_outlook(tmp_path) is None


def test_rounding_a_chance_never_moves_it_across_the_warning_line():
    assert build_site.chance(0.249626, 3) == 0.249      # plain rounding would give 0.25: a false warning
    assert build_site.chance(0.2474, 2) == 0.24
    assert build_site.chance(0.25, 3) == 0.25           # on the line stays on the line
    assert build_site.chance(0.2504, 3) == 0.25
    assert build_site.chance(0.613, 2) == 0.61 and build_site.chance(0.1, 3) == 0.1


def test_an_overtaken_limit_sentence_is_replaced_and_the_rest_are_left_alone():
    old = "Weather inputs (rain, temperature, soil moisture) were not tested."
    out = build_site.corrected_limits(["Nothing here measures crop yields.", old])
    assert out[0] == "Nothing here measures crop yields."
    assert "round 4" in out[1] and "were not tested" not in out[1]
