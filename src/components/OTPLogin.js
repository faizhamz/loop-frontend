import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  auth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  signInWithCredential 
} from '../firebase';
import './OTPLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function OTPLogin({ onVerified, onClose, purpose = 'signup' }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const recaptchaRef = useRef(null);
  const recaptchaContainerId = 'recaptcha-container';

  // Check if Firebase is ready
  useEffect(() => {
    const checkFirebase = () => {
      if (auth) {
        console.log('✅ Firebase Auth is ready');
        window.firebaseReady = true;
      } else {
        console.log('⏳ Waiting for Firebase...');
        setTimeout(checkFirebase, 500);
      }
    };
    checkFirebase();
  }, []);

  // Timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (e) {
          console.log('reCAPTCHA cleanup:', e);
        }
        recaptchaRef.current = null;
      }
    };
  }, []);

  // Format phone number - Auto +91 for India
  const formatPhoneForDisplay = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  // Format phone for sending
  const formatPhoneForSending = (rawPhone) => {
    const cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 0) return '';
    return `+91${cleaned}`;
  };

  // Initialize reCAPTCHA
  const initializeRecaptcha = () => {
    try {
      const container = document.getElementById(recaptchaContainerId);
      if (!container) {
        console.error('❌ recaptcha-container not found in DOM');
        return false;
      }

      container.innerHTML = '';

      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        recaptchaContainerId,
        {
          size: 'invisible',
          callback: () => {
            console.log('✅ reCAPTCHA verified successfully');
          },
          'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired, will recreate on next attempt');
            recaptchaRef.current = null;
          },
          'error-callback': () => {
            console.log('❌ reCAPTCHA error');
            recaptchaRef.current = null;
          }
        }
      );

      console.log('✅ reCAPTCHA created successfully');
      return true;
    } catch (error) {
      console.error('❌ reCAPTCHA initialization error:', error);
      return false;
    }
  };

  // Send OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const formattedPhone = formatPhoneForSending(phone);
    console.log('📱 Sending OTP to:', formattedPhone);
    
    if (!formattedPhone || formattedPhone.length < 12) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      if (!window.firebaseReady) {
        console.log('⏳ Waiting for Firebase to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (!recaptchaRef.current) {
        console.log('🔄 Creating reCAPTCHA...');
        const initialized = initializeRecaptcha();
        if (!initialized) {
          setError('❌ Failed to initialize security verification. Please refresh and try again.');
          setLoading(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('📤 Sending OTP request to Firebase...');
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaRef.current
      );
      
      console.log('✅ OTP sent successfully!');
      setVerificationId(confirmation.verificationId);
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      setError('');
      setSuccessMessage(`✅ OTP sent to ${formattedPhone}`);
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ OTP Error:', error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setError('❌ SMS service not available. Please use email login or contact support.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setError('❌ Invalid phone number. Please enter a valid 10-digit number.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('❌ Too many attempts. Please wait 5 minutes and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('❌ Network error. Please check your internet connection.');
      } else if (error.code === 'auth/user-not-found') {
        setError('❌ User not found. Please sign up first.');
      } else if (error.code === 'auth/captcha-check-failed') {
        setError('❌ Security verification failed. Please refresh and try again.');
        recaptchaRef.current = null;
      } else {
        setError(`❌ ${error.message || 'Failed to send OTP. Please try again.'}`);
      }
    }
    setLoading(false);
  };

  // Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Verifying OTP...');
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Phone verified:', firebaseUser.phoneNumber);
      
      // ✅ Call onVerified with phone number
      const cleanPhone = firebaseUser.phoneNumber.replace('+91', '');
      onVerified(cleanPhone);
      
      setStep('verified');
      setSuccessMessage('✅ Phone verified successfully!');
      
    } catch (error) {
      console.error('❌ Verification Error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        setError('❌ Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('❌ Too many attempts. Please wait 5 minutes and try again.');
      } else {
        setError('❌ Failed to verify OTP. Please try again.');
      }
    }
    setLoading(false);
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (e) {}
        recaptchaRef.current = null;
      }
      
      const formattedPhone = formatPhoneForSending(phone);
      const initialized = initializeRecaptcha();
      if (!initialized) {
        setError('❌ Security verification failed. Please refresh and try again.');
        setLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaRef.current
      );
      
      setVerificationId(confirmation.verificationId);
      setTimer(60);
      setCanResend(false);
      setError('');
      setSuccessMessage('✅ New OTP sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Resend error:', error);
      setError('Failed to resend OTP. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="otp-login-modal" onClick={(e) => {
      if (e.target.className === 'otp-login-modal') {
        if (window.confirm('Are you sure you want to close? The OTP will expire.')) {
          onClose();
        }
      }
    }}>
      <div className="otp-login-content">
        <button className="otp-close" onClick={onClose} disabled={loading}>✕</button>
        <h2>📱 Phone Verification</h2>
        <p className="otp-subtitle">Verify your phone number for signup</p>

        <div id={recaptchaContainerId}></div>

        {error && <div className="otp-error">{error}</div>}
        {successMessage && <div className="otp-success">{successMessage}</div>}

        {step === 'phone' && (
          <form onSubmit={sendOTP} className="otp-form">
            <div className="otp-input-group">
              <label>Phone Number</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: '#222', 
                borderRadius: '8px', 
                border: '1px solid #333',
                overflow: 'hidden'
              }}>
                <span style={{ 
                  padding: '14px 12px', 
                  color: '#D4AF37', 
                  fontWeight: 'bold',
                  borderRight: '1px solid #333',
                  background: '#1a1a1a',
                  minWidth: '45px',
                  textAlign: 'center'
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneForDisplay(e.target.value);
                    setPhone(formatted);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <span className="otp-hint">Enter 10-digit phone number (Auto +91 for India)</span>
            </div>
            
            <button type="submit" className="otp-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="otp-spinner-small"></span>
                  Sending...
                </>
              ) : (
                '📤 Send OTP'
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOTP} className="otp-form">
            <div className="otp-input-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                required
                disabled={loading}
                autoFocus
                style={{
                  padding: '14px',
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '4px'
                }}
              />
              <span className="otp-hint">
                OTP sent to +91{phone}
                {timer > 0 && <span className="otp-timer"> • Resend in {timer}s</span>}
              </span>
            </div>
            
            <button type="submit" className="otp-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="otp-spinner-small"></span>
                  Verifying...
                </>
              ) : (
                '✅ Verify OTP'
              )}
            </button>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="otp-resend"
                onClick={resendOTP}
                disabled={!canResend || loading}
              >
                {canResend ? '🔄 Resend OTP' : `⏳ Wait ${timer}s`}
              </button>
              <button 
                type="button" 
                className="otp-back"
                onClick={() => { 
                  setStep('phone'); 
                  setError(''); 
                  setSuccessMessage('');
                  setOtp('');
                }}
                disabled={loading}
              >
                ← Change Number
              </button>
            </div>
          </form>
        )}

        {step === 'verified' && (
          <div className="otp-verified">
            <div className="otp-success-icon">✅</div>
            <h3>Phone Verified!</h3>
            <p>Your phone number has been verified successfully.</p>
            <p className="otp-verified-phone">+91{phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OTPLogin;