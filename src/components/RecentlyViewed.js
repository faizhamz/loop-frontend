import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import RatingStars from './RatingStars';

function RecentlyViewed({ addToCart }) {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleQuickAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCart) {
      addToCart(product);
    } else {
      console.warn('⚠️ addToCart function not available');
    }
  };

  // ✅ UPDATED: Handle removing a single item with proper ID detection
  const handleRemoveItem = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Try multiple ID field names
    const productId = product._id || product.id || product.productId;
    
    if (productId) {
      console.log('🗑️ Removing item:', productId, product.name);
      if (removeFromRecentlyViewed) {
        removeFromRecentlyViewed(productId);
      } else {
        console.warn('⚠️ removeFromRecentlyViewed function not available');
      }
    } else {
      console.error('❌ Cannot remove: No product ID found', product);
    }
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearRecentlyViewed();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // If 6 or less items, show grid without carousel
  if (recentlyViewed.length <= 6) {
    return (
      <section className="recently-viewed">
        <div className="container">
          <div className="recently-viewed-header">
            <div className="header-left">
              <h3>Recently Viewed</h3>
              <span className="recent-count">{recentlyViewed.length} items</span>
            </div>
            <div className="header-right">
              <button 
                className="clear-recent"
                onClick={handleClearAll}
                title="Clear recently viewed"
              >
                {showClearConfirm ? '✓ Confirm Clear' : '✕ Clear All'}
              </button>
            </div>
          </div>

          <motion.div 
            className="recently-viewed-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {recentlyViewed.slice(0, 6).map((product, index) => {
              const productSlug = product.productId || product._id || product.id;
              const hasSale = product.salePrice && product.salePrice < product.price;
              const displayPrice = hasSale ? product.salePrice : product.price;
              const productId = product._id || product.id || product.productId;

              return (
                <motion.div
                  key={productId || index}
                  className="recently-viewed-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => navigate(`/product/${productSlug}`)}
                >
                  {/* ✅ DELETE BUTTON */}
                  <button 
                    className="recent-remove-btn"
                    onClick={(e) => handleRemoveItem(product, e)}
                    title="Remove from recently viewed"
                  >
                    ✕
                  </button>

                  <div className="recent-image-wrapper">
                    <img 
                      src={product.image || 'https://via.placeholder.com/120x120?text=LOOP'} 
                      alt={product.name} 
                      loading="lazy"
                    />
                    {hasSale && (
                      <span className="recent-sale-badge">-{Math.round(((product.price - product.salePrice) / product.price) * 100)}%</span>
                    )}
                    <button 
                      className="recent-quick-add"
                      onClick={(e) => handleQuickAdd(product, e)}
                      title="Quick Add to Cart"
                    >
                      🛒
                    </button>
                  </div>
                  
                  <div className="recent-info">
                    <span className="recently-viewed-name">{product.name}</span>
                    
                    {product.avgRating > 0 && (
                      <div className="recent-rating">
                        <RatingStars rating={product.avgRating} showCount={false} size="small" />
                      </div>
                    )}
                    
                    <div className="recent-price-row">
                      <span className="recently-viewed-price">₹{displayPrice}</span>
                      {hasSale && (
                        <span className="recent-original-price">₹{product.price}</span>
                      )}
                    </div>
                    
                    <div className="recent-meta">
                      <span className="recent-time">{getTimeAgo(product.viewedAt || product.createdAt)}</span>
                      {product.stock > 0 && product.stock <= 10 && (
                        <span className="recent-stock-warning">⚡ Only {product.stock} left</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    );
  }

  // Carousel view for 7+ items
  return (
    <section className="recently-viewed recent-carousel">
      <div className="container">
        <div className="recently-viewed-header">
          <div className="header-left">
            <h3>Recently Viewed</h3>
            <span className="recent-count">{recentlyViewed.length} items</span>
          </div>
          <div className="header-right">
            <button 
              className="clear-recent"
              onClick={handleClearAll}
              title="Clear recently viewed"
            >
              {showClearConfirm ? '✓ Confirm Clear' : '✕ Clear All'}
            </button>
          </div>
        </div>

        <div className="recent-carousel-wrapper">
          <button 
            className="carousel-arrow carousel-arrow-left"
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            ◀
          </button>
          
          <div className="recently-viewed-scroll" ref={scrollContainerRef}>
            {recentlyViewed.map((product, index) => {
              const productSlug = product.productId || product._id || product.id;
              const hasSale = product.salePrice && product.salePrice < product.price;
              const displayPrice = hasSale ? product.salePrice : product.price;
              const productId = product._id || product.id || product.productId;

              return (
                <motion.div
                  key={productId || index}
                  className="recently-viewed-item carousel-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => navigate(`/product/${productSlug}`)}
                >
                  {/* ✅ DELETE BUTTON */}
                  <button 
                    className="recent-remove-btn"
                    onClick={(e) => handleRemoveItem(product, e)}
                    title="Remove from recently viewed"
                  >
                    ✕
                  </button>

                  <div className="recent-image-wrapper">
                    <img 
                      src={product.image || 'https://via.placeholder.com/120x120?text=LOOP'} 
                      alt={product.name} 
                      loading="lazy"
                    />
                    {hasSale && (
                      <span className="recent-sale-badge">-{Math.round(((product.price - product.salePrice) / product.price) * 100)}%</span>
                    )}
                    <button 
                      className="recent-quick-add"
                      onClick={(e) => handleQuickAdd(product, e)}
                      title="Quick Add to Cart"
                    >
                      🛒
                    </button>
                  </div>
                  
                  <div className="recent-info">
                    <span className="recently-viewed-name">{product.name}</span>
                    
                    {product.avgRating > 0 && (
                      <div className="recent-rating">
                        <RatingStars rating={product.avgRating} showCount={false} size="small" />
                      </div>
                    )}
                    
                    <div className="recent-price-row">
                      <span className="recently-viewed-price">₹{displayPrice}</span>
                      {hasSale && (
                        <span className="recent-original-price">₹{product.price}</span>
                      )}
                    </div>
                    
                    <div className="recent-meta">
                      <span className="recent-time">{getTimeAgo(product.viewedAt || product.createdAt)}</span>
                      {product.stock > 0 && product.stock <= 10 && (
                        <span className="recent-stock-warning">⚡ Only {product.stock} left</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <button 
            className="carousel-arrow carousel-arrow-right"
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  );
}

export default RecentlyViewed;