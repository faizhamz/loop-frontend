import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ReferralPanel() {
  const [settings, setSettings] = useState({
    isEnabled: true,
    rewardAmount: 100,
    minimumOrderValue: 500,
    welcomeBonus: 50,
    rewardDescription: 'Referral bonus'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchAnalytics();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/referral/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/referral/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : Number(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('loop_token');
      await axios.put(`${API_URL}/api/referral/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('✅ Referral settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading referral settings...</div>;

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
        <h2 style={{ color: '#fff' }}>🎯 Referral Program</h2>
        <span style={{ 
          padding: '4px 12px', 
          borderRadius: '20px',
          background: settings.isEnabled ? '#28a745' : '#ff4444',
          color: '#fff',
          fontSize: '12px'
        }}>
          {settings.isEnabled ? '🟢 Active' : '🔴 Disabled'}
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

      {/* Analytics Dashboard */}
      {analytics && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div className="stat-card">
            <h3 style={{ color: '#D4AF37' }}>{analytics.stats?.totalReferrals || 0}</h3>
            <p style={{ color: '#888' }}>Total Referrals</p>
          </div>
          <div className="stat-card">
            <h3 style={{ color: '#D4AF37' }}>₹{analytics.stats?.totalEarned || 0}</h3>
            <p style={{ color: '#888' }}>Total Paid Out</p>
          </div>
          <div className="stat-card">
            <h3 style={{ color: '#ff8800' }}>{analytics.stats?.pendingReferrals || 0}</h3>
            <p style={{ color: '#888' }}>Pending</p>
          </div>
          <div className="stat-card">
            <h3 style={{ color: '#D4AF37' }}>₹{settings.rewardAmount}</h3>
            <p style={{ color: '#888' }}>Per Referral</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="isEnabled"
              checked={settings.isEnabled}
              onChange={handleChange}
            />
            Enable Referral Program
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            💰 Referral Reward Amount (₹)
          </label>
          <input
            type="number"
            name="rewardAmount"
            value={settings.rewardAmount}
            onChange={handleChange}
            min="0"
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: '#222', 
              border: '1px solid #333', 
              color: 'white', 
              borderRadius: '4px' 
            }}
            required
          />
          <small style={{ color: '#666' }}>Amount given to referrer when referred user completes first order</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            📦 Minimum Order Value (₹)
          </label>
          <input
            type="number"
            name="minimumOrderValue"
            value={settings.minimumOrderValue}
            onChange={handleChange}
            min="0"
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: '#222', 
              border: '1px solid #333', 
              color: 'white', 
              borderRadius: '4px' 
            }}
            required
          />
          <small style={{ color: '#666' }}>Minimum order value required for referral reward</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            🎉 Welcome Bonus (₹)
          </label>
          <input
            type="number"
            name="welcomeBonus"
            value={settings.welcomeBonus}
            onChange={handleChange}
            min="0"
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: '#222', 
              border: '1px solid #333', 
              color: 'white', 
              borderRadius: '4px' 
            }}
            required
          />
          <small style={{ color: '#666' }}>Bonus given to new user who signs up with referral</small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            📝 Reward Description
          </label>
          <input
            type="text"
            name="rewardDescription"
            value={settings.rewardDescription}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: '#222', 
              border: '1px solid #333', 
              color: 'white', 
              borderRadius: '4px' 
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          style={{
            width: '100%',
            background: '#D4AF37',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#000'
          }}
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </form>

      {/* Top Referrers */}
      {analytics?.topReferrers && analytics.topReferrers.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#D4AF37' }}>🏆 Top Referrers</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333', color: '#888' }}>Rank</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333', color: '#888' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333', color: '#888' }}>Referral Code</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333', color: '#888' }}>Total Referrals</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topReferrers.map((user, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', color: '#D4AF37' }}>#{index + 1}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', color: '#fff' }}>{user.name}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <code style={{ background: '#222', padding: '2px 8px', borderRadius: '4px', color: '#D4AF37' }}>
                      {user.referralCode}
                    </code>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', color: '#D4AF37' }}>{user.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReferralPanel;