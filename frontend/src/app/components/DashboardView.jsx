'use client';

import { useState } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Zap, 
  ShoppingCart, 
  Send, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLanguage } from '../../i18n/LanguageProvider';
import {
  formatMarketEvent,
  formatDecisionEngineAction,
  formatAuditActionType,
  formatAuditDescription,
  formatAuditStatus,
  formatRulesMessage,
  formatRecommendation,
  formatOrderFeedback
} from '../../i18n/formatters';
import { getSessionHeaders } from '../utils/session';

export default function DashboardView({ 
  intelligence, 
  insights, 
  autonomousLogs, 
  loading, 
  error, 
  theme, 
  fetchData, 
  API_URL 
}) {
  const isDark = theme === 'dark';
  const { locale, t } = useLanguage();
  const highRiskCount = intelligence.filter(item => item.statusAlert === 'High Stockout Risk').length;

  // State for Decision Engine Execution
  const [executingRules, setExecutingRules] = useState(false);
  const [rulesMessage, setRulesMessage] = useState(null);

  // State for Order Ingestion Simulator
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(5);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState(null);

  const handleExecuteRules = async () => {
    if (!API_URL) return;
    try {
      setExecutingRules(true);
      setRulesMessage(null);
      const res = await axios.post(`${API_URL}/insights/execute-actions`, {}, { headers: getSessionHeaders() });
      setRulesMessage(res.data.message || 'Rules evaluated successfully.');
      if (fetchData) await fetchData();
      setTimeout(() => setRulesMessage(null), 4000);
    } catch (err) {
      console.error('Failed to execute rules:', err);
      setRulesMessage(err.response?.data?.error || 'Failed to execute rules.');
      setTimeout(() => setRulesMessage(null), 4000);
    } finally {
      setExecutingRules(false);
    }
  };

  const handleSimulateOrder = async (e) => {
    e.preventDefault();
    const prodId = orderProductId || (intelligence[0] ? intelligence[0].id : null);
    if (!prodId || !API_URL) return;

    try {
      setOrderSubmitting(true);
      setOrderFeedback(null);
      const res = await axios.post(`${API_URL}/simulate-order`, {
        productId: parseInt(prodId, 10),
        quantity: parseInt(orderQuantity, 10)
      }, { headers: getSessionHeaders() });
      setOrderFeedback({ type: 'success', text: formatOrderFeedback(res.data.message, locale) || t('dashboard.orderSuccess') });
      if (fetchData) await fetchData();
      setTimeout(() => setOrderFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to simulate order:', err);
      setOrderFeedback({ type: 'error', text: formatOrderFeedback(err.response?.data?.error, locale) || 'Simulation failed.' });
      setTimeout(() => setOrderFeedback(null), 4000);
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <>
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider">{t('dashboard.trackedSkus')}</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {loading ? '—' : intelligence.length}
          </div>
          <p className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.warehouses')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider">{t('dashboard.highStockoutRisk')}</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-500">{loading ? '—' : highRiskCount}</div>
          <p className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.riskThreshold')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider">{t('dashboard.activeMarketAlerts')}</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {loading ? '—' : insights.length}
          </div>
          <p className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.competitorShifts')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider">{t('dashboard.engineStatus')}</span>
          </div>
          <div className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${
            loading
              ? (isDark ? 'text-sky-400' : 'text-sky-600')
              : error
                ? (isDark ? 'text-red-400' : 'text-red-600')
                : (isDark ? 'text-yellow-400' : 'text-yellow-600')
          }`}>
            {loading ? t('dashboard.syncing') : error ? t('dashboard.degraded') : t('dashboard.optimal')}
          </div>
          <p className={`text-sm sm:text-base mt-1.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
            {loading ? t('dashboard.pipelineSyncing') : error ? t('dashboard.servicesFailed') : t('dashboard.inferencesRunning')}
          </p>
        </div>
      </div>

      {/* Interactive Controls Row: Market Alerts & Order Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Market & Competitor Alerts */}
        <div className={`lg:col-span-2 border rounded-2xl p-4 sm:p-6 shadow-xl ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
              <span>{t('dashboard.marketAlertsTitle')}</span>
            </h2>
            <span className={`text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-full border ${
              isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {insights.length} {t('dashboard.activeMarketAlerts')}
            </span>
          </div>
          <p className={`text-sm sm:text-base mb-4 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
            {t('dashboard.marketAlertsDesc')}
          </p>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {insights.length === 0 ? (
              <p className={`text-base italic ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                {t('dashboard.noCompetitorAnomalies')}
              </p>
            ) : (
              insights.map(item => {
                const diff = (parseFloat(item.ourPrice) - parseFloat(item.competitorPrice)).toFixed(2);
                return (
                  <div key={item.eventId} className={`border p-4 rounded-xl transition ${
                    isDark ? 'bg-[#18110e]/70 border-[#36261d]' : 'bg-[#faf6f0]/70 border-[#e8ded1]'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-base sm:text-lg font-bold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                          {item.productName}
                        </span>
                        <span className={`text-sm font-mono ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                          ({item.sku})
                        </span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border ${
                        parseFloat(diff) > 0 
                          ? (isDark ? 'bg-red-950/80 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300')
                          : (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                      }`}>
                        {parseFloat(diff) > 0 ? `${t('dashboard.undercut')}: -$${diff}` : t('dashboard.competitive')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm font-mono mb-2">
                      <span className={isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}>
                        {t('dashboard.ourPrice')}: <strong className="text-amber-500">${parseFloat(item.ourPrice).toFixed(2)}</strong>
                      </span>
                      <span className={isDark ? 'text-[#d4c2b4]' : 'text-[#594537]'}>
                        {t('dashboard.competitor')}: <strong className="text-red-400">${parseFloat(item.competitorPrice).toFixed(2)}</strong>
                      </span>
                    </div>

                    <p className={`text-sm sm:text-base leading-relaxed mb-2 ${isDark ? 'text-[#c2afa3]' : 'text-[#5c4738]'}`}>
                      {formatMarketEvent(item.marketEvent, locale)}
                    </p>

                    <div className={`text-sm sm:text-base font-semibold pt-2 border-t ${
                      isDark ? 'border-[#36261d]/80 text-amber-400' : 'border-[#e8ded1]/80 text-amber-800'
                    }`}>
                      {formatDecisionEngineAction(item.decisionEngineAction, locale)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transactional Order Ingestion Simulator */}
        <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 mb-2 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
              <ShoppingCart className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span>{t('dashboard.simulateOrderTitle')}</span>
            </h2>
            <p className={`text-sm sm:text-base mb-4 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              {t('dashboard.simulateOrderDesc')}
            </p>

            <form onSubmit={handleSimulateOrder} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
                  {t('common.product')}
                </label>
                <select
                  value={orderProductId || (intelligence[0]?.id || '')}
                  onChange={(e) => setOrderProductId(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm sm:text-base focus:outline-none cursor-pointer ${
                    isDark 
                      ? 'bg-[#18110e] border-[#36261d] text-[#fff8f0] focus:border-amber-500' 
                      : 'bg-[#faf6f0] border-[#e8ded1] text-[#241a14] focus:border-amber-700'
                  }`}
                >
                  {intelligence.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - {item.currentInventory} {t('dashboard.inStock')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
                  {t('dashboard.quantity')}
                </label>
                <div className="flex gap-2">
                  {[5, 15, 30].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setOrderQuantity(qty)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition cursor-pointer ${
                        orderQuantity === qty
                          ? isDark
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-amber-700 text-white border-amber-600'
                          : isDark
                            ? 'bg-[#18110e] border-[#36261d] text-[#b8a394] hover:text-[#fff8f0]'
                            : 'bg-[#faf6f0] border-[#e8ded1] text-[#6b5646] hover:text-[#241a14]'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-24 text-center border rounded-lg px-2.5 py-2 text-sm sm:text-base font-mono font-bold focus:outline-none ${
                      isDark 
                        ? 'bg-[#18110e] border-[#36261d] text-[#fff8f0] focus:border-amber-500' 
                        : 'bg-[#faf6f0] border-[#e8ded1] text-[#241a14] focus:border-amber-700'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={orderSubmitting || intelligence.length === 0}
                className={`w-full py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  isDark
                    ? 'bg-[#d97706] hover:bg-[#b45309] text-white'
                    : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'
                }`}
              >
                <Send className={`w-5 h-5 ${orderSubmitting ? 'animate-spin' : ''}`} />
                <span>{orderSubmitting ? t('dashboard.ordering') : t('dashboard.placeOrder')}</span>
              </button>
            </form>
          </div>

          {orderFeedback && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2.5 border ${
              orderFeedback.type === 'success'
                ? isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isDark ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{orderFeedback.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Autonomous Execution Audit Log */}
      <div className={`border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl ${
        isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
            <span>{t('dashboard.auditLog')}</span>
          </h2>

          <div className="flex items-center gap-3">
            {rulesMessage && (
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-md border ${
                isDark ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}>
                {formatRulesMessage(rulesMessage, locale)}
              </span>
            )}
            <button
              onClick={handleExecuteRules}
              disabled={executingRules}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base font-bold border transition cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Zap className={`w-4 h-4 ${executingRules ? 'animate-bounce' : 'text-emerald-500'}`} />
              <span>{executingRules ? t('dashboard.executing') : t('dashboard.executeRules')}</span>
            </button>
          </div>
        </div>

        <p className={`text-sm sm:text-base mb-4 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
          {t('dashboard.auditDescription')}
        </p>
        
        <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
          {autonomousLogs.length === 0 ? (
            <p className={`text-base italic ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.noActions')}</p>
          ) : (
            autonomousLogs.map(log => (
              <div key={log.id} className={`border p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 ${
                isDark ? 'bg-[#18110e]/60 border-[#36261d]' : 'bg-[#faf6f0]/60 border-[#e8ded1]'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className={`px-3 py-1 rounded text-xs sm:text-sm font-bold border ${
                      isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {formatAuditActionType(log.action_type, locale)}
                    </span>
                    <span className={`text-base sm:text-lg font-bold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                      {log.name || log.product_name} ({log.sku})
                    </span>
                  </div>
                  <p className={`text-sm sm:text-base font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {formatAuditDescription(log.description, locale)}
                  </p>
                </div>
                <div className={`text-left sm:text-right text-sm font-mono w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 ${isDark ? 'border-[#36261d] text-[#b8a394]' : 'border-[#e8ded1] text-[#7a6452]'}`}>
                  {new Date(log.executed_at).toLocaleTimeString(locale)} • <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {formatAuditStatus(log.status, locale)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inventory Table + Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className={`lg:col-span-2 border rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {t('dashboard.inventoryForecasts')}
          </h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-sm sm:text-base min-w-[700px]">
              <thead className={`border-b uppercase text-xs sm:text-sm font-bold tracking-wider ${isDark ? 'border-[#36261d] text-[#b8a394]' : 'border-[#e8ded1] text-[#7a6452]'}`}>
                <tr>
                  <th className="pb-3.5 pr-4 sm:pr-6 font-bold whitespace-nowrap">{t('common.product')}</th>
                  <th className="pb-3.5 px-4 sm:px-6 font-bold whitespace-nowrap">{t('common.stock')}</th>
                  <th className="pb-3.5 px-4 sm:px-6 font-bold whitespace-nowrap">{t('dashboard.forecast')}</th>
                  <th className="pb-3.5 px-4 sm:px-6 font-bold whitespace-nowrap">{t('dashboard.stockoutRisk')}</th>
                  <th className="pb-3.5 pl-4 sm:pl-6 font-bold whitespace-nowrap">{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#36261d]/60' : 'divide-[#e8ded1]/60'}`}>
                {intelligence.map(item => (
                  <tr key={item.id} className={`transition ${isDark ? 'hover:bg-[#2b1e17]/40' : 'hover:bg-[#fcf8f3]'}`}>
                    <td className="py-4 pr-4 sm:pr-6">
                      <div className={`font-bold text-base sm:text-lg ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{item.name}</div>
                      <div className={`text-sm mt-0.5 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{item.sku} • {item.warehouse}</div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-base whitespace-nowrap">{item.currentInventory}</td>
                    <td className={`py-4 px-4 sm:px-6 font-mono font-bold text-base whitespace-nowrap ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{item.forecast7Day} {t('common.units')}</td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border inline-block ${
                        parseInt(item.stockoutProbability) > 70 
                          ? (isDark ? 'bg-red-950 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300') 
                          : (isDark ? 'bg-amber-950/80 text-amber-400 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300')
                      }`}>
                        {item.stockoutProbability}
                      </span>
                    </td>
                    <td className="py-4 pl-4 sm:pl-6 text-sm sm:text-base">
                      {item.recommendation ? (
                        <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{formatRecommendation(item.recommendation, locale)}</span>
                      ) : (
                        <span className={isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}>{t('dashboard.stable')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {t('dashboard.chartTitle')}
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligence}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#36261d' : '#e8ded1'} />
                <XAxis dataKey="sku" stroke={isDark ? '#b8a394' : '#7a6452'} fontSize={13} />
                <YAxis stroke={isDark ? '#b8a394' : '#7a6452'} fontSize={13} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18110e' : '#ffffff', 
                    borderColor: isDark ? '#36261d' : '#e8ded1', 
                    borderRadius: '8px',
                    color: isDark ? '#fff8f0' : '#241a14',
                    fontSize: '14px'
                  }}
                  labelStyle={{ color: isDark ? '#fff8f0' : '#241a14', fontWeight: 'bold', fontSize: '14px' }}
                />
                <Bar dataKey="currentInventory" name={t('dashboard.currentStock')} fill={isDark ? '#d97706' : '#c2410c'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast7Day" name={t('dashboard.sevenDayDemand')} fill={isDark ? '#f59e0b' : '#ea580c'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}