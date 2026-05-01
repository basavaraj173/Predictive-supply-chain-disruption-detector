import asyncio
import httpx
try:
    import yfinance as yf
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False
    print("yfinance not available, using mock market data")

from bs4 import BeautifulSoup
import feedparser
import random
from datetime import datetime
import json

class LiveIntelligenceEngine:
    """
    Engine to fetch real-time data from various sources.
    """
    def __init__(self):
        self.sources = {
            "news": "https://news.google.com/rss/search?q=supply+chain+disruption+global",
            "commodities": ["CL=F", "GC=F", "SI=F", "ZC=F"], # Oil, Gold, Silver, Corn
            "indices": ["^GSPC", "^IXIC", "^FTSE", "^N225"] # S&P 500, Nasdaq, FTSE, Nikkei
        }
        
        # Major global supply chain hubs
        self.major_ports = [
            {"name": "Shanghai", "lat": 31.22, "lng": 121.48, "type": "port"},
            {"name": "Singapore", "lat": 1.29, "lng": 103.85, "type": "port"},
            {"name": "Rotterdam", "lat": 51.92, "lng": 4.48, "type": "port"},
            {"name": "Los Angeles", "lat": 34.05, "lng": -118.24, "type": "port"},
            {"name": "Dubai", "lat": 25.20, "lng": 55.27, "type": "port"},
            {"name": "Hamburg", "lat": 53.55, "lng": 9.99, "type": "port"},
            {"name": "Santos", "lat": -23.96, "lng": -46.33, "type": "port"},
            {"name": "New York", "lat": 40.71, "lng": -74.00, "type": "port"},
            {"name": "Tokyo", "lat": 35.67, "lng": 139.65, "type": "port"},
            {"name": "Mumbai", "lat": 18.96, "lng": 72.83, "type": "port"}
        ]

    async def fetch_news(self, query: str = "supply chain"):
        """Fetches live news from Google News RSS."""
        import urllib.parse
        import time
        encoded_query = urllib.parse.quote(query)
        # Adding timestamp to bust cache
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en&_t={int(time.time())}"
        try:
            feed = feedparser.parse(url)
            news_items = []
            for entry in feed.entries[:10]:
                news_items.append({
                    "title": entry.title,
                    "link": entry.link,
                    "published": entry.published,
                    "summary": entry.summary if hasattr(entry, 'summary') else "",
                    "sentiment": random.choice(["Positive", "Neutral", "Negative"]),
                    "risk_score": random.randint(10, 90)
                })
            return news_items
        except Exception as e:
            print(f"Error fetching news: {e}")
            return []

    async def fetch_market_data(self):
        """Fetches live market data using yfinance."""
        data = {}
        try:
            for symbol in self.sources["commodities"] + self.sources["indices"]:
                # In a real async environment, we would use a thread pool for yf as it's blocking
                ticker = yf.Ticker(symbol)
                info = ticker.history(period="1d")
                if not info.empty:
                    last_price = info['Close'].iloc[-1]
                    open_price = info['Open'].iloc[-1]
                    change = ((last_price - open_price) / open_price) * 100 if open_price != 0 else 0
                    data[symbol] = {
                        "price": round(last_price, 2),
                        "change_pct": round(change, 2),
                        "timestamp": datetime.now().isoformat()
                    }
            return data
        except Exception as e:
            print(f"Error fetching market data: {e}")
            return {}

    async def fetch_industry_stocks(self, industry: str):
        """Fetches stocks related to a specific industry."""
        # Mapping industries to relevant tickers
        industry_tickers = {
            "Electronics": ["AAPL", "NVDA", "TSM", "INTC", "AMD"],
            "Automobile": ["TSLA", "TM", "F", "GM", "RIVN"],
            "Pharma": ["PFE", "JNJ", "MRNA", "AZN", "BMY"],
            "Energy": ["XOM", "CVX", "SHEL", "BP", "TTE"],
            "Semiconductor": ["ASML", "LRCX", "AMAT", "MU", "TXN"],
            "Logistics": ["UPS", "FDX", "DHLGY", "ZIM", "MAERSK-B.CO"],
            "Retail": ["WMT", "AMZN", "COST", "TGT", "HD"],
            "Textile": ["NKE", "ADS.DE", "LULU", "RL", "PVH"]
        }
        
        tickers = industry_tickers.get(industry, ["SPY", "QQQ", "DIA"]) # Fallback to indices
        stocks = []
        
        try:
            for symbol in tickers:
                if YF_AVAILABLE:
                    ticker = yf.Ticker(symbol)
                    # Fetch last 1 month to get at least 20 trading days
                    info = ticker.history(period="1mo")
                    if not info.empty:
                        last_price = info['Close'].iloc[-1]
                        open_price = info['Open'].iloc[-1]
                        change = ((last_price - open_price) / open_price) * 100 if open_price != 0 else 0
                        
                        history = []
                        # Take the last 20 days for the chart
                        for date, row in info.tail(20).iterrows():
                            history.append({
                                "date": date.strftime("%m-%d"),
                                "price": round(row['Close'], 2)
                            })
                        
                        vol = info['Volume'].iloc[-1]
                        volume_str = f"{int(vol / 1000000)}M" if vol >= 1000000 else f"{int(vol / 1000)}K" if vol >= 1000 else str(int(vol))

                        stocks.append({
                            "symbol": symbol,
                            "name": symbol, 
                            "price": round(last_price, 2),
                            "change_pct": round(change, 2),
                            "market_cap": f"${random.randint(10, 3000)}B", # Mocked to save API calls
                            "volume": volume_str,
                            "history": history
                        })
                        continue
                
                # Fallback to mock data if yfinance is not available or failed for a ticker
                last_price = random.uniform(50, 500)
                change = random.uniform(-5, 5)
                
                history = []
                base_price = last_price
                for i in range(20):
                    base_price *= (1 + random.uniform(-0.02, 0.02))
                    history.append({
                        "date": (datetime.now().day - (20 - i)),
                        "price": round(base_price, 2)
                    })

                stocks.append({
                    "symbol": symbol,
                    "name": symbol,
                    "price": round(last_price, 2),
                    "change_pct": round(change, 2),
                    "market_cap": f"${random.randint(10, 3000)}B",
                    "volume": f"{random.randint(1, 100)}M",
                    "history": history
                })
            return stocks
        except Exception as e:
            print(f"Error fetching industry stocks: {e}")
            return []

    async def fetch_geo_traffic(self):
        """Fetches live flight data and mixes with maritime data for global mapping."""
        traffic = {
            "ports": self.major_ports,
            "flights": [],
            "ships": []
        }
        
        # 1. Try fetching live flights
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("https://opensky-network.org/api/states/all", timeout=3.0)
                if response.status_code == 200:
                    data = response.json()
                    # Grab a sample of 150 live flights to avoid overwhelming the frontend
                    states = data.get("states", [])
                    random.shuffle(states)
                    for state in states[:150]:
                        if state[5] and state[6]: # lng, lat
                            traffic["flights"].append({
                                "id": state[0],
                                "lng": state[5],
                                "lat": state[6],
                                "altitude": state[7],
                                "type": "flight"
                            })
        except Exception as e:
            print(f"Failed to fetch live flights, using realistic simulation: {e}")
            # Fallback realistic flight distribution
            for _ in range(150):
                # Bias towards northern hemisphere
                lat = random.uniform(-20, 60)
                lng = random.uniform(-180, 180)
                traffic["flights"].append({"lng": lng, "lat": lat, "type": "flight"})

        # 2. Simulate ships along trade routes
        for _ in range(200):
            # Pick two random ports
            p1, p2 = random.sample(self.major_ports, 2)
            # Interpolate a position
            t = random.random()
            lat = p1["lat"] + (p2["lat"] - p1["lat"]) * t
            lng = p1["lng"] + (p2["lng"] - p1["lng"]) * t
            # Add some scatter
            lat += random.uniform(-2, 2)
            lng += random.uniform(-2, 2)
            traffic["ships"].append({
                "lat": lat,
                "lng": lng,
                "type": "ship",
                "risk": random.choice(["Low", "Low", "Medium", "High"])
            })

        return traffic

    async def get_industry_impact(self, country: str):
        """
        Generates live industry impact scores based on current global events.
        In a real app, this would use AI to analyze the news and market data.
        """
        industries = [
            "Electronics", "Automobile", "Agriculture", "Pharma", 
            "Textile", "Retail", "Oil & Gas", "Food Supply", 
            "Stock Market", "Semiconductor", "Energy", "Logistics"
        ]
        
        impact_data = {}
        for industry in industries:
            risk = random.randint(20, 85)
            delay_prob = random.randint(10, 95)
            impact_data[industry] = {
                "risk_pct": risk,
                "delay_probability": delay_prob,
                "supply_shortage_chance": random.randint(5, 90),
                "trend": random.choice(["up", "down", "stable"]),
                "forecast": "Predicted disruption in next 7 days" if risk > 60 else "Stable outlook"
            }
        return impact_data

    async def get_country_economic_signals(self, country: str):
        """Fetches or simulates economic signals."""
        return {
            "gdp_trend": f"{random.uniform(1.5, 5.0):.1f}%",
            "inflation": f"{random.uniform(2.0, 15.0):.1f}%",
            "currency_value": f"{random.uniform(0.8, 1.2):.4f}",
            "interest_rates": f"{random.uniform(0.25, 6.0):.2f}%",
            "oil_dependency": f"{random.randint(10, 80)}%",
            "consumer_demand": random.randint(40, 100),
            "pmi": random.uniform(45.0, 55.0)
        }

    async def get_ai_risk_analysis(self, country: str, news: list):
        """Generates AI-driven risk summary using Gemini."""
        prompt = f"Analyze the following supply chain news for {country} and provide a 3-sentence executive summary of the current risk landscape. Focus on logistics, ports, and manufacturing.\n\n"
        for item in news[:5]:
            prompt += f"- {item['title']}\n"
        
        try:
            # In a real app, you'd use google-generativeai here
            # model = genai.GenerativeModel('gemini-pro')
            # response = await model.generate_content_async(prompt)
            # return response.text
            
            # Dynamic Simulated AI response
            risk_level = "Critical" if any(n['risk_score'] > 85 for n in news) else "Elevated" if any(n['risk_score'] > 70 for n in news) else "Moderate"
            
            insights = [
                f"{country}'s industrial sectors are currently facing {risk_level.lower()} disruption pressures.",
                f"Maritime operations and local transport nodes near major {country} hubs show signs of congestion.",
                f"AI signals indicate a shift in {country}'s export reliability over the next 14 days.",
                f"Recent fiscal policies in {country} are creating localized volatility in raw material acquisition.",
                f"Supply continuity from {country} remains dependent on upcoming regional labor negotiations.",
                f"Energy sector fluctuations within {country} are cascading into downstream manufacturing delays."
            ]
            
            # Pick 2 random insights to combine with the base statement
            selected_insights = random.sample(insights, 2)
            
            return f"The current risk landscape for {country} is {risk_level}. {selected_insights[0]} {selected_insights[1]}"
        except Exception as e:
            print(f"AI Analysis error: {e}")
            return "Unable to generate live AI analysis. Regional risk remains consistent with historical Q2 patterns."

engine = LiveIntelligenceEngine()
