import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWalletSummary, formatWalletAmount } from '../utils/wallet';

function WalletPayment({ 
  cartTotal, 
  onWalletSelect, 
  onWalletAmountChange,
  selected,
  className = ''
}) {
  const [walletData, setWalletData] = useState({
    balance: 0,
    hasBalance: false,
    transactions: [],
    totalEarned: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState(null); // 'full', 'partial', 'custom'
  const [customAmount, setCustomAmount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const data = await getWalletSummary();
      setWalletData(data);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentModeSelect = (mode) => {
    setPaymentMode(mode);
    setIsExpanded(true);
    
    let amount = 0;
    let remaining = cartTotal;
    
    if (mode === 'full') {
      amount = Math.min(walletData.balance, cartTotal);
      remaining = cartTotal - amount;
    } else if (mode === 'partial') {
      amount = Math.min(walletData.balance, cartTotal);
      remaining = cartTotal - amount;
    } else if (mode === 'custom') {
      amount = 0;
      remaining = cartTotal;
    }
    
    onWalletSelect && onWalletSelect(mode, amount, remaining);
    onWalletAmountChange && onWalletAmountChange(amount);
  };

  const handleCustomAmountChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= Math.min(walletData.balance, cartTotal)) {
      setCustomAmount(value);
      onWalletSelect && onWalletSelect('custom', value, cartTotal - value);
      onWalletAmountChange && onWalletAmountChange(value);
    }
  };

  if (loading) {
    return (
      <div className={`wallet-payment ${className}`} style={{ padding: '16px', textAlign: 'center' }}>
        <div className="kawaii-spinner-small" style={{
          width: '24px',
          height: '24px',
          border: '2px solid #333',
          borderTop: '2px solid #D4AF37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>Loading wallet...</p>
      </div>
    );
  }

  if (!walletData.hasBalance) {
    return (
      <div className={`wallet-payment ${className}`} style={{
        padding: '16px',
        background: 'rgba(255, 68, 68, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 68, 68, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px' }}>💰</div>
        <p style={{ color: '#888', fontSize: '13px' }}>No wallet balance available</p>
        <p style={{ color: '#666', fontSize: '12px' }}>Earn rewards through referrals!</p>
      </div>
    );
  }

  return (
    <div className={`wallet-payment ${className}`} style={{
      padding: '16px',
      background: 'rgba(212, 175, 55, 0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(212, 175, 55, 0.1)'
    }}>
      {/* Wallet Balance */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ color: '#888', fontSize: '12px' }}>💰 Wallet Balance</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#D4AF37' }}>
            {formatWalletAmount(walletData.balance)}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid #D4AF37',
            borderRadius: '20px',
            color: '#D4AF37',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          {isExpanded ? '▼ Hide' : '▶ Pay with Wallet'}
        </button>
      </div>

      {/* Payment Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: '12px' }}>
              {/* Full Payment */}
              {walletData.balance >= cartTotal && (
                <button
                  onClick={() => handlePaymentModeSelect('full')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: paymentMode === 'full' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    border: paymentMode === 'full' ? '2px solid #D4AF37' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>💳 Pay Full Amount</span>
                  <span style={{ color: '#28a745', fontWeight: '600' }}>₹{cartTotal}</span>
                </button>
              )}

              {/* Partial Payment */}
              {walletData.balance < cartTotal && walletData.balance > 0 && (
                <button
                  onClick={() => handlePaymentModeSelect('partial')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: paymentMode === 'partial' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    border: paymentMode === 'partial' ? '2px solid #D4AF37' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>💰 Use {formatWalletAmount(walletData.balance)} from wallet</span>
                  <span style={{ color: '#D4AF37', fontWeight: '600' }}>₹{cartTotal - walletData.balance} remaining</span>
                </button>
              )}

              {/* Custom Amount */}
              {walletData.balance > 0 && (
                <div style={{
                  padding: '12px',
                  background: paymentMode === 'custom' ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                  border: paymentMode === 'custom' ? '2px solid #D4AF37' : '1px solid #333',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handlePaymentModeSelect('custom')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        padding: '4px 0'
                      }}
                    >
                      ✏️ Custom Amount
                    </button>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount || ''}
                      onChange={handleCustomAmountChange}
                      min="0"
                      max={Math.min(walletData.balance, cartTotal)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px',
                        minWidth: '120px'
                      }}
                    />
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      Max: {formatWalletAmount(Math.min(walletData.balance, cartTotal))}
                    </span>
                  </div>
                </div>
              )}

              {/* Selected Payment Summary */}
              {paymentMode && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(212, 175, 55, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                  marginTop: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#888' }}>Wallet used:</span>
                    <span style={{ color: '#D4AF37', fontWeight: '600' }}>
                      {formatWalletAmount(
                        paymentMode === 'full' ? Math.min(walletData.balance, cartTotal) :
                        paymentMode === 'partial' ? walletData.balance :
                        customAmount || 0
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#888' }}>Remaining to pay:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {formatWalletAmount(
                        cartTotal - (
                          paymentMode === 'full' ? Math.min(walletData.balance, cartTotal) :
                          paymentMode === 'partial' ? walletData.balance :
                          customAmount || 0
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .wallet-payment {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default WalletPayment;