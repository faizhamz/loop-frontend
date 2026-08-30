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
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const couriers = [
    { value: 'delhivery', label: 'Delhivery' },
    { value: 'bluedart', label: 'Blue Dart' },
    { value: 'dtdc', label: 'DTDC' },
    { value: 'xpressbees', label: 'XpressBees' },
    { value: 'indiapost', label: 'India Post' },
    { value: 'other', label: 'Other' }
  ];

  const formats = [
    { value: 'thermal-4x6', label: 'Thermal (4×6")', icon: '🖨️', desc: 'Standard shipping label' },
    { value: 'a4', label: 'A4 Sheet', icon: '📄', desc: 'Full page A4' },
    { value: 'a5', label: 'A5 Sheet', icon: '📄', desc: 'Half page' }
  ];

  // ✅ GENERATE AND DOWNLOAD LABEL
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDownloadSuccess(false);

    try {
      const token = localStorage.getItem('loop_token');
      console.log('📦 Generating label for order:', order._id);
      console.log('📦 Format:', format);
      console.log('📦 Courier:', courier);
      
      const response = await axios.post(
        `${API_URL}/api/labels/generate/${order._id}`,
        { 
          courier, 
          courierName, 
          instructions, 
          format 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/pdf'
          },
          responseType: 'blob', // ✅ Important: Get PDF as blob
          timeout: 30000
        }
      );

      console.log('✅ Label generated, file size:', response.data.size, 'bytes');
      
      // ✅ Extract tracking number from response headers or filename
      const contentDisposition = response.headers['content-disposition'];
      let tracking = 'Generated';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=label-(.+)\.pdf/);
        if (match) {
          tracking = match[1];
        }
      }
      setTrackingNumber(tracking);
      
      // ✅ Download directly from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `label-${order.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloadSuccess(true);
      setGeneratedLabel({ 
        trackingNumber: tracking,
        downloadUrl: url 
      });
      
      if (onLabelGenerated) {
        onLabelGenerated({ success: true, trackingNumber: tracking });
      }
      
    } catch (err) {
      console.error('❌ Label generation error:', err);
      
      // Try to parse error response
      if (err.response && err.response.data) {
        // Check if it's a blob error
        if (err.response.data instanceof Blob) {
          const text = await err.response.data.text();
          try {
            const json = JSON.parse(text);
            setError(json.error || 'Failed to generate label');
          } catch {
            setError('Failed to generate label. Please try again.');
          }
        } else {
          setError(err.response.data?.error || 'Failed to generate label');
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ VIEW & PRINT - Opens in new tab
  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const previewUrl = `${API_URL}/api/labels/preview/${order._id}?token=${encodeURIComponent(token)}`;
      
      console.log('🖨️ Opening preview:', previewUrl);
      
      const printWindow = window.open(previewUrl, '_blank');
      
      if (printWindow) {
        console.log('✅ Preview tab opened');
        setTimeout(() => {
          alert('📄 Label opened in new tab.\n\n🖨️ Use Ctrl+P (Windows) or Cmd+P (Mac) to print.\n❌ Close the tab when done.');
        }, 500);
      } else {
        alert('⚠️ Please allow popups to view the label.');
      }
    } catch (err) {
      console.error('❌ Preview error:', err);
      alert('Failed to open label preview. Please use the Download button instead.');
    }
  };

  // ✅ DOWNLOAD AGAIN (if needed)
  const handleDownloadAgain = () => {
    if (generatedLabel?.downloadUrl) {
      const link = document.createElement('a');
      link.href = generatedLabel.downloadUrl;
      link.download = `label-${order.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No label to download. Please generate one first.');
    }
  };

  const resetModal = () => {
    setGeneratedLabel(null);
    setError('');
    setDownloadSuccess(false);
    setTrackingNumber('');
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
          // 📝 GENERATE FORM
          <form onSubmit={handleGenerate} className="label-form">
            <div className="label-order-summary">
              <div className="summary-item">
                <span className="summary-label">Order</span>
                <span className="summary-value">#{order.orderId}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Customer</span>
                <span className="summary-value">{order.customer?.name || 'Guest'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Items</span>
                <span className="summary-value">{order.items?.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total</span>
                <span className="summary-value">₹{order.total}</span>
              </div>
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
                    <span className="format-icon">{f.icon}</span>
                    <span className="format-label">{f.label}</span>
                    <span className="format-desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="label-error">
                <span>❌ {error}</span>
                <button 
                  onClick={() => setError('')}
                  className="error-close"
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
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Generating...
                  </>
                ) : (
                  '📦 Generate & Download'
                )}
              </button>
            </div>
          </form>
        ) : (
          // ✅ SUCCESS VIEW
          <div className="label-generated">
            <div className="success-icon">✅</div>
            <h4>Label Generated & Downloaded!</h4>
            
            <div className="success-details">
              <p>
                <span className="detail-label">Tracking Number:</span>
                <span className="detail-value">{trackingNumber || generatedLabel.trackingNumber}</span>
              </p>
              <p className="download-location">
                💾 Saved to your <strong>Downloads</strong> folder
              </p>
            </div>
            
            <div className="label-actions-success">
              <button 
                className="btn-primary" 
                onClick={handlePrint}
              >
                🖨️ View & Print
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleDownloadAgain}
              >
                📥 Download Again
              </button>
              <button 
                className="btn-secondary" 
                onClick={resetModal}
              >
                🔄 Generate New
              </button>
            </div>

            <div className="label-tip">
              💡 <strong>Print:</strong> Opens in new tab. Use browser print (Ctrl+P).
              <br />
              💡 <strong>Download:</strong> If download didn't start, click "Download Again".
              <br />
              💡 <strong>File saved as:</strong> <code>label-{order.orderId}.pdf</code>
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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .label-modal {
          background: #111;
          border-radius: 20px;
          padding: 30px;
          max-width: 540px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #333;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .label-modal::-webkit-scrollbar {
          width: 6px;
        }

        .label-modal::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }

        .label-modal::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 3px;
        }

        .label-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .label-modal-header h3 {
          color: #D4AF37;
          margin: 0;
          font-size: 22px;
          font-family: 'Nunito', sans-serif;
        }

        .label-modal-close {
          background: none;
          border: none;
          color: #888;
          font-size: 28px;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 4px 8px;
          border-radius: 50%;
        }

        .label-modal-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          transform: rotate(90deg);
        }

        .label-order-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 14px 16px;
          background: #1a1a1a;
          border-radius: 12px;
          margin-bottom: 18px;
          border: 1px solid #2a2a2a;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 14px;
          color: #fff;
          font-weight: 600;
          font-family: 'Nunito', sans-serif;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-group label {
          display: block;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .form-group select,
        .form-group input {
          width: 100%;
          padding: 10px 14px;
          background: #222;
          border: 1px solid #333;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
          font-family: 'Nunito', sans-serif;
        }

        .form-group select:focus,
        .form-group input:focus {
          border-color: #D4AF37;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.05);
        }

        .form-group select option {
          background: #222;
          color: #fff;
        }

        .format-options {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .format-option {
          flex: 1;
          padding: 12px 8px;
          border: 2px solid #333;
          border-radius: 10px;
          background: transparent;
          color: #888;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-family: 'Nunito', sans-serif;
        }

        .format-option:hover {
          border-color: #666;
          transform: translateY(-2px);
        }

        .format-option.active {
          border-color: #D4AF37;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.05);
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.05);
        }

        .format-icon {
          font-size: 24px;
        }

        .format-label {
          font-size: 12px;
          font-weight: 600;
        }

        .format-desc {
          font-size: 9px;
          color: #666;
        }

        .label-error {
          color: #ff4444;
          font-size: 13px;
          margin-bottom: 12px;
          padding: 10px 14px;
          background: rgba(255, 68, 68, 0.08);
          border-radius: 8px;
          border: 1px solid rgba(255, 68, 68, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-close {
          background: none;
          border: none;
          color: #ff4444;
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          opacity: 0.7;
        }

        .error-close:hover {
          opacity: 1;
        }

        .label-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .label-actions button,
        .label-actions-success button {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          border: none;
          font-family: 'Nunito', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 48px;
        }

        .btn-primary {
          background: #D4AF37;
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #333;
          color: #fff;
        }

        .btn-secondary:hover {
          background: #444;
          transform: scale(1.02);
        }

        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .label-generated {
          text-align: center;
          padding: 10px 0;
        }

        .success-icon {
          font-size: 52px;
          margin-bottom: 8px;
          animation: bounceIn 0.5s ease;
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }

        .label-generated h4 {
          color: #28a745;
          margin: 0 0 8px;
          font-size: 20px;
          font-family: 'Nunito', sans-serif;
        }

        .success-details {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 14px;
          margin: 12px 0 16px;
          border: 1px solid #2a2a2a;
        }

        .success-details p {
          margin: 4px 0;
          color: #888;
          font-size: 14px;
        }

        .detail-label {
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          color: #D4AF37;
          font-weight: 600;
          margin-left: 6px;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }

        .download-location {
          color: #28a745 !important;
          font-size: 13px !important;
          margin-top: 6px !important;
        }

        .download-location strong {
          color: #fff;
        }

        .label-actions-success {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 4px;
        }

        .label-actions-success button {
          flex: 1;
          min-width: 100px;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s ease;
          border: none;
          font-family: 'Nunito', sans-serif;
        }

        .label-tip {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 10px;
          color: #888;
          font-size: 12px;
          line-height: 1.8;
          text-align: left;
        }

        .label-tip strong {
          color: #D4AF37;
        }

        .label-tip code {
          background: #1a1a1a;
          padding: 2px 8px;
          border-radius: 4px;
          color: #D4AF37;
          font-size: 11px;
          font-family: 'Courier New', monospace;
        }

        @media (max-width: 480px) {
          .label-modal {
            padding: 20px;
            border-radius: 14px;
            margin: 10px;
          }

          .label-modal-header h3 {
            font-size: 18px;
          }

          .label-order-summary {
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            padding: 10px 12px;
          }

          .summary-value {
            font-size: 13px;
          }

          .format-options {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .format-option {
            flex-direction: row;
            padding: 8px 12px;
            gap: 8px;
            justify-content: flex-start;
          }

          .format-icon {
            font-size: 18px;
          }

          .label-actions {
            flex-direction: column;
          }

          .label-actions-success {
            flex-direction: column;
          }

          .label-actions-success button {
            width: 100%;
          }

          .label-tip {
            font-size: 11px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default ShippingLabelModal;