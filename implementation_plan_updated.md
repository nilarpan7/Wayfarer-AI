# Wayfarer AI — Full-Stack Multi-Agent Travel Planner

## Overview

Build an end-to-end autonomous travel planning platform with:
- **Next.js 15** frontend (App Router, Tailwind CSS v4, shadcn/ui) — ultra-premium $20K product-grade design
- **Python FastAPI** backend with **LangGraph** multi-agent orchestration (Gemini-powered)
- **MongoDB Atlas** (cloud) via **Beanie ODM**
- **SSE streaming** for real-time agent execution
- **ZERO mock data** — all agents call live APIs with graceful error states

---

## Finalized Technical Decisions

| Decision | Choice |
|----------|--------|
| **LLM Provider** | Google Gemini via AI Studio (`langchain-google-genai`) |
| **Frontend Deployment** | Vercel (production) |
| **Backend Deployment** | Railway (production) |
| **Database** | MongoDB Atlas (cloud) |
| **Authentication** | NextAuth.js v5 with Google OAuth (user provides Client ID/Secret) |
| **Data Policy** | **Strictly real-time** — no mock data, no fallback fakes |

---

## Design Philosophy — $20,000 Premium Product

> [!IMPORTANT]
> This frontend must look and feel like a **$20K enterprise SaaS product**. Every pixel matters. The design must immediately communicate trust, sophistication, and cutting-edge technology to convert visitors into paying users.

### Visual Identity

| Element | Specification |
|---------|---------------|
| **Color Palette** | Deep navy/slate base (`#0A0F1C`, `#111827`), electric indigo accents (`#6366F1` → `#8B5CF6` gradient), warm amber CTAs (`#F59E0B`), success emerald (`#10B981`) |
| **Typography** | `Inter` for body (clean, modern), `Outfit` for headlines (bold, premium feel), `JetBrains Mono` for terminal/code elements |
| **Glass Effects** | Frosted glass cards with `backdrop-blur-xl`, subtle border gradients (`border: 1px solid rgba(255,255,255,0.08)`), layered depth |
| **Animations** | Cinematic entrance animations (staggered fade-up), fluid hover transforms, shimmer loading states, particle/gradient mesh backgrounds, smooth page transitions |
| **Iconography** | Lucide Icons — consistent 24px stroke-width, with accent color hover states |
| **Spacing** | Generous whitespace, 8px grid system, breathing room between sections |
| **Dark Mode Default** | Dark mode as primary (premium tech feel), with polished light mode alternative |

### Landing Page — Conversion-Optimized Design

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ◆ Wayfarer AI          Features  How It Works  Why Us  Pricing    🌙  [Sign In] [Get Started →] │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HERO — Full-viewport cinematic section                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  Animated gradient mesh background (indigo → violet → blue, slowly moving) │ │
│  │                                                                             │ │
│  │  "Your AI Travel Command Center"                                           │ │
│  │   — Outfit 56px bold, gradient text (indigo → violet)                      │ │
│  │                                                                             │ │
│  │  "4 autonomous AI agents coordinate in real-time to plan, optimize,        │ │
│  │   and book your perfect trip — while you watch it happen live."             │ │
│  │   — Inter 20px, muted gray, max-width 640px                                │ │
│  │                                                                             │ │
│  │  [ ✨ Start Planning Free ]  [ ▶ Watch Live Demo ]                         │ │
│  │   — Primary: gradient bg, glow shadow  — Secondary: ghost outline          │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐                   │ │
│  │  │  LIVE AGENT TERMINAL PREVIEW (glassmorphism card)   │                   │ │
│  │  │  ✓ Supervisor: Parsed "5-day Tokyo budget trip"     │                   │ │
│  │  │  ✓ Transit Agent: Found Delta DL1420 — $820        │                   │ │
│  │  │  ● Lodging Agent: Evaluating Shibuya hotels...      │                   │ │
│  │  │  ○ Sightseeing: Pending geo-clustering              │                   │ │
│  │  │  ○ Budget Validator: Waiting for inputs              │                   │ │
│  │  └─────────────────────────────────────────────────────┘                   │ │
│  │   — Auto-typing animation, green/amber/gray status dots                    │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
├──── Trusted by travelers worldwide  [Logos: 5 company trust badges] ────────────┤
│                                                                                  │
├──── HOW IT WORKS — 3 animated step cards ───────────────────────────────────────┤
│  ┌──────────────┐  →  ┌──────────────┐  →  ┌──────────────┐                    │
│  │ 1. Set Your  │     │ 2. AI Agents │     │ 3. Review &  │                    │
│  │   Constraints│     │   Optimize   │     │   Book       │                    │
│  │ (icon + desc)│     │ (icon + desc)│     │ (icon + desc)│                    │
│  └──────────────┘     └──────────────┘     └──────────────┘                    │
│  — Cards float up on scroll (IntersectionObserver), connected by animated line  │
│                                                                                  │
├──── WHAT WE OFFER — 4 feature cards with hover lift + glow ─────────────────────┤
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│  │ ✈ Real-Time   │ │ 🏨 Smart       │ │ 🗺 Geo-Synced  │ │ 💰 Budget      │    │
│  │   Transit     │ │   Lodging      │ │   Activities   │ │   Guardian     │    │
│  │               │ │                │ │                │ │                │    │
│  │ Live flight & │ │ Hotels ranked  │ │ Attractions    │ │ Auto-validates │    │
│  │ train search  │ │ by proximity   │ │ clustered by   │ │ total spend &  │    │
│  │ via Amadeus   │ │ to your plans  │ │ geography      │ │ re-optimizes   │    │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘    │
│                                                                                  │
├──── WHY WE'RE DIFFERENT — Comparison matrix ────────────────────────────────────┤
│  │ Feature               │ Wayfarer AI │ ChatGPT │ Booking.com │ Expedia │      │
│  │ Real-time prices       │     ✅      │   ❌    │     ✅      │   ✅   │      │
│  │ Multi-agent validation │     ✅      │   ❌    │     ❌      │   ❌   │      │
│  │ Budget auto-optimize   │     ✅      │   ❌    │     ❌      │   ❌   │      │
│  │ Live agent tracking    │     ✅      │   ❌    │     ❌      │   ❌   │      │
│  │ 1-click booking links  │     ✅      │   ❌    │     ✅      │   ✅   │      │
│                                                                                  │
├──── PRICING — 3 tier cards (Free / Pro / Enterprise) ───────────────────────────┤
│                                                                                  │
├──── FOOTER — Dark, premium, multi-column ───────────────────────────────────────┤
│  Product | Company | Legal | Connect                                            │
│  ─────── ───────── ─────── ─────────                                            │
│  Features  About    Privacy  Twitter/X                                          │
│  Pricing   Blog     Terms    LinkedIn                                           │
│  API Docs  Careers  GDPR     GitHub                                             │
│  Status              Cookie   Newsletter [email] [Subscribe]                    │
│                                                                                  │
│  © 2026 Wayfarer AI. All rights reserved.                                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Monorepo Structure

```
d:\Projects\Wayfarer AI\
├── frontend/                 # Next.js 15 App (deploys to Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/  # Landing page route group
│   │   │   ├── (auth)/       # Sign-in, Sign-up
│   │   │   ├── dashboard/    # Protected planner hub
│   │   │   └── api/auth/     # NextAuth route handler
│   │   ├── components/
│   │   │   ├── landing/      # Hero, Features, HowItWorks, etc.
│   │   │   ├── dashboard/    # PlanForm, AgentPipeline, Itinerary
│   │   │   └── ui/           # shadcn/ui atomic components
│   │   ├── hooks/            # useSSEStream, useTrips
│   │   ├── stores/           # Zustand stores
│   │   └── lib/              # utils, api client, auth config
│   └── public/               # Static assets, OG images
│
├── backend/                  # Python FastAPI (deploys to Railway)
│   ├── app/
│   │   ├── main.py           # FastAPI entry
│   │   ├── config.py         # Settings (Gemini key, MongoDB URI, etc.)
│   │   ├── database.py       # Beanie/Motor init
│   │   ├── models/           # Beanie documents (User, Trip)
│   │   ├── schemas/          # Pydantic request/response
│   │   ├── routers/          # Auth, Trips API routes
│   │   ├── services/         # Auth service, PDF service
│   │   ├── agents/           # LangGraph multi-agent engine
│   │   │   ├── state.py      # TravelPlanState
│   │   │   ├── graph.py      # StateGraph assembly
│   │   │   ├── supervisor.py
│   │   │   ├── transit_agent.py
│   │   │   ├── lodging_agent.py
│   │   │   ├── sightseeing_agent.py
│   │   │   ├── budget_validator.py
│   │   │   ├── consolidator.py
│   │   │   └── tools/        # API wrappers (Amadeus, SerpAPI, Places)
│   │   └── dependencies.py
│   ├── requirements.txt
│   └── Procfile              # Railway deployment
│
├── .env.example
├── .gitignore
└── README.md
```

---

### Sprint 1: Frontend Scaffolding + Premium Landing Page

#### [NEW] Root project files
- `README.md`, `.gitignore`, `.env.example`

#### [NEW] `frontend/` — Next.js 15 project
Initialize with: `npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir`
Install shadcn/ui + components: button, card, badge, separator, input, label, tabs, avatar, dropdown-menu, sheet, dialog, select, slider, checkbox, tooltip

Additional packages: `next-themes`, `lucide-react`, `framer-motion`, `zustand`, `class-variance-authority`

#### [NEW] Landing page components

| Component | Design Treatment |
|-----------|-----------------|
| `navbar.tsx` | Sticky, glass-blur on scroll, logo with gradient accent, smooth-scroll links, animated theme toggle, glowing CTA button |
| `hero-section.tsx` | Full viewport, animated gradient mesh canvas (CSS `@keyframes`), split layout: left text + right terminal preview, staggered entrance animation |
| `agent-terminal.tsx` | Glassmorphism card with auto-typing text animation, colored status indicators (green ✓, amber ●, gray ○), scrolling log lines, subtle scan-line effect |
| `trust-bar.tsx` | Horizontal logo strip with grayscale → color hover, infinite scroll marquee |
| `how-it-works.tsx` | 3 numbered cards connected by animated SVG path, cards animate in on scroll (IntersectionObserver or framer-motion `whileInView`) |
| `features-grid.tsx` | 2×2 grid of glass cards, each with gradient icon container, hover: card lifts + border glow + icon pulses |
| `differentiators.tsx` | Premium comparison table with frosted glass rows, checkmark/x indicators with color coding |
| `pricing-section.tsx` | 3 tiers (Free/Pro/Enterprise), middle card highlighted + "Most Popular" badge, hover glow effect |
| `footer.tsx` | Dark premium footer, 4-column grid, newsletter input with gradient submit button, social icons with hover lift |

#### [NEW] `frontend/src/app/globals.css`
Complete design system with:
- Custom CSS properties for both themes (30+ color tokens)
- Gradient definitions (hero mesh, card borders, text gradients)
- 10+ animation keyframes (fade-up, slide-in, typing, pulse, shimmer, float, glow)
- Premium typography stack from Google Fonts
- Utility classes for glass effects, gradient borders, text gradients

---

### Sprint 2: Authentication (NextAuth.js v5 + Google OAuth)

#### [NEW] Auth pages
- `(auth)/sign-in/page.tsx` — Premium glassmorphism sign-in card with Google OAuth button, animated background
- `(auth)/sign-up/page.tsx` — Registration form with Google OAuth, same premium styling
- `(auth)/layout.tsx` — Centered layout with animated gradient background

#### [NEW] NextAuth configuration
- `frontend/src/lib/auth.ts` — NextAuth v5 config with Google Provider + Credentials Provider
- `frontend/src/app/api/auth/[...nextauth]/route.ts` — Route handler
- JWT strategy with MongoDB user lookup
- Session includes user ID for backend API calls

---

### Sprint 3: FastAPI Backend + MongoDB Atlas

#### [NEW] `backend/` — Python project

Key packages: `fastapi`, `uvicorn`, `beanie`, `motor`, `pyjwt`, `passlib[bcrypt]`, `langchain-google-genai`, `langgraph`, `amadeus`, `google-search-results` (SerpAPI), `httpx`

##### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user, hash password, return JWT |
| POST | `/api/v1/auth/login` | Authenticate, return JWT |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/trips/create` | Create trip → launch LangGraph |
| GET | `/api/v1/trips/{id}/stream` | SSE stream of live agent logs |
| GET | `/api/v1/trips/{id}` | Get completed trip |
| GET | `/api/v1/trips` | List user's trips |
| POST | `/api/v1/trips/{id}/custom-booking` | Override a booking |
| GET | `/api/v1/trips/{id}/export/pdf` | Generate PDF itinerary |

---

### Sprint 4: LangGraph Multi-Agent Engine (Gemini-Powered)

#### Agent Architecture

All agents use **Google Gemini** (`langchain-google-genai` with `ChatGoogleGenerativeAI`) with structured JSON output.

**Graph Flow:**
```
START → supervisor → [transit, lodging, sightseeing] → budget_validator
  → (valid) → consolidator → END
  → (invalid, iteration < 3) → supervisor (re-plan) → loop
  → (invalid, iteration ≥ 3) → consolidator (best-effort) → END
```

#### Real-Time API Integration (NO MOCK DATA)

| Tool | API | Data Returned |
|------|-----|---------------|
| `search_flights()` | Amadeus Flight Offers API | Live prices, carriers, times, booking URLs |
| `search_hotels()` | SerpAPI Google Hotels | Live rates, names, ratings, booking links |
| `get_attractions()` | Google Places API (New) | POIs with ratings, hours, photos, coords |
| `geocode()` | OpenStreetMap Nominatim | Lat/lng for any address (free, no key) |

> [!IMPORTANT]
> **Error Handling Strategy**: If an API call fails (rate limit, network error, invalid params), the agent reports the failure in `node_logs` with a clear error message and the orchestrator retries with adjusted parameters. **No synthetic/mock data is ever injected.**

#### Agent Details

| Agent | LLM Role | Tools Called | Output |
|-------|----------|-------------|--------|
| **Supervisor** | Parses user intent, decomposes into structured constraints | None (pure LLM reasoning) | Task context for workers |
| **Transit** | Selects optimal flights/trains from API results | `search_flights()`, `geocode()` | `selected_transit[]` |
| **Lodging** | Ranks hotels by proximity + budget fit | `search_hotels()` | `selected_lodging[]` |
| **Sightseeing** | Geo-clusters POIs, builds daily schedule with time slots | `get_attractions()`, `get_place_details()` | `itinerary_schedule[]` |
| **Budget Validator** | Pure logic — sums costs, detects conflicts | None | `is_feasible`, `rejection_reasons[]` |
| **Consolidator** | Merges all outputs into final day-by-day plan | None | Complete trip JSON |

---

### Sprint 5: Dashboard + SSE Streaming UI

#### Dashboard design — premium, functional, real-time

- **Left panel**: Trip creation form (structured inputs + NLP prompt bar)
- **Right panel**: Live agent execution pipeline (SSE-powered stepper) + generated itinerary
- Booking cards with real prices and deep-link checkout buttons
- Day-by-day timeline with map integration
- Export toolbar (PDF, Calendar, Share URL)

---

### Sprint 6: Booking Overrides + PDF Export

- Custom booking search modal (swap flights/hotels)
- PDF itinerary generation (WeasyPrint or ReportLab)
- Google Calendar .ics export
- Shareable public trip URL

---

## Deployment Architecture

```
                    ┌──────────────────┐
                    │    Vercel CDN    │
                    │  (Next.js 15)   │
                    │  frontend/      │
                    └────────┬─────────┘
                             │ HTTPS
                             ▼
                    ┌──────────────────┐
                    │    Railway       │
                    │  (FastAPI)       │
                    │  backend/       │
                    └──────┬──┬───────┘
                           │  │
              ┌────────────┘  └────────────┐
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  MongoDB Atlas   │        │  External APIs   │
    │  (Cloud DB)      │        │  Amadeus/SerpAPI  │
    └──────────────────┘        │  Google Places   │
                                │  Gemini AI Studio │
                                └──────────────────┘
```

**Vercel**: Zero-config Next.js deployment, edge functions, automatic HTTPS, global CDN
**Railway**: One-click Python deployment, auto-scaling, persistent env vars, built-in logging

---

## Verification Plan

### Automated Tests
```bash
cd backend && python -m pytest tests/ -v
cd frontend && npm run build
cd frontend && npx tsc --noEmit
```

### Manual Verification
1. Landing page: All 7 sections render with dark/light theme, smooth-scroll, responsive (mobile/tablet/desktop)
2. Auth: Google OAuth flow → session persistence → dashboard redirect
3. Trip creation: Form submission → SSE stream shows live agent progress → itinerary renders
4. Real-time data: Verify all prices/hotels/flights are live API results (no fakes)
5. Budget loop: Low budget → validator rejects → supervisor retries → best-effort plan
6. Export: PDF download with correct formatting

---

## Implementation Priority

| Sprint | Focus | Key Outcome |
|--------|-------|-------------|
| **1** | 🎨 Premium landing page | Conversion-ready marketing page that justifies $20K pricing |
| **2** | 🔐 Auth system | Google OAuth + credentials with NextAuth v5 |
| **3** | ⚙️ Backend API | FastAPI + MongoDB Atlas + Beanie ODM |
| **4** | 🤖 Agent engine | LangGraph + Gemini + live API tools |
| **5** | 📊 Dashboard UI | Real-time SSE pipeline + itinerary view |
| **6** | 🎫 Bookings + Export | Override modal + PDF generation |
