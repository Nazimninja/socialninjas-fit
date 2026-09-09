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
    let phone = null;
    let name = null;
    let amount = 499;
    let subscriptionId = null;

    if (isExpiredEvent) {
      targetStatus = 'free';
      const sub = event.payload?.subscription?.entity || {};
      subscriptionId = sub.id;
      userId = sub.notes?.user_id;
      email = sub.notes?.email || sub.notes?.brand_email;
      phone = sub.notes?.phone || sub.contact || sub.customer_details?.contact;
      name = sub.notes?.name || sub.customer_details?.name || sub.notes?.full_name || 'Athlete';
    } else if (isActivatedEvent) {
      targetStatus = 'premium';
      const entity = event.payload?.subscription?.entity || event.payload?.payment?.entity || {};
      subscriptionId = entity.id || event.payload?.subscription?.entity?.id;
      userId = entity.notes?.user_id;
      email = entity.notes?.email || entity.email || entity.customer_details?.email;
      phone = entity.notes?.phone || entity.contact || entity.customer_details?.contact;
      name = entity.notes?.name || entity.customer_details?.name || entity.notes?.full_name || 'Athlete';
      if (entity.amount) {
        amount = Math.round(entity.amount / 100);
      }
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

      const updatedData = await response.json().catch(() => null);
      console.log('[Fit Webhook] Profile updated:', updatedData);

      // Also record in scripts table (used by Fit Ninja client app for instant membership check)
      if (targetStatus === 'premium' && email) {
        try {
          const scriptsPayload = {
            name: 'fitninja_membership',
            content: {
              email: email.toLowerCase().trim(),
              status: 'active',
              plan: 'Founder Pass ₹399/mo',
              subscriptionId: subscriptionId || 'sub_manual',
              amount: amount,
              activated_at: new Date().toISOString()
            }
          };
          await fetch(`${supabaseUrl}/rest/v1/scripts`, {
            method: 'POST',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(scriptsPayload)
          });
          console.log(`[Fit Webhook] Saved fitninja_membership to scripts table for ${email}`);
        } catch (sErr) {
          console.warn('[Fit Webhook] Failed to write to scripts table:', sErr);
        }
      }

      // Forward onboarding event to Railway n8n for automated WhatsApp Welcome & Setup Guide
      if (targetStatus === 'premium') {
        try {
          const n8nWebhookUrl = process.env.N8N_FITNINJA_WELCOME_WEBHOOK || 'https://n8n-production-29f31.up.railway.app/webhook/fitninja-welcome';
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'member.onboarded',
              name: name || 'Athlete',
              phone: phone || '',
              email: (email || '').toLowerCase().trim(),
              amount,
              subscriptionId: subscriptionId || 'sub_manual',
              plan: 'Fit Ninja Pro',
              timestamp: new Date().toISOString()
            })
          });
          console.log(`[Fit Webhook] Dispatched welcome payload to n8n for ${email}`);
        } catch (n8nErr) {
          console.warn('[Fit Webhook] Failed to forward to n8n:', n8nErr);
        }
      }

      return res.status(200).json({ success: true, updated: true, status: targetStatus });
    }

    return res.status(200).json({ success: true, message: 'Event logged, no action taken' });

  } catch (error) {
    console.error('[Fit Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
