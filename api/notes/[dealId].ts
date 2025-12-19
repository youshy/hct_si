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

