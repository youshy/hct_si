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

interface SyncResponse {
  serverTime: string;
  updates: {
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
    if (body.changes?.deals?.length > 0) {
      await upsertDeals(body.changes.deals);
    }

    // 2. Process incoming notes (append-only)
    if (body.changes?.notes?.length > 0) {
      await insertNotes(body.changes.notes);
    }

    // 3. Fetch updates since lastSync
    const updates = await getUpdatesSince(body.lastSync);

    return jsonResponse({
      serverTime,
      updates
    } as SyncResponse);

  } catch (error: any) {
    console.error('Sync error:', error);
    return errorResponse(error.message || 'Sync failed');
  }
}

async function upsertDeals(deals: Deal[]): Promise<void> {
  // Use batch upsert for efficiency
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
        updated_at: d.updated_at,
        // v4 fields
        archived: d.archived ?? false,
        expected_close_date: d.expected_close_date,
        customer_name: d.customer_name,
        stage: d.stage ?? 'prospect'
      })),
      {
        onConflict: 'id',
        ignoreDuplicates: false
      }
    );

  if (error) throw error;
}

async function insertNotes(notes: Note[]): Promise<void> {
  // Insert with ignore duplicates (notes are append-only)
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

