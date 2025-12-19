import { supabase } from './lib/supabase';
import { jsonResponse, errorResponse } from './lib/api-helpers';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('count')
      .limit(1);

    if (error) throw error;

    return jsonResponse({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return errorResponse('Database connection failed', 503);
  }
}
