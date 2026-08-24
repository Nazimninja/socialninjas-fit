// Fit Ninja Razorpay Subscription & Payment Engine
export async function openRazorpayCheckout({ name = 'Fit Ninja Athlete', email = '', phone = '', onSuccess, onFailure } = {}) {
  try {
    const res = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });

    const data = await res.json();

    if (data && data.id && window.Razorpay) {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_placeholder',
        subscription_id: data.id,
        name: "Fit Ninja OS",
        description: "Fit Ninja Pro Pass — ₹299/mo",
        image: "/ninja-logo.png",
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#f59e0b"
        },
        handler: function(response) {
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
    } else if (data.short_url) {
      window.location.href = data.short_url;
    } else {
      console.warn('Razorpay subscription returned without direct ID, fallback available.');
    }
  } catch (err) {
    console.error('Payment launch error:', err);
    if (onFailure) onFailure(err.message || 'Payment initiation failed');
  }
}
