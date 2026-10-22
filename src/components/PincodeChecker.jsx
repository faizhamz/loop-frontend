import React, { useState } from 'react';
import axios from 'axios';
import './PincodeChecker.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function PincodeChecker({ weight = 0.5, onServiceable = null }) {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const check = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!/^\d{6}$/.test(pincode)) {
      setError('Enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/shiprocket/check-pincode`, {
        pincode,
        weight
      });
      setResult(response.data);
      if (onServiceable) onServiceable(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not check delivery');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="pincode-checker">
      <div className="pincode-checker-header">
        <span className="pincode-checker-icon">📦</span>
        <span className="pincode-checker-title">Check delivery</span>
      </div>

      <form onSubmit={check} className="pincode-checker-form">
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="pincode-checker-input"
        />
        <button type="submit" disabled={loading} className="pincode-checker-btn">
          {loading ? '...' : 'Check'}
        </button>
      </form>

      {error && <div className="pincode-checker-error">❌ {error}</div>}

      {result && result.serviceable && (
        <div className="pincode-checker-success">
          <div>✅ <strong>Delivery by {formatDate(result.estimatedDelivery)}</strong></div>
          <div className="pincode-checker-note">
            {result.estimatedDays} days · Free shipping
          </div>
        </div>
      )}

      {result && !result.serviceable && (
        <div className="pincode-checker-error">
          ❌ Not serviceable at {pincode} yet
        </div>
      )}
    </div>
  );
}

export default PincodeChecker;