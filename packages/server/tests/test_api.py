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


def test_compare_and_sessions():
    r = client.post(
        "/api/tryon/compare",
        json={"frame_a": "aviator_gold", "frame_b": "wayfarer_black", "pd_mm": 64},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True

    r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"], "note": "test"})
    assert r.status_code == 200
    sid = r.json()["id"]
    r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
    assert r.status_code == 200
    assert "sport_blue" in r.json()["wishlist"]
    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
