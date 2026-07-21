# BeeAR E2E Demo — Screenshot Evidence

## Issue #11 — 200 MRG

E2E video demo screenshots showing BeeAR virtual try-on features (web demo via GitHub Pages).

## Frames

| Frame | Description |
|-------|-------------|
| `frame-00-initial-demo.png` | Initial BeeAR demo page — catalog with demo face, PD slider |
| `frame-01-wayfarer-black.png` | Wayfarer Black glasses applied via 2D canvas try-on |
| `frame-02-cat-eye-rose.png` | Cat-Eye Rose glasses applied on demo face |
| `frame-03-next-face-cat-eye.png` | Next face + Cat-Eye Rose — multi-face try-on |
| `frame-04-compare-mode.png` | Compare A/B mode — side-by-side frame comparison |
| `frame-05-3d-studio.png` | 3D Person Studio — bust character with Aviator Gold GLB |

## Repro Steps

1. Open https://mergeos-bounties.github.io/BeeAR/ in a web browser
2. Browse the catalog on the right — frames are organized as Glasses/All/Accessories
3. Click any frame (e.g. Wayfarer Black) → it renders on the demo face
4. Use **Next face** to cycle through different demo face photos
5. Use **Compare** to toggle A/B side-by-side comparison
6. Use **PD slider** to calibrate pupil distance for better fit scale
7. Click **Snapshot** to capture the current try-on
8. Click **Gallery** to view saved snapshots
9. Navigate to **3D Person** → `studio3d.html` → select a character, pick a frame, adjust fit/offset/depth sliders
10. Use **Auto-rotate** to orbit the 3D view, **Snapshot** to capture

All features work via the GitHub Pages static demo — no server or build required.
