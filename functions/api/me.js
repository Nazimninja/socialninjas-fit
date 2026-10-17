export async function onRequest(context) {
  const { request, env } = context;

  const origin = request.headers.get('origin') || '';
  const isAllowed = !origin || origin === 'https://fit.socialninjas.in' || origin === 'https://socialninjas.in' || origin.endsWith('.socialninjas.in') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  const allowedOrigin = isAllowed ? (origin || '*') : 'https://fit.socialninjas.in';

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_CRM_SERVICE_KEY;

  if (!supabaseKey) {
    console.error('[functions/api/me] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    return new Response(JSON.stringify({ error: 'Server configuration error: missing service key.' }), { 
      headers, status: 500 
    });
  }

  // 1. Verify caller via Supabase JWT
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return new Response(JSON.stringify({ user: null }), { headers, status: 200 });
  }

  let verifiedUser = null;
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (userRes.ok) {
      verifiedUser = await userRes.json();
    }
  } catch (err) {
    console.warn('User auth verification error:', err);
  }

  if (!verifiedUser || !verifiedUser.email) {
    return new Response(JSON.stringify({ user: null }), { headers, status: 200 });
  }

  const cleanEmail = verifiedUser.email.toLowerCase().trim();
  const isEmailConfirmed = Boolean(verifiedUser.email_confirmed_at || verifiedUser.confirmed_at);
  const isAdmin = isEmailConfirmed && (cleanEmail.endsWith('@socialninjas.in') || cleanEmail === 'nazim@socialninjas.in');

  // 2. Query Supabase scripts storage for active paid membership
  let isPaid = isAdmin; // Admins get full tool access
  if (!isPaid) {
    try {
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_membership&topic=eq.${encodeURIComponent(cleanEmail)}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          isPaid = true;
        }
      }
    } catch (_) {}
  }

  return new Response(JSON.stringify({
    user: {
      id: verifiedUser.id,
      name: verifiedUser.user_metadata?.full_name || verifiedUser.user_metadata?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      paid: isPaid,
      role: isAdmin ? 'admin' : (isPaid ? 'member' : 'free')
    }
  }), { headers, status: 200 });
}
