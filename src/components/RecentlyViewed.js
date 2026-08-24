import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function RecentlyViewed() {
  const { recentlyViewed, clearRecentlyViewed } = useApp();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed">
      <div className="container">
        <div className="recently-viewed-header">
          <h3>👁️ Recently Viewed</h3>
          <button onClick={clearRecentlyViewed} className="clear-recent">
            Clear
          </button>
        </div>
        <div className="recently-viewed-grid">
          {recentlyViewed.slice(0, 6).map(product => {
            const slug = product.productId || product.name.toLowerCase().replace(/ /g, '-');
            return (
              <Link 
                to={`/product/${slug}`} 
                key={product._id} 
                className="recently-viewed-item"
              >
                <img 
                  src={product.image || 'https://via.placeholder.com/60x60?text=LOOP'} 
                  alt={product.name} 
                />
                <span className="recently-viewed-name">{product.name}</span>
                <span className="recently-viewed-price">₹{product.price}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RecentlyViewed;