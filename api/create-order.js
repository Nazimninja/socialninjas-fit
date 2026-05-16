const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SQHi9o325buXiH',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'Xhj2PoIJznFVUztdfqUJqWUV',
    });

    const payment_capture = 1;
    const amount = 299; // Amount in INR
    const currency = 'INR';

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture,
    };

    const response = await razorpay.orders.create(options);
    
    res.status(200).json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
}
