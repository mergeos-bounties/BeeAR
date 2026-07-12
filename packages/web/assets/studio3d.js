/**
 * BeeAR 3D Studio — person bust + glasses GLB try-on (Three.js).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("view");
const catalogEl = document.getElementById("catalog");
const metaEl = document.getElementById("meta");
const scaleEl = document.getElementById("scale");
const yoffEl = document.getElementById("yoff");
const scaleVal = document.getElementById("scale-val");
const yVal = document.getElementById("y-val");
const btnAuto = document.getElementById("btn-auto");
const btnSnap = document.getElementById("btn-snap");
const filterEl = document.getElementById("filter");

const state = {
  frames: [],
  selected: null,
  person: null,
  glasses: null,
  glassesCache: {},
  loading: {},
  auto: true,
  fitScale: 1,
  yOffset: 0,
  personModels: [],
  faceAnchor: new THREE.Vector3(0, 1.55, 0.92),
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
camera.position.set(0.35, 1.55, 3.6);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.15, 0);
controls.enableDamping = true;
controls.minDistance = 1.6;
controls.maxDistance = 7;
controls.update();

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const key = new THREE.DirectionalLight(0xfff2dd, 1.15);
key.position.set(2.5, 4, 3);
scene.add(key);
const fill = new THREE.DirectionalLight(0x88aaff, 0.45);
fill.position.set(-3, 2, 1);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.35);
rim.position.set(0, 2, -3);
scene.add(rim);

// ground disc
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2.2, 48),
  new THREE.MeshStandardMaterial({ color: 0x121a2c, metalness: 0.1, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.55;
scene.add(ground);

// soft pedestal
const ped = new THREE.Mesh(
  new THREE.CylinderGeometry(0.85, 0.95, 0.18, 40),
  new THREE.MeshStandardMaterial({ color: 0x1a2438, metalness: 0.2, roughness: 0.75 }),
);
ped.position.y = -0.42;
scene.add(ped);

const loader = new GLTFLoader();
const glassesRoot = new THREE.Group();
glassesRoot.name = "glasses_root";
scene.add(glassesRoot);

function resize() {
  const w = canvas.clientWidth || 960;
  const h = Math.max(320, Math.round(w * 0.66));
  canvas.width = w * (window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1);
  // keep CSS size; renderer uses drawing buffer
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
  root.userData.size = size;
  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return root;
}

function loadPerson() {
  metaEl.textContent = "Loading 3D person bust…";
  return new Promise((resolve) => {
    loader.load(
      "/catalog/glb/person_bust.glb",
      (gltf) => {
        const model = prepareModel(gltf.scene);
        // lift so feet sit on pedestal
        const box = new THREE.Box3().setFromObject(model);
        const minY = box.min.y;
        model.position.y -= minY + 0.35;
        state.person = model;
        scene.add(model);
        // face anchor relative to person after lift
        state.faceAnchor.set(0, 1.55 - minY - 0.35 + 0.08, 0.9);
        glassesRoot.position.copy(state.faceAnchor);
        metaEl.textContent = "3D person ready · pick glasses";
        resolve(true);
      },
      undefined,
      () => {
        metaEl.textContent = "Failed to load person_bust.glb — using placeholder";
        // placeholder sphere head
        const g = new THREE.Group();
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.95, 32, 24),
          new THREE.MeshStandardMaterial({ color: 0xebbca2 }),
        );
        head.position.y = 1.55;
        g.add(head);
        state.person = g;
        scene.add(g);
        state.faceAnchor.set(0, 1.58, 0.9);
        glassesRoot.position.copy(state.faceAnchor);
        resolve(false);
      },
    );
  });
}

function loadGlasses(frame) {
  if (!frame?.glb_url) {
    metaEl.textContent = `${frame?.name || "Frame"} has no GLB`;
    return;
  }
  if (state.glassesCache[frame.id]) {
    attachGlasses(state.glassesCache[frame.id], frame);
    return;
  }
  if (state.loading[frame.id]) return;
  state.loading[frame.id] = true;
  metaEl.textContent = `Loading 3D ${frame.name}…`;
  loader.load(
    frame.glb_url,
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
  metaEl.textContent = `${frame.name} · 3D GLB on person · scale ${state.fitScale.toFixed(2)}`;
}

function applyFit() {
  if (!state.glasses) return;
  const size = state.glasses.userData.size || new THREE.Vector3(1.6, 0.5, 1);
  // target glasses width ~ 1.55 world units (matches bust face)
  const targetW = 1.55 * state.fitScale;
  const s = targetW / Math.max(size.x, 0.01);
  state.glasses.scale.setScalar(s);
  state.glasses.position.set(0, state.yOffset, 0.02);
  state.glasses.rotation.set(-0.05, 0, 0);
  glassesRoot.position.set(
    state.faceAnchor.x,
    state.faceAnchor.y + state.yOffset * 0.2,
    state.faceAnchor.z,
  );
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
        <p>${f.style || ""} · ${f.glb ? "GLB" : "2D"} · $${((f.price_cents || 0) / 100).toFixed(2)}</p>
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
  const data = await api("/api/catalog?category=glasses");
  state.frames = (data.frames || []).filter((f) => f.glb_url || f.glb);
  if (!state.frames.length) {
    const all = await api("/api/catalog");
    state.frames = all.frames || [];
  }
  // person models metadata (optional)
  try {
    const full = await api("/api/catalog/meta");
    if (full.person_models) state.personModels = full.person_models;
  } catch (_) {
    /* optional */
  }
  renderCatalog();
  const first = state.frames.find((f) => f.glb_url) || state.frames[0];
  if (first) selectFrame(first.id);
}

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
filterEl.addEventListener("change", renderCatalog);
btnAuto.addEventListener("click", () => {
  state.auto = !state.auto;
  btnAuto.classList.toggle("active", state.auto);
  btnAuto.textContent = state.auto ? "Auto-rotate ON" : "Auto-rotate OFF";
});
btnSnap.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `beear-3d-${state.selected?.id || "snap"}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
});

let t0 = performance.now();
function tick(now) {
  const dt = (now - t0) / 1000;
  t0 = now;
  if (state.auto && state.person) {
    state.person.rotation.y += dt * 0.35;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function main() {
  resize();
  btnAuto.classList.add("active");
  btnAuto.textContent = "Auto-rotate ON";
  await loadPerson();
  await loadCatalog();
  requestAnimationFrame(tick);
}

main().catch((e) => {
  metaEl.textContent = String(e);
  console.error(e);
});
