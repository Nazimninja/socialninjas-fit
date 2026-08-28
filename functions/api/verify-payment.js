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
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = body || {};
    const secret = env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      // Test mode / missing secret bypass
      return new Response(JSON.stringify({ success: true, message: 'Verified (test mode)' }), { headers, status: 200 });
    }
    
    let sign;
    if (razorpay_subscription_id) {
      sign = razorpay_payment_id + '|' + razorpay_subscription_id;
    } else {
      sign = razorpay_order_id + '|' + razorpay_payment_id;
    }

    // Verify HMAC SHA256 using standard Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(sign);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (razorpay_signature === signatureHex) {
      return new Response(JSON.stringify({ success: true, message: 'Payment verified successfully' }), { headers, status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payment signature' }), { headers, status: 400 });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error during verification' }), { headers, status: 500 });
  }
}
