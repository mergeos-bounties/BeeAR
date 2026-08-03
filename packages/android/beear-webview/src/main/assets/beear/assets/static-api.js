/**
 * Static / GitHub Pages catalog shim.
 * When window.__BEEAR_STATIC__ is true (or hostname is *.github.io),
 * /api/catalog* is served from ./catalog/frames.enriched.json.
 */
(function (global) {
  "use strict";

  function detectStatic() {
    if (global.__BEEAR_STATIC__ === true) return true;
    if (global.__BEEAR_STATIC__ === false) return false;
    try {
      const host = location.hostname || "";
      if (host.endsWith("github.io")) return true;
      if (document.documentElement && document.documentElement.dataset.static === "1") return true;
    } catch (_) {}
    return false;
  }

  let cache = null;
  let base = ".";

  function setBase(b) {
    base = String(b || ".").replace(/\/$/, "") || ".";
  }

  function joinBase(rel) {
    const b = String(base || ".").replace(/\/+$/, "") || ".";
    const r = String(rel || "").replace(/^\.?\//, "");
    return b + "/" + r;
  }

  async function loadCatalog() {
    if (cache) return cache;
    // Use joinBase so path rewrites for GitHub Pages never break this URL.
    const url = joinBase("catalog/frames.enriched.json");
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error("static catalog HTTP " + r.status + " " + url);
    cache = await r.json();
    return cache;
  }

  function filterFrames(frames, searchParams) {
    let out = frames.slice();
    const cat = searchParams.get("category");
    const style = searchParams.get("style");
    if (cat) out = out.filter((f) => String(f.category || "") === cat);
    if (style) out = out.filter((f) => String(f.style || "") === style);
    return out;
  }

  /**
   * @param {string} path - absolute path like /api/catalog or /api/catalog/meta
   * @param {RequestInit} [opts]
   */
  async function staticApi(path, opts) {
    const method = ((opts && opts.method) || "GET").toUpperCase();
    // Soft-mock sessions / wishlist on static demos
    if (path.startsWith("/api/sessions")) {
      if (method === "POST" && path === "/api/sessions") {
        return { id: "static-demo", frame_ids: [], wishlist: [], note: "static" };
      }
      if (path.includes("/wishlist")) {
        return { ok: true, static: true };
      }
      return { id: "static-demo", ok: true, static: true };
    }

    const cat = await loadCatalog();
    const u = new URL(path, "https://beear.local");
    if (u.pathname === "/api/catalog/meta") {
      return {
        version: cat.version,
        person_models: cat.person_models || [],
        glb_count: cat.glb_count || 0,
        person_count: cat.person_count || 0,
        frames: (cat.frames || []).length,
      };
    }
    const single = u.pathname.match(/^\/api\/catalog\/([^/]+)$/);
    if (single) {
      const id = decodeURIComponent(single[1]);
      const f = (cat.frames || []).find((x) => x.id === id);
      if (!f) throw new Error("frame not found: " + id);
      return f;
    }
    if (u.pathname === "/api/catalog") {
      return {
        version: cat.version,
        frames: filterFrames(cat.frames || [], u.searchParams),
        person_models: cat.person_models || [],
        glb_count: cat.glb_count || 0,
      };
    }
    throw new Error("static mode: unsupported API " + path);
  }

  global.BeeARStatic = {
    detectStatic,
    setBase,
    loadCatalog,
    staticApi,
    isStatic: detectStatic,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
