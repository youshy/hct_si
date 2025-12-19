// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Standard JSON response
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Error response
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// Handle OPTIONS preflight
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

