import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const validKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMwMzAsImV4cCI6MjEwMDQ2OTAzMH0.qt4ty1tjGeXMthhSaDZZo80u_JdPK4klUg3QAIhN0nw';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || validKey;

  // 1. Authenticate caller via Supabase JWT
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Bearer token missing.' });
  }

  let authenticatedEmail = null;
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
  } catch (err) {
    console.warn('[api/data] Token check error:', err);
  }

  if (!authenticatedEmail) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  const isAdmin = authenticatedEmail.endsWith('@socialninjas.in') || authenticatedEmail === 'nazim@socialninjas.in';
  const emailParam = req.query.email;
  const email = (isAdmin && emailParam) ? emailParam.trim().toLowerCase() : authenticatedEmail;

  // ── GET: Pull User State ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      if (supabaseUrl && supabaseKey) {
        const checkRes = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_user_state&topic=eq.${encodeURIComponent(email)}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (checkRes.ok) {
          const rows = await checkRes.json();
          if (rows && rows.length > 0 && rows[0].section1) {
            const state = JSON.parse(rows[0].section1);
            return res.status(200).json({ state, email, source: 'supabase' });
          }
        }
      }

      return res.status(200).json({ state: null, email });
    } catch (err) {
      return res.status(500).json({ state: null, error: err.message });
    }
  }

  // ── PUT / POST: Push User State ───────────────────────────────────────
  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const body = req.body || {};
      const state = body.state;

      if (!state) {
        return res.status(400).json({ error: 'State payload is required' });
      }

      if (supabaseUrl && supabaseKey) {
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
      }

      return res.status(200).json({ success: true, email, savedAt: Date.now() });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
