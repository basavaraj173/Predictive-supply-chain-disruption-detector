"use client";

import { motion } from "framer-motion";
import { ExternalLink, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsItem {
  title: string;
  link: string;
  published: string;
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  risk_score: number;
}

interface NewsFeedProps {
  news: NewsItem[];
}

export default function NewsFeed({ news }: NewsFeedProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Negative": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {news.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-4 rounded-xl border-white/5 hover:border-cyan-500/30 transition-all"
        >
          <div className="flex justify-between items-start gap-4 mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              getSentimentColor(item.sentiment)
            )}>
              {item.sentiment}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              {item.published}
            </span>
          </div>

          <h5 className="text-sm font-bold text-gray-100 leading-tight mb-2 hover:text-cyan-400 cursor-pointer">
            {item.title}
          </h5>

          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {item.summary}
          </p>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <AlertCircle size={12} className="text-orange-400" />
                <span className="text-[10px] font-bold text-gray-400">Risk: {item.risk_score}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-cyan-400" />
                <span className="text-[10px] font-bold text-gray-400">Viral</span>
              </div>
            </div>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
