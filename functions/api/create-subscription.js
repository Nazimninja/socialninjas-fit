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
    const key_id = env.RAZORPAY_KEY_ID;
    const key_secret = env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return new Response(JSON.stringify({
        ok: false,
        direct_checkout: true
      }), { headers, status: 200 });
    }

    const auth = btoa(`${key_id}:${key_secret}`);
    const plan_id = env.RAZORPAY_PLAN_ID || 'plan_Ss1oHjJInUYYiV';

    const rzpResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: plan_id,
        customer_notify: 1,
        total_count: 120
      })
    });

    const data = await rzpResponse.json();
    if (!rzpResponse.ok) {
      return new Response(JSON.stringify({ ok: false, direct_checkout: true, error: data.error?.description || 'Razorpay subscription creation failed' }), { headers, status: 200 });
    }

    return new Response(JSON.stringify({
      ok: true,
      id: data.id,
      entity: data.entity,
      short_url: data.short_url
    }), { headers, status: 200 });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return new Response(JSON.stringify({ ok: false, direct_checkout: true, error: 'Subscription unavailable, use direct checkout' }), { headers, status: 200 });
  }
}
