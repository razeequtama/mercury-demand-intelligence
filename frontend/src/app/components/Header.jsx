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
    <header className="mb-6 sm:mb-8">
      {/* Top Navbar: Brand & Subtitle on left, Navigation Tabs & Secondary Actions on right (Hot Reload Verified) */}
      <div
        className={`flex flex-col lg:flex-row lg:items-start lg:justify-between border-b pb-6 gap-7 ${
          isDark ? 'border-[#36261d]' : 'border-[#e8ded1]'
        }`}
      >
        <div className="shrink-0 max-w-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/mercury.svg"
              alt="Mercury Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0"
            />

            <span
              className={`font-rocker text-2xl sm:text-3xl font-bold tracking-wider leading-none ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}
            >
              MERCURY
            </span>
          </div>

          <p
            className={`text-base sm:text-lg mt-2 ${
              isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'
            }`}
          >
            {t('header.subtitle')}
          </p>
        </div>

      <div className="flex flex-col items-stretch lg:items-end gap-2.5 w-full lg:w-auto lg:ml-auto">
        {/* Navigation View Switcher (Core Mode Tabs) */}
        <div
          role="tablist"
          aria-label={t('header.title')}
          className={`self-end inline-flex items-center p-1 rounded-xl border shadow-xs ${surface}`}
        >
          <button
            role="tab"
            aria-selected={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
              currentView === 'dashboard'
                ? isDark
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'bg-[#c2410c] text-white shadow-sm'
                : isDark
                  ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
                  : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{t('header.liveOperations')}</span>
          </button>

          <button
            role="tab"
            aria-selected={currentView === 'sandbox'}
            onClick={() => setCurrentView('sandbox')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
              currentView === 'sandbox'
                ? isDark
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'bg-[#c2410c] text-white shadow-sm'
                : isDark
                  ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
                  : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.04]'
            }`}
          >
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{t('header.sandbox')}</span>
          </button>
        </div>

        {/* Secondary Toolbars: Grouped by Purpose */}
        <div className="self-end flex flex-wrap items-center justify-end gap-2.5">
          {/* Group A: Data & Diagnostics (Database Inspector & Sync) */}
          <div
            aria-label="Database and sync actions"
            className={`inline-flex items-center p-1 rounded-xl border shadow-xs ${surface}`}
          >
            <button
              onClick={fetchDatabaseInspect}
              className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm sm:text-base font-semibold transition cursor-pointer ${
                isDark
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-white/[0.05]'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-black/[0.04]'
              }`}
              title={t('header.inspectDatabase')}
            >
              <Database
                className={`w-4 h-4 shrink-0 ${
                  inspectLoading ? 'animate-spin' : ''
                }`}
              />
              <span>{t('header.inspectDatabase')}</span>
            </button>

            <div
              className={`w-px h-5 mx-0.5 ${
                isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
              }`}
            />

            <button
              onClick={fetchData}
              disabled={loading}
              className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm sm:text-base font-semibold transition cursor-pointer ${
                isDark
                  ? 'text-[#f5ebd9] hover:text-white hover:bg-white/[0.05]'
                  : 'text-[#3d2c22] hover:text-black hover:bg-black/[0.04]'
              }`}
              title={t('header.refresh')}
            >
              <RefreshCw
                className={`w-4 h-4 shrink-0 ${
                  loading ? 'animate-spin text-amber-500' : ''
                }`}
              />
              <span>{t('header.refresh')}</span>
            </button>
          </div>

          {/* Group B: System Preferences & Documentation (Theme, Language, Help) */}
          <div
            aria-label="User preferences and help"
            className={`inline-flex items-center p-1 rounded-xl border shadow-xs gap-0.5 ${surface}`}
          >
            {/* Theme */}
            <button
              onClick={toggleTheme}
              className={`h-9 w-9 flex items-center justify-center rounded-lg transition cursor-pointer ${
                isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-white/[0.05]'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-black/[0.04]'
              }`}
              title={
                isDark
                  ? t('header.switchToLight')
                  : t('header.switchToDark')
              }
              aria-label={
                isDark
                  ? t('header.switchToLight')
                  : t('header.switchToDark')
              }
            >
              {isDark ? (
                <Sun className="w-4.5 h-4.5 shrink-0" />
              ) : (
                <Moon className="w-4.5 h-4.5 shrink-0" />
              )}
            </button>

            <div
              className={`w-px h-5 mx-0.5 ${
                isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
              }`}
            />

            {/* Language Switcher */}
            <LanguageSwitcher theme={theme} />

            <div
              className={`w-px h-5 mx-0.5 ${
                isDark ? 'bg-[#36261d]' : 'bg-[#e8ded1]'
              }`}
            />

            {/* Help */}
            <button
              onClick={() => setShowWelcome(true)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg transition cursor-pointer ${
                isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-white/[0.05]'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-black/[0.04]'
              }`}
              title={t('header.userGuide')}
              aria-label={t('header.userGuide')}
            >
              <HelpCircle className="w-4.5 h-4.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Page Title: Commerce Command Center */}
      <div className="pt-6">
        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'
          }`}
        >
          {t('header.title')}
        </h1>
      </div>
    </header>
  );
}