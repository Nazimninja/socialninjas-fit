const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = [
  'nazimpasha906@gmail.com',
  'nazim@socialninjas.in',
  'admin@socialninjas.in',
  'support@socialninjas.in',
  'fit@socialninjas.in'
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    if (!cleanEmail) {
      return res.status(400).json({ verified: false, error: 'Email address is required' });
    }

    // 1. Check if Admin/Owner email
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      return res.status(200).json({ verified: true, role: 'admin', email: cleanEmail });
    }

    // 2. Check Supabase DB for active subscription/user
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Query users table by email
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (user && (user.paid || user.role === 'admin' || user.subscription_status === 'active')) {
          return res.status(200).json({ verified: true, email: cleanEmail, user });
        }

        // Query subscriptions table by email
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (sub && (sub.status === 'active' || sub.status === 'authenticated')) {
          return res.status(200).json({ verified: true, email: cleanEmail, subscription: sub });
        }
      } catch (dbErr) {
        console.warn('Supabase lookup non-fatal error:', dbErr);
      }
    }

    // 3. Fallback: Check Razorpay API directly if keys available
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({ key_id, key_secret });
        const customers = await razorpay.customers.all({ count: 10 }).catch(() => null);
        
        if (customers && customers.items) {
          const match = customers.items.find(c => (c.email || '').toLowerCase() === cleanEmail);
          if (match) {
            return res.status(200).json({ verified: true, email: cleanEmail, customer: match });
          }
        }
      } catch (rzpErr) {
        console.warn('Razorpay check non-fatal error:', rzpErr);
      }
    }

    return res.status(403).json({
      verified: false,
      error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.'
    });

  } catch (err) {
    console.error('Member verification error:', err);
    return res.status(500).json({ verified: false, error: 'Verification error occurred' });
  }
}
