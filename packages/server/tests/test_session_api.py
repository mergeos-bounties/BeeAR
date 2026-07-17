"""Comprehensive tests for session and wishlist API."""
import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

from beear.api import app

client = TestClient(app)


class TestSessionAPI:
    """Tests for session CRUD operations."""

    def test_create_session(self):
        """Test creating a new session."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"], "note": "test session"})
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["frame_ids"] == ["aviator_gold"]
        assert data["note"] == "test session"
        assert data["wishlist"] == []
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_session_empty(self):
        """Test creating session with no frames."""
        r = client.post("/api/sessions", json={})
        assert r.status_code == 200
        data = r.json()
        assert data["frame_ids"] == []
        assert data["note"] == ""

    def test_get_session(self):
        """Test getting a session by ID."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        r = client.get(f"/api/sessions/{sid}")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == sid
        assert data["frame_ids"] == ["aviator_gold"]

    def test_get_session_not_found(self):
        """Test getting non-existent session."""
        r = client.get("/api/sessions/nonexistent")
        assert r.status_code == 404

    def test_list_sessions(self):
        """Test listing all sessions."""
        client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        client.post("/api/sessions", json={"frame_ids": ["wayfarer_black"]})
        
        r = client.get("/api/sessions")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_update_session(self):
        """Test updating a session."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        r = client.patch(f"/api/sessions/{sid}", json={
            "frame_ids": ["aviator_gold", "wayfarer_black"],
            "note": "updated note"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["frame_ids"] == ["aviator_gold", "wayfarer_black"]
        assert data["note"] == "updated note"

    def test_update_session_not_found(self):
        """Test updating non-existent session."""
        r = client.patch("/api/sessions/nonexistent", json={"note": "test"})
        assert r.status_code == 404


class TestWishlistAPI:
    """Tests for wishlist operations."""

    def test_add_to_wishlist(self):
        """Test adding frame to wishlist."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "wayfarer_black"})
        assert r.status_code == 200
        data = r.json()
        assert "wayfarer_black" in data["wishlist"]

    def test_add_to_wishlist_duplicate(self):
        """Test adding duplicate frame to wishlist."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "wayfarer_black"})
        r = client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "wayfarer_black"})
        assert r.status_code == 200
        data = r.json()
        assert data["wishlist"].count("wayfarer_black") == 1

    def test_add_to_wishlist_session_not_found(self):
        """Test adding to wishlist for non-existent session."""
        r = client.post("/api/sessions/nonexistent/wishlist", json={"frame_id": "wayfarer_black"})
        assert r.status_code == 404

    def test_wishlist_persists(self):
        """Test wishlist persists in session."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "wayfarer_black"})
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
        
        r = client.get(f"/api/sessions/{sid}")
        assert r.status_code == 200
        data = r.json()
        assert "wayfarer_black" in data["wishlist"]
        assert "sport_blue" in data["wishlist"]

    def test_wishlist_order_preserved(self):
        """Test wishlist order is preserved."""
        r = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        sid = r.json()["id"]
        
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "c"})
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "a"})
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "b"})
        
        r = client.get(f"/api/sessions/{sid}")
        assert r.json()["wishlist"] == ["c", "a", "b"]


class TestSessionIntegration:
    """Integration tests for session workflow."""

    def test_full_session_workflow(self):
        """Test complete session workflow."""
        r = client.post("/api/sessions", json={
            "frame_ids": ["aviator_gold"],
            "note": "customer consultation"
        })
        assert r.status_code == 200
        sid = r.json()["id"]
        
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "wayfarer_black"})
        client.post(f"/api/sessions/{sid}/wishlist", json={"frame_id": "sport_blue"})
        
        r = client.patch(f"/api/sessions/{sid}", json={
            "frame_ids": ["aviator_gold", "wayfarer_black"],
            "note": "customer prefers black frames"
        })
        assert r.status_code == 200
        
        r = client.get(f"/api/sessions/{sid}")
        assert r.status_code == 200
        data = r.json()
        assert len(data["frame_ids"]) == 2
        assert len(data["wishlist"]) == 2
        assert data["note"] == "customer prefers black frames"

    def test_multiple_sessions_independent(self):
        """Test multiple sessions are independent."""
        r1 = client.post("/api/sessions", json={"frame_ids": ["aviator_gold"]})
        r2 = client.post("/api/sessions", json={"frame_ids": ["wayfarer_black"]})
        
        sid1 = r1.json()["id"]
        sid2 = r2.json()["id"]
        
        client.post(f"/api/sessions/{sid1}/wishlist", json={"frame_id": "sport_blue"})
        client.post(f"/api/sessions/{sid2}/wishlist", json={"frame_id": "cat_eye_rose"})
        
        r1 = client.get(f"/api/sessions/{sid1}")
        r2 = client.get(f"/api/sessions/{sid2}")
        
        assert "sport_blue" in r1.json()["wishlist"]
        assert "cat_eye_rose" not in r1.json()["wishlist"]
        
        assert "cat_eye_rose" in r2.json()["wishlist"]
        assert "sport_blue" not in r2.json()["wishlist"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
