import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1 && !isPaused) {
      const speed = banners[currentIndex]?.autoplaySpeed || 5000;
      timerRef.current = setTimeout(() => {
        goToNext();
      }, speed);
    }
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, banners, isPaused]);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/banners/active`);
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  // ✅ Track banner click for analytics
  const trackBannerClick = async (bannerId) => {
    try {
      const visitorId = localStorage.getItem('loop_visitor_id') || 
                       sessionStorage.getItem('loop_session_id');
      
      // Check if already clicked this banner
      const clickedBanners = JSON.parse(localStorage.getItem('clicked_banners') || '[]');
      if (!clickedBanners.includes(bannerId)) {
        clickedBanners.push(bannerId);
        localStorage.setItem('clicked_banners', JSON.stringify(clickedBanners));
        
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
        
        await axios.post(`${API_URL}/api/analytics/track/banner-click`, {
          bannerId: bannerId,
          visitorId: visitorId || 'unknown',
          userId: userId
        });
        console.log('📊 Banner click tracked:', bannerId);
      }
    } catch (err) {
      console.error('Error tracking banner click:', err);
    }
  };

  const handleBannerClick = async (banner) => {
    // ✅ Track click
    await trackBannerClick(banner._id);

    // Track click via existing endpoint
    try {
      await axios.post(`${API_URL}/api/banners/${banner._id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Navigate based on link type
    let url = '';
    switch (banner.linkType) {
      case 'product':
        url = `/product/${banner.linkValue}`;
        break;
      case 'category':
        url = `/shop?category=${banner.linkValue}`;
        break;
      case 'tag':
        url = `/shop?tag=${banner.linkValue}`;
        break;
      case 'custom':
        url = banner.linkValue;
        break;
      case 'external':
        window.open(banner.linkValue, '_blank');
        return;
      default:
        url = '/';
    }
    navigate(url);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Track impressions when banner is viewed
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      const trackImpression = async () => {
        try {
          await axios.post(`${API_URL}/api/banners/${banners[currentIndex]._id}/impression`);
        } catch (error) {
          console.error('Error tracking impression:', error);
        }
      };
      trackImpression();
    }
  }, [currentIndex, banners]);

  if (loading) return null;
  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const typeColors = {
    'flash-sale': '#ff4444',
    'new-launch': '#28a745',
    'festival-sale': '#D4AF37',
    'bank-offer': '#0066FF',
    'clearance': '#EF4444',
    'featured': '#8B5CF6',
    'custom': '#888'
  };
  const typeColor = typeColors[currentBanner.bannerType] || '#888';

  return (
    <div 
      className="banner-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          className="banner-slide"
          onClick={() => handleBannerClick(currentBanner)}
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img 
            src={currentBanner.image} 
            alt={currentBanner.title}
            className="banner-image"
            loading="lazy"
          />
          
          {/* Banner Content Overlay */}
          <motion.div 
            className="banner-overlay" 
            style={{ borderLeft: `4px solid ${typeColor}` }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="banner-type-badge" 
              style={{ background: typeColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {currentBanner.bannerType.replace('-', ' ').toUpperCase()}
            </motion.div>
            <motion.h2 
              className="banner-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {currentBanner.title}
            </motion.h2>
            {currentBanner.description && (
              <motion.p 
                className="banner-description"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                {currentBanner.description}
              </motion.p>
            )}
            {currentBanner.endDate && new Date(currentBanner.endDate) > new Date() && (
              <motion.div 
                className="banner-timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                ⏱️ {currentBanner.timeRemaining || 'Ending soon'} left
              </motion.div>
            )}
            <motion.button 
              className="banner-cta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Shop Now →
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <motion.button 
            className="banner-arrow banner-arrow-left"
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            aria-label="Previous banner"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ◀
          </motion.button>
          <motion.button 
            className="banner-arrow banner-arrow-right"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            aria-label="Next banner"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ▶
          </motion.button>
        </>
      )}
    </div>
  );
}

export default BannerCarousel;