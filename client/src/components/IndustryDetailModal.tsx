"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  market_cap: string;
  volume: string;
  history: any[];
}

interface IndustryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  industry: string;
  data: {
    stocks: Stock[];
    impact_data: any;
    ai_forecast: string;
  } | null;
}

export default function IndustryDetailModal({ isOpen, onClose, industry, data }: IndustryDetailModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#05070a]/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] glass-card rounded-3xl border-white/10 overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black italic tracking-tight uppercase">{industry}</h2>
                <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Sector Analysis
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">Real-time market equity & volatility metrics</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {!data ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Activity className="text-cyan-500 animate-spin mb-4" size={48} />
                <p className="text-cyan-400 font-bold">DECRYPTING SECTOR DATA...</p>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-8">
                {/* Stock List */}
                <div className="col-span-12 lg:col-span-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                    <DollarSign size={16} className="text-cyan-400" />
                    Major Equity Nodes
                  </h3>
                  {data.stocks.map((stock) => (
                    <motion.div 
                      key={stock.symbol}
                      whileHover={{ x: 4 }}
                      className="glass-card p-4 rounded-2xl border-white/5 bg-white/2 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-lg font-bold data-font group-hover:text-cyan-400 transition-colors">{stock.symbol}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{stock.volume} Volume</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold data-font">${stock.price}</p>
                        <p className={`text-xs font-bold ${stock.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts & Forecast */}
                <div className="col-span-12 lg:col-span-7 space-y-8">
                  <div className="glass-card p-6 rounded-3xl border-white/5 bg-black/20 h-[350px]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <BarChart3 size={16} className="text-purple-400" />
                        Sector Performance Index
                      </h3>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Last 20 Days</span>
                    </div>
                    <div className="h-full w-full pb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.stocks[0]?.history || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#666" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f141c', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#00f2ff' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#00f2ff" 
                            strokeWidth={3} 
                            dot={false}
                            animationDuration={2000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-4">
                      <Info size={18} />
                      AI Market Intelligence
                    </h3>
                    <p className="text-lg font-medium text-gray-200 italic leading-relaxed">
                      "{data.ai_forecast}"
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/5 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Sector Risk</p>
                        <p className="text-xl font-bold data-font text-red-400">{data.impact_data.risk_pct}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Shortage Prob.</p>
                        <p className="text-xl font-bold data-font text-purple-400">{data.impact_data.supply_shortage_chance}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
