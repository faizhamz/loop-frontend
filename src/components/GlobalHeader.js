import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import SidebarMenu from './SidebarMenu';
import WhatsAppIcon from './WhatsAppIcon';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function GlobalHeader({ 
  cart, 
  wishlist, 
  isLoggedIn, 
  user, 
  handleLogout, 
  openCart,
  products,
  cartAnimation
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const location = useLocation();
  const { 
    searchResults, 
    setSearchResults, 
    performSearch,
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    clearNotifications,
    addToRecentlyViewed,
    isDarkMode
  } = useApp();
  
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  // Check if we're on admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Fetch WhatsApp number
  useEffect(() => {
    const fetchWhatsApp = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/contact`);
        if (response.data?.whatsapp) {
          setWhatsappNumber(response.data.whatsapp);
        }
      } catch (err) {
        console.error('Error fetching WhatsApp:', err);
      }
    };
    fetchWhatsApp();
  }, []);

  const openWhatsApp = () => {
    if (!whatsappNumber) return;
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = `Hi LOOP Team, I need help!`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // If admin page, return nothing
  if (isAdminPage) {
    return null;
  }

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    performSearch(query, products);
  };

  const handleSearchSelect = (product) => {
    addToRecentlyViewed(product);
    setSearchInput('');
    setSearchResults([]);
    setIsSearchOpen(false);
    const slug = product.productId || product.name.toLowerCase().replace(/ /g, '-');
    navigate(`/product/${slug}`);
  };

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        document.getElementById('global-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container header-content">
        {/* Left: Sidebar + Logo */}
        <div className="header-left">
          <SidebarMenu />
          <Link to="/" className="logo">
            <span className="logo-l">L</span>
            <span className="logo-infinity">∞</span>
            <span className="logo-p">P</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="header-center" ref={searchRef}>
          <div className="header-search-bar">
            <span className="search-icon">🔍</span>
            <input
              id="global-search-input"
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={handleSearch}
              onFocus={() => setIsSearchOpen(true)}
              className="header-search-input"
            />
            <span className="search-shortcut">⌘K</span>
          </div>
          
          <AnimatePresence>
            {isSearchOpen && searchInput && (
              <motion.div 
                className="header-search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.length === 0 ? (
                  <div className="search-result-empty">No products found</div>
                ) : (
                  searchResults.slice(0, 6).map(product => (
                    <motion.div 
                      key={product._id} 
                      className="header-search-result"
                      onClick={() => handleSearchSelect(product)}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img src={product.image || 'https://via.placeholder.com/40x40?text=LOOP'} alt={product.name} />
                      <div className="result-info">
                        <span className="result-name">{product.name}</span>
                        <span className="result-price">₹{product.price}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Icons */}
        <div className="header-right">
          {/* WhatsApp Support Button */}
          {whatsappNumber && (
            <button
              onClick={openWhatsApp}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title="Chat on WhatsApp"
            >
              <WhatsAppIcon size={24} />
            </button>
          )}

          <Link to="/wishlist" className="wishlist-heart-link desktop-only" aria-label="Wishlist">
            ❤️
            {wishlist.length > 0 && (
              <span className="wishlist-heart-count">{wishlist.length}</span>
            )}
          </Link>

          <div className="notification-wrapper" ref={notificationRef}>
            <button 
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-count">{unreadCount}</span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="notification-dropdown"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="notification-header">
                    <span>Notifications</span>
                    <div className="notification-actions">
                      {notifications.length > 0 && (
                        <>
                          <button onClick={markAllAsRead}>Mark all read</button>
                          <button onClick={clearNotifications}>Clear all</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <motion.div 
                          key={notif.id} 
                          className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                          }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="notification-icon">
                            {notif.type === 'success' ? '✅' : 
                             notif.type === 'error' ? '❌' : 
                             notif.type === 'warning' ? '⚠️' : 'ℹ️'}
                          </span>
                          <span className="notification-message">{notif.message}</span>
                          <span className="notification-time">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isLoggedIn ? (
            <div className="user-menu">
              <div className="user-avatar-mini">
                {user?.avatar ? (
                  <span>{user.avatar}</span>
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <span className="user-name">Hi, {user?.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="logout-btn-header">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">
              Login / Signup
            </Link>
          )}

          <div className="cart-icon-wrapper" onClick={openCart}>
            <svg 
              className={`cart-svg ${cartAnimation ? 'cart-bounce' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalCartItems > 0 && (
              <span className={`cart-count-badge ${cartAnimation ? 'cart-pop' : ''}`}>
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default GlobalHeader;