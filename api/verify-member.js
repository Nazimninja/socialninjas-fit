import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ verified: false, error: 'Authentication required. Bearer token missing.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY;

    if (!supabaseKey) {
      console.error('[api/verify-member] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
      return res.status(500).json({ error: 'Server configuration error: missing service key.' });
    }

    let authenticatedEmail = null;
    let isEmailConfirmed = false;

    // 1. Authenticate user via Supabase Auth Bearer token
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
      console.warn('[api/verify-member] Token check error:', authErr);
    }

    if (!authenticatedEmail) {
      return res.status(401).json({ verified: false, error: 'Invalid or expired session. Please sign in again.' });
    }

    const isAdmin = isEmailConfirmed && (authenticatedEmail.endsWith('@socialninjas.in') || authenticatedEmail === 'nazim@socialninjas.in');
    // Admins can look up any requested email, regular users can strictly only query their own account
    const targetEmail = (isAdmin && cleanEmail) ? cleanEmail : authenticatedEmail;

    // 2. Admin Check: Strictly for authenticated @socialninjas.in accounts
    if (authenticatedEmail === targetEmail && isAdmin) {
      return res.status(200).json({ verified: true, role: 'admin', email: authenticatedEmail, paid: true });
    }

    // 3. Database Check: Query Supabase scripts table for active fitninja_membership
    const candidates = [targetEmail];
    const digits = targetEmail.replace(/\D/g, '');
    if (digits.length >= 10) {
      if (!targetEmail.startsWith('+')) candidates.push('+' + digits);
      candidates.push(digits);
      if (digits.length === 10) candidates.push('+91' + digits);
      if (digits.startsWith('91') && digits.length === 12) candidates.push(digits.slice(2));
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: memRows } = await supabase
          .from('scripts')
          .select('*')
          .eq('profile', 'fitninja_membership')
          .in('topic', candidates)
          .limit(1);

        if (memRows && memRows.length > 0) {
          return res.status(200).json({
            verified: true,
            role: isAdmin ? 'admin' : 'member',
            email: targetEmail,
            paid: true
          });
        }
      } catch (dbErr) {
        console.warn('[api/verify-member] Database error:', dbErr);
      }
    }

    return res.status(403).json({
      verified: false,
      role: 'free',
      paid: false,
      error: 'No active Pro subscription found for this account.'
    });
  } catch (err) {
    console.error('[api/verify-member] Server error:', err);
    return res.status(500).json({ verified: false, error: 'Verification error occurred' });
  }
}
