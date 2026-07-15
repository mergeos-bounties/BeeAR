import json

import pytest

from beear.catalog import get_frame, list_frames, load_catalog
from beear.tryon import compare_frames, estimate_fit, landmark_box


def test_load_catalog_rejects_frames_missing_required_fields(tmp_path):
    catalog_path = tmp_path / "frames.json"
    catalog_path.write_text(
        json.dumps({"version": 1, "frames": [{"name": "Missing ID"}]}),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match=r"frames\[0\]\.id"):
        load_catalog(catalog_path)


def test_catalog_has_glasses_and_accessories():
    data = load_catalog()
    frames = data["frames"]
    assert len(frames) >= 12
    cats = {f["category"] for f in frames}
    assert "glasses" in cats
    assert "accessory" in cats
    assert get_frame("aviator_gold") is not None
    assert get_frame("rectangle_silver") is not None
    assert get_frame("necklace_pendant") is not None
    assert get_frame("missing") is None


def test_catalog_exposes_local_glb_asset_for_three_renderer():
    frame = get_frame("aviator_gold")
    assert frame
    assert frame["glb"].endswith(".glb")
    assert frame["has_glb"] is True
    assert frame["glb_url"] == f"/catalog/glb/{frame['glb']}"


def test_list_filter():
    glasses = list_frames(category="glasses")
    assert all(f["category"] == "glasses" for f in glasses)
    assert len(glasses) >= 8


def test_list_filter_style():
    aviators = list_frames(style="aviator")
    assert all(f["style"] == "aviator" for f in aviators)
    assert len(aviators) >= 4


def test_list_filter_category_and_style():
    wayfarers = list_frames(category="glasses", style="wayfarer")
    assert len(wayfarers) >= 3
    assert all(f["category"] == "glasses" and f["style"] == "wayfarer" for f in wayfarers)


def test_fit_pd_and_landmarks():
    f = get_frame("wayfarer_black")
    assert f
    fit64 = estimate_fit(f, pupil_distance_px=100, pd_mm=64)
    fit70 = estimate_fit(f, pupil_distance_px=100, pd_mm=70)
    assert fit64["ok"] and fit70["ok"]
    # larger PD mm → smaller overlay for same pupil px
    assert fit70["overlay_width_px"] < fit64["overlay_width_px"]
    box = landmark_box()
    assert box["pupil_distance_px"] > 0


def test_compare_frames():
    a = get_frame("aviator_gold")
    b = get_frame("sport_blue")
    cmp = compare_frames(a, b, pupil_distance_px=120, pd_mm=64)
    assert cmp["ok"]
    assert cmp["a"]["frame_id"] == "aviator_gold"
    assert cmp["b"]["frame_id"] == "sport_blue"
