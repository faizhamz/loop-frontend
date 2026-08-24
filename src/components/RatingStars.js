import React from 'react';

function RatingStars({ rating, totalReviews = 0, size = 'medium', showCount = true, interactive = false, onRatingChange }) {
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [selectedRating, setSelectedRating] = React.useState(rating || 0);

  const starSize = {
    small: '18px',
    medium: '24px',
    large: '32px'
  };

  const handleClick = (index) => {
    if (!interactive) return;
    const newRating = index + 1;
    setSelectedRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (index) => {
    if (!interactive) return;
    setHoveredRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || selectedRating || rating || 0;

  return (
    <div className="rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div 
        className="stars-container"
        style={{ display: 'flex', gap: '2px', cursor: interactive ? 'pointer' : 'default' }}
      >
        {[1, 2, 3, 4, 5].map((star, index) => (
          <span
            key={index}
            className={`star ${index < displayRating ? 'filled' : 'empty'}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            style={{
              fontSize: starSize[size] || '24px',
              color: index < displayRating ? '#D4AF37' : '#444',
              transition: 'color 0.2s, transform 0.2s',
              transform: interactive && index < hoveredRating ? 'scale(1.2)' : 'scale(1)',
              display: 'inline-block'
            }}
          >
            {index < displayRating ? '★' : '☆'}
          </span>
        ))}
      </div>
      {showCount && totalReviews > 0 && (
        <span className="rating-count" style={{ color: '#888', fontSize: '14px', marginLeft: '8px' }}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}

export default RatingStars;