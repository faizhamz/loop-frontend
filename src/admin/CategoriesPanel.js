import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    icon: '📁',
    displayOrder: 0,
    isActive: true
  });

  const icons = ['📁', '🚗', '🎎', '✈️', '☕', '🔑', '📝', '🍽️', '🎮', '📚', '🎨', '🏷️'];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/categories/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      description: '',
      icon: '📁',
      displayOrder: 0,
      isActive: true
    });
    setEditingCategory(null);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('loop_token');
      const data = {
        ...formData,
        displayOrder: Number(formData.displayOrder)
      };

      if (editingCategory) {
        await axios.put(`${API_URL}/api/categories/${editingCategory._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Category updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/categories`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Category created successfully!');
      }

      fetchCategories();
      setShowForm(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This will remove it from all products.')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      setSuccess('🗑️ Category deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image: category.image || '',
      description: category.description || '',
      icon: category.icon || '📁',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setShowForm(true);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading categories...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        background: '#0a0a0a',
        zIndex: 50
      }}>
        <h2 style={{ color: '#fff' }}>🏷️ Categories ({categories.length})</h2>
        <button 
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{ 
            background: '#D4AF37', 
            border: 'none', 
            padding: '10px 20px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ➕ Add Category
        </button>
      </div>

      {error && (
        <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#28a745', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {success}
        </div>
      )}

      {categories.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No categories yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => { setShowForm(true); resetForm(); }}>"➕ Add Category"</strong> button to create your first category.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Icon</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Image</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Products</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category._id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', fontSize: '24px' }}>
                    {category.icon || '📁'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <strong>{category.name}</strong>
                    {category.description && (
                      <div style={{ fontSize: '12px', color: '#888' }}>{category.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    {category.image ? (
                      <img src={category.image} alt={category.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <span style={{ color: '#666', fontSize: '12px' }}>No image</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222', textAlign: 'center' }}>
                    <span style={{ 
                      background: '#222', 
                      padding: '2px 10px', 
                      borderRadius: '12px',
                      color: '#D4AF37',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {category.productCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: category.isActive ? '#28a745' : '#555',
                      color: '#fff',
                      fontSize: '12px'
                    }}>
                      {category.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <button 
                      onClick={() => handleEdit(category)} 
                      style={{ marginRight: '5px', background: '#0066FF', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(category._id)} 
                      style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflow: 'auto'
        }}>
          <form onSubmit={handleSave} style={{
            background: '#111',
            padding: '30px',
            borderRadius: '12px',
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>
              {editingCategory ? '✏️ Edit Category' : '➕ Add Category'}
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Category Name *</label>
              <input
                type="text"
                placeholder="e.g., Cars & RC"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Category Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/category-image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                💡 Upload image to ImgBB or any hosting service and paste the URL here.
              </p>
              {formData.image && (
                <img src={formData.image} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px' }} />
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              >
                {icons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Description</label>
              <textarea
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Display Order</label>
              <input
                type="number"
                placeholder="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Higher number = appears first</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', color: '#ccc', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active (visible on storefront)
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                type="submit" 
                style={{ 
                  flex: 1,
                  background: '#D4AF37', 
                  border: 'none', 
                  padding: '12px 20px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingCategory ? '💾 Update Category' : '💾 Create Category'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{ 
                  padding: '12px 24px',
                  background: '#333', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  color: 'white',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CategoriesPanel;