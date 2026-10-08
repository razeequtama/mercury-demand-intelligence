'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import DatabaseInspectorModal from './components/DatabaseInspectorModal';
import DashboardView from './components/DashboardView';
import SandboxView from './components/SandboxView';
import { useLanguage } from '../i18n/LanguageProvider';

export default function Dashboard() {
  const { t } = useLanguage();
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
      setError('errors.backendUnavailable');
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

  const isDark = theme === 'dark';

  return (
    <main className={`min-h-screen font-sans relative transition-colors duration-300 p-4 sm:p-6 lg:p-10 scrollbar-thin ${
      isDark 
        ? 'bg-[#18110e] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
        : 'bg-[#fdfbf7] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
    }`}>
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
      />

      <WelcomeModal
        showWelcome={showWelcome}
        isFirstVisit={isFirstVisit}
        handleCloseWelcome={handleCloseWelcome}
        setShowWelcome={setShowWelcome}
        theme={theme}
      />

      {error && (
        <div className={`border p-4 rounded-xl mb-6 sm:mb-8 flex items-center gap-3 ${
          isDark ? 'bg-red-950/40 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-sm sm:text-base">{t(error)}</p>
        </div>
      )}

      {currentView === 'dashboard' ? (
        <DashboardView
          intelligence={intelligence}
          insights={insights}
          autonomousLogs={autonomousLogs}
          loading={loading}
          error={error}
          theme={theme}
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

      <DatabaseInspectorModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        dbData={dbData}
        theme={theme}
      />
    </main>
  );
}