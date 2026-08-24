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
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ============ THEME STATE ============
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load from localStorage on initial render
    const savedTheme = localStorage.getItem('loop_theme');
    // Default to 'light' if not saved
    return savedTheme ? savedTheme === 'dark' : false;
  });

  // Banners
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedRecent = localStorage.getItem('loop_recently_viewed');
    if (savedRecent) {
      setRecentlyViewed(JSON.parse(savedRecent));
    }
    const savedNotifications = localStorage.getItem('loop_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
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
    localStorage.setItem('loop_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('loop_user', JSON.stringify(user));
  }, [user]);

  // ============ SAVE THEME ============
  useEffect(() => {
    localStorage.setItem('loop_theme', isDarkMode ? 'dark' : 'light');
    // Apply theme class to body
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

  const addToRecentlyViewed = (product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item._id !== product._id);
      return [product, ...filtered].slice(0, 10);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  // Notifications
  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/active`);
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const addNotification = (message, type = 'info', link = null) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Search functions
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

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Banner functions
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
  }, []);

  const value = {
    toast,
    showToast,
    hideToast,
    user,
    setUser,
    products,
    setProducts,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    showSearchModal,
    setShowSearchModal,
    performSearch,
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    notifications,
    unreadCount,
    loadNotifications,
    addNotification,
    markAllAsRead,
    markAsRead,
    clearNotifications,
    // ============ THEME ============
    isDarkMode,
    toggleTheme,
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