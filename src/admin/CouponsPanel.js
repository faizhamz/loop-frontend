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
  
  // ✅ FIX: Complete initial state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    validUntil: '',
    usageLimit: '',
    isActive: true
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

  // ✅ FIX: Complete reset function
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      validUntil: '',
      usageLimit: '',
      isActive: true
    });
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
        minOrderValue: Number(formData.minOrderValue) || 0,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isActive: formData.isActive
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
      resetForm(); // ✅ Reset after save
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
      minOrderValue: coupon.minOrderValue || '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive
    });
    setShowForm(true);
  };

  const getDiscountLabel = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `₹${coupon.discountValue} OFF`;
    }
  };

  if (loading) return <div>Loading coupons...</div>;

  return (
    <div>
      {/* HEADER WITH ADD BUTTON */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #333'
      }}>
        <h2>🏷️ Coupon Management</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingCoupon(null); 
            resetForm(); 
          }}
          style={{ 
            background: '#D4AF37', 
            border: 'none', 
            padding: '12px 24px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#000'
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Discount</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Min Order</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Used</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon._id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <strong style={{ color: '#D4AF37' }}>{coupon.code}</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{coupon.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <span style={{ 
                    background: coupon.discountType === 'percentage' ? '#28a745' : '#0066FF',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {getDiscountLabel(coupon)}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>₹{coupon.minOrderValue || 0}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{coupon.usedCount || 0}/{coupon.usageLimit || '∞'}</td>
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
                    style={{ marginRight: '5px', background: '#D4AF37', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
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
      )}

      {/* ADD/EDIT FORM MODAL */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
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
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>
              {editingCoupon ? '✏️ Edit Coupon' : '➕ Create Coupon'}
            </h3>

            <input
              type="text"
              placeholder="Coupon Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              required
            />

            <input
              type="text"
              placeholder="Coupon Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              required
            />

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            />

            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>

            <input
              type="number"
              placeholder={formData.discountType === 'percentage' ? 'Discount % *' : 'Discount Amount (₹) *'}
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              required
            />

            <input
              type="number"
              placeholder="Minimum Order Value (₹)"
              value={formData.minOrderValue}
              onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            />

            <input
              type="datetime-local"
              placeholder="Valid Until"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            />

            <input
              type="number"
              placeholder="Usage Limit (empty = unlimited)"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            />

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
                onClick={() => { 
                  setShowForm(false); 
                  setEditingCoupon(null); 
                  resetForm(); 
                }}
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