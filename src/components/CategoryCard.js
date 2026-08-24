import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CategoryCard.css';

function CategoryCard({ category, index }) {
  const { _id, name, slug, image, icon, productCount } = category;

  return (
    <motion.div
      className="category-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ 
        y: -6,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Link to={`/category/${slug}`} className="category-card-link">
        <div className="category-card-image">
          {image ? (
            <img src={image} alt={name} loading="lazy" />
          ) : (
            <div className="category-card-placeholder">
              <span className="category-card-icon">{icon || '📁'}</span>
            </div>
          )}
          <div className="category-card-overlay">
            <span className="category-card-count">{productCount || 0} Products</span>
          </div>
        </div>
        <div className="category-card-info">
          <h3 className="category-card-name">{name}</h3>
        </div>
      </Link>
    </motion.div>
  );
}

export default CategoryCard;