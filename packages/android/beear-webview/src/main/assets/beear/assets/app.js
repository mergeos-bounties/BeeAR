/* BeeAR try-on client v0.3 — host app over @beear/tryon lib (web + WebView) */
const TryOn = globalThis.BeeARTryOn;
if (!TryOn) {
  console.error("BeeARTryOn lib missing — load /assets/beear-tryon.js first");
}

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const catalogEl = document.getElementById("catalog");
const metaEl = document.getElementById("meta");
const hintEl = document.getElementById("hint");
const trackBadge = document.getElementById("track-badge");
const galleryEl = document.getElementById("gallery");
const consentEl = document.getElementById("consent");

let frames = [];
let selected = null;
let selectedB = null; // compare second frame
let stream = null;
let mode = "idle"; // idle | camera | demo
let compareMode = false;
let svgCache = {};
let raf = 0;
let pdMm = TryOn?.DEFAULT_PD_MM || 64;
let lang = "en";
let tracking = "geometric"; // geometric | mediapipe
let faceMesh = null;
let meshBusy = false;
let sessionId = null;

let face = { left: [0.38, 0.42], right: [0.62, 0.42], t: 0, source: "geometric" };

/** Photoreal demo faces (generated assets) with eye landmarks in image 0–1 coords */
const DEMO_FACES = [
  {
    id: "face-01",
    label: "Demo A",
    src: "/assets/demo-faces/face-01.jpg",
    // calibrated for front portrait (pupil centers, image 0–1)
    left: [0.385, 0.428],
    right: [0.615, 0.428],
  },
  {
    id: "face-02",
    label: "Demo B",
    src: "/assets/demo-faces/face-02.jpg",
    left: [0.38, 0.422],
    right: [0.62, 0.422],
  },
];
let demoFaceIndex = 0;
let demoImages = {}; // id -> HTMLImageElement
let demoReady = false;

const I18N = {
  en: {
    tagline: "Virtual try-on · glasses & accessories",
    catalog: "Catalog",
    pd: "PD (mm)",
    pdHint: "Calibrate pupil distance for better fit scale",
    select: "Select a SKU",
    cam: "📷 Camera",
    demo: "Demo photo",
    demoNext: "Next face",
    compare: "Compare",
    snap: "Snapshot",
    gallery: "Gallery",
    consentTitle: "Camera consent",
    consentBody:
      "BeeAR uses the camera only in your browser for try-on. Video is not uploaded to the server.",
    consentOk: "Allow & start",
    consentDemo: "Use demo photo",
    hintIdle: "Start camera or use Demo photo · pick a frame",
    hintDemo: "Photoreal demo face · PD slider · Compare A/B · Next face",
    hintCam: "Camera live",
    trackGeo: "tracking: geometric",
    trackMp: "tracking: mediapipe",
    trackDemo: "tracking: demo photo",
  },
  vi: {
    tagline: "Thử kính & phụ kiện ảo",
    catalog: "Danh mục",
    pd: "Khoảng đồng tử PD (mm)",
    pdHint: "Hiệu chỉnh PD để scale kính chính xác hơn",
    select: "Chọn mẫu",
    cam: "📷 Camera",
    demo: "Ảnh demo",
    demoNext: "Đổi mặt",
    compare: "So sánh",
    snap: "Chụp",
    gallery: "Thư viện",
    consentTitle: "Đồng ý camera",
    consentBody:
      "BeeAR chỉ dùng camera trên trình duyệt để thử đồ. Video không gửi lên server.",
    consentOk: "Cho phép & bắt đầu",
    consentDemo: "Dùng ảnh demo",
    hintIdle: "Bật camera hoặc ảnh demo · chọn khung",
    hintDemo: "Ảnh người demo · chỉnh PD · So sánh · Đổi mặt",
    hintCam: "Camera đang bật",
    trackGeo: "tracking: hình học",
    trackMp: "tracking: mediapipe",
    trackDemo: "tracking: ảnh demo",
  },
};

function t(k) {
  return (I18N[lang] || I18N.en)[k] || k;
}

function applyLang() {
  document.getElementById("tagline").textContent = t("tagline");
  document.getElementById("lbl-catalog").textContent = t("catalog");
  document.getElementById("lbl-pd").childNodes[0].textContent = t("pd") + " ";
  document.getElementById("pd-hint").textContent = t("pdHint");
  document.getElementById("btn-cam").textContent = t("cam");
  document.getElementById("btn-demo").textContent = t("demo");
  const btnNext = document.getElementById("btn-demo-next");
  if (btnNext) btnNext.textContent = t("demoNext");
  document.getElementById("btn-compare").textContent = t("compare");
  document.getElementById("btn-snap").textContent = t("snap");
  document.getElementById("btn-gallery").textContent = t("gallery");
  document.getElementById("btn-lang").textContent = lang === "en" ? "VI" : "EN";
  document.getElementById("consent-title").textContent = t("consentTitle");
  document.getElementById("consent-body").textContent = t("consentBody");
  document.getElementById("consent-ok").textContent = t("consentOk");
  document.getElementById("consent-demo").textContent = t("consentDemo");
  if (mode === "demo") trackBadge.textContent = t("trackDemo");
  else trackBadge.textContent = tracking === "mediapipe" ? t("trackMp") : t("trackGeo");
  if (!selected) metaEl.textContent = t("select");
}

function loadDemoImages() {
  return Promise.all(
    DEMO_FACES.map(
      (f) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            demoImages[f.id] = img;
            resolve(true);
          };
          img.onerror = () => resolve(false);
          img.src = f.src;
        }),
    ),
  ).then(() => {
    demoReady = DEMO_FACES.some((f) => demoImages[f.id]);
    return demoReady;
  });
}

/** Draw image cover-fit into canvas; return draw rect for landmark mapping */
function drawImageCover(img, w, h) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw, dh, dx, dy;
  if (ir > cr) {
    dh = h;
    dw = h * ir;
    dx = (w - dw) / 2;
    dy = 0;
  } else {
    dw = w;
    dh = w / ir;
    dx = 0;
    dy = (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  return { dx, dy, dw, dh };
}

async function api(path, opts) {
  const r = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function ensureSession() {
  if (sessionId) return sessionId;
  try {
    const s = await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ frame_ids: [], note: "web" }),
    });
    sessionId = s.id;
  } catch (_) {
    sessionId = null;
  }
  return sessionId;
}

async function loadCatalog(category = "") {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  const data = await api("/api/catalog" + q);
  frames = data.frames || [];
  renderCatalog();
  if (!selected && frames[0]) selectFrame(frames[0].id, "A");
}

function renderCatalog() {
  catalogEl.innerHTML = "";
  frames.forEach((f) => {
    const el = document.createElement("div");
    let cls = "sku";
    if (selected && selected.id === f.id) cls += " on";
    if (compareMode && selectedB && selectedB.id === f.id) cls += " on-b";
    el.className = cls;
    el.innerHTML = `
      <img src="${f.svg_url || ""}" alt="" onerror="this.className='ph';this.removeAttribute('src')" />
      <div>
        <h3>${f.name}</h3>
        <p>${f.brand} · ${f.style} · $${((f.price_cents || 0) / 100).toFixed(2)}</p>
      </div>`;
    el.onclick = () => {
      if (compareMode && selected && selected.id !== f.id) selectFrame(f.id, "B");
      else selectFrame(f.id, "A");
    };
    catalogEl.appendChild(el);
  });
}

async function selectFrame(id, slot = "A") {
  const f = frames.find((x) => x.id === id) || (await api("/api/catalog/" + id));
  if (slot === "B") selectedB = f;
  else selected = f;
  renderCatalog();
  updateMeta();
  if (f.svg_url && !svgCache[id]) {
    try {
      svgCache[id] = await (await fetch(f.svg_url)).text();
    } catch (_) {
      svgCache[id] = null;
    }
  }
  const sid = await ensureSession();
  if (sid && slot === "A") {
    try {
      await api(`/api/sessions/${sid}/wishlist`, {
        method: "POST",
        body: JSON.stringify({ frame_id: id }),
      });
    } catch (_) {}
  }
}

function updateMeta() {
  if (!selected) {
    metaEl.textContent = t("select");
    return;
  }
  let text = `${selected.name} · ${selected.fit?.width_mm || "?"}mm · PD ${pdMm}mm`;
  if (compareMode && selectedB) text += `  |  B: ${selectedB.name}`;
  metaEl.textContent = text;
}

function drawDemoFace(w, h) {
  const def = DEMO_FACES[demoFaceIndex % DEMO_FACES.length];
  const img = demoImages[def.id];
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, w, h);

  if (img && img.complete && img.naturalWidth) {
    const { dx, dy, dw, dh } = drawImageCover(img, w, h);
    // Map image-normalized eye landmarks → canvas-normalized
    const lx = dx + def.left[0] * dw;
    const ly = dy + def.left[1] * dh;
    const rx = dx + def.right[0] * dw;
    const ry = dy + def.right[1] * dh;
    face.left = [lx / w, ly / h];
    face.right = [rx / w, ry / h];
    face.source = "demo-photo";
    return;
  }

  // Fallback cartoon only if photos failed to load
  const cx = w / 2,
    cy = h * 0.48;
  const rx = w * 0.22,
    ry = h * 0.32;
  const g = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, ry);
  g.addColorStop(0, "#f0c7a8");
  g.addColorStop(1, "#d4a07a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  const eyeY = cy - 10;
  const eyeDX = rx * 0.42;
  if (face.source !== "mediapipe") {
    face.left = [(cx - eyeDX) / w, eyeY / h];
    face.right = [(cx + eyeDX) / w, eyeY / h];
    face.source = "demo-fallback";
  }
}

/** Delegate overlay drawing to @beear/tryon lib */
function drawGlasses() {
  if (!TryOn) return;
  TryOn.drawGlassesOverlay(ctx, face, selected, selectedB, compareMode, pdMm);
}

function sendToMesh() {
  if (!faceMesh || meshBusy || mode !== "camera" || video.readyState < 2) return;
  meshBusy = true;
  faceMesh
    .send({ image: video })
    .catch(() => {
      tracking = "geometric";
      trackBadge.textContent = t("trackGeo");
    })
    .finally(() => {
      meshBusy = false;
    });
}

function loop() {
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (mode === "camera" && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, w, h);
    if (tracking !== "mediapipe") {
      face.t += 0.03;
      const j = Math.sin(face.t) * 0.002;
      face.left = [0.38 + j, 0.42];
      face.right = [0.62 + j, 0.42];
      face.source = "geometric";
    }
    sendToMesh();
  } else if (mode === "demo") {
    drawDemoFace(w, h);
    face.t += 0.02;
  } else {
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8b9bb8";
    ctx.font = "16px system-ui";
    ctx.fillText(t("hintIdle"), 40, h / 2);
  }
  if (mode !== "idle") drawGlasses();
  raf = requestAnimationFrame(loop);
}

function initMediaPipe() {
  if (typeof FaceMesh === "undefined") {
    tracking = "geometric";
    trackBadge.textContent = t("trackGeo");
    return;
  }
  try {
    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults((results) => {
      const lm = results.multiFaceLandmarks && results.multiFaceLandmarks[0];
      if (!lm) return;
      // outer eye corners
      face.left = [lm[33].x, lm[33].y];
      face.right = [lm[263].x, lm[263].y];
      face.source = "mediapipe";
      tracking = "mediapipe";
      trackBadge.textContent = t("trackMp");
    });
    tracking = "mediapipe";
    trackBadge.textContent = t("trackMp");
    hintEl.textContent = t("hintCam") + " · MediaPipe Face Mesh";
  } catch (_) {
    faceMesh = null;
    tracking = "geometric";
    trackBadge.textContent = t("trackGeo");
  }
}

async function startCamera() {
  consentEl.classList.remove("hidden");
}

async function startCameraAfterConsent() {
  consentEl.classList.add("hidden");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    mode = "camera";
    initMediaPipe();
    if (tracking === "geometric") {
      hintEl.textContent = t("hintCam") + " · geometric fallback";
    }
  } catch (e) {
    hintEl.textContent = "Camera blocked — demo. " + e.message;
    startDemo();
  }
}

function startDemo() {
  consentEl.classList.add("hidden");
  stopCameraTracks();
  mode = "demo";
  tracking = "demo";
  trackBadge.textContent = t("trackDemo");
  const faceName = DEMO_FACES[demoFaceIndex % DEMO_FACES.length].label;
  hintEl.textContent = t("hintDemo") + " · " + faceName;
}

function nextDemoFace() {
  demoFaceIndex = (demoFaceIndex + 1) % DEMO_FACES.length;
  if (mode !== "demo") startDemo();
  else {
    const faceName = DEMO_FACES[demoFaceIndex].label;
    hintEl.textContent = t("hintDemo") + " · " + faceName;
  }
}

function stopCameraTracks() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

function galleryKey() {
  return "beear_gallery_v1";
}

function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(galleryKey()) || "[]");
  } catch {
    return [];
  }
}

function saveGallery(items) {
  localStorage.setItem(galleryKey(), JSON.stringify(items.slice(0, 24)));
}

function snapshot() {
  const data = canvas.toDataURL("image/png");
  const item = {
    id: Date.now(),
    frame: selected?.id || "none",
    frameB: compareMode ? selectedB?.id : null,
    pdMm,
    data,
  };
  const items = loadGallery();
  items.unshift(item);
  saveGallery(items);
  const a = document.createElement("a");
  a.download = `beear-${selected?.id || "shot"}-${item.id}.png`;
  a.href = data;
  a.click();
  renderGallery();
}

function renderGallery() {
  const items = loadGallery();
  if (!items.length) {
    galleryEl.innerHTML = '<p class="muted small">No snapshots yet</p>';
    return;
  }
  galleryEl.innerHTML = items
    .map(
      (it) =>
        `<div class="shot"><img src="${it.data}" alt=""/><button data-id="${it.id}" class="btn tiny del">×</button></div>`,
    )
    .join("");
  galleryEl.querySelectorAll(".del").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.getAttribute("data-id"));
      saveGallery(loadGallery().filter((x) => x.id !== id));
      renderGallery();
    };
  });
}

// UI wiring
document.getElementById("btn-cam").onclick = startCamera;
document.getElementById("btn-demo").onclick = startDemo;
const btnDemoNext = document.getElementById("btn-demo-next");
if (btnDemoNext) btnDemoNext.onclick = nextDemoFace;
document.getElementById("btn-snap").onclick = snapshot;
document.getElementById("btn-lang").onclick = () => {
  lang = lang === "en" ? "vi" : "en";
  applyLang();
  updateMeta();
};
document.getElementById("btn-compare").onclick = () => {
  compareMode = !compareMode;
  document.getElementById("btn-compare").classList.toggle("active", compareMode);
  if (compareMode && !selectedB && frames[1]) selectFrame(frames[1].id, "B");
  updateMeta();
};
document.getElementById("btn-gallery").onclick = () => {
  galleryEl.classList.toggle("hidden");
  renderGallery();
};
document.getElementById("filter").onchange = (e) => loadCatalog(e.target.value);
document.getElementById("pd").oninput = (e) => {
  pdMm = Number(e.target.value) || 64;
  document.getElementById("pd-val").textContent = String(pdMm);
  updateMeta();
};
document.getElementById("consent-ok").onclick = startCameraAfterConsent;
document.getElementById("consent-demo").onclick = startDemo;

applyLang();
Promise.all([loadDemoImages(), loadCatalog().catch((e) => {
  hintEl.textContent = "API error: " + e.message + " — is beear serve running?";
})])
  .then(() => {
    startDemo();
    loop();
  })
  .catch(() => {
    startDemo();
    loop();
  });
