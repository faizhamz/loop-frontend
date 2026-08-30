import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import RatingStars from '../components/RatingStars';
import ReviewModal from '../components/ReviewModal';
import StockWarning, { VariantStockWarning } from '../components/StockWarning';
import WhatsAppIcon from '../components/WhatsAppIcon';
import FAQSection from '../components/FAQSection';
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
  const { isDarkMode, user } = useApp();
  
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

  // Theme-based styles
  const themeStyles = {
    background: isDarkMode ? '#0a0a0a' : '#f8f4f9',
    color: isDarkMode ? '#ffffff' : '#2d1b2e',
    cardBg: isDarkMode ? '#111111' : '#ffffff',
    cardBorder: isDarkMode ? '#333333' : '#e8e0e5',
    textSecondary: isDarkMode ? '#888888' : '#666666',
    textMuted: isDarkMode ? '#555555' : '#999999',
    inputBg: isDarkMode ? '#222222' : '#ffffff',
    inputBorder: isDarkMode ? '#333333' : '#e8e0e5',
    shadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.08)',
    shadowHover: isDarkMode ? '0 12px 50px rgba(0,0,0,0.4)' : '0 12px 50px rgba(0,0,0,0.12)',
  };

  // Fetch WhatsApp number
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
  const availableStock = variantDetails.stock || product?.stock || 0;

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

  // ✅ Updated: Handle quantity change with stock limit
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      if (product && isInCart) {
        removeFromCart(product._id);
        showToastMessage(`🗑️ Removed from cart`, 'info');
        setQuantity(1);
      }
      return;
    }
    
    // ✅ Check stock limit
    if (newQuantity > availableStock) {
      showToastMessage(`⚠️ Only ${availableStock} items available in stock!`, 'warning');
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

    // ✅ Check stock before adding
    if (quantity > availableStock) {
      showToastMessage(`⚠️ Only ${availableStock} items available!`, 'warning');
      return;
    }

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

    // ✅ Check stock before buying
    if (quantity > availableStock) {
      showToastMessage(`⚠️ Only ${availableStock} items available!`, 'warning');
      return;
    }

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
        style={{ background: themeStyles.background, color: themeStyles.color }}
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
        style={{ background: themeStyles.background, color: themeStyles.color }}
      >
        <h2 style={{ color: '#ff4444' }}>Product Not Found</h2>
        <p style={{ color: themeStyles.textSecondary }}>{error || 'Sorry, we couldn\'t find this product.'}</p>
        <Link to="/" className="back-home" style={{ color: '#D4AF37' }}>Back to Home</Link>
      </motion.div>
    );
  }

  // Calculate product data
  const hasSale = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const isInWishlist = wishlist.includes(product._id);
  const displayQuantity = isInCart ? cartQuantity : quantity;
  const totalSold = product.totalSold || 0;

  // Get unique sizes and colors from variants
  const uniqueSizes = product.variants && product.variants.length > 0 
    ? product.variants.find(v => v.type === 'Size' || v.name === 'Size')?.options.map(o => o.value) || []
    : [product.size || 'M'];
  
  const uniqueColors = product.variants && product.variants.length > 0 
    ? product.variants.find(v => v.type === 'Color' || v.name === 'Color')?.options.map(o => o.value) || []
    : [product.color || 'Black'];

  // Schema.org JSON-LD
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

  if (product.avgRating > 0 && product.reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating,
      "reviewCount": product.reviewCount
    };
  }

  return (
    <div 
      className="product-page" 
      style={{ 
        background: themeStyles.background,
        color: themeStyles.color,
        minHeight: '100vh',
        paddingTop: '80px'
      }}
    >
      <Helmet>
        <title>{product.name} | LOOP - Premium Fashion</title>
        <meta name="description" content={`Buy ${product.name} online at LOOP. ₹${product.price}. ${product.description?.slice(0, 150) || 'Premium quality product with free delivery on orders above ₹999.'}`} />
        <meta name="keywords" content={`${product.name}, loop, fashion, ${product.category}, ${product.color || ''}, ${product.size || ''}, clothing`} />
        <link rel="canonical" href={`https://loopstore.in/product/${product.productId}`} />
        <meta property="og:title" content={`${product.name} | LOOP`} />
        <meta property="og:description" content={`Buy ${product.name} at LOOP. ₹${product.price}. Free delivery on orders above ₹999.`} />
        <meta property="og:image" content={product.image || product.images?.[0] || ''} />
        <meta property="og:url" content={`https://loopstore.in/product/${product.productId}`} />
        <meta property="og:type" content="product" />
        <meta property="og:price:amount" content={hasSale ? product.salePrice : product.price} />
        <meta property="og:price:currency" content="INR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | LOOP`} />
        <meta name="twitter:description" content={`Buy ${product.name} at LOOP. ₹${product.price}.`} />
        <meta name="twitter:image" content={product.image || product.images?.[0] || ''} />
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
        style={{ 
          background: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
          color: themeStyles.color,
          borderColor: themeStyles.cardBorder
        }}
      >
        {toastMessage}
      </motion.div>

      {/* WhatsApp Floating Button */}
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
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#25D366',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WhatsAppIcon size={32} color="#ffffff" />
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

      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
        {/* Breadcrumb */}
        <motion.div 
          className="breadcrumb"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: themeStyles.textMuted }}
        >
          <Link to="/" style={{ color: '#D4AF37' }}>Home</Link>
          <span style={{ color: themeStyles.textMuted }}>›</span>
          <span className="current" style={{ color: themeStyles.color }}>{product.name}</span>
        </motion.div>

        <motion.div 
          className="product-layout"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', padding: '20px 0 40px' }}
        >
          {/* Left Column - Media */}
          <motion.div 
            className="product-images-section"
            variants={fadeInUp}
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <div 
              className="main-image"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              ref={imageRef}
              onClick={() => openFullscreen(currentMediaIndex)}
              style={{ 
                position: 'relative',
                background: isDarkMode ? '#1a1a1a' : '#f0e8ed',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s ease'
              }}
            >
              <MediaRenderer 
                media={allMedia[currentMediaIndex] || allMedia[0]} 
                className="product-media"
              />
              
              {/* Media type badge */}
              {allMedia[currentMediaIndex] && (
                <div className="media-type-badge" style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  zIndex: 10,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {isVideoUrl(allMedia[currentMediaIndex]) ? '🎬 Video' : '📸 Image'}
                </div>
              )}
              
              {hasSale && (
                <span className="sale-badge-big" style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: '#ff4444',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  zIndex: 2
                }}>
                  -{discountPercent}%
                </span>
              )}
              
              <motion.button 
                className={`wishlist-btn-image ${isInWishlist ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlistWithHeart(product._id, e);
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '28px',
                  padding: '8px 12px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isInWishlist ? '❤️' : '🤍'}
              </motion.button>
              
              <div className="image-counter" style={{
                position: 'absolute',
                bottom: '60px',
                right: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                zIndex: 5,
                backdropFilter: 'blur(4px)'
              }}>
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
              
              {showSwipeHint && allMedia.length > 1 && (
                <div className="swipe-hint" style={{
                  position: 'absolute',
                  bottom: '100px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  zIndex: 5,
                  backdropFilter: 'blur(4px)',
                  animation: 'fadeInOut 5s ease-in-out forwards',
                  whiteSpace: 'nowrap'
                }}>
                  ← Swipe to browse →
                </div>
              )}
              
              <div className="swipe-dots" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5
              }}>
                {allMedia.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                    }}
                    style={{
                      width: index === currentMediaIndex ? '20px' : '8px',
                      height: '8px',
                      borderRadius: index === currentMediaIndex ? '4px' : '50%',
                      background: index === currentMediaIndex ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="thumbnail-list" style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              padding: '5px 0',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}>
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
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      border: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      width: '80px',
                      height: '80px',
                      background: isDarkMode ? '#1a1a1a' : '#f0e8ed',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.2)' : 'none'
                    }}
                  >
                    {isVideo ? (
                      <>
                        {media.includes('youtube.com') ? (
                          <img 
                            src={`https://img.youtube.com/vi/${media.split('v=')[1]?.split('&')[0] || ''}/mqdefault.jpg`}
                            alt={`Video ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : media.includes('youtu.be') ? (
                          <img 
                            src={`https://img.youtube.com/vi/${media.split('/').pop().split('?')[0]}/mqdefault.jpg`}
                            alt={`Video ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        <span className="video-badge" style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '32px',
                          color: '#fff',
                          textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                          pointerEvents: 'none',
                          zIndex: 3,
                          opacity: 0.9
                        }}>▶</span>
                      </>
                    ) : (
                      <img src={media} alt={`Media ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <span className="media-index" style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '1px 8px',
                      borderRadius: '10px',
                      backdropFilter: 'blur(4px)',
                      zIndex: 4
                    }}>
                      {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column - Product Details */}
          <motion.div 
            className="product-details-section"
            variants={fadeInUp}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h1 className="product-title" style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              margin: 0, 
              lineHeight: '1.2',
              color: themeStyles.color
            }}>
              {product.name}
            </h1>
            <p className="product-id" style={{ fontSize: '12px', color: themeStyles.textMuted }}>
              Product ID: {product.productId || 'N/A'}
            </p>

            {/* Items Sold Counter */}
            <div className="product-sold-counter" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <span className="sold-icon" style={{ fontSize: '16px' }}>📦</span>
              <span className="sold-text" style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>
                {totalSold} items sold
              </span>
            </div>

            {/* Rating */}
            <div className="product-rating" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RatingStars rating={reviewStats.average} totalReviews={reviewStats.total} />
            </div>

            <div className="product-price" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              fontSize: '24px', 
              padding: '10px 0' 
            }}>
              {hasSale ? (
                <>
                  <span className="original-price" style={{ textDecoration: 'line-through', color: themeStyles.textMuted, fontSize: '18px' }}>
                    ₹{product.price}
                  </span>
                  <span className="sale-price" style={{ color: '#ff4444', fontWeight: 'bold' }}>
                    ₹{product.salePrice}
                  </span>
                  <span className="discount-badge" style={{
                    background: '#ff4444',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Save {discountPercent}%
                  </span>
                </>
              ) : (
                <span className="regular-price" style={{ fontWeight: 'bold', color: themeStyles.color }}>
                  ₹{product.price}
                </span>
              )}
              {variantDetails.price > 0 && product.salePrice && (
                <span className="variant-price-note" style={{ fontSize: '14px', color: themeStyles.textMuted }}>
                  + ₹{variantDetails.price} for selected variants
                </span>
              )}
            </div>

            {/* ✅ Stock Warning - Updated */}
            <StockWarning stock={availableStock} />

            {/* ✅ Quantity with Stock Limit */}
            <div className="quantity-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: '500', fontSize: '14px', color: themeStyles.textSecondary }}>Quantity:</label>
              <div className="quantity-control" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                background: isDarkMode ? '#222' : '#f0e8ed',
                borderRadius: '8px',
                padding: '5px 15px',
                border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5'
              }}>
                <motion.button 
                  onClick={() => handleQuantityChange(displayQuantity - 1)} 
                  whileTap={{ scale: 0.8 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: themeStyles.color,
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '5px 10px',
                    transition: 'all 0.3s ease'
                  }}
                >−</motion.button>
                <span style={{ fontSize: '18px', minWidth: '30px', textAlign: 'center', fontWeight: '600', color: themeStyles.color }}>
                  {displayQuantity}
                </span>
                <motion.button 
                  onClick={() => handleQuantityChange(displayQuantity + 1)} 
                  whileTap={{ scale: 0.8 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: themeStyles.color,
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '5px 10px',
                    transition: 'all 0.3s ease',
                    opacity: displayQuantity >= availableStock ? 0.4 : 1,
                    cursor: displayQuantity >= availableStock ? 'not-allowed' : 'pointer'
                  }}
                  disabled={displayQuantity >= availableStock}
                >+</motion.button>
              </div>
              {availableStock > 0 && availableStock <= 10 && (
                <span style={{
                  fontSize: '13px',
                  color: '#ff8800',
                  fontWeight: '500'
                }}>
                  ⚡ Only {availableStock} left!
                </span>
              )}
              {availableStock === 0 && (
                <span style={{
                  fontSize: '13px',
                  color: '#ff4444',
                  fontWeight: '600'
                }}>
                  ❌ Out of Stock
                </span>
              )}
              {isInCart && (
                <span className="cart-quantity-indicator" style={{
                  fontSize: '13px',
                  color: '#D4AF37',
                  background: 'rgba(212, 175, 55, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  whiteSpace: 'nowrap'
                }}>
                  🛒 {cartQuantity} in cart
                </span>
              )}
            </div>

            <div className="action-buttons-main" style={{ display: 'flex', gap: '15px' }}>
              <motion.button 
                className="add-to-cart-btn" 
                onClick={(e) => {
                  createRipple(e);
                  handleAddToCart();
                }}
                disabled={availableStock === 0}
                style={{
                  flex: 2,
                  background: availableStock === 0 ? '#555' : '#D4AF37',
                  color: availableStock === 0 ? '#888' : '#000',
                  border: 'none',
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: availableStock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: availableStock === 0 ? 0.6 : 1
                }}
                whileHover={{ scale: availableStock === 0 ? 1 : 1.02 }}
                whileTap={{ scale: availableStock === 0 ? 1 : 0.95 }}
              >
                <span className="btn-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="btn-icon">🛒</span>
                  {availableStock === 0 ? 'Out of Stock' : (isInCart ? '🔄 Update Cart' : 'Add to Cart')}
                </span>
              </motion.button>
              <motion.button 
                className="buy-now-btn" 
                onClick={handleBuyNow}
                disabled={availableStock === 0}
                style={{
                  flex: 1,
                  background: availableStock === 0 ? '#333' : (themeStyles.color === '#ffffff' ? '#fff' : '#222'),
                  color: availableStock === 0 ? '#666' : (themeStyles.color === '#ffffff' ? '#000' : '#fff'),
                  border: 'none',
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: availableStock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  opacity: availableStock === 0 ? 0.5 : 1
                }}
                whileHover={{ scale: availableStock === 0 ? 1 : 1.02 }}
                whileTap={{ scale: availableStock === 0 ? 1 : 0.95 }}
              >
                Buy Now
              </motion.button>
            </div>

            <div className="action-buttons-secondary" style={{ display: 'flex', gap: '15px' }}>
              <motion.button 
                className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
                onClick={(e) => toggleWishlistWithHeart(product._id, e)}
                style={{
                  flex: 1,
                  background: isDarkMode ? '#222' : '#f0e8ed',
                  border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                  color: isInWishlist ? '#ff4444' : themeStyles.color,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isInWishlist ? '❤️' : '🤍'} Wishlist
              </motion.button>
              <motion.button 
                className="share-btn" 
                onClick={shareProduct}
                style={{
                  flex: 1,
                  background: isDarkMode ? '#222' : '#f0e8ed',
                  border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                  color: themeStyles.color,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📤 Share
              </motion.button>
            </div>

            <div className="delivery-info" style={{
              background: isDarkMode ? '#111' : '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              border: isDarkMode ? '1px solid #222' : '1px solid #e8e0e5'
            }}>
              <p style={{ margin: '4px 0', fontSize: '14px', color: themeStyles.textSecondary }}>🚚 Free delivery on orders above ₹999</p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: themeStyles.textSecondary }}>🔄 14-day return policy</p>
            </div>

            <div className="product-description" style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#D4AF37' }}>Description</h3>
              <p style={{ color: themeStyles.textSecondary, lineHeight: '1.6' }}>
                {product.description || 'Premium quality product.'}
              </p>
            </div>

            {/* ✅ FAQ Section */}
            {product.faqs && product.faqs.length > 0 && (
              <FAQSection faqs={product.faqs} isDarkMode={isDarkMode} />
            )}

            {/* Product Specs */}
            <div className="product-specs" style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#D4AF37' }}>Product Details</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.textMuted, width: '40%' }}>
                      Product ID
                    </td>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.color }}>
                      {product.productId || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.textMuted }}>
                      Category
                    </td>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.color }}>
                      {product.categories && product.categories.length > 0 ? (
                        product.categories.map(cat => cat.name || cat).join(', ')
                      ) : (
                        product.category || 'Uncategorized'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.textMuted }}>
                      Color
                    </td>
                    <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.color }}>
                      {selectedColor || product.color || 'Black'}
                    </td>
                  </tr>
                  {product.variants && product.variants.some(v => v.type === 'Size' || v.name === 'Size') && (
                    <tr>
                      <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.textMuted }}>
                        Size
                      </td>
                      <td style={{ padding: '8px 0', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5', color: themeStyles.color }}>
                        {selectedSize || product.size || 'M'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5' }}>
              <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#D4AF37' }}>Customer Reviews</h3>
                <div className="reviews-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RatingStars rating={reviewStats.average} totalReviews={reviewStats.total} />
                </div>
              </div>

              {canReview ? (
                <motion.button 
                  className="write-review-btn"
                  onClick={() => setShowReviewModal(true)}
                  style={{
                    background: isDarkMode ? '#222' : '#f0e8ed',
                    border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                    color: themeStyles.color,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✏️ Write a Review
                </motion.button>
              ) : reviewLoading ? (
                <p className="review-loading" style={{ color: themeStyles.textMuted, fontSize: '14px' }}>
                  Checking review eligibility...
                </p>
              ) : (
                <p className="no-reviews" style={{ color: themeStyles.textMuted, fontSize: '14px' }}>
                  {localStorage.getItem('loop_token') 
                    ? 'You can review this product after purchasing it.' 
                    : 'Login to write a review.'}
                </p>
              )}

              <div className="reviews-list" style={{ marginTop: '16px' }}>
                {reviews.length === 0 ? (
                  <p className="no-reviews" style={{ color: themeStyles.textMuted, fontSize: '14px' }}>
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  reviews.slice(0, 5).map(review => (
                    <motion.div 
                      key={review._id} 
                      className="review-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ x: 4 }}
                      style={{
                        background: isDarkMode ? '#111' : '#fff',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        marginBottom: '12px',
                        border: isDarkMode ? '1px solid #222' : '1px solid #e8e0e5',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <div className="review-user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="review-avatar" style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#D4AF37',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {review.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                          <span className="review-name" style={{ fontWeight: '500', fontSize: '14px', color: themeStyles.color }}>
                            {review.userId?.name || 'Anonymous'}
                          </span>
                          {review.isVerified && (
                            <span className="review-verified" style={{
                              color: '#28a745',
                              fontSize: '11px',
                              background: 'rgba(40, 167, 69, 0.1)',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              ✅ Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="review-date" style={{ color: themeStyles.textMuted, fontSize: '12px' }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <RatingStars rating={review.rating} showCount={false} size="small" />
                      {review.title && <p className="review-title" style={{ fontWeight: '600', fontSize: '14px', margin: '4px 0', color: themeStyles.color }}>
                        {review.title}
                      </p>}
                      <p className="review-comment" style={{ color: themeStyles.textSecondary, fontSize: '14px', lineHeight: '1.5', margin: '4px 0 0' }}>
                        {review.comment}
                      </p>
                    </motion.div>
                  ))
                )}
                {reviews.length > 5 && (
                  <button className="view-all-reviews" style={{
                    background: 'none',
                    border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                    color: '#D4AF37',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginTop: '10px'
                  }}>
                    View all {reviews.length} reviews
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <motion.div 
            className="similar-products"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ padding: '40px 0 60px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5' }}
          >
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: '#D4AF37' }}>Similar Products</h3>
            <motion.div 
              className="similar-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}
            >
              {similarProducts.map(p => (
                <motion.div
                  key={p._id}
                  variants={fadeInUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link 
                    to={`/product/${p.productId || p.name.toLowerCase().replace(/ /g, '-')}`} 
                    className="similar-card"
                    style={{
                      background: isDarkMode ? '#111' : '#fff',
                      borderRadius: '8px',
                      padding: '15px',
                      textAlign: 'center',
                      border: isDarkMode ? '1px solid #222' : '1px solid #e8e0e5',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      textDecoration: 'none',
                      color: themeStyles.color,
                      cursor: 'pointer',
                      display: 'block'
                    }}
                  >
                    <img 
                      src={p.image || 'https://via.placeholder.com/150x150?text=LOOP'} 
                      alt={p.name} 
                      style={{ 
                        width: '100%', 
                        height: '180px', 
                        objectFit: 'cover', 
                        borderRadius: '4px',
                        transition: 'transform 0.4s ease'
                      }}
                    />
                    <p className="similar-name" style={{ margin: '10px 0 5px', fontSize: '14px', fontWeight: '500', color: themeStyles.color }}>
                      {p.name}
                    </p>
                    <p className="similar-price" style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'bold' }}>
                      ₹{p.price}
                    </p>
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.button 
            className="modal-close" 
            onClick={closeFullscreen}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: '28px',
              padding: '10px 18px',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(4px)'
            }}
          >
            ✕
          </motion.button>
          
          <div className="modal-image-container" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
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
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '36px',
                    padding: '20px 15px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(4px)',
                    left: '20px',
                    opacity: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  ◀
                </motion.button>
                <motion.button 
                  className="modal-arrow modal-arrow-right"
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '36px',
                    padding: '20px 15px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(4px)',
                    right: '20px',
                    opacity: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  ▶
                </motion.button>
              </>
            )}
            
            <div className="modal-image-counter" style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '6px 18px',
              borderRadius: '20px',
              fontSize: '14px',
              zIndex: 10,
              backdropFilter: 'blur(4px)'
            }}>
              {fullscreenIndex + 1} / {allMedia.length}
              {allMedia[fullscreenIndex] && 
                ` - ${isVideoUrl(allMedia[fullscreenIndex]) ? '🎬 Video' : '📸 Image'}`}
            </div>
            
            <div className="modal-swipe-hint" style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              zIndex: 5,
              animation: 'pulseHint 2s ease-in-out infinite'
            }}>
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