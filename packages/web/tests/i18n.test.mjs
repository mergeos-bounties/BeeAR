/**
 * Smoke tests for BeeAR chrome EN/VI i18n packs (issue #8).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function extractPackKeys(src, pack) {
  const re = new RegExp(`${pack}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},?\\n\\s*(?:vi|en|[a-z]+):`, "m");
  const m = src.match(re) || src.match(new RegExp(`${pack}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},?\\n\\s*\\};`, "m"));
  assert.ok(m, `could not find I18N.${pack} pack`);
  const body = m[1];
  const keys = [...body.matchAll(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:/gm)].map((x) => x[1]);
  return new Set(keys);
}

describe("web chrome i18n", () => {
  const app = readFileSync(join(root, "assets/app.js"), "utf8");
  const studio = readFileSync(join(root, "assets/studio3d.js"), "utf8");
  const indexHtml = readFileSync(join(root, "index.html"), "utf8");
  const studioHtml = readFileSync(join(root, "studio3d.html"), "utf8");

  it("app.js EN/VI packs share the same keys", () => {
    const en = extractPackKeys(app, "en");
    const vi = extractPackKeys(app, "vi");
    assert.deepEqual([...en].sort(), [...vi].sort());
    assert.ok(en.has("tagline"));
    assert.ok(en.has("filterAll"));
    assert.ok(en.has("emptyCatalog"));
    assert.ok(en.size >= 20);
  });

  it("studio3d.js EN/VI packs share the same keys", () => {
    const en = extractPackKeys(studio, "en");
    const vi = extractPackKeys(studio, "vi");
    assert.deepEqual([...en].sort(), [...vi].sort());
    assert.ok(en.has("tagline"));
    assert.ok(en.has("autoOn"));
  });

  it("persists language via beear_lang localStorage key", () => {
    assert.match(app, /localStorage\.getItem\("beear_lang"\)/);
    assert.match(app, /localStorage\.setItem\("beear_lang"/);
    assert.match(studio, /localStorage\.getItem\("beear_lang"\)/);
    assert.match(studio, /localStorage\.setItem\("beear_lang"/);
  });

  it("chrome has language toggle buttons", () => {
    assert.match(indexHtml, /id="btn-lang"/);
    assert.match(studioHtml, /id="btn-lang"/);
    assert.match(app, /btn-lang/);
    assert.match(studio, /btnLang|btn-lang/);
  });

  it("applyLang updates documentElement.lang", () => {
    assert.match(app, /document\.documentElement\.lang\s*=\s*lang/);
    assert.match(studio, /document\.documentElement\.lang\s*=\s*lang/);
  });
});
