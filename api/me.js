export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed = !origin || origin === 'https://fit.socialninjas.in' || origin === 'https://socialninjas.in' || origin.endsWith('.socialninjas.in') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'https://fit.socialninjas.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY;

  if (!supabaseKey) {
    console.error('[api/me] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    return res.status(500).json({ error: 'Server configuration error: missing service key.' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(200).json({ user: null });
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
    console.warn('[api/me] Auth error:', err);
  }

  if (!verifiedUser || !verifiedUser.email) {
    return res.status(200).json({ user: null });
  }

  const cleanEmail = verifiedUser.email.toLowerCase().trim();
  const isEmailConfirmed = Boolean(verifiedUser.email_confirmed_at || verifiedUser.confirmed_at);
  const isAdmin = isEmailConfirmed && (cleanEmail.endsWith('@socialninjas.in') || cleanEmail === 'nazim@socialninjas.in');

  let isPaid = isAdmin;
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

  return res.status(200).json({
    user: {
      id: verifiedUser.id,
      name: verifiedUser.user_metadata?.full_name || verifiedUser.user_metadata?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      paid: isPaid,
      role: isAdmin ? 'admin' : (isPaid ? 'member' : 'free')
    }
  });
}
