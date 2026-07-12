from beear.catalog import get_frame, list_frames
from beear.tryon import frame_glb_info


def test_glb_info_for_catalog() -> None:
    frames = list_frames()
    assert frames
    # at least one frame may have glb; all return structure
    info = frame_glb_info(frames[0])
    assert "has_glb" in info
    assert info["render_mode"] in {"glb", "svg2d"}


def test_aviator_glb_if_present() -> None:
    f = get_frame("aviator_gold")
    if f and f.get("glb"):
        info = frame_glb_info(f)
        assert info["has_glb"] is True
        assert "aviator" in str(info["glb"])
