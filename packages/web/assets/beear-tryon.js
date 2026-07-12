/* @beear/tryon v0.1.0 — IIFE for web + Android WebView */
(function (global) {
  "use strict";

/* --- fit.js --- */
/** Shared PD / fit math (parity with server beear.tryon). */

const DEFAULT_PD_MM = 64.0;

/**
 * @param {object} frame catalog frame with fit.width_mm / bridge_mm
 * @param {object} [opts]
 * @param {number} [opts.pupilDistancePx=120]
 * @param {number} [opts.faceWidthPx=220]
 * @param {number} [opts.pdMm=64]
 */
function estimateFit(frame, opts = {}) {
  const pupilDistancePx = Number(opts.pupilDistancePx ?? 120);
  const faceWidthPx = Number(opts.faceWidthPx ?? 220);
  const pdMm = clampPd(opts.pdMm ?? DEFAULT_PD_MM);
  const fit = (frame && frame.fit) || {};
  const widthMm = Number(fit.width_mm || 140);
  const pxPerMm = pupilDistancePx / pdMm;
  const overlayW = widthMm * pxPerMm;
  const overlayH = overlayW * 0.4;
  const scale = faceWidthPx ? overlayW / faceWidthPx : 1.0;
  return {
    frame_id: frame?.id,
    pd_mm: pdMm,
    overlay_width_px: round1(overlayW),
    overlay_height_px: round1(overlayH),
    scale: round3(scale),
    bridge_offset_px: round1(Number(fit.bridge_mm || 18) * pxPerMm * 0.15),
    ok: true,
  };
}

/**
 * Canvas overlay size from inter-pupil px and user PD (mm).
 * Slight visual boost (1.15) for on-face readability — client-only.
 */
function overlaySize(frame, pdPx, pdMm = DEFAULT_PD_MM) {
  const widthMm = frame?.fit?.width_mm || 140;
  const pd = clampPd(pdMm);
  const overlayW = (widthMm / pd) * pdPx * 1.15;
  return { overlayW, overlayH: overlayW * 0.42 };
}

/**
 * @param {[number, number]} leftEye normalized 0–1
 * @param {[number, number]} rightEye normalized 0–1
 */
function landmarkBox(
  leftEye = [0.38, 0.42],
  rightEye = [0.62, 0.42],
  canvasW = 640,
  canvasH = 480,
) {
  const lx = leftEye[0] * canvasW;
  const ly = leftEye[1] * canvasH;
  const rx = rightEye[0] * canvasW;
  const ry = rightEye[1] * canvasH;
  const pd = Math.hypot(rx - lx, ry - ly);
  const midX = (lx + rx) / 2;
  const midY = (ly + ry) / 2;
  const angle = (Math.atan2(ry - ly, rx - lx) * 180) / Math.PI;
  return {
    left_eye: [round1(lx), round1(ly)],
    right_eye: [round1(rx), round1(ry)],
    mid: [round1(midX), round1(midY)],
    pupil_distance_px: round1(pd),
    angle_deg: round2(angle),
    canvas: [canvasW, canvasH],
  };
}

function compareFrames(frameA, frameB, opts = {}) {
  const pupilDistancePx = Number(opts.pupilDistancePx ?? 120);
  const pdMm = clampPd(opts.pdMm ?? DEFAULT_PD_MM);
  const a = estimateFit(frameA, { pupilDistancePx, pdMm });
  const b = estimateFit(frameB, { pupilDistancePx, pdMm });
  return {
    ok: true,
    pd_mm: pdMm,
    a,
    b,
    width_delta_px: round1(a.overlay_width_px - b.overlay_width_px),
  };
}

function faceMetricsFromLandmarks(face, canvasW, canvasH) {
  const lx = face.left[0] * canvasW;
  const ly = face.left[1] * canvasH;
  const rx = face.right[0] * canvasW;
  const ry = face.right[1] * canvasH;
  return {
    left: [lx, ly],
    right: [rx, ry],
    midX: (lx + rx) / 2,
    midY: (ly + ry) / 2,
    pdPx: Math.hypot(rx - lx, ry - ly) || 100,
    angle: Math.atan2(ry - ly, rx - lx),
  };
}

function clampPd(pd) {
  return Math.max(50, Math.min(80, Number(pd) || DEFAULT_PD_MM));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function round3(n) {
  return Math.round(n * 1000) / 1000;
}


/* --- paint.js --- */
/** Canvas frame shape painters — shared by web + WebView. */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Paint glasses / accessory silhouette in local coords (origin = bridge center).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} frame
 * @param {number} ow overlay width
 * @param {number} oh overlay height
 */
function paintFrameShape(ctx, frame, ow, oh) {
  const color = frame.color || "#111";
  const tint = frame.lens_tint || "rgba(0,0,0,0.25)";
  const style = frame.style || "wayfarer";
  ctx.lineWidth = Math.max(3, ow * 0.025);
  ctx.strokeStyle = color;
  ctx.fillStyle = tint;

  if (style === "round") {
    const r = oh * 0.42;
    const gap = ow * 0.08;
    ctx.beginPath();
    ctx.arc(-gap / 2 - r, 0, r, 0, Math.PI * 2);
    ctx.arc(gap / 2 + r, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "aviator") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, 0);
    ctx.quadraticCurveTo(-ow / 4, -oh / 2, 0, -oh * 0.1);
    ctx.quadraticCurveTo(ow / 4, -oh / 2, ow / 2, 0);
    ctx.quadraticCurveTo(ow / 4, oh / 2, 0, oh * 0.25);
    ctx.quadraticCurveTo(-ow / 4, oh / 2, -ow / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "cat_eye") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, oh * 0.1);
    ctx.lineTo(-ow * 0.35, -oh * 0.35);
    ctx.lineTo(-ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.35, -oh * 0.35);
    ctx.lineTo(ow / 2, oh * 0.1);
    ctx.quadraticCurveTo(ow * 0.25, oh * 0.45, 0, oh * 0.3);
    ctx.quadraticCurveTo(-ow * 0.25, oh * 0.45, -ow / 2, oh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "sport") {
    roundRect(ctx, -ow / 2, -oh / 3, ow, oh * 0.7, 16);
    ctx.fill();
    ctx.stroke();
  } else if (style === "rectangle") {
    const lw = ow * 0.42;
    const lh = oh * 0.55;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "browline") {
    const lw = ow * 0.42;
    const lh = oh * 0.65;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-gap / 2 - lw, -lh / 2, lw, lh * 0.22);
    ctx.fillRect(gap / 2, -lh / 2, lw, lh * 0.22);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "hex") {
    const drawHex = (cx) => {
      const r = oh * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    const gap = ow * 0.08;
    const r = oh * 0.4;
    drawHex(-gap / 2 - r);
    drawHex(gap / 2 + r);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "earring") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, oh * 0.25, oh * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -oh * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "hat") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, oh * 0.15, ow / 2, oh * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -oh * 0.05, ow * 0.35, oh * 0.35, 0, Math.PI, 0);
    ctx.fill();
  } else if (style === "necklace") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-ow / 2, -oh / 2);
    ctx.quadraticCurveTo(0, oh / 2, ow / 2, -oh / 2);
    ctx.stroke();
    ctx.fillStyle = "#E8C547";
    ctx.beginPath();
    ctx.arc(0, oh * 0.35, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "clip_on") {
    const r = oh * 0.38;
    const gap = ow * 0.1;
    ctx.beginPath();
    ctx.ellipse(-gap / 2 - r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(gap / 2 + r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const lw = ow * 0.42;
    const lh = oh * 0.7;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  }
}


/* --- overlay.js --- */
/**
 * Draw one frame at eye mid-point.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} frame
 * @param {number} midX
 * @param {number} midY
 * @param {number} angle rad
 * @param {number} pdPx pupil distance in px
 * @param {number} pdMm user PD mm
 * @param {number} [xOffset=0]
 */
function drawFrameAt(ctx, frame, midX, midY, angle, pdPx, pdMm, xOffset = 0) {
  if (!frame) return;
  const { overlayW, overlayH } = overlaySize(frame, pdPx, pdMm);
  const cat = frame.category;
  ctx.save();
  const yOff =
    cat === "accessory" && frame.style === "hat"
      ? -pdPx * 0.9
      : cat === "accessory" && frame.style === "necklace"
        ? pdPx * 1.35
        : pdPx * 0.02;
  ctx.translate(midX + xOffset, midY + yOff);
  ctx.rotate(angle);
  if (frame.style === "earring") {
    ctx.translate(-pdPx * 1.15, pdPx * 0.5);
    paintFrameShape(ctx, frame, overlayW * 0.35, overlayH * 1.2);
  } else if (frame.style === "hat") {
    paintFrameShape(ctx, frame, overlayW * 1.35, overlayH * 0.9);
  } else if (frame.style === "necklace") {
    paintFrameShape(ctx, frame, overlayW * 0.5, overlayH * 1.4);
  } else {
    paintFrameShape(ctx, frame, overlayW, overlayH);
  }
  ctx.restore();
}

/**
 * Full glasses overlay for A or A|B compare mode.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{left:[number,number], right:[number,number]}} face normalized landmarks
 * @param {object|null} selectedA
 * @param {object|null} selectedB
 * @param {boolean} compareMode
 * @param {number} pdMm
 */
function drawGlassesOverlay(ctx, face, selectedA, selectedB, compareMode, pdMm) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const m = faceMetricsFromLandmarks(face, w, h);

  if (compareMode && selectedA && selectedB) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w / 2, h);
    ctx.clip();
    drawFrameAt(ctx, selectedA, m.midX, m.midY, m.angle, m.pdPx, pdMm, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(w / 2, 0, w / 2, h);
    ctx.clip();
    drawFrameAt(ctx, selectedB, m.midX, m.midY, m.angle, m.pdPx, pdMm, 0);
    ctx.restore();
    ctx.strokeStyle = "#f5c518aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.fillStyle = "#f5c518";
    ctx.font = "12px system-ui";
    ctx.fillText("A", 12, 20);
    ctx.fillText("B", w / 2 + 12, 20);
  } else if (selectedA) {
    drawFrameAt(ctx, selectedA, m.midX, m.midY, m.angle, m.pdPx, pdMm, 0);
  }
}


  var api = {
    VERSION: "0.1.0",
    DEFAULT_PD_MM: DEFAULT_PD_MM,
    estimateFit: estimateFit,
    overlaySize: overlaySize,
    landmarkBox: landmarkBox,
    compareFrames: compareFrames,
    faceMetricsFromLandmarks: faceMetricsFromLandmarks,
    paintFrameShape: paintFrameShape,
    roundRect: roundRect,
    drawFrameAt: drawFrameAt,
    drawGlassesOverlay: drawGlassesOverlay,
    WebViewHints: {
      defaultLoopbackUrl: "http://localhost:8860/",
      queryDesktop: "desktop=1",
      assetPath: "file:///android_asset/beear/index.html",
    },
  };
  global.BeeARTryOn = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
