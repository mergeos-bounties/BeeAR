import json
from beear.catalog import get_frame, load_catalog

def test_oval_crystal_clear_present():
    f = get_frame("oval_crystal_clear")
    assert f is not None
    assert f["style"] == "oval"
    assert "studio_fit" in f and "ar_fit" in f

def test_oval_crystal_clear_fields():
    f = get_frame("oval_crystal_clear")
    for k in ("id", "name", "category", "glb", "fit", "studio_fit", "ar_fit"):
        assert k in f, f"missing {k}"
