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

async function sha256Hex(str) {
  if (!str) return null;
  const buffer = new TextEncoder().encode(str.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Meta Conversions API (CAPI) Server-Side Purchase Dispatcher
async function sendMetaConversionsApiPurchase(env, { email, phone, name, subscriptionId, amount, fbp, fbc }) {
  const pixelId = env.META_PIXEL_ID || '1022819360737558';
  const accessToken = env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('[Meta CAPI] Skipping CAPI event: META_ACCESS_TOKEN not configured in Cloudflare Pages.');
    return;
  }

  try {
    const hashedEmail = await sha256Hex(email);
    let cleanDigits = (phone || '').replace(/\D/g, '');
    const hashedPhone = cleanDigits ? await sha256Hex(cleanDigits) : null;
    let firstName = (name || '').trim().split(' ')[0] || '';
    const hashedFirstName = firstName ? await sha256Hex(firstName) : null;

    const eventId = subscriptionId;
    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: 'https://fit.socialninjas.in/',
          action_source: 'website',
          user_data: {
            em: hashedEmail ? [hashedEmail] : [],
            ph: hashedPhone ? [hashedPhone] : [],
            fn: hashedFirstName ? [hashedFirstName] : [],
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {})
          },
          custom_data: {
            currency: 'INR',
            value: amount || 399
          }
        }
      ]
    };

    if (env.META_TEST_EVENT_CODE) {
      payload.test_event_code = env.META_TEST_EVENT_CODE;
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    console.log('[Meta CAPI] Purchase response:', res.status, resData);
  } catch (err) {
    console.warn('[Meta CAPI] Failed to dispatch CAPI purchase:', err.message);
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
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Fit Webhook] RAZORPAY_WEBHOOK_SECRET environment variable is missing.');
    return new Response(JSON.stringify({ error: 'Server configuration error: Webhook secret not set' }), { headers, status: 500 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    console.warn('[Fit Webhook] Missing x-razorpay-signature header.');
    return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), { headers, status: 400 });
  }

  // 1. Verify webhook signature against raw request body
  const isValid = await verifyHmacSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.warn('[Fit Webhook] Invalid signature received.');
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { headers, status: 400 });
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
    'subscription.authenticated',
    'payment.captured',
    'order.paid'
  ].includes(eventName);

  try {
    let targetStatus = null;
    let userId = null;
    let email = null;
    let phone = null;
    let name = null;
    let amount = 99; // Default to promo ₹99 launch pass for day 1
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
      const subEntity = event.payload?.subscription?.entity;
      const payEntity = event.payload?.payment?.entity;
      const entity = subEntity || payEntity || {};
      subscriptionId = subEntity?.id || (entity.id?.startsWith('sub_') ? entity.id : null) || entity.notes?.subscription_id;
      userId = entity.notes?.user_id;
      email = entity.notes?.email || entity.email || entity.customer_details?.email;
      phone = entity.notes?.phone || entity.contact || entity.customer_details?.contact;
      name = entity.notes?.name || entity.customer_details?.name || entity.notes?.full_name || 'Athlete';
      const fbp = entity.notes?.fbp || subEntity?.notes?.fbp || null;
      const fbc = entity.notes?.fbc || subEntity?.notes?.fbc || null;
      
      // Accurately extract the actual amount charged from payment or entity
      const chargedPaise = payEntity?.amount || entity.amount;
      if (chargedPaise) {
        amount = Math.round(chargedPaise / 100);
      } else {
        amount = 99;
      }

      // Meta Conversions API (CAPI): Fire Purchase on initial subscription activation / first charge
      // event_id matches browser client eventID (subscriptionId) for perfect 1:1 deduplication
      const isInitialPurchase = ['subscription.activated', 'subscription.charged', 'order.paid'].includes(eventName) || (eventName === 'payment.captured' && subscriptionId);
      if (isInitialPurchase && subscriptionId) {
        const capiPromise = sendMetaConversionsApiPurchase(env, {
          email: (email || '').toLowerCase().trim(),
          phone,
          name,
          subscriptionId,
          amount,
          fbp,
          fbc
        });
        if (context && typeof context.waitUntil === 'function') {
          context.waitUntil(capiPromise);
        } else {
          capiPromise.catch(e => console.warn('[Meta CAPI] error:', e));
        }
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
          const cleanPhoneStr = String(phone || '').trim();
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'member.onboarded',
              name: name || 'Athlete',
              phone: cleanPhoneStr,
              contact: cleanPhoneStr,
              phone_number: cleanPhoneStr,
              whatsapp: cleanPhoneStr,
              mobile: cleanPhoneStr,
              digits_phone: cleanPhoneStr.replace(/\D/g, ''),
              email: cleanEmail,
              amount,
              subscriptionId: subscriptionId || 'sub_manual',
              razorpay_payment_id: subscriptionId || '',
              plan: 'Fit Ninja Pro',
              source: 'cloudflare_pages_webhook',
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
