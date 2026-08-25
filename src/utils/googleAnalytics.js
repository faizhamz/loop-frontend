// ============================================
// GOOGLE ANALYTICS UTILITY
// ============================================

export const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || '';

// ✅ Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Configure GA
    window.gtag('js', new Date());
    if (GA_MEASUREMENT_ID) {
      window.gtag('config', GA_MEASUREMENT_ID);
      console.log('✅ Google Analytics initialized:', GA_MEASUREMENT_ID);
    } else {
      console.warn('⚠️ Google Analytics ID not found in .env');
    }
  }
};

// ✅ Track Page View
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path
    });
  }
};

// ✅ Track Event
export const trackGAEvent = (category, action, label = null, value = null) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// ✅ E-commerce Events
export const trackGAPurchase = (order) => {
  if (typeof window !== 'undefined' && window.gtag && order) {
    window.gtag('event', 'purchase', {
      transaction_id: order.orderId,
      value: order.total || 0,
      currency: 'INR',
      items: order.items?.map(item => ({
        item_id: item.productId?._id || item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      })) || []
    });
  }
};

export const trackGAAddToCart = (product, quantity = 1) => {
  if (typeof window !== 'undefined' && window.gtag && product) {
    window.gtag('event', 'add_to_cart', {
      items: [{
        item_id: product._id,
        item_name: product.name,
        price: product.salePrice || product.price || 0,
        quantity: quantity
      }]
    });
  }
};

export const trackGABeginCheckout = (cartTotal, items) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      value: cartTotal || 0,
      currency: 'INR',
      items: items?.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      })) || []
    });
  }
};

// ✅ Track User Engagement
export const trackGASearch = (query, resultsCount) => {
  trackGAEvent('engagement', 'search', query, resultsCount);
};

export const trackGALogin = () => {
  trackGAEvent('engagement', 'login');
};

export const trackGASignUp = (method) => {
  trackGAEvent('engagement', 'sign_up', method);
};

export default {
  GA_MEASUREMENT_ID,
  initGA,
  trackPageView,
  trackGAEvent,
  trackGAPurchase,
  trackGAAddToCart,
  trackGABeginCheckout,
  trackGASearch,
  trackGALogin,
  trackGASignUp
};