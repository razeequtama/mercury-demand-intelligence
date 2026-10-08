'use client';

import {
  Layers,
  Sliders,
  Database,
  RefreshCw,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header({
  currentView,
  setCurrentView,
  fetchDatabaseInspect,
  inspectLoading,
  fetchData,
  loading,
  theme,
  toggleTheme,
  setShowWelcome
}) {
  const isDark = theme === 'dark';
  const { t } = useLanguage();

  const surface = isDark
    ? 'bg-[#241914] border-[#36261d]'
    : 'bg-[#f5ede3] border-[#e8ded1]';

  const textMuted = isDark
    ? 'text-[#b8a394]'
    : 'text-[#6b5646]';

  return (
    <header
      className={`flex flex-col lg:flex-row lg:items-start lg:justify-between border-b pb-6 mb-6 sm:mb-8 gap-7 ${
        isDark ? 'border-[#36261d]' : 'border-[#e8ded1]'
      }`}
    >

      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/mercury.svg"
            alt="Logo"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />

          <span
            className={`text-xs sm:text-sm uppercase tracking-widest font-semibold ${
              isDark ? 'text-amber-500' : 'text-amber-700'
            }`}
          >
            {t('header.brand')}
          </span>
        </div>

        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
            isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'
          }`}
        >
          {t('header.title')}
        </h1>

        <p
          className={`text-sm sm:text-base mt-1 max-w-2xl ${
            isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'
          }`}
        >
          {t('header.subtitle')}
        </p>
      </div>

      <div className="flex flex-col items-stretch lg:items-end gap-3 w-full lg:w-auto lg:ml-auto">
        <div
          className={`self-end flex items-center p-1 rounded-xl border ${surface}`}
        >
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
              currentView === 'dashboard'
                ? isDark
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'bg-[#c2410c] text-white shadow-sm'
                : isDark
                  ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.03]'
                  : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>{t('header.liveOperations')}</span>
          </button>

          <button
            onClick={() => setCurrentView('sandbox')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
              currentView === 'sandbox'
                ? isDark
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'bg-[#c2410c] text-white shadow-sm'
                : isDark
                  ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.03]'
                  : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>{t('header.sandbox')}</span>
          </button>
        </div>

        <div
          className={`self-end flex items-center rounded-xl border p-1 ${surface}`}
        >
          {/* Database */}
          <button
            onClick={fetchDatabaseInspect}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              isDark
                ? 'text-amber-300 hover:bg-white/[0.04]'
                : 'text-amber-800 hover:bg-black/[0.03]'
            }`}
          >
            <Database
              className={`w-4 h-4 ${
                inspectLoading ? 'animate-spin' : ''
              }`}
            />
            <span>{t('header.inspectDatabase')}</span>
          </button>

          {/* Divider */}
          <div
            className={`w-px h-5 mx-1 ${
              isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
            }`}
          />

          {/* Refresh */}
          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              isDark
                ? 'text-[#f5ebd9] hover:bg-white/[0.04]'
                : 'text-[#3d2c22] hover:bg-black/[0.03]'
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>{t('header.refresh')}</span>
          </button>

          {/* Divider */}
          <div
            className={`w-px h-5 mx-1 ${
              isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
            }`}
          />

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-amber-400 hover:bg-white/[0.04]'
                : 'text-amber-700 hover:bg-black/[0.03]'
            }`}
            title={
              isDark
                ? t('header.switchToLight')
                : t('header.switchToDark')
            }
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>

          {/* Language */}
          <LanguageSwitcher theme={theme} />

          {/* Divider */}
          <div
            className={`w-px h-5 mx-1 ${
              isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
            }`}
          />

          {/* Help */}
          <button
            onClick={() => setShowWelcome(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-amber-400 hover:bg-white/[0.04] hover:text-amber-300'
                : 'text-amber-700 hover:bg-black/[0.03] hover:text-amber-900'
            }`}
            title={t('header.userGuide')}
          >
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}