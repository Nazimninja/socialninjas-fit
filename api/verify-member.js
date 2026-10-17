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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg5MzAzMCwiZXhwIjoyMTAwNDY5MDMwfQ.3D1lYMhzIql9On42MvLq2B0iKAebqtdUKJvOxF1uxpE';

    let authenticatedEmail = null;

    // 1. If Bearer token is provided, verify against Supabase Auth
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
        console.warn('[api/verify-member] Token check error:', authErr);
      }
    }

    const targetEmail = authenticatedEmail || cleanEmail;
    if (!targetEmail) {
      return res.status(400).json({ verified: false, error: 'Email address is required' });
    }

    // 2. Admin Check: Strictly for authenticated @socialninjas.in accounts
    const isAdmin = (authenticatedEmail || targetEmail).endsWith('@socialninjas.in') || (authenticatedEmail || targetEmail) === 'nazim@socialninjas.in';
    if (authenticatedEmail && isAdmin) {
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
