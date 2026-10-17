export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ verified: false, error: 'Method not allowed' }), { headers, status: 405 });
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_CRM_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg5MzAzMCwiZXhwIjoyMTAwNDY5MDMwfQ.3D1lYMhzIql9On42MvLq2B0iKAebqtdUKJvOxF1uxpE';

  let cleanEmail = '';
  try {
    const body = await request.clone().json().catch(() => ({}));
    cleanEmail = (body?.email || '').trim().toLowerCase();
  } catch (e) {}

  // 1. Proof of Ownership: Enforce Supabase JWT Bearer Verification if present
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  let authenticatedEmail = null;
  if (token) {
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (userRes.ok) {
        const uData = await userRes.json();
        authenticatedEmail = (uData.email || '').toLowerCase().trim();
      }
    } catch (authErr) {
      console.warn('Supabase token verification error:', authErr);
    }
  }

  const targetEmail = authenticatedEmail || cleanEmail;
  if (!targetEmail) {
    return new Response(JSON.stringify({ 
      verified: false, 
      error: 'Email address or session is required' 
    }), { headers, status: 400 });
  }

  // Admin Check: Strictly requires authenticated session for @socialninjas.in
  const isAdmin = targetEmail.endsWith('@socialninjas.in') || targetEmail === 'nazim@socialninjas.in';
  if (authenticatedEmail && isAdmin) {
    return new Response(JSON.stringify({ 
      verified: true, 
      role: 'admin', 
      email: authenticatedEmail,
      paid: true 
    }), { headers, status: 200 });
  }

  // 2. Query Supabase scripts storage table (profile = fitninja_membership)
  try {
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_membership&topic=eq.${encodeURIComponent(targetEmail)}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (checkRes.ok) {
      const rows = await checkRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return new Response(JSON.stringify({ 
          verified: true, 
          role: isAdmin ? 'admin' : 'member', 
          email: targetEmail, 
          paid: true 
        }), { headers, status: 200 });
      }
    }
  } catch (dbErr) {
    console.warn('Membership query error:', dbErr);
  }

  return new Response(JSON.stringify({
    verified: false,
    email: targetEmail,
    role: 'free',
    paid: false,
    error: 'No active Pro subscription found for this account.'
  }), { headers, status: 403 });
}
