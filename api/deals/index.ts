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

