from beear.catalog import get_frame
def test_square_tortoiseshell_present():
    f = get_frame("square_tortoiseshell")
    assert f is not None
    assert f["style"] == "square"
    assert "studio_fit" in f and "ar_fit" in f
