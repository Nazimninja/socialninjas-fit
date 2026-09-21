// Fit Ninja Meta Pixel Official Tracking Engine
// Pixel ID: 1022819360737558

export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '1022819360737558';

/**
 * Checks if window.fbq is initialized
 */
export function isPixelAvailable() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Track standard PageView
 */
export function trackPageView() {
  if (isPixelAvailable()) {
    try {
      window.fbq('track', 'PageView');
    } catch (e) {
      console.warn('[Meta Pixel] PageView error:', e);
    }
  }
}

/**
 * Track ViewContent on Pricing section or membership view
 */
export function trackViewContent({
  content_name = 'Fit Ninja Pro Pass',
  content_category = 'Subscription',
  value = 399,
  currency = 'INR'
} = {}) {
  if (isPixelAvailable()) {
    try {
      window.fbq('track', 'ViewContent', {
        content_name,
        content_category,
        value,
        currency
      });
    } catch (e) {
      console.warn('[Meta Pixel] ViewContent error:', e);
    }
  }
}

/**
 * Track CompleteRegistration when user submits registration or completes assessment
 */
export function trackCompleteRegistration({
  content_name = 'Fit Ninja Athlete Account',
  status = true,
  method = 'email_phone'
} = {}) {
  if (isPixelAvailable()) {
    try {
      window.fbq('track', 'CompleteRegistration', {
        content_name,
        status: status ? 'success' : 'failed',
        method
      });
    } catch (e) {
      console.warn('[Meta Pixel] CompleteRegistration error:', e);
    }
  }
}

/**
 * Track InitiateCheckout when Razorpay checkout opens
 */
export function trackInitiateCheckout({
  content_name = 'Fit Ninja Pro Pass',
  value = 399,
  currency = 'INR',
  event_id = null
} = {}) {
  if (isPixelAvailable()) {
    try {
      const options = event_id ? { eventID: event_id } : undefined;
      window.fbq('track', 'InitiateCheckout', {
        content_name,
        content_category: 'Subscription',
        value,
        currency,
        num_items: 1
      }, options);
    } catch (e) {
      console.warn('[Meta Pixel] InitiateCheckout error:', e);
    }
  }
}

/**
 * Track Purchase on confirmed checkout
 * Pass event_id for server-side deduplication against Conversions API (CAPI)
 */
export function trackPurchase({
  content_name = 'Fit Ninja Pro Pass',
  value = 399,
  currency = 'INR',
  transaction_id = '',
  event_id = null
} = {}) {
  if (isPixelAvailable()) {
    try {
      const dedupId = event_id || transaction_id || undefined;
      const options = dedupId ? { eventID: dedupId } : undefined;
      window.fbq('track', 'Purchase', {
        content_name,
        content_category: 'Subscription',
        value,
        currency,
        content_type: 'product',
        transaction_id: transaction_id || undefined
      }, options);
    } catch (e) {
      console.warn('[Meta Pixel] Purchase error:', e);
    }
  }
}
