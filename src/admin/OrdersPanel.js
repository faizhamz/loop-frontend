import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// ============================================
// FAILED ORDERS VIEW (component)
// ============================================
function FailedOrdersView({ orders, stats, onRefresh, onViewOrder }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })
      .format(amount || 0);

  return (
    <div>
      {stats && (
        <div className="orders-stats-grid" style={{ marginBottom: '20px' }}>
          <div className="orders-stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalFailed}</span>
              <span className="stat-label">Total Failed</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-number">{stats.abandoned}</span>
              <span className="stat-label">Abandoned</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-info">
              <span className="stat-number">{stats.failedPayment}</span>
              <span className="stat-label">Payment Failed</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-info">
              <span className="stat-number">{formatCurrency(stats.totalValueLost)}</span>
              <span className="stat-label">Lost Revenue</span>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, color: '#fff' }}>❌ Failed & Abandoned Orders (Last 30 Days)</h3>
        <button
          onClick={onRefresh}
          style={{
            padding: '6px 16px',
            background: '#333',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#888',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <p style={{ fontSize: '16px' }}>No failed or abandoned orders 🎉</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            All your customers are completing their payments.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Total</th>
                <th>Failure Reason</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="order-row">
                  <td className="order-id-cell">
                    <strong>{order.orderId}</strong>
                  </td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{order.customer?.name || 'Guest'}</span>
                      <span className="customer-email">{order.customer?.email || 'No email'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#ccc' }}>
                      {order.customer?.phone || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#D4AF37' }}>{formatCurrency(order.total)}</strong>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '12px',
                      color: '#ff8800',
                      background: 'rgba(255, 136, 0, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      {order.failedReason || (
                        order.paymentStatus === 'failed'
                          ? 'Payment failed'
                          : 'Abandoned (payment timeout)'
                      )}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {formatDate(order.failedAt || order.createdAt)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onViewOrder(order)}
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      📋
                    </button>
                    <a
                      href={`https://wa.me/${(order.customer?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.customer?.name || 'there'}, we noticed your order #${order.orderId} didn't complete. Need any help?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn"
                      title="Contact Customer"
                      style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25D366', marginLeft: '4px' }}
                    >
                      💬
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [expandedModalSections, setExpandedModalSections] = useState([]);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [shippingId, setShippingId] = useState(null);

  // Failed orders state
  const [failedOrders, setFailedOrders] = useState([]);
  const [failedStats, setFailedStats] = useState(null);
  const [showFailedView, setShowFailedView] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCleanupStats();
    fetchFailedOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/cleanup-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCleanupStats(response.data);
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
    }
  };

  const fetchFailedOrders = async () => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/failed-orders?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFailedOrders(response.data.orders || []);
      setFailedStats(response.data.stats || null);
    } catch (error) {
      console.error('Error fetching failed orders:', error);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`This will cancel ${cleanupStats?.expiredPendingOrders || 0} pending orders older than 30 minutes. Continue?`)) return;

    setCleaning(true);
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.post(`${API_URL}/api/admin/cleanup-pending-orders`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchOrders();
      fetchCleanupStats();
      fetchFailedOrders();
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Failed to cleanup orders');
    } finally {
      setCleaning(false);
    }
  };

  // ============================================
  // SHIPROCKET ACTIONS
  // ============================================
  const createShipment = async (order) => {
    if (!window.confirm(`Create shipment for order ${order.orderId}?`)) return;
    setShippingId(order._id);
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API_URL}/api/shiprocket/create/${order._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert(`✅ Shipment created!\nAWB: ${response.data.awbCode || 'Generating...'}\nCourier: ${response.data.courierName || 'Auto-assigned'}`);
        fetchOrders();
      } else {
        alert(response.data.error || 'Failed to create shipment');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create shipment');
    } finally {
      setShippingId(null);
    }
  };

  const downloadLabel = async (order) => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API_URL}/api/shiprocket/label/${order._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.labelUrl) {
        window.open(response.data.labelUrl, '_blank');
      } else {
        alert('Label not ready yet. Try again in 30 seconds.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not fetch label');
    }
  };

  const schedulePickup = async (order) => {
    if (!window.confirm(`Schedule pickup for ${order.orderId}?`)) return;
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/api/shiprocket/pickup/${order._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Pickup scheduled! Courier will pick up today or tomorrow.');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule pickup');
    }
  };

  const cancelShipment = async (order) => {
    if (!window.confirm(`Cancel shipment for ${order.orderId}?`)) return;
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/api/shiprocket/cancel/${order._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Shipment cancelled');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel shipment');
    }
  };

  const requestReturn = async (order) => {
    const reason = prompt('Return reason (e.g., wrong item, damaged):');
    if (!reason) return;
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/api/shiprocket/return/${order._id}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Return pickup scheduled');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request return');
    }
  };

  // ============================================
  // SEARCH & FILTER
  // ============================================
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(order =>
        order.orderId?.toLowerCase().includes(term) ||
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.email?.toLowerCase().includes(term) ||
        order.customer?.phone?.includes(term) ||
        order.customer?.address?.city?.toLowerCase().includes(term) ||
        order.shiprocket?.awbCode?.toLowerCase().includes(term) ||
        order.items?.some(item => item.name?.toLowerCase().includes(term))
      );
    }

    return result;
  }, [orders, statusFilter, searchTerm]);

  // ============================================
  // EXPORT
  // ============================================
  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Items', 'Total', 'Status', 'Payment Status', 'AWB', 'Courier'];
    const rows = filteredOrders.map(order => [
      order.orderId || 'N/A',
      new Date(order.createdAt).toLocaleDateString(),
      order.customer?.name || 'Guest',
      order.customer?.email || 'N/A',
      order.customer?.phone || 'N/A',
      order.items?.length || 0,
      order.total || 0,
      order.status || 'pending',
      order.paymentStatus || 'pending',
      order.shiprocket?.awbCode || '',
      order.shiprocket?.courierName || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(order => ({
      'Order ID': order.orderId || 'N/A',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer': order.customer?.name || 'Guest',
      'Email': order.customer?.email || 'N/A',
      'Phone': order.customer?.phone || 'N/A',
      'Items': order.items?.length || 0,
      'Total': order.total || 0,
      'Status': order.status || 'pending',
      'Payment Status': order.paymentStatus || 'pending',
      'AWB': order.shiprocket?.awbCode || '',
      'Courier': order.shiprocket?.courierName || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // ORDER OPERATIONS
  // ============================================
  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      await axios.put(`${API_URL}/api/orders/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrderForDetails(order);
    setShowOrderDetailsModal(true);
  };

  const toggleModalSection = (section) => {
    setExpandedModalSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const downloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff8800',
      'processing': '#0066FF',
      'shipped': '#D4AF37',
      'delivered': '#28a745',
      'cancelled': '#ff4444',
      'returned': '#8B5CF6'
    };
    return colors[status] || '#888';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌',
      'returned': '↩️'
    };
    return icons[status] || '📦';
  };

  const getPaymentStatusBadge = (status) => {
    const config = {
      'paid': { color: '#28a745', label: '✅ Paid' },
      'pending': { color: '#ff8800', label: '⏳ Pending' },
      'failed': { color: '#ff4444', label: '❌ Failed' },
      'refunded': { color: '#8B5CF6', label: '↩️ Refunded' }
    };
    return config[status] || { color: '#555', label: status || 'Unknown' };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="kawaii-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-panel-modern">
      {/* Stats Cards — only for regular view */}
      {!showFailedView && (
        <div className="orders-stats-grid">
          <div className="orders-stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-number">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-number">{formatCurrency(totalRevenue)}</span>
              <span className="stat-label">Revenue</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-number">{statusCounts.pending || 0}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <span className="stat-number">{statusCounts.shipped || 0}</span>
              <span className="stat-label">Shipped</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">{statusCounts.delivered || 0}</span>
              <span className="stat-label">Delivered</span>
            </div>
          </div>
        </div>
      )}

      {/* Header with Export */}
      <div className="orders-panel-header">
        <div className="header-left">
          <h2>📋 Orders Management</h2>
          <span className="order-count-badge">{orders.length} orders</span>
        </div>
        <div className="header-right">
          <button
            onClick={() => { setShowFailedView(!showFailedView); if (!showFailedView) fetchFailedOrders(); }}
            className="export-btn"
            style={{
              padding: '8px 16px',
              background: showFailedView ? '#ff4444' : '#555',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginRight: '8px'
            }}
          >
            {showFailedView ? '← Back to Orders' : `❌ Failed${failedStats?.totalFailed ? ` (${failedStats.totalFailed})` : ''}`}
          </button>

          {!showFailedView && (
            <>
              <button
                onClick={exportCSV}
                className="export-btn"
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}
              >
                📄 CSV
              </button>
              <button
                onClick={exportExcel}
                className="export-btn"
                style={{
                  padding: '8px 16px',
                  background: '#0066FF',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}
              >
                📊 Excel
              </button>
              {cleanupStats?.expiredPendingOrders > 0 && (
                <span className="cleanup-warning-badge">
                  ⚠️ {cleanupStats.expiredPendingOrders} pending
                </span>
              )}
              <button
                onClick={handleCleanup}
                disabled={cleaning || !cleanupStats?.canCleanup}
                className={`cleanup-btn ${cleanupStats?.canCleanup ? 'active' : ''}`}
              >
                {cleaning ? '⏳ Cleaning...' : '🧹 Cleanup'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Failed Orders View */}
      {showFailedView ? (
        <FailedOrdersView
          orders={failedOrders}
          stats={failedStats}
          onRefresh={fetchFailedOrders}
          onViewOrder={viewOrderDetails}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="orders-filters">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All <span className="tab-badge">{orders.length}</span>
              </button>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="tab-badge">{statusCounts[status] || 0}</span>
                </button>
              ))}
            </div>
            <div className="search-wrapper" style={{ display: 'flex', gap: '10px', flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search by Order ID, Customer, AWB, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
              <span style={{ color: '#666', fontSize: '12px', alignSelf: 'center' }}>
                {filteredOrders.length} results
              </span>
            </div>
          </div>

          {/* Orders Table */}
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <span>🔍</span>
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <React.Fragment key={order._id}>
                      <tr className={`order-row ${expandedOrder === order._id ? 'expanded' : ''}`}>
                        <td className="order-id-cell">
                          <strong>{order.orderId}</strong>
                          <span className="order-date">{formatDate(order.createdAt)}</span>
                          {order.shiprocket?.awbCode && (
                            <span className="tracking-badge">📦 {order.shiprocket.courierName || 'Track'}</span>
                          )}
                        </td>
                        <td>
                          <div className="customer-info">
                            <span className="customer-name">{order.customer?.name || 'Guest'}</span>
                            <span className="customer-email">{order.customer?.email || 'No email'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <span>{order.customer?.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleExpand(order._id)}
                            className="items-toggle-btn"
                          >
                            {expandedOrder === order._id ? '▲' : '▼'} {order.items?.length || 0}
                          </button>
                        </td>
                        <td className="total-cell">
                          <strong>{formatCurrency(order.total)}</strong>
                        </td>
                        <td>
                          <span
                            className="payment-badge"
                            style={{
                              background: getPaymentStatusBadge(order.paymentStatus).color,
                              color: '#fff'
                            }}
                          >
                            {getPaymentStatusBadge(order.paymentStatus).label}
                          </span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ background: getStatusColor(order.status) }}
                          >
                            {getStatusIcon(order.status)} {order.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="action-btn view-btn"
                              title="View Details"
                            >
                              📋
                            </button>

                            <button
                              onClick={() => downloadInvoice(order._id)}
                              className="action-btn invoice-btn"
                              title="Download Invoice"
                            >
                              📄
                            </button>

                            {order.paymentStatus === 'paid' && !order.shiprocket?.shipmentId && order.status !== 'cancelled' && (
                              <button
                                onClick={() => createShipment(order)}
                                disabled={shippingId === order._id}
                                className="action-btn"
                                title="Ship with Shiprocket"
                                style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}
                              >
                                {shippingId === order._id ? '⏳' : '📦'}
                              </button>
                            )}

                            {order.shiprocket?.shipmentId && order.shiprocket?.awbCode && (
                              <button
                                onClick={() => downloadLabel(order)}
                                className="action-btn"
                                title="Download Label"
                                style={{ background: 'rgba(40, 167, 69, 0.15)', color: '#28a745' }}
                              >
                                🏷️
                              </button>
                            )}

                            {order.shiprocket?.shipmentId && !order.shiprocket?.pickupScheduledDate && (
                              <button
                                onClick={() => schedulePickup(order)}
                                className="action-btn"
                                title="Schedule Pickup"
                                style={{ background: 'rgba(0, 102, 255, 0.15)', color: '#0066FF' }}
                              >
                                🚚
                              </button>
                            )}

                            {order.shiprocket?.shipmentId && order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => cancelShipment(order)}
                                className="action-btn"
                                title="Cancel Shipment"
                                style={{ background: 'rgba(255, 68, 68, 0.15)', color: '#ff4444' }}
                              >
                                ✕
                              </button>
                            )}

                            {order.status === 'delivered' && !order.shiprocket?.isReturn && (
                              <button
                                onClick={() => requestReturn(order)}
                                className="action-btn"
                                title="Request Return"
                                style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}
                              >
                                ↩️
                              </button>
                            )}

                            <button
                              onClick={() => deleteOrder(order._id)}
                              className="action-btn delete-btn"
                              title="Delete Order"
                            >
                              🗑️
                            </button>
                          </div>

                          <select
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            value={order.status || 'pending'}
                            className="status-select"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="processing">🔄 Processing</option>
                            <option value="shipped">🚚 Shipped</option>
                            <option value="delivered">✅ Delivered</option>
                            <option value="cancelled">❌ Cancelled</option>
                            <option value="returned">↩️ Returned</option>
                          </select>
                        </td>
                      </tr>

                      {expandedOrder === order._id && (
                        <tr className="expanded-row">
                          <td colSpan="8">
                            <div className="expanded-content">
                              <div className="expanded-section">
                                <h4>🛒 Items Ordered</h4>
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="expanded-item">
                                    <div className="item-info">
                                      <span className="item-name">{item.name}</span>
                                      {item.size && (
                                        <span className="item-variant">Size: {item.size}</span>
                                      )}
                                      {item.color && (
                                        <span className="item-variant">Color: {item.color}</span>
                                      )}
                                    </div>
                                    <div className="item-details">
                                      <span>Qty: {item.quantity}</span>
                                      <span>× ₹{item.price}</span>
                                      <span className="item-total">= ₹{item.price * item.quantity}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="expanded-section order-breakdown">
                                <h4>💰 Order Breakdown</h4>
                                <div className="breakdown-row">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="breakdown-row">
                                  <span>Shipping Fee</span>
                                  <span>{formatCurrency(order.shipping)}</span>
                                </div>
                                {order.platformFee > 0 && (
                                  <div className="breakdown-row">
                                    <span>Platform Fee</span>
                                    <span>{formatCurrency(order.platformFee)}</span>
                                  </div>
                                )}
                                {order.handlingFee > 0 && (
                                  <div className="breakdown-row">
                                    <span>Handling Fee</span>
                                    <span>{formatCurrency(order.handlingFee)}</span>
                                  </div>
                                )}
                                {order.discount > 0 && (
                                  <div className="breakdown-row discount">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.discount)}</span>
                                  </div>
                                )}
                                {order.couponCode && (
                                  <div className="breakdown-row coupon">
                                    <span>Coupon Applied</span>
                                    <span>✨ {order.couponCode}</span>
                                  </div>
                                )}
                                <div className="breakdown-divider"></div>
                                <div className="breakdown-row total">
                                  <span><strong>Total</strong></span>
                                  <span><strong>{formatCurrency(order.total)}</strong></span>
                                </div>
                              </div>

                              <div className="expanded-section">
                                <h4>📋 Timeline</h4>
                                {order.timeline?.map((event, idx) => (
                                  <div key={idx} className="timeline-item">
                                    <span className="timeline-status">
                                      {getStatusIcon(event.status)} {event.status}
                                    </span>
                                    <span className="timeline-desc">{event.description}</span>
                                    <span className="timeline-date">{formatDate(event.timestamp)}</span>
                                  </div>
                                ))}
                              </div>

                              {order.shiprocket?.awbCode && (
                                <div className="expanded-section tracking-info">
                                  <h4>📦 Shiprocket Tracking</h4>
                                  <div className="tracking-details">
                                    <span><strong>AWB:</strong> {order.shiprocket.awbCode}</span>
                                    {order.shiprocket.courierName && (
                                      <span><strong>Courier:</strong> {order.shiprocket.courierName}</span>
                                    )}
                                    {order.shiprocket.currentStatus && (
                                      <span><strong>Status:</strong> {order.shiprocket.currentStatus}</span>
                                    )}
                                    {order.shiprocket.etd && (
                                      <span><strong>ETA:</strong> {new Date(order.shiprocket.etd).toLocaleDateString()}</span>
                                    )}
                                    <a href={`https://shiprocket.co/tracking/${order.shiprocket.awbCode}`} target="_blank" rel="noopener noreferrer">
                                      🔗 Track on Shiprocket
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrderForDetails && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailsModal(false)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Order #{selectedOrderForDetails.orderId}</h3>
              <button className="modal-close" onClick={() => setShowOrderDetailsModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-section customer-section">
                <div className="section-header">
                  <h4>👤 Customer Information</h4>
                  <span className="order-id-badge">{selectedOrderForDetails.orderId}</span>
                </div>
                <div className="detail-grid">
                  <div><strong>Name:</strong> {selectedOrderForDetails.customer?.name || 'Guest'}</div>
                  <div><strong>Email:</strong> {selectedOrderForDetails.customer?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedOrderForDetails.customer?.phone || 'N/A'}</div>
                  <div><strong>Order Date:</strong> {formatDate(selectedOrderForDetails.createdAt)}</div>
                </div>
              </div>

              <div className="detail-section shipping-section">
                <div className="section-header">
                  <h4>📍 Shipping Address</h4>
                </div>
                {selectedOrderForDetails.customer?.address ? (
                  <div className="address-details">
                    <div>📮 {selectedOrderForDetails.customer.address.street}</div>
                    <div>{selectedOrderForDetails.customer.address.city}, {selectedOrderForDetails.customer.address.state}</div>
                    <div>Pincode: {selectedOrderForDetails.customer.address.pincode}</div>
                    {selectedOrderForDetails.customer.address.landmark && (
                      <div>📍 Landmark: {selectedOrderForDetails.customer.address.landmark}</div>
                    )}
                  </div>
                ) : (
                  <p className="no-data">No address provided</p>
                )}
              </div>

              <div className="detail-section items-section">
                <div className="section-header">
                  <h4>🛒 Order Items</h4>
                  <span className="item-count-badge">{selectedOrderForDetails.items?.length || 0} items</span>
                </div>
                <div className="items-list">
                  {selectedOrderForDetails.items?.map((item, idx) => (
                    <div key={idx} className="order-item-card">
                      <div className="item-left">
                        <span className="item-icon">🎀</span>
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <div className="item-variants">
                            {item.size && <span className="variant-tag">📏 Size: {item.size}</span>}
                            {item.color && <span className="variant-tag">🎨 Color: {item.color}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="item-right">
                        <span className="item-qty">Qty: {item.quantity}</span>
                        <span className="item-price">× ₹{item.price}</span>
                        <span className="item-total">= ₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`expandable-card ${expandedModalSections.includes('allDetails') ? 'expanded' : ''}`}>
                <div className="expandable-card-header" onClick={() => toggleModalSection('allDetails')}>
                  <span className="expand-icon">
                    {expandedModalSections.includes('allDetails') ? '▼' : '▶'}
                  </span>
                  <span className="card-title">
                    {expandedModalSections.includes('allDetails') ? 'Hide Order Details' : 'View Order Details'}
                  </span>
                </div>

                {expandedModalSections.includes('allDetails') && (
                  <div className="expandable-card-body">
                    <div className="detail-sub-section">
                      <h5>💳 Payment Information</h5>
                      <div className="detail-grid">
                        <div><strong>Method:</strong> {selectedOrderForDetails.paymentMethod || 'UPI'}</div>
                        <div><strong>Status:</strong>
                          <span className="payment-badge" style={{
                            background: getPaymentStatusBadge(selectedOrderForDetails.paymentStatus).color,
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {getPaymentStatusBadge(selectedOrderForDetails.paymentStatus).label}
                          </span>
                        </div>
                        {selectedOrderForDetails.paymentDetails?.razorpay_payment_id && (
                          <div><strong>Transaction ID:</strong> {selectedOrderForDetails.paymentDetails.razorpay_payment_id}</div>
                        )}
                        {selectedOrderForDetails.paymentDetails?.capturedAt && (
                          <div><strong>Paid At:</strong> {formatDate(selectedOrderForDetails.paymentDetails.capturedAt)}</div>
                        )}
                      </div>
                    </div>

                    <div className="detail-sub-section">
                      <h5>💰 Order Breakdown</h5>
                      <div className="breakdown-grid">
                        <div className="breakdown-item"><span>Subtotal</span><span>{formatCurrency(selectedOrderForDetails.subtotal)}</span></div>
                        <div className="breakdown-item"><span>📦 Shipping</span><span>{formatCurrency(selectedOrderForDetails.shipping)}</span></div>
                        {selectedOrderForDetails.platformFee > 0 && (
                          <div className="breakdown-item"><span>🏷️ Platform Fee</span><span>{formatCurrency(selectedOrderForDetails.platformFee)}</span></div>
                        )}
                        {selectedOrderForDetails.handlingFee > 0 && (
                          <div className="breakdown-item"><span>🔧 Handling</span><span>{formatCurrency(selectedOrderForDetails.handlingFee)}</span></div>
                        )}
                        {selectedOrderForDetails.discount > 0 && (
                          <div className="breakdown-item discount"><span>💰 Discount</span><span>-{formatCurrency(selectedOrderForDetails.discount)}</span></div>
                        )}
                        {selectedOrderForDetails.couponCode && (
                          <div className="breakdown-item coupon"><span>🎟️ Coupon</span><span>✨ {selectedOrderForDetails.couponCode}</span></div>
                        )}
                        <div className="breakdown-divider"></div>
                        <div className="breakdown-item total">
                          <span><strong>Total</strong></span>
                          <span><strong>{formatCurrency(selectedOrderForDetails.total)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-sub-section">
                      <h5>📋 Order Timeline</h5>
                      {selectedOrderForDetails.timeline?.map((event, idx) => (
                        <div key={idx} className="timeline-item">
                          <span className="timeline-status">{getStatusIcon(event.status)} {event.status}</span>
                          <span className="timeline-desc">{event.description}</span>
                          <span className="timeline-date">{formatDate(event.timestamp)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="detail-sub-section">
                      <h5>📦 Shiprocket Tracking</h5>
                      {selectedOrderForDetails.shiprocket?.awbCode ? (
                        <div className="tracking-details">
                          <span><strong>📮 AWB:</strong> {selectedOrderForDetails.shiprocket.awbCode}</span>
                          {selectedOrderForDetails.shiprocket.courierName && (
                            <span><strong>🚚 Courier:</strong> {selectedOrderForDetails.shiprocket.courierName}</span>
                          )}
                          {selectedOrderForDetails.shiprocket.currentStatus && (
                            <span><strong>Status:</strong> {selectedOrderForDetails.shiprocket.currentStatus}</span>
                          )}
                          <a href={`https://shiprocket.co/tracking/${selectedOrderForDetails.shiprocket.awbCode}`} target="_blank" rel="noopener noreferrer">🔗 Track Package →</a>
                        </div>
                      ) : (
                        <p className="no-data">No shipment created yet</p>
                      )}
                    </div>

                    {selectedOrderForDetails.failedReason && (
                      <div className="detail-sub-section">
                        <h5>❌ Failure Reason</h5>
                        <p style={{ color: '#ff8800', fontSize: '13px' }}>
                          {selectedOrderForDetails.failedReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowOrderDetailsModal(false)}>✕ Close</button>
              <button className="btn-primary" onClick={() => downloadInvoice(selectedOrderForDetails._id)}>📄 Download Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPanel;