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
            value: amount || 99
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

      // Meta Conversions API (CAPI): Fire Purchase ONLY on initial subscription activation / Day 1 Launch Pass (₹99)
      // NEVER fire on subsequent monthly renewals (subscription.charged / ₹399 / paid_count > 0)
      // to prevent inflating new-customer conversions and corrupting Meta Ad ROAS.
      const paidCount = typeof subEntity?.paid_count === 'number' ? subEntity.paid_count : 0;
      const isInitialActivation = (eventName === 'subscription.activated' || eventName === 'subscription.authenticated');
      const isNotRenewalEvent = eventName !== 'subscription.charged';
      const isDay1Amount = amount <= 100; // Promo Launch Pass is ₹99; renewals are ₹399
      const isInitialCycle = paidCount === 0;

      const isInitialPurchase = isInitialActivation && isNotRenewalEvent && isDay1Amount && isInitialCycle && Boolean(subscriptionId);
      if (isInitialPurchase) {
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

    if (targetStatus) {
      const cleanEmail = (email || '').toLowerCase().trim();
      const rawPhone = String(phone || '').trim();
      let digits = rawPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        digits = '91' + digits;
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = '91' + digits.slice(1);
      }
      const e164Phone = digits ? `+${digits}` : rawPhone;
      const local10 = digits.length >= 10 ? digits.slice(-10) : digits;

      // 1. Forward onboarding event to Railway n8n for automated WhatsApp Welcome & Setup Guide
      if (targetStatus === 'premium') {
        try {
          const n8nWebhookUrl = env.N8N_FITNINJA_WELCOME_WEBHOOK || 'https://n8n-production-29f31.up.railway.app/webhook/fitninja-welcome';
          const n8nPayload = {
            event: 'member.onboarded',
            name: name || 'Athlete',
            phone: e164Phone,
            whatsapp: digits,
            contact: digits,
            phone_number: digits,
            mobile: digits,
            digits_phone: digits,
            formatted_phone: e164Phone,
            local_phone: local10,
            wa_link: digits ? `https://wa.me/${digits}` : '',
            to: digits,
            recipient: digits,
            email: cleanEmail,
            amount,
            subscriptionId: subscriptionId || payEntity?.id || 'sub_manual',
            razorpay_payment_id: payEntity?.id || subscriptionId || '',
            plan: 'Fit Ninja Pro',
            source: 'cloudflare_pages_webhook',
            timestamp: new Date().toISOString()
          };

          const n8nPromise = fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
          });

          if (context && typeof context.waitUntil === 'function') {
            context.waitUntil(n8nPromise);
          } else {
            await n8nPromise;
          }
          console.log(`[Fit Webhook] Dispatched welcome payload to n8n for ${cleanEmail || digits}`);
        } catch (n8nErr) {
          console.warn('[Fit Webhook] Failed to forward to n8n:', n8nErr);
        }
      }

      // 2. Resilient Supabase sync (scripts & leads tables)
      const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const topicKey = cleanEmail || digits || 'athlete';

        // A. Record in scripts table
        try {
          const scriptsPayload = {
            profile: 'fitninja_membership',
            topic: topicKey,
            section1: JSON.stringify({
              email: cleanEmail,
              name: name || 'Athlete',
              phone: e164Phone || digits,
              paid: targetStatus === 'premium',
              status: targetStatus === 'premium' ? 'active' : 'cancelled',
              plan: 'Fit Ninja Pro',
              subscriptionId: subscriptionId || payEntity?.id || 'sub_manual',
              amount: amount,
              updated_at: new Date().toISOString()
            }),
            caption: targetStatus === 'premium' ? 'active' : 'cancelled'
          };

          const checkRes = await fetch(`${supabaseUrl}/rest/v1/scripts?profile=eq.fitninja_membership&topic=eq.${encodeURIComponent(topicKey)}&select=id`, {
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`
            }
          });
          const existing = await checkRes.json().catch(() => []);

          if (Array.isArray(existing) && existing.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/scripts?id=eq.${existing[0].id}`, {
              method: 'PATCH',
              headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(scriptsPayload)
            });
          } else {
            await fetch(`${supabaseUrl}/rest/v1/scripts`, {
              method: 'POST',
              headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(scriptsPayload)
            });
          }
        } catch (sErr) {
          console.warn('[Fit Webhook] Failed to write to scripts table:', sErr);
        }

        // B. Record in leads table
        try {
          await fetch(`${supabaseUrl}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              name: name || 'Athlete',
              email: cleanEmail || `${digits || 'athlete'}@fitninja.app`,
              phone: e164Phone || digits || '',
              status: targetStatus === 'premium' ? 'PAID PRO MEMBER' : 'CANCELLED',
              notes: `Razorpay payment: ${subscriptionId || payEntity?.id || 'verified'}`
            })
          });
        } catch (leadErr) {
          console.warn('[Fit Webhook] Failed to write to leads table:', leadErr);
        }

        // C. Update Supabase Auth user metadata
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          try {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
              method: 'PUT',
              headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                app_metadata: { plan_status: targetStatus, paid: targetStatus === 'premium' }
              })
            });
          } catch (_) {}
        }
      }

      console.log(`[Fit Webhook] Processed ${eventName} for ${cleanEmail || digits}: ${targetStatus}`);
      return new Response(JSON.stringify({ success: true, status: targetStatus }), { headers, status: 200 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Event acknowledged (no status change)' }), { headers, status: 200 });
  } catch (err) {
    console.error('[Fit Webhook] Error processing event:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
