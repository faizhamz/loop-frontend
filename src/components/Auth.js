import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import OTPLogin from './OTPLogin';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function Auth({ onLogin, setUser }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('loop_token');
    const userData = localStorage.getItem('loop_user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        onLogin(user, token);
        setUser(user);
        navigate('/');
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, [onLogin, setUser, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  // ✅ Handle OTP verification for signup
  const handleOTPVerified = (phone) => {
    setOtpVerified(true);
    setVerifiedPhone(phone);
    setShowOTP(false);
    setSuccessMessage(`✅ Phone ${phone} verified! Please complete your registration.`);
    setFormData(prev => ({ ...prev, phone: phone }));
  };

  // ✅ Handle Login (No OTP)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const isPhone = /^\d{10}$/.test(formData.email) || formData.email.includes('+');
      
      let loginData;
      if (isPhone) {
        loginData = {
          phone: formData.email.replace(/\D/g, ''),
          password: formData.password
        };
      } else {
        loginData = {
          email: formData.email,
          password: formData.password
        };
      }

      const response = await axios.post(`${API_URL}/api/auth/login`, loginData);
      
      localStorage.setItem('loop_token', response.data.token);
      localStorage.setItem('loop_user', JSON.stringify(response.data.user));
      
      onLogin(response.data.user, response.data.token);
      setUser(response.data.user);
      
      setSuccessMessage('✅ Login successful!');
      
      // Check if profile is complete
      if (!response.data.user.isProfileComplete) {
        setTimeout(() => {
          navigate('/profile-completion');
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Signup (After OTP Verification)
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!otpVerified) {
        setError('Please verify your phone number first using "Verify Phone"');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // ✅ Check duplicate
      const checkResponse = await axios.post(`${API_URL}/api/auth/check-duplicate`, {
        email: formData.email,
        phone: formData.phone
      });
      
      if (checkResponse.data.exists) {
        setError('This email or phone is already registered. Please login.');
        setLoading(false);
        return;
      }

      // ✅ Create account
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      localStorage.setItem('loop_token', response.data.token);
      localStorage.setItem('loop_user', JSON.stringify(response.data.user));
      
      onLogin(response.data.user, response.data.token);
      setUser(response.data.user);
      
      setSuccessMessage('✅ Account created successfully!');
      
      // ✅ Redirect to profile completion
      setTimeout(() => {
        navigate('/profile-completion');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: resetEmail });
      setResetMessage('Password reset link sent to your email');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
        setResetEmail('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-l">L</span>
          <span className="logo-infinity">∞</span>
          <span className="logo-p">P</span>
        </div>
        <p className="auth-tagline">Make your move</p>

        {successMessage && (
          <div className="auth-success">{successMessage}</div>
        )}

        {!showForgotPassword ? (
          <>
            <div className="auth-tabs">
              <button 
                className={isLogin ? 'active' : ''} 
                onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
              >
                Login
              </button>
              <button 
                className={!isLogin ? 'active' : ''} 
                onClick={() => { setIsLogin(false); setError(''); setSuccessMessage(''); }}
              >
                Sign Up
              </button>
            </div>

            {/* ✅ LOGIN FORM (No OTP) */}
            {isLogin ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email or Phone</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter email or 10-digit phone"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                  <span className="field-hint">Use email or phone number (without +91)</span>
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>

                {error && <div className="auth-error">{error}</div>}
                
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Logging in...' : '🔑 Login'}
                </button>

                <div className="auth-divider">
                  <hr />
                  <span>OR</span>
                  <hr />
                </div>

                <button 
                  type="button"
                  className="auth-btn-secondary"
                  onClick={() => { setIsLogin(false); setError(''); }}
                >
                  📝 New User? Create Account
                </button>
              </form>
            ) : (
              // ✅ SIGNUP FORM (With OTP Verification)
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <div className="phone-input-group">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={otpVerified}
                      className={otpVerified ? 'verified' : ''}
                    />
                    {!otpVerified ? (
                      <button 
                        type="button"
                        onClick={() => setShowOTP(true)}
                        className="verify-phone-btn"
                      >
                        📱 Verify
                      </button>
                    ) : (
                      <span className="verified-badge">✅ Verified</span>
                    )}
                  </div>
                  {otpVerified && (
                    <span className="field-hint success">Phone verified: {formData.phone}</span>
                  )}
                  {!otpVerified && (
                    <span className="field-hint">Verify your phone to complete signup</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}
                
                <button type="submit" className="auth-btn" disabled={loading || !otpVerified}>
                  {loading ? 'Creating Account...' : '🚀 Create Account'}
                </button>

                {!otpVerified && (
                  <p className="auth-note">
                    ⚠️ Please verify your phone number before creating account
                  </p>
                )}

                <div className="auth-divider">
                  <hr />
                  <span>OR</span>
                  <hr />
                </div>

                <button 
                  type="button"
                  className="auth-btn-secondary"
                  onClick={() => { setIsLogin(true); setError(''); }}
                >
                  🔑 Already have an account? Login
                </button>
              </form>
            )}

            {/* OTP Modal for Signup */}
            {showOTP && (
              <OTPLogin 
                onVerified={handleOTPVerified}
                onClose={() => setShowOTP(false)}
                purpose="signup"
              />
            )}
          </>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <p className="reset-text">Enter your email to receive a password reset link</p>
            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            {resetMessage && <p className="reset-success">{resetMessage}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button 
              type="button" 
              className="auth-btn-secondary"
              onClick={() => { setShowForgotPassword(false); setError(''); }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;