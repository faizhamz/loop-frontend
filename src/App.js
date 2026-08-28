import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import './App.css';
import './pages/OrderHistory.css';
import { AppProvider, useApp } from './context/AppContext';
import axios from 'axios';

// ✅ API_URL - REQUIRED FOR PRODUCT FETCHING
const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// ✅ Import cart sync utilities
import { syncCartToDatabase, loadCartFromDatabase, clearCartInDatabase } from './utils/cartSync';

// ✅ COMPONENTS - These must be imported (not lazy loaded)
import GlobalToast from './components/GlobalToast';
import Sparkles from './components/Sparkles';
import SearchModal from './components/SearchModal';
import GlobalHeader from './components/GlobalHeader';
import RecentlyViewed from './components/RecentlyViewed';
import ProfileCompletion from './components/ProfileCompletion';

// ✅ LAZY LOAD PAGES
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const Auth = lazy(() => import('./components/Auth'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Addresses = lazy(() => import('./pages/Addresses'));
const Contact = lazy(() => import('./pages/Contact'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// ✅ LOADING COMPONENT
const PageLoader = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#000'
  }}>
    <div className="spinner"></div>
  </div>
);

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94]
};

// Wrapper component that uses AppContext
function AppContent() {
  const location = useLocation();
  const { 
    showToast, 
    hideToast, 
    toast, 
    addToRecentlyViewed, 
    setProducts,
    isDarkMode,
    toggleTheme 
  } = useApp();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProductsLocal] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartAnimation, setCartAnimation] = useState(false);

  // ✅ Global Error Handler
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('❌ Runtime error:', event.error || event.message);
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Sync products with context
  useEffect(() => {
    if (setProducts) {
      setProducts(products);
    }
  }, [products, setProducts]);

  // Track visitor for analytics
  const trackVisitor = async () => {
    try {
      let visitorId = localStorage.getItem('loop_visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('loop_visitor_id', visitorId);
      }
      
      let userId = null;
      const token = localStorage.getItem('loop_token');
      if (token) {
        try {
          const userRes = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          userId = userRes.data?._id;
        } catch (e) {}
      }
      
      await axios.post(`${API_URL}/api/analytics/track/visitor`, {
        visitorId,
        userId: userId
      });
    } catch (err) {
      console.error('Error tracking visitor:', err);
    }
  };

  // ✅ Load user and cart on mount
  useEffect(() => {
    fetchProducts();
    trackVisitor();

    const savedCart = localStorage.getItem('loop_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart:', e);
        localStorage.removeItem('loop_cart');
      }
    }
    
    const savedWishlist = localStorage.getItem('loop_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Error parsing wishlist:', e);
        localStorage.removeItem('loop_wishlist');
      }
    }
    
    const token = localStorage.getItem('loop_token');
    const userData = localStorage.getItem('loop_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('✅ User loaded from localStorage:', parsedUser.name);
        
        const loadDbCart = async () => {
          const dbCart = await loadCartFromDatabase();
          if (dbCart && dbCart.length > 0) {
            setCart(dbCart);
            localStorage.setItem('loop_cart', JSON.stringify(dbCart));
          }
        };
        loadDbCart();
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('loop_user');
      }
    }
  }, []);

  // ✅ Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0 || localStorage.getItem('loop_cart')) {
      localStorage.setItem('loop_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // ✅ Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0 || localStorage.getItem('loop_wishlist')) {
      localStorage.setItem('loop_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  // ✅ Handle login with cart sync
  const handleLogin = async (userData, token) => {
    if (token) {
      localStorage.setItem('loop_token', token);
    }
    if (userData) {
      localStorage.setItem('loop_user', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      
      // ✅ Sync local cart to database
      await syncCartToDatabase(userData.id);
      
      // ✅ Load database cart (which now includes synced items)
      const dbCart = await loadCartFromDatabase();
      if (dbCart && dbCart.length > 0) {
        setCart(dbCart);
        localStorage.setItem('loop_cart', JSON.stringify(dbCart));
      }
      
      if (!userData.isProfileComplete && !window.location.pathname.includes('/profile-completion')) {
        setTimeout(() => {
          window.location.href = '/profile-completion';
        }, 1000);
      }
    }
  };

  // ✅ Handle logout with cart clear
  const handleLogout = async () => {
    await clearCartInDatabase();
    localStorage.removeItem('loop_token');
    localStorage.removeItem('loop_user');
    localStorage.removeItem('loop_cart');
    localStorage.removeItem('loop_wishlist');
    setIsLoggedIn(false);
    setUser(null);
    setCart([]);
    setWishlist([]);
    showToast('👋 Logged out successfully', 'info');
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProductsLocal(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  // ✅ FIXED: Add to cart with proper localStorage sync
  const addToCart = async (product, selectedSize, quantity = 1) => {
    if (!product || !product._id) {
      console.error('❌ Cannot add: Invalid product');
      return;
    }
    
    const displayPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
    const size = selectedSize || 'M';
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product._id && item.size === size);
      let updatedCart;
      
      if (existingIndex > -1) {
        updatedCart = prevCart.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        updatedCart = [...prevCart, { 
          id: product._id, 
          name: product.name, 
          price: displayPrice,
          originalPrice: product.price,
          image: product.image,
          quantity: quantity || 1,
          size: size
        }];
      }
      
      // ✅ Update localStorage
      localStorage.setItem('loop_cart', JSON.stringify(updatedCart));
      
      // ✅ Sync to database if logged in
      if (isLoggedIn && user) {
        syncCartToDatabase(user.id);
      }
      
      showToast(`✅ Added ${product.name} (${size}) to cart!`, 'success');
      return updatedCart;
    });
  };

  // ✅ FIXED: Remove from cart with proper localStorage sync
  const removeFromCart = (id, size) => {
    if (!id) {
      console.warn('⚠️ Cannot remove: No product ID provided', { id, size });
      return;
    }
    
    setCart(prevCart => {
      let updatedCart;
      if (size) {
        updatedCart = prevCart.filter(item => !(item.id === id && item.size === size));
      } else {
        updatedCart = prevCart.filter(item => item.id !== id);
      }
      
      // ✅ Update localStorage
      localStorage.setItem('loop_cart', JSON.stringify(updatedCart));
      
      // ✅ Sync to database if logged in
      if (isLoggedIn && user) {
        syncCartToDatabase(user.id);
      }
      
      return updatedCart;
    });
  };

  // ✅ FIXED: Update quantity with proper localStorage sync
  const updateQuantity = (id, newQty, size) => {
    if (!id) {
      console.warn('⚠️ Cannot update: No product ID provided', { id, newQty, size });
      return;
    }
    
    if (newQty < 1) {
      removeFromCart(id, size);
      return;
    }
    
    setCart(prevCart => {
      let updatedCart;
      if (size) {
        updatedCart = prevCart.map(item => 
          item.id === id && item.size === size 
            ? { ...item, quantity: newQty } 
            : item
        );
      } else {
        updatedCart = prevCart.map(item => 
          item.id === id ? { ...item, quantity: newQty } : item
        );
      }
      
      // ✅ Update localStorage
      localStorage.setItem('loop_cart', JSON.stringify(updatedCart));
      
      // ✅ Sync to database if logged in
      if (isLoggedIn && user) {
        syncCartToDatabase(user.id);
      }
      
      return updatedCart;
    });
  };

  const toggleWishlist = (productId) => {
    if (!productId) return;
    
    setWishlist(prevWishlist => {
      let updatedWishlist;
      if (prevWishlist.includes(productId)) {
        updatedWishlist = prevWishlist.filter(id => id !== productId);
        showToast('💔 Removed from wishlist', 'info');
      } else {
        updatedWishlist = [...prevWishlist, productId];
        showToast('❤️ Added to wishlist!', 'success');
      }
      
      localStorage.setItem('loop_wishlist', JSON.stringify(updatedWishlist));
      return updatedWishlist;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const openCart = () => setShowCart(true);
  const closeCart = () => setShowCart(false);

  if (loading) {
    return (
      <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading LOOP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* ✅ DEFAULT META TAGS */}
      <Helmet>
        <title>LOOP - Make Your Move | Premium Fashion</title>
        <meta name="description" content="Shop premium fashion at LOOP. Free delivery on orders above ₹999. 14-day return policy. Best quality fabrics." />
        <meta name="keywords" content="fashion, clothing, premium, loop, style, trends, kawaii" />
        <link rel="canonical" href="https://loopstore.in/" />
        <meta property="og:title" content="LOOP - Make Your Move" />
        <meta property="og:description" content="Shop premium fashion at LOOP. Free delivery on orders above ₹999. 14-day return policy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://loopstore.in/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LOOP - Make Your Move" />
        <meta name="twitter:description" content="Shop premium fashion at LOOP. Free delivery on orders above ₹999." />
      </Helmet>

      {/* Toast Notification */}
      <GlobalToast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onHide={hideToast} 
      />
      
      {/* Floating Sparkles */}
      <Sparkles />
      
      {/* Search Modal */}
      <SearchModal 
        products={products} 
        addToRecentlyViewed={addToRecentlyViewed} 
      />

      {/* Global Header */}
      <GlobalHeader 
        cart={cart}
        wishlist={wishlist}
        isLoggedIn={isLoggedIn}
        user={user}
        handleLogout={handleLogout}
        openCart={openCart}
        products={products}
        cartAnimation={cartAnimation}
      />
      
      {/* Page Routes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/admin" element={
                !isAdmin ? <AdminLogin onLogin={setIsAdmin} /> : <AdminDashboard />
              } />
              
              <Route path="/login" element={
                <Auth 
                  onLogin={handleLogin} 
                  setUser={setUser}
                />
              } />
              <Route path="/signup" element={
                <Auth 
                  onLogin={handleLogin} 
                  setUser={setUser}
                />
              } />
              
              <Route path="/profile-completion" element={
                <ProfileCompletion 
                  user={user} 
                  setUser={setUser}
                />
              } />
              
              <Route path="/product/:slug" element={
                <ProductPage 
                  addToCart={addToCart}
                  cart={cart}
                  setShowCart={openCart}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  setCartAnimation={setCartAnimation}
                  addToRecentlyViewed={addToRecentlyViewed}
                />
              } />
              
              <Route path="/category/:slug" element={
                <CategoryPage 
                  addToCart={addToCart}
                  cart={cart}
                  updateQuantity={updateQuantity}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  addToRecentlyViewed={addToRecentlyViewed}
                />
              } />
              
              <Route path="/checkout" element={<CheckoutPage cartTotal={cartTotal} />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              
              <Route path="/wishlist" element={
                <WishlistPage 
                  wishlist={wishlist}
                  products={products}
                  addToCart={addToCart}
                  toggleWishlist={toggleWishlist}
                />
              } />
              
              <Route path="/orders" element={
                <OrderHistory 
                  user={user}
                  isLoggedIn={isLoggedIn}
                />
              } />
              
              <Route path="/profile" element={
                <Profile 
                  user={user} 
                  setUser={setUser}
                  showToast={showToast}
                />
              } />
              
              <Route path="/addresses" element={<Addresses />} />
              <Route path="/contact" element={<Contact />} />
              
              <Route path="/" element={
                <HomePage 
                  products={products}
                  cart={cart}
                  showCart={showCart}
                  setShowCart={openCart}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                  cartTotal={cartTotal}
                  isLoggedIn={isLoggedIn}
                  user={user}
                  handleLogout={handleLogout}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  cartAnimation={cartAnimation}
                  setCartAnimation={setCartAnimation}
                  addToRecentlyViewed={addToRecentlyViewed}
                />
              } />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Recently Viewed Section - Hide on Checkout, Order Confirmation, etc. */}
      {!['/checkout', '/order-confirmation', '/login', '/signup', '/profile'].includes(location.pathname) && (
        <RecentlyViewed addToCart={addToCart} />
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>Your Cart</h3>
            <button className="close-cart" onClick={closeCart}>✕</button>
          </div>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={`${item.id}-${item.size || 'M'}`} className="cart-item">
                  <div className="cart-item-info">
                    <p className="cart-item-name">
                      {item.name} 
                      <span className="cart-item-size"> ({item.size || 'M'})</span>
                    </p>
                    <p className="cart-item-price">₹{item.price}</p>
                  </div>
                  <div className="cart-item-actions">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}>+</button>
                    <button className="remove-item" onClick={() => removeFromCart(item.id, item.size)}>🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span>₹{cartTotal}</span>
              </div>
              <Link to="/checkout" className="checkout-btn" onClick={closeCart}>
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main App with Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
