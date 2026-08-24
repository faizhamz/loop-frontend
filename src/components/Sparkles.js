import React, { useState, useEffect } from 'react';

function Sparkles() {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const size = Math.random() * 12 + 8;
      const duration = Math.random() * 2000 + 1500;
      const colors = ['#FFB7C5', '#D4A5FF', '#B5EAD7', '#D4AF37', '#A8D8EA'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      setSparkles(prev => [
        ...prev.slice(-20),
        { id: Date.now() + Math.random(), x, y, size, duration, color }
      ]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sparkles-container" style={{ 
      position: 'fixed', 
      inset: 0, 
      pointerEvents: 'none', 
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {sparkles.map(s => (
        <div
          key={s.id}
          className="sparkle"
          style={{
            left: s.x,
            top: s.y,
            fontSize: s.size,
            color: s.color,
            animationDuration: `${s.duration}ms`
          }}
        >
          ✦
        </div>
      ))}
    </div>
  );
}

export default Sparkles;