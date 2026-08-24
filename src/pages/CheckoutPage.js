import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CheckoutPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function CheckoutPage() {
  const navigate = useNavigate();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showUPIApps, setShowUPIApps] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  
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
  const [platformFee, setPlatformFee] = useState(20);
  const [gstPercent, setGstPercent] = useState(12);
  const [gstAmount, setGstAmount] = useState(0);
  const [handlingFee, setHandlingFee] = useState(10);
  const [finalTotal, setFinalTotal] = useState(0);
  
  const [orderId, setOrderId] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  
  // UPI Apps
  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '📱', scheme: 'gpay://upi/pay?', color: '#4285F4' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱', scheme: 'upi://pay?', color: '#5F259F' },
    { id: 'paytm', name: 'Paytm', icon: '📱', scheme: 'paytmmp://upi/pay?', color: '#00BAF2' },
    { id: 'bhim', name: 'BHIM UPI', icon: '📱', scheme: 'bhim://upi/pay?', color: '#00838F' },
    { id: 'other', name: 'Other UPI App', icon: '📱', scheme: 'upi://pay?', color: '#666' }
  ];

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
  }, []);

  const calculateTotals = (cartItems) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(subtotal);
    
    const shipping = subtotal > 999 ? 0 : 60;
    setShippingFee(shipping);
    
    const platform = 20;
    setPlatformFee(platform);
    
    const gst = Math.round((subtotal + shipping + platform) * (gstPercent / 100));
    setGstAmount(gst);
    
    const handling = 10;
    setHandlingFee(handling);
    
    const total = subtotal + shipping + platform + gst + handling - couponDiscount;
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

  // Coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponError('');
    setCouponSuccess('');

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
        setCouponSuccess(`✅ Coupon applied! You saved ₹${discountAmount}`);
        setCouponError('');
        calculateTotals(cart);
      } else {
        setCouponError(response.data.message || 'Invalid coupon');
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  const copyUPI = () => {
    if (paymentMethod?.upiId) {
      navigator.clipboard.writeText(paymentMethod.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // ✅ FIXED: createOrder with correct productId
  const createOrder = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const cart = JSON.parse(localStorage.getItem('loop_cart') || '[]');
      
      if (!selectedAddress) {
        alert('Please add a shipping address');
        return null;
      }
      
      // ✅ IMPORTANT: Map cart items to use productId
      const orderItems = cart.map(item => ({
        productId: item.id,  // ← item.id becomes productId
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || 'M',
        color: item.color || 'Black'
      }));
      
      console.log('📦 Order items:', orderItems);
      
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
        items: orderItems,  // ← Use mapped items
        subtotal: subtotal,
        shipping: shippingFee,
        platformFee: platformFee,
        gstPercent: gstPercent,
        gstAmount: gstAmount,
        handlingFee: handlingFee,
        discount: couponDiscount,
        couponCode: couponCode || '',
        total: finalTotal,
        paymentMethod: 'razorpay'
      };

      console.log('📦 Creating order with data:', orderData);

      const response = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Order created:', response.data);
      return response.data;
      
    } catch (err) {
      console.error('Error creating order:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status:', err.response?.status);
      throw err;
    }
  };

  // Clear cart after order
  const clearCartAfterOrder = async () => {
    try {
      localStorage.removeItem('loop_cart');
      const token = localStorage.getItem('loop_token');
      if (token) {
        await axios.delete(`${API_URL}/api/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Initiate UPI Payment
  const initiateUPIPayment = async (app) => {
    if (!selectedAddress) {
      alert('Please add a shipping address first');
      return;
    }
    
    setProcessing(true);
    setPaymentStatus('pending');
    setShowUPIApps(false);
    setPollAttempts(0);
    setShowSupport(false);
    
    try {
      const order = await createOrder();
      if (!order) {
        setProcessing(false);
        return;
      }
      
      setOrderId(order.orderId);
      
      const upiId = paymentMethod.upiId;
      const amount = finalTotal;
      const orderId = order.orderId;
      const name = 'LOOP Store';
      const note = `Payment for Order ${orderId}`;
      
      const params = new URLSearchParams({
        pa: upiId,
        pn: name,
        am: amount.toString(),
        cu: 'INR',
        tn: note
      });
      
      const upiLink = `${app.scheme}${params.toString()}`;
      
      window.location.href = upiLink;
      
      setPaymentStatus('verifying');
      startPaymentVerification(order.orderId, order);
      
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setPaymentStatus('failed');
      setProcessing(false);
      setShowSupport(true);
    }
  };

  // Start Payment Verification
  const startPaymentVerification = (orderId, order) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      setPollAttempts(attempts);
      
      try {
        const response = await axios.get(`${API_URL}/api/orders/verify/${orderId}`);
        
        if (response.data.paymentStatus === 'paid') {
          clearInterval(pollInterval);
          setPaymentStatus('confirmed');
          setProcessing(false);
          setShowSupport(false);
          
          await clearCartAfterOrder();
          
          navigate('/order-confirmation', { 
            state: { order: response.data.order }
          });
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          setProcessing(false);
          setShowSupport(true);
        }
        
      } catch (err) {
        console.error('Verification error:', err);
      }
    }, 10000);
    
    window.paymentPollInterval = pollInterval;
  };

  // Initiate Razorpay Payment
  const initiateRazorpayPayment = async () => {
    if (!selectedAddress) {
      alert('Please add a shipping address first');
      return;
    }
    
    setProcessing(true);
    setPaymentStatus('pending');
    setShowUPIApps(false);
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
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
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

  // Verify Razorpay Payment
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

  // Cleanup on unmount
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
              
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Item Total ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping Fee</span>
                  <span>₹{shippingFee}</span>
                </div>
                <div className="summary-row">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="summary-row">
                  <span>GST ({gstPercent}%)</span>
                  <span>₹{gstAmount}</span>
                </div>
                <div className="summary-row">
                  <span>Handling Fee</span>
                  <span>₹{handlingFee}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="summary-row discount">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span><strong>Total Amount</strong></span>
                  <span><strong>₹{finalTotal}</strong></span>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="checkout-section coupon-section">
              <div className="section-header">
                <h3>🎟️ Coupon Code</h3>
              </div>
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button onClick={applyCoupon}>Apply</button>
              </div>
              {couponError && <p className="coupon-error">{couponError}</p>}
              {couponSuccess && <p className="coupon-success">{couponSuccess}</p>}
            </div>

            {/* Payment */}
            <div className="checkout-section payment-section">
              <div className="section-header">
                <h3>💳 Payment</h3>
              </div>
              
              <div className="payment-options">
                <button 
                  className={`payment-option ${selectedPayment === 'razorpay' ? 'active' : ''}`}
                  onClick={() => setSelectedPayment('razorpay')}
                >
                  💳 Card / UPI (Razorpay)
                </button>
                <button 
                  className={`payment-option ${selectedPayment === 'upi' ? 'active' : ''}`}
                  onClick={() => setSelectedPayment('upi')}
                >
                  📱 UPI App
                </button>
              </div>

              {selectedPayment === 'upi' && paymentMethod && (
                <div className="upi-payment-details">
                  <div className="upi-qr-section">
                    {paymentMethod.qrCode ? (
                      <img src={paymentMethod.qrCode} alt="UPI QR" />
                    ) : (
                      <div className="qr-placeholder">📱</div>
                    )}
                    <div className="upi-id-section">
                      <span className="upi-label">UPI ID</span>
                      <div className="upi-id-display">
                        <code>{paymentMethod.upiId}</code>
                        <button onClick={copyUPI} className="copy-btn">
                          {copied ? '✅' : '📋'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="payment-buttons">
                {selectedPayment === 'razorpay' ? (
                  <button
                    className="pay-btn razorpay-btn"
                    onClick={initiateRazorpayPayment}
                    disabled={!selectedAddress || processing}
                  >
                    {processing ? '⏳ Processing...' : '💳 Pay with Razorpay'}
                  </button>
                ) : (
                  <>
                    <button
                      className="pay-btn upi-btn"
                      onClick={() => setShowUPIApps(!showUPIApps)}
                      disabled={!selectedAddress || processing}
                    >
                      {processing ? '⏳ Processing...' : '📱 Pay with UPI App'}
                    </button>
                    
                    {showUPIApps && !processing && (
                      <div className="upi-apps-grid">
                        {upiApps.map((app) => (
                          <button
                            key={app.id}
                            className="upi-app-btn"
                            onClick={() => initiateUPIPayment(app)}
                            style={{ borderColor: app.color }}
                          >
                            <span className="app-icon">{app.icon}</span>
                            <span className="app-name">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
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
                  <p className="verification-hint">Please complete the payment in your UPI app</p>
                  <p className="verification-attempts">Attempt {pollAttempts}/30</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="payment-failed">
                  <p>❌ Payment Verification Failed</p>
                  <p className="failed-hint">If you've already made the payment, please contact support.</p>
                  {orderId && (
                    <p className="order-id-display">📋 Order ID: {orderId}</p>
                  )}
                  <button 
                    className="retry-btn"
                    onClick={() => { setPaymentStatus('pending'); setProcessing(false); setShowSupport(false); setPollAttempts(0); }}
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