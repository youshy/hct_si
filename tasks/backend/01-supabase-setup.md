# Task: Supabase Client Setup

## Overview
Set up the Supabase client and database schema for the backend. This provides the PostgreSQL database and real-time capabilities for the deal tracker.

## Required Outcome
- Supabase project created with proper schema
- Database tables for deals and notes
- Supabase client configured for serverless functions
- CORS and response helpers ready

## Prerequisites
- Supabase account created (free tier works)
- Backend project initialized (Vercel/Cloudflare)
- Environment variables configured

## Time Estimate
Hour 1-2 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon public key: `eyJhbGc...`

### Step 2: Run Database Schema
Go to SQL Editor in Supabase dashboard and run:

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

-- Indexes for performance
CREATE INDEX idx_notes_deal_id ON notes(deal_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_updated_at ON deals(updated_at);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- For hackathon: allow all operations (no auth)
CREATE POLICY "Allow all on deals" ON deals FOR ALL USING (true);
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true);
```

### Step 3: Set Environment Variables

**For Vercel:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

**For Cloudflare Workers:**
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

**Local `.env` file:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 5: Create Supabase Client Module

**File:** `src/lib/supabase.ts` (or `api/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 6: Create TypeScript Types

**File:** `src/lib/types.ts`

```typescript
export interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: 'price' | 'timing' | 'competitor' | 'fit' | 'other' | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  deal_id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
}

// For database inserts (without id and timestamps)
export interface NewDeal {
  name: string;
  value: number;
}

export interface NewNote {
  deal_id: string;
  content: string;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
}
```

### Step 7: Create Response Helpers

**File:** `src/lib/api-helpers.ts`

```typescript
// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Standard JSON response
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Error response
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// Handle OPTIONS preflight
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
```

---

## Vercel Edge Function Setup

**File structure:**
```
api/
├── lib/
│   ├── supabase.ts
│   ├── types.ts
│   └── api-helpers.ts
├── deals/
│   ├── index.ts        # GET, POST
│   └── [id].ts         # PUT, DELETE
├── notes/
│   ├── index.ts        # POST
│   └── [dealId].ts     # GET
├── sentiment.ts        # POST
└── sync.ts             # POST
```

### Step 8: Test Connection

Create a simple health check endpoint:

**File:** `api/health.ts`

```typescript
import { supabase } from './lib/supabase';
import { jsonResponse, errorResponse } from './lib/api-helpers';

export default async function handler(req: Request) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('count')
      .limit(1);

    if (error) throw error;

    return jsonResponse({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return errorResponse('Database connection failed', 503);
  }
}
```

---

## Acceptance Criteria

- [ ] Supabase project created
- [ ] Database schema deployed (deals + notes tables)
- [ ] Indexes created for performance
- [ ] Row Level Security enabled with permissive policies
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Supabase client module exports working client
- [ ] TypeScript types defined for Deal and Note
- [ ] CORS headers helper working
- [ ] JSON response helpers working
- [ ] Health check endpoint returns "healthy"

---

## AI Prompt for Claude

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

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check SUPABASE_ANON_KEY is correct |
| CORS errors | Ensure corsHeaders are in all responses |
| Connection refused | Check SUPABASE_URL format (https://xxxxx.supabase.co) |
| Table doesn't exist | Run the SQL schema in Supabase dashboard |
| RLS blocking requests | Add permissive policies or disable RLS for hackathon |

---

## Quick Verification

```bash
# Test the health endpoint
curl https://your-api.vercel.app/api/health

# Expected response:
# {"status":"healthy","database":"connected","timestamp":"..."}
```
