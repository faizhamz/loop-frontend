import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function CouponsPanel() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User search states
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
    userSpecific: false,
    userId: '',
    userEmail: '',
    userName: '',
    userPhone: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(
        `${API_URL}/api/users/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscount: '',
      minOrderValue: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      isActive: true,
      userSpecific: false,
      userId: '',
      userEmail: '',
      userName: '',
      userPhone: ''
    });
    setUserSearch('');
    setUserSearchResults([]);
    setEditingCoupon(null);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
        minOrderValue: Number(formData.minOrderValue) || 0,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isActive: formData.isActive,
        userSpecific: formData.userSpecific,
        userId: formData.userId || null,
        userEmail: formData.userEmail || '',
        userName: formData.userName || '',
        userPhone: formData.userPhone || ''
      };

      const token = localStorage.getItem('loop_token');
      if (editingCoupon) {
        await axios.put(`${API_URL}/api/coupons/${editingCoupon._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Coupon updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/coupons`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Coupon created successfully!');
      }

      fetchCoupons();
      setShowForm(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving coupon:', error);
      setError(error.response?.data?.error || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.patch(`${API_URL}/api/coupons/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      setError('Failed to toggle coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
      setSuccess('🗑️ Coupon deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Failed to delete coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || '',
      minOrderValue: coupon.minOrderValue || '',
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive,
      userSpecific: coupon.userSpecific || false,
      userId: coupon.userId || '',
      userEmail: coupon.userEmail || '',
      userName: coupon.userName || '',
      userPhone: coupon.userPhone || ''
    });
    if (coupon.userName) {
      setUserSearch(coupon.userName);
    }
    setShowForm(true);
  };

  const getDiscountLabel = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else if (coupon.discountType === 'fixed') {
      return `₹${coupon.discountValue} OFF`;
    } else {
      return 'FREE Shipping';
    }
  };

  const getUserLabel = (coupon) => {
    if (coupon.userSpecific) {
      return coupon.userName || coupon.userEmail || 'Specific User';
    }
    return '🌍 All Users';
  };

  if (loading) return <div>Loading coupons...</div>;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        background: '#0a0a0a',
        zIndex: 50
      }}>
        <h2 style={{ color: '#fff' }}>🏷️ Coupon Management ({coupons.length})</h2>
        <button 
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{ 
            background: '#D4AF37', 
            border: 'none', 
            padding: '12px 24px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#000',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Create Coupon
        </button>
      </div>

      {error && (
        <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#28a745', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {success}
        </div>
      )}

      {coupons.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No coupons yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => { setShowForm(true); resetForm(); }}>"➕ Create Coupon"</strong> button above to create your first coupon.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Discount</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Max Discount</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Target</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Used</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id} style={{ opacity: coupon.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <strong style={{ color: '#D4AF37' }}>{coupon.code}</strong>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div>{coupon.name}</div>
                    {coupon.description && (
                      <div style={{ fontSize: '11px', color: '#666' }}>{coupon.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{ 
                      background: coupon.discountType === 'percentage' ? '#28a745' : coupon.discountType === 'fixed' ? '#0066FF' : '#D4AF37',
                      color: '#fff',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getDiscountLabel(coupon)}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    {coupon.maxDiscount > 0 ? (
                      <span style={{ color: '#D4AF37' }}>₹{coupon.maxDiscount}</span>
                    ) : (
                      <span style={{ color: '#666', fontSize: '12px' }}>No limit</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{ fontSize: '12px', color: coupon.userSpecific ? '#D4AF37' : '#888' }}>
                      {getUserLabel(coupon)}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    {coupon.usedCount || 0}/{coupon.usageLimit || '∞'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: coupon.isActive ? '#28a745' : '#555',
                      color: '#fff',
                      fontSize: '12px'
                    }}>
                      {coupon.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <button 
                      onClick={() => handleEdit(coupon)} 
                      style={{ marginRight: '5px', background: '#0066FF', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggle(coupon._id, coupon.isActive)} 
                      style={{ marginRight: '5px', background: coupon.isActive ? '#ff8800' : '#28a745', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon._id)} 
                      style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflow: 'auto'
        }}>
          <form onSubmit={handleSave} style={{
            background: '#111',
            padding: '30px',
            borderRadius: '12px',
            width: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>
              {editingCoupon ? '✏️ Edit Coupon' : '➕ Create Coupon'}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Coupon Name *</label>
              <input
                type="text"
                placeholder="e.g., Summer Sale 20%"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea
                placeholder="Brief description of this coupon"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {formData.discountType === 'percentage' ? 'Discount % *' : 'Discount Amount (₹) *'}
                </label>
                <input
                  type="number"
                  placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                  required
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                💰 Max Discount (₹) <span style={{ color: '#666' }}>(Optional - only for percentage)</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 500 (leave empty for no limit)"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                min="0"
                step="any"
              />
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Maximum discount amount for percentage coupons. Leave empty for no limit.
              </small>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Minimum Order Value (₹)</label>
              <input
                type="number"
                placeholder="e.g., 499"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                min="0"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Valid From</label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Valid Until</label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Usage Limit</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                  min="0"
                />
                <small style={{ color: '#666', fontSize: '11px' }}>Leave empty for unlimited</small>
              </div>
            </div>

            {/* ✅ USER SPECIFIC SECTION */}
            <div style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '15px',
              background: '#1a1a1a'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.userSpecific}
                  onChange={(e) => {
                    setFormData({ ...formData, userSpecific: e.target.checked });
                    if (!e.target.checked) {
                      setFormData({
                        ...formData,
                        userSpecific: false,
                        userId: '',
                        userEmail: '',
                        userName: '',
                        userPhone: ''
                      });
                      setUserSearch('');
                      setUserSearchResults([]);
                    }
                  }}
                />
                🔒 Assign to specific user
              </label>

              {formData.userSpecific && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    🔍 Search User
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or User ID..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#222', 
                      border: '1px solid #333', 
                      color: 'white', 
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  />
                  
                  {searching && (
                    <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
                      Searching...
                    </div>
                  )}
                  
                  {userSearchResults.length > 0 && (
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      background: '#222'
                    }}>
                      {userSearchResults.map(user => (
                        <div
                          key={user._id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              userId: user._id,
                              userEmail: user.email,
                              userName: user.name,
                              userPhone: user.phone || ''
                            });
                            setUserSearch(user.name);
                            setUserSearchResults([]);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #333',
                            transition: 'background 0.3s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <div style={{ color: '#fff', fontWeight: '500' }}>{user.name}</div>
                            <div style={{ color: '#888', fontSize: '12px' }}>{user.email}</div>
                          </div>
                          <div style={{ color: '#666', fontSize: '12px', textAlign: 'right' }}>
                            <div>📱 {user.phone || 'No phone'}</div>
                            <div style={{ fontSize: '10px', color: '#555' }}>ID: {user.refId || user._id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.userId && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '10px 14px', 
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        <span style={{ color: '#D4AF37' }}>✅ Assigned to:</span>
                        <span style={{ color: '#fff', marginLeft: '8px', fontWeight: '500' }}>
                          {formData.userName || 'User'}
                        </span>
                        <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>
                          📧 {formData.userEmail}
                        </span>
                        {formData.userPhone && (
                          <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>
                            📱 {formData.userPhone}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            userId: '',
                            userEmail: '',
                            userName: '',
                            userPhone: ''
                          });
                          setUserSearch('');
                          setUserSearchResults([]);
                        }}
                        style={{
                          background: '#ff4444',
                          border: 'none',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', color: '#ccc', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active (available for customers)
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                type="submit" 
                style={{ 
                  flex: 1,
                  background: '#D4AF37', 
                  border: 'none', 
                  padding: '12px 20px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingCoupon ? '💾 Update Coupon' : '💾 Create Coupon'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{ 
                  padding: '12px 24px',
                  background: '#333', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  color: 'white',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CouponsPanel;