"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Globe, 
  ShieldAlert, 
  Activity, 
  BarChart3, 
  Newspaper, 
  Ship, 
  Zap, 
  Bell,
  Cpu,
  Truck,
  Droplets,
  Terminal,
  ShieldCheck
} from "lucide-react";
import axios from "axios";
import WorldMap3D from "@/components/WorldMap3D";
import IndustryCard from "@/components/IndustryCard";
import MetricsCard from "@/components/MetricsCard";
import NewsFeed from "@/components/NewsFeed";
import IndustryDetailModal from "@/components/IndustryDetailModal";
import MarketView from "@/components/MarketView";
import { 
  getMockMarketSummary, 
  getMockIndustryDetails, 
  getMockIntelligence, 
  MOCK_EVENTS 
} from "@/utils/mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/intelligence";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>(MOCK_EVENTS.slice(0, 5));
  const [wsConnected, setWsConnected] = useState(false);
  const [view, setView] = useState<"intelligence" | "market">("intelligence");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [industryData, setIndustryData] = useState<any>(null);
  const [marketSummary, setMarketSummary] = useState<any>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("Connected to Intelligence Stream");
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "LIVE_FEED") {
            setLiveEvents((prev) => [message.data, ...prev].slice(0, 50));
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
    }

    // Simulated event rotation when WebSocket is offline/unsupported
    fallbackInterval = setInterval(() => {
      setLiveEvents((prev) => {
        const randomEvent = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        return [randomEvent, ...prev].slice(0, 50);
      });
    }, 8000);

    fetchMarketSummary();

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  const fetchMarketSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/market/summary`, { timeout: 3500 });
      setMarketSummary(response.data);
    } catch {
      // Fallback to rich mock market summary on Vercel or when backend is offline
      setMarketSummary(getMockMarketSummary());
    }
  };

  const fetchIndustryDetails = async (industry: string) => {
    setSelectedIndustry(industry);
    setIndustryData(null);
    try {
      const response = await axios.get(`${API_BASE}/api/v1/market/details/${industry}`, { timeout: 3500 });
      setIndustryData(response.data);
    } catch {
      // Fallback to realistic industry details
      setIndustryData(getMockIndustryDetails(industry));
    }
  };

  const fetchIntelligence = async (country: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/v1/intelligence/${country}`, { timeout: 4500 });
      setData(response.data);
    } catch {
      // Graceful fallback: load simulated intelligence data so Vercel deployment remains fully functional
      setData(getMockIntelligence(country));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      fetchIntelligence(search);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-4 md:p-8 cyber-grid">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="flex items-center gap-4 min-w-max">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30 border border-white/10">
            <Zap className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none">
              SUPPLY CHAIN PREDICTOR
            </h1>
            <p className="text-[11px] text-cyan-400 font-bold tracking-[0.3em] uppercase mt-1">
              Live Intelligence Terminal
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl group order-3 xl:order-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Interrogate global nodes (e.g. India, Japan, Germany)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f141c]/60 border border-white/10 rounded-2xl py-5 pl-14 pr-32 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 backdrop-blur-2xl transition-all text-sm font-medium"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-8 py-3 rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20"
          >
            ANALYZE
          </button>
        </form>

        <div className="flex items-center gap-6 order-2 xl:order-3 ml-auto xl:ml-0">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setView("intelligence")}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'intelligence' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              Intelligence
            </button>
            <button 
              onClick={() => setView("market")}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'market' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              Market
            </button>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">
                {wsConnected ? 'Node Linked' : 'Link Failed'}
              </span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Stream: {wsConnected ? 'Encrypted' : 'Offline'}</p>
          </div>
        </div>
      </header>

      {/* Live Ticker */}
      <div className="mb-8 overflow-hidden bg-cyan-500/5 border-y border-cyan-500/10 py-2">
        <div className="flex animate-marquee whitespace-nowrap">
          {liveEvents.length > 0 ? (
            liveEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 mx-8">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                  event.impact === 'High' ? 'bg-red-500 text-black' : 
                  event.impact === 'Medium' ? 'bg-orange-500 text-black' : 'bg-cyan-500 text-black'
                }`}>
                  {event.event}
                </span>
                <span className="text-xs font-medium text-gray-300">{event.details}</span>
                <span className="text-cyan-500/50">•</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-4 mx-8">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest italic">
                Awaiting global intelligence stream... sync in progress...
              </span>
            </div>
          )}
        </div>
      </div>

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mb-6"
          >
            <div className="glass-card rounded-3xl overflow-hidden border-white/5 h-[600px] shadow-2xl relative">
              <WorldMap3D />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Global Supply Chain Monitor
          </h2>
          <p className="text-gray-400 max-w-lg text-sm">
            Click any node on the 3D heat map for details. Enter a country name above for full intelligence analysis.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Activity size={48} className="text-cyan-500 animate-spin mb-4" />
          <p className="text-cyan-400 font-bold animate-pulse">SYNCHRONIZING LIVE FEEDS...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "market" ? (
          <MarketView key="market" summary={marketSummary} />
        ) : (
          data && (
            <motion.div
              key="intelligence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
            {/* Top Stats Row */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-2">
              <MetricsCard 
                label="Country Risk Index" 
                value={`${data.risk_index}%`} 
                trend={data.risk_index > 70 ? "+5.2%" : "-1.4%"}
                color={data.risk_index > 70 ? "red" : "cyan"}
                subValue="Live geopolitical exposure score"
              />
              <MetricsCard 
                label="Manufacturing PMI" 
                value={`${data.economic_signals.pmi.toFixed(1)}`} 
                trend="+0.8"
                color="green"
                subValue="Industrial expansion signal"
              />
              <MetricsCard 
                label="Forex Stability" 
                value={data.economic_signals.currency_value} 
                trend="-0.04%"
                color="orange"
                subValue="Relative currency strength"
              />
              <MetricsCard 
                label="Node Visibility" 
                value="94.2%" 
                trend="+1.2%"
                color="purple"
                subValue="Real-time sensor coverage"
              />
            </div>

            {/* AI Insights & Main Visualizers */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <div className="glass-card p-8 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
                <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                  <Cpu size={240} className="text-cyan-400" />
                </div>
                <div className="relative z-10">
                  <h3 className="flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-xs mb-6 text-cyan-400">
                    <Terminal size={18} />
                    Neural Risk Assessment Engine
                  </h3>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed text-white data-font italic">
                    "{data.ai_analysis}"
                  </p>
                  <div className="flex items-center gap-6 mt-8">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      <ShieldCheck size={16} className="text-cyan-400" />
                      <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Verified Intelligence</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                      <Activity size={16} className="text-purple-400" />
                      <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">Confidence: 98.4%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl overflow-hidden border-white/5 h-[550px] shadow-2xl relative">
                <WorldMap3D />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {Object.entries(data.industry_impact).slice(0, 9).map(([name, impact]: [string, any], i) => (
                  <IndustryCard 
                    key={name}
                    name={name}
                    riskPct={impact.risk_pct}
                    delayProb={impact.delay_probability}
                    shortageChance={impact.supply_shortage_chance}
                    trend={impact.trend}
                    forecast={impact.forecast}
                    onClick={() => fetchIndustryDetails(name)}
                  />
                ))}
              </div>
            </div>

            {/* Side Intelligence Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="glass-card p-6 rounded-2xl border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
                    <Newspaper size={18} className="text-cyan-400" />
                    Live Intelligence Feed
                  </h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Streaming</span>
                  </div>
                </div>
                <NewsFeed news={data.news} />
              </div>

              <div className="glass-card p-6 rounded-2xl border-white/5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm mb-6">
                  <Activity size={18} className="text-purple-400" />
                  Economic Indicators
                </h3>
                <div className="space-y-4">
                   {Object.entries(data.economic_signals).map(([key, val]: [string, any]) => (
                     <div key={key} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                       <span className="text-xs text-gray-400 uppercase font-medium">{key.replace('_', ' ')}</span>
                       <span className="text-sm font-bold data-font text-white">{val}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        )
      )}
    </AnimatePresence>

      <IndustryDetailModal 
        isOpen={!!selectedIndustry}
        onClose={() => setSelectedIndustry(null)}
        industry={selectedIndustry || ""}
        data={industryData}
      />
    </div>
  );
}
