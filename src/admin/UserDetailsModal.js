import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function UserDetailsModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) return null;

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'orders', label: '📦 Orders', icon: '📦' },
    { id: 'wallet', label: '💰 Wallet', icon: '💰' },
    { id: 'referrals', label: '🎯 Referrals', icon: '🎯' },
    { id: 'addresses', label: '📍 Addresses', icon: '📍' }
  ];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👤 User Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* User Summary */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: '#1a1a1a',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '700',
              color: '#000',
              flexShrink: 0
            }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                {user.name || 'Unknown User'}
              </div>
              <div style={{ color: '#888', fontSize: '13px' }}>📧 {user.email}</div>
              <div style={{ color: '#666', fontSize: '13px' }}>📱 {user.phone || 'No phone'}</div>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '4px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: user.isActive ? 'rgba(40, 167, 69, 0.15)' : 'rgba(255, 68, 68, 0.15)',
                  color: user.isActive ? '#28a745' : '#ff4444'
                }}>
                  {user.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: '#D4AF37'
                }}>
                  🔑 {user.refId || 'N/A'}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: 'rgba(0, 102, 255, 0.15)',
                  color: '#0066FF'
                }}>
                  {user.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid #333',
            marginBottom: '16px',
            overflowX: 'auto'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#D4AF37' : '#888',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  borderBottom: activeTab === tab.id ? '2px solid #D4AF37' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Nunito, sans-serif'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Name</span>
                    <span style={{ color: '#fff' }}>{user.name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Email</span>
                    <span style={{ color: '#fff' }}>{user.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Phone</span>
                    <span style={{ color: '#fff' }}>{user.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Gender</span>
                    <span style={{ color: '#fff' }}>{user.gender || 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Date of Birth</span>
                    <span style={{ color: '#fff' }}>{user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#888' }}>Joined</span>
                    <span style={{ color: '#fff' }}>{formatDate(user.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ color: '#888' }}>Last Login</span>
                    <span style={{ color: '#fff' }}>{formatDate(user.lastLogin)}</span>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {user.orderIds && user.orderIds.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {user.orderIds.map((order, index) => (
                        <div key={index} style={{
                          padding: '10px 14px',
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ color: '#D4AF37', fontWeight: '600' }}>
                              #{order.orderId || order._id}
                            </div>
                            <div style={{ color: '#888', fontSize: '12px' }}>
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#D4AF37', fontWeight: '700' }}>
                              {formatCurrency(order.total)}
                            </div>
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              background: order.status === 'delivered' ? 'rgba(40, 167, 69, 0.15)' :
                                        order.status === 'cancelled' ? 'rgba(255, 68, 68, 0.15)' :
                                        'rgba(212, 175, 55, 0.15)',
                              color: order.status === 'delivered' ? '#28a745' :
                                     order.status === 'cancelled' ? '#ff4444' :
                                     '#D4AF37'
                            }}>
                              {order.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No orders yet</p>
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(212, 175, 55, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#888', fontSize: '13px' }}>Current Balance</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#D4AF37' }}>
                      {formatCurrency(user.wallet?.balance || 0)}
                    </div>
                  </div>

                  {user.wallet?.transactions && user.wallet.transactions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {user.wallet.transactions.slice().reverse().map((tx, index) => (
                        <div key={index} style={{
                          padding: '10px 14px',
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ color: '#fff', fontSize: '13px' }}>{tx.description}</div>
                            <div style={{ color: '#666', fontSize: '11px' }}>{formatDate(tx.createdAt)}</div>
                          </div>
                          <div style={{
                            color: tx.type === 'credit' || tx.type === 'reward' ? '#28a745' : '#ff4444',
                            fontWeight: '700'
                          }}>
                            {tx.type === 'credit' || tx.type === 'reward' ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No transactions yet</p>
                  )}
                </div>
              )}

              {activeTab === 'referrals' && (
                <div>
                  {user.referrals && user.referrals.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {user.referrals.map((ref, index) => (
                        <div key={index} style={{
                          padding: '10px 14px',
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ color: '#fff', fontSize: '13px' }}>
                              {ref.userId?.name || 'Unknown User'}
                            </div>
                            <div style={{ color: '#666', fontSize: '11px' }}>
                              {ref.orderId?.orderId || 'Order #' + ref.orderId}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#D4AF37', fontWeight: '700' }}>
                              +{formatCurrency(ref.rewardAmount)}
                            </div>
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              background: ref.status === 'paid' ? 'rgba(40, 167, 69, 0.15)' :
                                        ref.status === 'pending' ? 'rgba(255, 136, 0, 0.15)' :
                                        'rgba(255, 68, 68, 0.15)',
                              color: ref.status === 'paid' ? '#28a745' :
                                     ref.status === 'pending' ? '#ff8800' :
                                     '#ff4444'
                            }}>
                              {ref.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No referrals yet</p>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  {user.addresses && user.addresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {user.addresses.map((addr, index) => (
                        <div key={index} style={{
                          padding: '12px 16px',
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          border: addr.isDefault ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #333'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: '#D4AF37', fontSize: '13px', fontWeight: '600' }}>
                                {addr.label || 'Address'} {addr.isDefault && '⭐ Default'}
                              </div>
                              <div style={{ color: '#fff', fontSize: '13px' }}>{addr.name}</div>
                              <div style={{ color: '#888', fontSize: '12px' }}>{addr.street}</div>
                              <div style={{ color: '#888', fontSize: '12px' }}>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </div>
                              {addr.phone && <div style={{ color: '#666', fontSize: '12px' }}>📞 {addr.phone}</div>}
                              {addr.landmark && <div style={{ color: '#666', fontSize: '12px' }}>📍 {addr.landmark}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No addresses saved</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      <style>{`
        .user-details-modal {
          background: #111;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          border: 1px solid #333;
          animation: modalSlideIn 0.3s ease;
        }
        .user-details-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
          background: #111;
        }
        .user-details-modal .modal-header h3 {
          color: #D4AF37;
          margin: 0;
          font-size: 18px;
          font-family: 'Nunito', sans-serif;
        }
        .user-details-modal .modal-body {
          padding: 16px 20px;
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }
        .user-details-modal .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #333;
          background: #0a0a0a;
        }
        .user-details-modal .modal-footer .btn-secondary {
          padding: 8px 20px;
          background: #333;
          border: none;
          border-radius: 6px;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Nunito', sans-serif;
        }
        .user-details-modal .modal-footer .btn-secondary:hover {
          background: #444;
        }
        .user-details-modal .modal-close {
          background: none;
          border: none;
          color: #888;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
        }
        .user-details-modal .modal-close:hover {
          color: #fff;
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) {
          .user-details-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .user-details-modal .modal-body {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default UserDetailsModal;