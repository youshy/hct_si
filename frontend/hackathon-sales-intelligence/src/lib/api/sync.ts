import {
  db,
  getUnsyncedDeals,
  getUnsyncedNotes,
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
  const unsyncedDeals = await getUnsyncedDeals();
  const unsyncedNotes = await getUnsyncedNotes();

  const lastSync = localStorage.getItem('lastSyncTime');

  const request: SyncRequest = {
    lastSync,
    changes: {
      deals: unsyncedDeals,
      notes: unsyncedNotes
    }
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

  await applyServerUpdates(data.updates);

  if (unsyncedDeals.length > 0) {
    await markDealsSynced(unsyncedDeals.map(d => d.id));
  }
  if (unsyncedNotes.length > 0) {
    await markNotesSynced(unsyncedNotes.map(n => n.id));
  }

  localStorage.setItem('lastSyncTime', data.serverTime);
}
