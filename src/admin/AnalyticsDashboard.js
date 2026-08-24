import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/admin/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div style={{ color: '#ff4444' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#D4AF37', marginBottom: '30px' }}>📊 Analytics Dashboard</h1>

      {/* Revenue Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '28px', color: '#D4AF37' }}>₹{data?.revenue?.total?.toLocaleString() || 0}</h3>
          <p style={{ color: '#888' }}>Total Revenue</p>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '28px', color: '#28a745' }}>₹{data?.revenue?.today?.toLocaleString() || 0}</h3>
          <p style={{ color: '#888' }}>Today's Revenue</p>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '28px', color: '#D4AF37' }}>₹{data?.revenue?.week?.toLocaleString() || 0}</h3>
          <p style={{ color: '#888' }}>This Week</p>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '28px', color: '#D4AF37' }}>₹{data?.revenue?.month?.toLocaleString() || 0}</h3>
          <p style={{ color: '#888' }}>This Month</p>
        </div>
      </div>

      {/* Order Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#fff' }}>{data?.orders?.total || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>Total Orders</p>
        </div>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #ff8800', textAlign: 'center' }}>
          <h3 style={{ color: '#ff8800' }}>{data?.orders?.pending || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>🟡 Pending</p>
        </div>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #0066FF', textAlign: 'center' }}>
          <h3 style={{ color: '#0066FF' }}>{data?.orders?.processing || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>🔵 Processing</p>
        </div>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #D4AF37', textAlign: 'center' }}>
          <h3 style={{ color: '#D4AF37' }}>{data?.orders?.shipped || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>🟡 Shipped</p>
        </div>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #28a745', textAlign: 'center' }}>
          <h3 style={{ color: '#28a745' }}>{data?.orders?.delivered || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>🟢 Delivered</p>
        </div>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #ff4444', textAlign: 'center' }}>
          <h3 style={{ color: '#ff4444' }}>{data?.orders?.cancelled || 0}</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>🔴 Cancelled</p>
        </div>
      </div>

      {/* Top Products */}
      <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
        <h3 style={{ color: '#D4AF37', marginBottom: '15px' }}>🏆 Top Products</h3>
        {data?.topProducts?.length > 0 ? (
          data.topProducts.map((product, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 15px',
              borderBottom: '1px solid #222'
            }}>
              <span>{index + 1}. {product.name}</span>
              <span style={{ color: '#D4AF37' }}>{product.totalSold} sold • ₹{product.revenue}</span>
            </div>
          ))
        ) : (
          <p style={{ color: '#888' }}>No products sold yet</p>
        )}
      </div>

      {/* Customer Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#fff' }}>{data?.customers?.total || 0}</h3>
          <p style={{ color: '#888' }}>Total Customers</p>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#D4AF37' }}>{data?.customers?.withOrders || 0}</h3>
          <p style={{ color: '#888' }}>Customers with Orders</p>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#D4AF37' }}>₹{data?.averageOrderValue || 0}</h3>
          <p style={{ color: '#888' }}>Average Order Value</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;