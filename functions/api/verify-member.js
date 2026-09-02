export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ verified: false, error: 'Method not allowed' }), { headers, status: 405 });
  }

  const ADMIN_EMAILS = [
    'nazimpasha906@gmail.com',
    'nazim@socialninjas.in',
    'admin@socialninjas.in',
    'support@socialninjas.in',
    'fit@socialninjas.in'
  ];

  try {
    const body = await request.json();
    const { email } = body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return new Response(JSON.stringify({ verified: false, error: 'Email address is required' }), { headers, status: 400 });
    }

    // 1. Check if Admin/Owner email
    if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@socialninjas.in')) {
      return new Response(JSON.stringify({ verified: true, role: 'admin', email: cleanEmail }), { headers, status: 200 });
    }

    // 2. Check Supabase DB for active subscription/user
    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        // Query Supabase using HTTP client directly to avoid supabase-js import node-compatibility issues
        const res = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (res.ok) {
          const users = await res.json();
          const user = users[0];
          if (user && (user.paid || user.role === 'admin' || user.subscription_status === 'active')) {
            return new Response(JSON.stringify({ verified: true, email: cleanEmail, user }), { headers, status: 200 });
          }
        }

        // Check subscriptions table
        const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?email=eq.${encodeURIComponent(cleanEmail)}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (subRes.ok) {
          const subs = await subRes.json();
          const sub = subs[0];
          if (sub && (sub.status === 'active' || sub.status === 'authenticated')) {
            return new Response(JSON.stringify({ verified: true, email: cleanEmail, subscription: sub }), { headers, status: 200 });
          }
        }
      } catch (dbErr) {
        console.warn('Supabase lookup non-fatal error:', dbErr);
      }
    }

    // 3. Fallback: Check Razorpay Customers API directly if keys available
    const key_id = env.RAZORPAY_KEY_ID;
    const key_secret = env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      try {
        const auth = btoa(`${key_id}:${key_secret}`);
        const rzpRes = await fetch('https://api.razorpay.com/v1/customers?count=50', {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });

        if (rzpRes.ok) {
          const data = await rzpRes.json();
          if (data && data.items) {
            const match = data.items.find(c => (c.email || '').toLowerCase() === cleanEmail);
            if (match) {
              return new Response(JSON.stringify({ verified: true, email: cleanEmail, customer: match }), { headers, status: 200 });
            }
          }
        }
      } catch (rzpErr) {
        console.warn('Razorpay check non-fatal error:', rzpErr);
      }
    }

    return new Response(JSON.stringify({
      verified: false,
      error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninja.'
    }), { headers, status: 403 });

  } catch (err) {
    console.error('Member verification error:', err);
    return new Response(JSON.stringify({ verified: false, error: 'Verification error occurred' }), { headers, status: 500 });
  }
}
