import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import ReviewModal from '../components/ReviewModal';
import StockWarning, { VariantStockWarning } from '../components/StockWarning';
import './ProductPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// Utility functions for media
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const videoDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'imagekit.io'];
  const lowerUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;
  if (videoDomains.some(domain => lowerUrl.includes(domain))) return true;
  return false;
};

const getVideoEmbedUrl = (url) => {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URLSearchParams(url.split('?')[1]).get('v');
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  }
  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.split('/shorts/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('/').pop().split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('/').pop().split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

// Media Renderer Component
const MediaRenderer = ({ media, className, isFullscreen = false }) => {
  const isVideo = isVideoUrl(media);
  
  if (isVideo) {
    const embedUrl = getVideoEmbedUrl(media);
    
    if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com')) {
      return (
        <iframe
          src={embedUrl}
          title="Product Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={className}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: isFullscreen ? '0' : '12px'
          }}
        />
      );
    } else {
      return (
        <video
          src={media}
          controls
          playsInline
          autoPlay={isFullscreen}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: isFullscreen ? '0' : '12px'
          }}
        />
      );
    }
  } else {
    return (
      <img
        src={media}
        alt="Product"
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: isFullscreen ? '0' : '12px'
        }}
      />
    );
  }
};

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
    transition: { staggerChildren: 0.1 }
  }
};

// Ripple effect function
const createRipple = (e) => {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

function ProductPage({ 
  addToCart, 
  cart, 
  setShowCart, 
  updateQuantity, 
  removeFromCart,
  wishlist: globalWishlist,
  toggleWishlist: globalToggleWishlist,
  setCartAnimation,
  addToRecentlyViewed 
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [localWishlist, setLocalWishlist] = useState([]);
  
  // ✅ WhatsApp Contact State
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewOrderItemId, setReviewOrderItemId] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalImageRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const quantityTimeoutRef = useRef(null);

  // ✅ Fetch WhatsApp number
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/contact`);
        if (response.data?.whatsapp) {
          setWhatsappNumber(response.data.whatsapp);
        }
      } catch (err) {
        console.error('Error fetching contact:', err);
      }
    };
    fetchContact();
  }, []);

  // Build media array from product data
  const allMedia = (() => {
    if (!product) return [];
    const media = [];
    
    if (product.image) media.push(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && !media.includes(img)) media.push(img);
      });
    }
    if (product.videos && product.videos.length > 0) {
      product.videos.forEach(video => {
        if (video && !media.includes(video)) media.push(video);
      });
    }
    if (media.length === 0) {
      media.push('https://via.placeholder.com/500x500?text=LOOP');
    }
    return media;
  })();

  // Check if user can review
  const checkCanReview = async () => {
    const token = localStorage.getItem('loop_token');
    if (!token || !product) return;

    setReviewLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/reviews/can-review/${product._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.canReview) {
        setCanReview(true);
        if (response.data.reviewableItems && response.data.reviewableItems.length > 0) {
          const item = response.data.reviewableItems[0];
          setReviewOrderId(item.orderId);
          setReviewOrderItemId(item.orderItemId);
        }
      } else {
        setCanReview(false);
      }
    } catch (error) {
      console.error('Error checking review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    if (!product) return;
    try {
      const response = await axios.get(`${API_URL}/api/reviews/product/${product._id}`);
      setReviews(response.data.reviews || []);
      setReviewStats(response.data.stats || { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Get current quantity from cart
  const getCartQuantity = () => {
    if (!product) return 0;
    const cartItem = cart.find(item => item.id === product._id);
    return cartItem?.quantity || 0;
  };

  const cartQuantity = getCartQuantity();
  const isInCart = cartQuantity > 0;

  // Get selected variant details
  const getSelectedVariantDetails = () => {
    if (!product || !product.variants || product.variants.length === 0) {
      return { price: product?.price || 0, stock: product?.stock || 0 };
    }
    
    let totalPrice = 0;
    let stock = 0;
    
    product.variants.forEach(variant => {
      const selectedOpt = variant.options.find(opt => 
        opt.value === selectedVariant[variant.type || variant.name]
      );
      if (selectedOpt) {
        totalPrice += selectedOpt.price || 0;
        stock = selectedOpt.stock || 0;
      }
    });
    
    return { price: product.price + totalPrice, stock };
  };

  const variantDetails = getSelectedVariantDetails();
  const displayPrice = product?.salePrice && product.salePrice < product.price 
    ? product.salePrice 
    : variantDetails.price || product?.price || 0;
  
  const isVariantOutOfStock = variantDetails.stock === 0;

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('loop_wishlist');
    if (savedWishlist) {
      setLocalWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('loop_wishlist', JSON.stringify(localWishlist));
  }, [localWishlist]);

  // Load saved size from localStorage
  useEffect(() => {
    const savedSize = localStorage.getItem(`loop_size_${slug}`);
    if (savedSize) {
      setSelectedSize(savedSize);
    }
  }, [slug]);

  // Use global wishlist if provided, otherwise local
  const wishlist = globalWishlist || localWishlist;
  const toggleWishlist = globalToggleWishlist || ((id) => {
    if (localWishlist.includes(id)) {
      setLocalWishlist(localWishlist.filter(item => item !== id));
    } else {
      setLocalWishlist([...localWishlist, id]);
    }
  });

  // Preload images
  useEffect(() => {
    if (allMedia.length > 0 && allMedia[0] !== 'https://via.placeholder.com/500x500?text=LOOP') {
      allMedia.forEach((mediaSrc) => {
        if (mediaSrc && mediaSrc !== 'https://via.placeholder.com/500x500?text=LOOP' && !isVideoUrl(mediaSrc)) {
          const img = new Image();
          img.src = mediaSrc;
        }
      });
    }
  }, [allMedia]);

  // Preload adjacent media in fullscreen
  useEffect(() => {
    if (isFullscreen && allMedia.length > 0) {
      if (fullscreenIndex < allMedia.length - 1) {
        const nextMedia = allMedia[fullscreenIndex + 1];
        if (nextMedia && !isVideoUrl(nextMedia)) {
          const nextImg = new Image();
          nextImg.src = nextMedia;
        }
      }
      if (fullscreenIndex > 0) {
        const prevMedia = allMedia[fullscreenIndex - 1];
        if (prevMedia && !isVideoUrl(prevMedia)) {
          const prevImg = new Image();
          prevImg.src = prevMedia;
        }
      }
    }
  }, [isFullscreen, fullscreenIndex, allMedia]);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(`${API_URL}/api/products/${slug}`);
        
        if (response.data) {
          setProduct(response.data);
          setSelectedImage(response.data.image || '');
          
          const savedSize = localStorage.getItem(`loop_size_${slug}`);
          if (savedSize) {
            setSelectedSize(savedSize);
          } else if (response.data.size) {
            setSelectedSize(response.data.size);
          }
          
          if (response.data.variants && response.data.variants.length > 0) {
            const defaultVariant = {};
            response.data.variants.forEach(variant => {
              if (variant.options && variant.options.length > 0) {
                defaultVariant[variant.type || variant.name] = variant.options[0].value;
              }
            });
            setSelectedVariant(defaultVariant);
          }
          
          const cartItem = cart.find(item => item.id === response.data._id);
          if (cartItem) {
            setQuantity(cartItem.quantity);
          }
          
          const allProducts = await axios.get(`${API_URL}/api/products`);
          const similar = allProducts.data
            .filter(p => p._id !== response.data._id && p.category === response.data.category)
            .slice(0, 4);
          setSimilarProducts(similar);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.log('Error fetching product:', err);
        setError('Product not found');
      }
      
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  // Update selected image when index changes
  useEffect(() => {
    if (allMedia.length > 0 && allMedia[currentMediaIndex]) {
      const media = allMedia[currentMediaIndex];
      if (!isVideoUrl(media)) {
        setSelectedImage(media);
      }
    }
  }, [currentMediaIndex, allMedia]);

  // Update quantity when selected variant changes
  useEffect(() => {
    if (product) {
      const cartItem = cart.find(item => item.id === product._id);
      if (cartItem) {
        setQuantity(cartItem.quantity);
      } else {
        setQuantity(1);
      }
    }
  }, [selectedVariant, cart, product]);

  // Fetch reviews and check review permission when product loads
  useEffect(() => {
    if (product) {
      fetchReviews();
      checkCanReview();
    }
  }, [product]);

  // Hide swipe hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // ESC key to close fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Toast auto-dismiss
  useEffect(() => {
    if (showToast) {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
      }, 2500);
    }
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [showToast]);

  // ✅ Open WhatsApp with product query
  const openWhatsApp = () => {
    if (!whatsappNumber) {
      alert('WhatsApp support number not available. Please contact us via email.');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = `Hi LOOP Team, I have a question about ${product?.name || 'your products'}. Could you please help me?`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const openCart = () => {
    if (setShowCart) {
      setShowCart(true);
    }
  };

  // Handle variant selection
  const handleVariantSelect = (variantType, optionValue) => {
    setSelectedVariant(prev => ({
      ...prev,
      [variantType]: optionValue
    }));
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      if (product && isInCart) {
        removeFromCart(product._id);
        showToastMessage(`🗑️ Removed from cart`, 'info');
        setQuantity(1);
      }
      return;
    }
    
    setQuantity(newQuantity);
    
    if (quantityTimeoutRef.current) {
      clearTimeout(quantityTimeoutRef.current);
    }
    
    quantityTimeoutRef.current = setTimeout(() => {
      if (product) {
        if (isInCart) {
          updateQuantity(product._id, newQuantity);
        } else if (newQuantity > 0) {
          addToCart(product, null, newQuantity);
          showToastMessage(`✅ Added ${newQuantity} × ${product.name} to cart!`, 'success');
          
          if (setCartAnimation) {
            setCartAnimation(true);
            setTimeout(() => {
              setCartAnimation(false);
            }, 500);
          }
        }
      }
    }, 400);
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (quantityTimeoutRef.current) {
      clearTimeout(quantityTimeoutRef.current);
    }

    if (isInCart) {
      updateQuantity(product._id, quantity);
      showToastMessage(`🔄 Updated ${quantity} × ${product.name} in cart!`, 'success');
    } else {
      addToCart(product, null, quantity);
      showToastMessage(`✅ Added ${quantity} × ${product.name} to cart!`, 'success');
    }
    
    if (setCartAnimation) {
      setCartAnimation(true);
      setTimeout(() => {
        setCartAnimation(false);
      }, 500);
    }

    setTimeout(() => {
      openCart();
    }, 400);
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (isInCart) {
      updateQuantity(product._id, quantity);
    } else {
      addToCart(product, null, quantity);
    }

    if (setCartAnimation) {
      setCartAnimation(true);
      setTimeout(() => {
        setCartAnimation(false);
      }, 500);
    }

    setTimeout(() => {
      navigate('/checkout');
    }, 300);
  };

  const toggleWishlistWithHeart = (productId, e) => {
    if (e) e.stopPropagation();
    
    const isAdding = !wishlist.includes(productId);
    toggleWishlist(productId);
    
    if (isAdding) {
      showToastMessage('❤️ Added to wishlist!', 'success');
      if (e) {
        const rect = e.target.getBoundingClientRect();
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
    } else {
      showToastMessage('💔 Removed from wishlist', 'info');
    }
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'LOOP Product',
        text: `Check out ${product?.name || 'this product'} on LOOP!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage('📋 Link copied!', 'success');
    }
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
    setTouchEndY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    if (isFullscreen && Math.abs(diffY) > Math.abs(diffX) && diffY > 50) {
      closeFullscreen();
      return;
    }
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setCurrentMediaIndex((prev) => 
          prev < allMedia.length - 1 ? prev + 1 : prev
        );
      } else {
        setCurrentMediaIndex((prev) => 
          prev > 0 ? prev - 1 : prev
        );
      }
    }
  };

  const handleModalTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleModalTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const delta = distance - lastTouchDistance;
      const newScale = Math.min(Math.max(scale + delta * 0.01, 1), 3);
      setScale(newScale);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && scale > 1) {
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY
      });
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchEndX(e.touches[0]?.clientX || 0);
      setTouchEndY(e.touches[0]?.clientY || 0);
    }
  };

  const handleModalTouchEnd = () => {
    setIsPinching(false);
    
    if (scale === 1) {
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      if (Math.abs(diffY) > Math.abs(diffX) && diffY > 50) {
        closeFullscreen();
        return;
      }
      
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          setFullscreenIndex((prev) => 
            prev < allMedia.length - 1 ? prev + 1 : prev
          );
        } else {
          setFullscreenIndex((prev) => 
            prev > 0 ? prev - 1 : prev
          );
        }
      }
    }
  };

  const openFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToPrevious = () => {
    setFullscreenIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setFullscreenIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : prev));
  };

  // Track product view for analytics
  const trackProductView = async () => {
    try {
      if (!product) return;
      
      const visitorId = localStorage.getItem('loop_visitor_id') || 
                       sessionStorage.getItem('loop_session_id');
      
      const viewedProducts = JSON.parse(sessionStorage.getItem('viewed_products') || '[]');
      if (!viewedProducts.includes(product._id)) {
        viewedProducts.push(product._id);
        sessionStorage.setItem('viewed_products', JSON.stringify(viewedProducts));
        
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
        
        await axios.post(`${API_URL}/api/analytics/track/product-view`, {
          productId: product._id,
          visitorId: visitorId || 'unknown',
          userId: userId
        });
        console.log('📊 Product view tracked:', product.productId);
      }
    } catch (err) {
      console.error('Error tracking product view:', err);
    }
  };

  // Call tracking when product loads
  useEffect(() => {
    if (product) {
      trackProductView();
      if (addToRecentlyViewed) {
        addToRecentlyViewed(product);
      }
    }
  }, [product]);

  // Loading state
  if (loading) {
    return (
      <motion.div 
        className="product-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="spinner"></div>
        <p>Loading product...</p>
      </motion.div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <motion.div 
        className="product-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Product Not Found</h2>
        <p>{error || 'Sorry, we couldn\'t find this product.'}</p>
        <Link to="/" className="back-home">Back to Home</Link>
      </motion.div>
    );
  }

  // Calculate product data
  const hasSale = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const isInWishlist = wishlist.includes(product._id);
  const displayQuantity = isInCart ? cartQuantity : quantity;
  const totalSold = product.totalSold || 0;

  // Get unique sizes and colors from variants (for backward compatibility)
  const uniqueSizes = product.variants && product.variants.length > 0 
    ? product.variants.find(v => v.type === 'Size' || v.name === 'Size')?.options.map(o => o.value) || []
    : [product.size || 'M'];
  
  const uniqueColors = product.variants && product.variants.length > 0 
    ? product.variants.find(v => v.type === 'Color' || v.name === 'Color')?.options.map(o => o.value) || []
    : [product.color || 'Black'];

  // ✅ Build Schema.org JSON-LD
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image || product.images?.[0] || '',
    "description": product.description || `Buy ${product.name} online at LOOP.`,
    "sku": product.productId,
    "brand": {
      "@type": "Brand",
      "name": "LOOP"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": hasSale ? product.salePrice : product.price,
      "availability": product.stock > 0 ? 
        "https://schema.org/InStock" : 
        "https://schema.org/OutOfStock"
    }
  };

  // Add aggregate rating if available
  if (product.avgRating > 0 && product.reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating,
      "reviewCount": product.reviewCount
    };
  }

  return (
    <div className="product-page">
      {/* ✅ META TAGS + SCHEMA */}
      <Helmet>
        <title>{product.name} | LOOP - Premium Fashion</title>
        <meta name="description" content={`Buy ${product.name} online at LOOP. ₹${product.price}. ${product.description?.slice(0, 150) || 'Premium quality product with free delivery on orders above ₹999.'}`} />
        <meta name="keywords" content={`${product.name}, loop, fashion, ${product.category}, ${product.color || ''}, ${product.size || ''}, clothing`} />
        <link rel="canonical" href={`https://loopstore.in/product/${product.productId}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${product.name} | LOOP`} />
        <meta property="og:description" content={`Buy ${product.name} at LOOP. ₹${product.price}. Free delivery on orders above ₹999.`} />
        <meta property="og:image" content={product.image || product.images?.[0] || ''} />
        <meta property="og:url" content={`https://loopstore.in/product/${product.productId}`} />
        <meta property="og:type" content="product" />
        <meta property="og:price:amount" content={hasSale ? product.salePrice : product.price} />
        <meta property="og:price:currency" content="INR" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | LOOP`} />
        <meta name="twitter:description" content={`Buy ${product.name} at LOOP. ₹${product.price}.`} />
        <meta name="twitter:image" content={product.image || product.images?.[0] || ''} />
        
        {/* ✅ Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>

      {/* Toast Notification */}
      <motion.div 
        className={`toast-notification ${showToast ? 'show' : ''} ${toastType}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showToast ? 1 : 0, y: showToast ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        {toastMessage}
      </motion.div>

      {/* ✅ WhatsApp Floating Button */}
      {whatsappNumber && (
        <motion.button
          className="whatsapp-float-btn"
          onClick={openWhatsApp}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Chat with us on WhatsApp"
        >
          💬
        </motion.button>
      )}

      {/* Review Modal */}
      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        productId={product._id}
        productName={product.name}
        orderId={reviewOrderId}
        orderItemId={reviewOrderItemId}
        onReviewSubmitted={() => {
          fetchReviews();
          checkCanReview();
        }}
      />

      <div className="container">
        {/* Breadcrumb */}
        <motion.div 
          className="breadcrumb"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/">Home</Link>
          <span>›</span>
          <span className="current">{product.name}</span>
        </motion.div>

        <motion.div 
          className="product-layout"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Left Column - Media */}
          <motion.div 
            className="product-images-section"
            variants={fadeInUp}
          >
            <div 
              className="main-image"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              ref={imageRef}
              onClick={() => openFullscreen(currentMediaIndex)}
            >
              <MediaRenderer 
                media={allMedia[currentMediaIndex] || allMedia[0]} 
                className="product-media"
              />
              
              {/* Media type badge */}
              {allMedia[currentMediaIndex] && (
                <div className="media-type-badge">
                  {isVideoUrl(allMedia[currentMediaIndex]) ? '🎬 Video' : '📸 Image'}
                </div>
              )}
              
              {hasSale && <span className="sale-badge-big">-{discountPercent}%</span>}
              
              <motion.button 
                className={`wishlist-btn-image ${isInWishlist ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlistWithHeart(product._id, e);
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
              >
                {isInWishlist ? '❤️' : '🤍'}
              </motion.button>
              
              <div className="image-counter">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
              
              {showSwipeHint && allMedia.length > 1 && (
                <div className="swipe-hint">
                  ← Swipe to browse →
                </div>
              )}
              
              <div className="swipe-dots">
                {allMedia.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="thumbnail-list">
              {allMedia.map((media, index) => {
                const isVideo = isVideoUrl(media);
                const isActive = currentMediaIndex === index;
                
                return (
                  <div
                    key={index}
                    className={`thumbnail-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentMediaIndex(index);
                      if (!isVideo) {
                        setSelectedImage(media);
                      }
                    }}
                  >
                    {isVideo ? (
                      <>
                        {media.includes('youtube.com') ? (
                          <img 
                            src={`https://img.youtube.com/vi/${media.split('v=')[1]?.split('&')[0] || ''}/mqdefault.jpg`}
                            alt={`Video ${index + 1}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : media.includes('youtu.be') ? (
                          <img 
                            src={`https://img.youtube.com/vi/${media.split('/').pop().split('?')[0]}/mqdefault.jpg`}
                            alt={`Video ${index + 1}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#222',
                            fontSize: '24px'
                          }}>
                            🎬
                          </div>
                        )}
                        <span className="video-badge">▶</span>
                      </>
                    ) : (
                      <img src={media} alt={`Media ${index + 1}`} />
                    )}
                    <span className="media-index">{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column - Product Details */}
          <motion.div 
            className="product-details-section"
            variants={fadeInUp}
          >
            <h1 className="product-title">{product.name}</h1>
            <p className="product-id">Product ID: {product.productId || 'N/A'}</p>

            {/* Items Sold Counter */}
            <div className="product-sold-counter">
              <span className="sold-icon">📦</span>
              <span className="sold-text">{totalSold} items sold</span>
            </div>

            {/* Rating */}
            <div className="product-rating">
              <RatingStars rating={reviewStats.average} totalReviews={reviewStats.total} />
            </div>

            <div className="product-price">
              {hasSale ? (
                <>
                  <span className="original-price">₹{product.price}</span>
                  <span className="sale-price">₹{product.salePrice}</span>
                  <span className="discount-badge">Save {discountPercent}%</span>
                </>
              ) : (
                <span className="regular-price">₹{product.price}</span>
              )}
              {variantDetails.price > 0 && product.salePrice && (
                <span className="variant-price-note">+ ₹{variantDetails.price} for selected variants</span>
              )}
            </div>

            {/* Stock Warning */}
            <StockWarning stock={variantDetails.stock || product.stock} />

            {/* Dynamic Variants - Only show if variants exist */}
            {product.variants && product.variants.length > 0 ? (
              <div className="dynamic-variant-section">
                {product.variants.map((variant, vIndex) => (
                  <div key={vIndex} className="dynamic-variant-section">
                    <label>{variant.name || variant.type}:</label>
                    <div className="dynamic-variant-options">
                      {variant.options.map((option, oIndex) => {
                        const isSelected = selectedVariant[variant.type || variant.name] === option.value;
                        const isOutOfStock = (option.stock || 0) === 0;
                        const priceDiff = option.price || 0;
                        
                        return (
                          <button
                            key={oIndex}
                            className={`dynamic-variant-btn ${isSelected ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                            onClick={() => {
                              if (!isOutOfStock) {
                                handleVariantSelect(variant.type || variant.name, option.value);
                              }
                            }}
                            disabled={isOutOfStock}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {option.value}
                            {priceDiff > 0 && (
                              <span className="variant-price">+₹{priceDiff}</span>
                            )}
                            {option.stock !== undefined && option.stock <= 10 && option.stock > 0 && (
                              <span className="variant-stock-badge">⚡{option.stock}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Stock info for selected variant */}
                    {selectedVariant[variant.type || variant.name] && (
                      <div className="variant-stock-info">
                        {variant.options.find(o => o.value === selectedVariant[variant.type || variant.name])?.stock > 0 ? (
                          variant.options.find(o => o.value === selectedVariant[variant.type || variant.name])?.stock <= 10 ? (
                            <span className="low-stock">⚡ Only {variant.options.find(o => o.value === selectedVariant[variant.type || variant.name])?.stock} left!</span>
                          ) : (
                            <span className="in-stock">✅ In Stock</span>
                          )
                        ) : (
                          <span className="out-of-stock">❌ Out of Stock</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // No variants - show simple stock
              <div className="variant-stock-info">
                {product.stock > 0 ? (
                  product.stock <= 10 ? (
                    <span className="low-stock">⚡ Only {product.stock} left!</span>
                  ) : (
                    <span className="in-stock">✅ In Stock</span>
                  )
                ) : (
                  <span className="out-of-stock">❌ Out of Stock</span>
                )}
              </div>
            )}

            <div className="quantity-section">
              <label>Quantity:</label>
              <div className="quantity-control">
                <motion.button onClick={() => handleQuantityChange(displayQuantity - 1)} whileTap={{ scale: 0.8 }}>−</motion.button>
                <span>{displayQuantity}</span>
                <motion.button onClick={() => handleQuantityChange(displayQuantity + 1)} whileTap={{ scale: 0.8 }}>+</motion.button>
              </div>
              {isInCart && (
                <span className="cart-quantity-indicator">
                  🛒 {cartQuantity} in cart
                </span>
              )}
            </div>

            <div className="action-buttons-main">
              <motion.button 
                className="add-to-cart-btn" 
                onClick={(e) => {
                  createRipple(e);
                  handleAddToCart();
                }}
                disabled={isVariantOutOfStock || product.stock === 0}
                style={{ opacity: (isVariantOutOfStock || product.stock === 0) ? '0.5' : '1' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="btn-content">
                  <span className="btn-icon">🛒</span>
                  {isVariantOutOfStock || product.stock === 0 ? 'Out of Stock' : (isInCart ? '🔄 Update Cart' : 'Add to Cart')}
                </span>
              </motion.button>
              <motion.button 
                className="buy-now-btn" 
                onClick={handleBuyNow}
                disabled={isVariantOutOfStock || product.stock === 0}
                style={{ opacity: (isVariantOutOfStock || product.stock === 0) ? '0.5' : '1' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                Buy Now
              </motion.button>
            </div>

            <div className="action-buttons-secondary">
              <motion.button 
                className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
                onClick={(e) => toggleWishlistWithHeart(product._id, e)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isInWishlist ? '❤️' : '🤍'} Wishlist
              </motion.button>
              <motion.button 
                className="share-btn" 
                onClick={shareProduct}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📤 Share
              </motion.button>
            </div>

            <div className="delivery-info">
              <p>🚚 Free delivery on orders above ₹999</p>
              <p>🔄 14-day return policy</p>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description || 'Premium quality product.'}</p>
            </div>

            {/* Product Specs - Dynamic */}
            <div className="product-specs">
              <h3>Product Details</h3>
              <table>
                <tbody>
                  <tr><td>Product ID</td><td>{product.productId || 'N/A'}</td></tr>
                  <tr><td>Category</td><td>
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map(cat => cat.name || cat).join(', ')
                    ) : (
                      product.category || 'Uncategorized'
                    )}
                  </td></tr>
                  <tr><td>Color</td><td>{selectedColor || product.color || 'Black'}</td></tr>
                  {product.variants && product.variants.some(v => v.type === 'Size' || v.name === 'Size') && (
                    <tr><td>Size</td><td>{selectedSize || product.size || 'M'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
              <div className="reviews-header">
                <h3>Customer Reviews</h3>
                <div className="reviews-summary">
                  <RatingStars rating={reviewStats.average} totalReviews={reviewStats.total} />
                </div>
              </div>

              {canReview ? (
                <motion.button 
                  className="write-review-btn"
                  onClick={() => setShowReviewModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✏️ Write a Review
                </motion.button>
              ) : reviewLoading ? (
                <p className="review-loading">Checking review eligibility...</p>
              ) : (
                <p className="no-reviews">
                  {localStorage.getItem('loop_token') 
                    ? 'You can review this product after purchasing it.' 
                    : 'Login to write a review.'}
                </p>
              )}

              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.slice(0, 5).map(review => (
                    <motion.div 
                      key={review._id} 
                      className="review-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="review-header">
                        <div className="review-user">
                          <span className="review-avatar">
                            {review.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                          <span className="review-name">{review.userId?.name || 'Anonymous'}</span>
                          {review.isVerified && (
                            <span className="review-verified">✅ Verified Purchase</span>
                          )}
                        </div>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <RatingStars rating={review.rating} showCount={false} size="small" />
                      {review.title && <p className="review-title">{review.title}</p>}
                      <p className="review-comment">{review.comment}</p>
                    </motion.div>
                  ))
                )}
                {reviews.length > 5 && (
                  <button className="view-all-reviews">View all {reviews.length} reviews</button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {similarProducts.length > 0 && (
          <motion.div 
            className="similar-products"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3>Similar Products</h3>
            <motion.div 
              className="similar-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {similarProducts.map(p => (
                <motion.div
                  key={p._id}
                  variants={fadeInUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/product/${p.productId || p.name.toLowerCase().replace(/ /g, '-')}`} className="similar-card">
                    <img src={p.image || 'https://via.placeholder.com/150x150?text=LOOP'} alt={p.name} />
                    <p className="similar-name">{p.name}</p>
                    <p className="similar-price">₹{p.price}</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <motion.div 
          className="fullscreen-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onTouchStart={handleModalTouchStart}
          onTouchMove={handleModalTouchMove}
          onTouchEnd={handleModalTouchEnd}
          ref={modalRef}
        >
          <motion.button 
            className="modal-close" 
            onClick={closeFullscreen}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            ✕
          </motion.button>
          
          <div className="modal-image-container">
            <MediaRenderer 
              media={allMedia[fullscreenIndex] || allMedia[0]} 
              className="modal-media"
              isFullscreen={true}
            />
            
            {allMedia.length > 1 && (
              <>
                <motion.button 
                  className="modal-arrow modal-arrow-left"
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ◀
                </motion.button>
                <motion.button 
                  className="modal-arrow modal-arrow-right"
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ▶
                </motion.button>
              </>
            )}
            
            <div className="modal-image-counter">
              {fullscreenIndex + 1} / {allMedia.length}
              {allMedia[fullscreenIndex] && 
                ` - ${isVideoUrl(allMedia[fullscreenIndex]) ? '🎬 Video' : '📸 Image'}`
              }
            </div>
            
            <div className="modal-swipe-hint">
              ↓ Swipe down to close
              {!isVideoUrl(allMedia[fullscreenIndex]) && ' | Pinch to zoom'}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ProductPage;