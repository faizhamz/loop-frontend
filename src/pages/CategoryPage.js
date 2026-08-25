import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import './CategoryPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// ✅ Helper: Check if product has size variants
const hasSizeVariant = (product) => {
  if (!product.variants || product.variants.length === 0) return false;
  return product.variants.some(v => 
    v.type === 'Size' || v.name === 'Size' || v.type?.toLowerCase() === 'size'
  );
};

// ✅ Helper: Get available sizes for a product
const getProductSizes = (product) => {
  const sizeVariant = product.variants?.find(v => 
    v.type === 'Size' || v.name === 'Size' || v.type?.toLowerCase() === 'size'
  );
  if (sizeVariant) {
    return sizeVariant.options.map(o => o.value);
  }
  return product.size ? [product.size] : [];
};

function CategoryPage({ 
  addToCart, 
  cart, 
  updateQuantity, 
  wishlist, 
  toggleWishlist,
  addToRecentlyViewed
}) {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // ✅ Price Range Filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000 });
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  
  // ✅ Rating Filter
  const [minRating, setMinRating] = useState(0);
  
  // ✅ Size Filter
  const [selectedSizes, setSelectedSizes] = useState([]);
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // ✅ Check if ANY product in this category has sizes
  const hasAnySizeProducts = useMemo(() => {
    return products.some(p => getProductSizes(p).length > 0);
  }, [products]);

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug]);

  useEffect(() => {
    sortProducts();
  }, [products, sortBy, priceRange, minRating, selectedSizes]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/categories/${slug}`);
      setCategory(response.data.category);
      setProducts(response.data.products || []);
      setFilteredProducts(response.data.products || []);
      
      // Set max price from products
      const maxPrice = Math.max(...(response.data.products || []).map(p => p.price || 0), 10000);
      setPriceRange({ min: 0, max: maxPrice });
      setTempPriceRange({ min: 0, max: maxPrice });
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortProducts = () => {
    let sorted = [...(products || [])];
    
    // ✅ Apply Price Filter
    sorted = sorted.filter(product => {
      const price = product.salePrice || product.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // ✅ Apply Rating Filter
    if (minRating > 0) {
      sorted = sorted.filter(product => (product.avgRating || 0) >= minRating);
    }
    
    // ✅ Apply Size Filter - SMART handling
    if (selectedSizes.length > 0) {
      sorted = sorted.filter(product => {
        const productSizes = getProductSizes(product);
        
        // If product has NO sizes defined → always show it (size doesn't apply)
        if (productSizes.length === 0) {
          return true;
        }
        
        // If product has sizes → filter by selected sizes
        return productSizes.some(size => selectedSizes.includes(size));
      });
    }
    
    // ✅ Apply Sort
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'popularity':
        sorted.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'relevance':
      default:
        sorted = [...(products || [])];
        break;
    }
    
    setFilteredProducts(sorted);
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!product) return;
    addToCart(product);
  };

  const getCartQuantity = (productId) => {
    if (!productId) return 0;
    const item = cart.find(item => item.id === productId);
    return item?.quantity || 0;
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.includes(productId);
  };

  const handleProductClick = (product, productSlug) => {
    if (!product) return;
    if (addToRecentlyViewed) {
      addToRecentlyViewed(product);
    }
    const slug = productSlug || product.productId || (product.name ? product.name.toLowerCase().replace(/ /g, '-') : 'product');
    window.location.href = `/product/${slug}`;
  };

  // ✅ Toggle size selection
  const toggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // ✅ Apply price filter
  const applyPriceFilter = () => {
    setPriceRange(tempPriceRange);
    setShowPriceFilter(false);
  };

  // ✅ Reset all filters
  const resetFilters = () => {
    setPriceRange({ min: 0, max: tempPriceRange.max });
    setTempPriceRange({ min: 0, max: tempPriceRange.max });
    setMinRating(0);
    setSelectedSizes([]);
    setSortBy('relevance');
  };

  if (loading) {
    return (
      <div className="category-page">
        <div className="container">
          <div className="category-loading-state">
            <div className="skeleton category-skeleton-header"></div>
            <div className="skeleton category-skeleton-grid"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="category-page">
        <div className="container">
          <div className="category-error">
            <h2>Category Not Found</h2>
            <p>Sorry, we couldn't find this category.</p>
            <Link to="/" className="back-home">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = minRating > 0 || selectedSizes.length > 0 || priceRange.min > 0 || priceRange.max < tempPriceRange.max;

  return (
    <div className="category-page">
      {/* ✅ META TAGS */}
      <Helmet>
        <title>{category.name} | LOOP - Premium Fashion</title>
        <meta name="description" content={`Explore ${category.name} collection at LOOP. ${category.description || `Shop the best ${category.name} products online.`} Free delivery on orders above ₹999.`} />
        <meta name="keywords" content={`${category.name}, loop, fashion, ${category.name} collection, ${category.name} products`} />
        <link rel="canonical" href={`https://loopstore.in/category/${category.slug}`} />
        <meta property="og:title" content={`${category.name} | LOOP`} />
        <meta property="og:description" content={`Shop ${category.name} collection at LOOP. Free delivery on orders above ₹999.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://loopstore.in/category/${category.slug}`} />
        {category.image && <meta property="og:image" content={category.image} />}
      </Helmet>

      <div className="container">
        {/* Breadcrumb */}
        <motion.div 
          className="category-breadcrumb"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/">Home</Link>
          <span>›</span>
          <span className="current">{category?.name || 'Category'}</span>
        </motion.div>

        {/* Category Header */}
        <motion.div 
          className="category-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="category-header-content">
            {category?.image ? (
              <img 
                src={category.image} 
                alt={category.name || 'Category'} 
                className="category-header-image"
              />
            ) : (
              <div className="category-header-placeholder">
                <span className="category-header-icon">{category?.icon || '📁'}</span>
              </div>
            )}
            <div className="category-header-info">
              <h1 className="category-header-title">{category?.name || 'Category'}</h1>
              {category?.description && (
                <p className="category-header-desc">{category.description}</p>
              )}
              <span className="category-header-count">
                {(filteredProducts || []).length} Products
              </span>
            </div>
          </div>
        </motion.div>

        {/* Sort Controls + Filters */}
        <motion.div 
          className="category-sort"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="category-sort-left">
            <span className="sort-label">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popularity">Popularity</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
          
          <div className="category-filter-controls">
            {/* ✅ Price Filter Button */}
            <button 
              className={`filter-toggle-btn ${showPriceFilter ? 'active' : ''}`}
              onClick={() => setShowPriceFilter(!showPriceFilter)}
            >
              💰 Price {priceRange.min > 0 || priceRange.max < tempPriceRange.max ? '●' : ''}
            </button>
            
            {/* ✅ Rating Filter Buttons */}
            <div className="rating-filter-buttons">
              <button 
                className={`rating-filter-btn ${minRating === 0 ? 'active' : ''}`}
                onClick={() => setMinRating(0)}
              >
                All
              </button>
              {[4, 3, 2].map(rating => (
                <button 
                  key={rating}
                  className={`rating-filter-btn ${minRating === rating ? 'active' : ''}`}
                  onClick={() => setMinRating(rating)}
                >
                  {rating}★+
                </button>
              ))}
            </div>
            
            {/* ✅ Size Filter - ONLY SHOW IF PRODUCTS HAVE SIZES */}
            {hasAnySizeProducts && (
              <div className="size-filter-buttons">
                {availableSizes.map(size => (
                  <button 
                    key={size}
                    className={`size-filter-btn ${selectedSizes.includes(size) ? 'active' : ''}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
            
            {/* ✅ Reset Filters */}
            {hasActiveFilters && (
              <button className="reset-filters-btn" onClick={resetFilters}>
                ✕ Clear Filters
              </button>
            )}
          </div>
          
          <span className="category-result-count">
            Showing {(filteredProducts || []).length} products
          </span>
        </motion.div>

        {/* ✅ Price Range Filter Panel */}
        {showPriceFilter && (
          <motion.div 
            className="price-filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="price-filter-content">
              <div className="price-range-display">
                <span>₹{tempPriceRange.min}</span>
                <span>to</span>
                <span>₹{tempPriceRange.max}</span>
              </div>
              <div className="price-range-slider">
                <input
                  type="range"
                  min="0"
                  max={tempPriceRange.max || 10000}
                  value={tempPriceRange.min}
                  onChange={(e) => setTempPriceRange({ ...tempPriceRange, min: Number(e.target.value) })}
                  className="price-slider min-slider"
                />
                <input
                  type="range"
                  min="0"
                  max={tempPriceRange.max || 10000}
                  value={tempPriceRange.max}
                  onChange={(e) => setTempPriceRange({ ...tempPriceRange, max: Number(e.target.value) })}
                  className="price-slider max-slider"
                />
              </div>
              <div className="price-filter-actions">
                <button className="price-filter-apply" onClick={applyPriceFilter}>
                  Apply
                </button>
                <button className="price-filter-cancel" onClick={() => setShowPriceFilter(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        {(filteredProducts || []).length === 0 ? (
          <div className="category-empty">
            <span className="empty-icon">🔍</span>
            <h3>No products found</h3>
            <p>Try adjusting your filters</p>
            <button className="reset-filters-btn" onClick={resetFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <motion.div 
            className="category-products-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredProducts.map(product => {
              if (!product) return null;
              
              const hasSale = product.salePrice && product.salePrice < product.price;
              const displayPrice = hasSale ? product.salePrice : product.price;
              const discountPercent = hasSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
              const productSlug = product.productId || (product.name ? product.name.toLowerCase().replace(/ /g, '-') : 'product');
              const inWishlist = isInWishlist(product._id);
              const quantity = getCartQuantity(product._id);
              
              // ✅ Get product sizes for display
              const productSizes = getProductSizes(product);
              const hasSizes = productSizes.length > 0;

              return (
                <motion.div 
                  key={product._id} 
                  className="category-product-card"
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleProductClick(product, productSlug)}
                >
                  <div className="product-image">
                    <img 
                      src={product.image || 'https://via.placeholder.com/300x300?text=LOOP'} 
                      alt={product.name || 'Product'}
                      loading="lazy"
                    />
                    {hasSale && (
                      <span className="sale-badge">-{discountPercent}%</span>
                    )}
                    {product.avgRating >= 4 && (
                      <span className="top-rated-badge">⭐ Top Rated</span>
                    )}
                    <button 
                      className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product._id);
                      }}
                    >
                      {inWishlist ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
                    
                    {/* ✅ Show size info - only if product has sizes */}
                    {hasSizes && (
                      <div className="product-sizes-display">
                        <span className="sizes-label">Sizes:</span>
                        {productSizes.map((size, idx) => (
                          <span key={idx} className="size-tag">{size}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="product-rating-mini">
                      {product.avgRating > 0 && (
                        <span className="rating-stars-mini">
                          {'★'.repeat(Math.floor(product.avgRating))}{'☆'.repeat(5 - Math.floor(product.avgRating))}
                          <span className="rating-number">({product.avgRating.toFixed(1)})</span>
                        </span>
                      )}
                    </div>
                    <div className="product-price">
                      {hasSale ? (
                        <>
                          <span className="original-price">₹{product.price}</span>
                          <span className="sale-price">₹{product.salePrice}</span>
                        </>
                      ) : (
                        <span className="regular-price">₹{product.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="product-actions">
                    {quantity > 0 ? (
                      <div className="quantity-control">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product._id, quantity - 1);
                          }}
                        >−</button>
                        <span>{quantity}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product._id, quantity + 1);
                          }}
                        >+</button>
                      </div>
                    ) : (
                      <button 
                        className="add-to-cart"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        🛒 Add
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;