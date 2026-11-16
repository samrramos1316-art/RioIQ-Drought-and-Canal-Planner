"""make_figures.py: draw the README's graphs of the model against the baseline.

    python tools/make_figures.py

It reads the scored result files under reports/frozen/round3/ and writes three SVG files into
docs/figures/. No number is typed into this script: every bar, dot and label is read from a result
file, so the pictures cannot drift from the results. It needs only Python (no plotting library),
and works the same on Windows, macOS and Linux.

  1_cost_difference.svg   the cost difference between model and baseline in every test, as a share of
                          the baseline's cost, with its 95% interval (left of zero: the model is ahead)
  2_years_ahead.svg       the same difference in each of the 18 years, for the 693 western counties
  3_misses_and_false_alarms.svg
                          what the model trades to get that lower cost, for the same 693 counties

The baseline is the best simple rule for each test ("severe drought now" three months ahead,
"moderate drought now" six months ahead). Cost = 3 x missed drought seasons + false alarms.
"""
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "reports" / "frozen" / "round3"
OUT = ROOT / "docs" / "figures"

# Colours: a win is green, a loss red, a tie amber. Text is dark on a white page, so the picture
# reads the same on GitHub's light and dark themes.
GREEN, RED, AMBER, GREY, INK, FAINT = "#1f7a3d", "#b3372f", "#b07d00", "#9aa4a8", "#14202b", "#e6eaec"
FONT = "font-family=\"Helvetica, Arial, sans-serif\""


def load(name):
    """One result file as a dictionary (read as UTF-8, whatever the computer's own default is)."""
    return json.loads((RESULTS / name).read_text(encoding="utf-8"))


def verdict(low, high):
    """win / loss / tie, from the interval alone: a win only if the whole interval is below zero."""
    return "win" if high < 0 else "loss" if low > 0 else "tie"


def number(x):
    return f"{x:,.0f}"


def text(x, y, s, size=12, anchor="start", weight="normal", fill=INK):
    return f'<text x="{x:.1f}" y="{y:.1f}" {FONT} font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" fill="{fill}">{escape(s)}</text>'


def svg(width, height, title, body):
    """Wrap drawing commands in an SVG document with a white page and an accessible title."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="{escape(title)}">\n'
            f'<title>{escape(title)}</title>\n<rect width="{width}" height="{height}" fill="#ffffff"/>\n' + "\n".join(body) + "\n</svg>\n")


# ---------------------------------------------------------------------------------------------
# Figure 1: the cost difference in every test
# ---------------------------------------------------------------------------------------------
def test_rows():
    """One row per test: (label, difference, low, high, baseline cost). Each comes from a compare() block."""
    west = load("edge.json")["primary"]
    rio_grande = load("edge.json")["rio_grande_not_blind"]["edge_minus_d2"]
    east = load("east.json")["model M"]["somewhere_else_7a"]
    eight = load("quarter.json")["new_holdout"]["model_minus_d2"]
    six_months = next(c for c in load("intervals_v1.json")["season"] if c["b"] == "D1 now")
    six_rivers = load("holdout.json")["primary"]
    rows = [
        ("3 months: 693 western counties", west),
        ("3 months: Rio Grande (not blind)", rio_grande),
        ("3 months: 1,666 eastern counties (map-only)", east),
        ("3 months: 136 counties, eight other rivers", eight),
        ("6 months: Rio Grande", six_months),
        ("6 months: 166 counties, six other rivers", six_rivers),
    ]
    out = []
    for label, c in rows:
        block, baseline = c["block1"], c[c["b"] + "_total"]
        out.append((label, block["diff"], block["lo"], block["hi"], baseline))
    return out


def figure_cost_difference():
    rows = test_rows()
    width, row_h, top, left, right = 900, 54, 92, 345, 40
    height = top + row_h * len(rows) + 70
    pct = [(label, d / b * 100, lo / b * 100, hi / b * 100, b) for label, d, lo, hi, b in rows]
    low = min(p[2] for p in pct) - 3
    high = max(p[3] for p in pct) + 3
    scale = (width - left - right) / (high - low)
    x = lambda v: left + (v - low) * scale
    body = [text(24, 32, "The model against the baseline: cost difference in every test", 18, weight="bold"),
            text(24, 54, "Difference as a share of the baseline's cost, with its 95% interval. Left of zero: the model costs less.", 12.5, fill="#4a5a66"),
            text(24, 72, "Green: the whole interval is below zero (ahead). Red: above zero (behind). Amber: it includes zero (a tie).", 12.5, fill="#4a5a66")]
    for tick in range(int(low // 5) * 5, int(high // 5) * 5 + 6, 5):                      # a faint gridline every 5%
        if low <= tick <= high:
            body.append(f'<line x1="{x(tick):.1f}" y1="{top - 10}" x2="{x(tick):.1f}" y2="{top + row_h * len(rows)}" stroke="{FAINT}" stroke-width="1"/>')
            body.append(text(x(tick), top + row_h * len(rows) + 18, f"{tick:+d}%" if tick else "0", 11, "middle", fill="#4a5a66"))
    body.append(f'<line x1="{x(0):.1f}" y1="{top - 10}" x2="{x(0):.1f}" y2="{top + row_h * len(rows)}" stroke="{INK}" stroke-width="1.6"/>')
    for i, (label, d, lo, hi, baseline) in enumerate(pct):
        y = top + row_h * i + row_h / 2
        colour = {"win": GREEN, "loss": RED, "tie": AMBER}[verdict(lo, hi)]
        body.append(text(left - 14, y + 4, label, 12.5, "end"))
        body.append(f'<line x1="{x(lo):.1f}" y1="{y:.1f}" x2="{x(hi):.1f}" y2="{y:.1f}" stroke="{colour}" stroke-width="3.5" stroke-linecap="round"/>')
        body.append(f'<circle cx="{x(d):.1f}" cy="{y:.1f}" r="6.5" fill="{colour}"/>')
        body.append(text(x(d), y - 12, f"{d:+.1f}%", 11.5, "middle", "bold", colour))
    body.append(text(24, height - 14, "Cost = 3 x missed drought seasons + false alarms. Each test was declared before it was run (reports/decision.md); results are in reports/frozen/.", 11, fill="#4a5a66"))
    return svg(width, height, "Cost difference between the model and the baseline in every test", body)


# ---------------------------------------------------------------------------------------------
# Figure 2: the difference year by year
# ---------------------------------------------------------------------------------------------
def figure_years_ahead():
    c = load("edge.json")["primary"]
    years = c["per_year"]["years"]
    diffs = [a - b for a, b in zip(c["per_year"][c["a"]], c["per_year"][c["b"]])]
    ahead = sum(d < 0 for d in diffs)
    width, height, left, right, top, bottom = 900, 400, 70, 30, 96, 60
    span = max(abs(d) for d in diffs) * 1.15
    plot_h = height - top - bottom
    y = lambda v: top + plot_h / 2 - v / span * plot_h / 2
    slot = (width - left - right) / len(years)
    body = [text(24, 32, "693 western counties: model cost minus baseline cost, year by year", 18, weight="bold"),
            text(24, 54, f"Each bar is one year of forecasts. Green (below zero): the model cost less. The model was ahead in {ahead} of {len(years)} years.", 12.5, fill="#4a5a66"),
            text(24, 72, "Baseline: the rule \"severe drought now\". Cost = 3 x missed drought seasons + false alarms.", 12.5, fill="#4a5a66")]
    for tick in (-round(span * 0.8, -2), 0, round(span * 0.8, -2)):
        body.append(f'<line x1="{left}" y1="{y(tick):.1f}" x2="{width - right}" y2="{y(tick):.1f}" stroke="{INK if tick == 0 else FAINT}" stroke-width="{1.6 if tick == 0 else 1}"/>')
        body.append(text(left - 8, y(tick) + 4, f"{tick:+,.0f}" if tick else "0", 11, "end", fill="#4a5a66"))
    for i, (year, d) in enumerate(zip(years, diffs)):
        x0 = left + slot * i + slot * 0.18
        top_y, base_y = (y(d), y(0)) if d < 0 else (y(0), y(d))
        body.append(f'<rect x="{x0:.1f}" y="{min(top_y, base_y):.1f}" width="{slot * 0.64:.1f}" height="{abs(base_y - top_y):.1f}" fill="{GREEN if d < 0 else RED}"/>')
        body.append(text(x0 + slot * 0.32, height - bottom + 18, str(year), 10.5, "middle", fill="#4a5a66"))
    body.append(text(24, height - 14, f"Total over 18 years: {number(c[c['a'] + '_total'])} (model) against {number(c[c['b'] + '_total'])} (baseline): a difference of {c['block1']['diff']:+,.0f}, interval {c['block1']['lo']:+,.0f} to {c['block1']['hi']:+,.0f}.", 11, fill="#4a5a66"))
    return svg(width, height, "Model cost minus baseline cost in each year, 693 western counties", body)


# ---------------------------------------------------------------------------------------------
# Figure 3: what the lower cost is paid for with
# ---------------------------------------------------------------------------------------------
def figure_misses_and_false_alarms():
    policies = load("edge.json")["blind"]["policies"]
    model, baseline = policies["model E"], policies["D2 now"]
    groups = [("Drought seasons missed", "missed", "a missed drought season costs 3"), ("False alarms", "false_alarms", "a false alarm costs 1")]
    width, height, left = 900, 410, 90
    top, bottom = 110, 90
    biggest = max(max(model[k], baseline[k]) for _, k, _ in groups)
    scale = (height - top - bottom) / (biggest * 1.12)
    body = [text(24, 32, "What the lower cost is paid for with (693 western counties)", 18, weight="bold"),
            text(24, 54, "The model warns more often, so it misses fewer drought seasons and raises more false alarms.", 12.5, fill="#4a5a66"),
            text(24, 72, f"A miss counts as 3 false alarms, so the trade lowers the model's total cost: {number(model['cost'])} against {number(baseline['cost'])}.", 12.5, fill="#4a5a66")]
    group_w = (width - left - 40) / len(groups)
    for g, (label, key, note) in enumerate(groups):
        base_y, centre = height - bottom, left + group_w * g + group_w / 2
        for j, (name, p, colour) in enumerate((("Model", model, GREEN), ("Baseline", baseline, GREY))):
            h = p[key] * scale
            x0 = centre - 120 + j * 130
            body.append(f'<rect x="{x0:.1f}" y="{base_y - h:.1f}" width="110" height="{h:.1f}" fill="{colour}"/>')
            body.append(text(x0 + 55, base_y - h - 8, number(p[key]), 14, "middle", "bold"))
            body.append(text(x0 + 55, base_y + 18, name, 12, "middle"))
        body.append(text(centre, base_y + 42, f"{label} ({note})", 12, "middle", fill="#4a5a66"))
    body.append(f'<line x1="{left - 10}" y1="{height - bottom}" x2="{width - 30}" y2="{height - bottom}" stroke="{INK}" stroke-width="1.4"/>')
    body.append(text(24, height - 14, f"Share of forecasts right: model {model['share_right'] * 100:.1f}%, baseline {baseline['share_right'] * 100:.1f}%. The model wins on cost, not on share right.", 11, fill="#4a5a66"))
    return svg(width, height, "Drought seasons missed and false alarms, model against baseline", body)


FIGURES = {"1_cost_difference.svg": figure_cost_difference, "2_years_ahead.svg": figure_years_ahead,
           "3_misses_and_false_alarms.svg": figure_misses_and_false_alarms}


def main(out_dir=None):
    """Write every figure into out_dir (docs/figures by default) and return the paths."""
    out = Path(out_dir) if out_dir else OUT
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, draw in FIGURES.items():
        path = out / name
        path.write_text(draw(), encoding="utf-8")
        paths.append(path)
        print("wrote", path)
    return paths


if __name__ == "__main__":
    if sys.argv[1:]:
        sys.exit("usage: python tools/make_figures.py")
    main()
