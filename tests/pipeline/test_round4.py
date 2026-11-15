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
    monkeypatch.setattr(climate, "EAST_CLIMATE_CSV", tmp_path / "none3.csv")
    monkeypatch.setattr(climate, "EAST_NORMALS_CSV", tmp_path / "none4.csv")
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


def test_neighbour_area_inputs_look_only_backwards(monkeypatch):
    # Two counties 0.1 degrees apart, so each is the other's only neighbour.
    monkeypatch.setattr(area, "load_county_centers", lambda: {"A": (-98.0, 26.0), "B": (-98.1, 26.0)})
    data = made_up_area()
    before = area.neighbour_features(data, ["B"]).set_index("date")
    cut = data["date"].sort_values().unique()[30]
    data.loc[data["date"] > cut, ["a_d2", "dsci"]] = 9.0          # change every later week of both counties
    after = area.neighbour_features(data, ["B"]).set_index("date")
    pd.testing.assert_frame_equal(before.loc[:cut], after.loc[:cut])
    week20 = before.iloc[20]
    assert week20["nb_a2"] == 0.20 and week20["nb_a2_l4"] == 0.16          # county A's D2 share, now and 4 weeks ago
    assert abs(week20["nb_dsci_minus"] - 2.20) < 1e-12                     # A's index (2.20) minus B's own (0)


# ---------------------------------------------------------------------------------------------
# Round 7: the blind-safety rules themselves, the cost arithmetic, and the eastern test (east.py)
# ---------------------------------------------------------------------------------------------
import pytest

from farmdrought import costwindow, east, outlook


def test_chain_fits_only_allowed_rows_whose_answer_was_known_before_the_year():
    # The REAL chain(), with a model that only records which rows it was given to learn from.
    dates = pd.date_range("2006-01-03", "2009-12-29", freq="7D")
    table = pd.DataFrame({"date": np.tile(dates, 2), "fips": np.repeat(["used", "blind"], len(dates)), "x": 0.0})
    table["y"] = np.tile(np.arange(len(dates)) % 2, 2).astype(float)
    table["blind"] = table["fips"] == "blind"
    fitted = []

    class Spy:
        classes_ = [0.0, 1.0]

        def fit(self, x, y):
            fitted.append(x.index)
            return self

        def predict_proba(self, x):
            return np.tile([0.5, 0.5], (len(x), 1))

    out = outlook.chain(table, "y", 13, ["x"], Spy, train_on=~table["blind"],
                        predict_on=pd.Series(True, index=table.index))
    assert len(fitted) == outlook.OUTLOOK_TEST[1] - outlook.OUTLOOK_TEST[0] + 1
    for year, index in zip(range(outlook.OUTLOOK_TEST[0], outlook.OUTLOOK_TEST[1] + 1), fitted):
        rows = table.loc[index]
        assert not rows["blind"].any()                                                     # never a blind row
        assert (rows["date"] + pd.Timedelta(weeks=13) < pd.Timestamp(f"{year}-01-01")).all()   # answer already known
    assert len(table.loc[fitted[0]]) > 0 and out[table["date"].dt.year == 2008].notna().all()


def fake_map(monkeypatch):
    """Four counties: 1 and 2 in Texas, 3 in Ohio, 4 in Utah with a gap in its drought record."""
    classes = np.zeros((4, 5))
    classes[3, 2] = np.nan
    monkeypatch.setattr(edge, "load_usdm", lambda: {"fips": ["1", "2", "3", "4"], "classes": classes,
                                                    "state": ["Texas", "Texas", "Ohio", "Utah"]})
    monkeypatch.setattr(edge, "load_county_centers", lambda: {f: (0.0, 0.0) for f in "1234"})


def test_blind_counties_leave_out_used_other_states_and_incomplete_records(monkeypatch):
    fake_map(monkeypatch)
    assert edge.west_counties({"1"}) == ["2"]             # 1 is used, 3 is not western, 4 has a gap
    assert edge.west_counties(set()) == ["1", "2"]


def test_the_states_argument_only_changes_which_states_are_kept(monkeypatch):
    fake_map(monkeypatch)
    assert edge.west_counties({"1"}, states=["Ohio"]) == ["3"]
    assert edge.west_counties({"1"}, states=None) == ["2", "3"]      # every state, still not used, still complete


def test_eastern_counties_need_area_shares_and_are_never_western(monkeypatch):
    fake_map(monkeypatch)
    monkeypatch.setattr(east.pd, "read_parquet", lambda path, columns: pd.DataFrame({"fips": ["1", "2", "3"]}))
    assert east.east_counties(set()) == ["3"]             # Ohio only: Texas and Utah are round 6's states
    assert east.east_counties({"3"}) == []
    assert not set(east.EAST_STATES) & set(edge.WEST_STATES) and len(east.EAST_STATES + edge.WEST_STATES) == 49


def test_model_m_reads_the_drought_map_only():
    from farmdrought.features import FEATURES_E as el_nino
    outside = set(el_nino + climate.FEATURES_W + climate.FEATURES_P + climate.FEATURES_N)
    assert len(edge.FEATURES_M) == 48 and len(set(edge.FEATURES_M)) == 48
    assert not set(edge.FEATURES_M) & outside
    assert set(edge.FEATURES_E) - set(edge.FEATURES_M) == outside


def test_round_7_never_trains_on_an_eastern_row(monkeypatch):
    seen = {}

    def fake_chain(table, label, horizon, features, make_model, train_on, predict_on):
        seen[len(features)] = (train_on.copy(), predict_on.copy())
        return pd.Series(0.5, index=table.index)

    monkeypatch.setattr(east, "chain", fake_chain)
    monkeypatch.setattr(east, "add_area_features", lambda t: t)
    monkeypatch.setattr(east, "add_quarter_label", lambda t: t)
    monkeypatch.setattr(east.climate, "add_climate_features", lambda t: t)
    frame = lambda fips, groups: pd.DataFrame({"fips": fips, "group": groups, **{c: 0.0 for c in edge.FEATURES_E}})
    table = east.forecasts(frame(["a", "b", "c"], ["dev", "six", "eight"]), frame(["w"], ["west"]),
                           frame(["e"], ["east"]), with_e=True)
    is_east = table["group"] == "east"
    m_train, m_predict = seen[48]
    e_train, e_predict = seen[66]
    assert not m_train[is_east].any() and m_train[~is_east].all()          # M: every used and western row, no eastern
    assert list(table.loc[e_train, "group"]) == ["dev", "six", "eight"]    # E: the 738 only, as frozen
    assert m_predict.equals(is_east) and e_predict.equals(is_east)


def test_cost_at_any_ratio_matches_the_round_6_counts():
    model = {"missed": 3938, "false_alarms": 11769}       # reports/frozen/round3/edge.json, the blind set
    d2, d1 = {"missed": 5270, "false_alarms": 9145}, {"missed": 1374, "false_alarms": 30608}
    assert costwindow.cost(**model, r=3) == 23583 and costwindow.cost(**d2, r=3) == 24955
    low, high = costwindow.window(model, d2, d1)
    assert round(low, 2) == 1.97 and round(high, 2) == 7.35
    assert costwindow.cost(**model, r=2) - costwindow.cost(**d2, r=2) == -40     # a tie at 2 to 1
    assert costwindow.break_even(model, model) is None


def test_a_cost_ratio_gives_its_miss_weight_and_its_warning_line():
    assert costwindow.miss_weight(0.25) == 3 and costwindow.miss_weight(0.5) == 1
    assert abs(costwindow.warning_line(0.18) - 0.18) < 1e-12
    with pytest.raises(ValueError):
        costwindow.miss_weight(1.0)


def test_the_cheapest_rule_is_picked_and_ties_go_to_the_first_named():
    assert costwindow.cheapest({"D2 now": 5, "D1 now": 4, "always warn": 9, "never warn": 9}) == "D1 now"
    assert costwindow.cheapest({"D2 now": 4, "D1 now": 4, "always warn": 4, "never warn": 4}) == "D2 now"


def made_up_scored_rows():
    """Three years, four rows each. cls 3 = D2, 2 = D1. Worked out by hand in the tests below.
    2010 is a year with no drought and no warning from anyone (three years, so the interval can be drawn)."""
    return pd.DataFrame({
        "date": pd.to_datetime(["2008-01-01"] * 4 + ["2009-01-06"] * 4 + ["2010-01-05"] * 4),
        "fips": list("abcd") * 3, "state": "Ohio",
        "cls": [3, 2, 0, 0, 3, 0, 2, 0, 0, 0, 0, 0],
        quarter.LABEL: [1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "p": [0.9, 0.6, 0.1, 0.3, 0.2, 0.7, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0], "y_weeks": 1.0})


def test_round_7b_compares_with_the_cheapest_rule_at_each_ratio():
    rows = made_up_scored_rows()
    by_ratio = {c["cost_ratio"]: c for c in east.other_costs(rows, "p", "model")}
    half, quarter_ratio = by_ratio[0.50], by_ratio[0.25]
    # ratio 0.50: a miss = 1 false alarm. D2 now: 3 missed + 1 false = 4. D1 now: 1 + 1 = 2. always: 8. never: 4.
    assert half["rule_totals"] == {"D2 now": 4.0, "D1 now": 2.0, "always warn": 8.0, "never warn": 4.0}
    assert half["b"] == "D1 now" and half["model_total"] == 1.0          # the model at 0.50 misses one (p 0.3), no false alarm
    # ratio 0.25: a miss = 3 false alarms. D1 now: 3 x 1 + 1 = 4. The model at 0.25: no miss, one false alarm.
    assert quarter_ratio["b"] == "D1 now" and quarter_ratio["rule_totals"]["D1 now"] == 4.0
    assert quarter_ratio["model_total"] == 1.0 and quarter_ratio["difference"] == -3.0


def test_round_7c_is_the_share_right_at_the_half_line():
    result = east.plain_accuracy(made_up_scored_rows(), "p", "model")
    # The model at 0.50 is right on 4 of 4 rows in 2008 and 3 of 4 in 2009; "D2 now" on 3 of 4 and 1 of 4.
    # Everyone is right on all 4 rows of 2010.
    assert result["per_year"]["model"] == [1.0, 0.75, 1.0] and result["per_year"]["D2 now"] == [0.75, 0.25, 1.0]
    assert abs(result["model_mean"] - 11 / 12) < 1e-12 and abs(result["D2 now_mean"] - 8 / 12) < 1e-12
    assert result["lower_is_better"] is False


def test_two_climate_files_may_not_hold_the_same_county(tmp_path, monkeypatch):
    write_climate(tmp_path, monkeypatch, pd.period_range("2020-01", "2020-12", freq="M"))
    monkeypatch.setattr(climate, "EAST_CLIMATE_CSV", tmp_path / "c.csv")       # the same file again
    monkeypatch.setattr(climate, "EAST_NORMALS_CSV", tmp_path / "n.csv")
    with pytest.raises(ValueError, match="repeats 1 counties"):
        climate.monthly_features()


# ---------------------------------------------------------------------------------------------
# After round 7: fresh area shares and model M's live forecast (area.fetch_latest, live_m.py)
# ---------------------------------------------------------------------------------------------
import io
import json

from farmdrought import live_m

SERVICE_CSV = ("MapDate,FIPS,County,State,None,D0,D1,D2,D3,D4,ValidStart,ValidEnd,StatisticFormatID\n"
               "20261117,48001,Anderson,TX,12.5,87.5,67.18,30.25,0,0,2026-11-17,2026-11-23,1\n"
               "20261117,48003,Andrews,TX,100,0,0,0,0,0,2026-11-17,2026-11-23,1\n")


def test_service_rows_are_packed_as_hundredths_of_a_percent():
    packed = area.pack(pd.read_csv(io.StringIO(SERVICE_CSV), dtype={"FIPS": str, "MapDate": str}))
    assert list(packed["fips"]) == ["48001", "48003"] and list(packed["date"].dt.strftime("%Y-%m-%d")) == ["2026-11-17"] * 2
    assert list(packed.loc[0, ["D0", "D1", "D2", "D3", "D4"]]) == [8750, 6718, 3025, 0, 0]
    assert packed["D1"].dtype == "int16"


def test_fetch_latest_saves_only_newer_weeks_beside_the_snapshot_and_names_failed_states(tmp_path, monkeypatch):
    snapshot = pd.DataFrame({"fips": ["48001", "35001"], "date": pd.to_datetime(["2026-11-10", "2026-11-10"]),
                             **{c: pd.Series([0, 0], dtype="int16") for c in area.CLASSES}})
    snapshot.to_parquet(tmp_path / "snapshot.parquet")
    monkeypatch.setattr(area, "AREA_FILE", tmp_path / "snapshot.parquet")
    monkeypatch.setattr(area, "LIVE_AREA_FILE", tmp_path / "live" / "new.parquet")

    def get(url, params):
        if params["aoi"] == "NM":
            raise RuntimeError("the service is down")
        assert params["startdate"] == "11/10/2026"                          # asks from the newest week it holds
        return SERVICE_CSV + "20261110,48001,Anderson,TX,0,100,0,0,0,0,x,y,1\n"   # an old week comes back too

    newest, failed = area.fetch_latest(today="2026-11-20", get=get)
    saved = pd.read_parquet(tmp_path / "live" / "new.parquet")
    assert newest == "2026-11-17" and failed == ["NM"]
    assert set(saved["date"].dt.strftime("%Y-%m-%d")) == {"2026-11-17"}          # the old week is not repeated
    assert len(pd.read_parquet(tmp_path / "snapshot.parquet")) == 2             # the snapshot is untouched


def test_load_area_reads_the_new_weeks_only_inside_live_data(tmp_path, monkeypatch):
    row = lambda day: pd.DataFrame({"fips": ["48001"], "date": pd.to_datetime([day]),
                                    **{c: pd.Series([1000], dtype="int16") for c in area.CLASSES}})
    row("2026-11-10").to_parquet(tmp_path / "snapshot.parquet")
    row("2026-11-17").to_parquet(tmp_path / "new.parquet")
    monkeypatch.setattr(area, "AREA_FILE", tmp_path / "snapshot.parquet")
    monkeypatch.setattr(area, "LIVE_AREA_FILE", tmp_path / "new.parquet")
    assert len(area.load_area()) == 1                                            # scoring never sees the new week
    from farmdrought.config import live_data
    with live_data():
        assert len(area.load_area()) == 2


def test_the_newest_week_needs_both_a_drought_class_and_area_shares():
    panel = pd.DataFrame({"river": ["Rio Grande"] * 3 + ["Pecos"], "fips": ["a", "a", "b", "c"],
                          "date": pd.to_datetime(["2026-11-10", "2026-11-17", "2026-11-17", "2026-11-17"])})
    rows = live_m.newest_rows(panel, pd.to_datetime(["2026-11-10"]))              # area shares stop a week early
    assert list(rows["fips"]) == ["a"] and str(rows["date"].iloc[0].date()) == "2026-11-10"


def test_the_model_m_log_records_when_each_answer_is_known_and_never_rewrites_a_week(tmp_path):
    first = live_m.record("2026-11-10", {"48001": 0.5, "35001": 0.25}, logged_at="2026-11-12T09:00:00+00:00")
    assert first["forecast"]["answer_known_after"] == "2027-02-09" and first["counties"]["48001"] == 0.5
    assert first["forecast"]["alarm_threshold"] == 0.25 and first["model"]["inputs"] == edge.FEATURES_M
    live_m.log_week(first, tmp_path)
    with pytest.raises(FileExistsError):
        live_m.log_week(live_m.record("2026-11-10", {"48001": 0.99}), tmp_path)          # a recomputed week is refused
    assert json.loads((tmp_path / "2026-11-10.json").read_text())["counties"]["48001"] == 0.5
