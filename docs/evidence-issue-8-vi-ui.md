# Evidence: Vietnamese UI strings toggle (#8)

## What

EN ↔ VI chrome UI toggle for BeeAR web try-on (2D camera page + 3D studio).

## How to verify

```bash
# unit tests
node --test packages/web/tests/i18n.test.mjs

# static demo
node scripts/build-pages.mjs --no-minify
npx --yes serve site -p 4173
# open http://127.0.0.1:4173/
# click the VI button → chrome strings switch to Vietnamese
# click EN → back to English
# reload → language persists via localStorage key `beear_lang`
```

## Acceptance mapping

| Requirement | Implementation |
| --- | --- |
| EN/VI chrome strings | `packages/web/i18n.mjs` + `packages/web/assets/i18n.js` |
| Toggle button | `#btn-lang` on `index.html` and `studio3d.html` |
| Persist language | `localStorage['beear_lang']` via `BeeARI18n.loadLang/saveLang` |
| Filter labels | All / Glasses / Accessories translated |
| Empty states | Catalog empty + gallery empty translated |
| 3D studio parity | Tagline, person, frames, auto-rotate, snapshot, filters |
| Tests | `packages/web/tests/i18n.test.mjs` (CI job `web-i18n`) |

## Screenshots

- Existing VI chrome shot: `docs/screenshots/demo-vi-ui.png`
- After toggle (EN header labels): Catalog / Compare / Snapshot / Camera
- After toggle (VI header labels): Danh mục / So sánh / Chụp / Máy ảnh

## Risk notes

- Language pack is chrome UI only (SKU names remain catalog data).
- No network calls; pure client-side `localStorage`.
- Private mode: load/save lang fails soft and defaults to English.
