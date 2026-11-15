"""Tests for round 4: the climate inputs (climate.py) and the six-river holdout (holdout.py).

The tables are small and made up, except the last test, which only reads county codes."""
import pandas as pd

from farmdrought import climate, holdout
from farmdrought.config import RIVERS


def test_noaa_state_codes_match_the_three_checked_in_weather_py():
    # weather.py lists these three by hand: Colorado 05, New Mexico 29, Texas 41.
    assert climate.NOAA_TO_FIPS["05"] == "08"
    assert climate.NOAA_TO_FIPS["29"] == "35"
    assert climate.NOAA_TO_FIPS["41"] == "48"
    assert len(climate.NOAA_TO_FIPS) == 48


def write_climate(tmp_path, monkeypatch, months):
    """Save a made-up one-county climate record and point climate.py at it."""
    rows = [("48001", p.year, p.month, 1.0, 60.0, float(i), float(i)) for i, p in enumerate(months)]
    data = pd.DataFrame(rows, columns=["fips", "year", "month", "rain_in", "temp_f", "pdsi", "zndx"])
    normals = pd.DataFrame({"fips": "48001", "month": range(1, 13), "rain_normal": 2.0, "temp_normal": 58.0})
    monkeypatch.setattr(climate, "CLIMATE_CSV", tmp_path / "c.csv")
    monkeypatch.setattr(climate, "NORMALS_CSV", tmp_path / "n.csv")
    monkeypatch.setattr(climate, "MORE_CLIMATE_CSV", tmp_path / "none.csv")       # no second pair in these tests
    monkeypatch.setattr(climate, "MORE_NORMALS_CSV", tmp_path / "none2.csv")
    data.to_csv(tmp_path / "c.csv", index=False)
    normals.to_csv(tmp_path / "n.csv", index=False)


def test_climate_inputs_use_only_months_up_to_two_before_the_forecast(tmp_path, monkeypatch):
    months = pd.period_range("2000-01", "2002-12", freq="M")
    write_climate(tmp_path, monkeypatch, months)
    table = pd.DataFrame({"fips": ["48001"], "date": [pd.Timestamp("2002-06-04")]})
    out = climate.add_climate_features(table).iloc[0]
    # The forecast is made in June 2002, so the newest month it may see is April 2002 (number 27).
    assert out["pdsi"] == 27.0
    assert out["z1"] == 27.0
    assert out["pdsi_min12"] == 16.0              # the lowest of months 16 to 27
    assert out["rain3"] == 0.5                    # 1 inch a month against a normal of 2
    assert out["heat3"] == 2.0                    # 60 degrees against a normal of 58
    assert out["norm_rain"] == 24.0               # twelve monthly normals of 2 inches


def test_a_county_without_climate_data_gets_nan_and_the_holdout_run_refuses_it(tmp_path, monkeypatch):
    write_climate(tmp_path, monkeypatch, pd.period_range("2000-01", "2002-12", freq="M"))
    table = pd.DataFrame({"fips": ["99999"], "date": [pd.Timestamp("2002-06-04")]})
    assert climate.add_climate_features(table)[climate.FEATURES_P].isna().all().all()


def test_the_general_model_never_trains_on_a_holdout_row(monkeypatch):
    seen = []

    def fake_chain(table, label, horizon, features, make_model, train_on, predict_on):
        seen.append(train_on.copy())
        return pd.Series(0.5, index=table.index)

    monkeypatch.setattr(holdout, "chain", fake_chain)
    monkeypatch.setattr(holdout, "add_climate_features", lambda t: t.assign(**{c: 0.0 for c in holdout.FEATURES_G}))
    dev = pd.DataFrame({"fips": ["a", "b"], "river": ["Rio Grande", "Ohio"]})
    hold = pd.DataFrame({"fips": ["c"], "river": ["Pecos"]})
    table = holdout.forecasts(dev, hold)
    general_rows, v1_rows = seen
    assert not general_rows[table["holdout"]].any()       # no holdout row in the general model's training
    assert general_rows[~table["holdout"]].all()          # every development row is
    assert list(table.loc[v1_rows, "river"]) == ["Rio Grande"]


def test_holdout_rivers_are_not_development_rivers_and_inputs_are_47():
    assert not set(holdout.HOLDOUT_RIVERS) & set(RIVERS)
    assert len(holdout.FEATURES_G) == 47 and len(set(holdout.FEATURES_G)) == 47


# ---------------------------------------------------------------------------------------------
# The measured canal tests (ponding.py)
# ---------------------------------------------------------------------------------------------
from farmdrought import ponding


def test_textures_are_matched_by_name_and_two_textures_are_averaged():
    rates = {"clay": 1.0, "clay loam": 3.0, "sandy clay loam": 5.0}
    assert ponding.textures_in("Clay, clay loam") == ["clay", "clay loam"]
    assert ponding.textures_in("silty clay loam (from a summary table)") == ["silty clay loam"]
    assert ponding.model_rate("fine sandy clay loam", rates) == 5.0      # read as sandy clay loam
    assert ponding.model_rate("clay, clay loam", rates) == 2.0           # the two rates averaged
    assert ponding.model_rate("clay, silty clay", rates) == 1.0          # only the one that has a rate
    assert pd.isna(ponding.model_rate("silty clay", rates))              # no rate: the test is not used


def test_rank_agreement_passes_on_a_perfect_order_and_not_on_a_reversed_one():
    model = [1, 2, 3, 4, 5, 6, 7, 8]
    assert ponding.rank_agreement(model, [2, 3, 5, 8, 9, 12, 20, 30])["passes"]
    reversed_order = ponding.rank_agreement(model, [30, 20, 12, 9, 8, 5, 3, 2])
    assert reversed_order["spearman"] == -1.0 and not reversed_order["passes"]


# ---------------------------------------------------------------------------------------------
# Round 5: the three-month outlook (quarter.py)
# ---------------------------------------------------------------------------------------------
import numpy as np

from farmdrought import quarter
from farmdrought.drought import label_season


def test_quarter_answer_looks_only_at_the_next_13_weeks():
    # One county, 40 weeks. Severe drought (class 3) in weeks 20 to 27 only: 8 weeks in a row.
    classes = np.zeros((1, 40))
    classes[0, 20:28] = 3
    answer = label_season(classes, horizon=quarter.QUARTER_WEEKS)[0]
    assert answer[19] == 1            # weeks 20..32 hold the whole run
    assert answer[14] == 1            # weeks 15..27 just reach its last week
    assert answer[13] == 0            # weeks 14..26 hold only 7 of the 8 weeks
    assert answer[20] == 0            # the window starts at week 21, so week 20 is not counted: 7 left
    assert np.isnan(answer[27])       # its 13 weeks are not over inside these 40 weeks


def test_quarter_rivers_were_never_used_before():
    from farmdrought.config import RIVERS
    assert not set(quarter.QUARTER_RIVERS) & (set(RIVERS) | set(holdout.HOLDOUT_RIVERS))


def test_quarter_model_never_trains_on_a_holdout_row(monkeypatch):
    seen = []

    def fake_chain(table, label, horizon, features, make_model, train_on, predict_on):
        seen.append((label, horizon, train_on.copy()))
        return pd.Series(0.5, index=table.index)

    monkeypatch.setattr(quarter, "chain", fake_chain)
    monkeypatch.setattr(quarter, "add_climate_features", lambda t: t.assign(**{c: 0.0 for c in quarter.FEATURES_G}))
    monkeypatch.setattr(quarter, "add_quarter_label", lambda t: t.assign(**{quarter.LABEL: 0.0}))
    table = quarter.forecasts(pd.DataFrame({"fips": ["a", "b"]}), pd.DataFrame({"fips": ["c"]}))
    label, horizon, train_rows = seen[0]
    assert (label, horizon) == (quarter.LABEL, 13)
    assert not train_rows[table["holdout"]].any() and train_rows[~table["holdout"]].all()


# ---------------------------------------------------------------------------------------------
# Found in the code audit
# ---------------------------------------------------------------------------------------------
def test_noaa_missing_rain_code_is_skipped(tmp_path):
    # Alabama (NOAA 01), county 001, rain (01), 2026: ten real months, then two "not published" codes.
    line = "0100101" + "2026" + "".join(f"{v:7.2f}" for v in [1.0] * 10 + [-9.99, -9.99]) + "\n"
    path = tmp_path / "climdiv-pcpncy-test"
    path.write_text(line)
    table = climate.read_noaa_file(path, {"01001"}, climate.MISSING_AT_OR_BELOW["pcpncy"])
    assert len(table) == 10 and table["value"].min() == 1.0
    # the old single floor of -90 would have kept the two -9.99 codes as if they were rain
    assert len(climate.read_noaa_file(path, {"01001"})) == 12


def test_rank_agreement_gives_no_interval_when_the_model_has_too_few_different_rates():
    result = ponding.rank_agreement([19.08] * 8 + [2.12], [1, 2, 3, 4, 5, 6, 7, 8, 0.1])
    assert result["lo"] is None and result["hi"] is None and result["passes"] is None
    assert result["draws_used"] == 0 and "no interval" in result["note"]


# ---------------------------------------------------------------------------------------------
# Round 6: the area inputs (area.py) and the model that uses them (edge.py)
# ---------------------------------------------------------------------------------------------
from farmdrought import area, edge


def made_up_area(weeks=40):
    """Two counties, weekly. County A's D2 share climbs week by week; county B has no drought."""
    dates = pd.date_range("2020-01-07", periods=weeks, freq="7D")
    a = pd.DataFrame({"fips": "A", "date": dates, "a_d1": 1.0, "a_d2": np.arange(weeks) / 100, "a_d3": 0.0})
    a["dsci"] = 2.0 + a["a_d2"]
    b = pd.DataFrame({"fips": "B", "date": dates, "a_d1": 0.0, "a_d2": 0.0, "a_d3": 0.0, "dsci": 0.0})
    return pd.concat([a, b], ignore_index=True)


def test_area_inputs_look_only_backwards():
    data = made_up_area()
    before = area.own_features(data, ["A"]).set_index("date")
    # Change every week AFTER week 30 and rebuild: nothing up to week 30 may move.
    cut = data["date"].sort_values().unique()[30]
    data.loc[data["date"] > cut, ["a_d2", "dsci"]] = 9.0
    after = area.own_features(data, ["A"]).set_index("date")
    pd.testing.assert_frame_equal(before.loc[:cut], after.loc[:cut])


def test_area_lags_and_averages_are_the_plain_ones():
    f = area.own_features(made_up_area(), ["A"]).set_index("date")
    week20 = f.iloc[20]
    assert week20["a_d2"] == 0.20 and week20["a_d2_l4"] == 0.16 and week20["a_d2_l13"] == 0.07
    assert abs(week20["a_d2_m8"] - np.mean(np.arange(13, 21) / 100)) < 1e-12      # weeks 13 to 20
    assert abs(week20["dsci_chg4"] - 0.04) < 1e-12
    assert np.isnan(f.iloc[3]["a_d2_l4"]) and np.isnan(f.iloc[11]["dsci_m13"])    # not enough earlier weeks yet


def test_model_e_never_trains_on_a_blind_row(monkeypatch):
    seen = {}

    def fake_chain(table, label, horizon, features, make_model, train_on, predict_on):
        seen[len(features)] = train_on.copy()
        return pd.Series(0.5, index=table.index)

    same = lambda t: t
    monkeypatch.setattr(edge, "chain", fake_chain)
    for name in ("add_area_features", "add_quarter_label", "add_climate_features"):
        monkeypatch.setattr(edge, name, same)
    used = pd.DataFrame({"fips": ["a", "b"], "group": ["dev", "six"], **{c: 0.0 for c in edge.FEATURES_E}})
    blind = pd.DataFrame({"fips": ["c"], "group": ["west"], **{c: 0.0 for c in edge.FEATURES_E}})
    table = edge.forecasts(used, blind)
    assert len(edge.FEATURES_E) == 66 and len(set(edge.FEATURES_E)) == 66
    assert not seen[66][table["blind"]].any() and seen[66][~table["blind"]].all()      # model E: every used row, no blind row
    assert list(table.loc[seen[47], "group"]) == ["dev"]                               # the round-5 model: the 436 only
