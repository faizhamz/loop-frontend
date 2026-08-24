import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReferralPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ReferralPage() {
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/referral/my-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralInfo(response.data);
    } catch (error) {
      console.error('Error fetching referral info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareOnWhatsApp = () => {
    if (referralInfo?.referralLink) {
      const text = `🎉 Join LOOP and get ₹${referralInfo.settings?.welcomeBonus || 50} bonus! Use my referral link: ${referralInfo.referralLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareOnInstagram = () => {
    // Instagram doesn't support direct sharing via URL
    copyReferralLink();
    alert('📋 Referral link copied! Share it on Instagram stories or DM.');
  };

  if (loading) {
    return (
      <div className="referral-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!referralInfo) {
    return (
      <div className="referral-page">
        <div className="container">
          <h1>🎯 Referral Program</h1>
          <p>Please login to view your referral info.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-page">
      <div className="container">
        <div className="referral-header">
          <h1>🎯 Refer & Earn</h1>
          <p>Invite friends and earn rewards!</p>
        </div>

        {/* Stats */}
        <div className="referral-stats">
          <div className="stat-card">
            <h3>₹{referralInfo.totalEarned || 0}</h3>
            <p>Total Earned</p>
          </div>
          <div className="stat-card">
            <h3>₹{referralInfo.pendingEarnings || 0}</h3>
            <p>Pending</p>
          </div>
          <div className="stat-card">
            <h3>{referralInfo.totalReferrals || 0}</h3>
            <p>Total Referrals</p>
          </div>
          <div className="stat-card">
            <h3>₹{referralInfo.walletBalance || 0}</h3>
            <p>Wallet Balance</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="referral-link-box">
          <h3>📋 Your Referral Link</h3>
          <div className="referral-link-display">
            <code>{referralInfo.referralCode}</code>
            <button onClick={copyReferralLink} className="copy-btn">
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="referral-link-url">{referralInfo.referralLink}</p>
        </div>

        {/* Share Options */}
        <div className="share-options">
          <h3>📤 Share & Earn</h3>
          <div className="share-buttons">
            <button onClick={shareOnWhatsApp} className="share-btn whatsapp">
              💬 WhatsApp
            </button>
            <button onClick={shareOnInstagram} className="share-btn instagram">
              📷 Instagram
            </button>
            <button onClick={copyReferralLink} className="share-btn copy">
              📋 Copy Link
            </button>
          </div>
          <p className="share-info">
            Earn ₹{referralInfo.settings?.rewardAmount || 100} for every friend who makes their first order!
          </p>
        </div>

        {/* Referral History */}
        {referralInfo.referrals && referralInfo.referrals.length > 0 && (
          <div className="referral-history">
            <h3>📊 Referral History</h3>
            <table>
              <thead>
                <tr>
                  <th>Friend</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referralInfo.referrals.map((ref, index) => (
                  <tr key={index}>
                    <td>{ref.userId?.name || 'User'}</td>
                    <td>{ref.orderId?.orderId || 'N/A'}</td>
                    <td>₹{ref.rewardAmount}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        background: ref.status === 'paid' ? '#28a745' : '#ff8800',
                        color: '#fff',
                        fontSize: '11px'
                      }}>
                        {ref.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* How it Works */}
        <div className="how-it-works">
          <h3>📖 How It Works</h3>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <h4>Share Your Link</h4>
                <p>Share your unique referral link with friends</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <h4>Friend Signs Up</h4>
                <p>They sign up using your referral link</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <h4>First Order</h4>
                <p>They complete their first order of ₹{referralInfo.settings?.minimumOrderValue || 500}+</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div>
                <h4>Earn Rewards 🎉</h4>
                <p>You get ₹{referralInfo.settings?.rewardAmount || 100} in your wallet!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralPage;