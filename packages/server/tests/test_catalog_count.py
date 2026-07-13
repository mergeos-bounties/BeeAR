from beear.catalog import list_frames, list_person_models, load_catalog


def test_catalog_has_meshy_and_people():
    cat = load_catalog()
    frames = list_frames()
    assert cat.get("glb_count", 0) >= 8 or sum(1 for f in frames if f.get("has_glb")) >= 8
    people = list_person_models()
    assert len(people) >= 2
