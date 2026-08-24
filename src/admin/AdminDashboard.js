import React, { useState, useEffect } from 'react';
import ProductsPanel from './ProductsPanel';
import OrdersPanel from './OrdersPanel';
import UsersPanel from './UsersPanel';
import CouponsPanel from './CouponsPanel';
import PaymentMethodsPanel from './PaymentMethodsPanel';
import BannersPanel from './BannersPanel';
import ReviewsPanel from './ReviewsPanel';
import ContactPanel from './ContactPanel';
import NotificationsPanel from './NotificationsPanel';
import ReferralPanel from './ReferralPanel';
import CategoriesPanel from './CategoriesPanel';
import AnalyticsPanel from './AnalyticsPanel';
import axios from 'axios';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStock: 0,
    totalUsers: 0,
    totalBanners: 0,
    totalReviews: 0,
    totalNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ FIX: Single authentication check with no redirect loop
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = localStorage.getItem('admin_logged_in');
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      
      console.log('🔍 Checking auth - loggedIn:', loggedIn, 'token:', token ? 'exists' : 'null');
      
      if (loggedIn === 'true' && token) {
        setIsAuthenticated(true);
        fetchStats();
      } else {
        console.log('❌ Not authenticated, redirecting to login...');
        setIsAuthenticated(false);
        // ✅ Use window.location.replace to prevent back button issues
        window.location.replace('/admin');
      }
    };
    
    checkAuth();
  }, []); // ✅ Empty dependency array - runs only once

  const getAuthHeaders = () => {
    const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
    return {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    };
  };

  const fetchStats = async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const authHeaders = getAuthHeaders();
      
      const [productsRes, ordersRes, usersRes, bannersRes, reviewsRes, notificationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`),
        axios.get(`${API_URL}/api/orders`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/users`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/banners`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/reviews/admin/all`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/notifications/admin`, authHeaders).catch(() => ({ data: [] }))
      ]);
      
      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const reviews = reviewsRes.data || [];
      const notifications = notificationsRes.data || [];
      
      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        lowStock: products.filter(p => p.stock < 10).length,
        totalUsers: usersRes.data?.length || 0,
        totalBanners: bannersRes.data?.length || 0,
        totalReviews: reviews.length,
        totalNotifications: notifications.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication failed, redirecting to login...');
        setAuthError(true);
        setTimeout(() => {
          localStorage.removeItem('admin_logged_in');
          localStorage.removeItem('loop_token');
          localStorage.removeItem('admin_token');
          window.location.replace('/admin');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_password');
    localStorage.removeItem('loop_token');
    localStorage.removeItem('admin_token');
    window.location.replace('/admin');
  };

  // ✅ If not authenticated, show nothing (redirect will happen)
  if (!isAuthenticated && !authError) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px' }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ color: '#ff4444' }}>⚠️ Session Expired</h2>
          <p>Your session has expired. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <h2 className="admin-logo">L∞P</h2>
        <nav>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            👕 Products
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            📦 Orders
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            👥 Users
          </button>
          <button className={activeTab === 'coupons' ? 'active' : ''} onClick={() => setActiveTab('coupons')}>
            🏷️ Coupons
          </button>
          <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
            💳 Payments
          </button>
          <button className={activeTab === 'banners' ? 'active' : ''} onClick={() => setActiveTab('banners')}>
            📸 Banners
          </button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
            ⭐ Reviews
          </button>
          <button className={activeTab === 'contact' ? 'active' : ''} onClick={() => setActiveTab('contact')}>
            📧 Contact
          </button>
          <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
            🔔 Notifications
          </button>
          <button className={activeTab === 'referral' ? 'active' : ''} onClick={() => setActiveTab('referral')}>
            🎯 Referral
          </button>
          <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>
            🏷️ Categories
          </button>
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
            📈 Analytics
          </button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </div>

      <div className="admin-content" style={{ paddingTop: '80px' }}>
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ color: '#fff' }}>📊 Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card"><h3>{stats.totalProducts}</h3><p>Products</p></div>
              <div className="stat-card"><h3>{stats.totalOrders}</h3><p>Orders</p></div>
              <div className="stat-card"><h3>₹{stats.totalRevenue.toLocaleString()}</h3><p>Revenue</p></div>
              <div className="stat-card"><h3 style={{ color: stats.lowStock > 0 ? '#ff4444' : '#28a745' }}>{stats.lowStock}</h3><p>Low Stock</p></div>
              <div className="stat-card"><h3>{stats.totalUsers}</h3><p>Users</p></div>
              <div className="stat-card"><h3>{stats.totalBanners}</h3><p>Banners</p></div>
              <div className="stat-card"><h3>{stats.totalReviews}</h3><p>Reviews</p></div>
              <div className="stat-card"><h3>{stats.totalNotifications}</h3><p>Notifications</p></div>
            </div>
          </div>
        )}

        {activeTab === 'products' && <ProductsPanel />}
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'coupons' && <CouponsPanel />}
        {activeTab === 'payments' && <PaymentMethodsPanel />}
        {activeTab === 'banners' && <BannersPanel />}
        {activeTab === 'reviews' && <ReviewsPanel />}
        {activeTab === 'contact' && <ContactPanel />}
        {activeTab === 'notifications' && <NotificationsPanel />}
        {activeTab === 'referral' && <ReferralPanel />}
        {activeTab === 'categories' && <CategoriesPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
      </div>
    </div>
  );
}

export default AdminDashboard;