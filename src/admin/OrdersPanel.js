import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import ShippingLabelModal from '../components/ShippingLabelModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState({});
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [expandedModalSections, setExpandedModalSections] = useState([]);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [cleaning, setCleaning] = useState(false);

  // ============================================
  // ✅ NEW: Shipping Label Modal State
  // ============================================
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState(null);
  const [labelGenerating, setLabelGenerating] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCleanupStats();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
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
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/admin/cleanup-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCleanupStats(response.data);
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`This will cancel ${cleanupStats?.expiredPendingOrders || 0} pending orders older than 30 minutes. Continue?`)) return;
    
    setCleaning(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(`${API_URL}/api/admin/cleanup-pending-orders`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchOrders();
      fetchCleanupStats();
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Failed to cleanup orders');
    } finally {
      setCleaning(false);
    }
  };

  // ============================================
  // ✅ NEW: Open Shipping Label Modal
  // ============================================
  const openLabelModal = (order) => {
    setSelectedOrderForLabel(order);
    setShowLabelModal(true);
  };

  // ============================================
  // ✅ NEW: Handle Label Generated
  // ============================================
  const handleLabelGenerated = (labelData) => {
    console.log('✅ Label generated:', labelData);
    // Refresh orders to update tracking info
    fetchOrders();
  };

  // ============================================
  // SEARCH FUNCTIONALITY
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
        order.items?.some(item => item.name?.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [orders, statusFilter, searchTerm]);

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================
  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Items', 'Total', 'Status', 'Payment Status'];
    const rows = filteredOrders.map(order => [
      order.orderId || 'N/A',
      new Date(order.createdAt).toLocaleDateString(),
      order.customer?.name || 'Guest',
      order.customer?.email || 'N/A',
      order.customer?.phone || 'N/A',
      order.items?.length || 0,
      order.total || 0,
      order.status || 'pending',
      order.paymentStatus || 'pending'
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
      'Payment Status': order.paymentStatus || 'pending'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // REST OF THE COMPONENT
  // ============================================
  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
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
      const token = localStorage.getItem('loop_token');
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
      const token = localStorage.getItem('loop_token');
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

  const handleAddTracking = (orderId) => {
    setSelectedOrderId(orderId);
    setTrackingData({
      number: '',
      courier: '',
      courierName: '',
      url: ''
    });
    setShowTrackingModal(true);
  };

  const submitTracking = async () => {
    if (!trackingData.number) {
      alert('Please enter a tracking number');
      return;
    }

    try {
      const token = localStorage.getItem('loop_token');
      await axios.post(
        `${API_URL}/api/orders/${selectedOrderId}/tracking`,
        trackingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowTrackingModal(false);
      fetchOrders();
      alert('✅ Tracking number added! Order status updated to Shipped.');
    } catch (error) {
      console.error('Error adding tracking:', error);
      alert('Failed to add tracking number');
    }
  };

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
      {/* Stats Cards */}
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

      {/* Header with Export */}
      <div className="orders-panel-header">
        <div className="header-left">
          <h2>📋 Orders Management</h2>
          <span className="order-count-badge">{orders.length} orders</span>
        </div>
        <div className="header-right">
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
        </div>
      </div>

      {/* Filters with Search */}
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
            placeholder="🔍 Search by Order ID, Customer, Email, Phone..."
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
                      {order.tracking?.number && (
                        <span className="tracking-badge">📦 Track</span>
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
                        {/* ✅ View Details Button */}
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          📋
                        </button>
                        
                        {/* ✅ Invoice Button */}
                        <button
                          onClick={() => downloadInvoice(order._id)}
                          className="action-btn invoice-btn"
                          title="Download Invoice"
                        >
                          📄
                        </button>
                        
                        {/* ✅ Shipping Label Button - NEW */}
                        <button
                          onClick={() => openLabelModal(order)}
                          className="action-btn label-btn"
                          title="Generate Shipping Label"
                          style={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: '#D4AF37',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                          }}
                        >
                          📦
                        </button>
                        
                        {/* ✅ Tracking Button */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleAddTracking(order._id)}
                            className="action-btn track-btn"
                            title="Add Tracking"
                          >
                            🔗
                          </button>
                        )}
                        
                        {/* ✅ Delete Button */}
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="action-btn delete-btn"
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      {/* Status Dropdown */}
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
                            {order.gstAmount > 0 && (
                              <div className="breakdown-row">
                                <span>GST ({order.gstPercent || 12}%)</span>
                                <span>{formatCurrency(order.gstAmount)}</span>
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

                          {order.tracking?.number && (
                            <div className="expanded-section tracking-info">
                              <h4>📦 Tracking Information</h4>
                              <div className="tracking-details">
                                <span><strong>Number:</strong> {order.tracking.number}</span>
                                {order.tracking.courierName && (
                                  <span><strong>Courier:</strong> {order.tracking.courierName}</span>
                                )}
                                {order.tracking.url && (
                                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer">
                                    🔗 Track Package
                                  </a>
                                )}
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

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrderForDetails && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailsModal(false)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Order #{selectedOrderForDetails.orderId}</h3>
              <button className="modal-close" onClick={() => setShowOrderDetailsModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Customer Information - Always Visible */}
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

              {/* Shipping Address - Always Visible */}
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

              {/* Order Items - Always Visible */}
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

              {/* Single Expandable Card for Hidden Details */}
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
                    {/* Payment Information */}
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

                    {/* Order Breakdown */}
                    <div className="detail-sub-section">
                      <h5>💰 Order Breakdown</h5>
                      <div className="breakdown-grid">
                        <div className="breakdown-item">
                          <span>Subtotal</span>
                          <span>{formatCurrency(selectedOrderForDetails.subtotal)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>📦 Shipping</span>
                          <span>{formatCurrency(selectedOrderForDetails.shipping)}</span>
                        </div>
                        {selectedOrderForDetails.platformFee > 0 && (
                          <div className="breakdown-item">
                            <span>🏷️ Platform Fee</span>
                            <span>{formatCurrency(selectedOrderForDetails.platformFee)}</span>
                          </div>
                        )}
                        {selectedOrderForDetails.gstAmount > 0 && (
                          <div className="breakdown-item">
                            <span>📊 GST ({selectedOrderForDetails.gstPercent || 12}%)</span>
                            <span>{formatCurrency(selectedOrderForDetails.gstAmount)}</span>
                          </div>
                        )}
                        {selectedOrderForDetails.handlingFee > 0 && (
                          <div className="breakdown-item">
                            <span>🔧 Handling Fee</span>
                            <span>{formatCurrency(selectedOrderForDetails.handlingFee)}</span>
                          </div>
                        )}
                        {selectedOrderForDetails.discount > 0 && (
                          <div className="breakdown-item discount">
                            <span>💰 Discount</span>
                            <span>-{formatCurrency(selectedOrderForDetails.discount)}</span>
                          </div>
                        )}
                        {selectedOrderForDetails.couponCode && (
                          <div className="breakdown-item coupon">
                            <span>🎟️ Coupon Applied</span>
                            <span>✨ {selectedOrderForDetails.couponCode}</span>
                          </div>
                        )}
                        <div className="breakdown-divider"></div>
                        <div className="breakdown-item total">
                          <span><strong>Total</strong></span>
                          <span><strong>{formatCurrency(selectedOrderForDetails.total)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="detail-sub-section">
                      <h5>📋 Order Timeline</h5>
                      {selectedOrderForDetails.timeline?.map((event, idx) => (
                        <div key={idx} className="timeline-item">
                          <span className="timeline-status">
                            {getStatusIcon(event.status)} {event.status}
                          </span>
                          <span className="timeline-desc">{event.description}</span>
                          <span className="timeline-date">{formatDate(event.timestamp)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tracking Information */}
                    <div className="detail-sub-section">
                      <h5>📦 Tracking Information</h5>
                      {selectedOrderForDetails.tracking?.number ? (
                        <div className="tracking-details">
                          <span><strong>📮 Tracking Number:</strong> {selectedOrderForDetails.tracking.number}</span>
                          {selectedOrderForDetails.tracking.courierName && (
                            <span><strong>🚚 Courier:</strong> {selectedOrderForDetails.tracking.courierName}</span>
                          )}
                          {selectedOrderForDetails.tracking.url && (
                            <a href={selectedOrderForDetails.tracking.url} target="_blank" rel="noopener noreferrer">
                              🔗 Track Package →
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="no-data">No tracking information available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowOrderDetailsModal(false)}>
                ✕ Close
              </button>
              <button className="btn-primary" onClick={() => downloadInvoice(selectedOrderForDetails._id)}>
                📄 Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Add Tracking Number</h3>
              <button className="modal-close" onClick={() => setShowTrackingModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Tracking Number *</label>
                <input
                  type="text"
                  placeholder="e.g., 1234567890"
                  value={trackingData.number}
                  onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Courier</label>
                <select
                  value={trackingData.courier}
                  onChange={(e) => setTrackingData({ ...trackingData, courier: e.target.value })}
                >
                  <option value="">Select Courier</option>
                  <option value="delhivery">Delhivery</option>
                  <option value="bluedart">Blue Dart</option>
                  <option value="dtdc">DTDC</option>
                  <option value="xpressbees">XpressBees</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Courier Name (Custom)</label>
                <input
                  type="text"
                  placeholder="e.g., Amazon Shipping"
                  value={trackingData.courierName}
                  onChange={(e) => setTrackingData({ ...trackingData, courierName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tracking URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://track.courier.com/123456"
                  value={trackingData.url}
                  onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTrackingModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submitTracking}>
                ✅ Add Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Shipping Label Modal - NEW */}
      {showLabelModal && selectedOrderForLabel && (
        <ShippingLabelModal
          isOpen={showLabelModal}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedOrderForLabel(null);
          }}
          order={selectedOrderForLabel}
          onLabelGenerated={handleLabelGenerated}
        />
      )}
    </div>
  );
}

export default OrdersPanel;