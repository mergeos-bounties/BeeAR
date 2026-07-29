import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, SupportedLocale, TranslationSchema } from './translations';

const LOCALE_STORAGE_KEY = 'beear_chrome_locale';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getInitialLocale = (): SupportedLocale => {
  try {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'vi')) {
      return savedLocale;
    }
  } catch {
    // Graceful fallback if localStorage is restricted
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('vi')) {
      return 'vi';
    }
  }

  return 'en';
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'vi' : 'en');
  };

  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    
    const resolveKey = (dict: Record<string, any>): string | undefined => {
      let current: any = dict;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return undefined;
        }
      }
      return typeof current === 'string' ? current : undefined;
    };

    // Primary resolution with fallback to English
    let value = resolveKey(translations[locale]) ?? resolveKey(translations.en) ?? keyPath;

    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        value = value.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }

    return value;
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
