from __future__ import annotations

from beear import __version__
from beear.catalog import get_frame, list_frames, load_catalog
from beear.config import SVG_DIR, WEB_ROOT
from beear.tryon import estimate_fit, landmark_box

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
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


class LandmarkRequest(BaseModel):
    left_eye: list[float] = Field(default_factory=lambda: [0.38, 0.42])
    right_eye: list[float] = Field(default_factory=lambda: [0.62, 0.42])
    canvas_w: float = 640
    canvas_h: float = 480


@app.get("/health")
def health() -> dict:
    cat = load_catalog()
    return {
        "ok": True,
        "service": "beear",
        "version": __version__,
        "frames": len(cat.get("frames") or []),
    }


@app.get("/api/catalog")
def api_catalog(category: str | None = None, style: str | None = None) -> dict:
    return {
        "version": load_catalog().get("version", 1),
        "frames": list_frames(category=category, style=style),
    }


@app.get("/api/catalog/{frame_id}")
def api_frame(frame_id: str) -> dict:
    f = get_frame(frame_id)
    if not f:
        raise HTTPException(404, f"frame not found: {frame_id}")
    return f


@app.post("/api/tryon/fit")
def api_fit(body: FitRequest) -> dict:
    f = get_frame(body.frame_id)
    if not f:
        raise HTTPException(404, "frame not found")
    return estimate_fit(f, body.pupil_distance_px, body.face_width_px)


@app.post("/api/tryon/landmarks")
def api_landmarks(body: LandmarkRequest) -> dict:
    le = (body.left_eye[0], body.left_eye[1]) if len(body.left_eye) >= 2 else (0.38, 0.42)
    re = (body.right_eye[0], body.right_eye[1]) if len(body.right_eye) >= 2 else (0.62, 0.42)
    return landmark_box(le, re, body.canvas_w, body.canvas_h)


if SVG_DIR.is_dir():
    app.mount("/catalog/svg", StaticFiles(directory=str(SVG_DIR)), name="svg")

if WEB_ROOT.is_dir():
    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(WEB_ROOT / "index.html")

    app.mount("/assets", StaticFiles(directory=str(WEB_ROOT / "assets")), name="assets")
