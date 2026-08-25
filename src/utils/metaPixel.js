// ============================================
// META PIXEL UTILITY
// ============================================

export const META_PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || '';

// ✅ Initialize Meta Pixel
export const initMetaPixel = () => {
  if (typeof window !== 'undefined' && !window.fbq) {
    // Initialize Facebook Pixel
    window.fbq = function() {
      window.fbq.callMethod ? 
        window.fbq.callMethod.apply(window.fbq, arguments) : 
        window.fbq.queue.push(arguments);
    };
    
    if (!window._fbq) window._fbq = window;
    window._fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    
    // Load pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    
    // Initialize with Pixel ID
    if (META_PIXEL_ID) {
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
      console.log('✅ Meta Pixel initialized:', META_PIXEL_ID);
    } else {
      console.warn('⚠️ Meta Pixel ID not found in .env');
    }
  }
};

// ✅ Track Standard Events
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
    console.log('📊 Meta Pixel Event:', eventName, parameters);
  }
};

// ✅ E-commerce Events

// Track when someone views a product
export const trackViewContent = (product) => {
  if (!product) return;
  trackEvent('ViewContent', {
    content_name: product.name,
    content_ids: [product._id],
    content_type: 'product',
    value: product.salePrice || product.price || 0,
    currency: 'INR'
  });
};

// Track when someone adds to cart
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  trackEvent('AddToCart', {
    content_name: product.name,
    content_ids: [product._id],
    content_type: 'product',
    value: (product.salePrice || product.price || 0) * quantity,
    currency: 'INR'
  });
};

// Track when someone starts checkout
export const trackInitiateCheckout = (cartTotal, itemCount) => {
  trackEvent('InitiateCheckout', {
    value: cartTotal || 0,
    currency: 'INR',
    num_items: itemCount || 0
  });
};

// Track when someone completes a purchase
export const trackPurchase = (order) => {
  if (!order) return;
  
  // Get product IDs from order items
  const contentIds = order.items?.map(item => 
    item.productId?._id || item.productId
  ) || [];
  
  trackEvent('Purchase', {
    value: order.total || 0,
    currency: 'INR',
    transaction_id: order.orderId,
    content_ids: contentIds,
    content_type: 'product',
    num_items: order.items?.length || 0
  });
};

// Track when someone searches
export const trackSearch = (query, resultsCount = 0) => {
  trackEvent('Search', {
    search_string: query || '',
    results_count: resultsCount || 0
  });
};

// Track when someone adds to wishlist
export const trackAddToWishlist = (product) => {
  if (!product) return;
  trackEvent('AddToWishlist', {
    content_name: product.name,
    content_ids: [product._id],
    content_type: 'product',
    value: product.salePrice || product.price || 0,
    currency: 'INR'
  });
};

// Track when someone subscribes to newsletter
export const trackSubscribe = (email) => {
  trackEvent('Subscribe', {
    email: email || ''
  });
};

// Track when someone contacts support
export const trackContact = (method = 'email') => {
  trackEvent('Contact', {
    method: method
  });
};

// ✅ Track Custom Events
export const trackCustomEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
    console.log('📊 Meta Pixel Custom Event:', eventName, parameters);
  }
};

// ✅ Track Complete Funnel (for advanced analytics)

// Track from product view to purchase
export const trackProductFunnel = (product, step, additionalData = {}) => {
  const funnelEvents = {
    'view': 'ViewContent',
    'add_to_cart': 'AddToCart',
    'initiate_checkout': 'InitiateCheckout',
    'purchase': 'Purchase'
  };
  
  const eventName = funnelEvents[step];
  if (eventName) {
    trackEvent(eventName, {
      content_name: product?.name,
      content_ids: [product?._id],
      content_type: 'product',
      value: product?.salePrice || product?.price || 0,
      currency: 'INR',
      ...additionalData
    });
  }
};

// ✅ Track User Journey (for retargeting)

// Track when user signs up
export const trackSignUp = (userId, method = 'email') => {
  trackEvent('CompleteRegistration', {
    user_id: userId,
    method: method
  });
};

// Track when user logs in
export const trackLogin = (userId) => {
  trackCustomEvent('Login', {
    user_id: userId
  });
};

// Track when user views category
export const trackViewCategory = (categoryName, productsCount = 0) => {
  trackCustomEvent('ViewCategory', {
    category_name: categoryName,
    products_count: productsCount
  });
};

// Track when user shares product
export const trackShareProduct = (product, platform = 'whatsapp') => {
  trackCustomEvent('ShareProduct', {
    product_name: product?.name,
    product_id: product?._id,
    platform: platform
  });
};

// ✅ Utility: Get Facebook Pixel Status
export const getPixelStatus = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    return {
      initialized: true,
      pixelId: META_PIXEL_ID,
      version: window.fbq.version || '2.0'
    };
  }
  return {
    initialized: false,
    pixelId: META_PIXEL_ID,
    error: 'Pixel not initialized'
  };
};

// ✅ Utility: Debug Pixel Events
export const debugPixel = (enable = true) => {
  if (typeof window !== 'undefined') {
    window.fbq_debug = enable;
    if (enable) {
      console.log('🔍 Meta Pixel Debug Mode Enabled');
      console.log('📊 Pixel ID:', META_PIXEL_ID);
    } else {
      console.log('🔍 Meta Pixel Debug Mode Disabled');
    }
  }
};

// ✅ Consent Management (GDPR)
export const consentPixel = (consentGiven = true) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (consentGiven) {
      window.fbq('consent', 'grant');
      console.log('✅ Meta Pixel Consent Granted');
    } else {
      window.fbq('consent', 'revoke');
      console.log('❌ Meta Pixel Consent Revoked');
    }
  }
};

// ✅ Quick Initialization with Debug
export const initMetaPixelWithDebug = (debug = false) => {
  if (debug) {
    debugPixel(true);
  }
  initMetaPixel();
};

// ✅ Track Page View with Custom Parameters
export const trackPageView = (pageName, additionalData = {}) => {
  trackEvent('PageView', {
    page_name: pageName,
    ...additionalData
  });
};

export default {
  META_PIXEL_ID,
  initMetaPixel,
  trackEvent,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackSearch,
  trackAddToWishlist,
  trackSubscribe,
  trackContact,
  trackCustomEvent,
  trackProductFunnel,
  trackSignUp,
  trackLogin,
  trackViewCategory,
  trackShareProduct,
  getPixelStatus,
  debugPixel,
  consentPixel,
  initMetaPixelWithDebug,
  trackPageView
};