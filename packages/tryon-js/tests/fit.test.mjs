import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateFit,
  overlaySize,
  landmarkBox,
  compareFrames,
  DEFAULT_PD_MM,
  REFERENCE_CARD_WIDTH_MM,
  calibrateFromReference,
  estimatePd,
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

test("calibrateFromReference with credit card defaults", () => {
  // Card 200px wide at face distance, pupils 120px apart
  const r = calibrateFromReference(200, 85.6, 120);
  assert.equal(r.ok, true);
  assert.ok(r.pdMm >= 50 && r.pdMm <= 80);
  // pxPerMm should be ~2.34
  assert.ok(r.pxPerMm > 2);
});

test("calibrateFromReference returns default on invalid input", () => {
  const r = calibrateFromReference(0, 85.6, 120);
  assert.equal(r.ok, false);
  assert.equal(r.pdMm, DEFAULT_PD_MM);
});

test("calibrateFromReference with custom reference", () => {
  // Phone width 77mm, measured 180px, pupils 120px
  const r = calibrateFromReference(180, 77, 120);
  assert.equal(r.ok, true);
  assert.ok(r.pdMm >= 50 && r.pdMm <= 80);
});

test("estimatePd computes correctly", () => {
  // 120px pupil distance, 2px per mm → 60mm PD
  const r = estimatePd(120, 2);
  assert.equal(r.ok, true);
  assert.equal(r.pdMm, 60);
});

test("estimatePd returns default on invalid", () => {
  const r = estimatePd(0, 2);
  assert.equal(r.ok, false);
  assert.equal(r.pdMm, DEFAULT_PD_MM);
});

test("estimatePd zero pxPerMm", () => {
  const r = estimatePd(120, 0);
  assert.equal(r.ok, false);
  assert.equal(r.pdMm, DEFAULT_PD_MM);
});

test("calibrateFromReference known PD value", () => {
  // If card is 200px wide (85.6mm) and PD is 64mm, facePx should be ~149.5
  // pxPerMm = 200 / 85.6 ≈ 2.336
  // pdMm = 149.5 / 2.336 ≈ 64
  const r = calibrateFromReference(200, 85.6, 149.5);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.pdMm - 64) < 1);
});
