import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function Addresses() {
  // ✅ CHANGED: Get user and setUser from AppContext
  const { user, setUser, showToast } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    landmark: '',
    label: 'Home',
    isDefault: false
  });

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      landmark: '',
      label: 'Home',
      isDefault: false
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleEdit = (index) => {
    setFormData(addresses[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      
      let updatedAddresses;
      if (editingIndex !== null) {
        updatedAddresses = [...addresses];
        updatedAddresses[editingIndex] = formData;
      } else {
        updatedAddresses = [...addresses, formData];
      }

      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr === formData || (editingIndex !== null && addresses.indexOf(addr) === editingIndex)
            ? true
            : false
        }));
      }

      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        { addresses: updatedAddresses },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem('loop_user', JSON.stringify(updatedUser));
      setAddresses(updatedAddresses);
      
      showToast(editingIndex !== null ? '✅ Address updated!' : '✅ Address added!', 'success');
      resetForm();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this address?')) return;
    
    try {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      const token = localStorage.getItem('loop_token');
      
      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        { addresses: updatedAddresses },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem('loop_user', JSON.stringify(updatedUser));
      setAddresses(updatedAddresses);
      
      showToast('🗑️ Address deleted', 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete address', 'error');
    }
  };

  const setDefault = async (index) => {
    try {
      const updatedAddresses = addresses.map((addr, i) => ({
        ...addr,
        isDefault: i === index
      }));
      
      const token = localStorage.getItem('loop_token');
      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        { addresses: updatedAddresses },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem('loop_user', JSON.stringify(updatedUser));
      setAddresses(updatedAddresses);
      
      showToast('✅ Default address updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set default address', 'error');
    }
  };

  return (
    <div className="addresses-page">
      <div className="container">
        <div className="addresses-header">
          <h1>🏠 Saved Addresses</h1>
          <p>Manage your shipping addresses</p>
          <button className="add-address-btn" onClick={() => setShowForm(true)}>
            + Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="no-addresses">
            <div className="no-addresses-icon">📍</div>
            <h3>No Addresses Saved</h3>
            <p>Add your first address for faster checkout</p>
          </div>
        ) : (
          <div className="addresses-grid">
            {addresses.map((address, index) => (
              <div key={index} className="address-card">
                {address.isDefault && (
                  <span className="default-badge">Default</span>
                )}
                <div className="address-label">{address.label}</div>
                <div className="address-name">{address.name}</div>
                <div className="address-detail">{address.street}</div>
                <div className="address-detail">
                  {address.city}, {address.state}
                </div>
                <div className="address-detail">Pincode: {address.pincode}</div>
                {address.phone && (
                  <div className="address-detail">📞 {address.phone}</div>
                )}
                {address.landmark && (
                  <div className="address-detail">📍 {address.landmark}</div>
                )}
                <div className="address-actions">
                  {!address.isDefault && (
                    <button 
                      className="address-set-default"
                      onClick={() => setDefault(index)}
                    >
                      Set Default
                    </button>
                  )}
                  <button 
                    className="address-edit"
                    onClick={() => handleEdit(index)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="address-delete"
                    onClick={() => handleDelete(index)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Address Form Modal */}
        {showForm && (
          <div className="address-form-overlay" onClick={() => resetForm()}>
            <div className="address-form-modal" onClick={(e) => e.stopPropagation()}>
              <button className="address-form-close" onClick={resetForm}>✕</button>
              <h3>{editingIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
              
              <form onSubmit={handleSubmit} className="address-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Label</label>
                    <select
                      name="label"
                      value={formData.label}
                      onChange={handleChange}
                    >
                      <option value="Home">🏠 Home</option>
                      <option value="Work">💼 Work</option>
                      <option value="Other">📍 Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Landmark (optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                  />
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                    Set as default address
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="form-cancel" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="form-submit" disabled={loading}>
                    {loading ? 'Saving...' : editingIndex !== null ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Addresses;