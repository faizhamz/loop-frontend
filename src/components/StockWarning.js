import React from 'react';

function StockWarning({ stock, variantStock = null, variantId = null }) {
  // Check if overall stock is low
  const isLowStock = stock > 0 && stock <= 10;
  
  // Check if specific variant is out of stock
  const isOutOfStock = stock === 0;

  if (isOutOfStock) {
    return (
      <div className="stock-warning out-of-stock">
        <span className="stock-icon">❌</span>
        <span className="stock-text">Out of Stock</span>
      </div>
    );
  }

  if (isLowStock) {
    return (
      <div className="stock-warning low-stock">
        <span className="stock-icon">⚡</span>
        <span className="stock-text">Only {stock} left!</span>
      </div>
    );
  }

  return null;
}

// Variant-specific stock warning
export function VariantStockWarning({ variant }) {
  if (!variant) return null;
  
  const isOutOfStock = variant.stock === 0;
  const isLowStock = variant.stock > 0 && variant.stock <= 10;

  if (isOutOfStock) {
    return (
      <span className="variant-stock-status out-of-stock">
        ❌ Out of Stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className="variant-stock-status low-stock">
        ⚡ Only {variant.stock} left
      </span>
    );
  }

  return (
    <span className="variant-stock-status in-stock">
      ✅ In Stock ({variant.stock})
    </span>
  );
}

export default StockWarning;