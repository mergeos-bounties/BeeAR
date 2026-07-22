/**
 * BeeAR chrome UI strings (EN / VI).
 * Pure module — unit-tested; browser IIFE mirror: assets/i18n.js
 */

export const I18N = {
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
    person3d: "🧑 3D Person",
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
    cloudLocal: "🔒 Local Only",
    cloudServer: "☁️ Cloud Enabled",
    photoConsentLabel: "Allow face photo server upload & cloud features",
    filterAll: "All",
    filterGlasses: "Glasses",
    filterAccessory: "Accessories",
    emptyFilter: "No frames match the current filter.",
    emptyFilterHint: "Try adjusting filters or check your connection.",
    emptyGallery: "No snapshots yet",
    loadingCatalog: "Loading catalog…",
    // studio3d
    studioTagline: "Real 3D characters · glasses GLB try-on",
    studioBack: "← 2D / Camera",
    autoRotate: "Auto-rotate",
    autoRotateOn: "Auto-rotate ON",
    autoRotateOff: "Auto-rotate OFF",
    person: "Person",
    character: "Character",
    frames3d: "Frames (3D)",
    fitScale: "Fit scale",
    yOffset: "Y offset",
    zDepth: "Z (depth)",
    loadingStudio: "Loading 3D studio…",
    hintStudio: "Drag to orbit · scroll to zoom · pick person + frames",
    badgeStudio: "3D try-on · GLB glasses",
    loadingPerson: "Loading 3D person…",
  },
  vi: {
    tagline: "Thử kính & phụ kiện ảo",
    catalog: "Danh mục",
    pd: "Khoảng đồng tử PD (mm)",
    pdHint: "Hiệu chỉnh PD để scale kính chính xác hơn",
    select: "Chọn mẫu",
    cam: "📷 Máy ảnh",
    demo: "Ảnh demo",
    demoNext: "Đổi mặt",
    compare: "So sánh",
    snap: "Chụp",
    gallery: "Thư viện",
    person3d: "🧑 Nhân vật 3D",
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
    cloudLocal: "🔒 Chỉ lưu cục bộ",
    cloudServer: "☁️ Đã bật Cloud",
    photoConsentLabel: "Cho phép tải ảnh mặt lên server & dùng tính năng đám mây",
    filterAll: "Tất cả",
    filterGlasses: "Kính",
    filterAccessory: "Phụ kiện",
    emptyFilter: "Không có khung khớp bộ lọc hiện tại.",
    emptyFilterHint: "Thử đổi bộ lọc hoặc kiểm tra kết nối.",
    emptyGallery: "Chưa có ảnh chụp",
    loadingCatalog: "Đang tải danh mục…",
    studioTagline: "Nhân vật 3D thật · thử kính GLB",
    studioBack: "← 2D / Camera",
    autoRotate: "Tự xoay",
    autoRotateOn: "Tự xoay BẬT",
    autoRotateOff: "Tự xoay TẮT",
    person: "Nhân vật",
    character: "Mẫu",
    frames3d: "Khung (3D)",
    fitScale: "Tỷ lệ vừa",
    yOffset: "Lệch Y",
    zDepth: "Z (độ sâu)",
    loadingStudio: "Đang tải studio 3D…",
    hintStudio: "Kéo để xoay · cuộn để zoom · chọn người + khung",
    badgeStudio: "Thử 3D · kính GLB",
    loadingPerson: "Đang tải nhân vật 3D…",
  },
};

export const LANG_KEY = "beear_lang";

export function normalizeLang(value) {
  return value === "vi" ? "vi" : "en";
}

export function t(lang, key) {
  const pack = I18N[normalizeLang(lang)] || I18N.en;
  return pack[key] ?? I18N.en[key] ?? key;
}

export function toggleLang(lang) {
  return normalizeLang(lang) === "en" ? "vi" : "en";
}

export function langButtonLabel(lang) {
  // Button shows the language you can switch TO
  return normalizeLang(lang) === "en" ? "VI" : "EN";
}

export function i18nKeys() {
  return Object.keys(I18N.en);
}

export function missingViKeys() {
  return i18nKeys().filter((k) => !(k in I18N.vi));
}

export function missingEnKeys() {
  return Object.keys(I18N.vi).filter((k) => !(k in I18N.en));
}
