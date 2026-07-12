/* BeeAR try-on client v0.2 — PD, compare, gallery, VI/EN, optional MediaPipe */
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
let pdMm = 64;
let lang = "en";
let tracking = "geometric"; // geometric | mediapipe
let faceMesh = null;
let meshBusy = false;
let sessionId = null;

let face = { left: [0.38, 0.42], right: [0.62, 0.42], t: 0, source: "geometric" };

const I18N = {
  en: {
    tagline: "Virtual try-on · glasses & accessories",
    catalog: "Catalog",
    pd: "PD (mm)",
    pdHint: "Calibrate pupil distance for better fit scale",
    select: "Select a SKU",
    cam: "📷 Camera",
    demo: "Demo face",
    compare: "Compare",
    snap: "Snapshot",
    gallery: "Gallery",
    consentTitle: "Camera consent",
    consentBody:
      "BeeAR uses the camera only in your browser for try-on. Video is not uploaded to the server.",
    consentOk: "Allow & start",
    consentDemo: "Use demo face",
    hintIdle: "Start camera or use Demo face · pick a frame",
    hintDemo: "Demo face · PD slider adjusts scale · Compare picks A/B",
    hintCam: "Camera live",
    trackGeo: "tracking: geometric",
    trackMp: "tracking: mediapipe",
  },
  vi: {
    tagline: "Thử kính & phụ kiện ảo",
    catalog: "Danh mục",
    pd: "Khoảng đồng tử PD (mm)",
    pdHint: "Hiệu chỉnh PD để scale kính chính xác hơn",
    select: "Chọn mẫu",
    cam: "📷 Camera",
    demo: "Mặt demo",
    compare: "So sánh",
    snap: "Chụp",
    gallery: "Thư viện",
    consentTitle: "Đồng ý camera",
    consentBody:
      "BeeAR chỉ dùng camera trên trình duyệt để thử đồ. Video không gửi lên server.",
    consentOk: "Cho phép & bắt đầu",
    consentDemo: "Dùng mặt demo",
    hintIdle: "Bật camera hoặc mặt demo · chọn khung",
    hintDemo: "Mặt demo · chỉnh PD · So sánh chọn A/B",
    hintCam: "Camera đang bật",
    trackGeo: "tracking: hình học",
    trackMp: "tracking: mediapipe",
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
  document.getElementById("btn-compare").textContent = t("compare");
  document.getElementById("btn-snap").textContent = t("snap");
  document.getElementById("btn-gallery").textContent = t("gallery");
  document.getElementById("btn-lang").textContent = lang === "en" ? "VI" : "EN";
  document.getElementById("consent-title").textContent = t("consentTitle");
  document.getElementById("consent-body").textContent = t("consentBody");
  document.getElementById("consent-ok").textContent = t("consentOk");
  document.getElementById("consent-demo").textContent = t("consentDemo");
  trackBadge.textContent = tracking === "mediapipe" ? t("trackMp") : t("trackGeo");
  if (!selected) metaEl.textContent = t("select");
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
  ctx.fillStyle = "#2b2118";
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.55, rx * 1.05, ry * 0.55, 0, Math.PI, 0);
  ctx.fill();
  const eyeY = cy - 10;
  const eyeDX = rx * 0.42;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(cx - eyeDX, eyeY, 16, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + eyeDX, eyeY, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(cx - eyeDX, eyeY, 5, 0, Math.PI * 2);
  ctx.arc(cx + eyeDX, eyeY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b88466";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, eyeY + 12);
  ctx.lineTo(cx - 6, eyeY + 36);
  ctx.lineTo(cx + 6, eyeY + 36);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.35, 18, 8, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();
  if (face.source !== "mediapipe") {
    face.left = [(cx - eyeDX) / w, eyeY / h];
    face.right = [(cx + eyeDX) / w, eyeY / h];
  }
}

function overlaySize(frame, pdPx) {
  const widthMm = frame.fit?.width_mm || 140;
  const overlayW = (widthMm / pdMm) * pdPx * 1.15;
  return { overlayW, overlayH: overlayW * 0.42 };
}

function drawFrameAt(frame, midX, midY, angle, pd, xOffset = 0) {
  if (!frame) return;
  const { overlayW, overlayH } = overlaySize(frame, pd);
  const cat = frame.category;
  ctx.save();
  ctx.translate(
    midX + xOffset,
    midY + (cat === "accessory" && frame.style === "hat" ? -pd * 0.9 : pd * 0.08),
  );
  ctx.rotate(angle);
  if (frame.style === "earring") {
    ctx.translate(-pd * 1.15, pd * 0.5);
    paintFrameShape(frame, overlayW * 0.35, overlayH * 1.2);
  } else if (frame.style === "hat") {
    paintFrameShape(frame, overlayW * 1.35, overlayH * 0.9);
  } else if (frame.style === "necklace") {
    ctx.translate(0, pd * 1.4);
    paintFrameShape(frame, overlayW * 0.5, overlayH * 1.4);
  } else {
    paintFrameShape(frame, overlayW, overlayH);
  }
  ctx.restore();
}

function drawGlasses() {
  const w = canvas.width,
    h = canvas.height;
  const lx = face.left[0] * w,
    ly = face.left[1] * h;
  const rx = face.right[0] * w,
    ry = face.right[1] * h;
  const midX = (lx + rx) / 2;
  const midY = (ly + ry) / 2;
  const pd = Math.hypot(rx - lx, ry - ly) || 100;
  const angle = Math.atan2(ry - ly, rx - lx);

  if (compareMode && selected && selectedB) {
    // clip left / right halves
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w / 2, h);
    ctx.clip();
    drawFrameAt(selected, midX, midY, angle, pd, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(w / 2, 0, w / 2, h);
    ctx.clip();
    drawFrameAt(selectedB, midX, midY, angle, pd, 0);
    ctx.restore();
    // divider
    ctx.strokeStyle = "#f5c518aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.fillStyle = "#f5c518";
    ctx.font = "12px system-ui";
    ctx.fillText("A", 12, 20);
    ctx.fillText("B", w / 2 + 12, 20);
  } else if (selected) {
    drawFrameAt(selected, midX, midY, angle, pd, 0);
  }
}

function paintFrameShape(frame, ow, oh) {
  const color = frame.color || "#111";
  const tint = frame.lens_tint || "rgba(0,0,0,0.25)";
  const style = frame.style || "wayfarer";
  ctx.lineWidth = Math.max(3, ow * 0.025);
  ctx.strokeStyle = color;
  ctx.fillStyle = tint;

  if (style === "round") {
    const r = oh * 0.42;
    const gap = ow * 0.08;
    ctx.beginPath();
    ctx.arc(-gap / 2 - r, 0, r, 0, Math.PI * 2);
    ctx.arc(gap / 2 + r, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "aviator") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, 0);
    ctx.quadraticCurveTo(-ow / 4, -oh / 2, 0, -oh * 0.1);
    ctx.quadraticCurveTo(ow / 4, -oh / 2, ow / 2, 0);
    ctx.quadraticCurveTo(ow / 4, oh / 2, 0, oh * 0.25);
    ctx.quadraticCurveTo(-ow / 4, oh / 2, -ow / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "cat_eye") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, oh * 0.1);
    ctx.lineTo(-ow * 0.35, -oh * 0.35);
    ctx.lineTo(-ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.35, -oh * 0.35);
    ctx.lineTo(ow / 2, oh * 0.1);
    ctx.quadraticCurveTo(ow * 0.25, oh * 0.45, 0, oh * 0.3);
    ctx.quadraticCurveTo(-ow * 0.25, oh * 0.45, -ow / 2, oh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "sport") {
    roundRect(-ow / 2, -oh / 3, ow, oh * 0.7, 16);
    ctx.fill();
    ctx.stroke();
  } else if (style === "rectangle") {
    const lw = ow * 0.42,
      lh = oh * 0.55,
      gap = ow * 0.08;
    roundRect(-gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "browline") {
    const lw = ow * 0.42,
      lh = oh * 0.65,
      gap = ow * 0.08;
    roundRect(-gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-gap / 2 - lw, -lh / 2, lw, lh * 0.22);
    ctx.fillRect(gap / 2, -lh / 2, lw, lh * 0.22);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "hex") {
    const drawHex = (cx) => {
      const r = oh * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    const gap = ow * 0.08;
    const r = oh * 0.4;
    drawHex(-gap / 2 - r);
    drawHex(gap / 2 + r);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "earring") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, oh * 0.25, oh * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -oh * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "hat") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, oh * 0.15, ow / 2, oh * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -oh * 0.05, ow * 0.35, oh * 0.35, 0, Math.PI, 0);
    ctx.fill();
  } else if (style === "necklace") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-ow / 2, -oh / 2);
    ctx.quadraticCurveTo(0, oh / 2, ow / 2, -oh / 2);
    ctx.stroke();
    ctx.fillStyle = "#E8C547";
    ctx.beginPath();
    ctx.arc(0, oh * 0.35, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "clip_on") {
    const r = oh * 0.38;
    const gap = ow * 0.1;
    ctx.beginPath();
    ctx.ellipse(-gap / 2 - r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(gap / 2 + r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const lw = ow * 0.42,
      lh = oh * 0.7,
      gap = ow * 0.08;
    roundRect(-gap / 2 - lw, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    roundRect(gap / 2, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);
    drawDemoFace(w, h);
    face.t += 0.02;
    face.source = "demo";
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
  tracking = "geometric";
  trackBadge.textContent = t("trackGeo");
  hintEl.textContent = t("hintDemo");
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
loadCatalog()
  .then(() => {
    startDemo();
    loop();
  })
  .catch((e) => {
    hintEl.textContent = "API error: " + e.message + " — is beear serve running?";
    loop();
  });
