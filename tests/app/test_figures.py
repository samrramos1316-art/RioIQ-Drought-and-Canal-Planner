"""The README's graphs are drawn from the scored result files (tools/make_figures.py), not typed in."""
import importlib.util
import json
import xml.etree.ElementTree as ET

from app.contract import REPO_ROOT

SVG = "{http://www.w3.org/2000/svg}"


def load_script():
    spec = importlib.util.spec_from_file_location("make_figures", REPO_ROOT / "tools" / "make_figures.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_figures_are_valid_svg_and_carry_the_numbers_in_the_result_files(tmp_path):
    script = load_script()
    paths = script.main(tmp_path)
    assert [p.name for p in paths] == ["1_cost_difference.svg", "2_years_ahead.svg", "3_misses_and_false_alarms.svg"]
    texts = {}
    for path in paths:
        tree = ET.parse(path)                                                   # raises if the file is not well-formed XML
        texts[path.name] = " ".join("".join(t.itertext()) for t in tree.iter(SVG + "text"))
        assert tree.getroot().find(SVG + "title") is not None                   # an accessible title
    edge = json.loads((REPO_ROOT / "reports" / "frozen" / "round3" / "edge.json").read_text(encoding="utf-8"))
    policies = edge["blind"]["policies"]
    for number in (policies["model E"]["missed"], policies["D2 now"]["missed"], policies["model E"]["false_alarms"], policies["D2 now"]["false_alarms"]):
        assert f"{number:,}" in texts["3_misses_and_false_alarms.svg"]
    primary = edge["primary"]
    assert f"{primary['block1']['diff']:+,.0f}" in texts["2_years_ahead.svg"]
    assert f"{primary['block1']['diff'] / primary['D2 now_total'] * 100:+.1f}%" in texts["1_cost_difference.svg"]


def test_the_verdict_colours_follow_the_interval_alone():
    script = load_script()
    assert script.verdict(-5, -1) == "win" and script.verdict(1, 5) == "loss" and script.verdict(-1, 1) == "tie"
    assert script.verdict(-5, 0) == "tie"                                       # an interval that touches zero is not a win


def test_the_committed_figures_match_what_the_script_draws(tmp_path):
    # If a result file changes and the graphs are not redrawn, the README would show old numbers.
    script = load_script()
    for path in script.main(tmp_path):
        assert (REPO_ROOT / "docs" / "figures" / path.name).read_text(encoding="utf-8") == path.read_text(encoding="utf-8"), path.name
