// Cloudflare Pages Function: Razorpay Webhook Handler
// Handles subscription activation, recurring renewals, payment capture, and cancellations

async function verifyHmacSignature(bodyText, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(bodyText)
    );
    const hashArray = Array.from(new Uint8Array(signatureBytes));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash.toLowerCase() === signature.toLowerCase();
  } catch (err) {
    console.error('HMAC verification error:', err);
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers, status: 405 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Verify webhook signature if secret is configured in Cloudflare environment
  if (webhookSecret && signature) {
    const isValid = await verifyHmacSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('[Fit Webhook] Invalid signature received.');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { headers, status: 400 });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { headers, status: 400 });
  }

  const eventName = event.event || '';
  console.log(`[Fit Webhook] Event received: ${eventName}`);

  const isExpiredEvent = [
    'subscription.cancelled',
    'subscription.halted',
    'subscription.expired',
    'subscription.paused'
  ].includes(eventName);

  const isActivatedEvent = [
    'subscription.activated',
    'subscription.charged',
    'payment.captured',
    'order.paid'
  ].includes(eventName);

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
      email = sub.notes?.email || sub.notes?.brand_email || sub.customer_details?.email;
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

    const cleanEmail = (email || '').toLowerCase().trim();

    if (targetStatus && (userId || cleanEmail)) {
      const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('[Fit Webhook] Supabase credentials not configured in Cloudflare Pages.');
        return new Response(JSON.stringify({ ok: true, notice: 'Supabase credentials missing' }), { headers, status: 200 });
      }

      // Update profiles table
      let profileUrl = `${supabaseUrl}/rest/v1/profiles`;
      if (userId) {
        profileUrl += `?id=eq.${encodeURIComponent(userId)}`;
      } else {
        profileUrl += `?email=eq.${encodeURIComponent(cleanEmail)}`;
      }

      await fetch(profileUrl, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          plan_status: targetStatus,
          updated_at: new Date().toISOString()
        })
      });

      // Update or insert into subscriptions table
      if (cleanEmail) {
        await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            email: cleanEmail,
            phone: phone || null,
            subscription_id: subscriptionId || 'sub_manual',
            status: targetStatus === 'premium' ? 'active' : 'cancelled',
            updated_at: new Date().toISOString()
          })
        });
      }

      // Forward onboarding event to Railway n8n for automated WhatsApp Welcome & Setup Guide
      if (targetStatus === 'premium') {
        try {
          const n8nWebhookUrl = env.N8N_FITNINJA_WELCOME_WEBHOOK || 'https://n8n-production-29f31.up.railway.app/webhook/fitninja-welcome';
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'member.onboarded',
              name: name || 'Athlete',
              phone: phone || '',
              email: cleanEmail,
              amount,
              subscriptionId: subscriptionId || 'sub_manual',
              plan: 'Fit Ninja Pro',
              timestamp: new Date().toISOString()
            })
          });
          console.log(`[Fit Webhook] Dispatched welcome payload to n8n for ${cleanEmail}`);
        } catch (n8nErr) {
          console.warn('[Fit Webhook] Failed to forward to n8n:', n8nErr);
        }
      }

      console.log(`[Fit Webhook] Processed ${eventName} for ${cleanEmail || userId}: ${targetStatus}`);
      return new Response(JSON.stringify({ success: true, status: targetStatus }), { headers, status: 200 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Event acknowledged (no status change)' }), { headers, status: 200 });
  } catch (err) {
    console.error('[Fit Webhook] Error processing event:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
