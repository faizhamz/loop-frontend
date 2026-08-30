import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function FAQSection({ faqs, isDarkMode }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!faqs || faqs.length === 0) return null;

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="faq-section" style={{
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5'
    }}>
      <h3 style={{
        fontSize: '16px',
        marginBottom: '16px',
        color: '#D4AF37',
        fontFamily: 'Nunito, sans-serif'
      }}>
        ❓ Frequently Asked Questions
      </h3>

      <div className="faq-list" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {faqs.map((faq, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <motion.div
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: isDarkMode ? '#1a1a1a' : '#f8f4f9',
                borderRadius: '12px',
                border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  color: isDarkMode ? '#fff' : '#2d1b2e',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ flex: 1 }}>
                  <span style={{ color: '#D4AF37', marginRight: '8px' }}>Q:</span>
                  {faq.question}
                </span>
                <span style={{
                  fontSize: '18px',
                  color: '#D4AF37',
                  transition: 'transform 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0
                }}>
                  ▼
                </span>
              </button>

              {/* Answer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '0 18px 16px 18px',
                      color: isDarkMode ? '#ccc' : '#666',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: 'Nunito, sans-serif'
                    }}>
                      <span style={{ color: '#D4AF37', marginRight: '8px' }}>A:</span>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .faq-section {
          font-family: 'Nunito', sans-serif;
        }
        .faq-item {
          transition: all 0.3s ease;
        }
        .faq-item:hover {
          border-color: rgba(212, 175, 55, 0.3);
        }
        .faq-item button:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
        }
      `}</style>
    </div>
  );
}

export default FAQSection;