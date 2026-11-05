# Wayfarer AI — Full-Stack Multi-Agent Travel Planner

## Overview

Build an end-to-end autonomous travel planning platform with:
- **Next.js 15** frontend (App Router, Tailwind CSS v4, shadcn/ui) — premium landing page + authenticated dashboard
- **Python FastAPI** backend with **LangGraph** multi-agent orchestration (Supervisor → Transit/Lodging/Sightseeing → Budget Validator loop)
- **MongoDB** persistence via **Beanie ODM**
- **SSE streaming** for real-time agent execution tracking in the UI

---

## User Review Required

> [!IMPORTANT]
> **API Keys & Credentials**: The system integrates with Amadeus, Google Places, and SerpAPI. You'll need to provide API keys for these services via `.env` files. We'll build with graceful fallbacks (mock/demo data) so the app runs without live keys during development.

> [!IMPORTANT]
> **LLM Provider**: The LangGraph agents require an LLM backend. The plan assumes **OpenAI GPT-4o** via `langchain-openai`. If you prefer a different provider (Gemini, Anthropic, local Ollama), please specify.

> [!WARNING]
> **Authentication**: The PRD mentions Clerk/NextAuth. This plan uses **NextAuth.js v5** with credentials (email/password) + Google OAuth for simplicity. The password auth will use JWT tokens validated against MongoDB. Let me know if you prefer Clerk instead.

## Open Questions

> [!IMPORTANT]
> 1. **LLM Provider Preference**: OpenAI GPT-4o, Google Gemini, Anthropic Claude, or local model via Ollama?
> 2. **Deployment Target**: Vercel (frontend) + Railway/Render (backend), or Docker Compose for self-hosting?
> 3. **MongoDB**: MongoDB Atlas (cloud) or local Docker instance for development?

---

## Proposed Changes

The project is split into a **monorepo** with two top-level directories:

```
d:\Projects\Wayfarer AI\
├── frontend/          # Next.js 15 App
├── backend/           # Python FastAPI + LangGraph
├── .env.example       # Shared env template
└── README.md
```

---

### Sprint 1: Project Scaffolding & Landing Page

#### [NEW] Project Root Files

- `README.md` — Project overview, setup instructions, architecture diagram
- `.env.example` — Template for all required environment variables
- `.gitignore` — Combined Node.js + Python ignores

---

#### Frontend — Next.js 15 + Tailwind + shadcn/ui

##### [NEW] `frontend/` — Next.js Project Initialization

```bash
npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --no-import-alias
npx shadcn@latest init
npx shadcn@latest add button card badge separator sheet input label tabs avatar dropdown-menu
```

##### [NEW] `frontend/src/app/(marketing)/page.tsx`
Landing page with sections:
- **Navbar**: Logo, nav links (smooth-scroll anchors), theme toggle (next-themes), Sign In / Sign Up buttons
- **Hero**: Bold headline ("Autonomous Multi-Agent Travel Intelligence"), dual CTAs, animated agent terminal preview card
- **How It Works**: 3-step visual workflow (Input → Agent Swarm → Booking)
- **Features Grid**: Cards for Transit, Lodging, Sightseeing, Budget Validation capabilities
- **Differentiators**: Comparison table (Wayfarer AI vs ChatGPT vs Booking Aggregators)
- **Footer**: Product links, legal, social, newsletter

##### [NEW] `frontend/src/app/(marketing)/layout.tsx`
Marketing layout with shared Navbar and Footer components.

##### [NEW] `frontend/src/components/landing/`
| File | Purpose |
|------|---------|
| `navbar.tsx` | Sticky header with logo, nav links, theme toggle, auth CTAs |
| `hero-section.tsx` | Hero with gradient headline, animated terminal preview |
| `how-it-works.tsx` | 3-step animated workflow cards |
| `features-grid.tsx` | 4-column capability cards with icons |
| `differentiators.tsx` | Comparison matrix with checkmarks |
| `footer.tsx` | Multi-column footer with links & newsletter |
| `agent-terminal.tsx` | Animated mock terminal showing agent logs |

##### [NEW] `frontend/src/components/theme-provider.tsx`
Theme provider using `next-themes` for light/dark/system toggle.

##### [NEW] `frontend/src/lib/utils.ts`
Utility functions (cn for classnames merging).

##### [NEW] `frontend/src/app/globals.css`
Global CSS with:
- Custom CSS variables for light/dark themes
- Premium gradient definitions
- Animation keyframes (fade-in, slide-up, terminal typing, pulse)
- Typography setup (Inter/Outfit from Google Fonts)

---

### Sprint 2: Authentication System

#### [NEW] `frontend/src/app/(auth)/sign-in/page.tsx`
Sign-in page with email/password form + Google OAuth button. Premium glassmorphism card design.

#### [NEW] `frontend/src/app/(auth)/sign-up/page.tsx`
Sign-up page with name, email, password fields + Google OAuth.

#### [NEW] `frontend/src/app/(auth)/layout.tsx`
Centered auth layout with animated background.

#### [NEW] `frontend/src/lib/auth-context.tsx`
React context for authentication state (JWT token, user profile) using Zustand store.

#### [NEW] `frontend/src/lib/api.ts`
API client with Axios/fetch wrapper, JWT token injection, base URL configuration.

---

### Sprint 3: FastAPI Backend & MongoDB

#### [NEW] `backend/` — Python Project

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry, CORS, lifespan
│   ├── config.py             # Pydantic Settings (env vars)
│   ├── database.py           # Beanie/Motor MongoDB init
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # User Document (Beanie)
│   │   └── trip.py           # Trip Document (Beanie)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py           # Pydantic request/response for auth
│   │   └── trip.py           # Pydantic request/response for trips
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py           # POST /register, POST /login
│   │   └── trips.py          # POST /create, GET /stream, GET /{id}
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py   # JWT creation, password hashing
│   └── dependencies.py       # get_current_user dependency
├── requirements.txt
├── .env.example
└── pyproject.toml
```

##### [NEW] `backend/app/main.py`
FastAPI app with:
- CORS middleware (allow frontend origin)
- Lifespan handler for Beanie initialization
- Router mounting (`/api/v1/auth`, `/api/v1/trips`)

##### [NEW] `backend/app/models/user.py`
```python
class User(Document):
    email: str (unique indexed)
    hashed_password: str
    full_name: Optional[str]
    preferred_currency: str = "USD"
    created_at: datetime
```

##### [NEW] `backend/app/models/trip.py`
```python
class Trip(Document):
    user_id: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_budget: float
    status: str  # GENERATING, PLANNED, FAILED
    transit_details: List[Dict]
    lodging_details: List[Dict]
    daily_itinerary: List[Dict]
    total_estimated_cost: float
    confirmed_bookings: List[Dict]
    created_at: datetime
```

##### [NEW] `backend/app/routers/auth.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create user, hash password, return JWT |
| POST | `/api/v1/auth/login` | Validate credentials, return JWT |
| GET | `/api/v1/auth/me` | Get current user profile |

##### [NEW] `backend/app/routers/trips.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trips/create` | Create trip, launch LangGraph, return trip_id |
| GET | `/api/v1/trips/{trip_id}/stream` | SSE stream of agent execution logs |
| GET | `/api/v1/trips/{trip_id}` | Get completed trip plan |
| GET | `/api/v1/trips` | List all user trips |

---

### Sprint 4: LangGraph Multi-Agent Engine

#### [NEW] `backend/app/agents/`

```
backend/app/agents/
├── __init__.py
├── state.py              # TravelPlanState TypedDict
├── graph.py              # StateGraph assembly & compilation
├── supervisor.py         # Supervisor/Orchestrator node
├── transit_agent.py      # Flight/train search agent
├── lodging_agent.py      # Hotel/accommodation agent
├── sightseeing_agent.py  # Attractions & itinerary agent
├── budget_validator.py   # Budget & constraint checker
├── consolidator.py       # Final itinerary builder
└── tools/
    ├── __init__.py
    ├── amadeus_tools.py   # Amadeus flight search wrapper
    ├── serpapi_tools.py   # SerpAPI hotel/flight fallback
    ├── places_tools.py    # Google Places API wrapper
    └── geocoding_tools.py # Nominatim geocoding
```

##### [NEW] `backend/app/agents/state.py`
Shared LangGraph state with all fields from the PRD:
- User inputs (origin, destination, dates, budget, preferences, pace)
- Agent outputs (selected_transit, selected_lodging, itinerary_schedule)
- Validation flags (current_total_spend, is_feasible, rejection_reasons, iteration_count)
- Streaming logs (node_logs with `operator.add` reducer)

##### [NEW] `backend/app/agents/graph.py`
StateGraph assembly:
```
START → supervisor → [transit_agent, lodging_agent, sightseeing_agent] → budget_validator
  budget_validator → (if valid) → consolidator → END
  budget_validator → (if invalid & iteration < 3) → supervisor (re-plan loop)
  budget_validator → (if invalid & iteration >= 3) → consolidator (best-effort) → END
```

##### [NEW] `backend/app/agents/tools/amadeus_tools.py`
- `search_flights(origin, destination, date, adults, max_price)` → returns top 5 flight options with prices, carriers, booking URLs
- Fallback: If Amadeus fails, return SerpAPI Google Flights results
- Final fallback: Return structured mock data

##### [NEW] `backend/app/agents/tools/serpapi_tools.py`
- `search_hotels(location, check_in, check_out, budget_per_night)` → returns top 5 hotels with rates, proximity, booking links
- `search_flights_fallback(origin, dest, date)` → Google Flights via SerpAPI

##### [NEW] `backend/app/agents/tools/places_tools.py`
- `get_attractions(lat, lng, radius_km, types)` → returns POIs with ratings, opening hours, photos
- `get_place_details(place_id)` → detailed info for a specific place

##### [NEW] `backend/app/agents/tools/geocoding_tools.py`
- `geocode(address)` → returns lat/lng coordinates via Nominatim (free, no API key)

##### Agent Node Details:

| Agent | Inputs | Processing | Outputs |
|-------|--------|------------|---------|
| **Supervisor** | Raw user inputs | Parses intent, sets constraints, determines agent execution order | Structured task context for downstream agents |
| **Transit Agent** | Origin, destination, dates | Calls Amadeus/SerpAPI → ranks by price & duration | `selected_transit: List[BookingOption]` |
| **Lodging Agent** | Destination coords, dates, budget | Calls SerpAPI Hotels → filters by proximity to transit hub & budget | `selected_lodging: List[BookingOption]` |
| **Sightseeing Agent** | Destination coords, dates, preferences | Calls Google Places → geo-clusters attractions → builds day schedule | `itinerary_schedule: List[ItineraryDay]` |
| **Budget Validator** | All agent outputs | Sums costs, checks ≤ budget, detects time conflicts | `is_feasible`, `rejection_reasons` |
| **Consolidator** | Validated state | Merges everything into final day-by-day plan with booking links | Complete trip JSON |

---

### Sprint 5: Dashboard & Real-Time Streaming UI

#### [NEW] `frontend/src/app/dashboard/page.tsx`
Main dashboard with:
- **Trip list sidebar** showing past trips with status badges
- **New Plan panel** with dual input modes (prompt bar + structured form)
- Structured form: Origin/Destination autocomplete, Date Range picker, Budget slider, Pace pills, Interest tags

#### [NEW] `frontend/src/app/dashboard/layout.tsx`
Dashboard layout with sidebar navigation, top bar with user avatar dropdown.

#### [NEW] `frontend/src/app/dashboard/trip/[id]/page.tsx`
Trip detail view:
- **Agent Execution Pipeline**: Animated stepper showing each agent node (idle → running → completed)
- **Day-by-Day Itinerary**: Timeline cards with map pins, activity details
- **Booking Cards**: Flight/hotel cards with prices, details, deep-link booking buttons
- **Export Bar**: Download PDF, Sync to Google Calendar, Copy shareable URL

#### [NEW] `frontend/src/components/dashboard/`
| File | Purpose |
|------|---------|
| `plan-form.tsx` | Structured trip planning form with all input fields |
| `prompt-bar.tsx` | Natural language input with AI parsing |
| `agent-pipeline.tsx` | Real-time SSE-powered agent execution stepper |
| `itinerary-view.tsx` | Day-by-day timeline with activities |
| `booking-card.tsx` | Flight/hotel card with price, details, book button |
| `trip-list.tsx` | Sidebar list of user's past trips |
| `export-toolbar.tsx` | PDF download, Calendar sync, Share buttons |

#### [NEW] `frontend/src/hooks/use-sse-stream.ts`
Custom React hook that connects to the FastAPI SSE endpoint and streams agent logs in real-time.

#### [NEW] `frontend/src/stores/trip-store.ts`
Zustand store for trip creation state, agent pipeline status, and itinerary data.

---

### Sprint 6: Direct Booking & Export

#### [MODIFY] `backend/app/routers/trips.py`
Add endpoints:
- `POST /api/v1/trips/{trip_id}/custom-booking` — Override a specific booking option
- `GET /api/v1/trips/{trip_id}/export/pdf` — Generate PDF itinerary

#### [NEW] `backend/app/services/pdf_service.py`
PDF generation using `reportlab` or `weasyprint` for formatted itinerary documents.

#### [NEW] `frontend/src/components/dashboard/booking-override-modal.tsx`
Modal allowing users to search for alternative flights/hotels and replace the auto-selected option.

---

## Verification Plan

### Automated Tests

```bash
# Backend - Python tests
cd backend && python -m pytest tests/ -v

# Frontend - Build verification
cd frontend && npm run build

# Type checking
cd frontend && npx tsc --noEmit
```

### Manual Verification

1. **Landing Page**: Verify all sections render with dark/light theme toggle, smooth-scroll nav, and responsive layout
2. **Auth Flow**: Register → Login → Dashboard redirect → JWT persistence
3. **Trip Creation**: Fill form → Submit → Watch SSE agent pipeline → View generated itinerary
4. **Agent Fallbacks**: Disable API keys → Verify mock data fallback works gracefully
5. **Budget Loop**: Submit trip with very low budget → Verify validator loops and produces best-effort plan
6. **Export**: Download PDF → Verify formatting and content accuracy

---

## Implementation Order

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| **Sprint 1** | Frontend scaffolding + Landing page | Fully styled marketing page with all sections |
| **Sprint 2** | Auth pages + context | Sign in/up pages, JWT auth context |
| **Sprint 3** | Backend API + MongoDB | FastAPI with auth routes, Beanie models |
| **Sprint 4** | LangGraph engine | Complete multi-agent graph with tools |
| **Sprint 5** | Dashboard + SSE streaming | Trip creation, real-time pipeline, itinerary view |
| **Sprint 6** | Booking overrides + PDF export | Custom booking modal, PDF generation |

> [!TIP]
> **Sprint 1 is the immediate priority** — we'll build the stunning landing page first, then progressively add backend and agent capabilities.
