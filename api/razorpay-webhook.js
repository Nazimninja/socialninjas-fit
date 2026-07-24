const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Verify webhook signature if secret is configured
  if (webhookSecret && signature) {
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = req.body;
  console.log(`[Fit Webhook] Event received: ${event.event}`);

  // 2. Handle cancellation/failed payment events
  const isExpiredEvent = [
    'subscription.cancelled',
    'subscription.halted',
    'subscription.expired',
    'subscription.paused'
  ].includes(event.event);

  const isActivatedEvent = [
    'subscription.activated',
    'subscription.charged',
    'payment.captured'
  ].includes(event.event);

  try {
    let targetStatus = null;
    let userId = null;
    let email = null;

    if (isExpiredEvent) {
      targetStatus = 'free';
      const sub = event.payload.subscription.entity;
      userId = sub.notes?.user_id;
      email = sub.notes?.email || sub.notes?.brand_email;
    } else if (isActivatedEvent) {
      targetStatus = 'premium';
      const entity = event.payload.subscription ? event.payload.subscription.entity : event.payload.payment.entity;
      userId = entity.notes?.user_id;
      email = entity.notes?.email || entity.email;
    }

    if (targetStatus && (userId || email)) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('[Fit Webhook] Missing Supabase configuration environment variables.');
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      // Build update query - prefer user_id, fall back to email
      let queryUrl = `${supabaseUrl}/rest/v1/profiles`;
      if (userId) {
        queryUrl += `?id=eq.${encodeURIComponent(userId)}`;
      } else {
        queryUrl += `?email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
      }

      console.log(`[Fit Webhook] Updating profile plan_status to: ${targetStatus} | Query: ${queryUrl}`);

      const response = await fetch(queryUrl, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          plan_status: targetStatus
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Fit Webhook] Supabase update failed: ${errText}`);
        return res.status(response.status).json({ error: 'Supabase update failed' });
      }

      const updatedData = await response.json();
      console.log('[Fit Webhook] Profile updated successfully:', JSON.stringify(updatedData));
      return res.status(200).json({ success: true, updated: true, status: targetStatus });
    }

    return res.status(200).json({ success: true, message: 'Event logged, no action taken' });

  } catch (error) {
    console.error('[Fit Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
