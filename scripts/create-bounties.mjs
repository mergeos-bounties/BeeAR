import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const REPO = 'mergeos-bounties/BeeAR';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function ensureLabel(name, color, description) {
  try {
    sh(`gh label create ${JSON.stringify(name)} --repo ${REPO} --color ${color} --description ${JSON.stringify(description)}`);
  } catch {
    try {
      sh(`gh label edit ${JSON.stringify(name)} --repo ${REPO} --color ${color} --description ${JSON.stringify(description)}`);
    } catch { /* ignore */ }
  }
}

function createIssue(title, body, labels) {
  const dir = mkdtempSync(join(tmpdir(), 'beear-'));
  const file = join(dir, 'body.md');
  try {
    writeFileSync(file, body, 'utf8');
    const labelFlags = labels.map((l) => `--label ${JSON.stringify(l)}`).join(' ');
    console.log(sh(`gh issue create --repo ${REPO} --title ${JSON.stringify(title)} --body-file ${JSON.stringify(file)} ${labelFlags}`));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const row of [
  ['bounty', '5319E7', 'Eligible for MergeOS MRG bounty'],
  ['bounty: feature', 'A2EEEF', 'Feature bounty'],
  ['web', '0E8A16', 'Web try-on'],
  ['desktop', '1D76DB', 'Windows desktop'],
  ['android', 'A2EEEF', 'Android'],
  ['ar', 'D93F0B', 'AR / face tracking'],
  ['catalog', 'FBCA04', 'Frames catalog'],
  ['reward:25-mrg', 'FEF2C0', '25 MRG'],
  ['reward:50-mrg', 'FEF2C0', '50 MRG'],
  ['reward:100-mrg', 'FEF2C0', '100 MRG'],
  ['reward:200-mrg', 'FEF2C0', '200 MRG'],
  ['good first issue', '7057FF', 'Good first issue'],
  ['documentation', '0075CA', 'Docs'],
]) ensureLabel(...row);

const footer = `

## Claim

1. Star https://github.com/mergeos-bounties/BeeAR and https://github.com/mergeos-bounties/mergeos  
2. Comment: \`I claim this bounty\`  
3. MergeOS [Claim #1](https://github.com/mergeos-bounties/mergeos/issues/1)  
4. PR to **BeeAR** with \`Fixes #<n>\`

Policy: [docs/BOUNTY.md](../blob/master/docs/BOUNTY.md)
`;

const issues = [
  { title: '[25 MRG] Docs: privacy + camera consent notice', labels: ['bounty', 'bounty: feature', 'documentation', 'reward:25-mrg', 'good first issue'],
    body: `## 25 MRG\n\nAdd docs/PRIVACY.md and UI banner when camera starts.\n\n## Acceptance\n- [ ] Doc + UI note\n${footer}` },
  { title: '[50 MRG] Web: MediaPipe Face Mesh real landmarks', labels: ['bounty', 'bounty: feature', 'web', 'ar', 'reward:50-mrg'],
    body: `## 50 MRG\n\nOptional MediaPipe CDN path; keep geometric fallback.\n\n## Acceptance\n- [ ] Screenshots camera + demo\n- [ ] Fallback still works offline\n${footer}` },
  { title: '[50 MRG] Catalog: 8 more frames (JSON + SVG)', labels: ['bounty', 'bounty: feature', 'catalog', 'reward:50-mrg'],
    body: `## 50 MRG\n\nExpand packages/catalog with new SKUs and SVG assets.\n\n## Acceptance\n- [ ] Tests still pass\n- [ ] Screenshots in PR\n${footer}` },
  { title: '[100 MRG] Web: GLB 3D frame renderer (Three.js)', labels: ['bounty', 'bounty: feature', 'web', 'ar', 'reward:100-mrg'],
    body: `## 100 MRG\n\nOptional 3D path for at least one SKU.\n\n## Acceptance\n- [ ] Demo mode works without GPU crash\n${footer}` },
  { title: '[50 MRG] Desktop: electron-builder Windows installer', labels: ['bounty', 'bounty: feature', 'desktop', 'reward:50-mrg'],
    body: `## 50 MRG\n\nNSIS or portable package for packages/desktop.\n\n## Acceptance\n- [ ] Build instructions + artifact\n${footer}` },
  { title: '[100 MRG] Android: full Gradle project + camera permission UX', labels: ['bounty', 'bounty: feature', 'android', 'reward:100-mrg'],
    body: `## 100 MRG\n\nComplete Android Studio project with assembleDebug.\n\n## Acceptance\n- [ ] Emulator screenshots\n${footer}` },
  { title: '[50 MRG] PD calibration wizard (slider + measure)', labels: ['bounty', 'bounty: feature', 'web', 'reward:50-mrg'],
    body: `## 50 MRG\n\nUser sets PD mm; fit scale updates.\n\n## Acceptance\n- [ ] UI + unit tests for scale math\n${footer}` },
  { title: '[25 MRG] Vietnamese UI strings toggle', labels: ['bounty', 'bounty: feature', 'web', 'reward:25-mrg', 'good first issue'],
    body: `## 25 MRG\n\ni18n EN/VI for chrome.\n\n## Acceptance\n- [ ] Screenshots\n${footer}` },
  { title: '[50 MRG] Snapshot gallery + share link stub', labels: ['bounty', 'bounty: feature', 'web', 'reward:50-mrg'],
    body: `## 50 MRG\n\nSave snapshots in localStorage; list + delete.\n\n## Acceptance\n- [ ] Works offline\n${footer}` },
  { title: '[100 MRG] Server: wishlist + session API', labels: ['bounty', 'bounty: feature', 'catalog', 'reward:100-mrg'],
    body: `## 100 MRG\n\nPOST /api/sessions with selected frames (in-memory ok).\n\n## Acceptance\n- [ ] Tests\n${footer}` },
  { title: '[200 MRG] E2E video: demo face + 3 frames + snapshot', labels: ['bounty', 'bounty: feature', 'web', 'reward:200-mrg'],
    body: `## 200 MRG\n\nEvidence video/screenshots on Windows.\n\n## Acceptance\n- [ ] Repro steps in PR\n${footer}` },
  { title: '[50 MRG] Accessories: ear/hat anchor improvements', labels: ['bounty', 'bounty: feature', 'ar', 'reward:50-mrg'],
    body: `## 50 MRG\n\nBetter placement for earring + cap SKUs.\n\n## Acceptance\n- [ ] Screenshots demo face\n${footer}` },
  { title: '[25 MRG] CI: cache pip + catalog JSON schema check', labels: ['bounty', 'bounty: feature', 'documentation', 'reward:25-mrg', 'good first issue'],
    body: `## 25 MRG\n\nHarden workflows + validate frames.json fields.\n\n## Acceptance\n- [ ] CI green\n${footer}` },
  { title: '[50 MRG] Compare mode: two frames side-by-side', labels: ['bounty', 'bounty: feature', 'web', 'reward:50-mrg'],
    body: `## 50 MRG\n\nSplit view try-on comparison.\n\n## Acceptance\n- [ ] Screenshots\n${footer}` },
];

for (const issue of issues) {
  createIssue(issue.title, issue.body, issue.labels);
}
console.log(`Created ${issues.length} issues on ${REPO}`);
