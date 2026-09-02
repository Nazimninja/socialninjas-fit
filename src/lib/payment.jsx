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
          // Only accept a genuine Razorpay subscription ID (not mock or test fallback string)
          if (data.id && typeof data.id === 'string' && data.id.startsWith('sub_') && !data.id.startsWith('sub_test')) {
            subId = data.id;
          }
        }
      } catch (e) {
        console.warn('Subscription endpoint fallback:', e);
      }

      const options = {
        key: razorpayKey,
        name: 'Fit Ninja',
        description: 'Pro Pass Membership — ₹299/mo',
        image: 'https://fit.socialninjas.in/ninja-logo.png',
        prefill: {
          name: name || '',
          email: email || '',
          contact: phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: function(response) {
          if (onSuccess) onSuccess(response);
        },
        modal: {
          ondismiss: function() {
            if (onFailure) onFailure('Payment cancelled by user');
          }
        }
      };

      if (subId) {
        // Genuine Razorpay Subscription ID: amount and currency MUST be omitted
        options.subscription_id = subId;
      } else {
        // Direct One-Click Live Checkout (UPI QR, GPay, PhonePe, Cards, NetBanking)
        options.amount = 29900; // ₹299.00 in paise
        options.currency = 'INR';
      }

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
