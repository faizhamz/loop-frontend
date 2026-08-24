import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RatingStars from '../components/RatingStars';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ReviewsPanel() {
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, unverified, reported
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchAnalytics();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/reviews/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/reviews/admin/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleToggleApproval = async (reviewId, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.patch(
        `${API_URL}/api/reviews/admin/${reviewId}/toggle-approval`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
      fetchAnalytics();
    } catch (error) {
      console.error('Error toggling review approval:', error);
      alert('Failed to update review');
    }
  };

  const getFilteredReviews = () => {
    let filtered = reviews;
    
    if (filter === 'verified') {
      filtered = filtered.filter(r => r.isVerified);
    } else if (filter === 'unverified') {
      filtered = filtered.filter(r => !r.isVerified);
    } else if (filter === 'reported') {
      filtered = filtered.filter(r => r.isReported);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment?.toLowerCase().includes(term) ||
        r.title?.toLowerCase().includes(term) ||
        r.userId?.name?.toLowerCase().includes(term) ||
        r.productId?.name?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  const filteredReviews = getFilteredReviews();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>⭐ Review Management</h2>
        <span style={{ color: '#888', fontSize: '14px' }}>
          {reviews.length} total reviews
        </span>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div className="stat-card">
            <h3>{analytics.total}</h3>
            <p>Total Reviews</p>
          </div>
          <div className="stat-card">
            <h3>{analytics.average || 0}</h3>
            <p>Average Rating ⭐</p>
          </div>
          <div className="stat-card">
            <h3>{analytics.verified || 0}</h3>
            <p>Verified ✅</p>
          </div>
          <div className="stat-card">
            <h3>{analytics.unverified || 0}</h3>
            <p>Unverified</p>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {analytics && analytics.distribution && (
        <div style={{ 
          background: '#111', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #333'
        }}>
          <h4 style={{ color: '#D4AF37', marginBottom: '10px' }}>Rating Distribution</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>{rating}⭐</span>
                <div style={{ 
                  width: '100px', 
                  height: '8px', 
                  background: '#222', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${analytics.total > 0 ? (analytics.distribution[rating] / analytics.total * 100) : 0}%`, 
                    height: '100%', 
                    background: '#D4AF37',
                    borderRadius: '4px'
                  }} />
                </div>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  {analytics.distribution[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '8px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
        >
          <option value="all">All Reviews</option>
          <option value="verified">Verified Only ✅</option>
          <option value="unverified">Unverified</option>
          <option value="reported">Reported 🚩</option>
        </select>

        <input
          type="text"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px', minWidth: '200px' }}
        />
      </div>

      {/* Reviews List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>User</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Rating</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Review</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No reviews found
                </td>
              </tr>
            ) : (
              filteredReviews.map(review => (
                <tr key={review._id} style={{ opacity: review.isDeleted ? 0.4 : 1 }}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {review.productId?.image && (
                        <img src={review.productId.image} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      <span style={{ fontSize: '13px' }}>{review.productId?.name || 'Unknown Product'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div style={{ fontSize: '13px' }}>
                      <div>{review.userId?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{review.userId?.email || ''}</div>
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <RatingStars rating={review.rating} showCount={false} size="small" />
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div style={{ fontSize: '13px' }}>
                      {review.title && <div style={{ fontWeight: '500' }}>{review.title}</div>}
                      <div style={{ color: '#888', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.comment || 'No comment'}
                      </div>
                      {review.isVerified && (
                        <span style={{ color: '#28a745', fontSize: '11px' }}>✅ Verified</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: review.isApproved ? '#28a745' : '#ff8800',
                        color: '#fff',
                        fontSize: '11px',
                        textAlign: 'center'
                      }}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {review.isReported && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#ff4444',
                          color: '#fff',
                          fontSize: '11px',
                          textAlign: 'center'
                        }}>
                          🚩 Reported
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <button
                      onClick={() => handleToggleApproval(review._id, review.isApproved)}
                      style={{
                        marginRight: '5px',
                        background: review.isApproved ? '#ff8800' : '#28a745',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      {review.isApproved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      style={{
                        background: '#ff4444',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewsPanel;