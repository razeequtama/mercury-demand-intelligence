'use client';

import { X, HelpCircle } from 'lucide-react';

export default function WelcomeModal({ showWelcome, isFirstVisit, handleCloseWelcome, setShowWelcome, theme }) {
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
              <h3 className="text-xl sm:text-2xl font-bold leading-tight">Hi! Thank you for visiting this project!</h3>
            </div>
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}`}>
              Welcome to <strong className={isDark ? 'text-amber-400' : 'text-amber-700'}>Mercury: </strong> a real-time inventory and demand forecasting engine powered by a Python Scikit-Learn regression pipeline, Node.js gateway, and a full-stack React interface.
            </p>
          </div>
        )}

        {!isFirstVisit && (
          <div className={`flex justify-between items-center mb-5 pb-4 border-b shrink-0 ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
            <div className="flex items-center gap-2">
              <HelpCircle className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <h3 className="text-xl sm:text-2xl font-bold">Mercury User Guide & Glossary</h3>
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
          <h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Step-by-Step Usage Walkthrough</h4>
          
          <div className="space-y-3 sm:space-y-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>1. Explore Live Operations Dashboard</span>
              Monitor real-time inventory counts, automated 7-day demand forecasts, and high stockout risk alerts directly from the main view and charts.
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>2. Switch to the What-If Sandbox</span>
              Click the <strong>What-If Sandbox</strong> tab in the top header to stress-test your pricing strategy and simulate market adjustments.
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>3. Configure Simulation Levers</span>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><strong>Target SKU Dropdown:</strong> Select a specific product (Stock Keeping Unit) to inspect and test.</li>
                <li><strong>Competitor Price Slider:</strong> Drag to simulate competitor undercuts or price hikes and observe automated profit margin protection rules.</li>
                <li><strong>Demand Multiplier:</strong> Scale baseline demand (from 0.5x to 3.0x) to simulate holiday surges or demand shocks.</li>
                <li><strong>Inventory Buffer Override:</strong> Manually override stock levels to test critical stockout countdown thresholds.</li>
              </ul>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18110e] border-[#36261d]' : 'bg-[#f7f2ec] border-[#e8ded1]'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>4. Inspect Raw Database Records</span>
              Click the <strong>Inspect DB</strong> button in the header at any time to inspect live PostgreSQL tables (`products`, `inventory`, `competitorEvents`) in real time.
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
              Have fun exploring!
            </button>
          ) : (
            <button 
              onClick={() => setShowWelcome(false)}
              className={`w-full py-3.5 font-semibold rounded-xl transition-colors text-base cursor-pointer min-h-[48px] ${
                isDark ? 'bg-[#32231c] hover:bg-[#422e25] text-[#f5ebd9]' : 'bg-[#e8ded1] hover:bg-[#ded2c3] text-[#3d2c22]'
              }`}
            >
              Close Guide
            </button>
          )}
        </div>

      </div>
    </div>
  );
}