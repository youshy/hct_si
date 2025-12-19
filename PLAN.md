# Sales Deal Tracker - Proof of Concept Plan (Revised v2)

## Problem Statement
Salespeople lose deals but rarely capture why in the moment. This knowledge disappears, preventing teams from identifying patterns and fixing systemic issues.

**Primary Focus: Understanding why deals are lost.**

---

## PoC Objectives
1. **Validate** that salespeople will log loss reasons when friction is minimal
2. **Test** whether sentiment detection reveals deal health before loss
3. **Learn** the most common loss patterns worth addressing

---

## Core Architecture: Offline-First

### Principle
**The app works instantly, always. Network is a background concern.**

| Behavior | Implementation |
|----------|----------------|
| App loads instantly | All UI/data from local storage first |
| Writes never block | Save locally, sync in background |
| Network optional | Full functionality offline |
| Eventually consistent | Queued sync when connectivity returns |

---

## Core Features (PoC Scope Only)

### 1. Ultra-Fast Deal Entry
- Single-screen deal creation: name + value only
- Default status: "open" (no extra taps)
- Saved to local storage immediately
- Target: **< 10 seconds** to log a new deal

### 2. Quick Notes (On-the-Fly)
- One-tap to add note from deal list (no drill-down required)
- Auto-timestamp, no other required fields
- Stored locally, queued for sync

### 3. Loss Capture Flow
- "Mark as Lost" triggers mandatory **loss reason** prompt
- Pre-set quick-select options (price, timing, competitor, fit, other)
- Optional free-text for detail
- Win tracking exists but is secondary (simple "Mark as Won" with optional note)

### 4. Loss Dashboard
- Total lost deals + total value lost
- Loss reasons breakdown (simple count per category)
- Win/lose ratio shown but **de-emphasized**
- Dashboard renders from local data (no network dependency)

### 5. Sentiment Analysis (Background)
- Notes queued for sentiment processing when online
- API processes queue, writes results back to local store on next sync
- UI shows "pending" indicator until sentiment returns
- Flag deals with declining sentiment trend (early warning)

---

## Sync & Queue Architecture

```
┌─────────────────────────────────────────────────────┐
│                   LOCAL DEVICE                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────┐  │
│  │  Local DB   │───▶│  Sync Queue │───▶│ UI Layer│  │
│  │ (IndexedDB) │◀───│  (outbound) │    └─────────┘  │
│  └─────────────┘    └──────┬──────┘                  │
└────────────────────────────┼────────────────────────┘
                             │ when online
                             ▼
┌─────────────────────────────────────────────────────┐
│                     BACKEND                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────┐  │
│  │  Cloud DB   │◀───│  Sync API   │◀───│Sentiment│  │
│  │             │───▶│             │───▶│  Queue  │  │
│  └─────────────┘    └─────────────┘    └─────────┘  │
└─────────────────────────────────────────────────────┘
```

### Sync Rules
- **Writes**: Immediate to local → queued for server
- **Reads**: Always from local (server sync updates local in background)
- **Conflicts**: Last-write-wins (acceptable for PoC)
- **Sentiment**: Processed server-side, results pulled on next sync

---

## Out of Scope (Deferred to MVP)
- Detailed win analysis
- User authentication / teams
- CRM integrations
- Advanced analytics / filtering
- Native mobile app (PWA only)
- Export / reporting
- Conflict resolution beyond last-write-wins
- Voice-to-text

---

## Design Principles for Lightweight UX

| Principle | Implementation |
|-----------|----------------|
| Zero wait | UI never blocks on network |
| Minimal taps | Every core action ≤ 2 taps |
| No required fields | Only deal name is mandatory |
| Instant load | Service worker + cached shell |
| Works offline | Full CRUD without connectivity |
| Thumb-friendly | Large touch targets, bottom-anchored actions |

---

## Success Criteria for PoC

| Metric | Target |
|--------|--------|
| App usable after first load | < 1 second (from cache) |
| Log a deal | < 10 seconds |
| Add a note | < 15 seconds |
| Mark lost + reason | < 20 seconds |
| Loss reason capture rate | > 80% of lost deals |
| Offline functionality | 100% feature parity |
| Sentiment processing | Within 5 min of coming online |

---

## Technical Approach

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | PWA (Preact or Svelte) | Small bundle, fast load |
| Local storage | IndexedDB (via Dexie.js) | Structured data, offline persistence |
| Sync | Background Sync API + polling fallback | Reliable queue processing |
| Backend | Serverless (Cloudflare Workers or Vercel Edge) | Low latency, scales to zero |
| Database | Supabase or PlanetScale | Simple, managed, good free tier |
| Sentiment | Queued Lambda/Worker → Google Gemini or AWS Comprehend | Async, non-blocking |

---

## Key Questions to Answer with PoC
1. Will salespeople capture loss reasons when it's instant?
2. Does offline-first actually change usage patterns?
3. Can we predict "at-risk" deals from note sentiment?
4. What loss patterns emerge across deals?
5. Is quick-select sufficient or do they need free-text?
