/* BeeAR try-on client */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const catalogEl = document.getElementById("catalog");
const metaEl = document.getElementById("meta");
const hintEl = document.getElementById("hint");

let frames = [];
let selected = null;
let stream = null;
let mode = "idle"; // idle | camera | demo
let svgCache = {};
let raf = 0;

// geometric face model (normalized) — replaced when tracking improves
let face = {
  left: [0.38, 0.42],
  right: [0.62, 0.42],
  t: 0,
};

async function api(path, opts) {
  const r = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function loadCatalog(category = "") {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  const data = await api("/api/catalog" + q);
  frames = data.frames || [];
  renderCatalog();
  if (!selected && frames[0]) selectFrame(frames[0].id);
}

function renderCatalog() {
  catalogEl.innerHTML = "";
  frames.forEach((f) => {
    const el = document.createElement("div");
    el.className = "sku" + (selected && selected.id === f.id ? " on" : "");
    el.innerHTML = `
      <img src="${f.svg_url || ""}" alt="" onerror="this.className='ph';this.removeAttribute('src')" />
      <div>
        <h3>${f.name}</h3>
        <p>${f.brand} · ${f.style} · $${((f.price_cents || 0) / 100).toFixed(2)}</p>
      </div>`;
    el.onclick = () => selectFrame(f.id);
    catalogEl.appendChild(el);
  });
}

async function selectFrame(id) {
  selected = frames.find((f) => f.id === id) || (await api("/api/catalog/" + id));
  renderCatalog();
  metaEl.textContent = `${selected.name} · ${selected.fit?.width_mm || "?"}mm · ${selected.category}`;
  if (selected.svg_url && !svgCache[id]) {
    try {
      const res = await fetch(selected.svg_url);
      svgCache[id] = await res.text();
    } catch (_) {
      svgCache[id] = null;
    }
  }
}

function drawDemoFace(w, h) {
  // soft skin oval
  const cx = w / 2, cy = h * 0.48;
  const rx = w * 0.22, ry = h * 0.32;
  const g = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, ry);
  g.addColorStop(0, "#f0c7a8");
  g.addColorStop(1, "#d4a07a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // hair
  ctx.fillStyle = "#2b2118";
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.55, rx * 1.05, ry * 0.55, 0, Math.PI, 0);
  ctx.fill();
  // eyes whites
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
  // nose / mouth simple
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
  face.left = [(cx - eyeDX) / w, eyeY / h];
  face.right = [(cx + eyeDX) / w, eyeY / h];
}

function drawGlasses() {
  if (!selected) return;
  const w = canvas.width, h = canvas.height;
  const lx = face.left[0] * w, ly = face.left[1] * h;
  const rx = face.right[0] * w, ry = face.right[1] * h;
  const midX = (lx + rx) / 2;
  const midY = (ly + ry) / 2;
  const pd = Math.hypot(rx - lx, ry - ly);
  const angle = Math.atan2(ry - ly, rx - lx);
  const widthMm = selected.fit?.width_mm || 140;
  // scale: PD ~64mm
  const overlayW = (widthMm / 64) * pd * 1.15;
  const overlayH = overlayW * 0.42;
  const cat = selected.category;

  ctx.save();
  ctx.translate(midX, midY + (cat === "accessory" && selected.style === "hat" ? -pd * 0.9 : pd * 0.08));
  ctx.rotate(angle);

  if (selected.style === "earring") {
    // left ear approx
    ctx.translate(-pd * 1.15, pd * 0.5);
    paintFrameShape(overlayW * 0.35, overlayH * 1.2);
  } else if (selected.style === "hat") {
    paintFrameShape(overlayW * 1.35, overlayH * 0.9);
  } else {
    paintFrameShape(overlayW, overlayH);
  }
  ctx.restore();
}

function paintFrameShape(ow, oh) {
  const color = selected.color || "#111";
  const tint = selected.lens_tint || "rgba(0,0,0,0.25)";
  const style = selected.style || "wayfarer";
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
  } else if (style === "clip_on") {
    const r = oh * 0.38;
    const gap = ow * 0.1;
    ctx.beginPath();
    ctx.ellipse(-gap / 2 - r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(gap / 2 + r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // wayfarer default
    const lw = ow * 0.42, lh = oh * 0.7, gap = ow * 0.08;
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

function loop() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (mode === "camera" && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, w, h);
    // subtle live face oscillation for demo tracking feel
    face.t += 0.03;
    const j = Math.sin(face.t) * 0.002;
    face.left = [0.38 + j, 0.42];
    face.right = [0.62 + j, 0.42];
  } else if (mode === "demo") {
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);
    drawDemoFace(w, h);
    face.t += 0.02;
  } else {
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8b9bb8";
    ctx.font = "16px system-ui";
    ctx.fillText("BeeAR ready — Camera or Demo face", 40, h / 2);
  }
  if (mode !== "idle") drawGlasses();
  raf = requestAnimationFrame(loop);
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    mode = "camera";
    hintEl.textContent = "Camera live · geometric face fit (MediaPipe optional upgrade)";
  } catch (e) {
    hintEl.textContent = "Camera blocked — using Demo face. " + e.message;
    startDemo();
  }
}

function startDemo() {
  stopCameraTracks();
  mode = "demo";
  hintEl.textContent = "Demo face mode (offline) · pick frames in the catalog";
}

function stopCameraTracks() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

function snapshot() {
  const a = document.createElement("a");
  a.download = `beear-${selected?.id || "shot"}-${Date.now()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

document.getElementById("btn-cam").onclick = startCamera;
document.getElementById("btn-demo").onclick = startDemo;
document.getElementById("btn-snap").onclick = snapshot;
document.getElementById("filter").onchange = (e) => loadCatalog(e.target.value);

loadCatalog()
  .then(() => {
    startDemo();
    loop();
  })
  .catch((e) => {
    hintEl.textContent = "API error: " + e.message + " — is beear serve running?";
    loop();
  });
