"""Frame / accessory catalog loader."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from beear.config import FRAMES_JSON, SVG_DIR


def load_catalog(path: Path | None = None) -> dict[str, Any]:
    p = path or FRAMES_JSON
    data = json.loads(p.read_text(encoding="utf-8"))
    frames = data.get("frames") or []
    for f in frames:
        svg_name = f.get("svg") or ""
        svg_path = SVG_DIR / svg_name
        f["has_svg"] = svg_path.is_file()
        f["svg_url"] = f"/catalog/svg/{svg_name}" if svg_name else None
    return data


def list_frames(
    category: str | None = None,
    style: str | None = None,
) -> list[dict[str, Any]]:
    frames = load_catalog().get("frames") or []
    if category:
        frames = [f for f in frames if f.get("category") == category]
    if style:
        frames = [f for f in frames if f.get("style") == style]
    return frames


def get_frame(frame_id: str) -> dict[str, Any] | None:
    for f in list_frames():
        if f.get("id") == frame_id:
            return f
    return None


def svg_path(frame_id: str) -> Path | None:
    f = get_frame(frame_id)
    if not f or not f.get("svg"):
        return None
    p = SVG_DIR / f["svg"]
    return p if p.is_file() else None
