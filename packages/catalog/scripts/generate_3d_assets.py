"""Generate BeeAR 3D assets: person bust + glasses GLBs (offline, no network).

Usage:
  python packages/catalog/scripts/generate_3d_assets.py
"""
from __future__ import annotations

import json
import math
import struct
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
GLB_DIR = ROOT / "glb"
FRAMES_JSON = ROOT / "frames.json"


def _uv_sphere(radius: float, stacks: int = 18, slices: int = 24, center=(0, 0, 0)):
    cx, cy, cz = center
    verts = []
    norms = []
    for i in range(stacks + 1):
        v = i / stacks
        phi = v * math.pi
        for j in range(slices + 1):
            u = j / slices
            theta = u * 2 * math.pi
            x = radius * math.sin(phi) * math.cos(theta)
            y = radius * math.cos(phi)
            z = radius * math.sin(phi) * math.sin(theta)
            verts.append((cx + x, cy + y, cz + z))
            nlen = math.sqrt(x * x + y * y + z * z) or 1.0
            norms.append((x / nlen, y / nlen, z / nlen))
    idx = []
    for i in range(stacks):
        for j in range(slices):
            a = i * (slices + 1) + j
            b = a + slices + 1
            idx.extend([a, b, a + 1, b, b + 1, a + 1])
    return np.array(verts, np.float32), np.array(norms, np.float32), np.array(idx, np.uint32)


def _box(size, center=(0, 0, 0)):
    sx, sy, sz = size
    cx, cy, cz = center
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    # 8 corners then expanded faces for flat normals
    corners = np.array(
        [
            [-hx, -hy, -hz],
            [hx, -hy, -hz],
            [hx, hy, -hz],
            [-hx, hy, -hz],
            [-hx, -hy, hz],
            [hx, -hy, hz],
            [hx, hy, hz],
            [-hx, hy, hz],
        ],
        np.float32,
    )
    faces = [
        (0, 1, 2, 3, (0, 0, -1)),  # -z
        (4, 5, 6, 7, (0, 0, 1)),  # +z
        (0, 4, 7, 3, (-1, 0, 0)),
        (1, 5, 6, 2, (1, 0, 0)),
        (3, 2, 6, 7, (0, 1, 0)),
        (0, 1, 5, 4, (0, -1, 0)),
    ]
    verts, norms, idx = [], [], []
    for a, b, c, d, n in faces:
        base = len(verts)
        for i in (a, b, c, d):
            verts.append(corners[i] + [cx, cy, cz])
            norms.append(n)
        idx.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return np.array(verts, np.float32), np.array(norms, np.float32), np.array(idx, np.uint32)


def _torus_ring(R: float, r: float, center=(0, 0, 0), major=24, minor=10, scale=(1, 1, 1)):
    """Lens rim approx as torus segment."""
    cx, cy, cz = center
    sx, sy, sz = scale
    verts, norms = [], []
    for i in range(major):
        for j in range(minor):
            u = i / major * 2 * math.pi
            v = j / minor * 2 * math.pi
            x = (R + r * math.cos(v)) * math.cos(u)
            y = r * math.sin(v)
            z = (R + r * math.cos(v)) * math.sin(u)
            verts.append((cx + x * sx, cy + y * sy, cz + z * sz))
            # rough normal
            nx = math.cos(v) * math.cos(u)
            ny = math.sin(v)
            nz = math.cos(v) * math.sin(u)
            nlen = math.sqrt(nx * nx + ny * ny + nz * nz) or 1
            norms.append((nx / nlen, ny / nlen, nz / nlen))
    idx = []
    for i in range(major):
        for j in range(minor):
            a = i * minor + j
            b = ((i + 1) % major) * minor + j
            c = i * minor + (j + 1) % minor
            d = ((i + 1) % major) * minor + (j + 1) % minor
            idx.extend([a, b, c, b, d, c])
    return np.array(verts, np.float32), np.array(norms, np.float32), np.array(idx, np.uint32)


def _merge_meshes(parts: list[tuple[np.ndarray, np.ndarray, np.ndarray, tuple]]):
    """parts: (V, N, I, rgba)"""
    vs, ns, cs, ids = [], [], [], []
    off = 0
    for V, N, I, rgba in parts:
        vs.append(V)
        ns.append(N)
        color = np.tile(np.array(rgba, np.float32), (len(V), 1))
        cs.append(color)
        ids.append(I + off)
        off += len(V)
    return (
        np.vstack(vs).astype(np.float32),
        np.vstack(ns).astype(np.float32),
        np.vstack(cs).astype(np.float32),
        np.concatenate(ids).astype(np.uint32),
    )


def write_glb(path: Path, vertices, normals, colors, indices) -> None:
    """Write a single-mesh glTF 2.0 binary with POSITION/NORMAL/COLOR_0."""
    path.parent.mkdir(parents=True, exist_ok=True)
    v_bytes = vertices.astype(np.float32).tobytes()
    n_bytes = normals.astype(np.float32).tobytes()
    c_bytes = colors.astype(np.float32).tobytes()
    i_bytes = indices.astype(np.uint32).tobytes()

    # pack buffer: V | N | C | I  (align 4)
    def pad(b: bytes) -> bytes:
        return b + b"\x00" * ((4 - (len(b) % 4)) % 4)

    v_bytes, n_bytes, c_bytes, i_bytes = map(pad, (v_bytes, n_bytes, c_bytes, i_bytes))
    buffer = v_bytes + n_bytes + c_bytes + i_bytes
    o_v, o_n = 0, len(v_bytes)
    o_c = o_n + len(n_bytes)
    o_i = o_c + len(c_bytes)

    mins = vertices.min(axis=0).tolist()
    maxs = vertices.max(axis=0).tolist()
    n_verts = len(vertices)
    n_idx = len(indices)

    gltf = {
        "asset": {"version": "2.0", "generator": "BeeAR generate_3d_assets"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": path.stem}],
        "meshes": [
            {
                "name": path.stem,
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": 0,
                            "NORMAL": 1,
                            "COLOR_0": 2,
                        },
                        "indices": 3,
                        "mode": 4,
                    }
                ],
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": n_verts,
                "type": "VEC3",
                "max": maxs,
                "min": mins,
            },
            {"bufferView": 1, "componentType": 5126, "count": n_verts, "type": "VEC3"},
            {"bufferView": 2, "componentType": 5126, "count": n_verts, "type": "VEC4"},
            {
                "bufferView": 3,
                "componentType": 5125,
                "count": n_idx,
                "type": "SCALAR",
            },
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": o_v, "byteLength": len(v_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": o_n, "byteLength": len(n_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": o_c, "byteLength": len(c_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": o_i, "byteLength": len(i_bytes), "target": 34963},
        ],
        "buffers": [{"byteLength": len(buffer)}],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b" " * json_pad
    bin_pad = (4 - (len(buffer) % 4)) % 4
    buffer += b"\x00" * bin_pad

    total = 12 + 8 + len(json_bytes) + 8 + len(buffer)
    with path.open("wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(json_bytes), b"JSON"))
        f.write(json_bytes)
        f.write(struct.pack("<I4s", len(buffer), b"BIN\x00"))
        f.write(buffer)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def build_person_bust():
    skin = (0.92, 0.76, 0.66, 1.0)
    hair = (0.18, 0.12, 0.1, 1.0)
    shirt = (0.2, 0.35, 0.55, 1.0)
    eye_w = (0.98, 0.98, 0.98, 1.0)
    eye_p = (0.12, 0.18, 0.28, 1.0)
    lip = (0.78, 0.42, 0.42, 1.0)

    parts = []
    # head
    parts.append((*_uv_sphere(0.95, 20, 28, (0, 1.55, 0)), skin))
    # hair cap
    V, N, I = _uv_sphere(0.98, 12, 20, (0, 1.72, -0.05))
    # keep top half roughly
    mask = V[:, 1] > 1.55
    # simpler: full sphere slightly offset as hair
    parts.append((V, N, I, hair))
    # neck
    parts.append((*_box((0.38, 0.35, 0.38), (0, 0.95, 0.02)), skin))
    # shoulders / torso
    parts.append((*_box((1.8, 0.55, 0.55), (0, 0.45, 0)), shirt))
    parts.append((*_box((0.7, 0.9, 0.45), (0, 0.0, 0.02)), shirt))
    # eyes
    parts.append((*_uv_sphere(0.11, 8, 12, (-0.28, 1.58, 0.78)), eye_w))
    parts.append((*_uv_sphere(0.11, 8, 12, (0.28, 1.58, 0.78)), eye_w))
    parts.append((*_uv_sphere(0.055, 6, 10, (-0.28, 1.58, 0.88)), eye_p))
    parts.append((*_uv_sphere(0.055, 6, 10, (0.28, 1.58, 0.88)), eye_p))
    # nose
    parts.append((*_box((0.12, 0.18, 0.2), (0, 1.45, 0.88)), skin))
    # lips
    parts.append((*_box((0.28, 0.06, 0.08), (0, 1.28, 0.85)), lip))
    # ears
    parts.append((*_box((0.08, 0.22, 0.12), (-0.95, 1.52, 0.05)), skin))
    parts.append((*_box((0.08, 0.22, 0.12), (0.95, 1.52, 0.05)), skin))

    return _merge_meshes(parts)


def build_glasses(style: str, color_rgb: tuple[float, float, float], tint_a: float = 0.35):
    r, g, b = color_rgb
    frame_c = (r, g, b, 1.0)
    lens_c = (r * 0.3 + 0.05, g * 0.3 + 0.08, b * 0.35 + 0.12, tint_a)
    parts = []
    # style-specific lens geometry
    if style == "aviator":
        left = _torus_ring(0.38, 0.035, (-0.42, 0, 0), major=28, minor=8, scale=(1.0, 0.85, 1.15))
        right = _torus_ring(0.38, 0.035, (0.42, 0, 0), major=28, minor=8, scale=(1.0, 0.85, 1.15))
        lens_l = _box((0.55, 0.42, 0.02), (-0.42, 0, 0.01))
        lens_r = _box((0.55, 0.42, 0.02), (0.42, 0, 0.01))
    elif style == "wayfarer":
        left = _box((0.58, 0.42, 0.06), (-0.4, 0, 0))
        right = _box((0.58, 0.42, 0.06), (0.4, 0, 0))
        lens_l = _box((0.48, 0.32, 0.02), (-0.4, 0, 0.02))
        lens_r = _box((0.48, 0.32, 0.02), (0.4, 0, 0.02))
    elif style == "round":
        left = _torus_ring(0.32, 0.04, (-0.4, 0, 0), major=26, minor=8)
        right = _torus_ring(0.32, 0.04, (0.4, 0, 0), major=26, minor=8)
        lens_l = _box((0.48, 0.48, 0.02), (-0.4, 0, 0.01))
        lens_r = _box((0.48, 0.48, 0.02), (0.4, 0, 0.01))
    elif style == "cateye":
        left = _box((0.6, 0.36, 0.06), (-0.4, 0.05, 0))
        right = _box((0.6, 0.36, 0.06), (0.4, 0.05, 0))
        # outer wing tips
        parts.append((*_box((0.18, 0.12, 0.05), (-0.72, 0.18, 0)), frame_c))
        parts.append((*_box((0.18, 0.12, 0.05), (0.72, 0.18, 0)), frame_c))
        lens_l = _box((0.5, 0.26, 0.02), (-0.4, 0.02, 0.02))
        lens_r = _box((0.5, 0.26, 0.02), (0.4, 0.02, 0.02))
    elif style == "sport":
        left = _box((0.7, 0.32, 0.07), (-0.38, 0, 0))
        right = _box((0.7, 0.32, 0.07), (0.38, 0, 0))
        lens_l = _box((0.6, 0.24, 0.02), (-0.38, 0, 0.02))
        lens_r = _box((0.6, 0.24, 0.02), (0.38, 0, 0.02))
    else:  # rectangle / default
        left = _box((0.62, 0.38, 0.06), (-0.4, 0, 0))
        right = _box((0.62, 0.38, 0.06), (0.4, 0, 0))
        lens_l = _box((0.52, 0.28, 0.02), (-0.4, 0, 0.02))
        lens_r = _box((0.52, 0.28, 0.02), (0.4, 0, 0.02))

    parts.append((*left, frame_c))
    parts.append((*right, frame_c))
    parts.append((*lens_l, lens_c))
    parts.append((*lens_r, lens_c))
    # bridge
    parts.append((*_box((0.22, 0.08, 0.05), (0, 0.05, 0)), frame_c))
    # temples
    parts.append((*_box((0.08, 0.08, 1.1), (-0.78, 0.05, -0.55)), frame_c))
    parts.append((*_box((0.08, 0.08, 1.1), (0.78, 0.05, -0.55)), frame_c))
    # nose pads
    parts.append((*_box((0.06, 0.1, 0.06), (-0.12, -0.12, 0.08)), frame_c))
    parts.append((*_box((0.06, 0.1, 0.06), (0.12, -0.12, 0.08)), frame_c))
    return _merge_meshes(parts)


GLASSES_SPECS = [
    ("aviator-gold.glb", "aviator", (0.79, 0.64, 0.15), 0.32),
    ("wayfarer-black.glb", "wayfarer", (0.08, 0.08, 0.08), 0.4),
    ("round-tortoise.glb", "round", (0.36, 0.23, 0.13), 0.28),
    ("cateye-rose.glb", "cateye", (0.72, 0.43, 0.48), 0.25),
    ("sport-blue.glb", "sport", (0.11, 0.31, 0.85), 0.42),
    ("rectangle-frost.glb", "rectangle", (0.58, 0.64, 0.72), 0.3),
    ("hex-graphite.glb", "wayfarer", (0.22, 0.25, 0.3), 0.35),
    ("clubmaster-amber.glb", "wayfarer", (0.71, 0.33, 0.04), 0.3),
]


def update_frames_json(glb_map: dict[str, str]) -> None:
    data = json.loads(FRAMES_JSON.read_text(encoding="utf-8"))
    data["version"] = max(int(data.get("version") or 1), 3)
    data["person_models"] = [
        {
            "id": "person_bust",
            "name": "Studio Bust",
            "glb": "person_bust.glb",
            "anchor": {"x": 0.0, "y": 1.55, "z": 0.92},
            "scale": 1.0,
            "description": "Low-poly 3D person bust for offline WebGL try-on",
        }
    ]
    # map style → preferred glb
    style_glb = {
        "aviator": "aviator-gold.glb",
        "wayfarer": "wayfarer-black.glb",
        "round": "round-tortoise.glb",
        "cateye": "cateye-rose.glb",
        "cat_eye": "cateye-rose.glb",
        "sport": "sport-blue.glb",
        "rectangle": "rectangle-frost.glb",
        "hex": "hex-graphite.glb",
        "clubmaster": "clubmaster-amber.glb",
        "browline": "clubmaster-amber.glb",
    }
    for f in data.get("frames") or []:
        if f.get("category") != "glasses":
            continue
        style = str(f.get("style") or "").lower()
        fid = str(f.get("id") or "")
        glb = style_glb.get(style)
        # specific overrides by id keywords
        if "chrome" in fid or "gold" in fid:
            glb = "aviator-gold.glb" if "aviator" in style or "chrome" in fid else glb
        if "tortoise" in fid:
            glb = "round-tortoise.glb"
        if "rose" in fid or "cateye" in fid or "cat_eye" in style or style == "cateye":
            glb = "cateye-rose.glb"
        if "sport" in fid or style == "sport":
            glb = "sport-blue.glb"
        if "frost" in fid or style == "rectangle":
            glb = "rectangle-frost.glb"
        if "graphite" in fid or style == "hex":
            glb = "hex-graphite.glb"
        if "amber" in fid or "clubmaster" in style or "browline" in style:
            glb = "clubmaster-amber.glb"
        if "wayfarer" in fid or style == "wayfarer":
            glb = "wayfarer-black.glb"
        if not glb:
            glb = "wayfarer-black.glb"
        f["glb"] = glb
        f["render_mode"] = "glb3d"
    FRAMES_JSON.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"updated {FRAMES_JSON}")


def main() -> None:
    GLB_DIR.mkdir(parents=True, exist_ok=True)
    V, N, C, I = build_person_bust()
    write_glb(GLB_DIR / "person_bust.glb", V, N, C, I)

    glb_map = {}
    for name, style, rgb, tint in GLASSES_SPECS:
        V, N, C, I = build_glasses(style, rgb, tint)
        write_glb(GLB_DIR / name, V, N, C, I)
        glb_map[name] = style

    update_frames_json(glb_map)
    print("done")


if __name__ == "__main__":
    main()
