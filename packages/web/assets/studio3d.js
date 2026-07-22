/**
 * BeeAR 3D Studio — Meshy characters + glasses GLB try-on (correct parenting & face fit).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("view");
const catalogEl = document.getElementById("catalog");
const metaEl = document.getElementById("meta");
const scaleEl = document.getElementById("scale");
const yoffEl = document.getElementById("yoff");
const zoffEl = document.getElementById("zoff");
const scaleVal = document.getElementById("scale-val");
const yVal = document.getElementById("y-val");
const zVal = document.getElementById("z-val");
const btnAuto = document.getElementById("btn-auto");
const btnSnap = document.getElementById("btn-snap");
const filterEl = document.getElementById("filter");
const personSelect = document.getElementById("person-select");
const I18n = globalThis.BeeARI18n;
let lang = I18n ? I18n.loadLang() : "en";

function t(key) {
  return I18n ? I18n.t(lang, key) : key;
}

function applyLang() {
  document.documentElement.lang = lang === "vi" ? "vi" : "en";
  if (I18n) I18n.saveLang(lang);

  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  setText("studio-tagline", "studioTagline");
  setText("btn-back-2d", "studioBack");
  setText("btn-snap", "snap");
  setText("lbl-person", "person");
  setText("lbl-frames3d", "frames3d");
  setText("hint", "hintStudio");
  setText("badge", "badgeStudio");
  setText("stage-load-text", "loadingStudio");

  const lblChar = document.getElementById("lbl-character");
  if (lblChar && lblChar.childNodes[0]) {
    lblChar.childNodes[0].textContent = t("character") + " ";
  }
  const lblFit = document.getElementById("lbl-fit-scale");
  if (lblFit && lblFit.childNodes[0]) {
    lblFit.childNodes[0].textContent = t("fitScale") + " ";
  }
  const lblY = document.getElementById("lbl-y-offset");
  if (lblY && lblY.childNodes[0]) {
    lblY.childNodes[0].textContent = t("yOffset") + " ";
  }
  const lblZ = document.getElementById("lbl-z-depth");
  if (lblZ && lblZ.childNodes[0]) {
    lblZ.childNodes[0].textContent = t("zDepth") + " ";
  }

  if (filterEl) {
    for (const opt of filterEl.options) {
      if (opt.value === "") opt.textContent = t("filterAll");
      else if (opt.value === "glasses") opt.textContent = t("filterGlasses");
      else if (opt.value === "accessory") opt.textContent = t("filterAccessory");
    }
  }

  const btnLang = document.getElementById("btn-lang");
  if (btnLang) {
    btnLang.textContent = I18n ? I18n.langButtonLabel(lang) : lang === "en" ? "VI" : "EN";
    btnLang.setAttribute(
      "aria-label",
      lang === "en" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh",
    );
    btnLang.setAttribute("title", btnLang.getAttribute("aria-label"));
  }

  if (btnAuto) {
    btnAuto.textContent = state.auto ? t("autoRotateOn") : t("autoRotateOff");
  }
  if (!state.selected && metaEl) {
    metaEl.textContent = t("loadingPerson");
  }
}

const state = {
  frames: [],
  selected: null,
  person: null,
  personRoot: new THREE.Group(),
  glasses: null,
  glassesCache: {},
  personCache: {},
  loading: {},
  auto: true,
  fitScale: 1,
  yOffset: 0,
  zOffset: 0,
  personModels: [],
  activePerson: null,
  faceAnchor: new THREE.Vector3(0, 1.55, 0.92),
  headWidth: 0.16,
  // Procedural GLBs face +Z (lenses toward camera); Meshy may override via catalog
  glassesYaw: 0,
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 960 / 640, 0.05, 100);
camera.position.set(0.45, 1.2, 3.2);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.95, 0);
controls.enableDamping = true;
controls.minDistance = 0.8;
controls.maxDistance = 12;
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const key = new THREE.DirectionalLight(0xfff2dd, 1.25);
key.position.set(2.5, 4, 3);
scene.add(key);
const fill = new THREE.DirectionalLight(0x88aaff, 0.55);
fill.position.set(-3, 2, 1);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.45);
rim.position.set(0, 2, -3);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 48),
  new THREE.MeshStandardMaterial({ color: 0x121a2c, metalness: 0.1, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

const ped = new THREE.Mesh(
  new THREE.CylinderGeometry(0.9, 1.0, 0.12, 40),
  new THREE.MeshStandardMaterial({ color: 0x1a2438, metalness: 0.2, roughness: 0.75 }),
);
ped.position.y = -0.06;
scene.add(ped);

const loader = new GLTFLoader();
const glassesRoot = new THREE.Group();
glassesRoot.name = "glasses_root";
state.personRoot.name = "person_root";
// Glasses must stay parented under person for auto-rotate / orbit lock.
state.personRoot.add(glassesRoot);
scene.add(state.personRoot);

function ensureGlassesRoot() {
  if (glassesRoot.parent !== state.personRoot) {
    state.personRoot.add(glassesRoot);
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const rw = Math.max(320, Math.floor(rect.width));
  const rh = Math.max(240, Math.floor(rect.height || rw * 0.66));
  renderer.setSize(rw, rh, false);
  camera.aspect = rw / rh;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function isStaticDemo() {
  return !!(globalThis.BeeARStatic && globalThis.BeeARStatic.detectStatic());
}

function absUrl(u) {
  if (!u) return u;
  try {
    return new URL(u, location.href).href;
  } catch (_) {
    return u;
  }
}

function setStageLoad(msg) {
  const el = document.getElementById("stage-load");
  const tx = document.getElementById("stage-load-text");
  if (!el) return;
  if (msg == null) {
    el.classList.add("hidden");
    return;
  }
  if (tx) tx.textContent = msg;
  el.classList.remove("hidden");
}

function isHeavyAsset(meta) {
  if (!meta) return false;
  if (meta.heavy === true) return true;
  return /meshy|person_female|person_male/i.test(String(meta.glb || meta.glb_url || meta.id || ""));
}

async function api(path) {
  const S = globalThis.BeeARStatic;
  if (S && S.detectStatic()) {
    return S.staticApi(path);
  }
  const r = await fetch(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function prepareModel(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Center in local space without destroying nested transforms
  root.position.x -= center.x;
  root.position.y -= center.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  root.userData.size = box2.getSize(new THREE.Vector3());
  root.userData.box = box2.clone();
  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = false;
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          m.side = THREE.DoubleSide;
          m.needsUpdate = true;
        });
      }
    }
  });
  return root;
}

/**
 * Orient glasses so the wide axis is X (left-right) and temples extend toward -Z
 * (into the face from the camera looking +Z → face).
 */
function orientGlasses(model) {
  const size = model.userData.size || new THREE.Vector3(1, 0.5, 1);
  // If depth > width, mesh is likely sideways — rotate 90° around Y
  if (size.z > size.x * 1.15) {
    model.rotation.y += Math.PI / 2;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    model.userData.size = box.getSize(new THREE.Vector3());
  }
  // Prefer facing camera: if still deeper than tall, ok for temples
  model.userData.baseYaw = state.glassesYaw;
}

function placePerson(model, meta) {
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const minY = box.min.y;
  model.position.y -= minY;
  model.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(model);
  const h = Math.max(0.01, box.max.y - box.min.y);
  const depth = Math.max(0.01, box.max.z - box.min.z);
  const width = Math.max(0.01, box.max.x - box.min.x);

  // Normalize full-body height toward ~1.7m so anchors stay stable across Meshy exports
  const kind = meta?.kind || "full_body";
  let scaleMul = Number(meta?.scale) || 1;
  if (kind === "full_body" && h > 0.5) {
    const targetH = 1.7;
    scaleMul *= targetH / h;
    model.scale.multiplyScalar(targetH / h);
    model.position.y = 0;
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
  }

  const h2 = box.max.y - box.min.y;
  const depth2 = box.max.z - box.min.z;
  const width2 = box.max.x - box.min.x;

  const mode = meta?.anchor_mode || (kind === "bust" ? "fixed" : "bbox_head");
  if (mode === "fixed" && meta?.anchor) {
    state.faceAnchor.set(
      Number(meta.anchor.x) || 0,
      Number(meta.anchor.y) || h2 * 0.9,
      Number(meta.anchor.z) || depth2 * 0.35,
    );
  } else {
    // Eye line ~87.5% of height; push to front of face bbox (+Z facing camera)
    const eyeY = box.min.y + h2 * (Number(meta?.eye_height_ratio) || 0.875);
    const faceZ = box.max.z - depth2 * 0.08;
    state.faceAnchor.set(0, eyeY, faceZ);
  }

  // Head width: full-body bbox is shoulders; bust bbox is head+shoulders
  if (kind === "bust") {
    state.headWidth = Math.max(0.14, Math.min(0.36, width2 * 0.42));
  } else {
    state.headWidth = Math.max(0.145, Math.min(0.2, width2 * 0.3));
  }

  const midY = (box.min.y + box.max.y) * 0.52;
  controls.target.set(0, midY, 0);
  const dist = Math.max(1.6, h2 * 1.55);
  camera.position.set(dist * 0.16, midY + h2 * 0.04, dist);
  controls.update();

  ensureGlassesRoot();
  glassesRoot.position.copy(state.faceAnchor);
  applyFit();
  model.userData.fitScaleMul = scaleMul;
}

function clearPerson() {
  // CRITICAL: never remove glassesRoot — only person meshes
  const keep = glassesRoot;
  [...state.personRoot.children].forEach((child) => {
    if (child !== keep) state.personRoot.remove(child);
  });
  ensureGlassesRoot();
  state.person = null;
}

function loadPerson(personMeta) {
  const meta = personMeta || state.activePerson;
  if (!meta) return Promise.resolve(false);
  state.activePerson = meta;
  const url = absUrl(meta.glb_url || `./catalog/glb/${meta.glb}`);
  const heavy = isHeavyAsset(meta);
  metaEl.textContent = `Loading ${meta.name}…`;
  setStageLoad(
    heavy
      ? `Loading ${meta.name}… (~14MB full-body — first load is slow on Pages)`
      : `Loading ${meta.name}…`,
  );

  const mount = (source) => {
    clearPerson();
    const inst = source.clone(true);
    // Clones need a fresh centered bbox
    inst.position.set(0, 0, 0);
    inst.rotation.set(0, 0, 0);
    inst.scale.set(1, 1, 1);
    prepareModel(inst);
    state.personRoot.add(inst);
    ensureGlassesRoot();
    state.person = inst;
    placePerson(inst, meta);
    metaEl.textContent = `${meta.name} ready · pick glasses`;
    setStageLoad(null);
    if (state.selected) loadGlasses(state.selected);
  };

  if (state.personCache[meta.id]) {
    mount(state.personCache[meta.id]);
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const model = prepareModel(gltf.scene);
        state.personCache[meta.id] = model;
        mount(model);
        resolve(true);
      },
      (ev) => {
        if (!ev?.total) return;
        const pct = Math.min(99, Math.round((100 * ev.loaded) / ev.total));
        setStageLoad(`Loading ${meta.name}… ${pct}%`);
        metaEl.textContent = `Loading ${meta.name}… ${pct}%`;
      },
      (err) => {
        console.error(err);
        metaEl.textContent = `Failed to load person: ${meta.glb} (${url})`;
        setStageLoad(`Failed: ${meta.glb}`);
        resolve(false);
      },
    );
  });
}

function loadGlasses(frame) {
  if (!frame?.glb_url && !frame?.glb) {
    metaEl.textContent = `${frame?.name || "Frame"} has no GLB`;
    return;
  }
  const url = absUrl(frame.glb_url || `./catalog/glb/${frame.glb}`);
  if (state.glassesCache[frame.id]) {
    attachGlasses(state.glassesCache[frame.id], frame);
    return;
  }
  if (state.loading[frame.id]) return;
  state.loading[frame.id] = true;
  const heavy = isHeavyAsset(frame);
  metaEl.textContent = `Loading glasses ${frame.name}…`;
  if (heavy) setStageLoad(`Loading glasses ${frame.name}… (~11MB HD mesh)`);
  loader.load(
    url,
    (gltf) => {
      const model = prepareModel(gltf.scene.clone(true));
      orientGlasses(model);
      state.glassesCache[frame.id] = model;
      state.loading[frame.id] = false;
      attachGlasses(model, frame);
      if (heavy) setStageLoad(null);
    },
    (ev) => {
      if (!heavy || !ev?.total) return;
      const pct = Math.min(99, Math.round((100 * ev.loaded) / ev.total));
      setStageLoad(`Loading glasses ${frame.name}… ${pct}%`);
    },
    (err) => {
      console.error(err);
      state.loading[frame.id] = false;
      metaEl.textContent = `GLB failed: ${frame.glb || frame.id}`;
      if (heavy) setStageLoad(`GLB failed: ${frame.glb || frame.id}`);
    },
  );
}

function attachGlasses(model, frame) {
  ensureGlassesRoot();
  while (glassesRoot.children.length) glassesRoot.remove(glassesRoot.children[0]);
  const inst = model.clone(true);
  // preserve userData size from cache
  inst.userData.size = model.userData.size?.clone?.() || model.userData.size;
  inst.userData.baseYaw = model.userData.baseYaw ?? state.glassesYaw;
  state.glasses = inst;
  glassesRoot.add(inst);
  // Apply catalog studio_fit defaults if user hasn't moved sliders much
  const sf = frame.studio_fit || {};
  if (sf.scale != null && Math.abs(state.fitScale - 1) < 0.02) {
    state.fitScale = Number(sf.scale) || 1;
    scaleEl.value = String(state.fitScale);
    scaleVal.textContent = state.fitScale.toFixed(2);
  }
  if (sf.y != null && Math.abs(state.yOffset) < 0.005) {
    state.yOffset = Number(sf.y) || 0;
    yoffEl.value = String(state.yOffset);
    yVal.textContent = state.yOffset.toFixed(2);
  }
  if (sf.z != null && Math.abs(state.zOffset) < 0.005) {
    state.zOffset = Number(sf.z) || 0;
    zoffEl.value = String(state.zOffset);
    zVal.textContent = state.zOffset.toFixed(2);
  }
  applyFit();
  const personName = state.activePerson?.name || "person";
  metaEl.textContent = `${frame.name} on ${personName} · scale ${state.fitScale.toFixed(2)} · 3D locked`;
}

function applyFit() {
  ensureGlassesRoot();
  glassesRoot.position.set(state.faceAnchor.x, state.faceAnchor.y, state.faceAnchor.z);
  if (!state.glasses) return;

  const size = state.glasses.userData.size || new THREE.Vector3(1.6, 0.5, 1);
  const targetW = state.headWidth * 1.12 * state.fitScale;
  const s = targetW / Math.max(size.x, 0.01);
  state.glasses.scale.setScalar(s);
  // Face camera (person faces +Z / studio camera): glasses lenses toward +Z
  const yaw = state.glasses.userData.baseYaw ?? state.glassesYaw;
  state.glasses.rotation.set(-0.05, yaw, 0);
  // Local offset on face: slight down on nose bridge, slight out toward camera
  state.glasses.position.set(0, state.yOffset - 0.005, state.zOffset + 0.015);
}

function renderPersonSelect() {
  personSelect.innerHTML = "";
  const list = state.personModels.length
    ? state.personModels
    : [
        { id: "person_female", name: "Female (Meshy)", glb: "person_female.glb", default: true },
        { id: "person_male", name: "Male (Meshy)", glb: "person_male.glb" },
        { id: "person_bust", name: "Studio Bust", glb: "person_bust.glb" },
      ];
  list.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name + (p.kind === "full_body" ? " · full body" : "");
    personSelect.appendChild(opt);
  });
  const def = list.find((p) => p.default) || list[0];
  if (def) personSelect.value = def.id;
}

function renderCatalog() {
  catalogEl.innerHTML = "";
  const cat = filterEl.value;
  const list = state.frames.filter((f) => !cat || f.category === cat);
  list.forEach((f) => {
    const el = document.createElement("div");
    el.className = "sku" + (state.selected?.id === f.id ? " on" : "");
    el.innerHTML = `
      <img src="${f.svg_url || ""}" alt="" onerror="this.style.opacity=0.2" />
      <div>
        <h3>${f.name}</h3>
        <p>${f.style || ""} · ${f.glb || f.has_glb ? "GLB" : "2D"} · $${((f.price_cents || 0) / 100).toFixed(2)}</p>
      </div>`;
    el.onclick = () => selectFrame(f.id);
    catalogEl.appendChild(el);
  });
}

function selectFrame(id) {
  const f = state.frames.find((x) => x.id === id);
  if (!f) return;
  state.selected = f;
  // Reset manual offsets lightly when switching SKU so studio_fit can apply
  state.fitScale = 1;
  state.yOffset = 0;
  state.zOffset = 0;
  scaleEl.value = "1";
  yoffEl.value = "0";
  zoffEl.value = "0";
  scaleVal.textContent = "1.00";
  yVal.textContent = "0.00";
  zVal.textContent = "0.00";
  renderCatalog();
  loadGlasses(f);
}

async function loadCatalog() {
  setStageLoad("Loading catalog…");
  const data = await api("/api/catalog");
  state.frames = (data.frames || []).filter((f) => f.glb_url || f.glb || f.has_glb);
  if (!state.frames.length) state.frames = data.frames || [];
  try {
    const full = await api("/api/catalog/meta");
    if (full.person_models?.length) state.personModels = full.person_models;
  } catch (_) {
    if (data.person_models?.length) state.personModels = data.person_models;
  }
  renderPersonSelect();
  renderCatalog();
  // Prefer light featured frames on Pages; Meshy HD is opt-in (~11MB)
  const first =
    state.frames.find((f) => f.featured && (f.glb_url || f.glb) && !isHeavyAsset(f)) ||
    state.frames.find((f) => (f.glb_url || f.glb) && !isHeavyAsset(f)) ||
    state.frames.find((f) => f.featured && (f.glb_url || f.glb)) ||
    state.frames.find((f) => f.glb_url || f.glb) ||
    state.frames[0];
  if (first) selectFrame(first.id);
}

personSelect.addEventListener("change", () => {
  const meta = state.personModels.find((p) => p.id === personSelect.value);
  if (meta) loadPerson(meta);
});

scaleEl.addEventListener("input", () => {
  state.fitScale = Number(scaleEl.value);
  scaleVal.textContent = state.fitScale.toFixed(2);
  applyFit();
});
yoffEl.addEventListener("input", () => {
  state.yOffset = Number(yoffEl.value);
  yVal.textContent = state.yOffset.toFixed(2);
  applyFit();
});
zoffEl.addEventListener("input", () => {
  state.zOffset = Number(zoffEl.value);
  zVal.textContent = state.zOffset.toFixed(2);
  applyFit();
});
filterEl.addEventListener("change", renderCatalog);
btnAuto.addEventListener("click", () => {
  state.auto = !state.auto;
  btnAuto.classList.toggle("active", state.auto);
  btnAuto.textContent = state.auto ? t("autoRotateOn") : t("autoRotateOff");
});
btnSnap.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `beear-3d-${state.activePerson?.id || "person"}-${state.selected?.id || "snap"}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
});

const btnLang = document.getElementById("btn-lang");
if (btnLang) {
  btnLang.addEventListener("click", () => {
    lang = I18n ? I18n.toggleLang(lang) : lang === "en" ? "vi" : "en";
    applyLang();
  });
}

let t0 = performance.now();
function tick(now) {
  const dt = (now - t0) / 1000;
  t0 = now;
  if (state.auto && state.personRoot) {
    state.personRoot.rotation.y += dt * 0.28;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function main() {
  resize();
  ensureGlassesRoot();
  btnAuto.classList.add("active");
  applyLang();
  setStageLoad(t("loadingStudio"));
  await loadCatalog();
  // Default bust (tiny GLB) for fast Pages first paint; full-body Meshy still in dropdown
  const def =
    state.personModels.find((p) => p.default) ||
    state.personModels.find((p) => p.id === "person_bust") ||
    state.personModels.find((p) => !isHeavyAsset(p)) ||
    state.personModels.find((p) => p.id === "person_female") ||
    state.personModels[0];
  if (def) {
    personSelect.value = def.id;
    await loadPerson(def);
  } else {
    setStageLoad(null);
  }
  requestAnimationFrame(tick);
}

main().catch((e) => {
  metaEl.textContent = String(e);
  setStageLoad(String(e?.message || e));
  console.error(e);
});
