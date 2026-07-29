import React from 'react';
import { useI18n } from '../i18n/I18nContext';

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div 
      className="beear-lang-toggle flex items-center bg-gray-800/60 rounded-lg p-1 border border-gray-700/50"
      aria-label={t('chrome.language.toggleLabel')}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
          locale === 'en'
            ? 'bg-amber-500 text-gray-900 shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('vi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
          locale === 'vi'
            ? 'bg-amber-500 text-gray-900 shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        aria-pressed={locale === 'vi'}
      >
        VI
      </button>
    </div>
  );
};
