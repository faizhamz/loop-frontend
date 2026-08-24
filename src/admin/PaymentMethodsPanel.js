import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function PaymentMethodsPanel() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // ✅ FIX: Complete initial state
  const [formData, setFormData] = useState({ 
    name: 'UPI', 
    upiId: '', 
    qrCode: '' 
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Complete reset function
  const resetForm = () => {
    setFormData({ 
      name: 'UPI', 
      upiId: '', 
      qrCode: '' 
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('loop_token');
      await axios.post(`${API_URL}/api/payment-methods`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('✅ UPI payment method added successfully!');
      resetForm(); // ✅ Reset after save
      setShowForm(false);
      fetchMethods();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.put(`${API_URL}/api/payment-methods/${id}`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment method?')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/payment-methods/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  if (loading) return <div>Loading payment methods...</div>;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #333'
      }}>
        <h2>💳 Payment Methods (UPI + QR)</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
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
          ➕ Add UPI / QR
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

      {methods.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No payment methods yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => { setShowForm(true); resetForm(); }}>"➕ Add UPI / QR"</strong> button above to add your first payment method.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>UPI ID</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>QR Code</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(method => (
              <tr key={method._id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{method.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}><code>{method.upiId}</code></td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  {method.qrCode ? (
                    <img src={method.qrCode} alt="QR" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : 'No QR'}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '4px', background: method.isActive ? '#28a745' : '#555', color: '#fff', fontSize: '12px' }}>
                    {method.isActive ? '🟢 Active' : '⚪ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <button onClick={() => handleToggle(method._id, method.isActive)} style={{ marginRight: '5px', background: method.isActive ? '#ff8800' : '#28a745', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                    {method.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(method._id)} style={{ background: '#ff4444', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Active Method Preview */}
      {methods.filter(m => m.isActive).length > 0 && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#111', 
          borderRadius: '8px', 
          border: '1px solid #D4AF37'
        }}>
          <h3 style={{ color: '#D4AF37', marginBottom: '10px' }}>✅ Currently Active (Shown to Customers)</h3>
          {methods.filter(m => m.isActive).map(m => (
            <div key={m._id}>
              <p><strong>Name:</strong> {m.name}</p>
              <p><strong>UPI ID:</strong> <code style={{ background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{m.upiId}</code></p>
              {m.qrCode && (
                <div>
                  <p><strong>QR Code:</strong></p>
                  <img src={m.qrCode} alt="Active QR" style={{ width: '150px', height: '150px', objectFit: 'contain', border: '1px solid #333', borderRadius: '8px' }} />
                </div>
              )}
              <p style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
                💡 This UPI method will appear at checkout for customers
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
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
          padding: '20px'
        }}>
          <form onSubmit={handleSave} style={{
            background: '#111',
            padding: '30px',
            borderRadius: '12px',
            width: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h2 style={{ color: '#D4AF37', marginBottom: '20px' }}>➕ Add UPI / QR Payment Method</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Payment Name</label>
              <input type="text" placeholder="e.g., PhonePe UPI" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }} required />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '5px' }}>UPI ID *</label>
              <input type="text" placeholder="e.g., loop@okhdfcbank" value={formData.upiId} onChange={(e) => setFormData({ ...formData, upiId: e.target.value })} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }} required />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '5px' }}>QR Code Image URL *</label>
              <input type="text" placeholder="https://example.com/qr-code.png" value={formData.qrCode} onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }} required />
              <p style={{ color: '#666', fontSize: '12px', marginTop: '6px' }}>
                💡 Upload QR to ImgBB, Cloudinary, or any image hosting service and paste the direct image URL here.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" style={{ flex: 1, background: '#D4AF37', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Payment Method'}
              </button>
              <button type="button" onClick={() => { 
                setShowForm(false); 
                resetForm(); 
              }} style={{ padding: '12px 24px', background: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodsPanel;