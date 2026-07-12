import { faceMetricsFromLandmarks, overlaySize } from "./fit.js";
import { paintFrameShape } from "./paint.js";

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
export function drawFrameAt(ctx, frame, midX, midY, angle, pdPx, pdMm, xOffset = 0) {
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
export function drawGlassesOverlay(ctx, face, selectedA, selectedB, compareMode, pdMm) {
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
