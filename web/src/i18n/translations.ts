export type SupportedLocale = 'en' | 'vi';

export interface TranslationSchema {
  chrome: {
    title: string;
    subtitle: string;
    nav: {
      tryOn: string;
      catalog: string;
      settings: string;
      help: string;
    };
    language: {
      toggleLabel: string;
      en: string;
      vi: string;
    };
    controls: {
      snapshot: string;
      resetCamera: string;
      toggleLighting: string;
      fullscreen: string;
    };
    status: {
      cameraLoading: string;
      cameraReady: string;
      cameraError: string;
      faceDetected: string;
      searchingFace: string;
    };
  };
}

export const translations: Record<SupportedLocale, TranslationSchema> = {
  en: {
    chrome: {
      title: 'BeeAR',
      subtitle: 'Virtual Try-On for Glasses & Accessories',
      nav: {
        tryOn: 'Virtual Try-On',
        catalog: 'Catalog',
        settings: 'Settings',
        help: 'Help & Support',
      },
      language: {
        toggleLabel: 'Change Language',
        en: 'English',
        vi: 'Tiếng Việt',
      },
      controls: {
        snapshot: 'Take Snapshot',
        resetCamera: 'Reset View',
        toggleLighting: 'Toggle Lighting',
        fullscreen: 'Fullscreen',
      },
      status: {
        cameraLoading: 'Initializing camera...',
        cameraReady: 'Camera active',
        cameraError: 'Camera access denied or unavailable',
        faceDetected: 'Face tracking active',
        searchingFace: 'Aligning face in frame...',
      },
    },
  },
  vi: {
    chrome: {
      title: 'BeeAR',
      subtitle: 'Thử Mắt Kính & Phụ Kiện Ảo',
      nav: {
        tryOn: 'Thử Đồ Ảo',
        catalog: 'Danh Mục',
        settings: 'Cài Đặt',
        help: 'Trợ Giúp & Hỗ Trợ',
      },
      language: {
        toggleLabel: 'Đổi Ngôn Ngữ',
        en: 'English',
        vi: 'Tiếng Việt',
      },
      controls: {
        snapshot: 'Chụp Ảnh',
        resetCamera: 'Đặt Lại Góc Nhìn',
        toggleLighting: 'Bật/Tắt Ánh Sáng',
        fullscreen: 'Toàn Màn Hình',
      },
      status: {
        cameraLoading: 'Đang khởi tạo máy ảnh...',
        cameraReady: 'Máy ảnh hoạt động',
        cameraError: 'Không thể truy cập máy ảnh',
        faceDetected: 'Đã nhận diện khuôn mặt',
        searchingFace: 'Đang căn chỉnh khuôn mặt...',
      },
    },
  },
};
