# Shehn.AI — AI-Powered Indian Wedding Reverse Marketplace

<p align="center">
  <img src="react-frontend/public/shehnai-logo.svg" alt="Shehn.AI Logo" height="80" />
</p>

Shehn.AI is a full-stack wedding planning platform powered by **multi-agent AI orchestration**. Couples generate AI-powered wedding blueprints and publish them to a reverse marketplace. Vendors browse blueprints relevant to their category, submit structured quotes with sealed bidding, and compete for the couple's business. All communication happens on-platform.

**Target Market:** India's ₹6.5 lakh crore wedding industry — 1 crore+ weddings per year, ₹39.5L average spend per wedding.

## How It Works

### For Couples
1. **Set Preferences** — Enter wedding date, city, guest count, budget, theme, and events
2. **AI Generates Blueprint** — Gemini AI creates a personalized plan with city-tier pricing, budget allocation across 6 vendor categories, timeline, and cost-saving tips
3. **Review & Publish** — Edit the blueprint, adjust category budgets, then publish to the marketplace
4. **Receive Quotes** — Vendors submit structured quotes (per-plate for catering, per-day for photography, etc.). The platform auto-calculates totals for apples-to-apples comparison
5. **Compare & Chat** — Shortlist vendors, message them on-platform, negotiate, and confirm bookings
6. **Manage Invites** — Create wedding events, generate shareable RSVP links, track guest responses

### For Vendors
1. **Register** — Create a business profile with category, services, portfolio, and operating cities
2. **Get Approved** — Superadmin reviews and approves the vendor
3. **Browse Marketplace** — See published blueprints filtered to their category (e.g., a caterer only sees catering requirements)
4. **Submit Quotes** — Fill category-specific pricing forms. Other vendors only see the bid count (sealed bids)
5. **Message Couples** — Negotiate, revise quotes, and confirm bookings through on-platform messaging

### For Admins
1. **Approve/Reject Vendors** — Review pending vendor registrations
2. **View Users** — Basic user listing across all roles

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  TypeScript · Tailwind CSS · Framer Motion · Zustand Store   │
│  Port 3000 (CRA dev/serve)                                   │
├─────────────────────────────────────────────────────────────┤
│                     FastAPI Backend                           │
│  simple_unified_server.py · Port 8000                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Blueprint │ │  Quotes  │ │ Messaging│ │   RSVP   │       │
│  │   APIs    │ │   APIs   │ │   APIs   │ │   APIs   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Vendor   │ │ Timeline │ │  Admin   │ │  AI/Chat │       │
│  │   APIs   │ │   APIs   │ │   APIs   │ │   APIs   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│                      AI Layer                                │
│  Gemini 2.0 Flash (primary) · Ollama GLM4 (fallback)        │
│  Claude Haiku 4.5 (vendor analysis) · CrewAI orchestration   │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│  NocoDB (vendors, preferences) · In-memory stores            │
│  (blueprints, quotes, conversations, RSVP)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- API keys: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` (set in environment or `.env`)

### 1. Backend
```bash
cd /path/to/shehnai-local
pip install fastapi uvicorn httpx google-generativeai anthropic
python simple_unified_server.py
# Server starts on http://localhost:8000
# 60 seed vendors (Bangalore + Mumbai) auto-loaded on startup
```

### 2. Frontend
```bash
cd react-frontend
npm install
npm run build && npx serve -s build -l 3000
# App opens on http://localhost:3000
```

### 3. Access
- **Couple view**: http://localhost:3000/ (default)
- **Vendor view**: Switch role in sidebar footer (Dev role switcher)
- **Admin view**: Switch to "Admin" in sidebar footer
- **Public RSVP**: http://localhost:3000/rsvp/:inviteCode (no login required)

---

## Project Structure

```
shehnai-local/
├── simple_unified_server.py          # All backend APIs (FastAPI, ~4000 lines)
├── react-frontend/
│   ├── src/
│   │   ├── App.tsx                   # Role-based routing (couple/vendor/admin)
│   │   ├── store/useAppStore.ts      # Zustand global state
│   │   ├── types/marketplace.ts      # TypeScript interfaces
│   │   ├── config/
│   │   │   └── api_config.ts         # API_BASE + auth headers
│   │   ├── pages/
│   │   │   ├── Index.tsx             # Couple dashboard
│   │   │   ├── SmartPlanner.tsx      # AI chat planner with intent detection
│   │   │   ├── WeddingPreferences.tsx# Preferences form
│   │   │   ├── BlueprintReview.tsx   # View/edit/publish blueprint
│   │   │   ├── Quotes.tsx            # Incoming vendor quotes
│   │   │   ├── Messages.tsx          # Two-panel messaging
│   │   │   ├── VendorDiscovery.tsx   # Browse vendors
│   │   │   ├── BudgetManagement.tsx  # Budget tracker
│   │   │   ├── WeddingInvites.tsx    # Events + RSVP links + tracker
│   │   │   ├── PublicRSVP.tsx        # Guest-facing RSVP (no auth)
│   │   │   ├── vendor/
│   │   │   │   ├── VendorRegister.tsx
│   │   │   │   ├── VendorDashboard.tsx
│   │   │   │   ├── VendorMarketplace.tsx
│   │   │   │   ├── VendorProfile.tsx
│   │   │   │   └── VendorInbox.tsx
│   │   │   └── admin/
│   │   │       ├── VendorApprovals.tsx
│   │   │       └── UserList.tsx
│   │   ├── components/
│   │   │   ├── AnimatedSidebar.tsx    # Role-based nav + dev role switcher
│   │   │   ├── WeddingBlueprint.tsx   # Blueprint display component
│   │   │   ├── ConversationList.tsx   # Reusable chat list (couple + vendor)
│   │   │   ├── MessageThread.tsx      # Reusable message thread
│   │   │   ├── QuoteCard.tsx          # Vendor quote display
│   │   │   ├── QuoteFormModal.tsx     # Category-specific quote form
│   │   │   ├── WeddingCalendar.tsx    # Timeline calendar
│   │   │   └── ...
│   │   └── services/
│   │       ├── blueprint_service.ts   # Blueprint CRUD + publish
│   │       ├── quote_service.ts       # Quote CRUD + status
│   │       ├── messaging_service.ts   # Conversations + messages
│   │       ├── rsvp_service.ts        # Events + invites + RSVP
│   │       ├── timeline_service.ts    # Timeline CRUD + AI generate
│   │       ├── vendor_service.ts      # Registration + profile + marketplace
│   │       ├── admin_service.ts       # Vendor approval + users
│   │       └── vendor_discovery_service.ts
│   └── tailwind.config.js
├── config/api_config.py               # Backend config (NocoDB, API keys)
├── scripts/
│   ├── setup_tables.py                # NocoDB table creation
│   └── seed_vendors.py                # Seed vendor data
└── PRD/                               # Product requirements document
```

---

## Vendor Categories & Pricing

The platform supports 6 vendor categories, each with structured pricing:

| Category | Pricing Unit | Example Range |
|----------|-------------|---------------|
| **Venue** | Per plate (₹/person) | ₹2,500 – ₹6,000/plate |
| **Photography** | Per day/event | ₹50K – ₹4L/day |
| **Catering** | Per plate (when separate from venue) | ₹500 – ₹7,000/plate |
| **Decoration** | Per function/event | ₹10K – ₹8L/function |
| **Makeup & Beauty** | Per look/function | ₹10K – ₹50K/look |
| **Entertainment** | Per event/night | ₹20K – ₹5L/event |

Quotes include category-specific fields (e.g., drone coverage for photography, live counters for catering). The backend auto-calculates `total_estimated_price` from unit pricing x couple's requirements for apples-to-apples comparison.

---

## Agentic AI Architecture

### CrewAI Multi-Agent Orchestration

Shehn.AI uses **15 specialized AI agents** organized into **3 crews** for wedding blueprint generation:

| Crew | Agents | Purpose |
|------|--------|---------|
| **Research Crew** | Venue Scout, Catering Analyst, Photo/Video Strategist, Decor Planner, Entertainment Curator | Market research across all 6 vendor categories |
| **Planning Crew** | Budget Optimizer, Timeline Architect, Vendor Matcher, Guest Logistics, Culture Specialist | Budget allocation, scheduling, ritual integration |
| **Content Crew** | Blueprint Writer, Cost Analyzer, Communication Drafter, Quality Reviewer, Summary Generator | Final document assembly and quality assurance |

### Orchestration Patterns
- **Sequential**: Research → Planning → Content (full blueprint generation)
- **Parallel + Sequential**: 5 research agents run concurrently, then feed into planning
- **Self-Correction**: Quality Reviewer can trigger re-generation on inconsistencies
- **Two-Agent Collaboration**: Budget Optimizer + Cost Analyzer iterate together

### 4-Tier AI Fallback
| Tier | Engine | Use Case |
|------|--------|----------|
| 1 | CrewAI + Gemini | Multi-agent orchestration (primary) |
| 2 | Gemini Direct | Single-model generation (fallback) |
| 3 | Ollama Local | On-device LLM (offline fallback) |
| 4 | Deterministic | Rule-based templates (guaranteed) |

---

## AI Features

### Smart Planner Chat (`/plan`)
- **Hybrid intent detection**: Messages with 2+ wedding details (city, budget, guests, theme) route to Gemini for holistic planning. Single-field changes (e.g., "change city to Delhi") handled locally
- **Silent detail extraction**: Natural language like "60L budget boho wedding in Mumbai" automatically updates the blueprint store
- **Cultural event suggestions**: Supports Marathi, Punjabi, South Indian, Bengali, Gujarati, Muslim, Rajasthani, North Indian wedding traditions with priority tiers (essential/recommended/optional)
- **Interactive widgets**: Event checklists, budget inputs, and confirmation cards rendered inline in chat

### Blueprint Generation (`/api/ai/generate-blueprint`)
- City-tier pricing (metro/tier2/tier3) based on real market data
- Dynamic budget allocation: catering computed first (scales with guests), remainder distributed by category
- Gemini generates city+theme-specific insider tips
- Cost-saving tips calculated from actual numbers (e.g., "reducing by 50 guests saves ₹X")

### Vendor AI Tools
- **Quote analysis**: AI evaluates quotes against budget and market rates
- **Vendor matching**: Scores vendors against blueprint requirements
- **Budget optimization**: Suggests reallocation across categories
- **Message drafting**: AI-assisted vendor inquiries, negotiations, booking confirmations

---

## API Reference

### Blueprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blueprints` | Create blueprint |
| GET | `/api/blueprints/:id` | Get blueprint (filtered view for vendors) |
| PUT | `/api/blueprints/:id` | Update blueprint |
| PATCH | `/api/blueprints/:id/publish` | Publish to marketplace |
| PATCH | `/api/blueprints/:id/unpublish` | Unpublish |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blueprints/:id/quotes` | Submit quote (vendor) |
| GET | `/api/blueprints/:id/quotes` | List quotes (couple) |
| GET | `/api/blueprints/:id/quotes/count` | Bid count (public) |
| PATCH | `/api/quotes/:id/status` | Shortlist/accept/reject |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversations` | Start thread |
| GET | `/api/conversations` | List threads (by couple_id or vendor_id) |
| GET | `/api/conversations/:id` | Full thread with messages |
| POST | `/api/conversations/:id/messages` | Send message |

### RSVP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Create wedding event |
| POST | `/api/rsvp-invites` | Generate shareable RSVP link |
| GET | `/api/rsvp/:code` | Public: get event details |
| POST | `/api/rsvp/:code` | Public: submit RSVP |
| GET | `/api/rsvp-responses` | Get all responses (couple) |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace` | Published blueprints (filtered by vendor category) |

### Vendor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors/register` | Register (pending approval) |
| GET | `/api/vendor-profile/:id` | Get profile |
| PUT | `/api/vendor-profile/:id` | Update profile |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/vendors` | List vendors by status |
| PATCH | `/api/admin/vendors/:id/approve` | Approve vendor |
| PATCH | `/api/admin/vendors/:id/reject` | Reject with reason |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat assistant (Gemini -> Ollama -> fallback) |
| POST | `/api/ai/generate-blueprint` | Generate full wedding blueprint |
| POST | `/api/ai/plan-wedding` | CrewAI orchestrated planning |
| POST | `/api/ai/suggest-events` | Cultural event suggestions |
| POST | `/api/ai/analyze-quote` | AI quote analysis |
| POST | `/api/ai/match-vendors` | Vendor-blueprint matching |
| POST | `/api/ai/optimize-budget` | Budget reallocation suggestions |

---

## Pre-Auth Role System

Authentication is not yet implemented. The platform uses header-based role switching:

- All requests include `X-User-Role` (`couple` | `vendor` | `superadmin`) and `X-User-Id` headers
- The sidebar has a dev role switcher to toggle between roles
- Default: Couple (ID=1), Vendor (ID=11, Ashirwad Caterers Bangalore), Admin (ID=99)

---

## Seed Data

On server startup, 60 vendors are auto-loaded across 6 categories:

- **Bangalore** (30 vendors): 5 per category — venue, photography, catering, decoration, makeup, entertainment
- **Mumbai** (30 vendors): 5 per category

All seed vendors are pre-approved and have realistic Indian wedding business profiles with ratings, specialties, and price tiers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Backend | Python FastAPI, Uvicorn |
| AI | Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, Ollama (local fallback) |
| Database | NocoDB (vendor data), In-memory stores (blueprints, quotes, messages) |
| Orchestration | CrewAI (15 agents, 3 crews, 4 orchestration patterns) |

---

## Testing

```bash
cd react-frontend
npm test                    # Run Jest + React Testing Library tests
npm test -- --coverage      # With coverage report
```

Test suites cover: BlueprintReview, Quotes, Messages, PublicRSVP, WeddingInvites, VendorScreens, AIChat.
