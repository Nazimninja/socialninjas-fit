const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      plan_id: 'plan_Ss1oHjJInUYYiV',
      customer_notify: 1,
      total_count: 120, // Max billing cycles
    };

    const response = await razorpay.subscriptions.create(options);
    
    res.status(200).json({
      id: response.id,
      entity: response.entity,
      short_url: response.short_url
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: 'Error creating Razorpay subscription' });
  }
}
