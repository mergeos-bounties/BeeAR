from __future__ import annotations

import hashlib
import json
from typing import Any

from beear import __version__
from beear.catalog import get_frame, load_catalog
from beear.config import GLB_DIR, SVG_DIR, WEB_ROOT
from beear import sessions as sess
from beear.tryon import compare_frames, estimate_fit, landmark_box

try:
    from fastapi import FastAPI, HTTPException, Request, Response
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel, Field
except ImportError as exc:  # pragma: no cover
    raise ImportError('pip install -e "."') from exc

app = FastAPI(title="BeeAR", version=__version__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class FitRequest(BaseModel):
    frame_id: str
    pupil_distance_px: float = 120.0
    face_width_px: float = 220.0
    pd_mm: float = 64.0


class LandmarkRequest(BaseModel):
    left_eye: list[float] = Field(default_factory=lambda: [0.38, 0.42])
    right_eye: list[float] = Field(default_factory=lambda: [0.62, 0.42])
    canvas_w: float = 640
    canvas_h: float = 480


class CompareRequest(BaseModel):
    frame_a: str
    frame_b: str
    pupil_distance_px: float = 120.0
    pd_mm: float = 64.0


class SessionCreate(BaseModel):
    frame_ids: list[str] = Field(default_factory=list)
    note: str = ""


class SessionUpdate(BaseModel):
    frame_ids: list[str] | None = None
    wishlist: list[str] | None = None
    note: str | None = None


class WishlistAdd(BaseModel):
    frame_id: str


CATALOG_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600"


def _catalog_etag(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )
    return f'"{hashlib.sha256(raw).hexdigest()[:32]}"'


def _etag_matches(header_value: str | None, etag: str) -> bool:
    if not header_value:
        return False
    for value in header_value.split(","):
        candidate = value.strip()
        if candidate == "*" or candidate == etag:
            return True
        if candidate.startswith("W/") and candidate[2:].strip() == etag:
            return True
    return False


def _cached_catalog_response(
    request: Request,
    payload: dict[str, Any],
) -> Response:
    etag = _catalog_etag(payload)
    headers = {
        "Cache-Control": CATALOG_CACHE_CONTROL,
        "ETag": etag,
    }
    if _etag_matches(request.headers.get("if-none-match"), etag):
        return Response(status_code=304, headers=headers)
    return JSONResponse(content=payload, headers=headers)


def _filter_frames(
    frames: list[dict[str, Any]],
    *,
    category: str | None,
    style: str | None,
) -> list[dict[str, Any]]:
    if category:
        frames = [frame for frame in frames if frame.get("category") == category]
    if style:
        frames = [frame for frame in frames if frame.get("style") == style]
    return frames


@app.get("/health")
def health() -> dict:
    cat = load_catalog()
    return {
        "ok": True,
        "service": "beear",
        "version": __version__,
        "frames": len(cat.get("frames") or []),
        "glb_frames": cat.get("glb_count", 0),
        "person_models": cat.get("person_count", 0),
        "features": [
            "pd_calibration",
            "compare",
            "sessions",
            "wishlist",
            "glb3d",
            "person_3d",
            "studio3d",
        ],
    }


@app.get("/api/catalog")
def api_catalog(
    request: Request,
    category: str | None = None,
    style: str | None = None,
) -> Response:
    cat = load_catalog()
    frames = _filter_frames(cat.get("frames") or [], category=category, style=style)
    return _cached_catalog_response(
        request,
        {
            "version": cat.get("version", 1),
            "frames": frames,
            "person_models": cat.get("person_models") or [],
            "glb_count": cat.get("glb_count", 0),
        },
    )


@app.get("/api/catalog/meta")
def api_catalog_meta(request: Request) -> Response:
    """Catalog metadata for 3D studio (person models + glb stats)."""
    cat = load_catalog()
    return _cached_catalog_response(
        request,
        {
            "version": cat.get("version", 1),
            "person_models": cat.get("person_models") or [],
            "glb_count": cat.get("glb_count", 0),
            "person_count": cat.get("person_count", 0),
            "studio_url": "/studio3d.html",
        },
    )


@app.get("/api/catalog/{frame_id}")
def api_frame(frame_id: str, request: Request) -> Response:
    f = get_frame(frame_id)
    if not f:
        raise HTTPException(404, f"frame not found: {frame_id}")
    return _cached_catalog_response(request, f)


@app.post("/api/tryon/fit")
def api_fit(body: FitRequest) -> dict:
    f = get_frame(body.frame_id)
    if not f:
        raise HTTPException(404, "frame not found")
    return estimate_fit(f, body.pupil_distance_px, body.face_width_px, pd_mm=body.pd_mm)


@app.post("/api/tryon/landmarks")
def api_landmarks(body: LandmarkRequest) -> dict:
    le = (body.left_eye[0], body.left_eye[1]) if len(body.left_eye) >= 2 else (0.38, 0.42)
    re = (body.right_eye[0], body.right_eye[1]) if len(body.right_eye) >= 2 else (0.62, 0.42)
    return landmark_box(le, re, body.canvas_w, body.canvas_h)


@app.post("/api/tryon/compare")
def api_compare(body: CompareRequest) -> dict:
    a = get_frame(body.frame_a)
    b = get_frame(body.frame_b)
    if not a or not b:
        raise HTTPException(404, "one or both frames not found")
    return compare_frames(a, b, body.pupil_distance_px, pd_mm=body.pd_mm)


@app.post("/api/sessions")
def api_session_create(body: SessionCreate) -> dict:
    return sess.create_session(body.frame_ids, body.note)


@app.get("/api/sessions")
def api_session_list(limit: int = 50) -> dict:
    return {"sessions": sess.list_sessions(limit)}


@app.get("/api/sessions/{session_id}")
def api_session_get(session_id: str) -> dict:
    row = sess.get_session(session_id)
    if not row:
        raise HTTPException(404, "session not found")
    return row


@app.patch("/api/sessions/{session_id}")
def api_session_patch(session_id: str, body: SessionUpdate) -> dict:
    row = sess.update_session(
        session_id,
        frame_ids=body.frame_ids,
        wishlist=body.wishlist,
        note=body.note,
    )
    if not row:
        raise HTTPException(404, "session not found")
    return row


@app.post("/api/sessions/{session_id}/wishlist")
def api_wishlist_add(session_id: str, body: WishlistAdd) -> dict:
    if not get_frame(body.frame_id):
        raise HTTPException(400, "unknown frame_id")
    row = sess.add_wishlist(session_id, body.frame_id)
    if not row:
        raise HTTPException(404, "session not found")
    return row


if SVG_DIR.is_dir():
    app.mount("/catalog/svg", StaticFiles(directory=str(SVG_DIR)), name="svg")

if GLB_DIR.is_dir():
    app.mount("/catalog/glb", StaticFiles(directory=str(GLB_DIR)), name="glb")

if WEB_ROOT.is_dir():

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(WEB_ROOT / "index.html")

    @app.get("/studio3d.html")
    def studio3d() -> FileResponse:
        """Full 3D person + glasses GLB try-on studio."""
        return FileResponse(WEB_ROOT / "studio3d.html")

    app.mount("/assets", StaticFiles(directory=str(WEB_ROOT / "assets")), name="assets")
