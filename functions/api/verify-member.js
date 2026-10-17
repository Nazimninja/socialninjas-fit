export async function onRequest(context) {
  const { request, env } = context;

  const origin = request.headers.get('origin') || '';
  const isAllowed = !origin || origin === 'https://fit.socialninjas.in' || origin === 'https://socialninjas.in' || origin.endsWith('.socialninjas.in') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  const allowedOrigin = isAllowed ? (origin || '*') : 'https://fit.socialninjas.in';

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
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

  // 1. Proof of Ownership: Enforce Supabase JWT Bearer Verification
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return new Response(JSON.stringify({ 
      verified: false, 
      error: 'Authentication required. Bearer token missing.' 
    }), { headers, status: 401 });
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_CRM_SERVICE_KEY;

  if (!supabaseKey) {
    console.error('[functions/api/verify-member] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    return new Response(JSON.stringify({ error: 'Server configuration error: missing service key.' }), { 
      headers, status: 500 
    });
  }

  let cleanEmail = '';
  try {
    const body = await request.clone().json().catch(() => ({}));
    cleanEmail = (body?.email || '').trim().toLowerCase();
  } catch (e) {}

  let authenticatedEmail = null;
  let isEmailConfirmed = false;
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
      isEmailConfirmed = Boolean(uData.email_confirmed_at || uData.confirmed_at);
    }
  } catch (authErr) {
    console.warn('Supabase token verification error:', authErr);
  }

  if (!authenticatedEmail) {
    return new Response(JSON.stringify({ 
      verified: false, 
      error: 'Invalid or expired session. Please sign in again.' 
    }), { headers, status: 401 });
  }

  const isAdmin = isEmailConfirmed && (authenticatedEmail.endsWith('@socialninjas.in') || authenticatedEmail === 'nazim@socialninjas.in');
  // Admins can query any target email, regular users can strictly only query their own account
  const targetEmail = (isAdmin && cleanEmail) ? cleanEmail : authenticatedEmail;

  if (authenticatedEmail === targetEmail && isAdmin) {
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
