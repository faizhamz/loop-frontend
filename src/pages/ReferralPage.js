import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import WhatsAppIcon from '../components/WhatsAppIcon';
import './ReferralPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ReferralPage() {
  const { showToast } = useApp();
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchReferralInfo();
    fetchWhatsAppNumber();
  }, []);

  const fetchReferralInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      if (!token) {
        setLoading(false);
        return;
      }
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

  const fetchWhatsAppNumber = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/contact`);
      if (response.data?.whatsapp) {
        setWhatsappNumber(response.data.whatsapp);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp:', err);
    }
  };

  const copyReferralLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      setCopied(true);
      showToast?.('📋 Referral link copied!', 'success');
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
    copyReferralLink();
    showToast?.('📋 Link copied! Share it on Instagram stories or DM.', 'info');
  };

  const shareOnFacebook = () => {
    if (referralInfo?.referralLink) {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralInfo.referralLink)}`;
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const shareOnTwitter = () => {
    if (referralInfo?.referralLink) {
      const text = `🎉 Join LOOP and get ₹${referralInfo.settings?.welcomeBonus || 50} bonus! Use my referral link:`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralInfo.referralLink)}`;
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Check if user is logged in
  const token = localStorage.getItem('loop_token');
  if (!token) {
    return (
      <div className="referral-page">
        <div className="container">
          <div className="referral-login-prompt">
            <div className="prompt-icon">🔒</div>
            <h2>Please Login</h2>
            <p>You need to login to view your referral information.</p>
            <Link to="/login" className="login-btn-referral">
              Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="referral-page">
        <div className="container">
          <div className="referral-loading">
            <div className="kawaii-spinner"></div>
            <p>Loading your referral info...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!referralInfo) {
    return (
      <div className="referral-page">
        <div className="container">
          <div className="referral-empty">
            <div className="empty-icon">🎯</div>
            <h2>Referral Program</h2>
            <p>Something went wrong. Please try again later.</p>
            <button onClick={fetchReferralInfo} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { settings } = referralInfo;

  return (
    <div className="referral-page">
      <div className="container">
        {/* Header */}
        <div className="referral-header">
          <h1>🎯 Refer & Earn</h1>
          <p>Invite friends and earn rewards together!</p>
          <div className="referral-status-badge">
            <span className="status-dot active"></span>
            {settings?.isEnabled ? 'Active' : 'Currently Disabled'}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="referral-stats-grid">
          <div className="referral-stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-number">₹{referralInfo.totalEarned || 0}</span>
              <span className="stat-label">Total Earned</span>
            </div>
          </div>
          <div className="referral-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-number">₹{referralInfo.pendingEarnings || 0}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="referral-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-number">{referralInfo.totalReferrals || 0}</span>
              <span className="stat-label">Total Referrals</span>
            </div>
          </div>
          <div className="referral-stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <span className="stat-number">₹{referralInfo.walletBalance || 0}</span>
              <span className="stat-label">Wallet Balance</span>
            </div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="referral-link-section">
          <h3>📋 Your Referral Link</h3>
          <div className="referral-code-display">
            <div className="code-box">
              <span className="code-label">Your Code</span>
              <span className="code-value">{referralInfo.referralCode}</span>
            </div>
            <div className="link-box">
              <input
                type="text"
                value={referralInfo.referralLink}
                readOnly
                className="referral-link-input"
              />
              <button onClick={copyReferralLink} className="copy-btn">
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="referral-share-section">
          <h3>📤 Share & Earn</h3>
          <div className="share-buttons-grid">
            <button onClick={copyReferralLink} className="share-btn copy">
              <span className="share-icon">📋</span>
              <span className="share-label">Copy Link</span>
            </button>
            <button onClick={shareOnWhatsApp} className="share-btn whatsapp">
              <WhatsAppIcon size={24} color="#fff" />
              <span className="share-label">WhatsApp</span>
            </button>
            <button onClick={shareOnInstagram} className="share-btn instagram">
              <span className="share-icon">📷</span>
              <span className="share-label">Instagram</span>
            </button>
            <button onClick={shareOnFacebook} className="share-btn facebook">
              <span className="share-icon">👍</span>
              <span className="share-label">Facebook</span>
            </button>
            <button onClick={shareOnTwitter} className="share-btn twitter">
              <span className="share-icon">🐦</span>
              <span className="share-label">Twitter</span>
            </button>
          </div>
          <div className="share-info">
            <p>
              💰 Earn <strong>₹{settings?.rewardAmount || 100}</strong> for every friend who makes their first order of ₹{settings?.minimumOrderValue || 500}+
            </p>
            <p>
              🎁 Your friend gets <strong>₹{settings?.welcomeBonus || 50}</strong> welcome bonus!
            </p>
          </div>
        </div>

        {/* Referral History */}
        {referralInfo.referrals && referralInfo.referrals.length > 0 && (
          <div className="referral-history-section">
            <h3>📊 Referral History</h3>
            <div className="referral-history-table-wrapper">
              <table className="referral-history-table">
                <thead>
                  <tr>
                    <th>Friend</th>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referralInfo.referrals.map((ref, index) => (
                    <tr key={index}>
                      <td>
                        <div className="friend-info">
                          <span className="friend-avatar">
                            {ref.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                          <span className="friend-name">{ref.userId?.name || 'User'}</span>
                        </div>
                      </td>
                      <td>{ref.orderId?.orderId || 'N/A'}</td>
                      <td className="amount">₹{ref.rewardAmount}</td>
                      <td className="date">{ref.rewardedAt ? new Date(ref.rewardedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${ref.status}`}>
                          {ref.status === 'paid' ? '✅ Paid' : ref.status === 'pending' ? '⏳ Pending' : '❌ Cancelled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="referral-how-it-works">
          <h3>📖 How It Works</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📋</div>
              <h4>Share Your Link</h4>
              <p>Share your unique referral link with friends via WhatsApp, Instagram, or copy the link</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📝</div>
              <h4>Friend Signs Up</h4>
              <p>They sign up using your referral link and get ₹{settings?.welcomeBonus || 50} welcome bonus</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🛒</div>
              <h4>First Order</h4>
              <p>They complete their first order of ₹{settings?.minimumOrderValue || 500}+</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">🎉</div>
              <h4>Earn Rewards</h4>
              <p>You get ₹{settings?.rewardAmount || 100} in your wallet automatically! 🎉</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="referral-faq">
          <h3>❓ Frequently Asked Questions</h3>
          <div className="faq-item">
            <div className="faq-question">How do I get my referral code?</div>
            <div className="faq-answer">Your referral code is shown above. You can copy it or share it directly via WhatsApp or Instagram.</div>
          </div>
          <div className="faq-item">
            <div className="faq-question">When do I get the referral reward?</div>
            <div className="faq-answer">You get ₹{settings?.rewardAmount || 100} when your referred friend completes their first order of ₹{settings?.minimumOrderValue || 500}+.</div>
          </div>
          <div className="faq-item">
            <div className="faq-question">How do I know if my referral was successful?</div>
            <div className="faq-answer">You'll see the referral in your history above with status "Paid" once the reward is credited to your wallet.</div>
          </div>
          <div className="faq-item">
            <div className="faq-question">Can I refer myself?</div>
            <div className="faq-answer">No, you cannot refer yourself. You can only refer new users who haven't signed up before.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralPage;