"use client";

import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  color?: "cyan" | "purple" | "green" | "red" | "orange";
}

export default function MetricsCard({
  label,
  value,
  subValue,
  trend,
  color = "cyan"
}: MetricsCardProps) {
  const colors = {
    cyan: "from-cyan-500/20 to-transparent text-cyan-400 border-cyan-500/30",
    purple: "from-purple-500/20 to-transparent text-purple-400 border-purple-500/30",
    green: "from-green-500/20 to-transparent text-green-400 border-green-500/30",
    red: "from-red-500/20 to-transparent text-red-400 border-red-500/30",
    orange: "from-orange-500/20 to-transparent text-orange-400 border-orange-500/30",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "glass-card p-4 rounded-xl border bg-gradient-to-br transition-all",
        colors[color]
      )}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-tighter mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-bold data-font glow-text">
          {value}
        </h4>
        {trend && (
          <span className={cn(
            "text-xs font-bold",
            trend.startsWith("+") ? "text-green-400" : "text-red-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1 font-medium">
          {subValue}
        </p>
      )}
    </motion.div>
  );
}
