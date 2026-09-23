import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function sha256Hex(str) {
  if (!str) return null;
  return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
}

async function sendMetaConversionsApiPurchase({ email, phone, name, subscriptionId, amount, fbp, fbc }) {
  const pixelId = process.env.META_PIXEL_ID || '1022819360737558';
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('[Meta CAPI] Skipping CAPI event: META_ACCESS_TOKEN not configured.');
    return;
  }

  try {
    const hashedEmail = sha256Hex(email);
    let cleanDigits = (phone || '').replace(/\D/g, '');
    const hashedPhone = cleanDigits ? sha256Hex(cleanDigits) : null;
    let firstName = (name || '').trim().split(' ')[0] || '';
    const hashedFirstName = firstName ? sha256Hex(firstName) : null;

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

    if (process.env.META_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_TEST_EVENT_CODE;
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Fit Webhook] RAZORPAY_WEBHOOK_SECRET environment variable is missing.');
    return res.status(500).json({ error: 'Server configuration error: Webhook secret not set' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    console.warn('[Fit Webhook] Missing x-razorpay-signature header.');
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
  }

  // 1. Read exact raw body and verify HMAC SHA-256 signature
  let rawBody = '';
  try {
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else {
      rawBody = await getRawBody(req);
    }
  } catch (err) {
    console.error('[Fit Webhook] Failed to read request body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    console.warn('[Fit Webhook] Invalid signature received.');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.warn('[Fit Webhook] Invalid JSON payload received.');
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

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
    let amount = 99; // Default to promo ₹99 launch pass for day 1
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
      const isInitialActivation = (event.event === 'subscription.activated' || event.event === 'subscription.authenticated');
      const isNotRenewalEvent = event.event !== 'subscription.charged';
      const isDay1Amount = amount <= 100;
      const isInitialCycle = paidCount === 0;

      const isInitialPurchase = isInitialActivation && isNotRenewalEvent && isDay1Amount && isInitialCycle && Boolean(subscriptionId);
      if (isInitialPurchase) {
        sendMetaConversionsApiPurchase({
          email: (email || '').toLowerCase().trim(),
          phone,
          name,
          subscriptionId,
          amount,
          fbp,
          fbc
        }).catch(e => console.warn('[Meta CAPI] error:', e));
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
              email: (email || '').toLowerCase().trim(),
              amount,
              subscriptionId: subscriptionId || 'sub_manual',
              razorpay_payment_id: subscriptionId || '',
              plan: 'Fit Ninja Pro',
              source: 'razorpay_server_webhook',
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
