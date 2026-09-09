export const RAZORPAY_PLAN_ID = 'plan_TZ9fEut1yueEFq';
export const RAZORPAY_OFFER_ID = 'offer_TZsCZbv2nXVhQJ';
export const RAZORPAY_DEFAULT_SUB_ID = 'sub_TZsEtY4WuCV7AO';
export const RAZORPAY_PAYMENT_LINK = 'https://rzp.io/rzp/lZMpJppl';

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
        description: 'Fit Ninja Pro — Special Offer Applied (LevelUp75)',
        image: 'https://fit.socialninjas.in/ninja-logo.png',
        offer_id: RAZORPAY_OFFER_ID,
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
        // Genuine dynamic Razorpay Subscription ID
        options.subscription_id = subId;
      } else {
        // Recurring monthly subscription with offer (sub_TZsEtY4WuCV7AO)
        options.subscription_id = RAZORPAY_DEFAULT_SUB_ID;
      }

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Direct modal error, falling back to direct Razorpay link:', err);
        window.open(RAZORPAY_PAYMENT_LINK, '_blank');
        return;
      }
    }

    if (onFailure) {
      onFailure('Opening Razorpay payment...');
      window.open(RAZORPAY_PAYMENT_LINK, '_blank');
    }
  } catch (err) {
    console.error('Payment launch error:', err);
    window.open(RAZORPAY_PAYMENT_LINK, '_blank');
    if (onFailure) onFailure(err.message || 'Payment initiation failed');
  }
}
