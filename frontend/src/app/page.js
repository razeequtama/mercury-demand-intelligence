'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  Sliders,
  Layers,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function Dashboard() {

  // Welcome message
  const [showWelcome, setShowWelcome] = useState(false);
  // Guide
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('mercury_welcomed');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('mercury_welcomed', 'true');
    setShowWelcome(false);
  };

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'sandbox'
  
  // Dashboard State
  const [intelligence, setIntelligence] = useState([]);
  const [insights, setInsights] = useState([]);
  const [autonomousLogs, setAutonomousLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Database Inspector State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbData, setDbData] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [inspectLoading, setInspectLoading] = useState(false);

  // Sandbox State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [simCompetitorPrice, setSimCompetitorPrice] = useState(80);
  const [demandMultiplier, setDemandMultiplier] = useState(1.0);
  const [stockOverride, setStockOverride] = useState(50);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intelRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/intelligence`),
        axios.get(`${API_URL}/insights`)
      ]);

      setIntelligence(intelRes.data.data || []);
      setInsights(insightsRes.data.insights || []);
      setAutonomousLogs(insightsRes.data.autonomousLogs || []);
      setError(null);

      // Set default selected product for sandbox if available
      if (intelRes.data.data && intelRes.data.data.length > 0 && !selectedProductId) {
        setSelectedProductId(intelRes.data.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch Mercury data:", err);
      setError("Could not connect to Mercury Backend Engine. Ensure your Node.js server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseInspect = async () => {
    try {
      setInspectLoading(true);
      const res = await axios.get(`${API_URL}/database-inspect`);
      setDbData(res.data.tables);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch database inspection feed:", err);
    } finally {
      setInspectLoading(false);
    }
  };

  // Run simulation whenever levers change
  const runSimulation = async (prodId, price, multiplier, stock) => {
    if (!prodId) return;
    try {
      setSimLoading(true);
      const res = await axios.post(`${API_URL}/sandbox/simulate`, {
        productId: prodId,
        simulatedCompetitorPrice: parseFloat(price),
        demandMultiplier: parseFloat(multiplier),
        stockOverride: parseInt(stock)
      });
      setSimulationResult(res.data.simulation);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProductId && intelligence.length > 0) {
      const currentProd = intelligence.find(item => item.id === selectedProductId);
      if (currentProd) {
        setSimCompetitorPrice(currentProd.competitorPrice || currentProd.currentPrice * 0.9);
        setStockOverride(currentProd.currentInventory);
        setSimulationResult(prev => ({
          ...prev,
          baseOurPrice: currentProd.currentPrice
        }));
        runSimulation(selectedProductId, currentProd.competitorPrice || currentProd.currentPrice * 0.9, demandMultiplier, currentProd.currentInventory);
      }
    }
  }, [selectedProductId, intelligence]);

  const highRiskCount = intelligence.filter(item => item.statusAlert === 'High Stockout Risk').length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans relative">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Mercury Demand Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Commerce Command Center</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time demand forecasting, stockout risk scoring, and autonomous decision simulation.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Live Operations
            </button>
            <button
              onClick={() => setCurrentView('sandbox')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'sandbox' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              What-If Sandbox
            </button>
          </div>

          <button 
            onClick={fetchDatabaseInspect}
            className="flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <Database className={`w-4 h-4 ${inspectLoading ? 'animate-spin' : ''}`} />
            Inspect DB
          </button>
          
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

            {/* {Guide} */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200">Inventory Command Center</h2>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors flex items-center space-x-1.5"
          >
            <span>{showGuide ? "Hide Guide ✕" : "ℹ️ How to read this dashboard"}</span>
          </button>
        </div>

        {/* Collapsible Guide Card */}
        {showGuide && (
          <div className="mt-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 animate-fadeIn">
            <div>
              <strong className="text-indigo-400 block mb-1">📊 7-Day Forecast</strong>
              Predicted sales volume derived from your Python linear regression model running on historical orders.
            </div>
            <div>
              <strong className="text-indigo-400 block mb-1">⚠️ Stockout Risk</strong>
              The percentage threshold comparing upcoming demand to your available warehouse stock. High risk triggers auto-reorders.
            </div>
            <div>
              <strong className="text-indigo-400 block mb-1">🎛️ Simulation Sandbox</strong>
              Tweak competitor prices or demand multipliers below to watch the ML engine recalculate revenue and stockout dates in real time.
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* CONDITIONAL VIEW: DASHBOARD VS SANDBOX */}
      {currentView === 'dashboard' ? (
        <>
          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Tracked SKUs</span>
                <Package className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold">{loading ? '—' : intelligence.length}</div>
              <p className="text-xs text-slate-500 mt-1">Across multiple active warehouses</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">High Stockout Risk</span>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-amber-400">{loading ? '—' : highRiskCount}</div>
              <p className="text-xs text-slate-500 mt-1">Probability exceeds 70% threshold</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Market Alerts</span>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400">{loading ? '—' : insights.length}</div>
              <p className="text-xs text-slate-500 mt-1">Competitor & pricing shifts detected</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Engine Status</span>
                <TrendingUp className={`w-5 h-5 ${error ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div className={`text-2xl font-bold ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                {error ? 'Degraded' : 'Optimal'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {error ? 'Services reporting failure' : 'Inferences running in real-time'}
              </p>
            </div>
          </div>

          {/* Autonomous Execution Audit Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Autonomous Decision Engine Audit Log
            </h2>
            <p className="text-xs text-slate-400 mb-4">Procedures executed automatically by Mercury without human intervention upon detecting market anomalies.</p>
            
            <div className="space-y-3">
              {autonomousLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No autonomous procedures executed yet.</p>
              ) : (
                autonomousLogs.map(log => (
                  <div key={log.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {log.action_type}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">{log.name} ({log.sku})</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium">{log.description}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      {new Date(log.executed_at).toLocaleTimeString()} • <span className="text-emerald-400 font-semibold">{log.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory & Demand Forecast Table + Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
              <h2 className="text-lg font-semibold mb-4">Inventory & 7-Day Demand Predictions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold">7-Day Forecast</th>
                      <th className="pb-3 font-semibold">Stockout Risk</th>
                      <th className="pb-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {intelligence.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 pr-3">
                          <div className="font-medium text-slate-200">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.sku} • {item.warehouse}</div>
                        </td>
                        <td className="py-4 font-mono font-semibold">{item.currentInventory}</td>
                        <td className="py-4 font-mono text-indigo-400 font-semibold">{item.forecast7Day} units</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            parseInt(item.stockoutProbability) > 70 
                              ? 'bg-red-950 text-red-300 border border-red-800' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.stockoutProbability}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-400">
                          {item.recommendation ? (
                            <span className="text-amber-400 font-medium">{item.recommendation}</span>
                          ) : (
                            <span className="text-slate-500">Stock Stable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <h2 className="text-lg font-semibold mb-4">7-Day Demand vs Inventory</h2>
              <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intelligence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="sku" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="currentInventory" name="Current Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="forecast7Day" name="7-Day Demand" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* WHAT-IF SCENARIO SANDBOX VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls (1 col) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Scenario Levers
              </h2>
              <p className="text-xs text-slate-400">Inject simulated market shifts to test autonomous decision resilience.</p>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Target SKU</label>
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
                    setDemandMultiplier(1.0); // Reset multiplier on switch for clean slate
                    
                    // Immediately fire simulation with the fresh product context
                    runSimulation(newId, defaultCompPrice, 1.0, defaultStock);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {intelligence.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Competitor Price */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Simulated Competitor Price 
                  <span className="text-slate-500 font-normal ml-2">
                    (Our Price: ${
                      simulationResult?.baseOurPrice || 
                      intelligence.find(item => item.id === selectedProductId)?.currentPrice || 
                      '—'
                    })
                  </span>
                </label>
                <span className="text-sm font-mono font-bold text-indigo-400">${simCompetitorPrice}</span>
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
                className="w-full accent-indigo-500 bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Slider 2: Demand Multiplier */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Demand Surge Multiplier</label>
                <span className="text-sm font-mono font-bold text-indigo-400">{demandMultiplier}x</span>
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
                className="w-full accent-indigo-500 bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Slider 3: Stock Buffer Override */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Inventory Buffer Override</label>
                <span className="text-sm font-mono font-bold text-indigo-400">{stockOverride} units</span>
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
                className="w-full accent-indigo-500 bg-slate-950 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Live Intelligence Outputs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {simLoading ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                Running live inference sandbox calculation...
              </div>
            ) : simulationResult ? (
              <>
                {/* Decision Engine Preview Banner */}
                <div className={`border rounded-2xl p-6 shadow-xl ${
                  simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' 
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
                    : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT'
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-2 text-sm uppercase tracking-wider">
                    {simulationResult.actionSeverity === 'WARNING_MARGIN_BREACH' ? (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    ) : simulationResult.actionSeverity === 'CRITICAL_STOCKOUT' ? (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    Autonomous Decision Engine Recommendation Preview
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{simulationResult.engineRecommendation}</p>
                </div>

                {/* Metric Output Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Simulated 7-Day Demand</div>
                    <div className="text-3xl font-mono font-bold text-indigo-400">{simulationResult.simulatedDemand} units</div>
                    <div className="text-xs text-slate-500 mt-1">Scaled by {demandMultiplier}x multiplier</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Stockout Timeline</div>
                    <div className="text-3xl font-mono font-bold text-amber-400">{simulationResult.daysUntilStockout} Days</div>
                    <div className="text-xs text-slate-500 mt-1">{simulationResult.stockoutRiskScore}</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Projected Gross Margin</div>
                    <div className="text-3xl font-mono font-bold text-emerald-400">{simulationResult.projectedMarginPercent}%</div>
                    <div className="text-xs text-slate-500 mt-1">Price match target: ${simulationResult.simulatedOurPrice}</div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Database Inspector Modal */}
      {isModalOpen && dbData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">PostgreSQL Raw Database Inspector</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-800 px-6 pt-3 gap-4 bg-slate-950/40">
              {['products', 'inventory', 'competitorEvents'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-semibold capitalize border-b-2 transition cursor-pointer ${
                    activeTab === tab 
                      ? 'border-indigo-500 text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'competitorEvents' ? 'Competitor Events' : tab} ({dbData[tab].length})
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
              <table className="w-full text-left">
                <thead className="text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    {Object.keys(dbData[activeTab][0] || {}).map(col => (
                      <th key={col} className="pb-2 pr-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {dbData[activeTab].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      {Object.values(row).map((val, vIdx) => (
                        <td key={vIdx} className="py-3 pr-4 text-slate-300">
                          {val !== null ? val.toString() : <span className="text-slate-600 italic">NULL</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-right text-xs text-slate-500">
              Connected to PostgreSQL v.4533 (Read-Only Inspection Mode)
            </div>
          </div>
        </div>
      )}

      {/* Welcome */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl font-bold">🚀</span>
              <h3 className="text-xl font-bold">Hi! Thank you for visiting this project!</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Welcome to <strong className="text-indigo-400">Mercury: </strong>a real-time inventory and demand forecasting engine powered by a Python Scikit-Learn regression pipeline and a full-stack React interface.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2 mb-6">
              <div><strong className="text-slate-300">How it works:</strong> Select a SKU from the dropdown, tweak the competitor price or demand sliders, and watch the ML engine instantly recalculate stockout risks and reorder thresholds!</div>
            </div>
            <button 
              onClick={handleCloseWelcome}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              Have fun!
            </button>
          </div>
        </div>
      )}

    </main>
  );
}