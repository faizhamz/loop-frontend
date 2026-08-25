import React, { useState, useEffect } from 'react';
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

  // ✅ Gyroscope support for mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientation = (event) => {
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;
      
      const mappedBeta = Math.max(-15, Math.min(15, beta / 6));
      const mappedGamma = Math.max(-15, Math.min(15, gamma / 6));
      
      setDeviceOrientation({ beta: mappedBeta, gamma: mappedGamma });
    };

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
    if (isMobile) return;
    
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

  const rotateX = useTransform(mouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [-1, 1], [-15, 15]);
  const scale = useTransform(mouseX, [-1, 1], [1.02, 1.02]);

  const mobileRotateX = deviceOrientation.beta || 0;
  const mobileRotateY = deviceOrientation.gamma || 0;

  return (
    <motion.div
      className="hero-3d-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        cursor: 'pointer',
        touchAction: 'none',
      }}
    >
      <Tilt
        options={{
          max: isMobile ? 8 : 12,
          scale: isMobile ? 1.02 : 1.05,
          speed: 400,
          glare: !isMobile,
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