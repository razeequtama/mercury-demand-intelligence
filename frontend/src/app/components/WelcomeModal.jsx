'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, Globe, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { EnglishLogo, IndonesianLogo } from './LanguageSwitcher';

export default function WelcomeModal({ showWelcome, isFirstVisit, handleCloseWelcome, setShowWelcome, theme }) {
  const [mounted, setMounted] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showWelcome && !isFirstVisit) {
        setShowWelcome(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWelcome, isFirstVisit, setShowWelcome]);

  if (!showWelcome || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isFirstVisit) setShowWelcome(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`border rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden ${
        isDark 
          ? 'bg-[#201510] border-[#3d2a20] text-[#f5ebd9]' 
          : 'bg-[#fffdfa] border-[#e5d8cc] text-[#3d2c22]'
      }`}>
        
        {isFirstVisit && (
          <div className={`p-5 sm:p-7 pb-4 sm:pb-5 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
            <div className="flex items-center gap-3 sm:gap-3.5 mb-2.5">
              <img src="/mercury.svg" alt="Mercury Logo" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
              <h3 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center flex-wrap gap-x-2">
                <span>{t('welcome.welcomePrefix')}</span>
                <span className={`font-rocker font-bold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  MERCURY
                </span>
              </h3>
            </div>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}`}>
              {t('welcome.welcomeDescription')}
            </p>
          </div>
        )}

        {!isFirstVisit && (
          <div className={`flex justify-between items-center p-5 sm:p-7 pb-4 sm:pb-5 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img src="/mercury.svg" alt="Mercury Logo" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold flex items-center flex-wrap gap-x-1.5">
                <span className={`font-rocker font-bold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>MERCURY</span>
                <span>{t('welcome.userGuideSuffix')}</span>
              </h3>
            </div>
            <button 
              onClick={() => setShowWelcome(false)}
              className={`p-2 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className={`p-5 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-5 text-base scrollbar-thin ${
          isDark 
            ? 'text-[#d4c2b4] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
            : 'text-[#594537] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
        }`}>
          {/* Language Preference Section */}
          <div className={`p-4 sm:p-5 rounded-xl border ${
            isDark 
              ? 'bg-[#18110e] border-[#36261d]' 
              : 'bg-[#f7f2ec] border-[#e8ded1]'
          }`}>
            <div className="flex items-center gap-2.5 mb-2">
              <Globe className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className={`text-base sm:text-lg font-bold block ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                {t('welcome.languageSectionTitle')}
              </span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed mb-3.5">
              {t('welcome.languageSectionDescription')}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3" role="group" aria-label={t('common.language')}>
              <button
                type="button"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer min-h-[44px] border ${
                  locale === 'en'
                    ? isDark
                      ? 'bg-[#b45309] text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                      : 'bg-[#c2410c] text-white border-orange-500 shadow-md ring-2 ring-orange-500/25'
                    : isDark
                      ? 'bg-[#201510] border-[#3d2a20] text-[#d4c2b4] hover:text-[#fff8f0] hover:bg-[#281a14] hover:border-amber-700/50'
                      : 'bg-[#ffffff] border-[#e2d5c8] text-[#594537] hover:text-[#241a14] hover:bg-[#f6efe7] hover:border-orange-300'
                }`}
              >
                <span className="flex items-center justify-center shrink-0 w-6 h-4 rounded-[2px] overflow-hidden border border-black/20 shadow-xs">
                  <EnglishLogo className="w-full h-full" idPrefix="modal-uk" />
                </span>
                <span>{t('welcome.englishOption')}</span>
                {locale === 'en' && <Check className="w-4 h-4 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => setLocale('id')}
                aria-pressed={locale === 'id'}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer min-h-[44px] border ${
                  locale === 'id'
                    ? isDark
                      ? 'bg-[#b45309] text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                      : 'bg-[#c2410c] text-white border-orange-500 shadow-md ring-2 ring-orange-500/25'
                    : isDark
                      ? 'bg-[#201510] border-[#3d2a20] text-[#d4c2b4] hover:text-[#fff8f0] hover:bg-[#281a14] hover:border-amber-700/50'
                      : 'bg-[#ffffff] border-[#e2d5c8] text-[#594537] hover:text-[#241a14] hover:bg-[#f6efe7] hover:border-orange-300'
                }`}
              >
                <span className="flex items-center justify-center shrink-0 w-6 h-4 rounded-[2px] overflow-hidden border border-black/20 shadow-xs">
                  <IndonesianLogo className="w-full h-full" />
                </span>
                <span>{t('welcome.indonesianOption')}</span>
                {locale === 'id' && <Check className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </div>

          <div>
            <h4 className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{t('welcome.walkthrough')}</h4>
          
          <div className="space-y-3 sm:space-y-4">
            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`text-base sm:text-lg font-bold block mb-1.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepDashboardTitle')}</span>
              <p className="text-sm sm:text-base leading-relaxed">{t('welcome.stepDashboardDescription')}</p>
            </div>

            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`text-base sm:text-lg font-bold block mb-1.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepSandboxTitle')}</span>
              <p className="text-sm sm:text-base leading-relaxed">{t('welcome.stepSandboxDescription')}</p>
            </div>

            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`text-base sm:text-lg font-bold block mb-1.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepControlsTitle')}</span>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-sm sm:text-base leading-relaxed">
                <li><strong>{t('sandbox.targetSku')}:</strong> {t('welcome.targetSkuDescription')}</li>
                <li><strong>{t('sandbox.competitorPrice')}:</strong> {t('welcome.competitorDescription')}</li>
                <li><strong>{t('sandbox.demandMultiplier')}:</strong> {t('welcome.demandDescription')}</li>
                <li><strong>{t('sandbox.inventoryOverride')}:</strong> {t('welcome.inventoryDescription')}</li>
              </ul>
            </div>

            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`text-base sm:text-lg font-bold block mb-1.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepInspectorTitle')}</span>
              <p className="text-sm sm:text-base leading-relaxed">{t('welcome.stepInspectorDescription')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-5 sm:p-7 pt-4 sm:pt-4 border-t shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
          {isFirstVisit ? (
            <button 
              onClick={handleCloseWelcome}
              className={`w-full py-3.5 font-bold rounded-xl transition-colors shadow-lg text-base sm:text-lg cursor-pointer min-h-[48px] ${
                isDark 
                  ? 'bg-[#b45309] hover:bg-[#d97706] text-white shadow-amber-950/50' 
                  : 'bg-[#c2410c] hover:bg-[#9a3412] text-white shadow-amber-900/20'
              }`}
            >
              {t('welcome.getStarted')}
            </button>
          ) : (
            <button 
              onClick={() => setShowWelcome(false)}
              className={`w-full py-3.5 font-bold rounded-xl transition-colors text-base sm:text-lg cursor-pointer min-h-[48px] ${
                isDark ? 'bg-[#32231c] hover:bg-[#422e25] text-[#f5ebd9]' : 'bg-[#e8ded1] hover:bg-[#ded2c3] text-[#3d2c22]'
              }`}
            >
              {t('welcome.closeGuide')}
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}