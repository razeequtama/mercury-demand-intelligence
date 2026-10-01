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
  AlertCircle,
  HelpCircle,
  Sun,
  Moon
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

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mercury_theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('mercury_theme', newTheme);
  };

  // Welcome / Guide Modal State
  const [showWelcome, setShowWelcome] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('mercury_welcomed');
    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowWelcome(true);
    } else {
      setIsFirstVisit(false);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('mercury_welcomed', 'true');
    setIsFirstVisit(false);
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

  const isDark = theme === 'dark';

  return (
    <main className={`min-h-screen font-sans relative transition-colors duration-300 p-4 sm:p-6 lg:p-10 scrollbar-thin ${
      isDark 
        ? 'bg-[#18110e] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
        : 'bg-[#fdfbf7] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
    }`}>
      {/* Top Header */}
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
        
        {/* Action Controls Header - Responsive Wrapping & Finger-friendly touch targets */}
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

            {/* Theme Toggle Button */}
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
              onClick={() => {
                setIsFirstVisit(false);
                setShowWelcome(true);
              }}
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

      {/* Unified Welcome & Step-by-Step Usage Guide Modal */}
      {showWelcome && (
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
      )}

      {error && (
        <div className={`border p-4 rounded-xl mb-6 sm:mb-8 flex items-center gap-3 ${
          isDark ? 'bg-red-950/40 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* CONDITIONAL VIEW: DASHBOARD VS SANDBOX */}
      {currentView === 'dashboard' ? (
        <>
          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
              isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
            }`}>
              <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Tracked SKUs</span>
                <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                {loading ? '—' : intelligence.length}
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>Across multiple active warehouses</p>
            </div>

            <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
              isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
            }`}>
              <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">High Stockout Risk</span>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-500">{loading ? '—' : highRiskCount}</div>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>Probability exceeds 70% threshold</p>
            </div>

            <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
              isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
            }`}>
              <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Active Market Alerts</span>
                <Activity className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {loading ? '—' : insights.length}
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>Competitor & pricing shifts detected</p>
            </div>

            <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
              isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
            }`}>
              <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Engine Status</span>
                <TrendingUp className={`w-5 h-5 ${error ? 'text-red-500' : 'text-emerald-500'}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${error ? 'text-red-500' : 'text-emerald-600'}`}>
                {error ? 'Degraded' : 'Optimal'}
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                {error ? 'Services reporting failure' : 'Inferences running in real-time'}
              </p>
            </div>
          </div>

          {/* Autonomous Execution Audit Log */}
          <div className={`border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl ${
            isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
          }`}>
            <h2 className={`text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
              <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Autonomous Decision Engine Audit Log</span>
            </h2>
            <p className={`text-xs sm:text-sm mb-4 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
              Procedures executed automatically by Mercury without human intervention upon detecting market anomalies.
            </p>
            
            <div className="space-y-3">
              {autonomousLogs.length === 0 ? (
                <p className={`text-sm italic ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>No autonomous procedures executed yet.</p>
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
                      {new Date(log.executed_at).toLocaleTimeString()} • <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{log.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory & Demand Forecast Table + Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className={`lg:col-span-2 border rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden ${
              isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
            }`}>
              <h2 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                Inventory & 7-Day Demand Predictions
              </h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className={`border-b uppercase text-xs ${isDark ? 'border-[#36261d] text-[#b8a394]' : 'border-[#e8ded1] text-[#7a6452]'}`}>
                    <tr>
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold">7-Day Forecast</th>
                      <th className="pb-3 font-semibold">Stockout Risk</th>
                      <th className="pb-3 font-semibold">Action</th>
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
                        <td className={`py-4 font-mono font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{item.forecast7Day} units</td>
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
                            <span className={isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}>Stock Stable</span>
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
                7-Day Demand vs Inventory
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
                    <Bar dataKey="currentInventory" name="Current Stock" fill={isDark ? '#d97706' : '#c2410c'} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="forecast7Day" name="7-Day Demand" fill={isDark ? '#f59e0b' : '#ea580c'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* WHAT-IF SCENARIO SANDBOX VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 ${
            isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
          }`}>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 mb-1 ${isDark ? 'text-[#fff8f0]' : 'text-[#241a14]'}`}>
                <Sliders className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>Scenario Levers</span>
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
                Inject simulated market shifts to test autonomous decision resilience.
              </p>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'}`}>
                Target SKU
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
                  Simulated Competitor Price 
                  <span className={`font-normal ml-1 sm:ml-2 block sm:inline ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                    (Our Price: ${
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
                  Demand Surge Multiplier
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
                  Inventory Buffer Override
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
                Running live inference sandbox calculation...
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
                    <span>Autonomous Decision Engine Recommendation Preview</span>
                  </div>
                  <p className="text-sm sm:text-base font-medium leading-relaxed">{simulationResult.engineRecommendation}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                    isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
                  }`}>
                    <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                      Simulated 7-Day Demand
                    </div>
                    <div className={`text-2xl sm:text-3xl font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      {simulationResult.simulatedDemand} units
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>
                      Scaled by {demandMultiplier}x multiplier
                    </div>
                  </div>

                  <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                    isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
                  }`}>
                    <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                      Stockout Timeline
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-500">{simulationResult.daysUntilStockout} Days</div>
                    <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>{simulationResult.stockoutRiskScore}</div>
                  </div>

                  <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                    isDark ? 'bg-[#201510]/80 border-[#36261d]' : 'bg-white/80 border-[#e8ded1]'
                  }`}>
                    <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#b8a394]' : 'text-[#7a6452]'}`}>
                      Projected Gross Margin
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-500">{simulationResult.projectedMarginPercent}%</div>
                    <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'}`}>Price match target: ${simulationResult.simulatedOurPrice}</div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Database Inspector Modal */}
      {isModalOpen && dbData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl scrollbar-thin ${
            isDark 
              ? 'bg-[#201510] border-[#3d2a20] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
              : 'bg-white border-[#e5d8cc] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
          }`}>
            <div className={`flex justify-between items-center p-4 sm:p-6 border-b ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
              <div className="flex items-center gap-2">
                <Database className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <h2 className="text-base sm:text-xl font-bold">PostgreSQL Raw Database Inspector</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={`flex overflow-x-auto border-b px-4 sm:px-6 pt-3 gap-3 sm:gap-4 scrollbar-none ${
              isDark ? 'border-[#3d2a20] bg-[#18110e]/40' : 'border-[#e5d8cc] bg-[#faf6f0]/40'
            }`}>
              {['products', 'inventory', 'competitorEvents'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm sm:text-base font-semibold capitalize border-b-2 transition cursor-pointer whitespace-nowrap min-h-[40px] px-2 ${
                    activeTab === tab 
                      ? (isDark ? 'border-amber-500 text-amber-400' : 'border-amber-700 text-amber-800') 
                      : (isDark ? 'border-transparent text-[#b8a394] hover:text-[#fff8f0]' : 'border-transparent text-[#7a6452] hover:text-[#241a14]')
                  }`}
                >
                  {tab === 'competitorEvents' ? 'Competitor Events' : tab} ({dbData[tab].length})
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs sm:text-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead className={`border-b uppercase text-xs ${isDark ? 'border-[#3d2a20] text-[#b8a394]' : 'border-[#e5d8cc] text-[#7a6452]'}`}>
                    <tr>
                      {Object.keys(dbData[activeTab][0] || {}).map(col => (
                        <th key={col} className="pb-3 pr-4">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#3d2a20]/40' : 'divide-[#e5d8cc]/40'}`}>
                    {dbData[activeTab].map((row, idx) => (
                      <tr key={idx} className={`transition ${isDark ? 'hover:bg-[#2b1e17]/20' : 'hover:bg-[#fcf8f3]'}`}>
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className={`py-3.5 pr-4 ${isDark ? 'text-[#d4c2b4]' : 'text-[#4e3b2e]'}`}>
                            {val !== null ? val.toString() : <span className={isDark ? 'text-[#7a6452] italic' : 'text-[#a38f80] italic'}>NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-3 sm:p-4 border-t ${isDark ? 'border-[#3d2a20] bg-[#18110e]/60' : 'border-[#e5d8cc] bg-[#faf6f0]/60'}`}>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
