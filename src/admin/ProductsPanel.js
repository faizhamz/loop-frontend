import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// Utility function to detect video URLs
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const videoDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'imagekit.io'];
  const lowerUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;
  if (videoDomains.some(domain => lowerUrl.includes(domain))) return true;
  return false;
};

function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Categories state
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Category Filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Variant states
  const [variantTypes, setVariantTypes] = useState([]);
  const [variantOptions, setVariantOptions] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    stock: '',
    image: '',
    images: [],
    videos: [],
    mediaUrls: [''],
    description: '',
    hasVariants: false,
    variants: []
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryFilter) {
      const filtered = products.filter(product => 
        product.categories && product.categories.includes(selectedCategoryFilter)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategoryFilter, products]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      salePrice: '',
      stock: '',
      image: '',
      images: [],
      videos: [],
      mediaUrls: [''],
      description: '',
      hasVariants: false,
      variants: []
    });
    setSelectedCategories([]);
    setCategorySearch('');
    setVariantTypes([]);
    setVariantOptions({});
    setEditingProduct(null);
    setError('');
    setSuccess('');
  };

  // Variant functions
  const addVariantType = () => {
    const type = prompt('Enter variant type (e.g., Size, Color, Engine):');
    if (type && type.trim()) {
      const trimmed = type.trim();
      setVariantTypes([...variantTypes, trimmed]);
      setVariantOptions({ ...variantOptions, [trimmed]: [] });
    }
  };

  const removeVariantType = (type) => {
    if (!window.confirm(`Remove "${type}" variant?`)) return;
    setVariantTypes(variantTypes.filter(t => t !== type));
    const newOptions = { ...variantOptions };
    delete newOptions[type];
    setVariantOptions(newOptions);
  };

  const addOption = (type) => {
    const newOptions = { ...variantOptions };
    newOptions[type] = [...(newOptions[type] || []), { value: '', price: 0, stock: 0 }];
    setVariantOptions(newOptions);
  };

  const removeOption = (type, index) => {
    const newOptions = { ...variantOptions };
    newOptions[type] = newOptions[type].filter((_, i) => i !== index);
    setVariantOptions(newOptions);
  };

  const updateOption = (type, index, field, value) => {
    const newOptions = { ...variantOptions };
    newOptions[type][index] = { ...newOptions[type][index], [field]: value };
    setVariantOptions(newOptions);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('🗑️ Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.error || 'Failed to delete product.');
    }
  };

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submitted!');
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        setError('Product name is required');
        setSaving(false);
        return;
      }
      
      if (!formData.price || Number(formData.price) <= 0) {
        setError('Valid price is required');
        setSaving(false);
        return;
      }
      
      if (!formData.stock || Number(formData.stock) < 0) {
        setError('Valid stock quantity is required');
        setSaving(false);
        return;
      }

      // Get valid media URLs
      const validMedia = formData.mediaUrls.filter(url => url && url.trim() !== '');
      
      // Separate images and videos
      const images = [];
      const videos = [];
      
      validMedia.forEach(url => {
        if (isVideoUrl(url)) {
          videos.push(url);
        } else {
          images.push(url);
        }
      });

      // Build variants data
      const variantsData = variantTypes
        .filter(type => variantOptions[type] && variantOptions[type].length > 0)
        .map(type => ({
          type: type,
          name: type,
          options: variantOptions[type]
            .filter(opt => opt.value && opt.value.trim())
            .map(opt => ({
              value: opt.value.trim(),
              price: Number(opt.price) || 0,
              stock: Number(opt.stock) || 0
            }))
        }))
        .filter(v => v.options.length > 0);

      // Generate productId
      let productId = formData.productId;
      if (!editingProduct && !productId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        productId = `LOOP-${timestamp}${random}`;
      }

      // Get main category name from selected categories
      let mainCategory = 'Uncategorized';
      if (selectedCategories.length > 0) {
        const cat = allCategories.find(c => c._id === selectedCategories[0]);
        if (cat) mainCategory = cat.name;
      }

      // Prepare data for backend
      const data = {
        name: formData.name.trim(),
        productId: productId,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        stock: Number(formData.stock),
        image: images.length > 0 ? images[0] : '',
        images: images,
        videos: videos,
        description: formData.description ? formData.description.trim() : '',
        category: mainCategory,
        hasVariants: variantsData.length > 0,
        variants: variantsData,
        categories: selectedCategories,
        isActive: true
      };

      console.log('📦 Sending product data:', data);

      const token = localStorage.getItem('loop_token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setSaving(false);
        return;
      }

      let response;
      if (editingProduct) {
        console.log('✏️ Updating product:', editingProduct._id);
        response = await axios.put(`${API_URL}/api/products/${editingProduct._id}`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Product updated:', response.data);
        setSuccess('✅ Product updated successfully!');
      } else {
        console.log('➕ Creating new product...');
        response = await axios.post(`${API_URL}/api/products`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Product created:', response.data);
        setSuccess('✅ Product created successfully!');
      }

      // Refresh product list
      await fetchProducts();
      
      // Close form and reset
      setShowForm(false);
      resetForm();
      
      // Show success message
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error saving product:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setError(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received');
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        setError(error.message);
      }
    } finally {
      setSaving(false);
      console.log('🏁 Save operation completed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    const combinedMedia = [...(product.images || []), ...(product.videos || [])];
    
    setFormData({
      name: product.name,
      productId: product.productId || '',
      price: product.price,
      salePrice: product.salePrice || '',
      stock: product.stock,
      image: product.image || '',
      images: product.images || [],
      videos: product.videos || [],
      mediaUrls: combinedMedia.length > 0 ? combinedMedia : [''],
      description: product.description || '',
      hasVariants: product.hasVariants || false,
      variants: product.variants || []
    });
    setSelectedCategories(product.categories || []);
    
    // Load variants
    if (product.variants && product.variants.length > 0) {
      const types = product.variants.map(v => v.type || v.name);
      setVariantTypes(types);
      const options = {};
      product.variants.forEach(v => {
        options[v.type || v.name] = v.options.map(opt => ({
          value: opt.value,
          price: opt.price || 0,
          stock: opt.stock || 0
        }));
      });
      setVariantOptions(options);
    } else {
      setVariantTypes([]);
      setVariantOptions({});
    }
    
    setShowForm(true);
  };

  if (loading) {
    return (
      <div>
        <h2>Products</h2>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {error && (
        <div style={{ 
          background: '#ff4444', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {error}</span>
          <button 
            onClick={() => setError('')} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#28a745', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✅ {success}</span>
          <button 
            onClick={() => setSuccess('')} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
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
        <h2 style={{ color: '#fff' }}>👕 Products ({products.length})</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingProduct(null); 
            resetForm(); 
          }}
          style={{ 
            background: '#D4AF37', 
            color: '#000',
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
          ➕ Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px 0',
        borderBottom: '1px solid #333',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        <label style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>
          🔍 Filter:
        </label>
        
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{
            padding: '8px 16px',
            background: '#222',
            border: '1px solid #333',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '180px'
          }}
        >
          <option value="">📂 All Categories</option>
          {allCategories.map(category => (
            <option key={category._id} value={category._id}>
              {category.icon || '📁'} {category.name} ({category.productCount || 0})
            </option>
          ))}
        </select>

        {selectedCategoryFilter && (
          <>
            <span style={{ 
              color: '#888', 
              fontSize: '13px',
              background: 'rgba(212, 175, 55, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              {filteredProducts.length} products
            </span>
            <button
              onClick={() => setSelectedCategoryFilter('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff4444',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '4px 8px'
              }}
            >
              ✕ Clear
            </button>
          </>
        )}
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👕</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No products yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37' }}>"➕ Add Product"</strong> button above to create your first product.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Image</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Product ID</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Categories</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Stock</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product._id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : 'No image'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <strong>{product.productId || 'N/A'}</strong>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{product.name}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    {product.categories && product.categories.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {product.categories.map(catId => {
                          const cat = allCategories.find(c => c._id === catId);
                          return cat ? (
                            <span key={catId} style={{
                              background: 'rgba(212, 175, 55, 0.15)',
                              border: '1px solid #D4AF37',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: '#D4AF37'
                            }}>
                              {cat.icon} {cat.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span style={{ color: '#666', fontSize: '12px' }}>No categories</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>₹{product.price}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{product.stock}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                    <button 
                      onClick={() => window.open(`/product/${product.productId || product._id}`, '_blank')}
                      style={{ 
                        marginRight: '10px', 
                        background: '#8B5CF6', 
                        color: 'white', 
                        border: 'none', 
                        padding: '5px 14px', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                      }}
                    >
                      👁️ Preview
                    </button>
                    <button 
                      onClick={() => handleEdit(product)}
                      style={{ marginRight: '10px', background: '#0066FF', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <form onSubmit={handleSave} style={{
            background: '#111',
            padding: '30px',
            borderRadius: '12px',
            width: '650px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>
              {editingProduct ? '✏️ Edit Product' : '➕ Add Product'}
            </h3>
            
            {error && (
              <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                {error}
              </div>
            )}
            
            {/* Product ID (read-only) */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Product ID (auto-generated)
              </label>
              <input
                type="text"
                value={editingProduct?.productId || 'Auto-generated on save'}
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#666',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Product Name */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Product Name *
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                required
              />
            </div>

            {/* Price & Stock Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="1999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#222', 
                    border: '1px solid #333', 
                    color: 'white', 
                    borderRadius: '6px'
                  }}
                  required
                  // ✅ Remove spinner arrows
                  step="any"
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Sale Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="1499"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#222', 
                    border: '1px solid #333', 
                    color: 'white', 
                    borderRadius: '6px' 
                  }}
                  step="any"
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div style={{ flex: 0.7 }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Stock *
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#222', 
                    border: '1px solid #333', 
                    color: 'white', 
                    borderRadius: '6px' 
                  }}
                  required
                  min="0"
                  step="1"
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                placeholder="Product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            {/* Media Gallery */}
            <div style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '15px',
              background: '#1a1a1a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'bold' }}>
                  📸 Images & Videos
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newMedia = [...formData.mediaUrls, ''];
                    setFormData({ ...formData, mediaUrls: newMedia });
                  }}
                  style={{
                    background: '#D4AF37',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                >
                  + Add Media
                </button>
              </div>

              <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
                💡 Add image or video URLs (YouTube, Vimeo, MP4, etc.)
              </p>

              {formData.mediaUrls.map((url, index) => {
                const isVideo = isVideoUrl(url);
                const isImage = !isVideo && url.trim() !== '';
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      marginBottom: '10px', 
                      alignItems: 'center',
                      padding: '8px',
                      background: '#222',
                      borderRadius: '6px',
                      border: '1px solid #333'
                    }}
                  >
                    <div style={{ 
                      width: '24px', 
                      fontSize: '18px',
                      textAlign: 'center'
                    }}>
                      {isVideo ? '🎬' : isImage ? '🖼️' : '📄'}
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Enter image or video URL..."
                      value={url}
                      onChange={(e) => {
                        const newMedia = [...formData.mediaUrls];
                        newMedia[index] = e.target.value;
                        setFormData({ ...formData, mediaUrls: newMedia });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#1a1a1a',
                        border: isVideo ? '1px solid #8B5CF6' : isImage ? '1px solid #4CAF50' : '1px solid #333',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    
                    {url.trim() !== '' && (
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '2px 10px', 
                        borderRadius: '12px',
                        background: isVideo ? 'rgba(139, 92, 246, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                        color: isVideo ? '#8B5CF6' : '#4CAF50',
                        border: `1px solid ${isVideo ? '#8B5CF6' : '#4CAF50'}`
                      }}>
                        {isVideo ? '🎬 Video' : '🖼️ Image'}
                      </span>
                    )}
                    
                    {formData.mediaUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newMedia = formData.mediaUrls.filter((_, i) => i !== index);
                          setFormData({ ...formData, mediaUrls: newMedia });
                        }}
                        style={{
                          background: '#ff4444',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Preview */}
              {formData.mediaUrls.filter(u => u.trim() !== '').length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>
                    📋 Preview ({formData.mediaUrls.filter(u => u.trim() !== '').length} items)
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {formData.mediaUrls.filter(u => u.trim() !== '').map((url, idx) => {
                      const isVideo = isVideoUrl(url);
                      return (
                        <div key={idx} style={{ position: 'relative' }}>
                          {isVideo ? (
                            <div style={{
                              width: '80px',
                              height: '80px',
                              background: '#222',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #8B5CF6'
                            }}>
                              <span style={{ fontSize: '32px' }}>🎬</span>
                            </div>
                          ) : (
                            <img 
                              src={url} 
                              alt={`Media ${idx + 1}`}
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                border: '1px solid #333'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: '#D4AF37',
                            color: '#000',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}>
                            {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Variants Builder */}
            <div style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '15px',
              background: '#1a1a1a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'bold' }}>📦 Variants (Optional)</label>
                <button 
                  type="button" 
                  onClick={addVariantType}
                  style={{
                    background: '#D4AF37',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                >
                  + Add Variant Type
                </button>
              </div>
              
              {variantTypes.length === 0 ? (
                <p style={{ color: '#666', fontSize: '13px' }}>
                  No variants added. Click "Add Variant Type" to create variants like Size, Color, or custom types.
                </p>
              ) : (
                variantTypes.map((type, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #333', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    marginBottom: '10px',
                    background: '#111'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#D4AF37', fontWeight: '600' }}>{type}</span>
                      <button 
                        type="button" 
                        onClick={() => removeVariantType(type)}
                        style={{
                          background: '#ff4444',
                          border: 'none',
                          padding: '2px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div>
                      {(variantOptions[type] || []).map((option, optIndex) => (
                        <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                          <input
                            placeholder="Option (e.g., M, Red)"
                            value={option.value || ''}
                            onChange={(e) => updateOption(type, optIndex, 'value', e.target.value)}
                            style={{ flex: 1, padding: '6px 10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={option.price || ''}
                            onChange={(e) => updateOption(type, optIndex, 'price', Number(e.target.value))}
                            style={{ width: '80px', padding: '6px 10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                            step="any"
                            onWheel={(e) => e.target.blur()}
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={option.stock || ''}
                            onChange={(e) => updateOption(type, optIndex, 'stock', Number(e.target.value))}
                            style={{ width: '80px', padding: '6px 10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                            min="0"
                            step="1"
                            onWheel={(e) => e.target.blur()}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(type, optIndex)}
                            style={{
                              background: '#ff4444',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: 'white'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => addOption(type)}
                      style={{
                        background: 'transparent',
                        border: '1px dashed #333',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#888',
                        fontSize: '12px',
                        marginTop: '4px'
                      }}
                    >
                      + Add Option
                    </button>
                    
                    {/* Quick add suggestions */}
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {type === 'Size' && ['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                        <span 
                          key={s} 
                          style={{
                            background: '#222',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#888',
                            cursor: 'pointer',
                            border: '1px solid #333'
                          }}
                          onClick={() => {
                            const newOptions = { ...variantOptions };
                            if (!newOptions[type].find(o => o.value === s)) {
                              newOptions[type] = [...(newOptions[type] || []), { value: s, price: 0, stock: 0 }];
                              setVariantOptions(newOptions);
                            }
                          }}
                        >
                          + {s}
                        </span>
                      ))}
                      {type === 'Color' && ['Black', 'White', 'Red', 'Blue', 'Green', 'Navy'].map(c => (
                        <span 
                          key={c} 
                          style={{
                            background: '#222',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#888',
                            cursor: 'pointer',
                            border: '1px solid #333'
                          }}
                          onClick={() => {
                            const newOptions = { ...variantOptions };
                            if (!newOptions[type].find(o => o.value === c)) {
                              newOptions[type] = [...(newOptions[type] || []), { value: c, price: 0, stock: 0 }];
                              setVariantOptions(newOptions);
                            }
                          }}
                        >
                          + {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Categories Section */}
            <div style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '15px',
              background: '#1a1a1a'
            }}>
              <label style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                🏷️ Categories
              </label>
              
              <input
                type="text"
                placeholder="🔍 Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#222',
                  border: '1px solid #333',
                  color: 'white',
                  borderRadius: '6px',
                  marginBottom: '10px'
                }}
              />
              
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {allCategories
                  .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map(category => {
                    const isSelected = selectedCategories.includes(category._id);
                    return (
                      <label
                        key={category._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#222';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCategory(category._id)}
                          style={{ accentColor: '#D4AF37', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '20px' }}>{category.icon || '📁'}</span>
                        <span style={{ color: '#fff', fontSize: '14px' }}>{category.name}</span>
                        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
                          {category.productCount || 0} products
                        </span>
                      </label>
                    );
                  })}
              </div>
              
              {selectedCategories.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedCategories.map(id => {
                    const cat = allCategories.find(c => c._id === id);
                    return cat ? (
                      <span
                        key={id}
                        style={{
                          background: 'rgba(212, 175, 55, 0.15)',
                          border: '1px solid #D4AF37',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: '#D4AF37',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {cat.icon} {cat.name}
                        <button
                          type="button"
                          onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== cat._id))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0 4px'
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                type="submit" 
                style={{ 
                  flex: 2,
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
                {saving ? '⏳ Saving...' : editingProduct ? '💾 Update Product' : '💾 Create Product'}
              </button>
              <button 
                type="button" 
                onClick={() => { 
                  setShowForm(false); 
                  setEditingProduct(null); 
                  resetForm(); 
                }}
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

export default ProductsPanel;