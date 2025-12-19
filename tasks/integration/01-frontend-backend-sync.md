# Task: Connect Frontend Sync to Backend

## Overview
Wire up the frontend sync hook to communicate with the backend sync endpoint. This enables the offline-first experience where local data syncs to the server.

## Required Outcome
- Frontend can push local changes to backend
- Frontend receives and applies server updates
- Sync runs automatically on app load and when coming online
- Data persists across sessions via server

## Prerequisites
- Frontend sync hook implemented (Frontend Task 06)
- Backend sync endpoint deployed (Backend Task 04)
- Both running and accessible

## Time Estimate
Hour 5-6 of the hackathon (Integration phase)

---

## Step-by-Step Implementation

### Step 1: Verify Backend Sync Endpoint

```bash
# Test the sync endpoint is working
curl -X POST https://your-api.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"lastSync": null, "changes": {"deals": [], "notes": []}}'

# Expected response:
# {"serverTime":"2024-...","updates":{"deals":[...],"notes":[...]}}
```

### Step 2: Configure API URL in Frontend

**File:** `frontend/hackathon-sales-intelligence/src/lib/config.ts`
```typescript
// Use environment variable or default to same-origin
export const API_URL = import.meta.env.VITE_API_URL || '';

// For local development, you might need:
// export const API_URL = 'http://localhost:3000';
```

### Step 3: Update Sync Hook with Real API Call

**File:** `frontend/hackathon-sales-intelligence/src/lib/sync.ts`
```typescript
import { API_URL } from './config';
import { db } from './db';
import { getUnsyncedDeals, getUnsyncedNotes, markDealsSynced, markNotesSynced } from './db';
import type { Deal, Note } from './db/types';

interface SyncResponse {
  serverTime: string;
  updates: {
    deals: Deal[];
    notes: Note[];
  };
}

export async function performSync(): Promise<void> {
  // 1. Get unsynced local data
  const unsyncedDeals = await getUnsyncedDeals();
  const unsyncedNotes = await getUnsyncedNotes();

  // 2. Get last sync timestamp
  const lastSync = localStorage.getItem('lastSyncTime');

  // 3. Make sync request to backend
  const response = await fetch(`${API_URL}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lastSync,
      changes: {
        deals: unsyncedDeals,
        notes: unsyncedNotes
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const data: SyncResponse = await response.json();

  // 4. Apply server updates to local DB
  await applyServerUpdates(data.updates);

  // 5. Mark local items as synced
  if (unsyncedDeals.length > 0) {
    await markDealsSynced(unsyncedDeals.map(d => d.id));
  }
  if (unsyncedNotes.length > 0) {
    await markNotesSynced(unsyncedNotes.map(n => n.id));
  }

  // 6. Save new sync timestamp
  localStorage.setItem('lastSyncTime', data.serverTime);

  console.log('Sync complete:', {
    pushed: { deals: unsyncedDeals.length, notes: unsyncedNotes.length },
    received: { deals: data.updates.deals.length, notes: data.updates.notes.length }
  });
}

async function applyServerUpdates(updates: {
  deals: Deal[];
  notes: Note[];
}): Promise<void> {
  // Upsert deals (server wins for conflicts based on updated_at)
  for (const deal of updates.deals) {
    const existing = await db.deals.get(deal.id);

    if (!existing) {
      // New deal from server
      await db.deals.put({ ...deal, synced: true });
    } else if (new Date(deal.updated_at) > new Date(existing.updated_at)) {
      // Server version is newer
      await db.deals.put({ ...deal, synced: true });
    }
    // Otherwise keep local version (it's newer or same)
  }

  // Insert notes (append-only, skip existing)
  for (const note of updates.notes) {
    const existing = await db.notes.get(note.id);
    if (!existing) {
      await db.notes.put({ ...note, synced: true });
    }
  }
}
```

### Step 4: Handle Network Errors Gracefully

```typescript
export async function safeSyncNow(): Promise<boolean> {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync');
    return false;
  }

  try {
    await performSync();
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    // Schedule retry
    setTimeout(safeSyncNow, 30000);
    return false;
  }
}
```

### Step 5: Initialize Sync on App Load

**File:** `frontend/hackathon-sales-intelligence/src/App.tsx`
```svelte
<script>
  import { onMount } from 'svelte';
  import { syncStore } from './lib/stores/sync';

  onMount(() => {
    // Sync on load
    syncStore.syncNow();

    // Sync when coming back online
    window.addEventListener('online', () => {
      syncStore.syncNow();
    });
  });
</script>
```

### Step 6: Test the Integration

```javascript
// In browser console:

// 1. Create a deal locally
await addDeal('Test Deal', 5000);

// 2. Check it's unsynced
const unsynced = await getUnsyncedDeals();
console.log('Unsynced:', unsynced);

// 3. Trigger sync
await performSync();

// 4. Verify it's now synced
const deals = await getDeals();
console.log('Deals after sync:', deals);

// 5. Check localStorage for lastSyncTime
console.log('Last sync:', localStorage.getItem('lastSyncTime'));
```

---

## Integration Points

```
┌─────────────────┐         ┌─────────────────┐
│    Frontend     │         │     Backend     │
│                 │         │                 │
│  IndexedDB      │         │    Supabase     │
│  (Dexie.js)     │         │   PostgreSQL    │
│       │         │         │        │        │
│       v         │  HTTP   │        v        │
│  Sync Hook ─────┼────────>│  /api/sync      │
│       │         │         │        │        │
│       v         │  JSON   │        v        │
│  Apply Updates <┼─────────│  Query Updates  │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
```

---

## Acceptance Criteria

- [x] Frontend successfully calls `/api/sync` endpoint
- [x] Local unsynced deals are sent to server
- [x] Local unsynced notes are sent to server
- [x] Server updates are received and applied locally
- [x] Items are marked as synced after successful sync
- [x] `lastSyncTime` is persisted in localStorage
- [x] Sync runs on app initialization
- [x] Sync runs when device comes online
- [x] Failed syncs retry after 30 seconds
- [x] Console logs show sync activity for debugging

---

## Debugging Checklist

### "Sync failed: 404"
- Check API_URL is correct
- Verify `/api/sync` endpoint is deployed
- Check Vercel function logs

### "CORS error"
- Ensure backend returns CORS headers
- Check browser network tab for preflight (OPTIONS) response

### "Data not appearing after sync"
- Check `applyServerUpdates` is being called
- Verify data format matches (dates as strings, etc.)
- Check browser IndexedDB in DevTools

### "Items keep showing as unsynced"
- Verify `markDealsSynced` is called after sync
- Check that IDs match between local and response

---

## Quick Test Script

```javascript
// Paste in browser console to test full sync flow

async function testSync() {
  // Import (adjust path as needed)
  const { addDeal, getDeals, getUnsyncedDeals } = await import('./lib/db');
  const { performSync } = await import('./lib/sync');

  console.log('1. Creating test deal...');
  const deal = await addDeal('Sync Test ' + Date.now(), 1000);
  console.log('Created:', deal);

  console.log('2. Checking unsynced...');
  const before = await getUnsyncedDeals();
  console.log('Unsynced before:', before.length);

  console.log('3. Running sync...');
  await performSync();

  console.log('4. Checking after sync...');
  const after = await getUnsyncedDeals();
  console.log('Unsynced after:', after.length);

  console.log('5. All deals:');
  const all = await getDeals();
  console.log(all);

  console.log('✅ Sync test complete!');
}

testSync();
```
