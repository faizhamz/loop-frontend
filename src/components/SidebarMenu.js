import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import './SidebarMenu.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function SidebarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  const { isDarkMode, toggleTheme } = useApp();

  // ✅ Load user data on mount AND when localStorage changes
  const loadUserData = () => {
    const token = localStorage.getItem('loop_token');
    const userData = localStorage.getItem('loop_user');
    
    console.log('🔄 Sidebar loading user data...');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('✅ Sidebar user loaded:', parsedUser.name);
      } catch (e) {
        console.error('Error parsing user:', e);
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserData();
    fetchCategories();

    // ✅ Listen for storage changes (when user updates profile)
    const handleStorageChange = (e) => {
      if (e.key === 'loop_user' || e.key === 'loop_token') {
        console.log('🔄 Storage changed, reloading user data...');
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // ✅ Listen for custom events (when login/logout happens)
    const handleUserUpdate = () => {
      console.log('🔄 User update event received');
      loadUserData();
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // ✅ Function to refresh user data (call after login/logout)
  const refreshUser = () => {
    loadUserData();
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loop_token');
    localStorage.removeItem('loop_user');
    setIsLoggedIn(false);
    setUser(null);
    setIsOpen(false);
    
    // ✅ Dispatch event so other components update
    window.dispatchEvent(new Event('userUpdated'));
    
    navigate('/');
    window.location.reload();
  };

  const menuItems = [
    { icon: '👤', label: 'My Profile', path: '/profile', show: isLoggedIn },
    { icon: '🎯', label: 'Refer & Earn', path: '/referral', show: isLoggedIn },  // ✅ Added referral
    { icon: '📦', label: 'Order History', path: '/orders', show: true },
    { icon: '🏠', label: 'Saved Addresses', path: '/addresses', show: isLoggedIn },
    { icon: '❤️', label: 'Wishlist', path: '/wishlist', show: true },
    { icon: 'ℹ️', label: 'About Us', path: '/about', show: true },
    { icon: '📧', label: 'Contact Us', path: '/contact', show: true },
    { icon: '🔑', label: 'Login / Signup', path: '/login', show: !isLoggedIn },
  ];

  return (
    <div className="sidebar-menu" ref={menuRef}>
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span className="sidebar-hamburger">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </span>
      </button>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)}>
          <div className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-brand">L∞P</div>
              <button className="sidebar-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {isLoggedIn && user && (
              <div className="sidebar-user">
                <div className="sidebar-avatar">
                  {user?.avatar ? (
                    <span style={{ fontSize: '24px' }}>{user.avatar}</span>
                  ) : (
                    <span className="avatar-placeholder">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user?.name || 'User'}</div>
                  <div className="sidebar-user-email">{user?.email}</div>
                </div>
              </div>
            )}

            {/* ✅ THEME TOGGLE */}
            <div className="sidebar-theme-toggle">
              <span className="theme-label">
                {isDarkMode ? '🌙 Dark Mode' : '🌞 Light Mode'}
              </span>
              <label className="theme-switch">
                <input 
                  type="checkbox" 
                  checked={isDarkMode} 
                  onChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <span className="theme-slider"></span>
              </label>
            </div>

            <nav className="sidebar-nav">
              {menuItems.filter(item => item.show !== false).map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="sidebar-nav-item"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {categories.length > 0 && (
                <>
                  <div className="sidebar-divider"></div>
                  <div className="sidebar-section-title">
                    🏷️ Categories
                  </div>
                  {categories.map(category => (
                    <Link
                      key={category._id}
                      to={`/category/${category.slug}`}
                      className="sidebar-nav-item"
                      onClick={() => setIsOpen(false)}
                      style={{ paddingLeft: '16px' }}
                    >
                      <span className="sidebar-nav-icon">{category.icon || '📁'}</span>
                      <span>{category.name}</span>
                      {category.productCount > 0 && (
                        <span className="category-count">
                          {category.productCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {isLoggedIn && (
              <button className="sidebar-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            )}

            <div className="sidebar-footer">
              <span>© 2025 L∞P</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SidebarMenu;