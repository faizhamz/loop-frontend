import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import { clearCartInDatabase } from '../utils/cartSync';
import './OrderConfirmation.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // ✅ Clear cart when order is confirmed
  useEffect(() => {
    const clearCart = async () => {
      try {
        // Clear local storage
        localStorage.removeItem('loop_cart');
        
        // Clear database cart if logged in
        const token = localStorage.getItem('loop_token');
        if (token) {
          await clearCartInDatabase();
        }
        
        console.log('✅ Cart cleared after order');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    };
    
    clearCart();
  }, []);

  useEffect(() => {
    const orderData = location.state?.order;
    if (orderData) {
      setOrder(orderData);
      setLoading(false);
    } else {
      fetchLatestOrder();
    }
  }, [location]);

  const fetchLatestOrder = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.length > 0) {
        setOrder(response.data[0]);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download Invoice Function
  const downloadInvoice = async () => {
    if (!order) return;
    
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/orders/${order._id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again from Order History.');
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('loop_token');
      await axios.post(
        `${API_URL}/api/orders/${order.orderId}/rate`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="confirmation-error">
            <h2>Order not found</h2>
            <Link to="/" className="back-home">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="container">
        <div className="confirmation-header">
          <div className="confirmation-icon">✅</div>
          <h1>Order Placed Successfully!</h1>
          <p className="confirmation-subtitle">Thank you for your purchase. Your order has been confirmed.</p>
        </div>

        {/* Order Details */}
        <div className="confirmation-order-details">
          <div className="order-detail-row">
            <span className="detail-label">Order ID</span>
            <span className="detail-value">{order.orderId}</span>
          </div>
          <div className="order-detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-value">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="order-detail-row">
            <span className="detail-label">Total</span>
            <span className="detail-value">₹{order.total}</span>
          </div>
          <div className="order-detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value" style={{ color: '#D4AF37' }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="confirmation-items">
          <h3>Items Ordered</h3>
          {order.items.map((item, index) => (
            <div key={index} className="confirmation-item">
              <span className="item-name">{item.name}</span>
              <span className="item-qty">× {item.quantity}</span>
              <span className="item-price">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Post-Order Rating */}
        {!submitted && (
          <div className="confirmation-rating">
            <h3>How was your shopping experience?</h3>
            <p>Your feedback helps us improve</p>
            
            <div className="rating-section">
              <RatingStars 
                rating={rating} 
                interactive={true} 
                size="large" 
                showCount={false}
                onRatingChange={setRating}
              />
              {rating > 0 && (
                <span className="rating-label">
                  {rating === 1 && '😞 Poor'}
                  {rating === 2 && '😐 Fair'}
                  {rating === 3 && '🙂 Good'}
                  {rating === 4 && '😊 Very Good'}
                  {rating === 5 && '🤩 Excellent!'}
                </span>
              )}
            </div>

            <textarea
              className="rating-comment"
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              maxLength="500"
            />
            <div className="comment-char-count">{comment.length}/500</div>

            {error && <div className="rating-error">{error}</div>}

            <button 
              className="submit-rating-btn"
              onClick={handleSubmitRating}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '💬 Submit Feedback'}
            </button>
          </div>
        )}

        {submitted && (
          <div className="confirmation-thanks">
            <div className="thanks-icon">🙏</div>
            <h3>Thank you for your feedback!</h3>
            <p>Your review helps us serve you better.</p>
          </div>
        )}

        <div className="confirmation-actions">
          {/* ✅ Download Invoice Button */}
          <button 
            onClick={downloadInvoice}
            style={{
              background: '#D4AF37',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📄 Download Invoice
          </button>
          <Link to="/" className="continue-shopping-btn">
            🛍️ Continue Shopping
          </Link>
          <Link to="/orders" className="view-orders-btn">
            📦 View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;