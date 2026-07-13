# `@beear/tryon`

**Core virtual try-on library** for BeeAR — shared by web, desktop, and Android WebView.

| Host | How |
| --- | --- |
| **Web app** (`packages/web`) | `<script src="beear-tryon.js">` → `window.BeeARTryOn` |
| **Android WebView** | Same IIFE from server or `file:///android_asset/beear/` |
| **Node / bundlers** | ESM import from `src/index.js` |
| **Server parity** | Fit math mirrors `beear.tryon` (Python) |

**Version:** `0.4.0` · **Release:** [libs-v0.4.0](https://github.com/mergeos-bounties/BeeAR/releases/tag/libs-v0.4.0)

---

## Install

### Browser (CDN / GitHub Release)

```html
<script src="https://github.com/mergeos-bounties/BeeAR/releases/download/libs-v0.4.0/beear-tryon-0.4.0.js"></script>
<script>
  console.log(BeeARTryOn.VERSION); // "0.4.0"
  const fit = BeeARTryOn.estimateFit(frame, {
    pupilDistancePx: 64,
    faceWidthPx: 180,
    pdMm: 64,
  });
</script>
```

Or copy `beear-tryon-0.4.0.js` next to your page.

### npm (from release tarball — works without npmjs login)

```bash
npm install https://github.com/mergeos-bounties/BeeAR/releases/download/libs-v0.4.0/beear-tryon-0.4.0.tgz
# or after downloading the asset:
npm install ./beear-tryon-0.4.0.tgz
```

### npm registry (`@beear/tryon`)

When published to the public registry:

```bash
npm install @beear/tryon
```

Maintainers: set `NPM_TOKEN` then `node scripts/release-libs.mjs --npm` from the BeeAR repo root.

```js
import {
  estimateFit,
  overlaySize,
  landmarkBox,
  compareFrames,
  drawGlassesOverlay,
  DEFAULT_PD_MM,
  VERSION,
} from "@beear/tryon";
```

### From source

```bash
cd packages/tryon-js
npm test
npm run build
# → dist/beear-tryon.js  (+ copies to packages/web/assets/)
```

---

## API

| Function | Purpose |
| --- | --- |
| `estimateFit(frame, { pupilDistancePx, faceWidthPx, pdMm })` | Server-compatible fit metrics |
| `overlaySize(frame, pdPx, pdMm)` | Canvas overlay width/height |
| `landmarkBox(left, right, w, h)` | Eye landmarks → mid / angle / PD px |
| `compareFrames(a, b, opts)` | Side-by-side width delta |
| `paintFrameShape(ctx, frame, ow, oh)` | Draw silhouette |
| `drawFrameAt(ctx, …)` | Positioned frame on face |
| `drawGlassesOverlay(ctx, face, A, B, compare, pdMm)` | Full A / A\|B overlay |
| `VERSION` | Library version string |

## WebView hints

```js
BeeARTryOn.WebViewHints.defaultLoopbackUrl; // http://localhost:8860/
BeeARTryOn.WebViewHints.assetPath;          // file:///android_asset/beear/index.html
```

Android host library: [`beear-webview`](../android/beear-webview) AAR.

## License

MIT · [mergeos-bounties/BeeAR](https://github.com/mergeos-bounties/BeeAR)
