import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function GlobalToast({ show, message, type, onHide }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const colors = {
    success: '#28a745',
    error: '#ff4444',
    info: '#D4AF37',
    warning: '#ff8800'
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className={`global-toast ${type}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{ borderLeft: `4px solid ${colors[type]}` }}
        >
          <span className="toast-icon">{icons[type]}</span>
          <span className="toast-message">{message}</span>
          <button className="toast-close" onClick={onHide}>✕</button>
          <div className="toast-progress" style={{ background: colors[type] }}></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GlobalToast;