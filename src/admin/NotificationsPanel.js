import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // ✅ FIX: Complete initial state
  const [formData, setFormData] = useState({
    message: '',
    type: 'info',
    priority: 'medium',
    targetType: 'all',
    targetUserIds: [],
    targetUserNames: [],
    targetGroups: [],
    publishDate: new Date().toISOString().slice(0, 16),
    expiryDate: '',
    link: '',
    isDismissible: true
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/notifications/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Complete reset function
  const resetForm = () => {
    setFormData({
      message: '',
      type: 'info',
      priority: 'medium',
      targetType: 'all',
      targetUserIds: [],
      targetUserNames: [],
      targetGroups: [],
      publishDate: new Date().toISOString().slice(0, 16),
      expiryDate: '',
      link: '',
      isDismissible: true
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
      await axios.post(`${API_URL}/api/notifications`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('✅ Notification added successfully!');
      resetForm(); // ✅ Reset after save
      setShowForm(false);
      fetchNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving notification:', error);
      setError(error.response?.data?.error || 'Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      setSuccess('🗑️ Notification deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.patch(`${API_URL}/api/notifications/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error toggling notification:', error);
      setError('Failed to toggle notification');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'success': '#28a745',
      'error': '#ff4444',
      'warning': '#ff8800',
      'info': '#D4AF37'
    };
    return colors[type] || '#888';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || '📌';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'low': '🟢 Low',
      'medium': '🟡 Medium',
      'high': '🔴 High'
    };
    return labels[priority] || '🟡 Medium';
  };

  const getTargetLabel = (targetType) => {
    const labels = {
      'all': '🌍 All Users',
      'logged-in': '🔐 Logged-in Users',
      'guest': '👤 Guests'
    };
    return labels[targetType] || '🌍 All Users';
  };

  if (loading) return <div>Loading notifications...</div>;

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
        <h2>🔔 Notifications</h2>
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
          ➕ Add Notification
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

      {notifications.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No notifications yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => { setShowForm(true); resetForm(); }}>"➕ Add Notification"</strong> button above to create your first notification.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Message</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Target</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Priority</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(notif => {
              const isActive = notif.isActive && !notif.isDeleted;
              return (
                <tr key={notif._id} style={{ opacity: isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{ color: getTypeColor(notif.type) }}>
                      {getTypeIcon(notif.type)} {notif.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div>{notif.message}</div>
                    {notif.link && <div style={{ color: '#D4AF37', fontSize: '11px' }}>🔗 {notif.link}</div>}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', fontSize: '13px' }}>
                    {getTargetLabel(notif.targetType)}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', fontSize: '13px' }}>
                    {getPriorityLabel(notif.priority)}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: isActive ? '#28a745' : '#555',
                      color: '#fff',
                      fontSize: '12px'
                    }}>
                      {isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <button 
                      onClick={() => handleToggle(notif._id, notif.isActive)} 
                      style={{ marginRight: '5px', background: isActive ? '#ff8800' : '#28a745', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      {isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={() => handleDelete(notif._id)} 
                      style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ADD FORM MODAL */}
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
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>➕ Add New Notification</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Message *</label>
              <input
                type="text"
                placeholder="Enter notification message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="success">✅ Success</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="error">❌ Error</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Target Audience</label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              >
                <option value="all">🌍 All Users</option>
                <option value="logged-in">🔐 Logged-in Users</option>
                <option value="guest">👤 Guests</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Publish Date</label>
                <input
                  type="datetime-local"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Expiry Date (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Link (optional)</label>
              <input
                type="text"
                placeholder="/product/abc or /orders"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', cursor: 'pointer', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={formData.isDismissible}
                onChange={(e) => setFormData({ ...formData, isDismissible: e.target.checked })}
              />
              Users can dismiss this notification
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
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
                {saving ? 'Saving...' : '💾 Add Notification'}
              </button>
              <button 
                type="button" 
                onClick={() => { 
                  setShowForm(false); 
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

export default NotificationsPanel;