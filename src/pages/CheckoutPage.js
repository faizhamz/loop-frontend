import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clearCartInDatabase } from '../utils/cartSync';
import './CheckoutPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function CheckoutPage() {
  const navigate = useNavigate();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [pollAttempts, setPollAttempts] = useState(0);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [maxDiscountInfo, setMaxDiscountInfo] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  
  // Address States
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  
  // Address Form
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    landmark: '',
    label: 'Home',
    isDefault: false
  });
  
  // Fee States
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(60);
  const [platformFee, setPlatformFee] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [showSupport, setShowSupport] = useState(false);

  // Load cart and user data
  useEffect(() => {
    const savedCart = localStorage.getItem('loop_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      calculateTotals(parsedCart);
    }
    
    const token = localStorage.getItem('loop_token');
    const userData = localStorage.getItem('loop_user');
    
    if (token && userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        setIsLoggedIn(true);
        
        if (userObj.addresses && userObj.addresses.length > 0) {
          setSavedAddresses(userObj.addresses);
          const defaultAddr = userObj.addresses.find(a => a.isDefault);
          setSelectedAddress(defaultAddr || userObj.addresses[0]);
        } else {
          setShowAddressForm(true);
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    } else {
      setShowAddressForm(true);
    }
    
    fetchActivePayment();
    fetchAvailableCoupons();
  }, []);

  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await axios.get(`${API_URL}/api/coupons/available`);
      setAvailableCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const calculateTotals = (cartItems) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(subtotal);
    
    const shipping = subtotal > 999 ? 0 : 60;
    setShippingFee(shipping);
    
    const platform = 0;
    setPlatformFee(platform);
    
    const handling = 0;
    setHandlingFee(handling);
    
    const total = subtotal + shipping + platform + handling - couponDiscount;
    setFinalTotal(total);
  };

  const fetchActivePayment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payment-methods/active`);
      setPaymentMethod(response.data);
    } catch (error) {
      console.error('Error fetching payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  // Address Form Handlers
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData({
      ...addressFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    if (!addressFormData.name || !addressFormData.street || !addressFormData.city || 
        !addressFormData.state || !addressFormData.pincode || !addressFormData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (isLoggedIn && user) {
      try {
        const token = localStorage.getItem('loop_token');
        let updatedAddresses;
        
        if (isEditingAddress && editingAddressIndex !== null) {
          updatedAddresses = [...savedAddresses];
          updatedAddresses[editingAddressIndex] = addressFormData;
        } else {
          updatedAddresses = [...savedAddresses, addressFormData];
        }
        
        if (addressFormData.isDefault) {
          updatedAddresses = updatedAddresses.map(addr => ({
            ...addr,
            isDefault: addr === addressFormData || (isEditingAddress && savedAddresses.indexOf(addr) === editingAddressIndex)
          }));
        }
        
        await axios.put(
          `${API_URL}/api/users/${user.id}`,
          { addresses: updatedAddresses },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSavedAddresses(updatedAddresses);
        setSelectedAddress(addressFormData);
        setShowAddressForm(false);
        setIsEditingAddress(false);
        setEditingAddressIndex(null);
        
        const updatedUser = { ...user, addresses: updatedAddresses };
        setUser(updatedUser);
        localStorage.setItem('loop_user', JSON.stringify(updatedUser));
        
      } catch (err) {
        alert('Failed to save address. Please try again.');
      }
    } else {
      setSelectedAddress(addressFormData);
      setShowAddressForm(false);
      setIsEditingAddress(false);
    }
  };

  const editAddress = (index) => {
    setAddressFormData(savedAddresses[index]);
    setIsEditingAddress(true);
    setEditingAddressIndex(index);
    setShowAddressForm(true);
  };

  const selectSavedAddress = (address) => {
    setSelectedAddress(address);
  };

  // ✅ Coupon Functions
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponError('');
    setCouponSuccess('');
    setCouponDiscount(0);
    setMaxDiscountInfo(null);

    try {
      const token = localStorage.getItem('loop_token');
      const userId = user?.id || null;

      const response = await axios.post(`${API_URL}/api/coupons/validate`, {
        code: couponCode.toUpperCase(),
        userId,
        cartTotal: subtotal
      });

      if (response.data.valid) {
        const discountAmount = response.data.discountAmount || 0;
        setCouponDiscount(discountAmount);
        setAppliedCoupon(response.data);
        
        if (response.data.maxDiscount > 0 && response.data.discountPercent > 0) {
          setMaxDiscountInfo({
            maxDiscount: response.data.maxDiscount,
            discountPercent: response.data.discountPercent,
            effectiveDiscountPercent: response.data.effectiveDiscountPercent || response.data.discountPercent,
            maxApplied: response.data.maxDiscountApplied
          });
        }
        
        const discountMessage = response.data.maxDiscountApplied 
          ? `✅ Coupon applied! Max discount of ₹${response.data.maxDiscount} applied (${response.data.effectiveDiscountPercent || response.data.discountPercent}%)`
          : `✅ Coupon applied! You saved ₹${discountAmount} (${response.data.discountPercent}%)`;
        
        setCouponSuccess(discountMessage);
        setCouponError('');
        calculateTotals(cart);
      } else {
        setCouponError(response.data.message || 'Invalid coupon');
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setCouponDiscount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    setMaxDiscountInfo(null);
    setAppliedCoupon(null);
    calculateTotals(cart);
  };

  const quickApplyCoupon = (coupon) => {
    setCouponCode(coupon.code);
    setShowAvailableCoupons(false);
    // Auto apply after a brief delay
    setTimeout(() => applyCoupon(), 300);
  };

  const createOrder = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const cart = JSON.parse(localStorage.getItem('loop_cart') || '[]');
      
      if (!selectedAddress) {
        alert('Please add a shipping address');
        return null;
      }
      
      const orderItems = cart.map(item => ({
        productId: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || 'M',
        color: item.color || 'Black'
      }));
      
      const orderData = {
        customer: {
          name: selectedAddress.name || user?.name || 'Guest',
          email: user?.email || 'guest@loop.in',
          phone: selectedAddress.phone || user?.phone || '',
          address: {
            street: selectedAddress.street || '',
            city: selectedAddress.city || '',
            state: selectedAddress.state || '',
            pincode: selectedAddress.pincode || '',
            landmark: selectedAddress.landmark || ''
          }
        },
        userId: user?._id || null,
        items: orderItems,
        subtotal: subtotal,
        shipping: shippingFee,
        platformFee: platformFee,
        handlingFee: handlingFee,
        discount: couponDiscount,
        couponCode: couponCode || '',
        total: finalTotal,
        paymentMethod: 'razorpay'
      };

      const response = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const clearCartAfterOrder = async () => {
    try {
      localStorage.removeItem('loop_cart');
      const token = localStorage.getItem('loop_token');
      if (token) {
        await clearCartInDatabase();
      }
      console.log('✅ Cart cleared after order');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const initiateRazorpayPayment = async () => {
    if (!selectedAddress) {
      alert('Please add a shipping address first');
      return;
    }
    
    setProcessing(true);
    setPaymentStatus('pending');
    setPollAttempts(0);
    setShowSupport(false);
    
    try {
      const order = await createOrder();
      if (!order) {
        setProcessing(false);
        return;
      }
      
      setOrderId(order.orderId);
      
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(`${API_URL}/api/create-razorpay-order`, {
        amount: finalTotal,
        orderId: order.orderId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const razorpayOrder = response.data;
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_TTXVg2yp3HlxlP',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'LOOP Store',
        description: `Order ${order.orderId}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: order.customer?.name || '',
          email: order.customer?.email || '',
          contact: order.customer?.phone || ''
        },
        notes: {
          order_id: order.orderId
        },
        theme: {
          color: '#D4AF37'
        },
        handler: function(response) {
          verifyRazorpayPayment(response, order.orderId);
        },
        modal: {
          ondismiss: function() {
            // Cancel the order when user closes Razorpay
            axios.post(`${API_URL}/api/orders/cancel-pending/${order.orderId}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
            
            setProcessing(false);
            setPaymentStatus('pending');
            alert('Payment was not completed. Please try again when you are ready.');
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      console.error('Razorpay error:', err);
      setProcessing(false);
      setPaymentStatus('failed');
      setShowSupport(true);
      alert(err.response?.data?.error || 'Payment initiation failed. Please try again.');
    }
  };

  const verifyRazorpayPayment = async (paymentResponse, orderId) => {
    setPaymentStatus('verifying');
    
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(`${API_URL}/api/verify-razorpay-payment`, {
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        orderId: orderId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPaymentStatus('confirmed');
        setProcessing(false);
        
        await clearCartAfterOrder();
        
        navigate('/order-confirmation', { 
          state: { order: response.data.order }
        });
      } else {
        setPaymentStatus('failed');
        setProcessing(false);
        setShowSupport(true);
        alert(response.data.error || 'Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setPaymentStatus('failed');
      setProcessing(false);
      setShowSupport(true);
      alert('Payment verification failed. Please contact support.');
    }
  };

  useEffect(() => {
    return () => {
      if (window.paymentPollInterval) {
        clearInterval(window.paymentPollInterval);
      }
    };
  }, []);

  if (loading) {
    return <div className="checkout-loading"><div className="kawaii-spinner"></div><p>Loading checkout...</p></div>;
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before checking out.</p>
        <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page-modern">
      <div className="container">
        <div className="checkout-header">
          <h1>🛒 Checkout</h1>
          <p>Review your order and complete payment</p>
        </div>

        <div className="checkout-grid">
          {/* Left Column - Address & Items */}
          <div className="checkout-left">
            {/* Address Section */}
            <div className="checkout-section">
              <div className="section-header">
                <h3>📍 Shipping Address</h3>
              </div>
              
              {isLoggedIn && savedAddresses.length > 0 && !showAddressForm && (
                <div className="address-list">
                  {savedAddresses.map((addr, index) => (
                    <div 
                      key={index}
                      className={`address-card ${selectedAddress === addr ? 'selected' : ''}`}
                      onClick={() => selectSavedAddress(addr)}
                    >
                      <div className="address-card-left">
                        <span className="address-label">{addr.label}</span>
                        <span className="address-name">{addr.name}</span>
                        <span className="address-detail">{addr.street}</span>
                        <span className="address-detail">{addr.city}, {addr.state} - {addr.pincode}</span>
                        <span className="address-phone">📞 {addr.phone}</span>
                      </div>
                      <div className="address-card-right">
                        {addr.isDefault && <span className="default-badge">Default</span>}
                        <button 
                          className="edit-address-btn"
                          onClick={(e) => { e.stopPropagation(); editAddress(index); }}
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    className="add-address-btn"
                    onClick={() => { setShowAddressForm(true); setIsEditingAddress(false); setAddressFormData({ name: '', street: '', city: '', state: '', pincode: '', phone: '', landmark: '', label: 'Home', isDefault: false }); }}
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="address-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={addressFormData.name}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={addressFormData.phone}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        name="street"
                        placeholder="Street Address"
                        value={addressFormData.street}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={addressFormData.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={addressFormData.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        value={addressFormData.pincode}
                        onChange={handleAddressChange}
                        required
                        maxLength="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        placeholder="Landmark (optional)"
                        value={addressFormData.landmark}
                        onChange={handleAddressChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Label</label>
                      <select
                        name="label"
                        value={addressFormData.label}
                        onChange={handleAddressChange}
                      >
                        <option value="Home">🏠 Home</option>
                        <option value="Work">💼 Work</option>
                        <option value="Other">📍 Other</option>
                      </select>
                    </div>
                    {isLoggedIn && (
                      <div className="form-group full-width checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={addressFormData.isDefault}
                            onChange={handleAddressChange}
                          />
                          Set as default address
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-address-btn">
                      {isEditingAddress ? '💾 Update Address' : '✅ Use This Address'}
                    </button>
                    {(isLoggedIn && savedAddresses.length > 0) && (
                      <button 
                        type="button" 
                        className="cancel-address-btn"
                        onClick={() => { setShowAddressForm(false); setIsEditingAddress(false); }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Items Review */}
            <div className="checkout-section">
              <div className="section-header">
                <h3>🛒 Items in Cart</h3>
                <span className="item-count">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>
              <div className="cart-items-review">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item-review">
                    <div className="item-review-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>🎀</span>
                      )}
                    </div>
                    <div className="item-review-info">
                      <span className="item-review-name">{item.name}</span>
                      <span className="item-review-detail">Qty: {item.quantity} × ₹{item.price}</span>
                    </div>
                    <div className="item-review-total">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary & Payment */}
          <div className="checkout-right">
            {/* Order Summary */}
            <div className="checkout-section summary-section">
              <div className="section-header">
                <h3>💰 Order Summary</h3>
              </div>
              
              {/* Free Shipping Progress */}
              {subtotal > 0 && subtotal < 999 && (
                <div className="free-shipping-progress">
                  <div className="free-shipping-info">
                    <span className="free-shipping-icon">🚚</span>
                    <span className="free-shipping-text">
                      Add <strong>₹{999 - subtotal}</strong> more for FREE Shipping!
                    </span>
                  </div>
                  <div className="free-shipping-bar">
                    <div 
                      className="free-shipping-bar-fill" 
                      style={{ width: `${Math.min((subtotal / 999) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="free-shipping-status">
                    <span>Progress</span>
                    <span className="progress-amount">₹{subtotal} / ₹999</span>
                  </div>
                </div>
              )}

              {subtotal >= 999 && (
                <div className="free-shipping-applied">
                  <span>✅</span>
                  <span>Free Shipping Applied! 🎉</span>
                </div>
              )}

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Item Total ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                
                <div className="summary-row">
                  <span>🚚 Shipping Fee</span>
                  {shippingFee === 0 ? (
                    <span className="free-badge shipping">FREE</span>
                  ) : (
                    <span>₹{shippingFee}</span>
                  )}
                </div>
                
                <div className="summary-row">
                  <span>✨ Platform Fee</span>
                  <span className="free-badge platform">FREE</span>
                </div>
                
                <div className="summary-row">
                  <span>💫 Handling Fee</span>
                  <span className="free-badge handling">FREE</span>
                </div>
                
                {/* ✅ Show coupon discount with visual */}
                {couponDiscount > 0 && (
                  <div className="summary-row discount" style={{ 
                    background: 'rgba(40, 167, 69, 0.08)',
                    padding: '6px 0',
                    borderRadius: '4px',
                    margin: '2px 0'
                  }}>
                    <span>
                      🎟️ Coupon Discount
                      {appliedCoupon && (
                        <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>
                          ({appliedCoupon.code})
                        </span>
                      )}
                      {maxDiscountInfo?.maxApplied && (
                        <span style={{ fontSize: '11px', color: '#ff8800', marginLeft: '4px' }}>
                          (Max ₹{maxDiscountInfo.maxDiscount})
                        </span>
                      )}
                    </span>
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>-₹{couponDiscount}</span>
                  </div>
                )}
                
                <div className="summary-divider"></div>
                <div className="summary-row total" style={{ fontSize: '20px' }}>
                  <span><strong>💰 Total Amount</strong></span>
                  <span style={{ color: '#D4AF37' }}><strong>₹{finalTotal}</strong></span>
                </div>
              </div>
            </div>

            {/* ✅ Coupon Section - Beautiful UI */}
            <div className="checkout-section coupon-section" style={{ 
              border: couponDiscount > 0 ? '2px solid #28a745' : '1px solid #333',
              transition: 'all 0.3s ease'
            }}>
              <div className="section-header">
                <h3>🎟️ Apply Coupon</h3>
                {couponDiscount > 0 && (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                    ✅ Applied
                  </span>
                )}
              </div>
              
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponDiscount > 0}
                  style={{ 
                    opacity: couponDiscount > 0 ? 0.6 : 1,
                    borderColor: couponDiscount > 0 ? '#28a745' : undefined
                  }}
                />
                {couponDiscount > 0 ? (
                  <button 
                    onClick={removeCoupon}
                    style={{ 
                      background: '#ff4444',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Remove
                  </button>
                ) : (
                  <button 
                    onClick={applyCoupon}
                    style={{ 
                      background: '#D4AF37',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
              
              {/* ✅ Coupon Applied Success Message */}
              {couponSuccess && (
                <div style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  background: 'rgba(40, 167, 69, 0.1)',
                  border: '1px solid rgba(40, 167, 69, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div>
                    <span style={{ color: '#28a745' }}>✅</span>
                    <span style={{ color: '#ccc', marginLeft: '8px' }}>{couponSuccess}</span>
                  </div>
                  {maxDiscountInfo && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {maxDiscountInfo.maxApplied ? (
                        <span style={{ color: '#ff8800' }}>
                          Max discount ₹{maxDiscountInfo.maxDiscount} applied 
                          ({maxDiscountInfo.effectiveDiscountPercent || maxDiscountInfo.discountPercent}%)
                        </span>
                      ) : (
                        <span style={{ color: '#28a745' }}>
                          {maxDiscountInfo.discountPercent}% off • Max ₹{maxDiscountInfo.maxDiscount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* ✅ Coupon Error */}
              {couponError && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid rgba(255, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#ff4444',
                  fontSize: '13px'
                }}>
                  {couponError}
                </div>
              )}

              {/* ✅ Available Coupons Section */}
              {availableCoupons.length > 0 && !couponDiscount && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#D4AF37',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {showAvailableCoupons ? '▲ Hide available coupons' : '▼ Show available coupons'}
                    <span style={{ fontSize: '11px', color: '#666' }}>
                      ({availableCoupons.length} available)
                    </span>
                  </button>

                  {showAvailableCoupons && (
                    <div style={{ 
                      marginTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {availableCoupons.map((coupon) => (
                        <div
                          key={coupon._id}
                          onClick={() => quickApplyCoupon(coupon)}
                          style={{
                            padding: '12px 16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#D4AF37';
                            e.currentTarget.style.background = '#222';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.background = '#1a1a1a';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#D4AF37' }}>
                              {coupon.code}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {coupon.name || coupon.description}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}% OFF`
                                : `₹${coupon.discountValue} OFF`
                              }
                            </div>
                            {coupon.maxDiscount > 0 && (
                              <div style={{ fontSize: '11px', color: '#888' }}>
                                Max ₹{coupon.maxDiscount}
                              </div>
                            )}
                            {coupon.minOrderValue > 0 && (
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                Min ₹{coupon.minOrderValue}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment - Razorpay Only */}
            <div className="checkout-section payment-section">
              <div className="section-header">
                <h3>💳 Payment</h3>
              </div>
              
              <div className="payment-buttons">
                <button
                  className="pay-btn razorpay-btn"
                  onClick={initiateRazorpayPayment}
                  disabled={!selectedAddress || processing}
                  style={{ width: '100%' }}
                >
                  {processing ? '⏳ Processing...' : '💳 Pay with Razorpay'}
                </button>
              </div>

              {processing && (
                <div className="processing-indicator">
                  <div className="kawaii-spinner-small"></div>
                  <p>Processing your payment...</p>
                </div>
              )}

              {paymentStatus === 'verifying' && (
                <div className="verification-status">
                  <div className="kawaii-spinner-small"></div>
                  <p>⏳ Waiting for payment confirmation...</p>
                  <p className="verification-hint">Please complete the payment in the Razorpay window</p>
                  <p className="verification-attempts">Attempt {pollAttempts}/30</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="payment-failed">
                  <p>❌ Payment Failed</p>
                  <p className="failed-hint">Please try again or use a different payment method.</p>
                  {orderId && (
                    <p className="order-id-display">📋 Order ID: {orderId}</p>
                  )}
                  <button 
                    className="retry-btn"
                    onClick={() => { setPaymentStatus('pending'); setProcessing(false); setPollAttempts(0); }}
                  >
                    🔄 Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;