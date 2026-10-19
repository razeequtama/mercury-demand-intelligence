'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import DatabaseInspectorModal from './components/DatabaseInspectorModal';
import DashboardView from './components/DashboardView';
import SandboxView from './components/SandboxView';
import { useLanguage } from '../i18n/LanguageProvider';
import { getSessionHeaders, resetVisitorSession } from './utils/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const themeSubscribe = (callback) => {
  window.addEventListener('storage', callback);
  window.addEventListener('mercury_theme_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('mercury_theme_change', callback);
  };
};

const getThemeSnapshot = () => {
  return localStorage.getItem('mercury_theme') || 'dark';
};

const getThemeServerSnapshot = () => 'dark';

const welcomeSubscribe = (callback) => {
  window.addEventListener('storage', callback);
  window.addEventListener('mercury_welcomed_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('mercury_welcomed_change', callback);
  };
};

const getHasVisitedSnapshot = () => {
  return Boolean(localStorage.getItem('mercury_welcomed'));
};

const getHasVisitedServerSnapshot = () => true;

export default function Dashboard() {
  const { t } = useLanguage();
  const theme = useSyncExternalStore(themeSubscribe, getThemeSnapshot, getThemeServerSnapshot);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mercury_theme', newTheme);
    window.dispatchEvent(new Event('mercury_theme_change'));
  };

  const hasVisited = useSyncExternalStore(welcomeSubscribe, getHasVisitedSnapshot, getHasVisitedServerSnapshot);
  const [welcomeOpenOverride, setWelcomeOpenOverride] = useState(null);

  const showWelcome = welcomeOpenOverride !== null ? welcomeOpenOverride : !hasVisited;
  const isFirstVisit = !hasVisited;

  const handleCloseWelcome = () => {
    localStorage.setItem('mercury_welcomed', 'true');
    window.dispatchEvent(new Event('mercury_welcomed_change'));
    setWelcomeOpenOverride(false);
  };

  const setShowWelcome = (value) => {
    setWelcomeOpenOverride(typeof value === 'function' ? value(showWelcome) : value);
  };

  const [currentView, setCurrentView] = useState('dashboard');
  const [intelligence, setIntelligence] = useState([]);
  const [insights, setInsights] = useState([]);
  const [autonomousLogs, setAutonomousLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbData, setDbData] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [simCompetitorPrice, setSimCompetitorPrice] = useState(80);
  const [demandMultiplier, setDemandMultiplier] = useState(1.0);
  const [stockOverride, setStockOverride] = useState(50);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const runSimulation = useCallback(async (prodId, price, multiplier, stock) => {
    if (!prodId) return;
    try {
      setSimLoading(true);
      const res = await axios.post(`${API_URL}/sandbox/simulate`, {
        productId: prodId,
        simulatedCompetitorPrice: parseFloat(price),
        demandMultiplier: parseFloat(multiplier),
        stockOverride: parseInt(stock, 10)
      }, { headers: getSessionHeaders() });
      setSimulationResult(res.data.simulation);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [intelRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/intelligence`, { headers: getSessionHeaders() }),
        axios.get(`${API_URL}/insights`, { headers: getSessionHeaders() })
      ]);

      const items = intelRes.data.data || [];
      setIntelligence(items);
      setInsights(insightsRes.data.insights || []);
      setAutonomousLogs(insightsRes.data.autonomousLogs || []);
      setError(null);

      if (items.length > 0) {
        const firstProd = items[0];
        const defaultCompPrice = firstProd.competitorPrice || firstProd.currentPrice * 0.9;
        const defaultStock = firstProd.currentInventory;

        setSelectedProductId(prev => prev || firstProd.id);
        setSimCompetitorPrice(prev => (prev === 80 ? defaultCompPrice : prev));
        setStockOverride(prev => (prev === 50 ? defaultStock : prev));
        setSimulationResult(prev => prev || {
          baseOurPrice: firstProd.currentPrice
        });
      }
    } catch (err) {
      console.error("Failed to fetch Mercury data:", err);
      setError('errors.backendUnavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetSandbox = useCallback(async () => {
    try {
      setResetting(true);
      await resetVisitorSession(API_URL);
      setDemandMultiplier(1.0);
      setSimulationResult(null);

      const [intelRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/intelligence`, { headers: getSessionHeaders() }),
        axios.get(`${API_URL}/insights`, { headers: getSessionHeaders() })
      ]);

      const items = intelRes.data.data || [];
      setIntelligence(items);
      setInsights(insightsRes.data.insights || []);
      setAutonomousLogs(insightsRes.data.autonomousLogs || []);
      setError(null);

      if (items.length > 0) {
        const activeProd = items.find(p => Number(p.id) === Number(selectedProductId)) || items[0];
        const defaultCompPrice = activeProd.competitorPrice || activeProd.currentPrice * 0.9;
        const defaultStock = activeProd.currentInventory;

        setSelectedProductId(activeProd.id);
        setSimCompetitorPrice(defaultCompPrice);
        setStockOverride(defaultStock);
        setSimulationResult({
          baseOurPrice: activeProd.currentPrice
        });
        runSimulation(activeProd.id, defaultCompPrice, 1.0, defaultStock);
      }

      if (isModalOpen) {
        try {
          const res = await axios.get(`${API_URL}/database-inspect`, { headers: getSessionHeaders() });
          setDbData(res.data.tables);
        } catch (e) {
          console.error("Failed to refresh database inspector after reset:", e);
        }
      }
    } catch (err) {
      console.error('Failed to reset sandbox session:', err);
    } finally {
      setResetting(false);
    }
  }, [selectedProductId, runSimulation, isModalOpen]);

  const fetchDatabaseInspect = async () => {
    setIsModalOpen(true);
    try {
      setInspectLoading(true);
      const res = await axios.get(`${API_URL}/database-inspect`, { headers: getSessionHeaders() });
      setDbData(res.data.tables);
    } catch (err) {
      console.error("Failed to fetch database inspection feed:", err);
    } finally {
      setInspectLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initData() {
      try {
        const [intelRes, insightsRes] = await Promise.all([
          axios.get(`${API_URL}/intelligence`, { headers: getSessionHeaders() }),
          axios.get(`${API_URL}/insights`, { headers: getSessionHeaders() })
        ]);

        if (ignore) return;

        const items = intelRes.data.data || [];
        setIntelligence(items);
        setInsights(insightsRes.data.insights || []);
        setAutonomousLogs(insightsRes.data.autonomousLogs || []);
        setError(null);

        if (items.length > 0) {
          const firstProd = items[0];
          const defaultCompPrice = firstProd.competitorPrice || firstProd.currentPrice * 0.9;
          const defaultStock = firstProd.currentInventory;

          setSelectedProductId(firstProd.id);
          setSimCompetitorPrice(defaultCompPrice);
          setStockOverride(defaultStock);
          setSimulationResult({
            baseOurPrice: firstProd.currentPrice
          });
          runSimulation(firstProd.id, defaultCompPrice, 1.0, defaultStock);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch Mercury data:", err);
          setError('errors.backendUnavailable');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initData();

    return () => {
      ignore = true;
    };
  }, [runSimulation]);

  const isDark = theme === 'dark';

  return (
    <main className={`min-h-screen font-sans relative transition-colors duration-300 p-4 sm:p-6 lg:p-10 scrollbar-thin ${
      isDark 
        ? 'bg-[#18110e] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
        : 'bg-[#fdfbf7] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
    }`}>
      <div className="animate-page-entrance">
        <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        fetchDatabaseInspect={fetchDatabaseInspect}
        inspectLoading={inspectLoading}
        fetchData={fetchData}
        loading={loading}
        theme={theme}
        toggleTheme={toggleTheme}
        setShowWelcome={setShowWelcome}
        handleResetSandbox={handleResetSandbox}
        resetting={resetting}
      />

      {error && (
        <div className={`border p-4 rounded-xl mb-6 sm:mb-8 flex items-center gap-3 ${
          isDark ? 'bg-red-950/40 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-base sm:text-lg font-medium">{t(error)}</p>
        </div>
      )}

      <div key={currentView} className="animate-view-transition">
        {currentView === 'dashboard' ? (
          <DashboardView
            intelligence={intelligence}
            insights={insights}
            autonomousLogs={autonomousLogs}
            loading={loading}
            error={error}
            theme={theme}
            fetchData={fetchData}
            API_URL={API_URL}
          />
        ) : (
          <SandboxView
            intelligence={intelligence}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            simCompetitorPrice={simCompetitorPrice}
            setSimCompetitorPrice={setSimCompetitorPrice}
            demandMultiplier={demandMultiplier}
            setDemandMultiplier={setDemandMultiplier}
            stockOverride={stockOverride}
            setStockOverride={setStockOverride}
            simulationResult={simulationResult}
            simLoading={simLoading}
            runSimulation={runSimulation}
            theme={theme}
          />
        )}
      </div>
      </div>

      <WelcomeModal
        showWelcome={showWelcome}
        isFirstVisit={isFirstVisit}
        handleCloseWelcome={handleCloseWelcome}
        setShowWelcome={setShowWelcome}
        theme={theme}
      />

      <DatabaseInspectorModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        dbData={dbData}
        inspectLoading={inspectLoading}
        fetchDatabaseInspect={fetchDatabaseInspect}
        theme={theme}
        handleResetSandbox={handleResetSandbox}
        resetting={resetting}
      />
    </main>
  );
}