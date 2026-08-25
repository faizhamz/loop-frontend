import React from 'react';
import './PriceRangeSlider.css';

function PriceRangeSlider({ min, max, value, onChange }) {
  const handleMinChange = (e) => {
    const newMin = Number(e.target.value);
    if (newMin <= value.max) {
      onChange({ ...value, min: newMin });
    }
  };

  const handleMaxChange = (e) => {
    const newMax = Number(e.target.value);
    if (newMax >= value.min) {
      onChange({ ...value, max: newMax });
    }
  };

  return (
    <div className="price-range-slider-container">
      <div className="price-range-values">
        <span>₹{value.min}</span>
        <span>to</span>
        <span>₹{value.max}</span>
      </div>
      <div className="price-range-slider">
        <input
          type="range"
          min={min}
          max={max}
          value={value.min}
          onChange={handleMinChange}
          className="price-slider min-slider"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.max}
          onChange={handleMaxChange}
          className="price-slider max-slider"
        />
      </div>
    </div>
  );
}

export default PriceRangeSlider;