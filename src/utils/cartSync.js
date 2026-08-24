import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// ============================================
// CART SYNC FUNCTIONS
// ============================================

// ✅ Sync local cart to database
export const syncCartToDatabase = async (userId) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token || !userId) {
      console.log('⏳ Skipping cart sync - No token or userId');
      return;
    }
    
    const localCart = JSON.parse(localStorage.getItem('loop_cart') || '[]');
    if (localCart.length === 0) {
      console.log('⏳ Skipping cart sync - Cart is empty');
      return;
    }
    
    console.log('🔄 Syncing cart to database...', localCart.length, 'items');
    
    const response = await axios.post(
      `${API_URL}/api/cart/sync`,
      { items: localCart },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Cart synced to database:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Cart sync error:', error.response?.data || error.message);
    return null;
  }
};

// ✅ Load cart from database
export const loadCartFromDatabase = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      console.log('⏳ Skipping load cart - No token');
      return null;
    }
    
    console.log('🔄 Loading cart from database...');
    
    const response = await axios.get(`${API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Cart loaded from database:', response.data.items?.length || 0, 'items');
    return response.data.items || [];
  } catch (error) {
    console.error('❌ Load cart error:', error.response?.data || error.message);
    return null;
  }
};

// ✅ Clear cart in database
export const clearCartInDatabase = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) return;
    
    console.log('🔄 Clearing cart in database...');
    
    await axios.delete(`${API_URL}/api/cart/clear`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Cart cleared in database');
  } catch (error) {
    console.error('❌ Clear cart error:', error.response?.data || error.message);
  }
};

// ✅ Add item to cart in database
export const addToCartInDatabase = async (item) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      console.log('⏳ Skipping add to cart - No token');
      return null;
    }
    
    console.log('🔄 Adding item to cart in database...', item.name);
    
    const response = await axios.post(
      `${API_URL}/api/cart/add`,
      item,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Item added to cart in database:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Add to cart error:', error.response?.data || error.message);
    return null;
  }
};

// ✅ Remove item from cart in database
export const removeFromCartInDatabase = async (productId, size) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) return null;
    
    console.log('🔄 Removing item from cart in database...');
    
    const response = await axios.delete(
      `${API_URL}/api/cart/remove/${productId}?size=${size}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Item removed from cart in database:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Remove from cart error:', error.response?.data || error.message);
    return null;
  }
};

// ✅ Merge local cart with database cart
export const mergeCarts = (localCart, dbCart) => {
  if (!dbCart || dbCart.length === 0) return localCart;
  if (!localCart || localCart.length === 0) return dbCart;
  
  const merged = [...dbCart];
  
  localCart.forEach(localItem => {
    const existingIndex = merged.findIndex(
      item => item.id === localItem.id && item.size === localItem.size
    );
    
    if (existingIndex > -1) {
      merged[existingIndex].quantity = localItem.quantity;
    } else {
      merged.push(localItem);
    }
  });
  
  return merged;
};

// ============================================
// USER SYNC FUNCTIONS (NEW - Added here)
// ============================================

// ✅ Load user profile from database
export const loadUserFromDatabase = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      console.log('⏳ No token found, skipping user load');
      return null;
    }
    
    console.log('🔄 Loading user from database...');
    
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User loaded from database:', response.data.name);
    return response.data;
  } catch (error) {
    console.error('❌ Load user error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('loop_token');
      localStorage.removeItem('loop_user');
    }
    return null;
  }
};

// ✅ Update user profile in database
export const updateUserInDatabase = async (userData) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      console.log('⏳ No token found, skipping user update');
      return null;
    }
    
    console.log('🔄 Updating user in database...');
    
    const response = await axios.put(
      `${API_URL}/api/auth/profile`,
      userData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ User updated in database:', response.data.user.name);
    return response.data.user;
  } catch (error) {
    console.error('❌ Update user error:', error.response?.data || error.message);
    return null;
  }
};

// ✅ Sync user data across devices
export const syncUser = async () => {
  try {
    const dbUser = await loadUserFromDatabase();
    if (dbUser) {
      localStorage.setItem('loop_user', JSON.stringify(dbUser));
      console.log('✅ User synced across devices');
      return dbUser;
    }
    return null;
  } catch (error) {
    console.error('❌ User sync error:', error);
    return null;
  }
};

// ✅ Refresh user data (call after profile update)
export const refreshUser = async () => {
  const dbUser = await loadUserFromDatabase();
  if (dbUser) {
    localStorage.setItem('loop_user', JSON.stringify(dbUser));
    console.log('✅ User refreshed');
    return dbUser;
  }
  return null;
};

// ============================================
// MASTER SYNC FUNCTION (Everything at once)
// ============================================

// ✅ Sync everything (user + cart) - Call this on login/refresh
export const syncAll = async () => {
  console.log('🔄 Syncing all data...');
  
  try {
    // 1. Sync user
    const dbUser = await loadUserFromDatabase();
    if (dbUser) {
      localStorage.setItem('loop_user', JSON.stringify(dbUser));
      console.log('✅ User synced');
    }
    
    // 2. Sync cart
    const dbCart = await loadCartFromDatabase();
    if (dbCart && dbCart.length > 0) {
      const localCart = JSON.parse(localStorage.getItem('loop_cart') || '[]');
      const merged = mergeCarts(localCart, dbCart);
      
      localStorage.setItem('loop_cart', JSON.stringify(merged));
      console.log('✅ Cart synced:', merged.length, 'items');
      
      return {
        user: dbUser,
        cart: merged
      };
    }
    
    return {
      user: dbUser,
      cart: dbCart || []
    };
  } catch (error) {
    console.error('❌ Sync all error:', error);
    return null;
  }
};