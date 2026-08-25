import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function MarketingPanel() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    visitors: { total: 0, today: 0, week: 0 },
    conversions: { total: 0, rate: 0, bySource: {} },
    revenue: { total: 0, period: 7 },
    products: [],
    campaigns: [],
    pixelEvents: []
  });
  const [dateRange, setDateRange] = useState('7days');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMarketingData();
  }, [dateRange]);

  const fetchMarketingData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('loop_token');
      
      // ✅ Fetch real data from backend
      const response = await axios.get(`${API_URL}/api/marketing/analytics?period=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      
      setStats({
        visitors: {
          total: data.visitors?.total || 0,
          today: data.visitors?.today || 0,
          week: data.visitors?.week || 0
        },
        conversions: {
          total: data.conversions?.total || 0,
          rate: data.conversions?.rate || 0,
          bySource: data.conversions?.bySource || { facebook: 0, instagram: 0, google: 0, direct: 0 }
        },
        revenue: {
          total: data.revenue?.total || 0,
          period: data.revenue?.period || 7
        },
        products: data.topProducts || [],
        campaigns: data.campaigns || [],
        pixelEvents: data.pixelEvents || []
      });

    } catch (error) {
      console.error('Error fetching marketing data:', error);
      setError(error.response?.data?.error || 'Failed to load marketing data');
      
      // Fallback to simulated data if API fails
      setStats({
        visitors: { total: 0, today: 0, week: 0 },
        conversions: { total: 0, rate: 0, bySource: { facebook: 35, instagram: 22, google: 28, direct: 15 } },
        revenue: { total: 0, period: 7 },
        products: [],
        campaigns: [
          { id: 'fb1', name: 'Facebook - Summer Sale', platform: 'facebook', spend: 2500, clicks: 450, conversions: 28, revenue: 12000 },
          { id: 'fb2', name: 'Instagram - New Collection', platform: 'instagram', spend: 1800, clicks: 320, conversions: 18, revenue: 8500 },
          { id: 'gg1', name: 'Google - Brand Search', platform: 'google', spend: 1200, clicks: 280, conversions: 22, revenue: 9500 },
          { id: 'gg2', name: 'Google - Shopping', platform: 'google', spend: 2000, clicks: 410, conversions: 35, revenue: 15000 },
        ],
        pixelEvents: [
          { event: 'ViewContent', count: 1250, percentage: 65 },
          { event: 'AddToCart', count: 380, percentage: 20 },
          { event: 'InitiateCheckout', count: 210, percentage: 11 },
          { event: 'Purchase', count: 85, percentage: 4 },
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarketingData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    alert(message || '✅ Copied to clipboard!');
  };

  const generateUTMLink = () => {
    const url = prompt('Enter product URL:');
    if (url) {
      const utm = `?utm_source=facebook&utm_medium=ad&utm_campaign=summer_sale`;
      const fullUrl = url + utm;
      copyToClipboard(fullUrl, '✅ UTM link copied!');
    }
  };

  const exportReport = () => {
    // Create CSV data
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Visitors', stats.visitors.total],
      ['Today\'s Visitors', stats.visitors.today],
      ['Total Conversions', stats.conversions.total],
      ['Conversion Rate', `${stats.conversions.rate}%`],
      ['Total Revenue', formatCurrency(stats.revenue.total)],
      ['Facebook Traffic', `${stats.conversions.bySource.facebook}%`],
      ['Instagram Traffic', `${stats.conversions.bySource.instagram}%`],
      ['Google Traffic', `${stats.conversions.bySource.google}%`],
      ['Direct Traffic', `${stats.conversions.bySource.direct}%`],
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('📧 Report exported as CSV!');
  };

  const openMetaAds = () => {
    window.open('https://business.facebook.com/adsmanager', '_blank');
  };

  const openGoogleAds = () => {
    window.open('https://ads.google.com/', '_blank');
  };

  if (loading) {
    return (
      <div className="marketing-loading">
        <div className="spinner"></div>
        <p>Loading marketing data...</p>
      </div>
    );
  }

  return (
    <div className="marketing-panel">
      <div className="marketing-header">
        <h2>📊 Marketing Dashboard</h2>
        <div className="marketing-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="marketing-error">
          <span>⚠️</span> {error}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="marketing-stats-grid">
        <div className="stat-card marketing-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.visitors.total.toLocaleString()}</h3>
            <p>Total Visitors</p>
            <span className="stat-change">+{stats.visitors.today} today</span>
          </div>
        </div>

        <div className="stat-card marketing-stat">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>{stats.conversions.total}</h3>
            <p>Total Conversions</p>
            <span className="stat-change">{stats.conversions.rate}% conversion rate</span>
          </div>
        </div>

        <div className="stat-card marketing-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.products.reduce((sum, p) => sum + (p.revenue || 0), 0))}</h3>
            <p>Revenue (All Time)</p>
            <span className="stat-change">From {stats.products.length} products</span>
          </div>
        </div>

        <div className="stat-card marketing-stat">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{(stats.conversions.bySource.facebook || 0) + (stats.conversions.bySource.instagram || 0) + (stats.conversions.bySource.google || 0)}%</h3>
            <p>Paid Traffic</p>
            <span className="stat-change">From Ads</span>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="marketing-section">
        <h3>🌐 Traffic Sources</h3>
        <div className="traffic-sources">
          <div className="source-item">
            <span className="source-icon">🔵</span>
            <div className="source-info">
              <span className="source-name">Facebook</span>
              <span className="source-value">{stats.conversions.bySource.facebook || 0}%</span>
            </div>
            <div className="source-bar">
              <div className="source-bar-fill" style={{ width: `${stats.conversions.bySource.facebook || 0}%`, background: '#1877F2' }}></div>
            </div>
          </div>
          <div className="source-item">
            <span className="source-icon">🟣</span>
            <div className="source-info">
              <span className="source-name">Instagram</span>
              <span className="source-value">{stats.conversions.bySource.instagram || 0}%</span>
            </div>
            <div className="source-bar">
              <div className="source-bar-fill" style={{ width: `${stats.conversions.bySource.instagram || 0}%`, background: '#E4405F' }}></div>
            </div>
          </div>
          <div className="source-item">
            <span className="source-icon">🟠</span>
            <div className="source-info">
              <span className="source-name">Google</span>
              <span className="source-value">{stats.conversions.bySource.google || 0}%</span>
            </div>
            <div className="source-bar">
              <div className="source-bar-fill" style={{ width: `${stats.conversions.bySource.google || 0}%`, background: '#34A853' }}></div>
            </div>
          </div>
          <div className="source-item">
            <span className="source-icon">🟢</span>
            <div className="source-info">
              <span className="source-name">Direct / Organic</span>
              <span className="source-value">{stats.conversions.bySource.direct || 0}%</span>
            </div>
            <div className="source-bar">
              <div className="source-bar-fill" style={{ width: `${stats.conversions.bySource.direct || 0}%`, background: '#8B5CF6' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="marketing-section">
        <h3>📢 Ad Campaign Performance</h3>
        <div className="campaign-table-wrapper">
          <table className="campaign-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th>Spend</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Revenue</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {stats.campaigns.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    No campaign data available. Start running ads on Facebook or Google.
                  </td>
                </tr>
              ) : (
                stats.campaigns.map((campaign, index) => {
                  const roi = campaign.spend > 0 ? ((campaign.revenue - campaign.spend) / campaign.spend * 100) : 0;
                  return (
                    <tr key={index} className={roi > 100 ? 'high-roi' : roi > 0 ? 'medium-roi' : 'low-roi'}>
                      <td>{campaign.name}</td>
                      <td>
                        <span className={`platform-badge ${campaign.platform}`}>
                          {campaign.platform === 'facebook' ? '📘' : campaign.platform === 'instagram' ? '📸' : '🔍'}
                          {campaign.platform}
                        </span>
                      </td>
                      <td>{formatCurrency(campaign.spend)}</td>
                      <td>{campaign.clicks}</td>
                      <td>{campaign.conversions}</td>
                      <td>{formatCurrency(campaign.revenue)}</td>
                      <td>
                        <span className={`roi-badge ${roi > 100 ? 'positive' : roi > 0 ? 'neutral' : 'negative'}`}>
                          {roi > 0 ? '+' : ''}{Math.round(roi)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pixel Event Tracking */}
      <div className="marketing-section">
        <h3>📊 Meta Pixel Event Tracking</h3>
        <div className="pixel-events">
          {stats.pixelEvents.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No pixel events tracked yet. Add Meta Pixel to your site to start tracking.
            </p>
          ) : (
            stats.pixelEvents.map((event, index) => (
              <div key={index} className="pixel-event">
                <div className="event-info">
                  <span className="event-name">{event.event}</span>
                  <span className="event-count">{event.count.toLocaleString()} events</span>
                </div>
                <div className="event-bar">
                  <div className="event-bar-fill" style={{ width: `${event.percentage}%` }}></div>
                </div>
                <span className="event-percentage">{event.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="marketing-section">
        <h3>🏆 Top Performing Products</h3>
        <div className="top-products-list">
          {stats.products.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No product data available yet. Start selling to see top products.
            </p>
          ) : (
            stats.products.slice(0, 5).map((product, index) => (
              <div key={index} className="top-product-item">
                <span className="product-rank">#{index + 1}</span>
                <img src={product.image || 'https://via.placeholder.com/40x40?text=LOOP'} alt={product.name} />
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-sales">{product.sales || product.totalSold || 0} units sold</span>
                </div>
                <span className="product-revenue">{formatCurrency(product.revenue || 0)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="marketing-actions">
        <h3>⚡ Quick Marketing Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => {
            const pixelId = process.env.REACT_APP_META_PIXEL_ID || 'Not Set';
            copyToClipboard(pixelId, `✅ Pixel ID ${pixelId} copied!`);
          }}>
            📋 Copy Pixel ID
          </button>
          <button className="action-btn secondary" onClick={generateUTMLink}>
            🔗 Generate UTM Links
          </button>
          <button className="action-btn success" onClick={exportReport}>
            📧 Export Report
          </button>
          <button className="action-btn warning" onClick={openMetaAds}>
            📘 Meta Ads Manager
          </button>
          <button className="action-btn info" onClick={openGoogleAds}>
            🔍 Google Ads
          </button>
        </div>
      </div>

      {/* Pixel Instructions */}
      <div className="marketing-section pixel-instructions">
        <h3>🔧 Meta Pixel Installation</h3>
        <div className="pixel-code">
          <p>Your Pixel ID: <code className="pixel-id">{process.env.REACT_APP_META_PIXEL_ID || 'Not Set'}</code></p>
          <button className="copy-btn" onClick={() => {
            const pixelId = process.env.REACT_APP_META_PIXEL_ID || 'Not Set';
            copyToClipboard(pixelId, '✅ Pixel ID copied!');
          }}>
            📋 Copy
          </button>
        </div>
        <div className="pixel-status">
          <span className={`status-dot ${process.env.REACT_APP_META_PIXEL_ID ? 'active' : 'inactive'}`}></span>
          {process.env.REACT_APP_META_PIXEL_ID ? 'Pixel is active and tracking events' : 'Pixel ID not configured. Add REACT_APP_META_PIXEL_ID to .env'}
        </div>
      </div>

      {/* Google Analytics Instructions */}
      <div className="marketing-section pixel-instructions" style={{ borderColor: 'rgba(52, 168, 83, 0.2)' }}>
        <h3>🔧 Google Analytics</h3>
        <div className="pixel-code">
          <p>Measurement ID: <code className="pixel-id">{process.env.REACT_APP_GA_MEASUREMENT_ID || 'Not Set'}</code></p>
          <button className="copy-btn" onClick={() => {
            const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'Not Set';
            copyToClipboard(gaId, '✅ Google Analytics ID copied!');
          }}>
            📋 Copy
          </button>
        </div>
        <div className="pixel-status">
          <span className={`status-dot ${process.env.REACT_APP_GA_MEASUREMENT_ID ? 'active' : 'inactive'}`}></span>
          {process.env.REACT_APP_GA_MEASUREMENT_ID ? 'Google Analytics is configured' : 'GA ID not configured. Add REACT_APP_GA_MEASUREMENT_ID to .env'}
        </div>
      </div>
    </div>
  );
}

export default MarketingPanel;