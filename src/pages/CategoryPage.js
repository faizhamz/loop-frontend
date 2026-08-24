import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug]);

  useEffect(() => {
    sortProducts();
  }, [products, sortBy]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/categories/${slug}`);
      setCategory(response.data.category);
      setProducts(response.data.products || []);
      setFilteredProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortProducts = () => {
    let sorted = [...(products || [])];
    
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

  return (
    <div className="category-page">
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

        {/* Sort Controls */}
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
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
          <span className="category-result-count">
            Showing {(filteredProducts || []).length} products
          </span>
        </motion.div>

        {/* Products Grid */}
        {(filteredProducts || []).length === 0 ? (
          <div className="category-empty">
            <span className="empty-icon">🔍</span>
            <h3>No products in this category yet</h3>
            <p>Check back soon for new arrivals!</p>
          </div>
        ) : (
          <motion.div 
            className="category-products-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredProducts.map(product => {
              // ✅ Skip if product is undefined
              if (!product) return null;
              
              const hasSale = product.salePrice && product.salePrice < product.price;
              const displayPrice = hasSale ? product.salePrice : product.price;
              const discountPercent = hasSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
              const productSlug = product.productId || (product.name ? product.name.toLowerCase().replace(/ /g, '-') : 'product');
              const inWishlist = isInWishlist(product._id);
              const quantity = getCartQuantity(product._id);

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