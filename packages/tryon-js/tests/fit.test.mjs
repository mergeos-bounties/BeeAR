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
