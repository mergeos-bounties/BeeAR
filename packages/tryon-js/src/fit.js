/** Shared PD / fit math (parity with server beear.tryon). */

export const DEFAULT_PD_MM = 64.0;

/**
 * @param {object} frame catalog frame with fit.width_mm / bridge_mm
 * @param {object} [opts]
 * @param {number} [opts.pupilDistancePx=120]
 * @param {number} [opts.faceWidthPx=220]
 * @param {number} [opts.pdMm=64]
 */
export function estimateFit(frame, opts = {}) {
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
export function overlaySize(frame, pdPx, pdMm = DEFAULT_PD_MM) {
  const widthMm = frame?.fit?.width_mm || 140;
  const pd = clampPd(pdMm);
  const overlayW = (widthMm / pd) * pdPx * 1.15;
  return { overlayW, overlayH: overlayW * 0.42 };
}

/**
 * @param {[number, number]} leftEye normalized 0–1
 * @param {[number, number]} rightEye normalized 0–1
 */
export function landmarkBox(
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

export function compareFrames(frameA, frameB, opts = {}) {
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

export function faceMetricsFromLandmarks(face, canvasW, canvasH) {
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
