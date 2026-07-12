/**
 * @beear/tryon — core virtual try-on library for Web + Android WebView.
 */
export {
  DEFAULT_PD_MM,
  estimateFit,
  overlaySize,
  landmarkBox,
  compareFrames,
  faceMetricsFromLandmarks,
} from "./fit.js";
export { paintFrameShape, roundRect } from "./paint.js";
export { drawFrameAt, drawGlassesOverlay } from "./overlay.js";

export const VERSION = "0.1.0";

/** Suggested WebView / host config keys (Android JS bridge may mirror these). */
export const WebViewHints = {
  /** Prefer loopback so WebView grants getUserMedia with adb reverse. */
  defaultLoopbackUrl: "http://localhost:8860/",
  queryDesktop: "desktop=1",
  assetPath: "file:///android_asset/beear/index.html",
};
