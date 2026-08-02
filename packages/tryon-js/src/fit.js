/** Shared PD / fit math (parity with server beear.tryon). */

export const DEFAULT_PD_MM = 64.0;

/**
 * MediaPipe Face Mesh landmark indices (refineLandmarks: true → 478 points).
 * Used for real landmark-based fitting vs. geometric fallback.
 */
export const MP_LANDMARKS = {
  // Left eye region
  LEFT_EYE_INNER: 33,
  LEFT_EYE_OUTER: 133,
  LEFT_EYE_UPPER: 7,
  LEFT_EYE_LOWER: 163,
  LEFT_EYE_IRIS: 468,
  // Right eye region
  RIGHT_EYE_INNER: 263,
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_UPPER: 249,
  RIGHT_EYE_LOWER: 387,
  RIGHT_EYE_IRIS: 473,
  // Nose bridge
  NOSE_BRIDGE_TOP: 168,
  NOSE_BRIDGE_CENTER: 6,
  // Nose tip
  NOSE_TIP: 1,
  NOSE_BOTTOM: 2,
  // Face contour (for width estimation)
  FOREHEAD: 10,
  CHIN: 152,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
};

/** Key landmark groups for debug visualization. */
export const MP_LANDMARK_GROUPS = {
  leftEye: [33, 133, 7, 163, 468],
  rightEye: [263, 362, 249, 387, 473],
  noseBridge: [168, 6, 197, 195],
  noseTip: [1, 2, 4, 5],
  faceContour: [10, 152, 234, 454],
};

/**
 * Credit card standard width in mm (ISO/IEC 7810 ID-1).
 */
export const REFERENCE_CARD_WIDTH_MM = 85.6;

/**
 * Calibrate PD (mm) from a known reference object width.
 * @param {number} referencePx - measured width of the reference object in pixels
 * @param {number} referenceMm - known width of the reference object in mm
 * @param {number} facePx - measured inter-pupil distance in pixels
 * @returns {{ pdMm: number, pxPerMm: number, ok: boolean }}
 */
export function calibrateFromReference(referencePx, referenceMm = REFERENCE_CARD_WIDTH_MM, facePx) {
  if (referencePx <= 0 || facePx <= 0) {
    return { pdMm: DEFAULT_PD_MM, pxPerMm: 0, ok: false };
  }
  const pxPerMm = referencePx / referenceMm;
  const pdMm = clampPd(facePx / pxPerMm);
  return { pdMm, pxPerMm: round2(pxPerMm), ok: true };
}

/**
 * Estimate PD from face landmarks and a reference pixel-to-mm ratio.
 * @param {number} facePx - inter-pupil distance in pixels
 * @param {number} pxPerMm - pixels per mm from calibration
 * @returns {{ pdMm: number, ok: boolean }}
 */
export function estimatePd(facePx, pxPerMm) {
  if (facePx <= 0 || pxPerMm <= 0) {
    return { pdMm: DEFAULT_PD_MM, ok: false };
  }
  return { pdMm: clampPd(facePx / pxPerMm), ok: true };
}

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

/**
 * Compute face metrics from full MediaPipe Face Mesh landmarks (478 points).
 * Uses multiple eye, nose, and face contour landmarks for more accurate
 * glasses fitting than the 2-point geometric fallback.
 *
 * @param {Array<{x: number, y: number, z: number}>} landmarks - 478 MediaPipe landmarks
 * @param {number} canvasW
 * @param {number} canvasH
 * @returns {object|null} face metrics with source set to 'mediapipe', or null if invalid
 */
export function faceMetricsFromMesh(landmarks, canvasW, canvasH) {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  const lm = (i) => landmarks[i];

  // Left eye center: average of iris center + inner/outer corners
  const leftEye = {
    x: (lm(MP_LANDMARKS.LEFT_EYE_IRIS).x
      + lm(MP_LANDMARKS.LEFT_EYE_INNER).x
      + lm(MP_LANDMARKS.LEFT_EYE_OUTER).x) / 3,
    y: (lm(MP_LANDMARKS.LEFT_EYE_IRIS).y
      + lm(MP_LANDMARKS.LEFT_EYE_INNER).y
      + lm(MP_LANDMARKS.LEFT_EYE_OUTER).y) / 3,
  };

  // Right eye center: average of iris center + inner/outer corners
  const rightEye = {
    x: (lm(MP_LANDMARKS.RIGHT_EYE_IRIS).x
      + lm(MP_LANDMARKS.RIGHT_EYE_INNER).x
      + lm(MP_LANDMARKS.RIGHT_EYE_OUTER).x) / 3,
    y: (lm(MP_LANDMARKS.RIGHT_EYE_IRIS).y
      + lm(MP_LANDMARKS.RIGHT_EYE_INNER).y
      + lm(MP_LANDMARKS.RIGHT_EYE_OUTER).y) / 3,
  };

  // Nose bridge top (between eyes) — more accurate Y reference for glasses
  const noseBridge = lm(MP_LANDMARKS.NOSE_BRIDGE_TOP);

  // Face width from cheek to cheek (for better overlay sizing)
  const leftCheek = lm(MP_LANDMARKS.LEFT_CHEEK);
  const rightCheek = lm(MP_LANDMARKS.RIGHT_CHEEK);
  const faceWidthPx = Math.hypot(
    (rightCheek.x - leftCheek.x) * canvasW,
    (rightCheek.y - leftCheek.y) * canvasH,
  );

  // Convert to pixel coords
  const lx = leftEye.x * canvasW;
  const ly = leftEye.y * canvasH;
  const rx = rightEye.x * canvasW;
  const ry = rightEye.y * canvasH;

  // Pupil distance
  const pdPx = Math.hypot(rx - lx, ry - ly) || 100;

  // Mid point: use eye midpoint for X, nose bridge for Y (better vertical centering)
  const midX = (lx + rx) / 2;
  const midY = noseBridge.y * canvasH;

  // Head tilt angle from eye line
  const angle = Math.atan2(ry - ly, rx - lx);

  // Face height for sizing reference
  const chin = lm(MP_LANDMARKS.CHIN);
  const forehead = lm(MP_LANDMARKS.FOREHEAD);
  const faceHeightPx = Math.hypot(
    (chin.x - forehead.x) * canvasW,
    (chin.y - forehead.y) * canvasH,
  );

  // Confidence: iris landmarks detected means real tracking
  const irisConf = (
    lm(MP_LANDMARKS.LEFT_EYE_IRIS).x > 0.001
    && lm(MP_LANDMARKS.RIGHT_EYE_IRIS).x > 0.001
  ) ? 0.95 : 0.7;

  return {
    left: [lx, ly],
    right: [rx, ry],
    midX,
    midY,
    pdPx,
    angle,
    faceWidthPx,
    faceHeightPx,
    noseBridgeX: noseBridge.x * canvasW,
    noseBridgeY: noseBridge.y * canvasH,
    source: 'mediapipe',
    confidence: irisConf,
    landmarkCount: landmarks.length,
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
