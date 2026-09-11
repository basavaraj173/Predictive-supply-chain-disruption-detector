export interface MockMarketSummary {
  timestamp: string;
  summary: Record<string, { price: number; change_pct: number; timestamp: string }>;
  status: "bullish" | "bearish";
}

export const MOCK_EVENTS = [
  { event: "Port update", details: "Singapore Port congestion increased by 2%", impact: "Low" },
  { event: "Market Alert", details: "Brent Crude Oil surged 1.5% in last hour", impact: "Medium" },
  { event: "Weather Warning", details: "Tropical storm heading towards Taiwan tech hubs", impact: "High" },
  { event: "Logistics Update", details: "Suez Canal transit times normalized", impact: "Positive" },
  { event: "Supply Chain Signal", details: "Semiconductor lead times decreasing in South Korea", impact: "Positive" },
  { event: "Canal Watch", details: "Panama Canal draft restrictions easing after rainfall", impact: "Positive" },
  { event: "Freight Index", details: "Shanghai Containerized Freight Index up 3.4%", impact: "Medium" },
  { event: "Critical Minerals", details: "Lithium carbonate inventories stabilized in East Asia", impact: "Low" },
  { event: "Air Freight Alert", details: "European cargo flight rerouted around severe turbulence", impact: "Medium" }
];

export function getMockMarketSummary(): MockMarketSummary {
  return {
    timestamp: new Date().toISOString(),
    status: "bullish",
    summary: {
      "^GSPC": { price: 5892.4, change_pct: 0.65, timestamp: new Date().toISOString() },
      "^IXIC": { price: 18450.2, change_pct: 1.12, timestamp: new Date().toISOString() },
      "^FTSE": { price: 8240.1, change_pct: -0.18, timestamp: new Date().toISOString() },
      "^N225": { price: 39180.5, change_pct: 0.42, timestamp: new Date().toISOString() },
      "CL=F": { price: 74.85, change_pct: 1.34, timestamp: new Date().toISOString() },
      "GC=F": { price: 2685.2, change_pct: 0.45, timestamp: new Date().toISOString() },
      "SI=F": { price: 31.95, change_pct: -0.82, timestamp: new Date().toISOString() },
      "ZC=F": { price: 425.5, change_pct: 0.25, timestamp: new Date().toISOString() }
    }
  };
}

export function getMockIndustryDetails(industry: string) {
  const industryTickers: Record<string, string[]> = {
    Electronics: ["AAPL", "NVDA", "TSM", "INTC", "AMD"],
    Automobile: ["TSLA", "TM", "F", "GM", "RIVN"],
    Pharma: ["PFE", "JNJ", "MRNA", "AZN", "BMY"],
    Energy: ["XOM", "CVX", "SHEL", "BP", "TTE"],
    Semiconductor: ["ASML", "LRCX", "AMAT", "MU", "TXN"],
    Logistics: ["UPS", "FDX", "DHLGY", "ZIM", "MAERSK"],
    Retail: ["WMT", "AMZN", "COST", "TGT", "HD"],
    Textile: ["NKE", "ADS", "LULU", "RL", "PVH"]
  };

  const tickers = industryTickers[industry] || ["SPY", "QQQ", "DIA"];
  const stocks = tickers.map((sym, idx) => {
    const basePrice = 100 + idx * 45;
    const history = Array.from({ length: 20 }, (_, i) => ({
      date: `03-${String(i + 1).padStart(2, "0")}`,
      price: Math.round((basePrice + (Math.sin(i) * 12)) * 100) / 100
    }));

    return {
      symbol: sym,
      name: sym,
      price: basePrice + 4.2,
      change_pct: idx % 2 === 0 ? 1.8 : -0.9,
      market_cap: `$${(idx + 1) * 180}B`,
      volume: `${(idx + 1) * 12}M`,
      history
    };
  });

  return {
    stocks,
    impact_data: {
      risk_pct: 58,
      delay_probability: 44,
      supply_shortage_chance: 38,
      trend: "stable",
      forecast: "Moderate freight stabilization observed across primary transit corridors."
    },
    ai_forecast: `The ${industry} sector exhibits stable inventory buffers with localized port turnaround delays. Real-time predictive metrics suggest minimal disruption over the next 14 days.`
  };
}

export function getMockIntelligence(country: string) {
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
  const industries = [
    "Electronics", "Automobile", "Agriculture", "Pharma", 
    "Textile", "Retail", "Oil & Gas", "Food Supply", 
    "Semiconductor", "Energy", "Logistics"
  ];

  const industryImpact: Record<string, any> = {};
  industries.forEach((ind, i) => {
    const risk = 35 + ((i * 7) % 45);
    industryImpact[ind] = {
      risk_pct: risk,
      delay_probability: 25 + ((i * 9) % 50),
      supply_shortage_chance: 20 + ((i * 6) % 45),
      trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "down" : "stable",
      forecast: risk > 60 ? "Elevated transit delays predicted across maritime routes" : "Normal corridor throughput maintained"
    };
  });

  return {
    country: formattedCountry,
    timestamp: new Date().toISOString(),
    news: [
      {
        title: `${formattedCountry} Logistics Corridor Updates Infrastructure to Mitigate Congestion`,
        link: "https://news.google.com",
        published: "Just now",
        summary: "Regional transport authorities announce priority lanes and digitized customs clearance to accelerate supply flow.",
        sentiment: "Positive",
        risk_score: 28
      },
      {
        title: `Global Maritime Route Assessment: Impact on ${formattedCountry} Commercial Ports`,
        link: "https://news.google.com",
        published: "2 hours ago",
        summary: "Container vessel dwell times hold steady as automated freight dispatch optimizes berthing schedules.",
        sentiment: "Neutral",
        risk_score: 42
      },
      {
        title: `Supply Chain Resilience Report: Key Industrial Nodes in ${formattedCountry}`,
        link: "https://news.google.com",
        published: "5 hours ago",
        summary: "Manufacturing hubs report sufficient inventory buffers despite broader international raw material price shifts.",
        sentiment: "Positive",
        risk_score: 35
      }
    ],
    markets: getMockMarketSummary().summary,
    industry_impact: industryImpact,
    economic_signals: {
      pmi: 52.4,
      currency_value: "1.08 USD",
      inflation_rate: "2.6%",
      trade_balance: "+$14.2B",
      freight_volume: "3.8M TEU"
    },
    ai_analysis: `Live node monitoring indicates stable maritime and airborne throughput for ${formattedCountry}. Predictive disruption algorithms indicate low-to-moderate variance across primary trade links, with high network visibility across customs terminals.`,
    risk_index: 48
  };
}
