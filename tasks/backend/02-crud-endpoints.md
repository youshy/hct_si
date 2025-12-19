# Task: CRUD Endpoints for Deals and Notes

## Overview
Create RESTful API endpoints for creating, reading, updating, and deleting deals and notes. These endpoints power the frontend's data operations.

## Required Outcome
Working API endpoints:
- `GET /api/deals` - List all deals
- `POST /api/deals` - Create a deal
- `PUT /api/deals/[id]` - Update a deal
- `DELETE /api/deals/[id]` - Delete a deal
- `GET /api/notes/[dealId]` - Get notes for a deal
- `POST /api/notes` - Create a note

## Prerequisites
- Supabase setup complete (Task 01)
- TypeScript types defined
- API helpers (CORS, JSON response) ready

## Time Estimate
Hour 2-3 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Deals List Endpoint

**File:** `api/deals/index.ts`

```typescript
import { supabase } from '../lib/supabase';
import { jsonResponse, errorResponse, handleOptions } from '../lib/api-helpers';
import type { NewDeal } from '../lib/types';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // GET - List all deals
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST - Create new deal
    if (req.method === 'POST') {
      const body: NewDeal = await req.json();

      // Validate required fields
      if (!body.name || body.value === undefined) {
        return errorResponse('Name and value are required', 400);
      }

      const { data, error } = await supabase
        .from('deals')
        .insert({
          name: body.name,
          value: body.value,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error: any) {
    console.error('Deals API error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}
```

### Step 2: Deal Update/Delete Endpoint

**File:** `api/deals/[id].ts`

```typescript
import { supabase } from '../lib/supabase';
import { jsonResponse, errorResponse, handleOptions } from '../lib/api-helpers';
import type { Deal } from '../lib/types';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  // Extract ID from URL
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return errorResponse('Deal ID required', 400);
  }

  try {
    // PUT - Update deal
    if (req.method === 'PUT') {
      const body: Partial<Deal> = await req.json();

      // Only allow updating specific fields
      const allowedFields = ['name', 'value', 'status', 'loss_reason'];
      const updates: Record<string, any> = {};

      for (const field of allowedFields) {
        if (body[field as keyof Deal] !== undefined) {
          updates[field] = body[field as keyof Deal];
        }
      }

      // Always update timestamp
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return errorResponse('Deal not found', 404);

      return jsonResponse(data);
    }

    // DELETE - Delete deal
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET - Get single deal
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return errorResponse('Deal not found', 404);

      return jsonResponse(data);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error: any) {
    console.error('Deal API error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}
```

### Step 3: Notes Create Endpoint

**File:** `api/notes/index.ts`

```typescript
import { supabase } from '../lib/supabase';
import { jsonResponse, errorResponse, handleOptions } from '../lib/api-helpers';
import type { NewNote } from '../lib/types';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // POST - Create new note
    if (req.method === 'POST') {
      const body: NewNote = await req.json();

      // Validate required fields
      if (!body.deal_id || !body.content) {
        return errorResponse('deal_id and content are required', 400);
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          deal_id: body.deal_id,
          content: body.content,
          sentiment_score: body.sentiment_score ?? null,
          sentiment_label: body.sentiment_label ?? null
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error: any) {
    console.error('Notes API error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}
```

### Step 4: Notes List by Deal Endpoint

**File:** `api/notes/[dealId].ts`

```typescript
import { supabase } from '../lib/supabase';
import { jsonResponse, errorResponse, handleOptions } from '../lib/api-helpers';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  // Extract dealId from URL
  const url = new URL(req.url);
  const dealId = url.pathname.split('/').pop();

  if (!dealId) {
    return errorResponse('Deal ID required', 400);
  }

  try {
    // GET - List notes for a deal
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return jsonResponse(data);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error: any) {
    console.error('Notes API error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}
```

---

## API Contract Summary

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/deals` | - | `Deal[]` |
| POST | `/api/deals` | `{ name, value }` | `Deal` |
| GET | `/api/deals/[id]` | - | `Deal` |
| PUT | `/api/deals/[id]` | `Partial<Deal>` | `Deal` |
| DELETE | `/api/deals/[id]` | - | `{ success: true }` |
| GET | `/api/notes/[dealId]` | - | `Note[]` |
| POST | `/api/notes` | `{ deal_id, content, sentiment_score?, sentiment_label? }` | `Note` |

---

## Testing Commands

```bash
# Create a deal
curl -X POST https://your-api.vercel.app/api/deals \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Deal", "value": 10000}'

# List all deals
curl https://your-api.vercel.app/api/deals

# Update a deal (mark as lost)
curl -X PUT https://your-api.vercel.app/api/deals/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status": "lost", "loss_reason": "price"}'

# Create a note
curl -X POST https://your-api.vercel.app/api/notes \
  -H "Content-Type: application/json" \
  -d '{"deal_id": "[DEAL_ID]", "content": "Great call today!"}'

# Get notes for a deal
curl https://your-api.vercel.app/api/notes/[DEAL_ID]
```

---

## Acceptance Criteria

- [x] GET `/api/deals` returns all deals sorted by created_at desc
- [x] POST `/api/deals` creates a deal with name and value
- [x] PUT `/api/deals/[id]` updates deal fields
- [x] DELETE `/api/deals/[id]` removes a deal
- [x] GET `/api/notes/[dealId]` returns notes for a deal
- [x] POST `/api/notes` creates a note with optional sentiment
- [x] All endpoints return proper JSON responses
- [x] All endpoints handle CORS correctly
- [x] Validation errors return 400 status
- [x] Not found errors return 404 status
- [x] Server errors return 500 status with message

---

## AI Prompt for Claude

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

---

## Cloudflare Workers Alternative

If using Cloudflare Workers instead of Vercel:

```typescript
// workers/src/index.ts
import { Router } from 'itty-router';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// GET /api/deals
router.get('/api/deals', async (request, env) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// ... other routes

export default {
  fetch: router.handle
};
```
