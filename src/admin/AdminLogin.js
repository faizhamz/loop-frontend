import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Check if already logged in
    const loggedIn = localStorage.getItem('admin_logged_in');
    const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
    
    console.log('🔍 AdminLogin - Checking existing session:', { loggedIn, tokenExists: !!token });
    
    if (loggedIn === 'true' && token) {
      console.log('✅ Admin already logged in, redirecting to dashboard...');
      onLogin(true);
      return;
    }
    
    // ✅ Load saved credentials if "Remember Me" was checked
    const savedEmail = localStorage.getItem('admin_email');
    const savedPassword = localStorage.getItem('admin_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('🔑 Admin login attempt:', { email, password: '***' });
    
    try {
      // ✅ REAL API CALL - Use your actual user account
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email,
        password: password
      });
      
      console.log('✅ Login response:', response.data);
      
      const user = response.data.user;
      const token = response.data.token;
      
      // ✅ Check if user is admin
      if (user.role !== 'admin') {
        setError('❌ This account does not have admin privileges. Please contact support.');
        setLoading(false);
        return;
      }
      
      // ✅ Set authentication tokens
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('loop_token', token);
      localStorage.setItem('admin_token', token);
      localStorage.setItem('loop_user', JSON.stringify(user));
      
      // ✅ Save credentials if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_password', password);
      } else {
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_password');
      }
      
      console.log('✅ Admin login successful!');
      
      // ✅ Call the onLogin callback to notify parent
      onLogin(true);
      
    } catch (err) {
      console.error('❌ Admin login error:', err);
      
      if (err.response?.status === 401) {
        setError('❌ Invalid email or password. Please try again.');
      } else if (err.response?.status === 404) {
        setError('❌ Account not found. Please check your email.');
      } else {
        setError(err.response?.data?.error || '❌ Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <span className="logo-l">L</span>
          <span className="logo-infinity">∞</span>
          <span className="logo-p">P</span>
        </div>
        <h1>Admin Panel</h1>
        <p>Enter your credentials to continue</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>
          
          {error && <div className="admin-error">{error}</div>}
          
          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <p>Use your customer account with admin privileges</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;