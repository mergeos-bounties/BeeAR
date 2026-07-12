"""In-memory try-on sessions + wishlist (no DB)."""

from __future__ import annotations

import time
import uuid
from typing import Any

_sessions: dict[str, dict[str, Any]] = {}


def create_session(frame_ids: list[str] | None = None, note: str = "") -> dict[str, Any]:
    sid = uuid.uuid4().hex[:12]
    now = time.time()
    row = {
        "id": sid,
        "frame_ids": list(frame_ids or []),
        "wishlist": [],
        "note": note or "",
        "created_at": now,
        "updated_at": now,
    }
    _sessions[sid] = row
    return dict(row)


def get_session(session_id: str) -> dict[str, Any] | None:
    row = _sessions.get(session_id)
    return dict(row) if row else None


def update_session(
    session_id: str,
    *,
    frame_ids: list[str] | None = None,
    wishlist: list[str] | None = None,
    note: str | None = None,
) -> dict[str, Any] | None:
    row = _sessions.get(session_id)
    if not row:
        return None
    if frame_ids is not None:
        row["frame_ids"] = list(frame_ids)
    if wishlist is not None:
        row["wishlist"] = list(dict.fromkeys(wishlist))
    if note is not None:
        row["note"] = note
    row["updated_at"] = time.time()
    return dict(row)


def add_wishlist(session_id: str, frame_id: str) -> dict[str, Any] | None:
    row = _sessions.get(session_id)
    if not row:
        return None
    wl = row.setdefault("wishlist", [])
    if frame_id not in wl:
        wl.append(frame_id)
    row["updated_at"] = time.time()
    return dict(row)


def list_sessions(limit: int = 50) -> list[dict[str, Any]]:
    rows = sorted(_sessions.values(), key=lambda r: r.get("updated_at", 0), reverse=True)
    return [dict(r) for r in rows[: max(1, min(limit, 200))]]
