import React, { useState, useEffect } from 'react';

function CartIcon({ itemCount, onClick, isAnimating }) {
  const [showParticles, setShowParticles] = useState(false);
  const [count, setCount] = useState(itemCount);

  useEffect(() => {
    if (isAnimating) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 800);
    }
  }, [isAnimating]);

  useEffect(() => {
    setCount(itemCount);
  }, [itemCount]);

  return (
    <div className="cart-icon-wrapper" onClick={onClick}>
      {/* Cart SVG Icon */}
      <svg 
        className={`cart-svg ${isAnimating ? 'cart-bounce' : ''}`}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>

      {/* Count Badge */}
      {count > 0 && (
        <span className={`cart-count-badge ${isAnimating ? 'cart-pop' : ''}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Floating Particles */}
      {showParticles && (
        <>
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="cart-particles"
              style={{
                '--tx': `${(Math.random() - 0.5) * 80}px`,
                '--ty': `${-60 - Math.random() * 60}px`,
                left: `${40 + Math.random() * 20}%`,
                top: '50%',
                fontSize: `${14 + Math.random() * 10}px`,
                animationDelay: `${Math.random() * 0.2}s`
              }}
            >
              {['🛒', '✨', '⭐', '💫', '🎉', '🔥'][i]}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export default CartIcon;