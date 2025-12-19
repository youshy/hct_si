# Sales Deal Tracker - 1-Day Hackathon Work Plan

## Overview
Aggressive 1-day plan leveraging AI tools (Claude) to ship a working POC.

**Duration:** ~8-10 hours
**Philosophy:** Ship ugly but functional. Polish is the enemy of done.

---

## Scope for 1 Day

### IN SCOPE (Must Have)
- Deal creation (name + value)
- Deal list view
- Quick notes on deals
- **Sentiment analysis on notes** (simple: positive/neutral/negative)
- Mark as Lost with reason (quick-select only)
- Loss dashboard with **at-risk deals indicator**
- Local storage (IndexedDB)
- Basic sync to backend
- Deployed to production URL

### DEFERRED
- ~~Mark as Won flow~~ → Simple button, no detail
- ~~Offline indicator~~ → Skip
- ~~PWA install prompt~~ → Works in browser only
- ~~Sentiment trending over time~~ → Just show latest

---

## Sentiment Strategy (Minimal Viable)

**Approach:** Synchronous API call on note save (not queued)

```
User adds note → POST /api/sentiment → Gemini returns score → Save to DB → Show indicator
```

| Sentiment | Score Range | UI |
|-----------|-------------|-----|
| Positive | > 0.3 | Green dot |
| Neutral | -0.3 to 0.3 | Gray dot |
| Negative | < -0.3 | Red dot |

**At-Risk Deal:** Any deal with a negative sentiment note in last entry

---

## Timeline (Single Day)

```
Hour 0-1:   🏗️  FOUNDATION (All hands)
Hour 1-4:   ⚡  PARALLEL BUILD (Split by domain)
Hour 4-5:   🔗  INTEGRATION (Connect frontend ↔ backend)
Hour 5-7:   🎯  FEATURE COMPLETE (Loss flow + Sentiment + Dashboard)
Hour 7-8:   🐛  BUG BASH + DEMO PREP
Hour 8:     🚀  DEMO
```

---

## Hour 0-1: Foundation (Everyone Together)

| Task | Who | Time |
|------|-----|------|
| Create GitHub repo | DevOps | 5 min |
| Init frontend (Vite + Svelte/React) | Frontend | 10 min |
| Init backend (Vercel/Cloudflare) | Backend | 10 min |
| Create Supabase project + run schema | Backend | 15 min |
| Set up Gemini API key in env | Backend | 5 min |
| Deploy empty shells to prod URLs | DevOps | 15 min |
| Agree on API contract (see below) | All | 5 min |

**Exit:** Two live URLs (frontend + API health check working)

---

## Hour 1-5: Parallel Build

### Frontend Track
| Hour | Task | AI Assist |
|------|------|-----------|
| 1-2 | IndexedDB setup (deals + notes) | Prompt #1 |
| 2-3 | Deal list + Create modal | Prompt #2 |
| 3-4 | Notes UI + Sentiment indicator | Prompt #3 |
| 4-5 | Loss flow + Dashboard | Prompt #4, #5 |

### Backend Track
| Hour | Task | AI Assist |
|------|------|-----------|
| 1-2 | Database schema + Supabase client | Prompt #6 |
| 2-3 | CRUD endpoints (deals + notes) | Prompt #7 |
| 3-4 | **Sentiment endpoint (Gemini)** | Prompt #8 |
| 4-5 | Sync endpoint + Deploy | Prompt #9 |

### DevOps Track
| Hour | Task |
|------|------|
| 1-2 | CI/CD pipeline (auto-deploy on push) |
| 2-3 | Environment variables (Supabase + Gemini keys) |
| 3-5 | Support frontend/backend, fix deploy issues |

---

## Hour 5-7: Integration & Features

| Task | Who |
|------|-----|
| Connect frontend sync to backend | Frontend + Backend |
| Wire up sentiment API to notes | Frontend + Backend |
| Test full flow: create → note → sentiment → lose → dashboard | All |
| Fix bugs | All |

---

## Hour 7-8: Bug Bash & Demo

- Everyone tests on their phone
- Fix show-stopper bugs only
- Prepare 2-minute demo script
- Take screenshots for presentation

---

## Minimal API Contract

```typescript
// Deals
POST   /api/deals          { name: string, value: number }
GET    /api/deals          → Deal[]
PUT    /api/deals/:id      { status?, loss_reason?, ... }

// Notes
POST   /api/notes          { deal_id: string, content: string }
GET    /api/notes/:dealId  → Note[]

// Sentiment (called when creating note)
POST   /api/sentiment      { text: string }
→ { score: number, label: 'positive' | 'neutral' | 'negative' }

// Sync
POST   /api/sync
{ lastSync: timestamp, changes: { deals: Deal[], notes: Note[] } }
→ { serverTime: timestamp, updates: { deals: Deal[], notes: Note[] } }
```

---

## Database Schema (Copy-Paste to Supabase)

```sql
-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  loss_reason TEXT CHECK (loss_reason IN ('price', 'timing', 'competitor', 'fit', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table with sentiment
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sentiment_score DECIMAL,  -- -1 to 1
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_notes_deal_id ON notes(deal_id);
CREATE INDEX idx_deals_status ON deals(status);
```

---

## AI Prompts for Speed

### Prompt #1: Frontend - IndexedDB Setup (with Notes)
```
Create a Dexie.js database setup for a deals tracking app using TypeScript.

Schema:
- deals table: id (string), name (string), value (number), status ('open'|'won'|'lost'), loss_reason (string|null), created_at (Date), updated_at (Date), synced (boolean)
- notes table: id (string), deal_id (string), content (string), sentiment_score (number|null), sentiment_label ('positive'|'neutral'|'negative'|null), created_at (Date), synced (boolean)

Include:
- Database class with typed tables
- Helper functions for deals: addDeal, updateDeal, getDeals, getUnsyncedDeals
- Helper functions for notes: addNote, getNotesByDeal, getUnsyncedNotes
- markSynced function for both tables
- Use UUIDs for IDs (crypto.randomUUID())

Keep it simple, no over-engineering.
```

### Prompt #2: Frontend - Deal List Component
```
Create a [Svelte/React] component for a deal list with these requirements:

- Fetches deals from Dexie.js (assume db.deals.toArray() exists)
- Shows each deal as a card: name, value (formatted as currency), status badge
- Show a small colored dot if deal has notes with sentiment:
  - Green dot = latest note is positive
  - Gray dot = latest note is neutral
  - Red dot = latest note is negative (AT RISK)
- Floating action button (bottom right) to add new deal
- Clicking a deal opens action menu: "Add Note", "Mark Won", "Mark Lost"
- Use Tailwind CSS
- Mobile-first, thumb-friendly (large touch targets)
- Include the AddDealModal component inline (name + value fields only)

Keep it minimal - no animations, no fancy stuff.
```

### Prompt #3: Frontend - Notes with Sentiment
```
Create a [Svelte/React] component for adding and viewing notes on a deal.

Requirements:
- Modal or slide-up panel showing notes for a deal
- List existing notes with:
  - Note content
  - Timestamp
  - Sentiment indicator (colored dot: green/gray/red)
- Text input at bottom to add new note
- On submit:
  1. Call POST /api/sentiment with note text
  2. Save note to IndexedDB with returned sentiment
  3. Display immediately with sentiment indicator
- Show "analyzing..." briefly while sentiment API runs
- Tailwind CSS, mobile-first

Keep the UI simple - just a list and input.
```

### Prompt #4: Frontend - Loss Reason Modal
```
Create a [Svelte/React] modal component for capturing loss reasons.

Requirements:
- Shows when user clicks "Mark Lost" on a deal
- 5 quick-select buttons in a grid: Price, Timing, Competitor, Bad Fit, Other
- Tapping a reason immediately closes modal and updates deal
- Large buttons (easy to tap on mobile)
- Call updateDeal(id, { status: 'lost', loss_reason: selected }) on selection
- Tailwind CSS, mobile-first

No free-text field for now. Keep it to one tap.
```

### Prompt #5: Frontend - Loss Dashboard with At-Risk
```
Create a [Svelte/React] dashboard component showing loss analytics and at-risk deals.

Data source: Dexie.js deals and notes tables

Display:
1. **At-Risk Deals** (TOP PRIORITY - show first)
   - List deals where latest note has negative sentiment
   - Show deal name, value, and the negative note preview
   - Red styling to draw attention

2. **Loss Summary**
   - Total deals lost (count)
   - Total value lost (sum, formatted as currency)

3. **Loss Reasons Breakdown**
   - Price: X deals ($Y value)
   - Timing: X deals ($Y value)
   - Competitor: X deals ($Y value)
   - Bad Fit: X deals ($Y value)
   - Other: X deals ($Y value)
   - Use simple CSS bars for visualization

4. Win/Loss ratio (small text, de-emphasized)

Use Tailwind CSS. No charting library - CSS bars are fine.
```

### Prompt #6: Backend - Supabase Client Setup
```
Create a serverless function (Vercel Edge or Cloudflare Worker) setup with Supabase client.

Include:
- Supabase client initialization with env variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- TypeScript types:
  - Deal: id, name, value, status, loss_reason, created_at, updated_at
  - Note: id, deal_id, content, sentiment_score, sentiment_label, created_at
- CORS headers helper for all responses
- Error response helper
- JSON response helper

Keep it minimal, just the foundation.
```

### Prompt #7: Backend - CRUD Endpoints
```
Create serverless API endpoints for deals and notes CRUD using Supabase.

Endpoints needed:
- GET /api/deals - list all deals, ordered by created_at desc
- POST /api/deals - create deal (body: { name, value })
- PUT /api/deals/[id] - update deal (body: partial deal object)
- DELETE /api/deals/[id] - delete deal
- GET /api/notes/[dealId] - get notes for a deal
- POST /api/notes - create note (body: { deal_id, content, sentiment_score, sentiment_label })

Use the Supabase client. Include proper error handling.
Return JSON responses with appropriate status codes.

[Vercel Edge Functions / Cloudflare Workers] style.
```

### Prompt #8: Backend - Sentiment Endpoint (Gemini)
```
Create a serverless endpoint that analyzes text sentiment using Google Gemini.

POST /api/sentiment
Request: { text: string }
Response: { score: number, label: 'positive' | 'neutral' | 'negative' }

Implementation:
- Use Gemini API (gemini-2.5-flash for speed/cost)
- Simple prompt: "Analyze the sentiment of this sales note. Return JSON with 'score' (-1 to 1) and 'label' (positive/neutral/negative). Note: {text}"
- Parse the JSON response
- Handle errors gracefully (return neutral on failure)

Environment: GEMINI_API_KEY

Keep it simple - no retries, no caching. Just works.

[Vercel Edge Functions / Cloudflare Workers] style.
```

### Prompt #9: Backend - Sync Endpoint
```
Create a sync endpoint for offline-first sync with last-write-wins strategy.

POST /api/sync
Request body:
{
  lastSync: ISO timestamp (or null for first sync),
  changes: {
    deals: Deal[],
    notes: Note[]
  }
}

Logic:
1. Upsert all incoming deals (use updated_at for conflict resolution)
2. Insert all incoming notes (notes are append-only, no conflicts)
3. Fetch all deals updated after lastSync timestamp
4. Fetch all notes created after lastSync timestamp
5. Return { serverTime: now, updates: { deals: [...], notes: [...] } }

Use Supabase. Handle the case where lastSync is null (return all data).
Keep it simple - no queuing, no batching.
```

### Prompt #10: Full Stack - Sync Hook with Notes
```
Create a [React hook / Svelte store] that handles background sync for deals and notes.

Requirements:
- On mount: attempt sync if online
- Sync function:
  1. Get unsynced deals and notes from IndexedDB
  2. POST to /api/sync with all changes
  3. Apply server updates to IndexedDB (deals and notes)
  4. Mark local items as synced
- Retry on failure (simple setTimeout, 30 sec)
- Expose: { isSyncing, lastSyncTime, syncNow }

Use fetch. Don't overcomplicate error handling for hackathon.
```

---

## Emergency Fallbacks

| If This Breaks... | Do This Instead |
|-------------------|-----------------|
| Gemini API slow/down | Return mock sentiment (random or always neutral) |
| Supabase down | Use local storage only, demo offline mode |
| Sync too complex | Skip sync, demo local-only with sentiment still working |
| Deploy failing | Run locally, share screen |
| Running out of time | Cut dashboard details, show deal list + notes + sentiment only |

---

## Definition of Done (1-Day POC)

- [ ] Live URL accessible
- [x] Can create a deal ✅ (Frontend 02)
- [x] Can add note to deal ✅ (Frontend 03)
- [x] **Note shows sentiment indicator (green/gray/red)** ✅ (Frontend 03)
- [x] Can mark deal as lost with reason ✅ (Frontend 04)
- [x] **Dashboard shows at-risk deals** ✅ (Frontend 05)
- [x] Loss dashboard shows breakdown ✅ (Frontend 05)
- [x] Data persists (local or synced) ✅ (Frontend 01, 06)
- [ ] Works on mobile browser

**Frontend Complete! Backend integration pending.**

---

## Demo Script (2 minutes)

1. **Problem:** "Salespeople don't log why deals are lost. And they don't notice when deals are going south until it's too late."

2. **Create deal:** Open app on phone → "Acme Corp $50k" (show speed: < 10 sec)

3. **Add positive note:** "Great initial call, they love the product" → **Green dot appears**

4. **Add negative note:** "Budget got cut, they're hesitant" → **Red dot appears**

5. **Show Dashboard:** "Look - Acme is now flagged as AT RISK. We caught it early."

6. **Mark another deal Lost:** Tap "Competitor" → one tap done

7. **Show Loss Dashboard:** "Price and Competitor are our top loss reasons. Now we know where to focus."

8. **Close:** "8 hours to build. Imagine the patterns we'll find at scale."
