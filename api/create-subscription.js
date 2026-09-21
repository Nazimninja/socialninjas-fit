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
    const key_id = (process.env.RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '');
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');
    const plan_id = (process.env.RAZORPAY_PLAN_ID || '').trim().replace(/^["']|["']$/g, '');

    if (!key_id || !key_secret || !plan_id) {
      console.error('Missing Razorpay environment variables in api/create-subscription');
      return res.status(500).json({
        ok: false,
        error: 'Payment service configuration error',
        debug: {
          has_key_id: !!key_id,
          has_key_secret: !!key_secret,
          has_plan_id: !!plan_id
        }
      });
    }

    const { name, email, phone, fbp, fbc } = req.body || {};
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: plan_id,
        customer_notify: 1,
        total_count: 120,
        notes: {
          name: name || '',
          email: email || '',
          phone: phone || '',
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {})
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data.error?.description || 'Failed to create subscription',
        code: data.error?.code,
        debug: {
          key_prefix: key_id.substring(0, 8),
          key_length: key_id.length,
          secret_length: key_secret.length,
          plan_id: plan_id
        }
      });
    }

    return res.status(200).json({
      ok: true,
      id: data.id,
      key_id: key_id,
      entity: data.entity,
      short_url: data.short_url
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return res.status(500).json({ ok: false, error: 'Subscription creation failed' });
  }
}
