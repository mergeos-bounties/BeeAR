"""Render BeeAR 3D try-on demo video + still for README (offline, ffmpeg).

Produces:
  docs/videos/beear-3d-tryon.mp4
  docs/screenshots/demo-3d-person.png
"""
from __future__ import annotations

import math
import struct
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
GLB_DIR = ROOT / "packages" / "catalog" / "glb"
OUT_VIDEO = ROOT / "docs" / "videos" / "beear-3d-tryon.mp4"
OUT_STILL = ROOT / "docs" / "screenshots" / "demo-3d-person.png"
OUT_STILL2 = ROOT / "docs" / "screenshots" / "demo-3d-studio.png"


def load_glb_positions(path: Path) -> np.ndarray:
    """Minimal GLB POSITION reader (first mesh primitive)."""
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"not glb: {path}")
    # skip 12-byte header
    off = 12
    json_len, json_type = struct.unpack_from("<I4s", data, off)
    off += 8
    import json

    gltf = json.loads(data[off : off + json_len].decode("utf-8"))
    off += json_len
    # pad
    off = (off + 3) // 4 * 4
    # find BIN chunk
    while off + 8 <= len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off)
        off += 8
        chunk = data[off : off + clen]
        off += clen
        off = (off + 3) // 4 * 4
        if ctype.startswith(b"BIN"):
            bin_data = chunk
            break
    else:
        raise ValueError("no BIN chunk")

    acc = gltf["accessors"][0]
    bv = gltf["bufferViews"][acc["bufferView"]]
    bo = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    count = acc["count"]
    raw = bin_data[bo : bo + count * 12]
    verts = np.frombuffer(raw, dtype=np.float32).reshape(count, 3).copy()
    return verts


def project(verts: np.ndarray, yaw: float, pitch: float = -0.18, dist: float = 4.2):
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    # rotate Y then X
    x = verts[:, 0] * cy + verts[:, 2] * sy
    z = -verts[:, 0] * sy + verts[:, 2] * cy
    y = verts[:, 1]
    y2 = y * cp - z * sp
    z2 = y * sp + z * cp
    # perspective
    z2 = z2 + dist
    f = 520.0
    u = 480 + f * x / np.maximum(z2, 0.2)
    v = 360 - f * y2 / np.maximum(z2, 0.2)
    depth = z2
    return u, v, depth


def draw_mesh_points(
    img: Image.Image,
    verts: np.ndarray,
    yaw: float,
    color: tuple[int, int, int],
    alpha: int = 220,
    point_r: int = 1,
    offset=(0.0, 0.0, 0.0),
    scale: float = 1.0,
):
    v = verts * scale + np.array(offset, dtype=np.float32)
    u, vv, depth = project(v, yaw)
    # sort back-to-front
    order = np.argsort(-depth)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)
    for i in order[::2]:  # subsample for speed
        x, y = float(u[i]), float(vv[i])
        if 0 <= x < img.width and 0 <= y < img.height:
            # depth shading
            t = float(np.clip((depth[i] - 3.0) / 3.0, 0, 1))
            c = tuple(int(c0 * (1 - 0.45 * t)) for c0 in color) + (alpha,)
            dr.ellipse((x - point_r, y - point_r, x + point_r, y + point_r), fill=c)
    img.alpha_composite(layer)


def render_frame(person: np.ndarray, glasses: np.ndarray, yaw: float, w=960, h=720) -> Image.Image:
    img = Image.new("RGBA", (w, h), (7, 11, 20, 255))
    dr = ImageDraw.Draw(img)
    # vignette bg
    for i in range(40):
        a = int(18 + i * 1.2)
        dr.ellipse(
            (w * 0.1 + i * 4, h * 0.05 + i * 3, w * 0.9 - i * 4, h * 0.95 - i * 3),
            outline=(20, 30, 50, a),
        )
    # pedestal
    dr.ellipse((w * 0.28, h * 0.72, w * 0.72, h * 0.88), fill=(18, 26, 40, 255), outline=(40, 55, 80, 255))

    # person centered lower
    draw_mesh_points(img, person, yaw, (235, 190, 160), alpha=230, point_r=1, offset=(0, -0.2, 0), scale=1.0)
    # glasses on face anchor
    face_off = (0.0, 1.35, 0.55)
    draw_mesh_points(img, glasses, yaw, (201, 162, 39), alpha=255, point_r=1, offset=face_off, scale=0.55)

    # chrome UI chrome
    dr.rectangle((0, 0, w, 56), fill=(12, 18, 32, 240))
    dr.text((24, 16), "BeeAR  3D Person Try-On", fill=(245, 197, 24, 255))
    dr.text((24, h - 36), "person_bust.glb  +  aviator-gold.glb  ·  offline WebGL studio", fill=(140, 155, 180, 255))
    badge = "3D STUDIO"
    dr.rounded_rectangle((w - 140, 14, w - 24, 42), radius=12, fill=(91, 140, 255, 60), outline=(91, 140, 255, 180))
    dr.text((w - 120, 20), badge, fill=(158, 193, 255, 255))
    return img


def main() -> None:
    person_path = GLB_DIR / "person_bust.glb"
    glasses_path = GLB_DIR / "aviator-gold.glb"
    if not person_path.is_file() or not glasses_path.is_file():
        raise SystemExit("Run packages/catalog/scripts/generate_3d_assets.py first")

    person = load_glb_positions(person_path)
    glasses = load_glb_positions(glasses_path)
    print(f"person verts={len(person)} glasses verts={len(glasses)}")

    OUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    OUT_STILL.parent.mkdir(parents=True, exist_ok=True)

    n = 72
    with tempfile.TemporaryDirectory() as td:
        tdir = Path(td)
        for i in range(n):
            yaw = (i / n) * math.tau
            frame = render_frame(person, glasses, yaw)
            frame.convert("RGB").save(tdir / f"f{i:03d}.png")
            if i in (0, n // 4, n // 2):
                print(f"frame {i}/{n}")

        # stills
        still = render_frame(person, glasses, 0.55)
        still.convert("RGB").save(OUT_STILL)
        still2 = render_frame(person, glasses, -0.85)
        still2.convert("RGB").save(OUT_STILL2)
        print("wrote", OUT_STILL)
        print("wrote", OUT_STILL2)

        # ffmpeg
        cmd = [
            "ffmpeg",
            "-y",
            "-framerate",
            "24",
            "-i",
            str(tdir / "f%03d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "20",
            "-movflags",
            "+faststart",
            str(OUT_VIDEO),
        ]
        print(" ".join(cmd))
        subprocess.run(cmd, check=True)
        print("wrote", OUT_VIDEO, OUT_VIDEO.stat().st_size)


if __name__ == "__main__":
    main()
