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


def test_person_models_in_catalog():
    people = list_person_models()
    assert people
    bust = next((p for p in people if p["id"] == "person_bust"), None)
    assert bust is not None
    assert bust["has_glb"] is True
    assert bust["glb_url"] == "/catalog/glb/person_bust.glb"


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
    ):
        assert (GLB_DIR / name).is_file()


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
