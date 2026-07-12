"""Offline try-on geometry helpers (server-side fit estimate)."""

from __future__ import annotations

import math
from typing import Any

DEFAULT_PD_MM = 64.0


def estimate_fit(
    frame: dict[str, Any],
    pupil_distance_px: float = 120.0,
    face_width_px: float = 220.0,
    pd_mm: float = DEFAULT_PD_MM,
) -> dict[str, Any]:
    """Scale frame width relative to inter-pupil distance and user PD (mm)."""
    fit = frame.get("fit") or {}
    width_mm = float(fit.get("width_mm") or 140)
    pd = max(50.0, min(80.0, float(pd_mm or DEFAULT_PD_MM)))
    px_per_mm = pupil_distance_px / pd
    overlay_w = width_mm * px_per_mm
    overlay_h = overlay_w * 0.4
    scale = overlay_w / face_width_px if face_width_px else 1.0
    return {
        "frame_id": frame.get("id"),
        "pd_mm": pd,
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


def compare_frames(
    frame_a: dict[str, Any],
    frame_b: dict[str, Any],
    pupil_distance_px: float = 120.0,
    pd_mm: float = DEFAULT_PD_MM,
) -> dict[str, Any]:
    """Side-by-side fit metrics for two SKUs."""
    a = estimate_fit(frame_a, pupil_distance_px, pd_mm=pd_mm)
    b = estimate_fit(frame_b, pupil_distance_px, pd_mm=pd_mm)
    return {
        "ok": True,
        "pd_mm": max(50.0, min(80.0, float(pd_mm or DEFAULT_PD_MM))),
        "a": a,
        "b": b,
        "width_delta_px": round(a["overlay_width_px"] - b["overlay_width_px"], 1),
        "glb": {
            "a": frame_glb_info(frame_a),
            "b": frame_glb_info(frame_b),
        },
    }


def frame_glb_info(frame: dict[str, Any]) -> dict[str, Any]:
    """Describe optional GLB mesh for 3D try-on hosts (Electron / WebGL)."""
    glb = frame.get("glb")
    fit = frame.get("fit") or {}
    return {
        "frame_id": frame.get("id"),
        "has_glb": bool(glb),
        "glb": glb,
        "asset_hint": f"packages/catalog/glb/{glb}" if glb else None,
        "viewer": {
            "scale_mm": float(fit.get("width_mm") or 140),
            "bridge_mm": float(fit.get("bridge_mm") or 18),
            "recommended_camera": "front-isometric",
        },
        "render_mode": "glb" if glb else "svg2d",
    }
