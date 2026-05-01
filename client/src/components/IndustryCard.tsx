"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface IndustryCardProps {
  name: string;
  riskPct: number;
  delayProb: number;
  shortageChance: number;
  trend: "up" | "down" | "stable";
  forecast: string;
  onClick?: () => void;
}

export default function IndustryCard({
  name,
  riskPct,
  delayProb,
  shortageChance,
  trend,
  forecast,
  onClick
}: IndustryCardProps) {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return "text-red-500";
    if (risk > 40) return "text-yellow-500";
    return "text-cyan-400";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="glass-card p-5 rounded-xl neon-border overflow-hidden group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
          {name}
        </h3>
        <div className={cn("p-2 rounded-lg bg-black/40", getRiskColor(riskPct))}>
          <Activity size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Risk Index</p>
          <p className={cn("text-2xl font-bold data-font", getRiskColor(riskPct))}>
            {riskPct}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Trend</p>
          <div className="flex items-center gap-1">
            {trend === "up" ? (
              <TrendingUp size={20} className="text-red-500" />
            ) : (
              <TrendingDown size={20} className="text-green-500" />
            )}
            <span className="text-sm font-medium capitalize">{trend}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${delayProb}%` }}
            className="h-full bg-cyan-500"
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Delay Prob.</span>
          <span className="text-cyan-400 font-bold">{delayProb}%</span>
        </div>

        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${shortageChance}%` }}
            className="h-full bg-purple-500"
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Shortage Chance</span>
          <span className="text-purple-400 font-bold">{shortageChance}%</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-500 mt-1 flex-shrink-0" />
        <p className="text-xs text-gray-300 italic">
          AI Forecast: {forecast}
        </p>
      </div>
    </motion.div>
  );
}
