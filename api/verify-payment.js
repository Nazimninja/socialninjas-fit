import crypto from 'crypto';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed = !origin || origin === 'https://fit.socialninjas.in' || origin === 'https://socialninjas.in' || origin.endsWith('.socialninjas.in') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'https://fit.socialninjas.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body || {};
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not configured on server');
      return res.status(500).json({ success: false, error: 'Payment verification service unconfigured' });
    }

    if (!razorpay_signature || !razorpay_payment_id || (!razorpay_order_id && !razorpay_subscription_id)) {
      return res.status(400).json({ success: false, message: 'Missing payment signature verification parameters' });
    }
    
    let sign;
    if (razorpay_subscription_id) {
      sign = razorpay_payment_id + '|' + razorpay_subscription_id;
    } else {
      sign = razorpay_order_id + '|' + razorpay_payment_id;
    }

    const expectedSign = crypto
      .createHmac('sha256', secret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
}
