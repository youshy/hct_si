# Sales Deal Tracker

[SpotOn 2025 Hackathon Submission] Track sales deals, analyze sentiment, and understand why you're losing deals.

Created by: @youshy @Saniewski

## Features

- 📱 **Offline-first PWA** - Works without internet, syncs when connected
- 💬 **AI Sentiment Analysis** - Automatically analyze deal notes with Google Gemini
- 📊 **Deal Pipeline** - Track deals through stages (lead → won/lost)
- 🔍 **Loss Insights** - Understand why deals are being lost

## Quick Start

### Frontend

```bash
cd frontend/hackathon-sales-intelligence
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend (Local Development)

```bash
cd backend
npm install
vercel dev
```

API available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
hackathon-sales-intelligence/
├── frontend/
│   └── hackathon-sales-intelligence/   # React + Vite + Tailwind
│       ├── src/
│       │   ├── components/             # UI components
│       │   ├── lib/
│       │   │   ├── db/                 # IndexedDB (Dexie)
│       │   │   ├── api/                # API client
│       │   │   └── utils/              # Utilities
│       │   └── App.tsx
│       └── package.json
├── backend/                            # Vercel Edge Functions
│   ├── api/
│   │   ├── lib/                        # Shared utilities
│   │   ├── deals/                      # Deal CRUD endpoints
│   │   ├── notes/                      # Notes endpoints
│   │   ├── sentiment.ts                # AI sentiment analysis
│   │   └── sync.ts                     # Offline sync
│   └── package.json
└── tasks/                              # Task documentation
```

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
GEMINI_API_KEY=your-gemini-key
```

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Dexie (IndexedDB)
- **Backend:** Vercel Edge Functions, Supabase (PostgreSQL)
- **AI:** Google Gemini 2.5 Flash

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deals` | GET | List all deals |
| `/api/deals` | POST | Create a new deal |
| `/api/deals/[id]` | GET | Get deal by ID |
| `/api/deals/[id]` | PUT | Update deal |
| `/api/deals/[id]` | DELETE | Delete deal |
| `/api/notes` | POST | Create a note |
| `/api/notes/[dealId]` | GET | Get notes for deal |
| `/api/sentiment` | POST | Analyze text sentiment |
| `/api/sync` | POST | Sync offline changes |
| `/api/health` | GET | Health check |

## Deployment

### Production URLs

After deployment to Vercel:
- **Frontend:** `https://hackathon-sales-intelligence.vercel.app`
- **API Base:** `https://hackathon-sales-intelligence.vercel.app/api`

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Set these in Vercel Dashboard (Project Settings > Environment Variables):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google Gemini API key |

## License

MIT
# hct_si
