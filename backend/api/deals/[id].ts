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

