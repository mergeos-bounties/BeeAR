"""Frame / accessory catalog loader."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from beear.config import FRAMES_JSON, GLB_DIR, SVG_DIR

_REQUIRED_FRAME_STRINGS = (
    "id",
    "name",
    "brand",
    "category",
    "style",
    "color",
    "lens_tint",
    "svg",
)
_REQUIRED_FIT_NUMBERS = ("width_mm", "bridge_mm", "temple_mm")


def _is_number(value: Any) -> bool:
    return isinstance(value, int | float) and not isinstance(value, bool)


def _validate_catalog(data: dict[str, Any]) -> None:
    frames = data.get("frames")
    if not isinstance(frames, list) or not frames:
        raise ValueError("frames must be a non-empty list")

    seen_ids: set[str] = set()
    for index, frame in enumerate(frames):
        if not isinstance(frame, dict):
            raise ValueError(f"frames[{index}] must be an object")

        for key in _REQUIRED_FRAME_STRINGS:
            value = frame.get(key)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"frames[{index}].{key} must be a non-empty string")

        frame_id = frame["id"]
        if frame_id in seen_ids:
            raise ValueError(f"frames[{index}].id duplicates {frame_id!r}")
        seen_ids.add(frame_id)

        price = frame.get("price_cents")
        if not isinstance(price, int) or isinstance(price, bool) or price < 0:
            raise ValueError(f"frames[{index}].price_cents must be a non-negative integer")

        glb = frame.get("glb")
        if glb is not None and (not isinstance(glb, str) or not glb.strip()):
            raise ValueError(f"frames[{index}].glb must be a non-empty string when present")

        fit = frame.get("fit")
        if not isinstance(fit, dict):
            raise ValueError(f"frames[{index}].fit must be an object")
        for key in _REQUIRED_FIT_NUMBERS:
            value = fit.get(key)
            minimum = 1 if key == "width_mm" else 0
            if not _is_number(value) or value < minimum:
                raise ValueError(f"frames[{index}].fit.{key} must be >= {minimum}")


def load_catalog(path: Path | None = None) -> dict[str, Any]:
    p = path or FRAMES_JSON
    data = json.loads(p.read_text(encoding="utf-8"))
    _validate_catalog(data)
    frames = data.get("frames") or []
    for f in frames:
        svg_name = f.get("svg") or ""
        svg_path = SVG_DIR / svg_name
        f["has_svg"] = svg_path.is_file()
        f["svg_url"] = f"/catalog/svg/{svg_name}" if svg_name else None
        glb_name = f.get("glb") or ""
        glb_path = GLB_DIR / glb_name
        f["has_glb"] = glb_path.is_file()
        f["glb_url"] = f"/catalog/glb/{glb_name}" if glb_name else None
    # Enrich person models (3D studio bust / full body later)
    people = data.get("person_models") or []
    for person in people:
        glb_name = person.get("glb") or ""
        glb_path = GLB_DIR / glb_name
        person["has_glb"] = glb_path.is_file()
        person["glb_url"] = f"/catalog/glb/{glb_name}" if glb_name else None
    data["person_models"] = people
    data["glb_count"] = sum(1 for f in frames if f.get("has_glb"))
    data["person_count"] = sum(1 for p in people if p.get("has_glb"))
    return data


def list_person_models() -> list[dict[str, Any]]:
    return list(load_catalog().get("person_models") or [])


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


def search_frames(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """Case-insensitive substring search across id, name, brand, style, category."""
    q = (query or "").strip().lower()
    if not q:
        return list_frames()[: max(1, limit)]
    hits: list[dict[str, Any]] = []
    for f in list_frames():
        hay = " ".join(
            str(f.get(k) or "")
            for k in ("id", "name", "brand", "style", "category", "color")
        ).lower()
        if q in hay:
            hits.append(f)
        if len(hits) >= limit:
            break
    return hits


def svg_path(frame_id: str) -> Path | None:
    f = get_frame(frame_id)
    if not f or not f.get("svg"):
        return None
    p = SVG_DIR / f["svg"]
    return p if p.is_file() else None
