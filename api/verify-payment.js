const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
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
