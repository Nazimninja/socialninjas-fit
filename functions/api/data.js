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
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMwMzAsImV4cCI6MjEwMDQ2OTAzMH0.qt4ty1tjGeXMthhSaDZZo80u_JdPK4klUg3QAIhN0nw';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || fallbackKey;

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
        try {
          const stored = await kv.get(`user_state_${email}`, { type: 'json' });
          if (stored) {
            return new Response(JSON.stringify({ state: stored, email, source: 'kv' }), { headers, status: 200 });
          }
        } catch (kvErr) {
          console.warn('KV get error:', kvErr);
        }
      }

      // 2. Query Supabase scripts storage table (profile = fitninja_user_state)
      if (supabaseUrl && supabaseKey) {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_user_state&topic=eq.${encodeURIComponent(email)}&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });

          if (res.ok) {
            const rows = await res.json();
            if (rows && rows.length > 0 && rows[0].section1) {
              const state = JSON.parse(rows[0].section1);
              return new Response(JSON.stringify({ state, email, source: 'supabase' }), { headers, status: 200 });
            }
          }
        } catch (dbErr) {
          console.warn('Supabase scripts get error:', dbErr);
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
        try {
          await kv.put(`user_state_${email}`, JSON.stringify(state));
        } catch (kvErr) {
          console.warn('KV put error:', kvErr);
        }
      }

      // 2. Upsert to Supabase scripts storage table
      if (supabaseUrl && supabaseKey) {
        try {
          // Check if record exists
          const checkRes = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_user_state&topic=eq.${encodeURIComponent(email)}&select=id`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });

          let existingId = null;
          if (checkRes.ok) {
            const rows = await checkRes.json();
            if (rows && rows.length > 0) existingId = rows[0].id;
          }

          const payload = {
            profile: 'fitninja_user_state',
            topic: email,
            section1: JSON.stringify(state),
            caption: new Date().toISOString()
          };

          if (existingId) {
            await fetch(`${supabaseUrl}/rest/v1/scripts?id=eq.${existingId}`, {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          } else {
            await fetch(`${supabaseUrl}/rest/v1/scripts`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          }
        } catch (dbErr) {
          console.warn('Supabase scripts put error:', dbErr);
        }
      }

      return new Response(JSON.stringify({ success: true, email, savedAt: Date.now() }), { headers, status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers, status: 405 });
}
