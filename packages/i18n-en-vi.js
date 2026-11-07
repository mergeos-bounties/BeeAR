export const SUPPORTED_LOCALES = Object.freeze(['en', 'vi']);

export const UI_STRINGS = Object.freeze({
  en: {
    appTitle: 'BeeAR Spatial Catalog',
    toggleLanguage: 'Tiếng Việt (VI)',
    scanRoom: 'Scan Room & Surface',
    placeModel: 'Place 3D Model',
    resetView: 'Reset Camera View',
    catalogSearch: 'Search AR models...',
    measureDistance: 'Measure Distance',
    shareSnapshot: 'Share AR Snapshot',
  },
  vi: {
    appTitle: 'Danh mục Không gian BeeAR',
    toggleLanguage: 'English (EN)',
    scanRoom: 'Quét phòng & bề mặt',
    placeModel: 'Đặt mô hình 3D',
    resetView: 'Đặt lại góc nhìn',
    catalogSearch: 'Tìm kiếm mô hình AR...',
    measureDistance: 'Đo khoảng cách',
    shareSnapshot: 'Chia sẻ ảnh chụp AR',
  },
});

export function getLocaleStrings(locale = 'en') {
  const normalized = String(locale || 'en').toLowerCase().startsWith('vi') ? 'vi' : 'en';
  return UI_STRINGS[normalized];
}

export function toggleLocale(currentLocale = 'en') {
  return String(currentLocale || 'en').toLowerCase() === 'vi' ? 'en' : 'vi';
}