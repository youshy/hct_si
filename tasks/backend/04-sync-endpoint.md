# Task: Sync Endpoint for Offline-First Data

## Overview
Create a sync endpoint that handles bidirectional data synchronization between the client's IndexedDB and the Supabase backend. Uses a last-write-wins strategy for conflict resolution.

## Required Outcome
A working sync endpoint that:
- Accepts local changes (deals + notes)
- Upserts data to the database
- Returns server updates since last sync
- Handles first-time sync (lastSync = null)

## Prerequisites
- Supabase setup complete (Task 01)
- CRUD endpoints working (Task 02)
- Database schema deployed

## Time Estimate
Hour 4-5 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Understand Sync Flow

```
Client                              Server
   |                                   |
   |-- POST /api/sync ---------------->|
   |   { lastSync, changes }           |
   |                                   |
   |                          Upsert deals
   |                          Insert notes
   |                          Query updates
   |                                   |
   |<-- { serverTime, updates } -------|
   |                                   |
   Update local DB
   Mark items synced
```

### Step 2: Define Sync Types

```typescript
interface SyncRequest {
  lastSync: string | null; // ISO timestamp or null for first sync
  changes: {
    deals: Deal[];
    notes: Note[];
  };
}

interface SyncResponse {
  serverTime: string; // ISO timestamp
  updates: {
    deals: Deal[];
    notes: Note[];
  };
}
```

### Step 3: Create Sync Endpoint

**File:** `api/sync.ts`

```typescript
import { supabase } from './lib/supabase';
import { jsonResponse, errorResponse, handleOptions } from './lib/api-helpers';
import type { Deal, Note } from './lib/types';

export const config = { runtime: 'edge' };

interface SyncRequest {
  lastSync: string | null;
  changes: {
    deals: Deal[];
    notes: Note[];
  };
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body: SyncRequest = await req.json();
    const serverTime = new Date().toISOString();

    // 1. Process incoming deals (upsert with last-write-wins)
    if (body.changes.deals?.length > 0) {
      await upsertDeals(body.changes.deals);
    }

    // 2. Process incoming notes (append-only, insert if not exists)
    if (body.changes.notes?.length > 0) {
      await insertNotes(body.changes.notes);
    }

    // 3. Fetch updates since lastSync
    const updates = await getUpdatesSince(body.lastSync);

    return jsonResponse({
      serverTime,
      updates
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return errorResponse(error.message || 'Sync failed');
  }
}

async function upsertDeals(deals: Deal[]): Promise<void> {
  for (const deal of deals) {
    // Check if deal exists
    const { data: existing } = await supabase
      .from('deals')
      .select('id, updated_at')
      .eq('id', deal.id)
      .single();

    if (existing) {
      // Update only if incoming is newer (last-write-wins)
      const existingTime = new Date(existing.updated_at).getTime();
      const incomingTime = new Date(deal.updated_at).getTime();

      if (incomingTime > existingTime) {
        await supabase
          .from('deals')
          .update({
            name: deal.name,
            value: deal.value,
            status: deal.status,
            loss_reason: deal.loss_reason,
            updated_at: deal.updated_at
          })
          .eq('id', deal.id);
      }
    } else {
      // Insert new deal
      await supabase
        .from('deals')
        .insert({
          id: deal.id,
          name: deal.name,
          value: deal.value,
          status: deal.status,
          loss_reason: deal.loss_reason,
          created_at: deal.created_at,
          updated_at: deal.updated_at
        });
    }
  }
}

async function insertNotes(notes: Note[]): Promise<void> {
  for (const note of notes) {
    // Check if note already exists
    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('id', note.id)
      .single();

    if (!existing) {
      // Insert new note (notes are append-only)
      await supabase
        .from('notes')
        .insert({
          id: note.id,
          deal_id: note.deal_id,
          content: note.content,
          sentiment_score: note.sentiment_score,
          sentiment_label: note.sentiment_label,
          created_at: note.created_at
        });
    }
  }
}

async function getUpdatesSince(lastSync: string | null): Promise<{
  deals: Deal[];
  notes: Note[];
}> {
  let dealsQuery = supabase.from('deals').select('*');
  let notesQuery = supabase.from('notes').select('*');

  if (lastSync) {
    // Get items updated/created after lastSync
    dealsQuery = dealsQuery.gt('updated_at', lastSync);
    notesQuery = notesQuery.gt('created_at', lastSync);
  }

  const [dealsResult, notesResult] = await Promise.all([
    dealsQuery.order('updated_at', { ascending: true }),
    notesQuery.order('created_at', { ascending: true })
  ]);

  return {
    deals: dealsResult.data || [],
    notes: notesResult.data || []
  };
}
```

### Step 4: Optimized Batch Version (Alternative)

For better performance with many items:

```typescript
async function upsertDealsBatch(deals: Deal[]): Promise<void> {
  // Supabase upsert with onConflict
  const { error } = await supabase
    .from('deals')
    .upsert(
      deals.map(d => ({
        id: d.id,
        name: d.name,
        value: d.value,
        status: d.status,
        loss_reason: d.loss_reason,
        created_at: d.created_at,
        updated_at: d.updated_at
      })),
      {
        onConflict: 'id',
        ignoreDuplicates: false
      }
    );

  if (error) throw error;
}

async function insertNotesBatch(notes: Note[]): Promise<void> {
  // Insert with ignore duplicates
  const { error } = await supabase
    .from('notes')
    .upsert(
      notes.map(n => ({
        id: n.id,
        deal_id: n.deal_id,
        content: n.content,
        sentiment_score: n.sentiment_score,
        sentiment_label: n.sentiment_label,
        created_at: n.created_at
      })),
      {
        onConflict: 'id',
        ignoreDuplicates: true
      }
    );

  if (error) throw error;
}
```

---

## API Contract

**Request:**
```json
POST /api/sync
Content-Type: application/json

{
  "lastSync": "2024-01-15T10:30:00.000Z",
  "changes": {
    "deals": [
      {
        "id": "uuid-1",
        "name": "Acme Corp",
        "value": 50000,
        "status": "open",
        "loss_reason": null,
        "created_at": "2024-01-15T09:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "notes": [
      {
        "id": "uuid-2",
        "deal_id": "uuid-1",
        "content": "Great call today",
        "sentiment_score": 0.7,
        "sentiment_label": "positive",
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Response:**
```json
{
  "serverTime": "2024-01-15T10:35:00.000Z",
  "updates": {
    "deals": [
      {
        "id": "uuid-3",
        "name": "TechStart",
        "value": 25000,
        "status": "open",
        "loss_reason": null,
        "created_at": "2024-01-15T10:32:00.000Z",
        "updated_at": "2024-01-15T10:32:00.000Z"
      }
    ],
    "notes": []
  }
}
```

**First Sync (lastSync = null):**
Returns all deals and notes from the database.

---

## Acceptance Criteria

- [x] Endpoint accepts POST with `{ lastSync, changes }` body
- [x] Incoming deals are upserted with last-write-wins
- [x] Incoming notes are inserted (skip if already exists)
- [x] Returns `{ serverTime, updates }` response
- [x] Updates include deals modified after lastSync
- [x] Updates include notes created after lastSync
- [x] First sync (lastSync = null) returns all data
- [x] Empty changes are handled gracefully
- [x] Errors return appropriate error response
- [x] CORS headers present

---

## AI Prompt for Claude

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

---

## Testing

```bash
# First sync (get all data)
curl -X POST https://your-api.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"lastSync": null, "changes": {"deals": [], "notes": []}}'

# Sync with changes
curl -X POST https://your-api.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "lastSync": "2024-01-15T10:00:00.000Z",
    "changes": {
      "deals": [{
        "id": "test-123",
        "name": "Test Deal",
        "value": 1000,
        "status": "open",
        "loss_reason": null,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }],
      "notes": []
    }
  }'
```

---

## Conflict Resolution Strategy

**Last-Write-Wins for Deals:**
```
Client A: updated_at = 10:00
Client B: updated_at = 10:05
Server:   updated_at = 10:02

Client A syncs → Server now has 10:00
Client B syncs → Server updates to 10:05 (newer wins)
Client A syncs again → Gets update with 10:05 from server
```

**Append-Only for Notes:**
- Notes are never updated, only created
- Each note has unique ID
- No conflicts possible (just skip duplicates)

---

## Emergency Fallback

If sync is breaking the demo, disable it:

```typescript
export default async function handler(req: Request) {
  // Return empty sync response (app works offline-only)
  return jsonResponse({
    serverTime: new Date().toISOString(),
    updates: { deals: [], notes: [] }
  });
}
```

The app will still work - data just stays in IndexedDB.
