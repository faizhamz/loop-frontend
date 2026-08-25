import React, { useState, useEffect } from 'react';
import Tilt from 'react-tilt';
import { motion, useMotionValue, useTransform } from 'framer-motion';

function Hero3D() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ beta: 0, gamma: 0 });

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Gyroscope support for mobile (device tilt)
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientation = (event) => {
      const beta = event.beta || 0;  // -180 to 180 (front-back tilt)
      const gamma = event.gamma || 0; // -90 to 90 (left-right tilt)
      
      // Map to rotation values (limited range for smoothness)
      const mappedBeta = Math.max(-15, Math.min(15, beta / 6));
      const mappedGamma = Math.max(-15, Math.min(15, gamma / 6));
      
      setDeviceOrientation({ beta: mappedBeta, gamma: mappedGamma });
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile]);

  const handleMouseMove = (e) => {
    if (isMobile) return; // Skip mouse events on mobile
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  // ✅ For mobile: use gyroscope values
  const rotateX = useTransform(mouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [-1, 1], [-15, 15]);
  const scale = useTransform(mouseX, [-1, 1], [1.02, 1.02]);

  // ✅ Mobile-specific values
  const mobileRotateX = deviceOrientation.beta || 0;
  const mobileRotateY = deviceOrientation.gamma || 0;

  return (
    <motion.div
      className="hero-3d-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // ✅ Touch support for mobile
      onTouchStart={() => {
        // Subtle animation on touch
      }}
      style={{
        perspective: 1200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        cursor: 'pointer',
        touchAction: 'none', // Prevent scroll interference
      }}
    >
      <Tilt
        options={{
          max: isMobile ? 8 : 12, // ✅ Less tilt on mobile
          scale: isMobile ? 1.02 : 1.05, // ✅ Less scale on mobile
          speed: 400,
          glare: !isMobile, // ✅ Disable glare on mobile for performance
          'max-glare': 0.2,
          perspective: 1000,
        }}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <motion.div
          style={{
            rotateX: isMobile ? mobileRotateX : rotateX,
            rotateY: isMobile ? mobileRotateY : rotateY,
            scale: isMobile ? 1 : scale,
            transition: isMobile 
              ? 'all 0.3s ease-out' 
              : 'all 0.1s ease-out',
            transformStyle: 'preserve-3d',
          }}
          // ✅ Tap animation for mobile
          whileTap={isMobile ? { scale: 0.95 } : {}}
        >
          <div className="hero-logo-big">
            <span className="hero-l-big hero-letter">L</span>
            <span className="hero-infinity-big hero-letter">∞</span>
            <span className="hero-p-big hero-letter">P</span>
          </div>
        </motion.div>
      </Tilt>
    </motion.div>
  );
}

export default Hero3D;