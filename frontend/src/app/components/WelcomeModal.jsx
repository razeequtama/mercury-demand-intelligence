'use client';

import { X, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';

export default function WelcomeModal({ showWelcome, isFirstVisit, handleCloseWelcome, setShowWelcome, theme }) {
  const { t } = useLanguage();
  if (!showWelcome) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
      <div className={`border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl flex flex-col scrollbar-thin ${
        isDark 
          ? 'bg-[#201510] border-[#3d2a20] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
          : 'bg-[#fffdfa] border-[#e5d8cc] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
      }`}>
        
        {isFirstVisit && (
          <div className={`mb-5 pb-5 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <img src="/mercury.svg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold leading-tight">{t('welcome.welcomeTitle')}</h3>
            </div>
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}`}>
              {t('welcome.welcomeDescription')}
            </p>
          </div>
        )}

        {!isFirstVisit && (
          <div className={`flex justify-between items-center mb-5 pb-4 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
            <div className="flex items-center gap-2">
              <HelpCircle className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <h3 className="text-xl sm:text-2xl font-bold">{t('welcome.guideTitle')}</h3>
            </div>
            <button 
              onClick={() => setShowWelcome(false)}
              className={`p-2 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className={`space-y-4 text-sm mb-6 flex-1 ${isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}`}>
          <h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{t('welcome.walkthrough')}</h4>
          
          <div className="space-y-3 sm:space-y-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepDashboardTitle')}</span>
              {t('welcome.stepDashboardDescription')}
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepSandboxTitle')}</span>
              {t('welcome.stepSandboxDescription')}
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepControlsTitle')}</span>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><strong>{t('sandbox.targetSku')}:</strong> {t('welcome.targetSkuDescription')}</li>
                <li><strong>{t('sandbox.competitorPrice')}:</strong> {t('welcome.competitorDescription')}</li>
                <li><strong>{t('sandbox.demandMultiplier')}:</strong> {t('welcome.demandDescription')}</li>
                <li><strong>{t('sandbox.inventoryOverride')}:</strong> {t('welcome.inventoryDescription')}</li>
              </ul>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{t('welcome.stepInspectorTitle')}</span>
              {t('welcome.stepInspectorDescription')}
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-2">
          {isFirstVisit ? (
            <button 
              onClick={handleCloseWelcome}
              className={`w-full py-3.5 font-semibold rounded-xl transition-colors shadow-lg text-base cursor-pointer min-h-[48px] ${
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
              className={`w-full py-3.5 font-semibold rounded-xl transition-colors text-base cursor-pointer min-h-[48px] ${
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
}