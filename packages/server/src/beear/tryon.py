"""Offline try-on geometry helpers (server-side fit estimate)."""

from __future__ import annotations

import math
from typing import Any


def estimate_fit(
    frame: dict[str, Any],
    pupil_distance_px: float = 120.0,
    face_width_px: float = 220.0,
) -> dict[str, Any]:
    """Scale frame width relative to inter-pupil distance."""
    fit = frame.get("fit") or {}
    width_mm = float(fit.get("width_mm") or 140)
    # assume ~64mm average adult PD → scale
    avg_pd_mm = 64.0
    px_per_mm = pupil_distance_px / avg_pd_mm
    overlay_w = width_mm * px_per_mm
    overlay_h = overlay_w * 0.4
    scale = overlay_w / face_width_px if face_width_px else 1.0
    return {
        "frame_id": frame.get("id"),
        "overlay_width_px": round(overlay_w, 1),
        "overlay_height_px": round(overlay_h, 1),
        "scale": round(scale, 3),
        "bridge_offset_px": round(float(fit.get("bridge_mm") or 18) * px_per_mm * 0.15, 1),
        "ok": True,
    }


def landmark_box(
    left_eye: tuple[float, float] = (0.38, 0.42),
    right_eye: tuple[float, float] = (0.62, 0.42),
    canvas_w: float = 640,
    canvas_h: float = 480,
) -> dict[str, Any]:
    """Normalized landmark → pixel box for glasses anchor."""
    lx, ly = left_eye[0] * canvas_w, left_eye[1] * canvas_h
    rx, ry = right_eye[0] * canvas_w, right_eye[1] * canvas_h
    pd = math.hypot(rx - lx, ry - ly)
    mid_x = (lx + rx) / 2
    mid_y = (ly + ry) / 2
    angle = math.degrees(math.atan2(ry - ly, rx - lx))
    return {
        "left_eye": [round(lx, 1), round(ly, 1)],
        "right_eye": [round(rx, 1), round(ry, 1)],
        "mid": [round(mid_x, 1), round(mid_y, 1)],
        "pupil_distance_px": round(pd, 1),
        "angle_deg": round(angle, 2),
        "canvas": [canvas_w, canvas_h],
    }
