import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RatingStars from './RatingStars';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ReviewModal({ isOpen, onClose, productId, productName, orderId, orderItemId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const modalRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setTitle('');
      setComment('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(
        `${API_URL}/api/reviews/submit`,
        {
          productId,
          orderId,
          orderItemId,
          rating,
          title,
          comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setError('');
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
        // Close after success with delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="review-modal" ref={modalRef}>
        <button className="review-modal-close" onClick={onClose}>✕</button>
        
        <h2>Write a Review</h2>
        <p className="review-product-name">For: {productName}</p>

        {success ? (
          <div className="review-success">
            <div className="success-icon">✅</div>
            <h3>Review Submitted!</h3>
            <p>Thank you for your feedback. Your review helps others make better decisions.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form">
            <div className="review-rating-section">
              <label>Your Rating *</label>
              <RatingStars 
                rating={rating} 
                interactive={true} 
                size="large" 
                showCount={false}
                onRatingChange={setRating}
              />
              {rating > 0 && (
                <span className="rating-label">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent!'}
                </span>
              )}
            </div>

            <div className="review-input-group">
              <label>Review Title (Optional)</label>
              <input
                type="text"
                placeholder="Summarize your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength="100"
              />
            </div>

            <div className="review-input-group">
              <label>Your Review *</label>
              <textarea
                placeholder="What did you like or dislike about this product?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                required
                maxLength="1000"
              />
              <span className="char-count">{comment.length}/1000</span>
            </div>

            <div className="review-verified-badge">
              <span>✅ Verified Purchase</span>
              <p>You purchased this product, so your review helps other buyers.</p>
            </div>

            {error && <div className="review-error">{error}</div>}

            <div className="review-actions">
              <button type="button" className="review-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="review-submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReviewModal;