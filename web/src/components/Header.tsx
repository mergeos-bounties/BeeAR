import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LanguageToggle } from './LanguageToggle';

export const Header: React.FC = () => {
  const { t } = useI18n();

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-gray-900 text-lg">
          B
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            {t('chrome.title')}
          </h1>
          <p className="text-xs text-gray-400">
            {t('chrome.subtitle')}
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center space-x-6">
        <a href="#tryon" className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors">
          {t('chrome.nav.tryOn')}
        </a>
        <a href="#catalog" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          {t('chrome.nav.catalog')}
        </a>
        <a href="#settings" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          {t('chrome.nav.settings')}
        </a>
        <a href="#help" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          {t('chrome.nav.help')}
        </a>
      </nav>

      <div className="flex items-center space-x-4">
        <LanguageToggle />
      </div>
    </header>
  );
};
