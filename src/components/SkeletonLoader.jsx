import React from 'react';
import './SkeletonLoader.css';

function SkeletonLoader({ type = 'product', count = 4 }) {
  if (type === 'product') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-product">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-text shimmer" style={{ width: '70%' }}></div>
            <div className="skeleton-text shimmer" style={{ width: '40%' }}></div>
            <div className="skeleton-text shimmer" style={{ width: '60%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'category') {
    return (
      <div className="skeleton-categories">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-category shimmer" style={{ width: '160px', height: '180px', borderRadius: '12px' }}></div>
        ))}
      </div>
    );
  }

  return null;
}

export default SkeletonLoader;