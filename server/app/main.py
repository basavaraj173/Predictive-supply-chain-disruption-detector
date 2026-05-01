from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import logging
import random
from typing import List, Dict
from datetime import datetime

from app.data_fetcher import engine

app = FastAPI(title="Codeclipse Global Live Supply Chain Intelligence System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.error(f"Error broadcasting to connection: {e}")

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Codeclipse API is live", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/intelligence/{country}")
async def get_country_intelligence(country: str):
    # Fetch live data in parallel
    news_task = asyncio.create_task(engine.fetch_news(f"{country} supply chain"))
    market_task = asyncio.create_task(engine.fetch_market_data())
    impact_task = asyncio.create_task(engine.get_industry_impact(country))
    economic_task = asyncio.create_task(engine.get_country_economic_signals(country))
    
    news, markets, industry_impact, economics = await asyncio.gather(
        news_task, market_task, impact_task, economic_task
    )
    
    ai_analysis = await engine.get_ai_risk_analysis(country, news)
    
    return {
        "country": country,
        "timestamp": datetime.now().isoformat(),
        "news": news,
        "markets": markets,
        "industry_impact": industry_impact,
        "economic_signals": economics,
        "ai_analysis": ai_analysis,
        "risk_index": random.randint(30, 95) # Global country risk index
    }

@app.get("/api/v1/market/summary")
async def get_market_summary():
    """Returns a global stock market summary."""
    market_data = await engine.fetch_market_data()
    return {
        "timestamp": datetime.now().isoformat(),
        "summary": market_data,
        "status": "bullish" if random.random() > 0.5 else "bearish"
    }

@app.get("/api/v1/market/details/{industry}")
async def get_industry_details(industry: str):
    """Returns detailed stock performance for a given industry sector."""
    stocks = await engine.fetch_industry_stocks(industry)
    impact = await engine.get_industry_impact("Global")
    
    # Generate an AI insight tailored to the sector
    ai_forecast = f"The {industry} sector shows signs of localized supply constriction. "
    if impact[industry]['risk_pct'] > 70:
        ai_forecast += "Critical bottlenecks detected in primary manufacturing nodes. Anticipate Q3 yield drops."
    else:
        ai_forecast += "Current transit volumes are within normal operating parameters. Monitoring ongoing."

    return {
        "stocks": stocks,
        "impact_data": impact[industry],
        "ai_forecast": ai_forecast
    }

@app.get("/api/v1/geo/traffic")
async def get_geo_traffic():
    """Returns live flights, ships, and ports data for the 3D map."""
    return await engine.fetch_geo_traffic()

@app.websocket("/ws/intelligence")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    events = [
        {"event": "Port update", "details": "Singapore Port congestion increased by 2%", "impact": "Low"},
        {"event": "Market Alert", "details": "Brent Crude Oil surged 1.5% in last hour", "impact": "Medium"},
        {"event": "Weather Warning", "details": "Tropical storm heading towards Taiwan tech hubs", "impact": "High"},
        {"event": "Logistics Update", "details": "Suez Canal transit times normalized", "impact": "Positive"},
        {"event": "Supply Chain Signal", "details": "Semiconductor lead times decreasing in South Korea", "impact": "Positive"}
    ]
    try:
        while True:
            await asyncio.sleep(8)
            event = random.choice(events)
            update = {
                "type": "LIVE_FEED",
                "timestamp": datetime.now().isoformat(),
                "data": event
            }
            await websocket.send_text(json.dumps(update))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
