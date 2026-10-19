'use client';

import { useRef, useEffect } from 'react';
import { Sliders, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { formatRecommendation, formatStockoutRiskScore } from '../../i18n/formatters';
import MercuryRockSlider from './MercuryRockSlider';

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
  const { locale, t } = useLanguage();
  const isMounted = useRef(false);
  const runSimulationRef = useRef(runSimulation);
  useEffect(() => {
    runSimulationRef.current = runSimulation;
  }, [runSimulation]);

  // 250ms Debounced Simulation Dispatcher to prevent slider flood
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (!selectedProductId) return;

    const debounceTimer = setTimeout(() => {
      runSimulationRef.current(selectedProductId, simCompetitorPrice, demandMultiplier, stockOverride);
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [selectedProductId, simCompetitorPrice, demandMultiplier, stockOverride]);

  const currentProduct = intelligence.find(item => Number(item.id) === Number(selectedProductId));
  const basePrice = currentProduct ? parseFloat(currentProduct.currentPrice) : 50;
  const minCompPrice = Math.max(1, Math.round(basePrice * 0.1));
  const maxCompPrice = Math.max(100, Math.ceil((basePrice * 2.5) / 10) * 10);

  const baseStock = currentProduct ? parseInt(currentProduct.currentInventory, 10) : 100;
  const maxStock = Math.max(500, Math.ceil(Math.max(baseStock * 2.5, Number(stockOverride) || 0) / 50) * 50);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 ${
        isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
      }`}>
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 mb-1.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            <Sliders className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span>{t('sandbox.scenarioLevers')}</span>
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
            {t('sandbox.description')}
          </p>
        </div>

        <div>
          <label className={`block text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
            {t('sandbox.targetSku')}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const newId = parseInt(e.target.value, 10);
              setSelectedProductId(newId);
              
              const prod = intelligence.find(item => Number(item.id) === Number(newId));
              if (prod) {
                const defaultCompPrice = prod.competitorPrice || prod.currentPrice * 0.9;
                const defaultStock = prod.currentInventory;
                
                setSimCompetitorPrice(defaultCompPrice);
                setStockOverride(defaultStock);
                setDemandMultiplier(1.0);
              }
            }}
            className={`w-full border rounded-xl px-4 py-3.5 sm:py-3 text-sm sm:text-base focus:outline-none cursor-pointer min-h-[48px] ${
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

        <MercuryRockSlider
          label={t('sandbox.competitorPrice')}
          subLabel={`(${t('sandbox.ourPrice')}: $${
            simulationResult?.baseOurPrice || 
            currentProduct?.currentPrice || 
            '—'
          })`}
          value={simCompetitorPrice}
          displayValue={`$${Number(simCompetitorPrice).toFixed(2)}`}
          min={minCompPrice}
          max={maxCompPrice}
          step={1}
          minLabel={`$${minCompPrice}`}
          maxLabel={`$${maxCompPrice}`}
          onChange={(e) => setSimCompetitorPrice(e.target.value)}
          isDark={isDark}
        />

        <MercuryRockSlider
          label={t('sandbox.demandMultiplier')}
          value={demandMultiplier}
          displayValue={`${Number(demandMultiplier).toFixed(1)}x`}
          min={0.5}
          max={3.0}
          step={0.1}
          minLabel="0.5x"
          maxLabel="3.0x"
          onChange={(e) => setDemandMultiplier(e.target.value)}
          isDark={isDark}
        />

        <MercuryRockSlider
          label={t('sandbox.inventoryOverride')}
          value={stockOverride}
          displayValue={`${stockOverride} ${t('common.units')}`}
          min={0}
          max={maxStock}
          step={5}
          minLabel="0"
          maxLabel={`${maxStock} ${t('common.units')}`}
          onChange={(e) => setStockOverride(e.target.value)}
          isDark={isDark}
        />
      </div>

      <div className="lg:col-span-2 space-y-5 sm:space-y-6">
        {simLoading ? (
          <div className={`border rounded-2xl p-10 sm:p-12 text-center text-base sm:text-lg ${
            isDark ? 'bg-[#201510]/80 border-[#36261d] text-[#b8a394]' : 'bg-white/80 border-[#e8ded1] text-[#6b5646]'
          }`}>
            <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            {t('sandbox.runningInference')}
          </div>
        ) : simulationResult ? (
          <>
            <div className={`border rounded-2xl p-5 sm:p-7 shadow-xl ${
              simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' 
                ? (isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900') 
                : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT'
                ? (isDark ? 'bg-red-950/40 border-red-800/80 text-red-200' : 'bg-red-50 border-red-300 text-red-900')
                : (isDark ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
            }`}>
              <div className="flex items-center gap-2.5 font-bold mb-2.5 text-base sm:text-lg uppercase tracking-wider">
                {simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' ? (
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
                ) : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT' ? (
                  <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                )}
                <span>{t('sandbox.recommendationPreview')}</span>
              </div>
              <p className="text-base sm:text-lg font-medium leading-relaxed">{formatRecommendation(simulationResult.engineRecommendation, locale)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.simulatedDemand')}
                </div>
                <div className={`text-3xl sm:text-4xl font-mono font-extrabold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {simulationResult.simulatedDemand} {t('common.units')}
                </div>
                <div className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                  {t('sandbox.scaledMultiplier', { multiplier: demandMultiplier })}
                </div>
              </div>

              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.stockoutTimeline')}
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-amber-500">{simulationResult.daysUntilStockout} {t('common.days')}</div>
                <div className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{formatStockoutRiskScore(simulationResult.stockoutRiskScore, locale)}</div>
              </div>

              <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
              }`}>
                <div className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                  {t('sandbox.projectedMargin')}
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-500">{simulationResult.projectedMarginPercent}%</div>
                <div className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('sandbox.priceMatchTarget')}: ${simulationResult.simulatedOurPrice}</div>
              </div>
            </div>
          </>
        ) : (
          <div className={`border rounded-2xl p-8 sm:p-12 text-center shadow-lg flex flex-col items-center justify-center min-h-[340px] ${
            isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
          }`}>
            <Sliders className={`w-12 h-12 mb-4 opacity-50 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
              {intelligence.length === 0 ? t('sandbox.noProductsAvailable') : t('sandbox.noSimulation')}
            </h3>
            <p className={`text-sm sm:text-base max-w-md mb-6 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              {intelligence.length === 0 ? t('dashboard.noIntelligenceData') : t('sandbox.noSimulationDesc')}
            </p>
            {selectedProductId && (
              <button
                type="button"
                onClick={() => runSimulation(selectedProductId, simCompetitorPrice, demandMultiplier, stockOverride)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold shadow-md transition cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-[#d97706] hover:bg-[#b45309] text-white'
                    : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('sandbox.runSimulationNow')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}