'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Database, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';

export default function DatabaseInspectorModal({ 
  isModalOpen, 
  setIsModalOpen, 
  dbData, 
  inspectLoading, 
  fetchDatabaseInspect,
  theme 
}) {
  const [activeTab, setActiveTab] = useState('products');
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);

  if (!isModalOpen || !mounted) return null;

  const tabs = ['products', 'inventory', 'competitorEvents', 'orders', 'automatedActionsLog'];

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsModalOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('inspector.title')}
    >
      <div 
        className={`border rounded-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scrollbar-thin ${
          isDark 
            ? 'bg-[#201510] border-[#3d2a20] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
            : 'bg-white border-[#e5d8cc] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 sm:p-6 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Database className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <h2 className="text-lg sm:text-2xl font-bold">{t('inspector.title')}</h2>
            {inspectLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500 ml-1 shrink-0" />
            )}
          </div>
          <button 
            onClick={() => setIsModalOpen(false)}
            aria-label={t('common.close') || 'Close'}
            className={`p-2 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {dbData && (
          <div className={`flex overflow-x-auto border-b px-4 sm:px-6 pt-3 gap-3 sm:gap-4 scrollbar-none shrink-0 ${
            isDark ? 'border-[#3d2a20] bg-[#18110e]/40' : 'border-[#e5d8cc] bg-[#faf6f0]/40'
          }`}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm sm:text-base font-bold capitalize border-b-2 transition cursor-pointer whitespace-nowrap min-h-[40px] px-2.5 ${
                  activeTab === tab 
                    ? (isDark ? 'border-amber-500 text-amber-400' : 'border-amber-700 text-amber-800') 
                    : (isDark ? 'border-transparent text-[#b8a394] hover:text-[#fff8f0]' : 'border-transparent text-[#7a6452] hover:text-[#241a14]')
                }`}
              >
                {t(`inspector.${tab}`)} ({dbData[tab]?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-sm sm:text-base min-h-[220px]">
          {inspectLoading && !dbData ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className={`text-sm sm:text-base font-sans ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                Loading database records...
              </p>
            </div>
          ) : !dbData ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className={`text-sm sm:text-base font-sans ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                Failed to load database inspection feed.
              </p>
              {fetchDatabaseInspect && (
                <button
                  type="button"
                  onClick={fetchDatabaseInspect}
                  className={`mt-2 px-4 py-2 text-sm font-sans font-bold rounded-lg cursor-pointer transition ${
                    isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white'
                  }`}
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[550px]">
                <thead className={`border-b uppercase text-xs sm:text-sm font-bold tracking-wider ${isDark ? 'border-[#3d2a20] text-[#b8a394]' : 'border-[#e5d8cc] text-[#7a6452]'}`}>
                  <tr>
                    {Object.keys(dbData[activeTab]?.[0] || {}).map(col => (
                      <th key={col} className="pb-3.5 pr-4 font-bold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#3d2a20]/40' : 'divide-[#e5d8cc]/40'}`}>
                  {!dbData[activeTab] || dbData[activeTab].length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center italic text-[#8c7462]">
                        No records found in {activeTab}.
                      </td>
                    </tr>
                  ) : (
                    dbData[activeTab].map((row, idx) => (
                      <tr key={idx} className={`transition ${isDark ? 'hover:bg-[#2b1e17]/20' : 'hover:bg-[#fcf8f3]'}`}>
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className={`py-3.5 pr-4 ${isDark ? 'text-[#d4c2b4]' : 'text-[#4e3b2e]'}`}>
                            {val !== null ? val.toString() : <span className={isDark ? 'text-[#7a6452] italic' : 'text-[#a38f80] italic'}>{t('inspector.nullValue')}</span>}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}