# Predictive Supply Chain Disruption Detector

**Codeclipse Global Live Supply Chain Intelligence System**

A full-stack, real-time application designed to monitor, analyze, and predict global supply chain disruptions using live data feeds, AI analysis, and interactive 3D visualizations.

## Features

- **Live Intelligence Engine**: Fetches real-time news, commodity prices, and stock market indices.
- **AI Risk Analysis**: Generates AI-driven risk summaries for global regions using advanced language models.
- **Interactive 3D Globe**: Visualizes live maritime and flight traffic data using Three.js and React Three Fiber.
- **Real-Time Updates**: Utilizes WebSockets for live alerts on port congestions, weather warnings, and market fluctuations.
- **Industry Impact Scoring**: Dynamic risk probabilities across multiple sectors (e.g., Electronics, Automobile, Logistics).
- **Economic Signals**: Monitors country-specific GDP trends, inflation rates, and PMI metrics.

## Tech Stack

### Frontend (Client)
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: Tailwind CSS, Framer Motion
- **3D Visualization**: Three.js, React Three Fiber, React Three Drei
- **Charts**: Recharts
- **Data Fetching & State**: SWR, Axios, Socket.io-client

### Backend (Server)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Real-time Comms**: WebSockets
- **Data Scraping/Fetching**: `yfinance`, `beautifulsoup4`, `feedparser`, `httpx`
- **Database / Cache**: MongoDB, Redis (Configured via dependencies)
- **AI Integration**: Google Generative AI (Gemini)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Predictive-supply-chain-disruption-detector.git
   cd Predictive-supply-chain-disruption-detector
   ```

2. **Backend Setup:**
   Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   
   # Create a virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Start the FastAPI server
   python main.py
   # Alternatively: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup:**
   Open a new terminal window and navigate to the `client` directory:
   ```bash
   cd client
   
   # Install dependencies
   npm install
   
   # Start the Next.js development server
   npm run dev
   ```

4. **View the Application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the frontend. The backend API runs concurrently at [http://localhost:8000](http://localhost:8000) (Swagger UI available at [http://localhost:8000/docs](http://localhost:8000/docs)).

## Key API Endpoints

- `GET /api/v1/intelligence/{country}`: Fetches live data and AI risk analysis for a specific country.
- `GET /api/v1/market/summary`: Returns a global stock market summary.
- `GET /api/v1/market/details/{industry}`: Returns detailed stock performance for a given industry.
- `GET /api/v1/geo/traffic`: Live flights, ships, and ports data for the 3D map.
- `WS /ws/intelligence`: WebSocket endpoint pushing real-time disruption alerts.

## Contributing

Contributions are always welcome! Please fork the repository and create a pull request to add features, resolve issues, or improve documentation.

## License

This project is licensed under the MIT License.
