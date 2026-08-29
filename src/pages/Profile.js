import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import WhatsAppIcon from '../components/WhatsAppIcon';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// Instagram-Style Gradient Avatars
const GRADIENT_AVATARS = [
  { id: 'sunset', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', label: 'Sunset' },
  { id: 'ocean', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', label: 'Ocean' },
  { id: 'mint', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', label: 'Mint' },
  { id: 'peach', bg: 'linear-gradient(135deg, #fa709a, #fee140)', label: 'Peach' },
  { id: 'lavender', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', label: 'Lavender' },
  { id: 'sky', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', label: 'Sky' },
  { id: 'rose', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', label: 'Rose' },
  { id: 'aurora', bg: 'linear-gradient(135deg, #84fab0, #8fd3f4)', label: 'Aurora' },
  { id: 'candy', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', label: 'Candy' },
  { id: 'gold', bg: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)', label: 'Gold' },
  { id: 'forest', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', label: 'Forest' },
  { id: 'twilight', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', label: 'Twilight' },
];

function Profile({ user, setUser, showToast }) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedGradient, setSelectedGradient] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const avatarPickerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    avatarBg: '',
    gender: '',
    dob: ''
  });
  const [stats, setStats] = useState({
    orders: 0,
    wallet: 0,
    reviews: 0,
    wishlist: 0,
    addresses: 0
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        avatarBg: user.avatarBg || '',
        gender: user.gender || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
      });
      
      if (user.avatarBg) {
        const grad = GRADIENT_AVATARS.find(g => g.bg === user.avatarBg);
        if (grad) setSelectedGradient(grad);
      }
      
      setStats({
        orders: user.orderIds?.length || 0,
        wallet: user.wallet?.balance || 0,
        reviews: user.reviewIds?.length || 0,
        wishlist: user.wishlist?.length || 0,
        addresses: user.addresses?.length || 0
      });

      fetchRecentOrders();
    } else {
      const savedUser = localStorage.getItem('loop_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setFormData({
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            avatar: parsedUser.avatar || '',
            avatarBg: parsedUser.avatarBg || '',
            gender: parsedUser.gender || '',
            dob: parsedUser.dob ? new Date(parsedUser.dob).toISOString().split('T')[0] : ''
          });
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
    }

    // Fetch WhatsApp number
    fetchWhatsAppNumber();
  }, [user]);

  const fetchWhatsAppNumber = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/contact`);
      if (response.data?.whatsapp) {
        setWhatsappNumber(response.data.whatsapp);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp:', err);
    }
  };

  const openWhatsApp = () => {
    if (!whatsappNumber) {
      alert('WhatsApp support number not available.');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = `Hi LOOP Team, I need help with my account.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Click outside avatar picker to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarPickerRef.current && !avatarPickerRef.current.contains(e.target)) {
        setShowAvatarPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentOrders(response.data.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (gradient) => {
    const initial = formData.name ? formData.name.charAt(0).toUpperCase() : '👤';
    setFormData({
      ...formData,
      avatar: initial,
      avatarBg: gradient.bg
    });
    setSelectedGradient(gradient);
    setShowAvatarPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('loop_token');
      if (!token) {
        showToast('Please login again', 'error');
        return;
      }
      
      const response = await axios.put(
        `${API_URL}/api/auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('loop_user', JSON.stringify(updatedUser));
      
      // Dispatch event for sidebar update
      window.dispatchEvent(new Event('userUpdated'));
      
      showToast('✅ Profile updated successfully!', 'success');
      setEditing(false);
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setEditing(!editing);
    if (!editing && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        avatarBg: user.avatarBg || '',
        gender: user.gender || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
      });
    }
  };

  const getGenderEmoji = (gender) => {
    if (!gender) return '👤';
    if (gender.toLowerCase().includes('male')) return '👨';
    if (gender.toLowerCase().includes('female')) return '👩';
    return '🌈';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff8800',
      'processing': '#2874f0',
      'shipped': '#2874f0',
      'delivered': '#4cdf8b',
      'cancelled': '#ff6b6b'
    };
    return colors[status] || '#888';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📦';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderAvatar = () => {
    const bg = formData.avatarBg || 'linear-gradient(135deg, #D4AF37, #FFB7C5)';
    const text = formData.avatar || (formData.name ? formData.name.charAt(0).toUpperCase() : '👤');
    
    return (
      <div 
        className="avatar-gradient-display"
        style={{ background: bg }}
      >
        <span className="avatar-initial">{text}</span>
      </div>
    );
  };

  // Show loading state
  if (!user && !localStorage.getItem('loop_user')) {
    return (
      <div className="profile-page-modern">
        <div className="container">
          <div className="profile-login-prompt">
            <div className="prompt-icon">🔒</div>
            <h2>Please Login</h2>
            <p>You need to login to view your profile.</p>
            <a href="/login" className="login-btn-modern">
              Login Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-modern">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header-modern">
          <div className="profile-cover"></div>
          <div className="profile-info-row">
            <div 
              className="profile-avatar-modern clickable-avatar"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              title="Click to change avatar style"
            >
              {renderAvatar()}
              <div className="avatar-edit-badge">📷</div>
            </div>
            <div className="profile-name-section">
              <h1 className="profile-name">{formData.name || 'User'}</h1>
              <p className="profile-email">📧 {formData.email}</p>
              <div className="profile-badges">
                {formData.phone && (
                  <span className="badge-phone">📱 {formData.phone}</span>
                )}
                {formData.gender && (
                  <span className="badge-gender">
                    {getGenderEmoji(formData.gender)} {formData.gender}
                  </span>
                )}
                <span className="badge-ref">🔑 Ref: {user?.refId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div className="avatar-picker-overlay">
            <div className="avatar-picker-modal" ref={avatarPickerRef}>
              <div className="avatar-picker-header">
                <h4>🎨 Choose Avatar Style</h4>
                <button 
                  className="avatar-picker-close"
                  onClick={() => setShowAvatarPicker(false)}
                >
                  ✕
                </button>
              </div>
              <div className="avatar-picker-subtitle">
                Pick a gradient background for your avatar
              </div>
              <div className="avatar-picker-grid">
                {GRADIENT_AVATARS.map((gradient) => {
                  const isSelected = selectedGradient?.id === gradient.id;
                  return (
                    <button
                      key={gradient.id}
                      className={`avatar-picker-option ${isSelected ? 'active' : ''}`}
                      onClick={() => handleAvatarSelect(gradient)}
                    >
                      <div 
                        className="avatar-gradient-preview"
                        style={{ background: gradient.bg }}
                      >
                        <span className="avatar-preview-initial">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : 'A'}
                        </span>
                      </div>
                      <span className="avatar-picker-label">{gradient.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="profile-stats-modern">
          <div className="stat-card-modern">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-number">{stats.orders}</span>
              <span className="stat-label">Orders</span>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon">❤️</div>
            <div className="stat-info">
              <span className="stat-number">{stats.wishlist}</span>
              <span className="stat-label">Wishlist</span>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon">📍</div>
            <div className="stat-info">
              <span className="stat-number">{stats.addresses}</span>
              <span className="stat-label">Addresses</span>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-number">₹{stats.wallet}</span>
              <span className="stat-label">Wallet</span>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <span className="stat-number">{stats.reviews}</span>
              <span className="stat-label">Reviews</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-modern">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions-grid">
            <a href="/orders" className="quick-action-item">
              <span className="action-icon">📦</span>
              <span className="action-label">My Orders</span>
            </a>
            <a href="/wishlist" className="quick-action-item">
              <span className="action-icon">❤️</span>
              <span className="action-label">Wishlist</span>
            </a>
            <a href="/addresses" className="quick-action-item">
              <span className="action-icon">📍</span>
              <span className="action-label">Addresses</span>
            </a>
            {whatsappNumber && (
              <button onClick={openWhatsApp} className="quick-action-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="action-icon"><WhatsAppIcon size={24} /></span>
                <span className="action-label" style={{ color: '#25D366' }}>WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* 🎯 REFERRAL SECTION */}
        <div className="quick-actions-modern" style={{ marginTop: '20px' }}>
          <div className="section-header">
            <h3>🎯 Refer & Earn</h3>
            <a href="/referral" className="view-all-link">View Details →</a>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(255, 183, 197, 0.05))',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(212, 175, 55, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Your Referral Code</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#D4AF37',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}>
                  {user?.referralCode || 'Loading...'}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}?ref=${user?.referralCode}`;
                    navigator.clipboard.writeText(link);
                    showToast?.('📋 Referral link copied!', 'success');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#D4AF37',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  📋 Copy Link
                </button>
                
                <button
                  onClick={() => {
                    const link = `${window.location.origin}?ref=${user?.referralCode}`;
                    const text = `🎉 Join LOOP and get ₹50 bonus! Use my referral link: ${link}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#25D366',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  💬 Share
                </button>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(212, 175, 55, 0.1)',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#888' }}>Total Referrals</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                  {user?.referrals?.length || 0}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#888' }}>Total Earned</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#D4AF37' }}>
                  ₹{user?.referrals?.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.rewardAmount, 0) || 0}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#888' }}>Pending</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8800' }}>
                  ₹{user?.referrals?.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.rewardAmount, 0) || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="recent-orders-modern">
            <div className="section-header">
              <h3>📦 Recent Orders</h3>
              <a href="/orders" className="view-all-link">View All →</a>
            </div>
            <div className="recent-orders-list">
              {recentOrders.slice(0, 3).map((order, index) => (
                <div key={order._id || index} className="recent-order-item">
                  <div className="order-item-left">
                    <div className="order-item-icon">🎀</div>
                    <div className="order-item-info">
                      <span className="order-item-id">#{order.orderId}</span>
                      <span className="order-item-date">{formatDate(order.createdAt)}</span>
                      <div className="order-item-items">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <span key={idx}>{item.name}{idx < order.items.length - 1 && ', '}</span>
                        ))}
                        {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </div>
                  </div>
                  <div className="order-item-right">
                    <span className="order-item-amount">₹{order.total}</span>
                    <span 
                      className="order-item-status"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="profile-edit-section">
          <div className="section-header">
            <h3>👤 Personal Information</h3>
            {!editing && (
              <button 
                className="edit-profile-btn-small"
                onClick={toggleEdit}
              >
                ✏️ Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="profile-form-modern">
            <div className="form-row-modern">
              <div className="form-group-modern">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={editing ? 'editable' : 'readonly'}
                />
              </div>
              <div className="form-group-modern">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="readonly disabled"
                />
                <span className="field-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className={editing ? 'editable' : 'readonly'}
                />
              </div>
              <div className="form-group-modern">
                <label>Gender</label>
                <input
                  type="text"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!editing}
                  className={editing ? 'editable' : 'readonly'}
                  placeholder="Male / Female / Other"
                />
              </div>
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!editing}
                  className={editing ? 'editable' : 'readonly'}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group-modern">
                <label>Avatar Style</label>
                <div className="avatar-style-preview">
                  <div 
                    className="avatar-style-display"
                    style={{ 
                      background: formData.avatarBg || 'linear-gradient(135deg, #D4AF37, #FFB7C5)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    {formData.avatar || (formData.name ? formData.name.charAt(0).toUpperCase() : '👤')}
                  </div>
                  <button
                    type="button"
                    className="avatar-style-btn"
                    onClick={() => setShowAvatarPicker(true)}
                    disabled={!editing}
                  >
                    🎨 Change Style
                  </button>
                </div>
                <span className="field-hint">Click the avatar above to change style</span>
              </div>
            </div>

            {editing && (
              <div className="form-actions-modern">
                <button type="submit" disabled={loading} className="save-btn-modern">
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={toggleEdit}
                  className="cancel-btn-modern"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Help Section with WhatsApp */}
        <div className="help-section-modern">
          <div className="help-content">
            <span className="help-icon">💬</span>
            <div>
              <h4>Need Help?</h4>
              <p>Our support team is here to assist you</p>
            </div>
            {whatsappNumber ? (
              <button 
                onClick={openWhatsApp}
                style={{
                  padding: '10px 24px',
                  background: '#25D366',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <WhatsAppIcon size={20} color="#fff" />
                Chat Now
              </button>
            ) : (
              <a href="/contact" className="help-btn">Contact Support →</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;