import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './AnalyticsPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function AnalyticsPanel() {
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/analytics/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="analytics-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>{error}</p>
        <button onClick={fetchAnalytics}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-empty">
        <p>No analytics data available yet</p>
      </div>
    );
  }

  const { summary, topProducts, topBanners, chartData } = data;

  return (
    <div className="analytics-panel">
      {/* Header */}
      <div className="analytics-header">
        <h2>📈 Analytics Dashboard</h2>
        <div className="analytics-period-selector">
          <button 
            className={period === 'today' ? 'active' : ''} 
            onClick={() => setPeriod('today')}
          >
            Today
          </button>
          <button 
            className={period === 'week' ? 'active' : ''} 
            onClick={() => setPeriod('week')}
          >
            This Week
          </button>
          <button 
            className={period === 'month' ? 'active' : ''} 
            onClick={() => setPeriod('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="analytics-stats-grid">
        <motion.div 
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{summary.totalUniqueVisitors.toLocaleString()}</h3>
            <p>Unique Visitors</p>
          </div>
        </motion.div>

        <motion.div 
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>{summary.activeUsers}</h3>
            <p>Active Users Now</p>
            <span className="stat-badge">Last 5 min</span>
          </div>
        </motion.div>

        <motion.div 
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{summary.totalProductViews.toLocaleString()}</h3>
            <p>Product Views</p>
          </div>
        </motion.div>

        <motion.div 
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-icon">📸</div>
          <div className="stat-content">
            <h3>{summary.totalBannerClicks.toLocaleString()}</h3>
            <p>Banner Clicks</p>
          </div>
        </motion.div>
      </div>

      {/* Chart - Visitors Trend */}
      <motion.div 
        className="analytics-chart-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>📈 Visitor Trends</h3>
        <div className="analytics-chart">
          {chartData && chartData.length > 0 ? (
            <div className="chart-bars">
              {chartData.map((item, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className="chart-bar"
                    style={{
                      height: `${Math.max(5, (item.visitors / Math.max(...chartData.map(d => d.visitors))) * 80)}%`
                    }}
                  >
                    <span className="chart-bar-value">{item.visitors}</span>
                  </div>
                  <span className="chart-bar-label">
                    {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="chart-empty">No data for this period</p>
          )}
        </div>
      </motion.div>

      {/* Top Products & Banners */}
      <div className="analytics-grid-2col">
        {/* Top Products */}
        <motion.div 
          className="analytics-list-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>📦 Top Products</h3>
          <div className="analytics-list">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id} className="analytics-list-item">
                  <span className="list-rank">{index + 1}</span>
                  <div className="list-info">
                    <span className="list-name">{product.name}</span>
                    <span className="list-id">{product.productId}</span>
                  </div>
                  <span className="list-count">{product.views} views</span>
                </div>
              ))
            ) : (
              <p className="list-empty">No product data yet</p>
            )}
          </div>
        </motion.div>

        {/* Top Banners */}
        <motion.div 
          className="analytics-list-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>📸 Top Banners</h3>
          <div className="analytics-list">
            {topBanners && topBanners.length > 0 ? (
              topBanners.slice(0, 5).map((banner, index) => (
                <div key={banner._id} className="analytics-list-item">
                  <span className="list-rank">{index + 1}</span>
                  <div className="list-info">
                    <span className="list-name">{banner.title}</span>
                    <span className="list-type">{banner.bannerType}</span>
                  </div>
                  <span className="list-count">{banner.clicks} clicks</span>
                </div>
              ))
            ) : (
              <p className="list-empty">No banner data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="analytics-footer">
        <span className="analytics-live-badge">🟢 Live</span>
        <span className="analytics-update-time">Auto-refreshes every 60s</span>
      </div>
    </div>
  );
}

export default AnalyticsPanel;