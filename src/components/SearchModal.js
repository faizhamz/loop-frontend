import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function SearchModal({ products, addToRecentlyViewed }) {
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    setSearchResults,
    showSearchModal,
    setShowSearchModal,
    performSearch
  } = useApp();
  
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (showSearchModal) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSearchModal]);

  const handleSelect = (product) => {
    addToRecentlyViewed(product);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchModal(false);
    const slug = product.productId || product.name.toLowerCase().replace(/ /g, '-');
    navigate(`/product/${slug}`);
  };

  if (!showSearchModal) return null;

  return (
    <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <span className="search-modal-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              performSearch(e.target.value, products);
            }}
          />
          <button onClick={() => setShowSearchModal(false)}>✕</button>
        </div>
        
        {searchQuery && (
          <div className="search-modal-results">
            {searchResults.length === 0 ? (
              <p className="search-no-results">No products found</p>
            ) : (
              searchResults.slice(0, 12).map(product => (
                <div 
                  key={product._id} 
                  className="search-modal-item"
                  onClick={() => handleSelect(product)}
                >
                  <img 
                    src={product.image || 'https://via.placeholder.com/50x50?text=LOOP'} 
                    alt={product.name} 
                  />
                  <div className="search-modal-item-info">
                    <span className="search-modal-item-name">{product.name}</span>
                    <span className="search-modal-item-category">{product.category}</span>
                  </div>
                  <span className="search-modal-item-price">₹{product.price}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchModal;