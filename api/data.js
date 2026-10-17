import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed = !origin || origin === 'https://fit.socialninjas.in' || origin === 'https://socialninjas.in' || origin.endsWith('.socialninjas.in') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'https://fit.socialninjas.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY;

  if (!supabaseKey) {
    console.error('[api/data] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    return res.status(500).json({ error: 'Server configuration error: missing service key.' });
  }

  // 1. Authenticate caller via Supabase JWT
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Bearer token missing.' });
  }

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
  } catch (err) {
    console.warn('[api/data] Token check error:', err);
  }

  if (!authenticatedEmail) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  const isAdmin = isEmailConfirmed && (authenticatedEmail.endsWith('@socialninjas.in') || authenticatedEmail === 'nazim@socialninjas.in');
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
