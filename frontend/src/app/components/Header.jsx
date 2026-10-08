'use client';

import { Layers, Sliders, Database, RefreshCw, Sun, Moon, HelpCircle } from 'lucide-react';

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

  return (
    <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center border-b pb-6 mb-6 sm:mb-8 gap-4 sm:gap-6 ${
      isDark ? 'border-[#36261d]' : 'border-[#e8ded1]'
    }`}>
      <div>
        <div className="flex items-center gap-2">
          <img src="/mercury.svg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className={`text-xs sm:text-sm uppercase tracking-widest font-semibold ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>
            Mercury Demand Intelligence
          </span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
          Commerce Command Center
        </h1>
        <p className={`text-sm sm:text-base mt-1 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
          Real-time demand forecasting, stockout risk scoring, and autonomous decision simulation.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
        <div className={`p-1 rounded-xl border flex items-center w-full sm:w-auto ${
          isDark ? 'bg-[#241914] border-[#36261d]' : 'bg-[#f5ede3] border-[#e8ded1]'
        }`}>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition cursor-pointer min-h-[44px] sm:min-h-0 ${
              currentView === 'dashboard' 
                ? (isDark ? 'bg-[#d97706] text-white shadow' : 'bg-[#c2410c] text-white shadow') 
                : (isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]')
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Live Operations</span>
          </button>
          <button
            onClick={() => setCurrentView('sandbox')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition cursor-pointer min-h-[44px] sm:min-h-0 ${
              currentView === 'sandbox' 
                ? (isDark ? 'bg-[#d97706] text-white shadow' : 'bg-[#c2410c] text-white shadow') 
                : (isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]')
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>What-If Sandbox</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={fetchDatabaseInspect}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition shadow-sm cursor-pointer border min-h-[44px] ${
              isDark 
                ? 'bg-[#2b1911] hover:bg-[#382319] border-[#5c3a27] text-amber-300' 
                : 'bg-[#faece4] hover:bg-[#f3dbce] border-[#d89679] text-amber-900'
            }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${inspectLoading ? 'animate-spin' : ''}`} />
            <span>Inspect DB</span>
          </button>
          
          <button 
            onClick={fetchData}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition shadow-sm cursor-pointer border min-h-[44px] ${
              isDark 
                ? 'bg-[#241914] hover:bg-[#32231c] border-[#36261d] text-[#f5ebd9]' 
                : 'bg-[#f5ede3] hover:bg-[#ebe1d5] border-[#e8ded1] text-[#3d2c22]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button 
            onClick={toggleTheme}
            className={`w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition shadow-sm cursor-pointer border shrink-0 ${
              isDark 
                ? 'bg-[#241914] hover:bg-[#32231c] border-[#36261d] text-amber-400' 
                : 'bg-[#f5ede3] hover:bg-[#ebe1d5] border-[#e8ded1] text-amber-700'
            }`}
            title={isDark ? "Switch to Light Mercury" : "Switch to Dark Mercury"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setShowWelcome(true)}
            className={`w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition shadow-sm cursor-pointer border shrink-0 ${
              isDark 
                ? 'bg-[#241914] hover:bg-[#32231c] border-[#36261d] text-amber-400 hover:text-amber-300' 
                : 'bg-[#f5ede3] hover:bg-[#ebe1d5] border-[#e8ded1] text-amber-700 hover:text-amber-900'
            }`}
            title="How to use guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}