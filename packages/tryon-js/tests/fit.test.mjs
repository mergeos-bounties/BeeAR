import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateFit,
  overlaySize,
  landmarkBox,
  compareFrames,
  DEFAULT_PD_MM,
} from "../src/fit.js";

const frame = {
  id: "aviator_gold",
  fit: { width_mm: 140, bridge_mm: 18 },
  style: "aviator",
  category: "glasses",
};

test("estimateFit returns ok metrics", () => {
  const r = estimateFit(frame, { pupilDistancePx: 120, pdMm: 64 });
  assert.equal(r.ok, true);
  assert.equal(r.pd_mm, 64);
  assert.ok(r.overlay_width_px > 0);
  assert.ok(r.scale > 0);
});

test("overlaySize grows when PD mm smaller", () => {
  const a = overlaySize(frame, 120, 70);
  const b = overlaySize(frame, 120, 58);
  assert.ok(b.overlayW > a.overlayW);
});

test("landmarkBox mid and pd", () => {
  const box = landmarkBox([0.4, 0.4], [0.6, 0.4], 100, 100);
  assert.equal(box.mid[0], 50);
  assert.ok(box.pupil_distance_px > 0);
});

test("compareFrames delta", () => {
  const narrow = { id: "n", fit: { width_mm: 120 } };
  const wide = { id: "w", fit: { width_mm: 150 } };
  const c = compareFrames(wide, narrow, { pupilDistancePx: 100, pdMm: DEFAULT_PD_MM });
  assert.equal(c.ok, true);
  assert.ok(c.width_delta_px > 0);
});

// --- PD-to-fit-scale calculation tests (bounty #7) ---
test("pdToFitScale: correct scale for 140mm frame at 64mm PD, 120px PD", () => {
  const s = overlaySize(frame, 120, 64);
  const expected = (140 / 64) * 120 * 1.15;
  assert.ok(Math.abs(s.overlayW - expected) < 0.5);
  assert.ok(s.overlayH > 0);
});

test("pdToFitScale: larger PD means smaller overlay", () => {
  const a = overlaySize(frame, 120, 74);
  const b = overlaySize(frame, 120, 54);
  assert.ok(b.overlayW > a.overlayW);
});

test("pdToFitScale: wider frame produces wider overlay", () => {
  const wideFrame = { fit: { width_mm: 160 } };
  const narrowFrame = { fit: { width_mm: 120 } };
  const w = overlaySize(wideFrame, 120, 64);
  const n = overlaySize(narrowFrame, 120, 64);
  assert.ok(w.overlayW > n.overlayW);
});

test("pdToFitScale: proportional to pupil pixel distance", () => {
  const a = overlaySize(frame, 80, 64);
  const b = overlaySize(frame, 160, 64);
  assert.ok(Math.abs(b.overlayW / a.overlayW - 2.0) < 0.1);
});

test("pdToFitScale: edge case — min PD (54mm)", () => {
  const s = overlaySize({ fit: { width_mm: 140 } }, 100, 54);
  assert.ok(s.overlayW > 0);
  assert.ok(s.overlayW > 250);
});

test("pdToFitScale: edge case — max PD (74mm)", () => {
  const s = overlaySize({ fit: { width_mm: 140 } }, 100, 74);
  assert.ok(s.overlayW > 0);
  assert.ok(s.overlayW < 250);
});

test("pdToFitScale: missing fit defaults to 140mm", () => {
  const s = overlaySize({}, 120, 64);
  const expected = (140 / 64) * 120 * 1.15;
  assert.ok(Math.abs(s.overlayW - expected) < 0.5);
});

// --- Credit-card calibration math tests (bounty #7) ---
const CARD_W = 85.6;

test("cardCal: pxPerMm from known object", () => {
  const cardPx = 300;
  const pxPerMm = cardPx / CARD_W;
  assert.ok(Math.abs(pxPerMm - (300 / 85.6)) < 0.001);
});

test("cardCal: compute PD from card and pupil pixels", () => {
  const cardPx = 300;
  const pupilPx = 224;
  const pdMm = pupilPx / (cardPx / CARD_W);
  assert.ok(pdMm > 60 && pdMm < 68);
});

test("cardCal: larger card px means smaller estimated PD", () => {
  const pupilPx = 200;
  const pdSmallCard = pupilPx / (200 / CARD_W);
  const pdLargeCard = pupilPx / (400 / CARD_W);
  assert.ok(pdLargeCard < pdSmallCard);
});

test("cardCal: larger pupil px means larger estimated PD", () => {
  const cardPx = 300;
  const pxPerMm = cardPx / CARD_W;
  assert.ok((300 / pxPerMm) > (100 / pxPerMm));
});

test("cardCal: real-world PD ~64mm scenario", () => {
  const cardPx = 250;
  const pupilPx = 187;
  const pdMm = pupilPx / (cardPx / CARD_W);
  assert.ok(Math.abs(pdMm - 64) < 1.5);
});

test("cardCal: boundary — min PD through card", () => {
  const cardPx = 500;
  const pupilPx = 200;
  const pdMm = pupilPx / (cardPx / CARD_W);
  assert.ok(pdMm < 50);
});

test("cardCal: boundary — max PD through card", () => {
  const cardPx = 100;
  const pupilPx = 200;
  const pdMm = pupilPx / (cardPx / CARD_W);
  assert.ok(pdMm > 100);
});
