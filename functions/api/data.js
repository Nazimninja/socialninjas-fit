export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  const headerEmail = request.headers.get('x-user-email') || request.headers.get('X-User-Email');

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  // Cloudflare KV fallback check
  const kv = env.FIT_KV || env.USER_KV || env.DATA_KV || env.NINJA_KV;

  // ── GET: Pull User State ──────────────────────────────────────────────
  if (request.method === 'GET') {
    const rawEmail = emailParam || headerEmail || '';
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ state: null, error: 'No user email provided' }), { headers, status: 200 });
    }

    try {
      // 1. Try Cloudflare KV first if bound
      if (kv) {
        const stored = await kv.get(`user_state_${email}`, { type: 'json' });
        if (stored) {
          return new Response(JSON.stringify({ state: stored, email, source: 'kv' }), { headers, status: 200 });
        }
      }

      // 2. Try Supabase user_data / user_state table
      if (supabaseUrl && supabaseKey) {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/user_data?email=eq.${encodeURIComponent(email)}&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });

          if (res.ok) {
            const rows = await res.json();
            if (rows && rows.length > 0 && rows[0].state) {
              return new Response(JSON.stringify({ state: rows[0].state, email, source: 'supabase' }), { headers, status: 200 });
            }
          }
        } catch (dbErr) {
          console.warn('Supabase get error:', dbErr);
        }
      }

      return new Response(JSON.stringify({ state: null, email }), { headers, status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ state: null, error: err.message }), { headers, status: 200 });
    }
  }

  // ── PUT / POST: Push User State ───────────────────────────────────────
  if (request.method === 'PUT' || request.method === 'POST') {
    try {
      const body = await request.json();
      const rawEmail = body.email || emailParam || headerEmail || '';
      const email = rawEmail.trim().toLowerCase();
      const state = body.state;

      if (!email || !state) {
        return new Response(JSON.stringify({ error: 'Email and state are required' }), { headers, status: 400 });
      }

      // 1. Save to Cloudflare KV if bound
      if (kv) {
        await kv.put(`user_state_${email}`, JSON.stringify(state));
      }

      // 2. Save / Upsert to Supabase
      if (supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/rest/v1/user_data`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              email,
              state,
              updated_at: new Date().toISOString()
            })
          });
        } catch (dbErr) {
          console.warn('Supabase put error:', dbErr);
        }
      }

      return new Response(JSON.stringify({ success: true, email, savedAt: Date.now() }), { headers, status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers, status: 405 });
}
