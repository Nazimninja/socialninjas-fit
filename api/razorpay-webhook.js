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
    'subscription.authenticated',
    'payment.captured',
    'order.paid'
  ].includes(event.event);

  try {
    let targetStatus = null;
    let userId = null;
    let email = null;
    let phone = null;
    let name = null;
    let amount = 99; // Default to promo ₹99 launch pass for day 1
    let subscriptionId = null;

    const subEntity = event.payload?.subscription?.entity;
    const payEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const entity = subEntity || payEntity || orderEntity || {};

    if (isExpiredEvent) {
      targetStatus = 'free';
      subscriptionId = subEntity?.id || entity.notes?.subscription_id;
      userId = entity.notes?.user_id;
      email = entity.notes?.email || entity.notes?.brand_email || entity.email || entity.customer_details?.email;
      phone = entity.notes?.phone || entity.contact || entity.customer_details?.contact;
      name = entity.notes?.name || entity.customer_details?.name || entity.notes?.full_name || 'Athlete';
    } else if (isActivatedEvent) {
      targetStatus = 'premium';
      subscriptionId = subEntity?.id || (entity.id?.startsWith('sub_') ? entity.id : null) || entity.notes?.subscription_id;
      userId = entity.notes?.user_id;
      email = entity.notes?.email || entity.email || entity.customer_details?.email || subEntity?.notes?.email || payEntity?.email;
      phone = entity.notes?.phone || entity.contact || entity.customer_details?.contact || subEntity?.notes?.phone || payEntity?.contact;
      name = entity.notes?.name || entity.customer_details?.name || entity.notes?.full_name || subEntity?.notes?.name || 'Athlete';
      const fbp = entity.notes?.fbp || subEntity?.notes?.fbp || null;
      const fbc = entity.notes?.fbc || subEntity?.notes?.fbc || null;
      
      const chargedPaise = payEntity?.amount || entity.amount;
      if (chargedPaise) {
        amount = Math.round(chargedPaise / 100);
      } else {
        amount = 99;
      }

      // Meta Conversions API (CAPI): Fire Purchase ONLY on initial subscription activation / Day 1 Launch Pass (₹99)
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

      // 1. FORWARD ONBOARDING EVENT TO RAILWAY N8N FOR AUTOMATED WHATSAPP WELCOME
      if (targetStatus === 'premium') {
        try {
          const n8nWebhookUrl = process.env.N8N_FITNINJA_WELCOME_WEBHOOK || 'https://n8n-production-29f31.up.railway.app/webhook/fitninja-welcome';
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
            source: 'razorpay_server_webhook',
            timestamp: new Date().toISOString()
          };

          const n8nRes = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
          });
          console.log(`[Fit Webhook] Dispatched welcome payload to n8n (Status ${n8nRes.status}) for ${cleanEmail || digits}`);
        } catch (n8nErr) {
          console.warn('[Fit Webhook] Failed to forward to n8n:', n8nErr);
        }
      }

      // 2. RESILIENT SUPABASE RECORDING (scripts & leads tables)
      const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_CRM_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const topicKey = cleanEmail || digits || 'athlete';

        // A. Record in scripts table (used by Fit Ninja client app for instant membership check)
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
          console.log(`[Fit Webhook] Saved fitninja_membership to scripts table for ${topicKey}`);
        } catch (sErr) {
          console.warn('[Fit Webhook] Failed to write to scripts table:', sErr);
        }

        // B. Record in leads table (Agency CRM & Admin Dashboard)
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
          console.log(`[Fit Webhook] Saved lead to CRM leads table for ${cleanEmail || digits}`);
        } catch (leadErr) {
          console.warn('[Fit Webhook] Failed to write to leads table:', leadErr);
        }

        // C. Update Supabase Auth user metadata (if userId is valid UUID)
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

        // D. Non-fatal attempt to update profiles table if present
        try {
          const profUrl = userId
            ? `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`
            : (cleanEmail ? `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(cleanEmail)}` : null);
          if (profUrl) {
            await fetch(profUrl, {
              method: 'PATCH',
              headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ plan_status: targetStatus })
            });
          }
        } catch (_) {}
      }

      return res.status(200).json({ success: true, updated: true, status: targetStatus });
    }

    return res.status(200).json({ success: true, message: 'Event logged, no action taken' });

  } catch (error) {
    console.error('[Fit Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
