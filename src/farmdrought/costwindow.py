"""costwindow.py: how a result changes when a missed drought costs more or less than 3 false alarms.

ADDED for round 7 (reports/decision.md, "Round 7"). Plain arithmetic on counts. It reads no data.

THE IDEA. Every test so far scores cost = 3 x missed + false alarms. The 3 is our assumption.
Write r for "how many false alarms one missed drought season is worth". Then
    cost(r) = r x missed + false alarms
and two policies with different counts swap places at one value of r, the break-even.

A "cost ratio" (config.COST_RATIOS) is the other way to say the same thing:
    ratio = cost of acting / loss avoided if the drought then comes
    r     = 1 / ratio - 1          (ratio 0.25 gives r = 3)
    line  = ratio                  (warn when the chance is at or above the ratio: break-even)
"""

RULE_ORDER = ["D2 now", "D1 now", "always warn", "never warn"]   # ties go to the first named


def cost(missed, false_alarms, r):
    """Cost when one missed drought season is worth r false alarms."""
    return r * missed + false_alarms


def miss_weight(ratio):
    """r for a cost ratio: 1 / ratio - 1."""
    if not 0 < ratio < 1:
        raise ValueError(f"a cost ratio must be between 0 and 1, got {ratio}")
    return 1 / ratio - 1


def warning_line(ratio):
    """The break-even warning line for a cost ratio: the ratio itself, 1 / (1 + r)."""
    return 1 / (1 + miss_weight(ratio))


def break_even(a, b):
    """The r at which policies a and b cost the same. a, b: dicts with "missed" and
    "false_alarms". Returns None when they never cross (same number of misses)."""
    fewer_misses = b["missed"] - a["missed"]
    if fewer_misses == 0:
        return None
    return (a["false_alarms"] - b["false_alarms"]) / fewer_misses


def cheapest(costs, order=RULE_ORDER):
    """The name of the cheapest policy in {name: cost}. Ties go to the earliest name in `order`."""
    return min((name for name in order if name in costs), key=lambda name: (costs[name], order.index(name)))


def window(model, d2_now, d1_now):
    """The range of r in which the model, at one fixed line, is cheaper than both rules.
    Each argument: dict with "missed" and "false_alarms". Returns (low, high); either may be None."""
    return break_even(model, d2_now), break_even(model, d1_now)
