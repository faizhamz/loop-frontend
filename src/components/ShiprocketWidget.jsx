import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ShiprocketWidget.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ShiprocketWidget() {
  const [data, setData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statusRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/api/shiprocket/status`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/shiprocket/dashboard`, { headers }).catch(() => ({ data: {} }))
      ]);

      setConfigured(!!statusRes.data.configured);
      setData(dashRes.data);

      if (statusRes.data.configured) {
        axios.get(`${API_URL}/api/shiprocket/balance`, { headers })
          .then(r => setBalance(r.data.balance))
          .catch(() => {});
      }
    } catch (err) {
      console.error('Shiprocket widget error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sr-widget">
        <div className="sr-widget-header">
          <span>🚚 Shiprocket</span>
        </div>
        <div className="sr-widget-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sr-widget">
      <div className="sr-widget-header">
        <span>🚚 Shiprocket</span>
        <button onClick={fetchData} className="sr-widget-refresh" title="Refresh">🔄</button>
      </div>

      {!configured && (
        <div className="sr-widget-warning">
          ⚠️ Shiprocket not configured. Add API credentials to backend <code>.env</code>.
        </div>
      )}

      {configured && data && (
        <>
          <div className="sr-widget-grid">
            <div className="sr-widget-stat">
              <span className="sr-widget-stat-value">{balance !== null ? `₹${balance}` : '—'}</span>
              <span className="sr-widget-stat-label">Balance</span>
            </div>
            <div className="sr-widget-stat">
              <span className="sr-widget-stat-value">{data.totalShipped || 0}</span>
              <span className="sr-widget-stat-label">Total Shipped</span>
            </div>
            <div className="sr-widget-stat">
              <span className="sr-widget-stat-value">{data.inTransit || 0}</span>
              <span className="sr-widget-stat-label">In Transit</span>
            </div>
            <div className="sr-widget-stat">
              <span className="sr-widget-stat-value">{data.deliveredToday || 0}</span>
              <span className="sr-widget-stat-label">Delivered Today</span>
            </div>
          </div>

          {data.ndrCount > 0 && (
            <div className="sr-widget-ndr">
              <span>⚠️ {data.ndrCount} NDR pending</span>
              <Link to="/admin/ndr" className="sr-widget-ndr-link">View →</Link>
            </div>
          )}

          {data.pendingShipment > 0 && (
            <div className="sr-widget-note">
              {data.pendingShipment} paid orders awaiting shipment
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShiprocketWidget;