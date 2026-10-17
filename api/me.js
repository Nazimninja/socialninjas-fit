export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CRM_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg5MzAzMCwiZXhwIjoyMTAwNDY5MDMwfQ.3D1lYMhzIql9On42MvLq2B0iKAebqtdUKJvOxF1uxpE';

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
  const isAdmin = cleanEmail.endsWith('@socialninjas.in') || cleanEmail === 'nazim@socialninjas.in';

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
