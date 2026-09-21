import Razorpay from 'razorpay';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const plan_id = process.env.RAZORPAY_PLAN_ID;

    if (!key_id || !key_secret || !plan_id) {
      console.error('Missing Razorpay environment variables in api/create-subscription');
      return res.status(500).json({
        ok: false,
        error: 'Payment service configuration error'
      });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 120,
      notes: {
        name: req.body?.name || '',
        email: req.body?.email || '',
        phone: req.body?.phone || ''
      }
    };

    const response = await razorpay.subscriptions.create(options);
    
    return res.status(200).json({
      ok: true,
      id: response.id,
      entity: response.entity,
      short_url: response.short_url
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return res.status(500).json({ ok: false, error: 'Subscription creation failed' });
  }
}
