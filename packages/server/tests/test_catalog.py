from beear.catalog import get_frame, list_frames, load_catalog
from beear.tryon import estimate_fit, landmark_box


def test_catalog_has_glasses_and_accessories():
    data = load_catalog()
    frames = data["frames"]
    assert len(frames) >= 6
    cats = {f["category"] for f in frames}
    assert "glasses" in cats
    assert "accessory" in cats
    assert get_frame("aviator_gold") is not None
    assert get_frame("missing") is None


def test_list_filter():
    glasses = list_frames(category="glasses")
    assert all(f["category"] == "glasses" for f in glasses)
    assert len(glasses) >= 4


def test_fit_and_landmarks():
    f = get_frame("wayfarer_black")
    assert f
    fit = estimate_fit(f, pupil_distance_px=100)
    assert fit["ok"]
    assert fit["overlay_width_px"] > 0
    box = landmark_box()
    assert box["pupil_distance_px"] > 0
