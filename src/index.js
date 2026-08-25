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

// ✅ Initialize Tracking
initMetaPixel();
initGA();

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