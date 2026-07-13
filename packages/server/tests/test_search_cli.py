from beear.catalog import search_frames


def test_search_meshy_frames():
    hits = search_frames("meshy", limit=10)
    assert hits
    ids = {h["id"] for h in hits}
    assert any("meshy" in i for i in ids)
