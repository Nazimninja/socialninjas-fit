// Fit Ninjas Razorpay Subscription & Payment Engine
export async function openRazorpayCheckout({ name = 'Fit Ninjas Athlete', email = '', phone = '', onSuccess, onFailure } = {}) {
  try {
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
      console.warn('Backend subscription API fallback:', e);
    }

    if (window.Razorpay) {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_placeholder',
        amount: 29900, // ₹299 in paise
        currency: 'INR',
        name: "Fit Ninjas OS",
        description: "Fit Ninjas Pro Pass — ₹299/mo",
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#2563eb"
        },
        ...(subId ? { subscription_id: subId } : {}),
        handler: async function(response) {
          if (onSuccess) onSuccess(response);
        },
        modal: {
          ondismiss: function() {
            if (onFailure) onFailure('Payment dismissed');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return;
    }

    if (onFailure) onFailure('Razorpay SDK not loaded');
  } catch (err) {
    console.error('Payment launch error:', err);
    if (onFailure) onFailure(err.message || 'Payment initiation failed');
  }
}
