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

