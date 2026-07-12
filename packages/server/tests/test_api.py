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
    assert body["frames"] >= 6


def test_catalog_and_fit():
    r = client.get("/api/catalog")
    assert r.status_code == 200
    frames = r.json()["frames"]
    assert frames
    fid = frames[0]["id"]
    r = client.get(f"/api/catalog/{fid}")
    assert r.status_code == 200
    r = client.post(
        "/api/tryon/fit",
        json={"frame_id": fid, "pupil_distance_px": 110, "face_width_px": 200},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_landmarks():
    r = client.post(
        "/api/tryon/landmarks",
        json={"left_eye": [0.35, 0.4], "right_eye": [0.65, 0.4], "canvas_w": 640, "canvas_h": 480},
    )
    assert r.status_code == 200
    assert "mid" in r.json()
