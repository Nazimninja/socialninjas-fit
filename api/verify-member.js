const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, subscription_id } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail && !subscription_id) {
      return res.status(400).json({ verified: false, error: 'Email or subscription ID required' });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      const razorpay = new Razorpay({ key_id, key_secret });

      if (subscription_id) {
        const sub = await razorpay.subscriptions.fetch(subscription_id).catch(() => null);
        if (sub && (sub.status === 'active' || sub.status === 'authenticated' || sub.paid_count > 0)) {
          return res.status(200).json({ verified: true, subscription: sub });
        }
      }
    }

    return res.status(403).json({ verified: false, error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.' });
  } catch (err) {
    console.error('Member verification error:', err);
    return res.status(500).json({ verified: false, error: 'Verification failed' });
  }
}
