/**
 * Build and package BeeAR web + Android libraries for GitHub Release.
 *
 * Outputs → dist/release/
 *   beear-tryon-0.3.0.js
 *   beear-tryon-0.3.0.tgz          (npm pack)
 *   beear-webview-0.3.0.aar
 *   beear-webview-0.3.0-sources.jar (if available)
 *   CHECKSUMS.sha256
 *   RELEASE_NOTES.md
 *
 * Usage (repo root):
 *   node scripts/release-libs.mjs
 *   node scripts/release-libs.mjs --publish   # gh release create
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tryonJs = path.join(root, "packages", "tryon-js");
const android = path.join(root, "packages", "android");
const pkgJson = JSON.parse(fs.readFileSync(path.join(tryonJs, "package.json"), "utf8"));
const version = pkgJson.version || "0.4.0";
const tag = `libs-v${version}`;
const outDir = path.join(root, "dist", "release");
const publish = process.argv.includes("--publish");
const publishNpm = process.argv.includes("--npm");
const publishMaven = process.argv.includes("--maven");

function run(cmd, opts = {}) {
  console.log(">", cmd);
  execSync(cmd, { stdio: "inherit", cwd: opts.cwd || root, env: { ...process.env, ...opts.env } });
}

function sha256(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("  +", path.relative(root, dest), fs.statSync(dest).size, "bytes");
}

// clean
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// --- Web / JS lib ---
console.log("\n=== @beear/tryon (web) ===");
run("npm test", { cwd: tryonJs });
run("npm run build", { cwd: tryonJs });

const iife = path.join(tryonJs, "dist", "beear-tryon.js");
const iifeVer = path.join(tryonJs, "dist", `beear-tryon-${version}.js`);
if (!fs.existsSync(iife)) throw new Error("missing dist/beear-tryon.js");
copy(iife, path.join(outDir, "beear-tryon.js"));
copy(fs.existsSync(iifeVer) ? iifeVer : iife, path.join(outDir, `beear-tryon-${version}.js`));

// npm pack (Windows: npm.cmd)
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const packOut = execFileSync(npmBin, ["pack", "--pack-destination", outDir], {
  cwd: tryonJs,
  encoding: "utf8",
  shell: process.platform === "win32",
}).trim();
console.log("npm pack:", packOut);

// --- Sync assets into Android AAR ---
console.log("\n=== Sync web assets → AAR ===");
run("node packages/android/scripts/sync-web-assets.mjs");

// --- Android AAR ---
console.log("\n=== beear-webview AAR ===");
const isWin = process.platform === "win32";
const gradlew = isWin ? "gradlew.bat" : "./gradlew";
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
if (sdk && fs.existsSync(sdk)) {
  const lp = path.join(android, "local.properties");
  if (!fs.existsSync(lp)) {
    const escaped = sdk.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
    fs.writeFileSync(lp, `sdk.dir=${escaped}\n`);
  }
}

run(`${gradlew} :beear-webview:assembleRelease :beear-webview:publishReleasePublicationToLocalReleaseRepository :beear-webview:test --quiet`, {
  cwd: android,
});

const aarCandidates = [
  path.join(android, "beear-webview", "build", "outputs", "aar", "beear-webview-release.aar"),
];
const aarSrc = aarCandidates.find((p) => fs.existsSync(p));
if (!aarSrc) throw new Error("AAR not found under beear-webview/build/outputs/aar");
copy(aarSrc, path.join(outDir, `beear-webview-${version}.aar`));
copy(aarSrc, path.join(outDir, "beear-webview-release.aar"));

// sources jar from maven local repo if present
const sourcesJar = path.join(
  android,
  "build",
  "repo",
  "com",
  "beear",
  "beear-webview",
  version,
  `beear-webview-${version}-sources.jar`,
);
if (fs.existsSync(sourcesJar)) {
  copy(sourcesJar, path.join(outDir, `beear-webview-${version}-sources.jar`));
}

// pom
const pom = path.join(
  android,
  "build",
  "repo",
  "com",
  "beear",
  "beear-webview",
  version,
  `beear-webview-${version}.pom`,
);
if (fs.existsSync(pom)) {
  copy(pom, path.join(outDir, `beear-webview-${version}.pom`));
}

// --- CHECKSUMS ---
const checksumLines = [];
for (const name of fs.readdirSync(outDir).sort()) {
  const fp = path.join(outDir, name);
  if (!fs.statSync(fp).isFile()) continue;
  if (name === "CHECKSUMS.sha256" || name === "RELEASE_NOTES.md") continue;
  checksumLines.push(`${sha256(fp)}  ${name}`);
}
fs.writeFileSync(path.join(outDir, "CHECKSUMS.sha256"), checksumLines.join("\n") + "\n");

// --- Release notes ---
const notes = `# BeeAR libraries ${version}

Reusable **web** and **Android** libraries for virtual try-on (glasses / accessories).

## Artifacts

| File | Platform | Install |
| --- | --- | --- |
| \`beear-tryon-${version}.js\` | Browser / WebView | \`<script src="…">\` → \`window.BeeARTryOn\` |
| \`beear-tryon-*.tgz\` | Node / bundlers | \`npm install ./beear-tryon-*.tgz\` or from GitHub Release |
| \`beear-webview-${version}.aar\` | Android | \`implementation(files("libs/beear-webview-${version}.aar"))\` |

## Web — \`@beear/tryon\`

\`\`\`html
<script src="beear-tryon-${version}.js"></script>
<script>
  const fit = BeeARTryOn.estimateFit(frame, { pupilDistancePx: 64, faceWidthPx: 180 });
  console.log(BeeARTryOn.VERSION); // ${version}
</script>
\`\`\`

ESM (from package):

\`\`\`js
import { estimateFit, drawGlassesOverlay } from "@beear/tryon";
\`\`\`

## Android — \`beear-webview\`

\`\`\`kotlin
// build.gradle.kts
implementation(files("libs/beear-webview-${version}.aar"))
// + androidx.activity / fragment / appcompat (see packages/android/beear-webview/build.gradle.kts)

val view = BeeARWebView(this)
setContentView(view)
view.attach(this, BeeARConfig.loopback()) // or BeeARConfig.offlineAssets()
view.loadTryOn()
\`\`\`

Offline assets are **bundled inside the AAR** (\`file:///android_asset/beear/\`).

## Verify

\`\`\`bash
sha256sum -c CHECKSUMS.sha256
\`\`\`

## Source

- JS: \`packages/tryon-js\`
- Android: \`packages/android/beear-webview\`
- Repo: https://github.com/mergeos-bounties/BeeAR

Tag: \`${tag}\` · MIT · MergeOS / ThanhTrucSolutions
`;
fs.writeFileSync(path.join(outDir, "RELEASE_NOTES.md"), notes);

console.log("\n=== Artifacts ===");
for (const name of fs.readdirSync(outDir).sort()) {
  const fp = path.join(outDir, name);
  if (fs.statSync(fp).isFile()) {
    console.log(`  ${name.padEnd(42)} ${fs.statSync(fp).size}`);
  }
}
console.log("\nOutput:", outDir);

if (publish) {
  console.log("\n=== GitHub Release", tag, "===");
  const assets = fs
    .readdirSync(outDir)
    .filter((n) => fs.statSync(path.join(outDir, n)).isFile())
    .map((n) => path.join(outDir, n));

  // create or update release
  try {
    execSync(`gh release view ${tag}`, { cwd: root, stdio: "pipe" });
    console.log("Release exists — uploading assets…");
    for (const a of assets) {
      try {
        execSync(`gh release upload ${tag} "${a}" --clobber`, { cwd: root, stdio: "inherit" });
      } catch {
        /* continue */
      }
    }
  } catch {
    const assetArgs = assets.map((a) => `"${a}"`).join(" ");
    run(
      `gh release create ${tag} ${assetArgs} --title "BeeAR libs ${version}" --notes-file dist/release/RELEASE_NOTES.md`,
    );
  }
  console.log("Published:", `https://github.com/mergeos-bounties/BeeAR/releases/tag/${tag}`);
}

// --- npm publish (@beear/tryon) ---
// Requires NPM_TOKEN (npmjs.org) or GITHUB_TOKEN for GitHub Packages (see --npm-github).
if (publishNpm) {
  console.log("\n=== npm publish @beear/tryon ===");
  const token = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN || "";
  if (!token) {
    console.error("NPM_TOKEN / NODE_AUTH_TOKEN not set — skip npmjs.org publish.");
    console.error("Use: $env:NPM_TOKEN='…'; node scripts/release-libs.mjs --npm");
  } else {
    const npmrc = path.join(tryonJs, ".npmrc");
    fs.writeFileSync(
      npmrc,
      `//registry.npmjs.org/:_authToken=${token}\nalways-auth=true\n`,
      "utf8",
    );
    try {
      run(`${npmBin} publish --access public`, { cwd: tryonJs });
      console.log("npmjs.org: https://www.npmjs.com/package/@beear/tryon");
    } finally {
      try {
        fs.unlinkSync(npmrc);
      } catch {
        /* ignore */
      }
    }
  }
}

if (process.argv.includes("--npm-github")) {
  console.log("\n=== GitHub Packages npm (@mergeos-bounties/tryon) ===");
  const ghToken =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    execSync("gh auth token", { encoding: "utf8" }).trim();
  const actor = process.env.GITHUB_ACTOR || "TUPM96";
  // GitHub requires package scope == org/user name
  const orig = JSON.parse(fs.readFileSync(path.join(tryonJs, "package.json"), "utf8"));
  const ghPkg = {
    ...orig,
    name: "@mergeos-bounties/tryon",
    publishConfig: { registry: "https://npm.pkg.github.com" },
  };
  const bak = path.join(tryonJs, "package.json.bak-publish");
  fs.copyFileSync(path.join(tryonJs, "package.json"), bak);
  fs.writeFileSync(path.join(tryonJs, "package.json"), JSON.stringify(ghPkg, null, 2) + "\n");
  const npmrc = path.join(tryonJs, ".npmrc");
  fs.writeFileSync(
    npmrc,
    `@mergeos-bounties:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${ghToken}\nalways-auth=true\n`,
    "utf8",
  );
  try {
    run(`${npmBin} publish --access public`, {
      cwd: tryonJs,
      env: { GITHUB_TOKEN: ghToken, NODE_AUTH_TOKEN: ghToken },
    });
    console.log("GitHub Packages: https://github.com/orgs/mergeos-bounties/packages");
  } catch (err) {
    console.error("GitHub Packages npm publish failed:", err.message || err);
  } finally {
    fs.copyFileSync(bak, path.join(tryonJs, "package.json"));
    fs.unlinkSync(bak);
    try {
      fs.unlinkSync(npmrc);
    } catch {
      /* ignore */
    }
  }
}

if (publishMaven) {
  console.log("\n=== Maven GitHub Packages (com.beear:beear-webview) ===");
  const ghToken =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    execSync("gh auth token", { encoding: "utf8" }).trim();
  const actor = process.env.GITHUB_ACTOR || execSync("gh api user -q .login", { encoding: "utf8" }).trim();
  run(
    `${gradlew} :beear-webview:publishReleasePublicationToGitHubPackagesRepository --quiet`,
    {
      cwd: android,
      env: { GITHUB_TOKEN: ghToken, GITHUB_ACTOR: actor, GH_TOKEN: ghToken },
    },
  );
  console.log("Maven: https://github.com/mergeos-bounties/BeeAR/packages");
}
