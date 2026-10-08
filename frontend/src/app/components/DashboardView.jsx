'use client';

import { Package, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLanguage } from '../../i18n/LanguageProvider';

export default function DashboardView({ intelligence, insights, autonomousLogs, loading, error, theme }) {
  const isDark = theme === 'dark';
  const { locale, t } = useLanguage();
  const highRiskCount = intelligence.filter(item => item.statusAlert === 'High Stockout Risk').length;

  return (
    <>
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{t('dashboard.trackedSkus')}</span>
            <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {loading ? '—' : intelligence.length}
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.warehouses')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{t('dashboard.highStockoutRisk')}</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500">{loading ? '—' : highRiskCount}</div>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.riskThreshold')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{t('dashboard.activeMarketAlerts')}</span>
            <Activity className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {loading ? '—' : insights.length}
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.competitorShifts')}</p>
        </div>

        <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
          isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
        }`}>
          <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{t('dashboard.engineStatus')}</span>
            <TrendingUp className={`w-5 h-5 ${error ? 'text-red-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${error ? 'text-red-500' : 'text-emerald-600'}`}>
            {error ? t('dashboard.degraded') : t('dashboard.optimal')}
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
            {error ? t('dashboard.servicesFailed') : t('dashboard.inferencesRunning')}
          </p>
        </div>
      </div>

      {/* Autonomous Execution Audit Log */}
      <div className={`border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl ${
        isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
      }`}>
        <h2 className={`text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
          <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{t('dashboard.auditLog')}</span>
        </h2>
        <p className={`text-xs sm:text-sm mb-4 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
          {t('dashboard.auditDescription')}
        </p>
        
        <div className="space-y-3">
          {autonomousLogs.length === 0 ? (
            <p className={`text-sm italic ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{t('dashboard.noActions')}</p>
          ) : (
            autonomousLogs.map(log => (
              <div key={log.id} className={`border p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                isDark ? 'bg-[#18110e]/60 border-[#36261d]' : 'bg-[#faf6f0]/60 border-[#e8ded1]'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                      isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {log.action_type}
                    </span>
                    <span className={`text-sm font-semibold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                      {log.name} ({log.sku})
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{log.description}</p>
                </div>
                <div className={`text-left sm:text-right text-xs font-mono w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 ${isDark ? 'border-[#36261d] text-[#b8a394]' : 'border-[#e8ded1] text-[#7a6452]'}`}>
                  {new Date(log.executed_at).toLocaleTimeString(locale)} • <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{log.status}</span>
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
          <h2 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {t('dashboard.inventoryForecasts')}
          </h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className={`border-b uppercase text-xs ${isDark ? 'border-[#36261d] text-[#b8a394]' : 'border-[#e8ded1] text-[#7a6452]'}`}>
                <tr>
                  <th className="pb-3 font-semibold">{t('common.product')}</th>
                  <th className="pb-3 font-semibold">{t('common.stock')}</th>
                  <th className="pb-3 font-semibold">{t('dashboard.forecast')}</th>
                  <th className="pb-3 font-semibold">{t('dashboard.stockoutRisk')}</th>
                  <th className="pb-3 font-semibold">{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${isDark ? 'divide-[#36261d]/60' : 'divide-[#e8ded1]/60'}`}>
                {intelligence.map(item => (
                  <tr key={item.id} className={`transition ${isDark ? 'hover:bg-[#2b1e17]/40' : 'hover:bg-[#fcf8f3]'}`}>
                    <td className="py-4 pr-3">
                      <div className={`font-medium text-sm sm:text-base ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>{item.name}</div>
                      <div className={`text-xs sm:text-sm ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{item.sku} • {item.warehouse}</div>
                    </td>
                    <td className="py-4 font-mono font-semibold">{item.currentInventory}</td>
                    <td className={`py-4 font-mono font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{item.forecast7Day} {t('common.units')}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
                        parseInt(item.stockoutProbability) > 70 
                          ? (isDark ? 'bg-red-950 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300') 
                          : (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                      }`}>
                        {item.stockoutProbability}
                      </span>
                    </td>
                    <td className="py-4 text-xs sm:text-sm">
                      {item.recommendation ? (
                        <span className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{item.recommendation}</span>
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
          <h2 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
            {t('dashboard.chartTitle')}
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligence}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#36261d' : '#e8ded1'} />
                <XAxis dataKey="sku" stroke={isDark ? '#b8a394' : '#7a6452'} fontSize={12} />
                <YAxis stroke={isDark ? '#b8a394' : '#7a6452'} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18110e' : '#ffffff', 
                    borderColor: isDark ? '#36261d' : '#e8ded1', 
                    borderRadius: '8px',
                    color: isDark ? '#fff8f0' : '#241a14'
                  }}
                  labelStyle={{ color: isDark ? '#fff8f0' : '#241a14', fontWeight: 'bold' }}
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