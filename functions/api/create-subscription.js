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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers, status: 405 });
  }

  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    const key_id = (env.RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '');
    const key_secret = (env.RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');
    const plan_id = (env.RAZORPAY_PLAN_ID || '').trim().replace(/^["']|["']$/g, '');
    const offer_id = env.RAZORPAY_OFFER_ID || null;

    if (!key_id || !key_secret || !plan_id) {
      console.error('Missing Razorpay environment variables in functions/api/create-subscription');
      return new Response(JSON.stringify({
        ok: false,
        error: 'Payment service configuration error',
        debug: {
          has_key_id: !!key_id,
          has_key_secret: !!key_secret,
          has_plan_id: !!plan_id
        }
      }), { headers, status: 500 });
    }

    const auth = btoa(`${key_id}:${key_secret}`);

    // Schedule monthly recurring billing to begin in 30 days
    const nowUnix = Math.floor(Date.now() / 1000);
    const startAt = nowUnix + (30 * 24 * 60 * 60);

    const subPayload = {
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 120,
      start_at: startAt,
      addons: [
        {
          item: {
            name: 'Launch Offer - Month 1 Access',
            amount: 9900, // ₹99.00 in paise upfront charge
            currency: 'INR'
          }
        }
      ],
      notes: {
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        plan_intro: '99_first_month',
        plan_recurring: '399_monthly',
        ...(body.fbp ? { fbp: body.fbp } : {}),
        ...(body.fbc ? { fbc: body.fbc } : {})
      }
    };
    if (offer_id) {
      subPayload.offer_id = offer_id;
    }

    const rzpResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subPayload)
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('Razorpay API response error:', rzpData);
      return new Response(JSON.stringify({
        ok: false,
        error: rzpData.error?.description || 'Failed to create subscription',
        code: rzpData.error?.code,
        debug: {
          key_prefix: key_id.substring(0, 8),
          key_length: key_id.length,
          secret_length: key_secret.length,
          plan_id: plan_id
        }
      }), { headers, status: rzpResponse.status });
    }

    return new Response(JSON.stringify({
      ok: true,
      id: rzpData.id,
      entity: rzpData.entity,
      short_url: rzpData.short_url,
      key_id: key_id
    }), { headers, status: 200 });

  } catch (error) {
    console.error('Edge Function Subscription Error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Subscription creation failed'
    }), { headers, status: 500 });
  }
}
