import test from "node:test";
import assert from "node:assert/strict";
import {
  I18N,
  normalizeLang,
  t,
  toggleLang,
  langButtonLabel,
  i18nKeys,
  missingViKeys,
  missingEnKeys,
} from "../i18n.mjs";

test("en and vi packs expose the same keys", () => {
  assert.deepEqual(missingViKeys(), []);
  assert.deepEqual(missingEnKeys(), []);
  assert.ok(i18nKeys().length >= 30);
});

test("normalizeLang only accepts en|vi", () => {
  assert.equal(normalizeLang("vi"), "vi");
  assert.equal(normalizeLang("en"), "en");
  assert.equal(normalizeLang("fr"), "en");
  assert.equal(normalizeLang(undefined), "en");
});

test("toggleLang flips en ↔ vi", () => {
  assert.equal(toggleLang("en"), "vi");
  assert.equal(toggleLang("vi"), "en");
});

test("lang button shows the target language", () => {
  assert.equal(langButtonLabel("en"), "VI");
  assert.equal(langButtonLabel("vi"), "EN");
});

test("t returns Vietnamese chrome strings", () => {
  assert.equal(t("vi", "catalog"), "Danh mục");
  assert.equal(t("vi", "compare"), "So sánh");
  assert.equal(t("vi", "filterAll"), "Tất cả");
  assert.equal(t("en", "catalog"), "Catalog");
});

test("t falls back to en / key", () => {
  assert.equal(t("vi", "not_a_real_key_xyz"), "not_a_real_key_xyz");
  assert.ok(t("xx", "tagline").length > 0);
});

test("critical chrome keys are non-empty in both languages", () => {
  const critical = [
    "tagline",
    "catalog",
    "cam",
    "demo",
    "compare",
    "snap",
    "gallery",
    "consentTitle",
    "filterAll",
    "filterGlasses",
    "emptyFilter",
    "studioTagline",
    "autoRotateOn",
  ];
  for (const key of critical) {
    assert.ok(I18N.en[key] && I18N.en[key].trim(), `en.${key}`);
    assert.ok(I18N.vi[key] && I18N.vi[key].trim(), `vi.${key}`);
    assert.notEqual(I18N.en[key], I18N.vi[key], `${key} should differ EN vs VI`);
  }
});
