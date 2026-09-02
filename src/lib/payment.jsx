import { useUI } from '../store/useUI.js'

// Fit Ninja Razorpay Official Payment Gateway Engine
export async function openRazorpayCheckout({ name = 'Fit Ninja Athlete', email = '', phone = '', onSuccess, onFailure } = {}) {
  try {
    // Uses VITE_RAZORPAY_KEY_ID or fallback to official live key rzp_live_SQHi9o325buXiH
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SQHi9o325buXiH';

    if (window.Razorpay) {
      let subId = null;
      try {
        const res = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone })
        });
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          subId = data.id || null;
        }
      } catch (e) {
        console.warn('Subscription endpoint fallback:', e);
      }

      const options = {
        key: razorpayKey,
        amount: 29900, // ₹299.00 INR in paise
        currency: 'INR',
        name: 'Fit Ninja OS',
        description: 'Fit Ninja All-Access Pro Pass — ₹299/mo',
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#2563eb'
        },
        ...(subId ? { subscription_id: subId } : {}),
        handler: function(response) {
          if (onSuccess) onSuccess(response);
        },
        modal: {
          ondismiss: function() {
            if (onFailure) onFailure('Payment cancelled by user');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return;
    }

    if (onFailure) onFailure('Razorpay SDK loading. Please refresh and try again.');
  } catch (err) {
    console.error('Payment launch error:', err);
    if (onFailure) onFailure(err.message || 'Payment initiation failed');
  }
}
