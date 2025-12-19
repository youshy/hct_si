import {
  db,
  getDeals,
  markDealsSynced,
  markNotesSynced,
  type Deal,
  type Note
} from '../db';

interface SyncRequest {
  lastSync: string | null;
  changes: {
    deals: Deal[];
    notes: Note[];
  };
  fullSync?: boolean;
}

interface SyncResponse {
  serverTime: string;
  updates: {
    deals: Deal[];
    notes: Note[];
  };
}

async function applyServerUpdates(updates: {
  deals: Deal[];
  notes: Note[];
}): Promise<void> {
  for (const deal of updates.deals) {
    const existing = await db.deals.get(deal.id);
    if (!existing || new Date(deal.updated_at) > new Date(existing.updated_at)) {
      await db.deals.put({ ...deal, synced: true });
    }
  }

  for (const note of updates.notes) {
    const existing = await db.notes.get(note.id);
    if (!existing) {
      await db.notes.put({ ...note, synced: true });
    }
  }
}

export async function performSync(): Promise<void> {
  // Get ALL local deals and notes (including archived) for full persistence
  const allDeals = await getDeals(true); // true = include archived
  const allNotes = await db.notes.toArray();

  const lastSync = localStorage.getItem('lastSyncTime');

  const request: SyncRequest = {
    lastSync,
    changes: {
      deals: allDeals,
      notes: allNotes
    },
    fullSync: true
  };

  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Sync failed');
  }

  const data: SyncResponse = await response.json();

  // Apply any updates from server (in case other devices made changes)
  await applyServerUpdates(data.updates);

  // Mark all local items as synced
  if (allDeals.length > 0) {
    await markDealsSynced(allDeals.map(d => d.id));
  }
  if (allNotes.length > 0) {
    await markNotesSynced(allNotes.map(n => n.id));
  }

  localStorage.setItem('lastSyncTime', data.serverTime);
}
