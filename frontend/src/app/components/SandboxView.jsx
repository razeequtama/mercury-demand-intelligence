'use client';

import { Sliders, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';

export default function SandboxView({
  intelligence,
  selectedProductId,
  setSelectedProductId,
  simCompetitorPrice,
  setSimCompetitorPrice,
  demandMultiplier,
  setDemandMultiplier,
  stockOverride,
  setStockOverride,
  simulationResult,
  simLoading,
  runSimulation,
  theme
}) {
  const isDark = theme === 'dark';
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 ${
        isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
      }`}>
        <div>
          <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            <Sliders className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span>{t('sandbox.scenarioLevers')}</span>
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
            {t('sandbox.description')}
          </p>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
            {t('sandbox.targetSku')}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedProductId(newId);
              
              const prod = intelligence.find(item => item.id === newId);
              if (prod) {
                const defaultCompPrice = prod.competitorPrice || prod.currentPrice * 0.9;
                const defaultStock = prod.currentInventory;
                
                setSimCompetitorPrice(defaultCompPrice);
                setStockOverride(defaultStock);
                setDemandMultiplier(1.0);
                
                runSimulation(newId, defaultCompPrice, 1.0, defaultStock);
              }
            }}
            className={`w-full border rounded-xl px-4 py-3.5 sm:py-3 text-sm focus:outline-none cursor-pointer min-h-[48px] ${
              isDark 
                ? 'bg-[#18110e] border-[#36261d] text-[#fff8f0] focus:border-amber-500' 
                : 'bg-[#faf6f0] border-[#e8ded1] text-[#241a14] focus:border-amber-700'
            }`}
          >
            {intelligence.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              {t('sandbox.competitorPrice')}
              <span className={`font-normal ml-1 sm:ml-2 block sm:inline ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                ({t('sandbox.ourPrice')}: ${
                  simulationResult?.baseOurPrice || 
                  intelligence.find(item => item.id === selectedProductId)?.currentPrice || 
                  '—'
                })
              </span>
            </label>
            <span className={`text-base font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>${simCompetitorPrice}</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="250" 
            step="1"
            value={simCompetitorPrice}
            onChange={(e) => {
              setSimCompetitorPrice(e.target.value);
              runSimulation(selectedProductId, e.target.value, demandMultiplier, stockOverride);
            }}
            className={`w-full cursor-pointer py-3 h-3 ${isDark ? 'accent-amber-500 bg-[#18110e]' : 'accent-amber-700 bg-[#faf6f0]'}`}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              {t('sandbox.demandMultiplier')}
            </label>
            <span className={`text-base font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{demandMultiplier}x</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="3.0" 
            step="0.1"
            value={demandMultiplier}
            onChange={(e) => {
              setDemandMultiplier(e.target.value);
              runSimulation(selectedProductId, simCompetitorPrice, e.target.value, stockOverride);
            }}
            className={`w-full cursor-pointer py-3 h-3 ${isDark ? 'accent-amber-500 bg-[#18110e]' : 'accent-amber-700 bg-[#faf6f0]'}`}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              {t('sandbox.inventoryOverride')}
            </label>
            <span className={`text-base font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{stockOverride} units</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="500" 
            step="5"
            value={stockOverride}
            onChange={(e) => {
              setStockOverride(e.target.value);
              runSimulation(selectedProductId, simCompetitorPrice, demandMultiplier, e.target.value);
            }}
            className={`w-full cursor-pointer py-3 h-3 ${isDark ? 'accent-amber-500 bg-[#18110e]' : 'accent-amber-700 bg-[#faf6f0]'}`}
          />
        </div>
      </div>

      <div className="lg:col-span-2 space-y-5 sm:space-y-6">
        {simLoading ? (
          <div className={`border rounded-2xl p-10 sm:p-12 text-center text-sm sm:text-base ${
            isDark ? 'bg-[#201510]/80 border-[#36261d] text-[#b8a394]' : 'bg-white/80 border-[#e8ded1] text-[#6b5646]'
          }`}>
            <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            {t('sandbox.runningInference')}
          </div>
        ) : simulationResult ? (
          <>
            <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl ${
              simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' 
                ? (isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900') 
                : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT'
                ? (isDark ? 'bg-red-950/40 border-red-800/80 text-red-200' : 'bg-red-50 border-red-300 text-red-900')
                : (isDark ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
            }`}>
              <div className="flex items-center gap-2 font-bold mb-2 text-sm sm:text-base uppercase tracking-wider">
                {simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' ? (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                ) : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT' ? (
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <span>{t('sandbox.recommendationPreview')}</span>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed">{simulationResult.engineRecommendation}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.simulatedDemand')}
                </div>
                <div className={`text-2xl sm:text-3xl font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {simulationResult.simulatedDemand} {t('common.units')}
                </div>
                <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                  {t('sandbox.scaledMultiplier', { multiplier: demandMultiplier })}
                </div>
              </div>

              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.stockoutTimeline')}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-500">{simulationResult.daysUntilStockout} Days</div>
                <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{simulationResult.stockoutRiskScore}</div>
              </div>

              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.projectedMargin')}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-500">{simulationResult.projectedMarginPercent}%</div>
                <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('sandbox.priceMatchTarget')}: ${simulationResult.simulatedOurPrice}</div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}