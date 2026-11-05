# ✈️ Wayfarer AI — Autonomous Multi-Agent Travel Planner & Booking Ecosystem

> **Autonomous Travel Orchestration Engine**: A deterministic, stateful multi-agent swarm powered by **LangGraph** and **Google Gemini 2.5 Flash** that queries live market inventory (Flights, IRCTC Trains, Google Hotels, Google Places), enforces strict financial constraints, and streams real-time execution telemetry to an editorial React 19 interface.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3+-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2+-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-orange.svg?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 🌟 Executive Summary & Problem Statement

### The Problem
Traditional consumer travel planning is fragmented and labor-intensive:
- Travelers waste **5 to 10 hours** juggling dozens of browser tabs across flight search engines, IRCTC, hotel aggregators, and map apps.
- General-purpose LLMs (e.g. ChatGPT, Claude) **hallucinate outdated prices, non-existent train schedules, and fictitious hotel tariffs**, completely lacking real-time market inventory.
- Off-the-shelf booking platforms lack adaptive, multi-constraint solving (e.g., *"Plan a 4-day trip to Varanasi for 4 friends under ₹15,000 total by train"*).

### The Solution: Wayfarer AI
**Wayfarer AI** replaces probabilistic LLM guesswork with a **deterministic, self-correcting multi-agent swarm** operating on a shared state machine (`TravelPlanState`). It connects directly to live APIs, enforces a **Strict Zero-Mock Policy**, validates financial invariants across multimodal transit and lodging, and streams live telemetry via Server-Sent Events (SSE).

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client["Frontend: Next.js 16 + React 19"]
        UI["Landing & Planner UI\n(Zustand + Tailwind v4)"]
        StreamHook["SSE Stream Hook\n(/api/v1/trips/{id}/stream)"]
        Dashboard["Interactive Dashboard\n(Timeline, Sticky Pass, Budget Audit)"]
    end

    subgraph API["Backend Gateway: FastAPI (Async)"]
        Router["/trips/create\n/trips/{id}\n/trips/{id}/stream"]
        AuthMiddleware["JWT Authentication\n(OAuth2 Password Bearer)"]
        TaskRunner["FastAPI BackgroundTasks\n(Asyncio Runner)"]
    end

    subgraph Swarm["LangGraph Multi-Agent Swarm (TravelPlanState)"]
        Supervisor["🧠 Supervisor Agent\n(NLP Intent & Location Resolver)"]
        TransitAgent["🚆 Transit & Logistics Agent\n(IRCTC Tariff Engine & Google Flights)"]
        LodgingAgent["🏨 Lodging Agent\n(Google Hotels Real-Time Scraper)"]
        SightseeingAgent["🏛️ Sightseeing Agent\n(Google Places POIs + Gemini Itinerary)"]
        BudgetGuard{"🛡️ Budget Guardian\n(Financial Invariant Checker)"}
        Consolidator["📦 Consolidator Node\n(State Packaging & Artifact Assembly)"]
    end

    subgraph ExternalServices["Live External Integrations (Zero-Mock Policy)"]
        GeminiAPI["Google Gemini 2.5 Flash\n(Structured Extraction & Synthesis)"]
        SerpAPIFlights["SerpAPI Google Flights\n(Live Air Fares & Deep-links)"]
        SerpAPIHotels["SerpAPI Google Hotels\n(Live Rates & Booking Links)"]
        IRCTC["Indian Railways Tariff Engine\n(Distance Slabs & Class Tariffs)"]
        PlacesAPI["Google Places API (New)\n(Verified Table A POIs)"]
    end

    subgraph Storage["Persistence Layer"]
        MongoDB[("MongoDB Atlas Cloud\n(Beanie Async ODM)")]
    end

    %% Client to API
    UI -->|POST /trips/create| Router
    Router --> AuthMiddleware
    Router --> TaskRunner
    TaskRunner -->|astream| Supervisor

    %% Swarm Loop
    Supervisor -->|Route Valid Intent| TransitAgent
    Supervisor -->|Missing Params| Consolidator
    TransitAgent --> LodgingAgent
    LodgingAgent --> SightseeingAgent
    SightseeingAgent --> BudgetGuard

    %% Budget Guardian Cyclic Feedback
    BudgetGuard -->|Spend > Budget & Iteration < 3\nTrigger Auto-Trimming Loop| Supervisor
    BudgetGuard -->|Spend <= Budget OR Max Iterations\n(Pass Invariant)| Consolidator
    Consolidator --> MongoDB

    %% External APIs
    Supervisor -.-> GeminiAPI
    TransitAgent -.-> SerpAPIFlights
    TransitAgent -.-> IRCTC
    LodgingAgent -.-> SerpAPIHotels
    SightseeingAgent -.-> PlacesAPI
    SightseeingAgent -.-> GeminiAPI

    %% Streaming
    TaskRunner -.->|SSE Events: log / update / finish| StreamHook
    StreamHook --> Dashboard
    MongoDB -.->|GET /trips/{id}| Dashboard
```

---

## 🤖 Multi-Agent Swarm Breakdown

Wayfarer AI structures its agent swarm using **LangGraph `StateGraph`** with a typed shared state (`TravelPlanState`):

```python
class TravelPlanState(TypedDict):
    trip_id: str
    user_id: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_budget: float
    travel_pace: str               # "Relaxed" | "Balanced" | "Fast-Paced"
    preferences: List[str]
    prompt: Optional[str]
    transit_mode: Optional[str]     # "ALL" | "FLIGHT" | "TRAIN"
    travelers: int                 # 1 to 10 guests
    trip_type: Optional[str]       # "Solo" | "Couple" | "Family" | "Friends" | "Business"
    
    # Domain Artifacts
    selected_transit: List[Dict]
    selected_lodging: List[Dict]
    itinerary_schedule: List[Dict]
    
    # Financial Invariant Tracking
    current_total_spend: float
    is_feasible: bool
    rejection_reasons: List[str]
    iteration_count: int
    
    # Append-Only Reducers for Live Telemetry
    node_logs: Annotated[List[str], operator.add]
    data_errors: Annotated[List[Dict], operator.add]
```

### The 5 Domain Agents

1. **🧠 Supervisor Agent (`supervisor.py`)**
   - Natural language intent parser powered by **Gemini 2.5 Flash** with structured JSON output + heuristic regex fallback.
   - Normalizes colloquial and regional destinations (e.g. *"Kashi"* $\rightarrow$ *"Varanasi, Uttar Pradesh, India"*).
   - Dynamically adapts constraints on re-optimization passes (e.g. stepping down travel pace from `Fast-Paced` $\rightarrow$ `Balanced` $\rightarrow$ `Relaxed`).

2. **🚆 Transit & Logistics Agent (`transit_agent.py`)**
   - Multimodal transit routing supporting **Flights** and **Trains**.
   - **Indian Railways / IRCTC Tariff Engine**: Official distance-slab tariffs across coach classes (`SL`, `3A`, `2A`, `CC`, `Vande Bharat`) calculated dynamically based on rail distance and passenger count.
   - **Google Flights API**: Live carrier fares, route legs, and booking deep-links via SerpAPI.
   - Dynamically scales single-passenger tickets across the entire party size.

3. **🏨 Lodging & Accommodation Agent (`lodging_agent.py`)**
   - Computes dynamic nightly caps based on residual budget after transit:
     $$\text{Nightly Cap} = \frac{(\text{Total Budget} - \text{Transit Cost}) \times \text{Lodging Ratio}}{\text{Nights}}$$
   - Automatically dimensions room requirements: $\lceil \text{travelers} / 2 \rceil$.
   - Queries **SerpAPI Google Hotels** for live rates, verified guest ratings, and direct booking provider links.

4. **🏛️ Sightseeing & Activity Agent (`sightseeing_agent.py`)**
   - Discovers real cultural POIs via **Google Places API (New)** using Table A category masks (`hindu_temple`, `historical_place`, `cultural_landmark`), with automated SerpAPI Google Maps fallback.
   - Synthesizes an immersive day-by-day itinerary with **Gemini 2.5 Flash**, featuring realistic diurnal pacing (morning walks, afternoon indoor sights, evening ceremonies), verified Google Maps pins, transit notes, and authentic dining recommendations.

5. **🛡️ Budget Guardian (`budget_validator.py`)**
   - Rigorous financial validator enforcing the core invariant:
     $$\text{Total Spend} = \text{Transit} + (\text{Nightly Rate} \times \text{Nights}) + \sum \text{Daily Activities} \le \text{User Budget}$$
   - **Cyclic Feedback Routing**:
     - If spend is within budget $\rightarrow$ routes to `consolidator`.
     - If spend exceeds budget and $\text{iteration} < 3$ $\rightarrow$ triggers self-correcting loop back to `supervisor`.
     - If $\text{iteration} \ge 3$ $\rightarrow$ terminates cycle safely with `BUDGET_WARNING` to avoid infinite execution.

---

## ✨ Key Engineering Features

- ⚡ **Zero-Mock Policy**: Strict real-world data enforcement. When providers return no inventory or encounter rate limits, structured `data_errors` inform the user rather than fabricating phantom flights or hotels.
- 📡 **Real-Time SSE Streaming**: Async FastAPI background task streams live agent logs and partial state updates directly to an animated telemetry terminal.
- 🎨 **Editorial Travel Typography**: Replaced generic AI template monospace with human, warm typography:
  - **Plus Jakarta Sans**: Primary UI body font with $-0.011\text{em}$ tracking.
  - **Outfit**: Modern geometric headings with $-0.022\text{em}$ letter spacing.
  - **Fraunces**: Luxury travel publication serif for destination accents.
  - **Tabular Numerals**: `tabular-nums` formatting on all currency and dates for perfect vertical alignment.
- 👥 **Party Scalability**: Presets for *Solo*, *Couple*, *Family*, *Friends*, and *Business* travel, with automatic room-allocation math and per-person cost breakdowns.
- 🎫 **1-Click Booking & Overrides**: Direct deep-links to IRCTC, airline, and hotel checkout pages, plus a custom modal for manual ticket overrides.
- 🧪 **Automated Testing Suite**: 16 unit tests covering graph compilation, budget verification invariants, location resolver, and supervisor NLP with `pytest`.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Library**: React 19
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Typography**: Plus Jakarta Sans, Outfit, Fraunces, JetBrains Mono
- **Icons**: Lucide React

### Backend & AI
- **Framework**: Python 3.11+ / 3.13, FastAPI, Uvicorn
- **Agent Orchestration**: LangGraph (`StateGraph`), LangChain Core
- **LLM Engine**: Google Gemini 2.5 Flash (`google-genai` SDK)
- **Database & ODM**: MongoDB Atlas (Cloud), Beanie Async ODM, Motor Async PyMongo
- **Authentication**: JWT (JSON Web Tokens), PyJWT, Passlib (bcrypt)
- **Testing**: Pytest, Asyncio, AnyIO

### External APIs
- **Google Gemini 2.5 Flash**: Structured intent extraction & itinerary synthesis
- **SerpAPI Google Flights**: Real-time airfares & carrier links
- **SerpAPI Google Hotels**: Verified accommodations & booking links
- **Google Places API (New)**: Geocoded tourist attractions & category filters
- **OpenStreetMap Nominatim & Overpass**: Free geocoding & location resolution

---

## 📁 Repository Directory Structure

```
Wayfarer AI/
├── frontend/                   # Next.js 16 + React 19 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/    # Landing page, 3D Hero, Features, Pricing
│   │   │   ├── (auth)/         # NextAuth Sign-In & Sign-Up
│   │   │   ├── dashboard/      # Planner Hub & Interactive Trip Itinerary View
│   │   │   ├── globals.css     # Tailwind v4 theme tokens & typography
│   │   │   └── layout.tsx      # Root layout with Google Fonts preloading
│   │   ├── components/
│   │   │   ├── 3d/             # Interactive 3D Globe, Holographic Ticket, Showcase
│   │   │   ├── landing/        # HeroSection, HowItWorks, FeaturesGrid
│   │   │   ├── dashboard/      # SwarmTelemetryConsole, CityAutocomplete
│   │   │   └── ui/             # shadcn/ui accessible atomic components
│   │   ├── hooks/              # useSSEStream custom React hook
│   │   └── lib/                # API client helper & utils
│   ├── .env.local              # Frontend environment variables
│   └── package.json
│
├── backend/                    # Python FastAPI + LangGraph Backend
│   ├── app/
│   │   ├── agents/             # LangGraph Multi-Agent Swarm
│   │   │   ├── state.py        # TravelPlanState TypedDict definition
│   │   │   ├── graph.py        # StateGraph assembly & conditional routing
│   │   │   ├── supervisor.py   # Supervisor Orchestrator & NLP extraction
│   │   │   ├── transit_agent.py# Multimodal Flight & Train routing
│   │   │   ├── lodging_agent.py# Google Hotels search & room sizing
│   │   │   ├── sightseeing_agent.py # Google Places POIs & Gemini synthesis
│   │   │   ├── budget_validator.py  # Financial invariant checker & loop router
│   │   │   ├── consolidator.py      # Final state packaging
│   │   │   └── tools/          # API Integrations:
│   │   │       ├── train_tools.py   # Indian Railways IRCTC tariff engine
│   │   │       ├── amadeus_tools.py # Flight search wrapper
│   │   │       ├── serpapi_tools.py # Google Hotels scraper
│   │   │       ├── places_tools.py  # Google Places (New) POI fetcher
│   │   │       └── geocoding_tools.py# Nominatim location resolver
│   │   ├── models/             # Beanie MongoDB Documents (User, Trip)
│   │   ├── schemas/            # Pydantic v2 Request/Response validation
│   │   ├── routers/            # FastAPI API Routers (auth, trips, locations)
│   │   ├── services/           # JWT auth service & location resolver
│   │   ├── config.py           # Pydantic Settings
│   │   ├── database.py         # MongoDB Atlas connection manager
│   │   └── main.py             # FastAPI application entry point
│   ├── tests/                  # Pytest automated test suite (16 tests)
│   ├── requirements.txt        # Python backend dependencies
│   └── .env                    # Backend secrets
│
├── .gitignore                  # Production gitignore (Python, Next.js, Secrets)
├── .env.example                # Shared environment variable template
└── README.md
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js 18.x or 20.x
- Python 3.11, 3.12, or 3.13
- MongoDB Atlas cluster (free M0 tier or local MongoDB instance)

---

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Activate virtual environment:
   ```powershell
   # Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (`backend/.env`):
   ```env
   PROJECT_NAME=Wayfarer AI Backend
   VERSION=1.0.0
   API_V1_STR=/api/v1
   CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

   # Database
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wayfarer_ai?retryWrites=true&w=majority
   DB_NAME=wayfarer_ai

   # Security
   JWT_SECRET=your-super-secret-jwt-key
   JWT_ALGORITHM=HS256

   # API Keys
   GEMINI_API_KEY=your-gemini-api-key
   SERPAPI_API_KEY=your-serpapi-api-key
   GOOGLE_PLACES_API_KEY=your-google-places-key
   ```

5. Run unit tests to verify system integrity:
   ```bash
   python -m pytest tests
   ```

6. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - **Backend API**: `http://localhost:8000`
   - **Swagger Docs**: `http://localhost:8000/docs`

---

### 2. Frontend Setup (Next.js 16)

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   - **Application Dashboard**: `http://localhost:3000`

---

## 🔑 API Keys & Provisioning

| Key | Purpose | Free Tier Availability | Portal |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Intent Extraction & Itinerary Synthesis | Free (Google AI Studio) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `MONGODB_URI` | Document Persistence & Sessions | Free M0 Cluster | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) |
| `SERPAPI_API_KEY` | Live Flights & Google Hotels Scraping | 100 free searches/mo | [serpapi.com](https://serpapi.com/) |
| `GOOGLE_PLACES_API_KEY` | Tourist Attractions & Category POIs | $200 recurring credit | [console.cloud.google.com](https://console.cloud.google.com/) |

---

## 📡 API Endpoint Reference

### Authentication (`/api/v1/auth`)
- `POST /register` — Register new user and return JWT access token
- `POST /login` — Authenticate credentials and return JWT access token
- `GET /me` — Retrieve current authenticated user profile

### Trip Planning (`/api/v1/trips`)
- `POST /create` — Initialize trip document & trigger LangGraph swarm in background task
- `GET /{trip_id}/stream` — **Server-Sent Events (SSE)** endpoint streaming live node execution logs
- `GET /{trip_id}` — Retrieve finalized trip plan, itinerary, transit details, and hotel options
- `GET /` — List user's trip history
- `POST /{trip_id}/custom-booking` — Override or add custom flight/hotel ticket
- `GET /{trip_id}/export/pdf` — Download formatted PDF travel pass

---

## 🌐 Production Deployment Architecture

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│           Vercel CDN            │                 │           Railway.app           │
│      (Next.js 16 Frontend)      │ ── HTTPS API ──►│     (Python FastAPI Backend)    │
│   https://wayfarer-ai.vercel.app│                 │ https://api-wayfarer.up.railway.app
└─────────────────────────────────┘                 └────────────────┬────────────────┘
                                                                     │
                                                                     ▼
                                                    ┌─────────────────────────────────┐
                                                    │       MongoDB Atlas Cloud       │
                                                    │     (Beanie Async Database)     │
                                                    └─────────────────────────────────┘
```

---

## 📄 License & Attribution

Wayfarer AI is built with multi-agent intelligence for high-scale autonomous travel planning. Powered by **LangGraph**, **Google Gemini**, **Next.js 16**, **FastAPI**, and **MongoDB Atlas**.
