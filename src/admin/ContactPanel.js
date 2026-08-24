import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ContactPanel() {
  const [contact, setContact] = useState({
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
    customFields: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/contact`);
      setContact(response.data);
    } catch (error) {
      console.error('Error fetching contact:', error);
      setError('Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact({ ...contact, [name]: value });
  };

  const handleCustomFieldChange = (index, field, value) => {
    const newFields = [...contact.customFields];
    newFields[index][field] = value;
    setContact({ ...contact, customFields: newFields });
  };

  const addCustomField = () => {
    setContact({
      ...contact,
      customFields: [...contact.customFields, { label: '', value: '' }]
    });
  };

  const removeCustomField = (index) => {
    const newFields = contact.customFields.filter((_, i) => i !== index);
    setContact({ ...contact, customFields: newFields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('loop_token');
      await axios.put(
        `${API_URL}/api/contact/admin`,
        contact,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('✅ Contact information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating contact:', error);
      setError('Failed to update contact information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading contact information...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📧 Contact Information</h2>
        <span style={{ color: '#888', fontSize: '14px' }}>
          Only fields with values will be displayed on the contact page
        </span>
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

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '16px' }}>📧 Email & Phone</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Email</label>
            <input
              type="email"
              name="email"
              value={contact.email || ''}
              onChange={handleChange}
              placeholder="contact@loop.com"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Phone</label>
            <input
              type="text"
              name="phone"
              value={contact.phone || ''}
              onChange={handleChange}
              placeholder="+91 9876543210"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>WhatsApp</label>
            <input
              type="text"
              name="whatsapp"
              value={contact.whatsapp || ''}
              onChange={handleChange}
              placeholder="+91 9876543210"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '16px' }}>📍 Address</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Street Address</label>
            <input
              type="text"
              name="address"
              value={contact.address || ''}
              onChange={handleChange}
              placeholder="123 Main Street"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>City</label>
              <input
                type="text"
                name="city"
                value={contact.city || ''}
                onChange={handleChange}
                placeholder="Mumbai"
                style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
              />
            </div>
            <div style={{ flex: 1, marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>State</label>
              <input
                type="text"
                name="state"
                value={contact.state || ''}
                onChange={handleChange}
                placeholder="Maharashtra"
                style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={contact.pincode || ''}
              onChange={handleChange}
              placeholder="400001"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '16px' }}>🌐 Social Media</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Instagram (username)</label>
            <input
              type="text"
              name="instagram"
              value={contact.instagram || ''}
              onChange={handleChange}
              placeholder="loopclothing"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Facebook (page name)</label>
            <input
              type="text"
              name="facebook"
              value={contact.facebook || ''}
              onChange={handleChange}
              placeholder="loopclothing"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>YouTube (channel handle)</label>
            <input
              type="text"
              name="youtube"
              value={contact.youtube || ''}
              onChange={handleChange}
              placeholder="loopclothing"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Twitter (username)</label>
            <input
              type="text"
              name="twitter"
              value={contact.twitter || ''}
              onChange={handleChange}
              placeholder="loopclothing"
              style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#D4AF37', fontSize: '16px' }}>📌 Custom Fields</h3>
            <button
              type="button"
              onClick={addCustomField}
              style={{ background: '#D4AF37', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Add Field
            </button>
          </div>

          {contact.customFields && contact.customFields.map((field, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Label (e.g., Store Hours)"
                value={field.label || ''}
                onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                style={{ flex: 1, padding: '8px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Value (e.g., 10AM - 8PM)"
                value={field.value || ''}
                onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                style={{ flex: 2, padding: '8px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
              />
              <button
                type="button"
                onClick={() => removeCustomField(index)}
                style={{ background: '#ff4444', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            background: '#D4AF37',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            width: '100%'
          }}
        >
          {saving ? 'Saving...' : '💾 Save Contact Information'}
        </button>
      </form>
    </div>
  );
}

export default ContactPanel;