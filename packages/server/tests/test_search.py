from beear.catalog import search_frames


def test_search_aviator() -> None:
    hits = search_frames("aviator")
    assert hits
    assert any("aviator" in f["id"] for f in hits)
