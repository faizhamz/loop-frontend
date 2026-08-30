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
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,  // ✅ Import clearAllNotifications
    clearNotifications,
    addToRecentlyViewed,
    isDarkMode,
    loadNotifications
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

  // Reload notifications when dropdown opens
  useEffect(() => {
    if (showNotifications && isLoggedIn) {
      loadNotifications();
    }
  }, [showNotifications, isLoggedIn]);

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
    
    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  // Format time ago
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

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

          {/* NOTIFICATION BELL */}
          <div className="notification-wrapper" ref={notificationRef}>
            <button 
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                fontSize: '22px',
                color: isDarkMode ? '#fff' : '#2d1b2e'
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-count" style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '0px',
                  background: '#ff4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '50%',
                  minWidth: '18px',
                  textAlign: 'center',
                  animation: 'bounceIn 0.4s ease'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
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
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '0',
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                    borderRadius: '16px',
                    width: '380px',
                    maxHeight: '450px',
                    overflow: 'hidden',
                    boxShadow: isDarkMode ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f0e8ed',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: isDarkMode ? '#fff' : '#2d1b2e',
                      fontFamily: 'Nunito, sans-serif'
                    }}>
                      🔔 Notifications
                      {unreadCount > 0 && (
                        <span style={{
                          marginLeft: '8px',
                          background: '#ff4444',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 10px',
                          borderRadius: '12px'
                        }}>
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {notifications.length > 0 && (
                        <>
                          {/* ✅ Mark all read button */}
                          <button 
                            onClick={markAllNotificationsAsRead}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#D4AF37',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              transition: 'all 0.3s ease',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            ✅ Mark all read
                          </button>
                          {/* ✅ Clear all button - actually deletes */}
                          <button 
                            onClick={clearAllNotifications}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff4444',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              transition: 'all 0.3s ease',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            🗑️ Clear all
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notification List */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    maxHeight: '350px'
                  }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#888'
                      }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>✨</div>
                        <p>No notifications yet</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>We'll notify you when something happens</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map(notif => (
                        <motion.div 
                          key={notif._id} 
                          className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notif)}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px 20px',
                            cursor: 'pointer',
                            borderBottom: isDarkMode ? '1px solid #222' : '1px solid #f0e8ed',
                            transition: 'all 0.3s ease',
                            background: notif.isRead ? 'transparent' : isDarkMode ? 'rgba(212, 175, 55, 0.05)' : 'rgba(212, 175, 55, 0.03)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDarkMode ? '#222' : '#f8f4f9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = notif.isRead ? 'transparent' : isDarkMode ? 'rgba(212, 175, 55, 0.05)' : 'rgba(212, 175, 55, 0.03)';
                          }}
                        >
                          {!notif.isRead && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              background: '#D4AF37',
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginTop: '6px'
                            }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              color: isDarkMode ? '#fff' : '#2d1b2e',
                              lineHeight: '1.4',
                              wordBreak: 'break-word'
                            }}>
                              {notif.message}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '4px'
                            }}>
                              <span style={{
                                fontSize: '11px',
                                color: '#888'
                              }}>
                                {timeAgo(notif.createdAt)}
                              </span>
                              {notif.orderId && (
                                <span style={{
                                  fontSize: '10px',
                                  color: '#D4AF37',
                                  background: 'rgba(212, 175, 55, 0.1)',
                                  padding: '1px 8px',
                                  borderRadius: '10px'
                                }}>
                                  📦 Order
                                </span>
                              )}
                              {notif.orderStatus && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 8px',
                                  borderRadius: '10px',
                                  background: notif.orderStatus === 'delivered' ? 'rgba(40, 167, 69, 0.1)' :
                                            notif.orderStatus === 'cancelled' ? 'rgba(255, 68, 68, 0.1)' :
                                            'rgba(212, 175, 55, 0.1)',
                                  color: notif.orderStatus === 'delivered' ? '#28a745' :
                                         notif.orderStatus === 'cancelled' ? '#ff4444' :
                                         '#D4AF37'
                                }}>
                                  {notif.orderStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          {notif.link && (
                            <span style={{
                              color: '#D4AF37',
                              fontSize: '12px',
                              flexShrink: 0
                            }}>
                              →
                            </span>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div style={{
                      padding: '10px 20px',
                      borderTop: isDarkMode ? '1px solid #333' : '1px solid #f0e8ed',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#888'
                      }}>
                        {notifications.length} notifications • {unreadCount} unread
                      </span>
                    </div>
                  )}
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