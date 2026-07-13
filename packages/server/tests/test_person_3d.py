"""3D person + GLB studio assets."""
from __future__ import annotations

from pathlib import Path

import pytest

from beear.catalog import get_frame, list_person_models, load_catalog
from beear.config import GLB_DIR, WEB_ROOT


def test_person_bust_glb_exists():
    path = GLB_DIR / "person_bust.glb"
    assert path.is_file(), "person_bust.glb missing — run generate_3d_assets.py"
    assert path.stat().st_size > 10_000
    assert path.read_bytes()[:4] == b"glTF"


def test_meshy_character_glbs_exist():
    for name in ("person_female.glb", "person_male.glb"):
        path = GLB_DIR / name
        assert path.is_file(), f"{name} missing"
        assert path.stat().st_size > 1_000_000
        assert path.read_bytes()[:4] == b"glTF"


def test_person_models_in_catalog():
    people = list_person_models()
    assert people
    ids = {p["id"] for p in people}
    assert "person_female" in ids
    assert "person_male" in ids
    assert "person_bust" in ids
    female = next(p for p in people if p["id"] == "person_female")
    assert female["has_glb"] is True
    assert female["glb_url"] == "/catalog/glb/person_female.glb"
    male = next(p for p in people if p["id"] == "person_male")
    assert male["has_glb"] is True


def test_many_glasses_have_glb():
    cat = load_catalog()
    assert cat.get("glb_count", 0) >= 8
    av = get_frame("aviator_gold")
    assert av and av["has_glb"] and av["glb"].endswith(".glb")
    for name in (
        "aviator-gold.glb",
        "wayfarer-black.glb",
        "round-tortoise.glb",
        "cateye-rose.glb",
        "sport-blue.glb",
        "glasses_meshy_studio.glb",
        "glasses_meshy_square.glb",
        "glasses_meshy_ellipse.glb",
    ):
        assert (GLB_DIR / name).is_file()


def test_meshy_studio_glasses_sku():
    frame = get_frame("meshy_studio_frames")
    assert frame is not None
    assert frame["glb"] == "glasses_meshy_studio.glb"
    assert frame["has_glb"] is True
    assert frame["glb_url"] == "/catalog/glb/glasses_meshy_studio.glb"
    assert frame.get("studio_fit") and "scale" in frame["studio_fit"]
    assert frame.get("ar_fit") and "scale" in frame["ar_fit"]
    path = GLB_DIR / "glasses_meshy_studio.glb"
    assert path.stat().st_size > 1_000_000
    assert path.read_bytes()[:4] == b"glTF"


def test_meshy_square_glasses_sku():
    frame = get_frame("meshy_square_frames")
    assert frame is not None
    assert frame["glb"] == "glasses_meshy_square.glb"
    assert frame["has_glb"] is True
    assert frame["glb_url"] == "/catalog/glb/glasses_meshy_square.glb"
    assert frame.get("style") == "rectangle"
    assert frame.get("source", "").startswith("meshy-019f58d8")
    assert frame.get("studio_fit") and "scale" in frame["studio_fit"]
    path = GLB_DIR / "glasses_meshy_square.glb"
    assert path.stat().st_size > 1_000_000
    assert path.read_bytes()[:4] == b"glTF"


def test_meshy_ellipse_glasses_sku():
    frame = get_frame("meshy_ellipse_frames")
    assert frame is not None
    assert frame["glb"] == "glasses_meshy_ellipse.glb"
    assert frame["has_glb"] is True
    assert frame["glb_url"] == "/catalog/glb/glasses_meshy_ellipse.glb"
    assert frame.get("featured") is True
    assert frame.get("style") == "round"
    assert frame.get("source", "").startswith("meshy-019f58dd")
    assert frame.get("studio_fit") and "scale" in frame["studio_fit"]
    path = GLB_DIR / "glasses_meshy_ellipse.glb"
    assert path.stat().st_size > 1_000_000
    assert path.read_bytes()[:4] == b"glTF"


def test_studio3d_page_present():
    page = WEB_ROOT / "studio3d.html"
    js = WEB_ROOT / "assets" / "studio3d.js"
    css = WEB_ROOT / "assets" / "studio3d.css"
    assert page.is_file()
    assert js.is_file()
    assert css.is_file()
    text = page.read_text(encoding="utf-8")
    assert "3D Person" in text or "3D Studio" in text
    assert "studio3d.js" in text
    js_text = js.read_text(encoding="utf-8")
    # Glasses root must survive person reloads (AR parenting bugfix)
    assert "ensureGlassesRoot" in js_text
    assert "never remove glassesRoot" in js_text or "glassesRoot" in js_text
    assert "eye_height_ratio" in js_text or "0.875" in js_text


def test_person_models_have_eye_anchor_meta():
    people = list_person_models()
    female = next(p for p in people if p["id"] == "person_female")
    assert female.get("anchor_mode") == "bbox_head"
    assert 0.8 <= float(female.get("eye_height_ratio", 0.875)) <= 0.95


@pytest.mark.parametrize(
    "path",
    [
        Path("docs/videos/beear-3d-tryon.mp4"),
        Path("docs/screenshots/demo-3d-person.png"),
    ],
)
def test_readme_media_assets(path: Path):
    # resolve from monorepo root (packages/server/../..)
    root = Path(__file__).resolve().parents[3]
    f = root / path
    assert f.is_file(), f"missing {f}"
    assert f.stat().st_size > 1000
