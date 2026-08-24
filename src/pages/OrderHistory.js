import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderHistory.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function OrderHistory({ user, isLoggedIn }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactLoading, setContactLoading] = useState(true);

  // Fetch WhatsApp number
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/contact`);
        if (response.data?.whatsapp) {
          setWhatsappNumber(response.data.whatsapp);
        }
      } catch (err) {
        console.error('Error fetching contact:', err);
      } finally {
        setContactLoading(false);
      }
    };
    fetchContact();
  }, []);

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.orderId?.toLowerCase().includes(term) ||
        o.items?.some(i => i.name?.toLowerCase().includes(term))
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest': return (b.total || 0) - (a.total || 0);
        case 'lowest': return (a.total || 0) - (b.total || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return result;
  }, [orders, statusFilter, searchTerm, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  }), [orders]);

  const statusCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  useEffect(() => {
    const token = localStorage.getItem('loop_token');
    const userData = localStorage.getItem('loop_user');
    
    if (!token || !userData) {
      setError('Please login to view your orders');
      setLoading(false);
      return;
    }
    
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Please login to view your orders');
        localStorage.removeItem('loop_token');
      } else {
        setError(err.response?.data?.error || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = useCallback((orderId) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
  }, [selectedOrder]);

  const handleReorder = useCallback((order) => {
    const cartItems = order.items.map(item => ({
      id: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size || 'M',
      image: item.productId?.image || ''
    }));
    
    const existingCart = JSON.parse(localStorage.getItem('loop_cart') || '[]');
    const newCart = [...existingCart, ...cartItems];
    localStorage.setItem('loop_cart', JSON.stringify(newCart));
    navigate('/checkout');
  }, [navigate]);

  const goToProduct = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const openWhatsApp = (orderId) => {
    if (!whatsappNumber) {
      alert('WhatsApp support number not available. Please contact us via email.');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = `Hi LOOP Team, I need help with my order #${orderId || ''}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const submitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    try {
      const token = localStorage.getItem('loop_token');
      await axios.post(
        `${API_URL}/api/orders/${ratingOrder.orderId}/rate`,
        { rating, comment: ratingComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
      fetchOrders();
      alert('✅ Thank you for your feedback!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff8800',
      'processing': '#2874f0',
      'shipped': '#2874f0',
      'delivered': '#4cdf8b',
      'cancelled': '#ff6b6b',
      'returned': '#a78bfa'
    };
    return colors[status] || '#888';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✨',
      'cancelled': '💔',
      'returned': '↩️'
    };
    return icons[status] || '📦';
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="loading-container">
          <div className="kawaii-spinner"></div>
          <p className="loading-text">Loading your orders... 🎀</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="container">
        <div className="order-history-header">
          <div className="header-content">
            <div>
              <h1>📦 My Orders</h1>
              <p>Track, manage, and reorder your items ✨</p>
            </div>
            <div className="header-right-actions">
              <div className="header-stats-badge">
                <span>{stats.total} orders</span>
              </div>
              {whatsappNumber && (
                <button
                  className="whatsapp-help-btn"
                  onClick={() => openWhatsApp('')}
                  title="Need help? Chat with us on WhatsApp"
                >
                  💬
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="order-error">
            <span>💔</span> {error}
            {error.includes('login') && (
              <Link to="/login" className="login-link">Login Now</Link>
            )}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">🛍️</div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <Link to="/" className="shop-now-btn">✨ Shop Now</Link>
          </div>
        ) : (
          <>
            <div className="order-stats-row">
              <div className="order-stat-card">
                <span className="order-stat-number">{stats.total}</span>
                <span className="order-stat-label">Orders</span>
              </div>
              <div className="order-stat-card">
                <span className="order-stat-number">{stats.delivered}</span>
                <span className="order-stat-label">Delivered ✨</span>
              </div>
              <div className="order-stat-card">
                <span className="order-stat-number">{stats.pending}</span>
                <span className="order-stat-label">Pending ⏳</span>
              </div>
              <div className="order-stat-card">
                <span className="order-stat-number">₹{stats.totalSpent}</span>
                <span className="order-stat-label">Total Spent 💰</span>
              </div>
            </div>

            <div className="order-filters-bar">
              <div className="order-filter-tabs">
                <button
                  className={`order-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All <span className="tab-badge">{orders.length}</span>
                </button>
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <button
                    key={status}
                    className={`order-filter-tab ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {getStatusIcon(status)} {getStatusLabel(status)}
                    <span className="tab-badge">{statusCounts[status] || 0}</span>
                  </button>
                ))}
              </div>

              <div className="order-sort-wrapper">
                <select 
                  className="order-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">✨ Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="highest">💰 Price: High to Low</option>
                  <option value="lowest">💰 Price: Low to High</option>
                </select>
              </div>
            </div>

            <div className="order-search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>

            <div className="orders-list">
              {filteredOrders.length === 0 ? (
                <div className="no-orders-found">
                  <span>🔍</span>
                  <p>No orders match your search</p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchTerm('');
                      setSortBy('newest');
                    }}
                  >
                    ✨ Clear Filters
                  </button>
                </div>
              ) : (
                filteredOrders.map((order, index) => {
                  const isExpanded = selectedOrder === order._id;
                  const showRating = order.status === 'delivered' && !order.postOrderRating;

                  return (
                    <div 
                      key={order._id} 
                      className={`order-card ${isExpanded ? 'expanded' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="order-header">
                        <div className="order-header-left">
                          <span className="order-id"># {order.orderId}</span>
                          <span className="order-date">📅 {formatDate(order.createdAt)}</span>
                          {order.items?.length > 0 && (
                            <span className="order-items-count">🛒 {order.items.length} items</span>
                          )}
                        </div>
                        <div className="order-header-right">
                          <span 
                            className="order-status"
                            style={{ color: getStatusColor(order.status) }}
                          >
                            {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                          </span>
                          <button 
                            className="order-toggle-btn"
                            onClick={() => toggleOrderDetails(order._id)}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      <div className="order-items-preview">
                        {order.items?.slice(0, 2).map((item, idx) => {
                          const productId = item.productId?._id || item.productId;
                          return (
                            <div key={idx} className="order-item-preview">
                              <div 
                                className="item-preview-image clickable"
                                onClick={() => goToProduct(productId)}
                                style={{ cursor: 'pointer' }}
                              >
                                {item.productId?.image ? (
                                  <img src={item.productId.image} alt={item.name} />
                                ) : (
                                  <div className="item-preview-placeholder">🎀</div>
                                )}
                              </div>
                              <div className="item-preview-details">
                                <span 
                                  className="item-preview-name clickable"
                                  onClick={() => goToProduct(productId)}
                                  style={{ cursor: 'pointer', color: '#D4AF37' }}
                                >
                                  {item.name}
                                </span>
                                <span className="item-preview-price">
                                  Qty: {item.quantity} × ₹{item.price}
                                </span>
                              </div>
                              <div className="item-preview-total">
                                ₹{item.price * item.quantity}
                              </div>
                            </div>
                          );
                        })}
                        {order.items?.length > 2 && (
                          <div className="order-more-items">
                            + {order.items.length - 2} more items
                          </div>
                        )}
                      </div>

                      <div className="order-footer">
                        <div className="order-total">
                          <span className="total-label">Total:</span>
                          <span className="total-value">₹{order.total}</span>
                          {order.status === 'delivered' && (
                            <span className="delivery-badge">✅ Delivered</span>
                          )}
                        </div>
                        <div className="order-actions-bar">
                          {order.status === 'pending' && (
                            <button 
                              className="order-action-btn cancel"
                              onClick={async () => {
                                if (window.confirm('Cancel this order?')) {
                                  try {
                                    const token = localStorage.getItem('loop_token');
                                    await axios.post(
                                      `${API_URL}/api/orders/${order.orderId}/cancel`,
                                      {},
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    fetchOrders();
                                  } catch (err) {
                                    alert(err.response?.data?.error || 'Failed to cancel');
                                  }
                                }
                              }}
                            >
                              ❌ Cancel
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <>
                              <button 
                                className="order-action-btn reorder"
                                onClick={() => handleReorder(order)}
                              >
                                🔄 Reorder
                              </button>
                              <button 
                                className="order-action-btn rate"
                                onClick={() => {
                                  setRatingOrder(order);
                                  setShowRatingModal(true);
                                }}
                              >
                                ⭐ Rate
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* EXPANDED ORDER DETAILS WITH BREAKDOWN */}
                      {isExpanded && (
                        <div className="order-expanded">
                          {/* Full Items List */}
                          <div className="order-items-full">
                            <h4>🛍️ Items</h4>
                            {order.items?.map((item, idx) => {
                              const productId = item.productId?._id || item.productId;
                              return (
                                <div key={idx} className="order-item-full">
                                  <div className="item-full-info">
                                    <span 
                                      className="item-full-name clickable"
                                      onClick={() => goToProduct(productId)}
                                      style={{ cursor: 'pointer', color: '#D4AF37' }}
                                    >
                                      {item.name}
                                    </span>
                                    <span className="item-full-details">
                                      Size: {item.size || 'N/A'} × {item.quantity}
                                    </span>
                                  </div>
                                  <span className="item-full-price">₹{item.price * item.quantity}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* ✅ ORDER BREAKDOWN WITH FREE BADGES */}
                          <div className="order-breakdown">
                            <h4>💰 Order Breakdown</h4>
                            
                            <div className="breakdown-row">
                              <span>Subtotal ({order.items?.length || 0} items)</span>
                              <span>₹{order.subtotal || 0}</span>
                            </div>
                            
                            {/* Shipping - Show FREE when 0 */}
                            <div className="breakdown-row">
                              <span>🚚 Shipping Fee</span>
                              {order.shipping === 0 ? (
                                <span className="free-badge shipping">FREE</span>
                              ) : (
                                <span>₹{order.shipping || 0}</span>
                              )}
                            </div>
                            
                            {/* Platform Fee - Always FREE */}
                            <div className="breakdown-row">
                              <span>✨ Platform Fee</span>
                              <span className="free-badge platform">FREE</span>
                            </div>
                            
                            {/* Handling Fee - Always FREE */}
                            <div className="breakdown-row">
                              <span>💫 Handling Fee</span>
                              <span className="free-badge handling">FREE</span>
                            </div>
                            
                            {order.discount > 0 && (
                              <div className="breakdown-row discount">
                                <span>🎟️ Coupon Discount</span>
                                <span>-₹{order.discount}</span>
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
                              <span><strong>💰 Total</strong></span>
                              <span><strong>₹{order.total}</strong></span>
                            </div>
                          </div>

                          {/* Timeline */}
                          {order.timeline && order.timeline.length > 0 && (
                            <div className="order-timeline">
                              <h4>📋 Order Timeline</h4>
                              {order.timeline.map((event, idx) => (
                                <div key={idx} className="timeline-item">
                                  <span className="timeline-status">
                                    {getStatusIcon(event.status)} {getStatusLabel(event.status)}
                                  </span>
                                  <span className="timeline-date">{formatDate(event.timestamp)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tracking Info */}
                          {order.tracking?.number && (
                            <div className="order-tracking">
                              <span className="tracking-icon">📦</span>
                              <span className="tracking-number">{order.tracking.number}</span>
                              {order.tracking.courierName && (
                                <span className="tracking-courier">📮 {order.tracking.courierName}</span>
                              )}
                              {order.tracking.url && (
                                <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="tracking-link">
                                  Track Package →
                                </a>
                              )}
                            </div>
                          )}

                          {/* Rating Reminder */}
                          {showRating && (
                            <div className="rating-reminder">
                              <span>⭐ Love your items? Rate them! </span>
                              <button 
                                className="rate-now-btn"
                                onClick={() => {
                                  setRatingOrder(order);
                                  setShowRatingModal(true);
                                }}
                              >
                                Rate Now 💬
                              </button>
                            </div>
                          )}

                          {/* WhatsApp Help */}
                          {whatsappNumber && (
                            <div className="order-whatsapp-help">
                              <button
                                className="whatsapp-order-btn"
                                onClick={() => openWhatsApp(order.orderId)}
                              >
                                💬 Need help with this order? Chat with us on WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && ratingOrder && (
        <div className="rating-modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rating-modal-close" onClick={() => setShowRatingModal(false)}>✕</button>
            <h3>⭐ Rate Your Order</h3>
            <p className="rating-modal-subtitle">{ratingOrder.orderId}</p>
            
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="rating-label">
              {rating === 1 && '😞 Poor'}
              {rating === 2 && '😐 Fair'}
              {rating === 3 && '🙂 Good'}
              {rating === 4 && '😊 Very Good'}
              {rating === 5 && '🤩 Excellent!'}
            </div>

            <textarea
              className="rating-comment"
              placeholder="Share your experience (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows="3"
            />

            <div className="rating-modal-actions">
              <button className="rating-cancel-btn" onClick={() => setShowRatingModal(false)}>
                Cancel
              </button>
              <button className="rating-submit-btn" onClick={submitRating}>
                Submit Rating ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;