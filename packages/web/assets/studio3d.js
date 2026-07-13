/**
 * BeeAR 3D Studio — real character GLBs (female/male/bust) + glasses try-on.
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
  headWidth: 0.28,
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

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const key = new THREE.DirectionalLight(0xfff2dd, 1.2);
key.position.set(2.5, 4, 3);
scene.add(key);
const fill = new THREE.DirectionalLight(0x88aaff, 0.5);
fill.position.set(-3, 2, 1);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.4);
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
// Parent glasses under person so orbit/auto-rotate stay locked on the face.
state.personRoot.name = "person_root";
state.personRoot.add(glassesRoot);
scene.add(state.personRoot);

function resize() {
  const rect = canvas.getBoundingClientRect();
  const rw = Math.max(320, Math.floor(rect.width));
  const rh = Math.max(240, Math.floor(rect.height || rw * 0.66));
  renderer.setSize(rw, rh, false);
  camera.aspect = rw / rh;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

async function api(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function prepareModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.userData.size = size.clone();
  root.userData.box = box.clone();
  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = false;
      if (o.material) {
        o.material.side = THREE.FrontSide;
        o.material.needsUpdate = true;
      }
    }
  });
  return root;
}

function placePerson(model, meta) {
  // feet on ground (y=0)
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const minY = box.min.y;
  model.position.y -= minY;
  model.updateMatrixWorld(true);

  const after = new THREE.Box3().setFromObject(model);
  const h = after.max.y - after.min.y;
  const depth = after.max.z - after.min.z;
  const width = after.max.x - after.min.x;

  const mode = meta?.anchor_mode || (meta?.kind === "bust" ? "fixed" : "bbox_head");
  if (mode === "fixed" && meta?.anchor) {
    state.faceAnchor.set(
      Number(meta.anchor.x) || 0,
      Number(meta.anchor.y) || h * 0.9,
      Number(meta.anchor.z) || depth * 0.2,
    );
  } else {
    // Head / face region for full-body Meshy humanoids
    state.faceAnchor.set(
      0,
      after.min.y + h * 0.905,
      after.max.z * 0.55 + depth * 0.08,
    );
  }

  // Head width estimate for glasses scale
  state.headWidth = Math.max(0.14, Math.min(0.42, width * (meta?.kind === "bust" ? 0.55 : 0.18)));

  // Frame camera for full body or bust
  const midY = (after.min.y + after.max.y) * 0.55;
  controls.target.set(0, midY, 0);
  const dist = Math.max(1.8, h * 1.65);
  camera.position.set(dist * 0.18, midY + h * 0.05, dist);
  controls.update();

  glassesRoot.position.copy(state.faceAnchor);
  applyFit();
}

function clearPerson() {
  while (state.personRoot.children.length) {
    state.personRoot.remove(state.personRoot.children[0]);
  }
  state.person = null;
}

function loadPerson(personMeta) {
  const meta = personMeta || state.activePerson;
  if (!meta) return Promise.resolve(false);
  state.activePerson = meta;
  const url = meta.glb_url || `/catalog/glb/${meta.glb}`;
  metaEl.textContent = `Loading ${meta.name}…`;

  if (state.personCache[meta.id]) {
    clearPerson();
    const model = state.personCache[meta.id].clone(true);
    // recompute size on clone
    prepareModel(model);
    state.personRoot.add(model);
    state.person = model;
    placePerson(model, meta);
    metaEl.textContent = `${meta.name} ready · pick glasses`;
    if (state.selected) loadGlasses(state.selected);
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const model = prepareModel(gltf.scene);
        state.personCache[meta.id] = model;
        clearPerson();
        const inst = model.clone(true);
        prepareModel(inst);
        state.personRoot.add(inst);
        state.person = inst;
        placePerson(inst, meta);
        metaEl.textContent = `${meta.name} ready · pick glasses`;
        if (state.selected) loadGlasses(state.selected);
        resolve(true);
      },
      undefined,
      (err) => {
        console.error(err);
        metaEl.textContent = `Failed to load ${meta.glb}`;
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
  const url = frame.glb_url || `/catalog/glb/${frame.glb}`;
  if (state.glassesCache[frame.id]) {
    attachGlasses(state.glassesCache[frame.id], frame);
    return;
  }
  if (state.loading[frame.id]) return;
  state.loading[frame.id] = true;
  metaEl.textContent = `Loading glasses ${frame.name}…`;
  loader.load(
    url,
    (gltf) => {
      const model = prepareModel(gltf.scene.clone(true));
      state.glassesCache[frame.id] = model;
      state.loading[frame.id] = false;
      attachGlasses(model, frame);
    },
    undefined,
    () => {
      state.loading[frame.id] = false;
      metaEl.textContent = `GLB failed: ${frame.glb || frame.id}`;
    },
  );
}

function attachGlasses(model, frame) {
  while (glassesRoot.children.length) glassesRoot.remove(glassesRoot.children[0]);
  state.glasses = model;
  glassesRoot.add(model);
  applyFit();
  const personName = state.activePerson?.name || "person";
  metaEl.textContent = `${frame.name} on ${personName} · scale ${state.fitScale.toFixed(2)}`;
}

function applyFit() {
  if (!state.glasses) {
    glassesRoot.position.copy(state.faceAnchor);
    return;
  }
  const size = state.glasses.userData.size || new THREE.Vector3(1.6, 0.5, 1);
  const targetW = state.headWidth * 1.15 * state.fitScale;
  const s = targetW / Math.max(size.x, 0.01);
  state.glasses.scale.setScalar(s);
  state.glasses.position.set(0, state.yOffset, state.zOffset);
  state.glasses.rotation.set(-0.04, 0, 0);
  glassesRoot.position.set(
    state.faceAnchor.x,
    state.faceAnchor.y + state.yOffset * 0.15,
    state.faceAnchor.z,
  );
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
  renderCatalog();
  loadGlasses(f);
}

async function loadCatalog() {
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
  const first =
    state.frames.find((f) => f.featured && (f.glb_url || f.glb)) ||
    state.frames.find((f) => (f.id || "").includes("meshy") && (f.glb_url || f.glb)) ||
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
  btnAuto.textContent = state.auto ? "Auto-rotate ON" : "Auto-rotate OFF";
});
btnSnap.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `beear-3d-${state.activePerson?.id || "person"}-${state.selected?.id || "snap"}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
});

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
  btnAuto.classList.add("active");
  btnAuto.textContent = "Auto-rotate ON";
  await loadCatalog();
  const def =
    state.personModels.find((p) => p.default) ||
    state.personModels.find((p) => p.id === "person_female") ||
    state.personModels[0];
  if (def) {
    personSelect.value = def.id;
    await loadPerson(def);
  }
  requestAnimationFrame(tick);
}

main().catch((e) => {
  metaEl.textContent = String(e);
  console.error(e);
});
