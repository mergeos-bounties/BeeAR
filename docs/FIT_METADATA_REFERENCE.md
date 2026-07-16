# Fit Metadata Reference for SKU Authors

This document explains every fit-related field in a catalog frame SKU entry.
Use it when creating or updating frames in `packages/catalog/frames.json`.

## Required Fit Fields

| Field | Type | Unit | Range | Description |
|-------|------|------|-------|-------------|
| `width_mm` | integer | mm | 130–145 | Total frame front width (lens-to-lens outer edge) |
| `bridge_mm` | integer | mm | 14–20 | Nose bridge gap — distance between the two lens centers at the bridge |
| `temple_mm` | integer | mm | 138–150 | Arm/temple length — from hinge to tip |

### How to Measure

1. **width_mm**: Lay frame flat, measure from left outer edge to right outer edge.
2. **bridge_mm**: Measure the gap at the nose bridge (not the pad-to-pad distance).
3. **temple_mm**: Unfold one arm, measure hinge to tip in a straight line.

## Studio Fit (3D Preview)

These fields control the 3D rendering position in the web catalog preview.

| Field | Type | Unit | Typical | Description |
|-------|------|------|---------|-------------|
| `scale` | float | — | 1.00–1.05 | Uniform scale factor for the 3D model |
| `y` | float | m | -0.02 to 0.02 | Vertical offset (positive = up) |
| `z` | float | m | -0.03 to 0.03 | Depth offset (positive = forward from face) |

### Tips
- Start with `scale: 1.0`, `y: 0`, `z: 0` and adjust visually
- Larger frames may need `scale < 1.0` to avoid clipping
- `y` compensates for frame sit height on the nose

## AR Fit (On-Face Placement)

These fields control the AR try-on overlay positioning.

| Field | Type | Unit | Typical | Description |
|-------|------|------|---------|-------------|
| `scale` | float | — | 0.95–1.05 | AR overlay scale |
| `y` | float | m | -0.01 to 0.01 | Vertical AR offset |
| `pitch` | float | rad | 0.0–0.1 | Forward tilt (positive = tip down) |
| `yaw` | float | rad | -0.05 to 0.05 | Side-to-side rotation |

### Tips
- `pitch` accounts for face curvature — rounder faces need slightly more pitch
- Keep `yaw` near 0 unless the frame is intentionally asymmetric

## Version Bumping

When updating fit fields in an existing SKU:
1. Bump the `price_cents` only if the frame geometry changes materially
2. Document fit changes in the PR description
3. Run `pytest tests/test_catalog.py` to verify validation passes

## Validation Rules

The catalog validator (`tests/test_catalog.py`) enforces:
- All fit fields must be present and numeric
- `width_mm >= 1`, `bridge_mm >= 0`, `temple_mm >= 0`
- `id` must be unique across all frames
- `studio_fit` and `ar_fit` objects are required for 3D/AR rendering

## Example

```json
{
  "id": "aviator_gold",
  "name": "Aviator Gold",
  "brand": "BeeAR Studio",
  "category": "glasses",
  "style": "aviator",
  "color": "#D4AF37",
  "lens_tint": "rgba(212,175,55,0.15)",
  "price_cents": 9500,
  "svg": "aviator.svg",
  "glb": "aviator-gold.glb",
  "fit": {
    "width_mm": 138,
    "bridge_mm": 16,
    "temple_mm": 145
  },
  "studio_fit": {
    "scale": 1.01,
    "y": -0.005,
    "z": 0.015
  },
  "ar_fit": {
    "scale": 1.0,
    "y": 0,
    "pitch": 0.03,
    "yaw": 0
  },
  "render_mode": "glb3d",
  "description": "Classic aviator with gold metal frame"
}
```

---

*For the full SKU schema, see [SKU_CONTRIBUTION.md](./SKU_CONTRIBUTION.md).*
