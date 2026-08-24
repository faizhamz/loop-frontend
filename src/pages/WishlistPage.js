import React from 'react';
import { Link } from 'react-router-dom';

function WishlistPage({ wishlist, products, addToCart, toggleWishlist }) {
  const wishlistProducts = products.filter(p => wishlist.includes(p._id));

  if (wishlistProducts.length === 0) {
    return (
      <>
        <header className="header">
          <div className="container header-content">
            <Link to="/" className="logo">
              <span className="logo-l">L</span>
              <span className="logo-infinity">∞</span>
              <span className="logo-p">P</span>
            </Link>
          </div>
        </header>
        <div style={{ padding: '120px 20px', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', marginTop: '40px' }}>Your Wishlist is Empty</h2>
          <p style={{ color: '#888', margin: '20px 0' }}>
            Start adding products you love by clicking the 🤍 on any product.
          </p>
          <Link to="/" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <span className="logo-l">L</span>
            <span className="logo-infinity">∞</span>
            <span className="logo-p">P</span>
          </Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/wishlist" className="wishlist-nav-link">❤️ Wishlist</Link>
          </nav>
        </div>
      </header>
      
      <div style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px', color: '#D4AF37', marginTop: '20px' }}>❤️ My Wishlist</h1>
        
        <div className="product-grid">
          {wishlistProducts.map(product => {
            const productSlug = product.productId || product.name.toLowerCase().replace(/ /g, '-');
            const hasSale = product.salePrice && product.salePrice < product.price;
            const displayPrice = hasSale ? product.salePrice : product.price;
            
            return (
              <div key={product._id} className="product-card" style={{ cursor: 'pointer' }}>
                <div className="product-image">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300x300?text=LOOP'} 
                    alt={product.name} 
                    className="product-img"
                    onClick={() => window.location.href = `/product/${productSlug}`}
                  />
                  <button 
                    className="wishlist-btn-card active"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product._id);
                    }}
                  >
                    ❤️
                  </button>
                  {hasSale && <span className="sale-badge">-{Math.round(((product.price - product.salePrice) / product.price) * 100)}%</span>}
                </div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">
                  {hasSale ? (
                    <>
                      <span className="original-price">₹{product.price}</span>
                      <span className="sale-price">₹{product.salePrice}</span>
                    </>
                  ) : (
                    <span>₹{product.price}</span>
                  )}
                </div>
                <button 
                  className="add-to-cart" 
                  onClick={() => addToCart(product)}
                  style={{ margin: '0 16px 16px', width: 'calc(100% - 32px)' }}
                >
                  Add to Cart
                </button>
                <Link 
                  to={`/product/${productSlug}`}
                  style={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    color: '#D4AF37', 
                    padding: '8px 0 16px',
                    fontSize: '14px'
                  }}
                >
                  View Details →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default WishlistPage;