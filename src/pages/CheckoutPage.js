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
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('🛒 Cart loaded:', parsedCart);
        setCart(parsedCart);
        calculateTotals(parsedCart);
      } catch (e) {
        console.error('Error parsing cart:', e);
        setCart([]);
      }
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

  // ✅ Fetch available coupons
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

  // ✅ FIXED: Calculate totals with proper price handling
  const calculateTotals = (cartItems) => {
    // Make sure cartItems is an array
    const items = cartItems || [];
    
    console.log('📦 Calculating totals for:', items.length, 'items');
    
    // Calculate subtotal with proper price fallback
    const subtotal = items.reduce((sum, item) => {
      // Try multiple price field names
      const price = item.price || 
                    item.salePrice || 
                    item.productPrice || 
                    item.displayPrice || 
                    item.originalPrice ||
                    item.amount ||
                    item.product?.price ||
                    item.product?.salePrice ||
                    0;
      
      const quantity = item.quantity || item.qty || 1;
      const itemTotal = price * quantity;
      
      console.log(`📦 ${item.name || 'Item'}: ₹${price} × ${quantity} = ₹${itemTotal}`);
      
      return sum + itemTotal;
    }, 0);
    
    console.log('💰 Subtotal calculated:', subtotal);
    setSubtotal(subtotal);
    
    const shipping = subtotal > 999 ? 0 : 60;
    setShippingFee(shipping);
    
    const platform = 0;
    setPlatformFee(platform);
    
    const handling = 0;
    setHandlingFee(handling);
    
    const total = subtotal + shipping + platform + handling - couponDiscount;
    console.log('💰 Final total:', total);
    setFinalTotal(total);
  };

  // ✅ Recalculate when coupon changes
  useEffect(() => {
    if (cart.length > 0) {
      calculateTotals(cart);
    }
  }, [couponDiscount]);

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

  // ✅ Apply Coupon
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

      console.log('🎟️ Applying coupon:', couponCode, 'Subtotal:', subtotal);

      const response = await axios.post(`${API_URL}/api/coupons/validate`, {
        code: couponCode.toUpperCase(),
        userId,
        cartTotal: subtotal
      });

      console.log('🎟️ Coupon response:', response.data);

      if (response.data.valid) {
        const discountAmount = response.data.discountAmount || 0;
        console.log('🎟️ Discount amount:', discountAmount);
        setCouponDiscount(discountAmount);
        setAppliedCoupon(response.data);
        setCouponSuccess(`✅ You saved ₹${discountAmount}`);
        setCouponError('');
        // Recalculate with new discount
        calculateTotals(cart);
      } else {
        setCouponError(response.data.message || 'Invalid coupon');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      setCouponError(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  // ✅ Remove Coupon
  const removeCoupon = () => {
    console.log('🎟️ Removing coupon');
    setCouponDiscount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    setAppliedCoupon(null);
    calculateTotals(cart);
  };

  // ✅ FIXED: Direct apply coupon without state delay
const quickApplyCoupon = (coupon) => {
  console.log('🎟️ Quick apply:', coupon.code);
  setShowAvailableCoupons(false);
  
  // Directly apply the coupon without waiting for state
  applyCouponDirect(coupon.code);
};

// ✅ NEW: Direct coupon application
const applyCouponDirect = async (code) => {
  if (!code || !code.trim()) {
    setCouponError('Please enter a coupon code');
    return;
  }

  setCouponError('');
  setCouponSuccess('');
  setCouponCode(code); // Update UI

  try {
    const token = localStorage.getItem('loop_token');
    const userId = user?.id || null;

    console.log('🎟️ Applying coupon directly:', code, 'Subtotal:', subtotal);

    const response = await axios.post(`${API_URL}/api/coupons/validate`, {
      code: code.toUpperCase(),
      userId,
      cartTotal: subtotal
    });

    console.log('🎟️ Coupon response:', response.data);

    if (response.data.valid) {
      const discountAmount = response.data.discountAmount || 0;
      console.log('🎟️ Discount amount:', discountAmount);
      setCouponDiscount(discountAmount);
      setAppliedCoupon(response.data);
      setCouponSuccess(`✅ You saved ₹${discountAmount}`);
      setCouponError('');
      calculateTotals(cart);
    } else {
      setCouponError(response.data.message || 'Invalid coupon');
    }
  } catch (error) {
    console.error('Coupon error:', error);
    setCouponError(error.response?.data?.message || 'Failed to apply coupon');
  }
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
        productId: item._id || item.id || item.productId,
        name: item.name,
        price: item.price || item.salePrice || item.productPrice || 0,
        quantity: item.quantity || 1,
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

      console.log('📦 Creating order:', orderData);

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
            axios.post(`${API_URL}/api/orders/cancel-pending/${order.orderId}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
            
            setProcessing(false);
            setPaymentStatus('pending');
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
                <span className="item-count">{cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} items</span>
              </div>
              <div className="cart-items-review">
                {cart.map((item, index) => {
                  const price = item.price || item.salePrice || item.productPrice || 0;
                  const quantity = item.quantity || 1;
                  return (
                    <div key={index} className="cart-item-review">
                      <div className="item-review-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <span>🎀</span>
                        )}
                      </div>
                      <div className="item-review-info">
                        <span className="item-review-name">{item.name || 'Product'}</span>
                        <span className="item-review-detail">Qty: {quantity} × ₹{price}</span>
                      </div>
                      <div className="item-review-total">
                        ₹{price * quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Coupon + Order Summary + Payment */}
          <div className="checkout-right">
            
            {/* ============================================ */}
            {/* ✅ COUPON SECTION - ABOVE ORDER SUMMARY */}
            {/* ============================================ */}
            <div className="checkout-section coupon-section">
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Apply Coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponDiscount > 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#222',
                    border: couponDiscount > 0 ? '1px solid #28a745' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    opacity: couponDiscount > 0 ? 0.6 : 1
                  }}
                />
                {couponDiscount > 0 ? (
                  <button
                    onClick={removeCoupon}
                    style={{
                      padding: '12px 20px',
                      background: '#ff4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyCoupon}
                    style={{
                      padding: '12px 20px',
                      background: '#D4AF37',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Success/Error Messages */}
              {couponSuccess && (
                <div style={{ marginTop: '10px', color: '#28a745', fontSize: '13px' }}>
                  ✅ {couponSuccess}
                </div>
              )}
              {couponError && (
                <div style={{ marginTop: '10px', color: '#ff4444', fontSize: '13px' }}>
                  ❌ {couponError}
                </div>
              )}

              {/* ✅ AVAILABLE COUPONS - Expandable Horizontal Chips */}
              {availableCoupons.length > 0 && !couponDiscount && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ 
                      display: 'inline-block',
                      transition: 'transform 0.3s ease',
                      transform: showAvailableCoupons ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                    {showAvailableCoupons ? 'Hide' : 'See available coupons'}
                    <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 'bold' }}>
                      ({availableCoupons.length})
                    </span>
                  </button>

                  {showAvailableCoupons && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        overflowX: 'auto',
                        padding: '4px 0 12px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#D4AF37 transparent',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon._id}
                            onClick={() => quickApplyCoupon(coupon)}
                            style={{
                              padding: '10px 18px',
                              background: 'rgba(212, 175, 55, 0.08)',
                              border: '1px solid rgba(212, 175, 55, 0.15)',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.3s ease',
                              flexShrink: 0,
                              minWidth: 'fit-content'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.18)';
                              e.currentTarget.style.borderColor = '#D4AF37';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <span style={{ fontWeight: 'bold', color: '#D4AF37', fontSize: '14px' }}>
                              {coupon.code}
                            </span>
                            <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '13px' }}>
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}% OFF`
                                : `₹${coupon.discountValue} OFF`
                              }
                            </span>
                            {coupon.minOrderValue > 0 && (
                              <span style={{ color: '#666', fontSize: '11px' }}>
                                • Min ₹{coupon.minOrderValue}
                              </span>
                            )}
                            {coupon.maxDiscount > 0 && coupon.discountType === 'percentage' && (
                              <span style={{ color: '#888', fontSize: '11px' }}>
                                • Max ₹{coupon.maxDiscount}
                              </span>
                            )}
                            <span style={{ color: '#D4AF37', fontSize: '12px', marginLeft: '4px' }}>
                              → Apply
                            </span>
                          </div>
                        ))}
                      </div>
                      {availableCoupons.length > 3 && (
                        <div style={{ fontSize: '10px', color: '#555', textAlign: 'right', marginTop: '-4px' }}>
                          ↕ Scroll for more offers
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No Coupons Available */}
              {availableCoupons.length === 0 && !couponDiscount && (
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#666',
                  textAlign: 'center',
                  padding: '4px 0'
                }}>
                  No coupons available at the moment
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* ✅ ORDER SUMMARY */}
            {/* ============================================ */}
            <div className="checkout-section summary-section">
              <div className="section-header">
                <h3>💰 Order Summary</h3>
              </div>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Item Total ({cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                
                <div className="summary-row">
                  <span>🚚 Shipping</span>
                  {shippingFee === 0 ? (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>FREE</span>
                  ) : (
                    <span>₹{shippingFee}</span>
                  )}
                </div>
                
                <div className="summary-row">
                  <span>✨ Platform Fee</span>
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>FREE</span>
                </div>
                
                <div className="summary-row">
                  <span>💫 Handling Fee</span>
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>FREE</span>
                </div>

                {/* Coupon Discount - Shows when applied */}
                {couponDiscount > 0 && (
                  <div className="summary-row" style={{ color: '#28a745' }}>
                    <span>🎟️ Coupon ({appliedCoupon?.code || 'Applied'})</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="summary-divider"></div>
                
                <div className="summary-row total" style={{ fontSize: '20px' }}>
                  <span><strong>Total</strong></span>
                  <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                    ₹{finalTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* ✅ PAYMENT SECTION */}
            {/* ============================================ */}
            <div className="checkout-section payment-section">
              <button
                className="pay-btn razorpay-btn"
                onClick={initiateRazorpayPayment}
                disabled={!selectedAddress || processing}
                style={{ 
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #D4AF37, #FFB7C5)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  opacity: (!selectedAddress || processing) ? 0.6 : 1
                }}
              >
                {processing ? '⏳ Processing...' : `Pay ₹${finalTotal}`}
              </button>

              {processing && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    border: '3px solid #333',
                    borderTop: '3px solid #D4AF37',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 8px'
                  }}></div>
                  <p style={{ color: '#888', fontSize: '13px' }}>Processing your payment...</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CheckoutPage;
