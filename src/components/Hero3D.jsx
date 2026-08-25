import React from 'react';
import Tilt from 'react-tilt';
import { motion, useMotionValue, useTransform } from 'framer-motion';

function Hero3D() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [-1, 1], [-15, 15]);
  const scale = useTransform(mouseX, [-1, 1], [1.02, 1.02]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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
      }}
    >
      <Tilt
        options={{
          max: 12,
          scale: 1.05,
          speed: 400,
          glare: true,
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
            rotateX: rotateX,
            rotateY: rotateY,
            scale: scale,
            transition: 'all 0.1s ease-out',
            transformStyle: 'preserve-3d',
          }}
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