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
  ArrowDownRight
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
  const [intelligence, setIntelligence] = useState([]);
  const [insights, setInsights] = useState([]);
  const [autonomousLogs, setAutonomousLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch intelligence feed and insights in parallel, using the configured API_URL consistently
      const [intelRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/intelligence`),
        axios.get(`${API_URL}/insights`)
      ]);

      setIntelligence(intelRes.data.data || []);
      setInsights(insightsRes.data.insights || []);
      setAutonomousLogs(insightsRes.data.autonomousLogs || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch Mercury data:", err);
      setError("Could not connect to Mercury Backend Engine. Ensure your Node.js server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate high-risk items count
  const highRiskCount = intelligence.filter(item => item.statusAlert === 'High Stockout Risk').length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Mercury Demand Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Commerce Command Center</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time demand forecasting, stockout risk scoring, and automated decision automation.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Streams
        </button>
      </header>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

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
        {/* Inventory Table (2 cols) */}
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

        {/* Demand Visualization Chart (1 col) */}
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
    </main>
  );
}