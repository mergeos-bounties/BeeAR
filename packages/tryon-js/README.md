# `@beear/tryon`

**Core virtual try-on library** for BeeAR — shared by:

| Host | How |
| --- | --- |
| **Web app** (`packages/web`) | `<script src="/assets/beear-tryon.js">` → `window.BeeARTryOn` |
| **Android WebView** | Same IIFE loaded from server or `file:///android_asset/beear/` |
| **Node / tests** | ESM import from `src/index.js` |
| **Server parity** | Fit math mirrors `beear.tryon` (Python) |

## Install / build

```bash
cd packages/tryon-js
npm test
npm run build
# → dist/beear-tryon.js  (+ copies to packages/web/assets/)
```

## API

```js
import {
  estimateFit,
  overlaySize,
  landmarkBox,
  compareFrames,
  drawGlassesOverlay,
  DEFAULT_PD_MM,
} from "@beear/tryon";

// or browser:
// const { estimateFit, drawGlassesOverlay } = BeeARTryOn;
```

| Function | Purpose |
| --- | --- |
| `estimateFit(frame, { pupilDistancePx, faceWidthPx, pdMm })` | Server-compatible fit metrics |
| `overlaySize(frame, pdPx, pdMm)` | Canvas overlay width/height |
| `landmarkBox(left, right, w, h)` | Eye landmarks → mid / angle / PD px |
| `compareFrames(a, b, opts)` | Side-by-side width delta |
| `paintFrameShape(ctx, frame, ow, oh)` | Draw silhouette |
| `drawFrameAt(ctx, …)` | Positioned frame on face |
| `drawGlassesOverlay(ctx, face, A, B, compare, pdMm)` | Full A / A\|B overlay |

## WebView

```js
BeeARTryOn.WebViewHints.defaultLoopbackUrl; // http://localhost:8860/
BeeARTryOn.WebViewHints.assetPath;          // file:///android_asset/beear/index.html
```

Android host library: `packages/android/beear-webview` (AAR).
