/**
 * Copy BeeAR web shell + @beear/tryon IIFE into the Android library assets
 * so hosts can load file:///android_asset/beear/ offline.
 *
 * Usage: node packages/android/scripts/sync-web-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidRoot = path.join(__dirname, "..");
const repoRoot = path.join(androidRoot, "..", "..");
const tryonJs = path.join(repoRoot, "packages", "tryon-js");
const web = path.join(repoRoot, "packages", "web");
const dest = path.join(androidRoot, "beear-webview", "src", "main", "assets", "beear");

// rebuild IIFE
execFileSync(process.execPath, [path.join(tryonJs, "scripts", "build-iife.mjs")], {
  stdio: "inherit",
});

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
copyDir(web, dest);

// ensure tryon lib is present under assets
const libSrc = path.join(tryonJs, "dist", "beear-tryon.js");
fs.mkdirSync(path.join(dest, "assets"), { recursive: true });
fs.copyFileSync(libSrc, path.join(dest, "assets", "beear-tryon.js"));

// Rewrite absolute /assets/ paths to relative for file:// WebView
const indexPath = path.join(dest, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replaceAll('href="/assets/', 'href="assets/')
  .replaceAll('src="/assets/', 'src="assets/')
  .replaceAll('src="https://cdn.jsdelivr.net', 'data-src="https://cdn.jsdelivr.net');
// note: MediaPipe CDN becomes optional offline (data-src disables auto load)
fs.writeFileSync(indexPath, html);

console.log("Synced web →", dest);
