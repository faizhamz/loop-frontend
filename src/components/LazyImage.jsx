import React, { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt, className, style, placeholder = 'https://via.placeholder.com/300x300?text=LOOP' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = imgRef.current;
          if (img) {
            img.src = src;
            observerRef.current?.disconnect();
          }
        }
      });
    }, { rootMargin: '50px' });

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <img
      ref={imgRef}
      data-src={src}
      alt={alt || 'Product'}
      className={`${className || ''} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
        ...(hasError && { display: 'none' })
      }}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}

export default LazyImage;