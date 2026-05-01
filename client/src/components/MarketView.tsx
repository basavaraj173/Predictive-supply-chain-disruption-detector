"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Globe, DollarSign, Activity } from "lucide-react";
import MetricsCard from "./MetricsCard";

interface MarketViewProps {
  summary: any;
}

export default function MarketView({ summary }: MarketViewProps) {
  const [heatmapData, setHeatmapData] = useState<{sector: string, vol: number, isPositive: boolean}[]>([]);

  useEffect(() => {
    // Generate stable random data for the heatmap on mount to avoid hydration errors
    const sectors = ['Tech', 'Energy', 'Finance', 'Health', 'Retail', 'Auto'];
    const data = sectors.map(sector => ({
      sector,
      vol: parseFloat((Math.random() * 8 + 1).toFixed(2)),
      isPositive: Math.random() > 0.5
    }));
    setHeatmapData(data);
  }, []);
  if (!summary) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Activity size={48} className="text-purple-500 animate-spin mb-4" />
      <p className="text-purple-400 font-bold">SYNCHRONIZING GLOBAL EXCHANGES...</p>
    </div>
  );

  const commodities = Object.entries(summary.summary).filter(([k]) => k.includes("=F"));
  const indices = Object.entries(summary.summary).filter(([k]) => k.includes("^"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard 
          label="Market Sentiment" 
          value={summary.status.toUpperCase()} 
          color={summary.status === 'bullish' ? 'green' : 'red'}
          subValue="Aggregate global signal"
        />
        <MetricsCard 
          label="S&P 500" 
          value={summary.summary["^GSPC"]?.price || "..."} 
          trend={summary.summary["^GSPC"]?.change_pct > 0 ? `+${summary.summary["^GSPC"]?.change_pct}%` : `${summary.summary["^GSPC"]?.change_pct}%`}
          color={summary.summary["^GSPC"]?.change_pct > 0 ? "green" : "red"}
          subValue="Standard & Poor's Index"
        />
        <MetricsCard 
          label="Brent Crude" 
          value={`$${summary.summary["CL=F"]?.price || "..."}`} 
          trend={summary.summary["CL=F"]?.change_pct > 0 ? `+${summary.summary["CL=F"]?.change_pct}%` : `${summary.summary["CL=F"]?.change_pct}%`}
          color={summary.summary["CL=F"]?.change_pct > 0 ? "green" : "red"}
          subValue="Energy Benchmark"
        />
        <MetricsCard 
          label="Global Volatility (VIX)" 
          value="18.42" 
          trend="+2.1%"
          color="orange"
          subValue="Fear Index Tracking"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="glass-card p-8 rounded-3xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 relative overflow-hidden group">
            <div className="absolute -bottom-12 -right-12 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <BarChart3 size={240} className="text-purple-400" />
            </div>
            <div className="relative z-10">
              <h3 className="flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-xs mb-6 text-purple-400">
                <Globe size={18} />
                Global Index Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indices.map(([symbol, data]: [string, any]) => (
                  <div key={symbol} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">{symbol.replace('^', '')}</p>
                      <p className="text-xl font-bold data-font">${data.price}</p>
                    </div>
                    <div className={`text-right ${data.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <p className="font-bold">{data.change_pct >= 0 ? '+' : ''}{data.change_pct}%</p>
                      <p className="text-[10px] uppercase font-medium">Live Feed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border-white/5">
             <h3 className="flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-xs mb-8">
               <DollarSign size={18} className="text-green-400" />
               Commodity Supercycle Tracking
             </h3>
             <div className="space-y-4">
               {commodities.map(([symbol, data]: [string, any]) => (
                 <div key={symbol} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 transition-colors group">
                   <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.change_pct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                       {data.change_pct >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                     </div>
                     <div>
                       <p className="font-bold group-hover:text-cyan-400 transition-colors">{symbol.replace('=F', '')}</p>
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Future Contract</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-bold data-font">${data.price}</p>
                     <p className={`text-xs font-bold ${data.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {data.change_pct >= 0 ? '+' : ''}{data.change_pct}%
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="glass-card p-8 rounded-3xl border-white/5 h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
              <Activity size={16} className="text-red-400" />
              Sector Volatility Heatmap
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {heatmapData.map(({ sector, vol, isPositive }) => {
                // Dynamic heatmap color intensity based on volatility
                const intensity = Math.min(vol / 10, 1);
                const bgStyle = isPositive 
                  ? `rgba(34, 197, 94, ${intensity * 0.3})` 
                  : `rgba(239, 68, 68, ${intensity * 0.3})`;
                const borderStyle = isPositive
                  ? `rgba(34, 197, 94, ${intensity * 0.8})`
                  : `rgba(239, 68, 68, ${intensity * 0.8})`;

                return (
                  <motion.div 
                    key={sector} 
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden group"
                    style={{ backgroundColor: bgStyle, borderColor: borderStyle, borderWidth: '1px' }}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-t ${isPositive ? 'from-green-400' : 'from-red-400'} to-transparent`} />
                    <p className="text-xs font-bold text-gray-300 uppercase mb-2 z-10">{sector}</p>
                    <p className={`text-2xl font-black data-font z-10 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : '-'}{vol}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Market Insight</p>
              <p className="text-sm text-gray-300 italic">"Global equities showing divergence as manufacturing PMI shifts. Increased sensitivity to regional port labor negotiations."</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
