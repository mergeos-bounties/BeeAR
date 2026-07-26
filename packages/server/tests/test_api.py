import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

from beear.api import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["frames"] >= 12
    assert "pd_calibration" in body["features"]
    assert "person_3d" in body["features"]
    assert "studio3d" in body["features"]
    assert body.get("person_models", 0) >= 1
    assert body.get("glb_frames", 0) >= 8


def test_catalog_and_fit():
    r = client.get("/api/catalog")
    assert r.status_code == 200
    payload = r.json()
    frames = payload["frames"]
    assert frames
    assert payload.get("person_models")
    fid = frames[0]["id"]
    r = client.get(f"/api/catalog/{fid}")
    assert r.status_code == 200
    r = client.post(
        "/api/tryon/fit",
        json={"frame_id": fid, "pupil_distance_px": 110, "face_width_px": 200, "pd_mm": 66},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert r.json()["pd_mm"] == 66


def test_catalog_meta_and_studio3d_route():
    r = client.get("/api/catalog/meta")
    assert r.status_code == 200
    body = r.json()
    assert body["person_count"] >= 1
    assert body["studio_url"] == "/studio3d.html"
    r = client.get("/studio3d.html")
    assert r.status_code == 200
    assert b"studio3d" in r.content.lower() or b"3D" in r.content


def test_landmarks():
    r = client.post(
        "/api/tryon/landmarks",
        json={"left_eye": [0.35, 0.4], "right_eye": [0.65, 0.4], "canvas_w": 640, "canvas_h": 480},
    )
    assert r.status_code == 200
    assert "mid" in r.json()


def test_compare():
    r = client.post(
        "/api/tryon/compare",
        json={"frame_a": "aviator_gold", "frame_b": "wayfarer_black", "pd_mm": 64},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


# --- Session & Wishlist API Tests ---

def test_session_create_and_get() -> None:
    """Create a session with selected frames and retrieve it."""
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold", "wayfarer_black"], "note": "my try-on"})
    assert r.status_code == 200
    body = r.json()
    assert body["note"] == "my try-on"
    assert body["frame_ids"] == ["aviator_gold", "wayfarer_black"]
    assert body["wishlist"] == []
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body

    # Retrieve by ID
    sid = body["id"]
    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid


def test_session_create_empty_frames() -> None:
    """Create a session with no frame_ids."""
    r = client.post("/api/sessions", json={"frame_ids": [], "note": "empty"})
    assert r.status_code == 200
    assert r.json()["frame_ids"] == []


def test_session_create_defaults() -> None:
    """Create a session with minimal payload."""
    r = client.post("/api/sessions", json={})
    assert r.status_code == 200
    body = r.json()
    assert body["frame_ids"] == []
    assert body["note"] == ""


def test_session_get_not_found() -> None:
    """GET non-existent session returns 404."""
    r = client.get("/api/sessions/nonexistent")
    assert r.status_code == 404


def test_session_list() -> None:
    """List sessions returns created sessions."""
    # Create a few sessions
    client.post("/api/sessions", json={"note": "sess_a"})
    client.post("/api/sessions", json={"note": "sess_b"})
    r = client.get("/api/sessions?limit=10")
    assert r.status_code == 200
    body = r.json()
    assert "sessions" in body
    assert len(body["sessions"]) >= 2


def test_session_update_frame_ids() -> None:
    """PATCH session to update frame_ids."""
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
    sid = r.json()["id"]

    r = client.patch(f"/api/sessions/{sid}", json={"frame_ids": ["wayfarer_black", "sport_blue"]})
    assert r.status_code == 200
    assert r.json()["frame_ids"] == ["wayfarer_black", "sport_blue"]


def test_session_update_wishlist() -> None:
    """PATCH session to update wishlist directly."""
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
    sid = r.json()["id"]

    r = client.patch(f"/api/sessions/{sid}", json={"wishlist": ["sport_blue", "wayfarer_black"]})
    assert r.status_code == 200
    assert r.json()["wishlist"] == ["sport_blue", "wayfarer_black"]


def test_session_update_note() -> None:
    """PATCH session to update note only."""
    r = client.post("/api/sessions", json={"note": "original"})
    sid = r.json()["id"]

    r = client.patch(f"/api/sessions/{sid}", json={"note": "updated note"})
    assert r.status_code == 200
    assert r.json()["note"] == "updated note"


def test_session_patch_not_found() -> None:
    """PATCH non-existent session returns 404."""
    r = client.patch("/api/sessions/nonexistent", json={"note": "x"})
    assert r.status_code == 404


def test_wishlist_add() -> None:
    """Add a frame to session wishlist."""
    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
    sid = r.json()["id"]

    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    assert r.status_code == 200
    assert "sport_blue" in r.json()["wishlist"]


def test_wishlist_duplicate_is_idempotent() -> None:
    """Adding the same frame twice does not duplicate in wishlist."""
    r = client.post("/api/sessions", json={"frame_ids": []})
    sid = r.json()["id"]

    client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    assert r.status_code == 200
    assert r.json()["wishlist"] == ["sport_blue"]


def test_wishlist_invalid_frame_id() -> None:
    """Adding an unknown frame_id returns 400."""
    r = client.post("/api/sessions", json={})
    sid = r.json()["id"]

    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "nonexistent_sku"})
    assert r.status_code == 400


def test_wishlist_session_not_found() -> None:
    """Wishlist add on non-existent session returns 404."""
    r = client.post("/api/sessions/nonexistent/wishlist", json={"frame_id": "aviator_gold"})
    assert r.status_code == 404