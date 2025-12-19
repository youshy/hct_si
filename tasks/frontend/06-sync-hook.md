# Task: Sync Hook for Offline-First Data

## Overview
Create a hook/store that handles background synchronization between IndexedDB and the backend API. This enables offline-first functionality where data is always saved locally first, then synced when online.

## Required Outcome
A reusable sync mechanism that:
- Syncs local changes to the backend
- Receives and applies server updates
- Handles offline/online transitions
- Provides sync status to the UI

## Prerequisites
- IndexedDB setup complete (Task 01)
- Backend sync endpoint deployed (Backend Task 04)
- All CRUD operations work locally

## Time Estimate
Hour 4-5 of the hackathon (included in Feature Complete phase)

---

## Step-by-Step Implementation

### Step 1: Define Sync Types

```typescript
interface SyncRequest {
  lastSync: string | null; // ISO timestamp
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

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}
```

### Step 2: Create the Sync Function

```typescript
async function performSync(): Promise<void> {
  // 1. Get unsynced local data
  const unsyncedDeals = await getUnsyncedDeals();
  const unsyncedNotes = await getUnsyncedNotes();

  // 2. Get last sync timestamp from localStorage
  const lastSync = localStorage.getItem('lastSyncTime');

  // 3. Make sync request
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lastSync,
      changes: {
        deals: unsyncedDeals,
        notes: unsyncedNotes
      }
    })
  });

  if (!response.ok) {
    throw new Error('Sync failed');
  }

  const data: SyncResponse = await response.json();

  // 4. Apply server updates to local DB
  await applyServerUpdates(data.updates);

  // 5. Mark local items as synced
  await markDealsSynced(unsyncedDeals.map(d => d.id));
  await markNotesSynced(unsyncedNotes.map(n => n.id));

  // 6. Save new sync timestamp
  localStorage.setItem('lastSyncTime', data.serverTime);
}
```

### Step 3: Apply Server Updates

```typescript
async function applyServerUpdates(updates: {
  deals: Deal[];
  notes: Note[];
}): Promise<void> {
  // Upsert deals (server wins for conflicts)
  for (const deal of updates.deals) {
    const existing = await db.deals.get(deal.id);
    if (!existing || new Date(deal.updated_at) > new Date(existing.updated_at)) {
      await db.deals.put({ ...deal, synced: true });
    }
  }

  // Insert notes (append-only, no conflicts)
  for (const note of updates.notes) {
    const existing = await db.notes.get(note.id);
    if (!existing) {
      await db.notes.put({ ...note, synced: true });
    }
  }
}
```

### Step 4: Create React Hook

```typescript
// React version
import { useState, useEffect, useCallback } from 'react';

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null
  });

  const syncNow = useCallback(async () => {
    if (state.isSyncing || !navigator.onLine) return;

    setState(s => ({ ...s, isSyncing: true, error: null }));

    try {
      await performSync();
      setState(s => ({
        ...s,
        isSyncing: false,
        lastSyncTime: new Date()
      }));
    } catch (error) {
      setState(s => ({
        ...s,
        isSyncing: false,
        error: error.message
      }));

      // Retry after 30 seconds
      setTimeout(syncNow, 30000);
    }
  }, [state.isSyncing]);

  // Sync on mount
  useEffect(() => {
    syncNow();
  }, []);

  // Sync when coming online
  useEffect(() => {
    const handleOnline = () => syncNow();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  return {
    ...state,
    syncNow
  };
}
```

### Step 5: Create Svelte Store (Alternative)

```typescript
// Svelte version
import { writable } from 'svelte/store';

function createSyncStore() {
  const { subscribe, set, update } = writable<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null
  });

  let retryTimeout: number | null = null;

  async function syncNow() {
    if (!navigator.onLine) return;

    update(s => ({ ...s, isSyncing: true, error: null }));

    try {
      await performSync();
      update(s => ({
        ...s,
        isSyncing: false,
        lastSyncTime: new Date()
      }));
    } catch (error) {
      update(s => ({
        ...s,
        isSyncing: false,
        error: error.message
      }));

      // Retry after 30 seconds
      retryTimeout = setTimeout(syncNow, 30000);
    }
  }

  // Auto-sync on online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncNow);
  }

  return {
    subscribe,
    syncNow,
    cleanup: () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    }
  };
}

export const syncStore = createSyncStore();
```

### Step 6: Add Sync Status to UI (Optional)

```svelte
<!-- Simple sync indicator -->
<script>
  import { syncStore } from '$lib/stores/sync';
</script>

{#if $syncStore.isSyncing}
  <div class="sync-indicator">Syncing...</div>
{:else if $syncStore.error}
  <div class="sync-error">
    Sync failed
    <button on:click={syncStore.syncNow}>Retry</button>
  </div>
{/if}
```

---

## Sync Flow Diagram

```
App Starts
    |
    v
Check if online? ----No----> Use local data only
    |
    Yes
    |
    v
Get unsynced items from IndexedDB
    |
    v
POST /api/sync { lastSync, changes }
    |
    v
Receive { serverTime, updates }
    |
    v
Apply server updates to IndexedDB
    |
    v
Mark local items as synced
    |
    v
Save serverTime to localStorage
    |
    v
Done (retry in 30s if error)
```

---

## Acceptance Criteria

- [ ] Sync runs automatically when app loads (if online)
- [ ] Sync runs when device comes online
- [ ] Local unsynced changes are sent to server
- [ ] Server updates are applied to local DB
- [ ] Conflict resolution uses last-write-wins (server updated_at)
- [ ] Sync status is exposed (isSyncing, lastSyncTime, error)
- [ ] Failed syncs retry after 30 seconds
- [ ] App works fully offline (sync just doesn't run)
- [ ] Manual sync trigger available via `syncNow()`

---

## AI Prompt for Claude

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

## Integration with App

```typescript
// In your main App component
import { useSync } from './hooks/useSync';

function App() {
  const { isSyncing, lastSyncTime, syncNow } = useSync();

  // Optional: Show sync status somewhere
  // Optional: Add pull-to-refresh that calls syncNow()

  return (
    // ... your app
  );
}
```

---

## Emergency Fallback

If sync is too complex or breaking, skip it for the demo:

```typescript
// Simplified: just work offline
export function useSync() {
  return {
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    syncNow: () => console.log('Sync disabled for demo')
  };
}
```

The app will still work - data just won't sync to the server.
