import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ============ User State ============
  const [user, setUser] = useState(null);

  // ============ Products State ============
  const [products, setProducts] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('loop_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  // ============ NOTIFICATIONS STATE ============
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============ THEME STATE ============
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('loop_theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });

  // Banners
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('loop_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('loop_recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem('loop_user', JSON.stringify(user));
  }, [user]);

  // ============ SAVE THEME ============
  useEffect(() => {
    localStorage.setItem('loop_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  // Toast functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // ============ RECENTLY VIEWED FUNCTIONS ============
  const addToRecentlyViewed = (product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item._id !== product._id);
      const updated = [product, ...filtered].slice(0, 10);
      localStorage.setItem('loop_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentlyViewed = (productId) => {
    if (!productId) return;
    setRecentlyViewed(prev => {
      const updated = prev.filter(item => {
        const itemId = item._id || item.id || item.productId;
        return itemId !== productId;
      });
      localStorage.setItem('loop_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem('loop_recently_viewed');
  };

  // ============================================
  // ✅ NOTIFICATION FUNCTIONS
  // ============================================

  // Load user notifications from database
  const loadNotifications = async () => {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotificationLoading(true);
    try {
      // Get user notifications with read status
      const response = await axios.get(`${API_URL}/api/notifications/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data || [];
      setNotifications(data);
      
      // Count unread
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      console.log(`📬 Loaded ${data.length} notifications, ${unread} unread`);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Mark single notification as read
  const markNotificationAsRead = async (notificationId) => {
    const token = localStorage.getItem('loop_token');
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/api/notifications/mark-read/${notificationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem('loop_token');
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  // Clear notifications (local only)
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Add notification (for admin panel)
  const addNotification = async (message, type = 'info', link = null) => {
    const token = localStorage.getItem('loop_token');
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/api/notifications`,
        { message, type, link, targetType: 'all' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // ============ SEARCH FUNCTIONS ============
  const performSearch = (query, productList) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = productList.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  // ============ THEME TOGGLE ============
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // ============ BANNER FUNCTIONS ============
  const refreshBanners = async () => {
    setBannerLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/banners/active`);
      setBanners(response.data);
    } catch (error) {
      console.error('Error refreshing banners:', error);
    } finally {
      setBannerLoading(false);
    }
  };

  useEffect(() => {
    refreshBanners();
    loadNotifications();
  }, []);

  // ============ CONTEXT VALUE ============
  const value = {
    // Toast
    toast,
    showToast,
    hideToast,
    
    // User
    user,
    setUser,
    
    // Products
    products,
    setProducts,
    
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    showSearchModal,
    setShowSearchModal,
    performSearch,
    
    // Recently Viewed
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    
    // ✅ Notifications - Updated
    notifications,
    unreadCount,
    notificationLoading,
    loadNotifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    
    // Theme
    isDarkMode,
    toggleTheme,
    
    // Banners
    banners,
    setBanners,
    bannerLoading,
    refreshBanners
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}