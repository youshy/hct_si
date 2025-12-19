# Task Files - Sales Deal Tracker Hackathon

This folder contains detailed task specifications for each component of the Sales Deal Tracker. Each file can be given to a developer or fed into Claude to understand and implement the required work.

## Folder Structure

```
tasks/
├── README.md (this file)
├── frontend/           # Frontend UI components
├── backend/            # API endpoints & database
├── devops/             # Infrastructure & deployment
└── integration/        # Connecting everything together
```

---

## Task Overview by Domain

### Frontend (6 Tasks) ✅ COMPLETE
| # | Task | Description | Depends On | Status |
|---|------|-------------|------------|--------|
| 01 | [IndexedDB Setup](frontend/01-indexeddb-setup.md) | Local database with Dexie.js | - | ✅ Done |
| 02 | [Deal List Component](frontend/02-deal-list-component.md) | Main deal view with FAB | 01 | ✅ Done |
| 03 | [Notes with Sentiment](frontend/03-notes-with-sentiment.md) | Note entry + sentiment display | 01, 02 | ✅ Done |
| 04 | [Loss Reason Modal](frontend/04-loss-reason-modal.md) | Quick-select loss reasons | 01, 02 | ✅ Done |
| 05 | [Dashboard](frontend/05-dashboard.md) | At-risk deals + loss analytics | 01, 03, 04 | ✅ Done |
| 06 | [Sync Hook](frontend/06-sync-hook.md) | Background sync to backend | 01, Backend 04 | ✅ Done |

### Backend (4 Tasks)
| # | Task | Description | Depends On |
|---|------|-------------|------------|
| 01 | [Supabase Setup](backend/01-supabase-setup.md) | Database + client config | - |
| 02 | [CRUD Endpoints](backend/02-crud-endpoints.md) | Deals & Notes API | 01 |
| 03 | [Sentiment Endpoint](backend/03-sentiment-endpoint.md) | Gemini integration | 01 |
| 04 | [Sync Endpoint](backend/04-sync-endpoint.md) | Offline-first sync | 01, 02 |

### DevOps (3 Tasks)
| # | Task | Description | Depends On |
|---|------|-------------|------------|
| 01 | [Project Setup](devops/01-project-setup.md) | GitHub repo + scaffolding | - |
| 02 | [CI/CD Pipeline](devops/02-ci-cd-pipeline.md) | Auto-deploy on push | 01 |
| 03 | [Environment Variables](devops/03-environment-variables.md) | Secrets configuration | 01, 02 |

### Integration (3 Tasks)
| # | Task | Description | Depends On |
|---|------|-------------|------------|
| 01 | [Frontend-Backend Sync](integration/01-frontend-backend-sync.md) | Wire up sync | Frontend 06, Backend 04 |
| 02 | [Sentiment API Wiring](integration/02-sentiment-api-wiring.md) | Connect notes to sentiment | Frontend 03, Backend 03 |
| 03 | [Full Flow Testing](integration/03-full-flow-testing.md) | End-to-end testing | All |

---

## Timeline Mapping

```
Hour 0-1:   DevOps 01, Backend 01
Hour 1-2:   Frontend 01, Backend 01
Hour 2-3:   Frontend 02, Backend 02
Hour 3-4:   Frontend 03, Backend 03
Hour 4-5:   Frontend 04-05, Backend 04
Hour 5-6:   Frontend 06, Integration 01-02
Hour 6-7:   Integration 03 (Testing)
Hour 7-8:   Bug fixes + Demo prep
```

---

## How to Use These Files

### For Developers
1. Read the task file for your assigned component
2. Follow the step-by-step implementation
3. Check acceptance criteria when done
4. Move to dependencies/next task

### For AI Assistance (Claude)
1. Copy the relevant task file content
2. Paste into Claude conversation
3. Ask Claude to implement based on the spec
4. Use the provided AI prompts for quick generation

### For Project Managers
1. Use task list for sprint planning
2. Track progress via acceptance criteria
3. Identify blockers from dependency chain

---

## Quick Reference

### API Contract
```
POST   /api/deals          Create deal
GET    /api/deals          List deals
PUT    /api/deals/:id      Update deal
GET    /api/notes/:dealId  Get notes
POST   /api/notes          Create note
POST   /api/sentiment      Analyze text
POST   /api/sync           Sync data
```

### Key Technologies
- **Frontend:** Vite, Svelte/React, Tailwind CSS, Dexie.js
- **Backend:** Vercel Edge Functions, Supabase, Google Gemini
- **Database:** PostgreSQL (Supabase), IndexedDB (local)

### Sentiment Thresholds
| Score | Label | Color |
|-------|-------|-------|
| > 0.3 | positive | Green |
| -0.3 to 0.3 | neutral | Gray |
| < -0.3 | negative | Red |

---

## Emergency Fallbacks

If stuck on any task, see the "Emergency Fallbacks" section in each file or fall back to:

1. **Sentiment fails:** Return neutral/mock
2. **Sync fails:** Demo local-only
3. **Deploy fails:** Run locally
4. **Out of time:** Cut dashboard details

---

## Definition of Done

The hackathon is complete when:
- [ ] Live URL accessible
- [x] Can create a deal ✅
- [x] Can add note with sentiment ✅
- [x] Can mark deal as lost ✅
- [x] Dashboard shows at-risk deals ✅
- [x] Loss breakdown visible ✅
- [ ] Works on mobile browser

**Frontend: 6/6 tasks complete** | Backend: 0/4 | DevOps: 0/3 | Integration: 0/3
