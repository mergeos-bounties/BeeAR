import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

from beear.api import app

client = TestClient(app)


def test_create_session():
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"], "note": "test"})
    assert r.status_code == 200
    body = r.json()
    assert "id" in body
    assert body["frame_ids"] == ["aviator_gold"]
    assert body["note"] == "test"
    assert body["wishlist"] == []
    assert "created_at" in body
    assert "updated_at" in body


def test_create_session_empty():
    r = client.post("/api/sessions", json={})
    assert r.status_code == 200
    body = r.json()
    assert body["frame_ids"] == []
    assert body["wishlist"] == []


def test_get_session():
    r = client.post("/api/sessions", json={"frame_ids": ["wayfarer_black"]})
    sid = r.json()["id"]
    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid
    assert r.json()["frame_ids"] == ["wayfarer_black"]


def test_get_session_not_found():
    r = client.get("/api/sessions/nonexistent")
    assert r.status_code == 404


def test_list_sessions():
    # Create a few sessions
    client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
    client.post("/api/sessions", json={"frame_ids": ["round_tortoise"]})
    r = client.get("/api/sessions")
    assert r.status_code == 200
    assert "sessions" in r.json()
    assert len(r.json()["sessions"]) >= 2


def test_patch_session():
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
    sid = r.json()["id"]
    r = client.patch(
        f"/api/sessions/{sid}",
        json={"frame_ids": ["wayfarer_black", "round_tortoise"], "note": "updated"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["frame_ids"] == ["wayfarer_black", "round_tortoise"]
    assert body["note"] == "updated"


def test_patch_session_not_found():
    r = client.patch("/api/sessions/nonexistent", json={"note": "hi"})
    assert r.status_code == 404


def test_add_wishlist():
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "aviator_gold"})
    assert r.status_code == 200
    assert "aviator_gold" in r.json()["wishlist"]


def test_add_wishlist_duplicate():
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    assert r.status_code == 200
    # Duplicates should be prevented
    assert r.json()["wishlist"].count("sport_blue") == 1


def test_add_wishlist_session_not_found():
    r = client.post("/api/sessions/nonexistent/wishlist", json={"frame_id": "aviator_gold"})
    assert r.status_code == 404


def test_add_wishlist_bad_frame():
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "nonexistent_frame"})
    assert r.status_code == 400


def test_put_wishlist():
    """PUT replaces the entire wishlist."""
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    # Add initial wishlist items
    client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "aviator_gold"})
    client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    # PUT replaces the entire wishlist
    r = client.put(
        f"/api/sessions/{sid}/wishlist",
        json={"frame_ids": ["wayfarer_black", "round_tortoise"]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["wishlist"] == ["wayfarer_black", "round_tortoise"]
    # Verify old items are gone
    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
    assert r.json()["wishlist"] == ["wayfarer_black", "round_tortoise"]


def test_put_wishlist_empty():
    """PUT with empty list clears the wishlist."""
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "aviator_gold"})
    r = client.put(f"/api/sessions/{sid}/wishlist", json={"frame_ids": []})
    assert r.status_code == 200
    assert r.json()["wishlist"] == []


def test_put_wishlist_dedup():
    """PUT wishlist should deduplicate frame_ids."""
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]
    r = client.put(
        f"/api/sessions/{sid}/wishlist",
        json={"frame_ids": ["aviator_gold", "aviator_gold", "sport_blue"]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["wishlist"] == ["aviator_gold", "sport_blue"]


def test_put_wishlist_session_not_found():
    r = client.put(
        "/api/sessions/nonexistent/wishlist",
        json={"frame_ids": ["aviator_gold"]},
    )
    assert r.status_code == 404


def test_full_session_lifecycle():
    """End-to-end: create, update, add wishlist, set wishlist, retrieve."""
    # Create
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"], "note": "demo"})
    assert r.status_code == 200
    sid = r.json()["id"]

    # Add to wishlist
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    assert r.status_code == 200
    assert "sport_blue" in r.json()["wishlist"]

    # PATCH update
    r = client.patch(f"/api/sessions/{sid}", json={"note": "updated demo"})
    assert r.status_code == 200
    assert r.json()["note"] == "updated demo"

    # PUT wishlist (full replace)
    r = client.put(
        f"/api/sessions/{sid}/wishlist",
        json={"frame_ids": ["wayfarer_black"]},
    )
    assert r.status_code == 200
    assert r.json()["wishlist"] == ["wayfarer_black"]

    # GET verify
    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == sid
    assert body["frame_ids"] == ["aviator_gold"]
    assert body["wishlist"] == ["wayfarer_black"]
    assert body["note"] == "updated demo"
