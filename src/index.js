import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './App.css';
import './pages/OrderHistory.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { initMetaPixel } from './utils/metaPixel';
import { initGA } from './utils/googleAnalytics';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// ✅ Initialize Tracking
initMetaPixel();
initGA();

// ✅ Track visitor
const trackVisitor = async () => {
  try {
    let visitorId = localStorage.getItem('loop_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('loop_visitor_id', visitorId);
    }
    
    // Get user ID if logged in
    let userId = null;
    const userData = localStorage.getItem('loop_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      } catch (e) {}
    }
    
    await axios.post(`${API_URL}/api/analytics/track/visitor`, {
      visitorId,
      userId: userId
    }).catch(() => {});
  } catch (err) {
    // Silently fail - tracking is non-critical
  }
};

// Track visitor on page load
trackVisitor();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);