export const RAZORPAY_PLAN_ID = 'plan_TZyXclmf593Ha2';
export const RAZORPAY_PAYMENT_LINK = 'https://rzp.io/rzp/akMsjt2I';

// Generate prefilled payment link with customer's entered details
export function getPrefilledPaymentLink(name = '', email = '', phone = '') {
  const base = RAZORPAY_PAYMENT_LINK;
  const params = new URLSearchParams();
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  if (cleanName && cleanName !== 'Fit Ninja Athlete') {
    params.set('name', cleanName);
    params.set('prefill[name]', cleanName);
    params.set('notes[name]', cleanName);
  }
  if (cleanEmail) {
    params.set('email', cleanEmail);
    params.set('prefill[email]', cleanEmail);
    params.set('notes[email]', cleanEmail);
  }
  if (cleanPhone) {
    params.set('contact', cleanPhone);
    params.set('phone', cleanPhone);
    params.set('prefill[contact]', cleanPhone);
    params.set('notes[phone]', cleanPhone);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Guarantee Razorpay SDK is loaded into DOM
export function ensureRazorpayLoaded() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!window.Razorpay), 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    setTimeout(() => resolve(!!window.Razorpay), 2000);
  });
}

// Fit Ninja Razorpay Official Payment Gateway Engine
export async function openRazorpayCheckout({ name = 'Fit Ninja Athlete', email = '', phone = '', onSuccess, onFailure } = {}) {
  try {
    await ensureRazorpayLoaded();

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SQHi9o325buXiH';
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    // Dynamically attempt subscription creation if server endpoint is configured
    let subId = null;
    try {
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, phone: cleanPhone })
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data.id && typeof data.id === 'string' && data.id.startsWith('sub_') && !data.id.startsWith('sub_test')) {
          subId = data.id;
        }
      }
    } catch (e) {
      console.warn('Subscription endpoint check:', e);
    }

    if (window.Razorpay) {
      const prefillObj = {};
      const readonlyObj = {};

      if (cleanName && cleanName !== 'Fit Ninja Athlete') {
        prefillObj.name = cleanName;
        readonlyObj.name = true;
      }
      if (cleanEmail) {
        prefillObj.email = cleanEmail;
        readonlyObj.email = true;
      }
      if (cleanPhone) {
        prefillObj.contact = cleanPhone;
        readonlyObj.contact = true;
      }

      const options = {
        key: razorpayKey,
        name: 'Fit Ninja',
        description: 'Fit Ninja Pro — ₹399/mo Full Access Pass',
        image: 'https://fit.socialninjas.in/ninja-emblem.png?v=20',
        prefill: prefillObj,
        readonly: readonlyObj,
        notes: {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone
        },
        theme: {
          color: '#070a12'
        },
        handler: function(response) {
          if (onSuccess) onSuccess(response);
        },
        modal: {
          confirm_close: true,
          backdropclose: false,
          ondismiss: function() {
            if (onFailure) onFailure('Payment window closed');
          }
        }
      };

      if (subId) {
        // Genuine dynamic subscription ID
        options.subscription_id = subId;
      } else {
        // Direct ₹399 charge in paise (₹399.00 = 39900 paise)
        options.amount = 39900;
        options.currency = 'INR';
      }

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          console.warn('Razorpay payment failed:', resp?.error);
          if (onFailure) onFailure(resp?.error?.description || 'Payment failed. Please try again.');
        });
        rzp.open();
        return;
      } catch (err) {
        console.warn('Direct modal error, falling back to prefilled Razorpay link:', err);
        window.open(getPrefilledPaymentLink(cleanName, cleanEmail, cleanPhone), '_blank');
        return;
      }
    }

    // If Razorpay SDK could not be loaded, open prefilled payment page
    window.open(getPrefilledPaymentLink(cleanName, cleanEmail, cleanPhone), '_blank');
    if (onFailure) {
      onFailure('Opening Razorpay checkout...');
    }
  } catch (err) {
    console.error('Payment launch error:', err);
    window.open(getPrefilledPaymentLink(name, email, phone), '_blank');
    if (onFailure) onFailure(err.message || 'Payment initiation failed');
  }
}
