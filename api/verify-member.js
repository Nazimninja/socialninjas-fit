import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const ADMIN_EMAILS = [
  'nazim.socialninja@gmail.com',
  'nazimpasha906@gmail.com',
  'nazim@socialninjas.in',
  'admin@socialninjas.in',
  'support@socialninjas.in',
  'fit@socialninjas.in'
];

export default async function handler(req, res) {
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMwMzAsImV4cCI6MjEwMDQ2OTAzMH0.qt4ty1tjGeXMthhSaDZZo80u_JdPK4klUg3QAIhN0nw';

    const candidates = [cleanEmail];
    const digits = cleanEmail.replace(/\D/g, '');
    if (digits.length >= 10) {
      if (!cleanEmail.startsWith('+')) candidates.push('+' + digits);
      candidates.push(digits);
      if (digits.length === 10) candidates.push('+91' + digits);
      if (digits.startsWith('91') && digits.length === 12) candidates.push(digits.slice(2));
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // 2a. Query scripts table for fitninja_membership
        const { data: memRows } = await supabase
          .from('scripts')
          .select('*')
          .eq('profile', 'fitninja_membership')
          .in('topic', candidates)
          .limit(1);

        if (memRows && memRows.length > 0) {
          return res.status(200).json({ verified: true, email: cleanEmail, source: 'fitninja_membership' });
        }

        // 2b. Query scripts table for existing synced user state
        const { data: stateRows } = await supabase
          .from('scripts')
          .select('*')
          .eq('profile', 'fitninja_user_state')
          .in('topic', candidates)
          .limit(1);

        if (stateRows && stateRows.length > 0) {
          return res.status(200).json({ verified: true, email: cleanEmail, source: 'fitninja_user_state' });
        }

        // 2c. Query leads table for CRM recorded payment
        const { data: leadRows } = await supabase
          .from('leads')
          .select('*')
          .or(`email.in.(${candidates.map(c => `"${c}"`).join(',')}),phone.in.(${candidates.map(c => `"${c}"`).join(',')})`)
          .limit(1);

        if (leadRows && leadRows.length > 0 && (leadRows[0].status?.includes('PAID') || leadRows[0].status?.includes('MEMBER'))) {
          return res.status(200).json({ verified: true, email: cleanEmail, source: 'leads' });
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
        const razorpay = new Razorpay({ key_id, key_secret });
        const customers = await razorpay.customers.all({ count: 20 }).catch(() => null);
        
        if (customers && customers.items) {
          const match = customers.items.find(c => {
            const em = (c.email || '').toLowerCase().trim();
            const ph = (c.contact || '').replace(/\D/g, '');
            return candidates.includes(em) || (ph && candidates.some(cand => cand.includes(ph)));
          });
          if (match) {
            return res.status(200).json({ verified: true, email: cleanEmail, customer: match, source: 'razorpay' });
          }
        }
      } catch (rzpErr) {
        console.warn('Razorpay check non-fatal error:', rzpErr);
      }
    }

    return res.status(403).json({
      verified: false,
      error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninja.'
    });

  } catch (err) {
    console.error('Member verification error:', err);
    return res.status(500).json({ verified: false, error: 'Verification error occurred' });
  }
}
