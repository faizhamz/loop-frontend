import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ShippingLabelModal({ isOpen, onClose, order, onLabelGenerated }) {
  const [loading, setLoading] = useState(false);
  const [courier, setCourier] = useState('delhivery');
  const [courierName, setCourierName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [format, setFormat] = useState('thermal-4x6');
  const [generatedLabel, setGeneratedLabel] = useState(null);
  const [error, setError] = useState('');
  const [downloadStarted, setDownloadStarted] = useState(false);

  // ✅ Auto-download when label is generated
  useEffect(() => {
    if (generatedLabel && !downloadStarted) {
      console.log('📦 Auto-downloading label...');
      setDownloadStarted(true);
      const timer = setTimeout(() => {
        handleDownload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [generatedLabel]);

  const couriers = [
    { value: 'delhivery', label: 'Delhivery' },
    { value: 'bluedart', label: 'Blue Dart' },
    { value: 'dtdc', label: 'DTDC' },
    { value: 'xpressbees', label: 'XpressBees' },
    { value: 'indiapost', label: 'India Post' },
    { value: 'other', label: 'Other' }
  ];

  const formats = [
    { value: 'thermal-4x6', label: 'Thermal (4×6")', icon: '🖨️' },
    { value: 'a4', label: 'A4 Sheet', icon: '📄' },
    { value: 'a5', label: 'A5 Label', icon: '📄' }
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDownloadStarted(false);

    try {
      const token = localStorage.getItem('loop_token');
      console.log('📦 Generating label for order:', order._id);
      
      const response = await axios.post(
        `${API_URL}/api/labels/generate/${order._id}`,
        { courier, courierName, instructions, format },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log('✅ Label response:', response.data);

      if (response.data.success) {
        setGeneratedLabel(response.data);
        if (onLabelGenerated) onLabelGenerated(response.data);
      } else {
        setError(response.data?.error || 'Failed to generate label');
      }
    } catch (err) {
      console.error('❌ Label generation error:', err);
      
      if (err.response) {
        setError(`Server error (${err.response.status}): ${err.response.data?.error || err.message}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedLabel?.downloadUrl) {
      const token = localStorage.getItem('loop_token');
      const downloadUrl = `${API_URL}${generatedLabel.downloadUrl}?token=${token}`;
      console.log('📥 Downloading from:', downloadUrl);
      
      // Open in new tab for download
      const win = window.open(downloadUrl, '_blank');
      if (!win) {
        // If popup blocked, use direct download
        window.location.href = downloadUrl;
      }
    } else {
      console.warn('⚠️ No download URL available');
    }
  };

  const handlePrint = () => {
    if (generatedLabel?.downloadUrl) {
      const token = localStorage.getItem('loop_token');
      const printWindow = window.open(
        `${API_URL}${generatedLabel.downloadUrl}?token=${token}`,
        '_blank'
      );
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const resetModal = () => {
    setGeneratedLabel(null);
    setError('');
    setDownloadStarted(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="label-modal-overlay" onClick={handleClose}>
      <motion.div 
        className="label-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label-modal-header">
          <h3>📦 Shipping Label</h3>
          <button className="label-modal-close" onClick={handleClose}>✕</button>
        </div>

        {!generatedLabel ? (
          <form onSubmit={handleGenerate} className="label-form">
            <div className="label-order-summary">
              <span>Order: <strong>#{order.orderId}</strong></span>
              <span>Customer: <strong>{order.customer?.name}</strong></span>
              <span>Items: <strong>{order.items?.length}</strong></span>
              <span>Total: <strong>₹{order.total}</strong></span>
            </div>

            <div className="form-group">
              <label>🚚 Courier *</label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                required
              >
                {couriers.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Courier Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Delhivery Surface"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>⚠️ Special Instructions</label>
              <input
                type="text"
                placeholder="e.g., Fragile - Handle with care"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📄 Format</label>
              <div className="format-options">
                {formats.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    className={`format-option ${format === f.value ? 'active' : ''}`}
                    onClick={() => setFormat(f.value)}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="label-error">
                ❌ {error}
                <button 
                  onClick={() => setError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="label-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '⏳ Generating...' : '📦 Generate Label'}
              </button>
            </div>
          </form>
        ) : (
          <div className="label-generated">
            <div className="label-success-icon">✅</div>
            <h4>Label Generated Successfully!</h4>
            <p>
              Tracking Number: <strong>{generatedLabel.trackingNumber}</strong>
            </p>
            {generatedLabel.downloadUrl && (
              <p style={{ fontSize: '12px', color: '#666' }}>
                📄 {generatedLabel.downloadUrl.split('/').pop()}
              </p>
            )}
            
            <div className="label-preview-actions">
              <button className="btn-primary" onClick={handlePrint}>
                🖨️ Print Label
              </button>
              <button className="btn-secondary" onClick={handleDownload}>
                📥 Download PDF
              </button>
              <button className="btn-secondary" onClick={resetModal}>
                🔄 Generate New
              </button>
            </div>

            <div className="label-tip">
              💡 Label saved as <strong>{generatedLabel.downloadUrl?.split('/').pop() || 'label.pdf'}</strong>
              {!downloadStarted && (
                <span style={{ display: 'block', marginTop: '4px', color: '#D4AF37' }}>
                  ⏳ Download will start automatically...
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <style>{`
        .label-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .label-modal {
          background: #111;
          border-radius: 16px;
          padding: 28px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #333;
        }

        .label-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .label-modal-header h3 {
          color: #D4AF37;
          margin: 0;
        }

        .label-modal-close {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
        }

        .label-modal-close:hover {
          color: #fff;
        }

        .label-order-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 12px 16px;
          background: #1a1a1a;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #888;
        }

        .label-order-summary strong {
          color: #fff;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-group label {
          display: block;
          color: #888;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .form-group select,
        .form-group input {
          width: 100%;
          padding: 10px 14px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          outline: none;
        }

        .form-group select:focus,
        .form-group input:focus {
          border-color: #D4AF37;
        }

        .format-options {
          display: flex;
          gap: 8px;
        }

        .format-option {
          flex: 1;
          padding: 10px;
          border: 2px solid #333;
          border-radius: 8px;
          background: transparent;
          color: #888;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          font-size: 13px;
        }

        .format-option span {
          display: block;
          font-size: 20px;
          margin-bottom: 4px;
        }

        .format-option:hover {
          border-color: #666;
        }

        .format-option.active {
          border-color: #D4AF37;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.05);
        }

        .label-error {
          color: #ff4444;
          font-size: 13px;
          margin-bottom: 12px;
          padding: 8px 12px;
          background: rgba(255, 68, 68, 0.1);
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .label-actions button {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: #D4AF37;
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #333;
          color: #fff;
        }

        .btn-secondary:hover {
          background: #444;
        }

        .label-generated {
          text-align: center;
          padding: 10px 0;
        }

        .label-success-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        .label-generated h4 {
          color: #28a745;
          margin: 0 0 4px;
        }

        .label-generated p {
          color: #888;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .label-generated p strong {
          color: #D4AF37;
        }

        .label-preview-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }

        .label-preview-actions button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
          border: none;
          min-width: 120px;
        }

        .label-tip {
          margin-top: 16px;
          padding: 10px 14px;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 8px;
          color: #888;
          font-size: 13px;
        }

        .label-tip strong {
          color: #D4AF37;
        }

        @media (max-width: 480px) {
          .label-modal {
            padding: 20px;
          }
          
          .label-order-summary {
            grid-template-columns: 1fr;
          }
          
          .format-options {
            flex-direction: column;
          }
          
          .label-actions {
            flex-direction: column;
          }
          
          .label-preview-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default ShippingLabelModal;