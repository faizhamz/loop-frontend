import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useInView } from 'react-intersection-observer';
import BannerCarousel from '../components/BannerCarousel';
import CountUp from 'react-countup';
import CategoryCard from '../components/CategoryCard';
import axios from 'axios';
import './HomePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const productCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  hover: {
    y: -10,
    scale: 1.02,
    transition: { duration: 0.3 }
  }
};

function HomePage({ 
  products, 
  cart, 
  showCart, 
  setShowCart, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  cartTotal,
  isLoggedIn,
  user,
  handleLogout,
  wishlist,
  toggleWishlist,
  cartAnimation,
  setCartAnimation,
  addToRecentlyViewed
}) {
  const [cartAnimationLocal, setCartAnimationLocal] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Category States
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const isCartAnimating = cartAnimation || cartAnimationLocal;

  // Fetch Categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!product) return;
    addToCart(product);
    setCartAnimationLocal(true);
    setTimeout(() => {
      setCartAnimationLocal(false);
    }, 500);
    if (setShowCart) {
      setTimeout(() => {
        setShowCart(true);
      }, 300);
    }
  };

  const navigateToProduct = (productSlug, product) => {
    if (!product) return;
    if (addToRecentlyViewed && product) {
      addToRecentlyViewed(product);
    }
    const slug = productSlug || product.productId || (product.name ? product.name.toLowerCase().replace(/ /g, '-') : 'product');
    window.location.href = `/product/${slug}`;
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.includes(productId);
  };

  const handleWishlistToggle = (productId, e) => {
    if (e) e.stopPropagation();
    if (!productId) return;
    
    const isAdding = !isInWishlist(productId);
    toggleWishlist(productId);
    
    if (isAdding) {
      const rect = e?.target?.getBoundingClientRect();
      if (rect) {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const heartEl = document.createElement('div');
            heartEl.className = 'floating-heart';
            heartEl.textContent = '❤️';
            heartEl.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 40}px`;
            heartEl.style.top = `${rect.top + (Math.random() - 0.5) * 20}px`;
            heartEl.style.fontSize = `${20 + Math.random() * 20}px`;
            document.body.appendChild(heartEl);
            setTimeout(() => {
              heartEl.remove();
            }, 1500);
          }, i * 100);
        }
      }
    }
  };

  const openCart = () => {
    if (setShowCart) {
      setShowCart(true);
    }
  };

  // Stats for animated counters
  const stats = {
    products: (products || []).length,
    customers: 1250,
    orders: 3420,
    satisfaction: '98%'
  };

  return (
    <div className="App">
      {/* ✅ META TAGS FOR HOMEPAGE */}
      <Helmet>
        <title>LOOP - Make Your Move | Premium Fashion Store</title>
        <meta name="description" content="Shop the latest premium fashion at LOOP. Free delivery on orders above ₹999. 14-day return policy. Best quality fabrics and unique styles." />
        <meta name="keywords" content="fashion, clothing, premium, loop, style, trends, kawaii, online shopping, India" />
        <link rel="canonical" href="https://loopstore.in/" />
        <meta property="og:title" content="LOOP - Make Your Move | Premium Fashion" />
        <meta property="og:description" content="Shop premium fashion at LOOP. Free delivery on orders above ₹999. 14-day return policy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://loopstore.in/" />
        <meta property="og:image" content="https://loopstore.in/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LOOP - Make Your Move" />
        <meta name="twitter:description" content="Shop premium fashion at LOOP. Free delivery on orders above ₹999." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "LOOP",
            "url": "https://loopstore.in/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://loopstore.in/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      {/* ✅ HERO SECTION - ORIGINAL */}
      <motion.section 
        className="hero hero-homepage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container hero-content">
          <motion.div 
            className="hero-logo-wrapper"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div 
              className="hero-logo-big"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <span className="hero-l-big">L</span>
              <span className="hero-infinity-big">∞</span>
              <span className="hero-p-big">P</span>
            </motion.div>
            <motion.p 
              className="hero-tagline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              MAKE YOUR MOVE
            </motion.p>
            <motion.button 
              className="cta-button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Now
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Banner Carousel Section */}
      <section className="banner-section">
        <div className="container">
          <BannerCarousel />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" ref={ref}>
        <div className="container">
          <motion.div 
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <motion.div className="stat-card card-hover" variants={fadeInUp}>
              <h3>
                {inView && (
                  <CountUp 
                    end={stats.products} 
                    duration={2.5} 
                    separator="," 
                    suffix="+"
                  />
                )}
              </h3>
              <p>Products</p>
            </motion.div>
            <motion.div className="stat-card card-hover" variants={fadeInUp}>
              <h3>
                {inView && (
                  <CountUp 
                    end={stats.customers} 
                    duration={2.5} 
                    separator="," 
                    suffix="+"
                  />
                )}
              </h3>
              <p>Happy Customers</p>
            </motion.div>
            <motion.div className="stat-card card-hover" variants={fadeInUp}>
              <h3>
                {inView && (
                  <CountUp 
                    end={stats.orders} 
                    duration={2.5} 
                    separator="," 
                    suffix="+"
                  />
                )}
              </h3>
              <p>Orders Delivered</p>
            </motion.div>
            <motion.div className="stat-card card-hover" variants={fadeInUp}>
              <h3>{stats.satisfaction}</h3>
              <p>Satisfaction Rate</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Shop By Category Section */}
      <section className="category-section">
        <div className="container">
          <div className="category-section-header">
            <h2 className="category-section-title">Explore By Category</h2>
            {(categories || []).length > 0 && (
              <span className="category-section-count">{(categories || []).length} Categories</span>
            )}
          </div>
          
          {categoriesLoading ? (
            <div className="category-loading">
              <div className="skeleton" style={{ width: '160px', height: '180px', borderRadius: '12px', display: 'inline-block', marginRight: '16px' }}></div>
              <div className="skeleton" style={{ width: '160px', height: '180px', borderRadius: '12px', display: 'inline-block', marginRight: '16px' }}></div>
              <div className="skeleton" style={{ width: '160px', height: '180px', borderRadius: '12px', display: 'inline-block', marginRight: '16px' }}></div>
              <div className="skeleton" style={{ width: '160px', height: '180px', borderRadius: '12px', display: 'inline-block' }}></div>
            </div>
          ) : (categories || []).length === 0 ? (
            <p className="no-categories" style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No categories yet. Check back soon!</p>
          ) : (
            <div className="category-scroll-container">
              {(categories || []).map((category, index) => (
                <CategoryCard 
                  key={category._id || index} 
                  category={category} 
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            NEW ARRIVALS
          </motion.h2>
          
          {(products || []).length === 0 ? (
            <p style={{ textAlign: 'center' }}>No products yet. Add some in admin panel!</p>
          ) : (
            <motion.div 
              className="product-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {(products || []).map((product, index) => {
                if (!product) return null;
                
                const hasSale = product.salePrice && product.salePrice < product.price;
                const displayPrice = hasSale ? product.salePrice : product.price;
                const discountPercent = hasSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
                const avgRating = product.avgRating || 0;
                const reviewCount = product.reviewCount || 0;
                const fullStars = Math.floor(avgRating);
                const emptyStars = 5 - fullStars;
                const productSlug = product.productId || (product.name ? product.name.toLowerCase().replace(/ /g, '-') : 'product');
                const inWishlist = isInWishlist(product._id);
                const cartItem = cart.find(item => item.id === product._id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <motion.div 
                    key={product._id || index} 
                    className="product-card"
                    variants={productCardVariants}
                    whileHover="hover"
                    onClick={() => navigateToProduct(productSlug, product)}
                  >
                    <div className="product-image">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300x300?text=LOOP'} 
                        alt={product.name || 'Product'} 
                        loading="lazy"
                        className="product-img"
                      />
                      {hasSale && (
                        <motion.span 
                          className="sale-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          -{discountPercent}%
                        </motion.span>
                      )}
                      {product.avgRating >= 4 && (
                        <span className="top-rated-badge">⭐ Top Rated</span>
                      )}
                      <motion.button 
                        className={`wishlist-btn-card ${inWishlist ? 'active' : ''}`}
                        onClick={(e) => handleWishlistToggle(product._id, e)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                      >
                        {inWishlist ? '❤️' : '🤍'}
                      </motion.button>
                    </div>
                    <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
                    <div className="product-rating">
                      <span className="stars">
                        {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}
                      </span>
                      <span className="review-count">({reviewCount})</span>
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
                    <div className="add-to-cart-container">
                      {quantity > 0 ? (
                        <div className="quantity-control-card">
                          <button 
                            className="qty-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product._id, quantity - 1);
                            }}
                          >−</button>
                          <span className="qty-number">{quantity}</span>
                          <button 
                            className="qty-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product._id, quantity + 1);
                            }}
                          >+</button>
                        </div>
                      ) : (
                        <motion.button 
                          className="add-to-cart" 
                          onClick={(e) => handleAddToCart(product, e)}
                          whileHover={{ scale: 1.02, backgroundColor: '#c49f2e' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="btn-content">
                            <span className="btn-icon">🛒</span>
                            Add to Cart
                          </span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="trust-section">
        <div className="container">
          <motion.div 
            className="trust-grid"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="trust-item">
              <span className="trust-icon">🚚</span>
              <h4>Free Delivery</h4>
              <p>On orders above ₹999</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🔄</span>
              <h4>14-Day Return</h4>
              <p>Hassle free returns</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <h4>Secure Payment</h4>
              <p>100% secure checkout</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⭐</span>
              <h4>Quality Assured</h4>
              <p>Premium fabrics only</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <Link to="/" className="bottom-nav-item">
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">Home</span>
        </Link>
        <Link to="/wishlist" className="bottom-nav-item">
          <span className="bottom-nav-icon">❤️</span>
          <span className="bottom-nav-label">Wishlist</span>
          {(wishlist || []).length > 0 && (
            <span className="bottom-nav-badge">{(wishlist || []).length}</span>
          )}
        </Link>
        <button className="bottom-nav-item" onClick={openCart}>
          <span className="bottom-nav-icon">🛒</span>
          <span className="bottom-nav-label">Cart</span>
          {(cart || []).length > 0 && (
            <span className="bottom-nav-badge">
              {(cart || []).reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">L∞P</div>
            <p className="footer-tagline">Make your move</p>
            <p className="copyright">© 2025 LOOP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
