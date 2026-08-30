import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function BannersPanel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    imageMobile: '',
    linkType: 'product',
    linkValue: '',
    bannerType: 'featured',
    priority: 0,
    autoplaySpeed: 5000,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    isActive: true
  });

  const BANNER_TYPES = [
    { value: 'flash-sale', label: '🔥 Flash Sale', color: '#ff4444' },
    { value: 'new-launch', label: '🆕 New Launch', color: '#28a745' },
    { value: 'festival-sale', label: '🎉 Festival Sale', color: '#D4AF37' },
    { value: 'bank-offer', label: '💳 Bank Offer', color: '#0066FF' },
    { value: 'clearance', label: '💸 Clearance', color: '#EF4444' },
    { value: 'featured', label: '⭐ Featured', color: '#8B5CF6' },
    { value: 'custom', label: '🎨 Custom', color: '#888' }
  ];

  const LINK_TYPES = [
    { value: 'product', label: '📦 Product Page' },
    { value: 'category', label: '📂 Category Page' },
    { value: 'tag', label: '🏷️ Tag Filter' },
    { value: 'custom', label: '📄 Custom Page' },
    { value: 'external', label: '🔗 External URL' }
  ];

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    const formDataObj = new FormData();
    const validFiles = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name} (max 5MB)`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError(`Invalid file type: ${file.name} (must be image)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    const bannerId = editingBanner?._id || `banner_${Date.now()}`;
    const productId = bannerId;
    
    validFiles.forEach(file => {
      formDataObj.append('images', file);
    });
    formDataObj.append('productId', productId);
    formDataObj.append('folder', 'loop/banners');

    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(`${API_URL}/api/upload/images`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const urls = response.data.images.map(img => img.urls.original);
      const firstUrl = urls.length > 0 ? urls[0] : '';
      
      setFormData(prev => ({
        ...prev,
        image: firstUrl,
        imageMobile: firstUrl // Also set mobile to same for now, user can change
      }));
      
      setUploadSuccess(`✅ ${urls.length} image(s) uploaded successfully!`);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
      setTimeout(() => setUploadError(''), 4000);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // ============================================
  // Banner CRUD Operations
  // ============================================

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      imageMobile: '',
      linkType: 'product',
      linkValue: '',
      bannerType: 'featured',
      priority: 0,
      autoplaySpeed: 5000,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      isActive: true
    });
    setEditingBanner(null);
    setError('');
    setSuccess('');
    setUploadSuccess('');
    setUploadError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null
      };

      const token = localStorage.getItem('loop_token');
      if (editingBanner) {
        await axios.put(`${API_URL}/api/banners/${editingBanner._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Banner updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/banners`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Banner created successfully!');
      }

      fetchBanners();
      setShowForm(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving banner:', error);
      setError(error.response?.data?.error || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
      setSuccess('🗑️ Banner deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting banner:', error);
      setError('Failed to delete banner');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.patch(`${API_URL}/api/banners/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      setError('Failed to toggle banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image: banner.image,
      imageMobile: banner.imageMobile || '',
      linkType: banner.linkType || 'product',
      linkValue: banner.linkValue,
      bannerType: banner.bannerType || 'featured',
      priority: banner.priority || 0,
      autoplaySpeed: banner.autoplaySpeed || 5000,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : '',
      isActive: banner.isActive
    });
    setShowForm(true);
  };

  const getBannerTypeLabel = (type) => {
    const found = BANNER_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getBannerTypeColor = (type) => {
    const found = BANNER_TYPES.find(t => t.value === type);
    return found ? found.color : '#888';
  };

  if (loading) return <div>Loading banners...</div>;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #333'
      }}>
        <h2>📸 Banner Management ({banners.length})</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingBanner(null); 
            resetForm(); 
          }}
          style={{ 
            background: '#D4AF37', 
            border: 'none', 
            padding: '12px 24px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#000'
          }}
        >
          ➕ Add Banner
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

      {banners.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '60px 20px',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No banners yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click the <strong style={{ color: '#D4AF37', cursor: 'pointer' }}>"➕ Add Banner"</strong> button above to create your first banner.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Image</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner._id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} style={{ width: '60px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : 'No image'}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <strong>{banner.title}</strong>
                  {banner.description && (
                    <div style={{ fontSize: '12px', color: '#888' }}>{banner.description}</div>
                  )}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <span style={{ 
                    background: getBannerTypeColor(banner.bannerType), 
                    color: '#fff', 
                    padding: '2px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    whiteSpace: 'nowrap'
                  }}>
                    {getBannerTypeLabel(banner.bannerType)}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: banner.isActive ? '#28a745' : '#555',
                    color: '#fff',
                    fontSize: '12px'
                  }}>
                    {banner.isActive ? '🟢 Active' : '⚪ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <button 
                    onClick={() => handleEdit(banner)} 
                    style={{ marginRight: '5px', background: '#0066FF', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggle(banner._id, banner.isActive)} 
                    style={{ marginRight: '5px', background: banner.isActive ? '#ff8800' : '#28a745', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    {banner.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={() => handleDelete(banner._id)} 
                    style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
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
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#D4AF37' }}>
              {editingBanner ? '✏️ Edit Banner' : '➕ Add New Banner'}
            </h3>
            
            {error && (
              <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                {error}
              </div>
            )}

            {uploadError && (
              <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                ❌ {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div style={{ background: '#28a745', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                {uploadSuccess}
              </div>
            )}

            {/* ============================================ */}
            {/* IMAGE UPLOAD SECTION */}
            {/* ============================================ */}
            <div style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '15px',
              background: '#1a1a1a'
            }}>
              <label style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
                📸 Banner Image *
              </label>

              {/* Hidden file input */}
              <input
                id="banner-file-upload-input"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    handleFileSelect(e.target.files);
                    e.target.value = '';
                  }
                }}
              />

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed ${isDragging ? '#D4AF37' : '#333'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isDragging ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                  marginBottom: '12px'
                }}
                onClick={() => document.getElementById('banner-file-upload-input').click()}
              >
                <div style={{ fontSize: '32px' }}>📤</div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  {isDragging ? '⭐ Drop your image here!' : 'Drag & drop banner image or click to browse'}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  JPG, PNG, WebP • Max 5MB • Recommended: 1200×600px
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    height: '4px',
                    background: '#222',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #D4AF37, #FFB7C5)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>
                    Uploading... {uploadProgress}%
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {formData.image && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '4px' }}>📋 Preview:</div>
                  <div style={{
                    position: 'relative',
                    display: 'inline-block',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #333'
                  }}>
                    <img 
                      src={formData.image} 
                      alt="Banner preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(255, 68, 68, 0.9)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <p style={{ color: '#666', fontSize: '12px', marginTop: '12px' }}>
                💡 Upload an image directly or enter a URL below
              </p>

              {/* URL Input (fallback) */}
              <input
                type="text"
                placeholder="https://example.com/banner-image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                style={{ width: '100%', padding: '12px', marginTop: '8px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                📱 Mobile Image URL (optional)
              </label>
              <input
                type="text"
                placeholder="https://example.com/mobile-banner.jpg"
                value={formData.imageMobile}
                onChange={(e) => setFormData({ ...formData, imageMobile: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              />
            </div>

            <input
              type="text"
              placeholder="Banner Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              required
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            />

            <select
              value={formData.bannerType}
              onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            >
              {BANNER_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={formData.linkType}
              onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            >
              {LINK_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder={
                formData.linkType === 'product' ? 'Product ID or Slug' :
                formData.linkType === 'category' ? 'Category Name' :
                formData.linkType === 'tag' ? 'Tag Name' :
                formData.linkType === 'custom' ? 'Custom URL' :
                'External URL'
              }
              value={formData.linkValue}
              onChange={(e) => setFormData({ ...formData, linkValue: e.target.value })}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
              required
            />

            <div style={{ display: 'flex', gap: '12px', margin: '10px 0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px' }}>⏱️ Autoplay Speed</label>
                <select
                  value={formData.autoplaySpeed}
                  onChange={(e) => setFormData({ ...formData, autoplaySpeed: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={7000}>7 seconds</option>
                  <option value={10000}>10 seconds</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px' }}>📊 Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', margin: '10px 0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px' }}>📅 Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '12px' }}>📅 End Date (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', color: '#ccc', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active (visible on homepage)
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
                {saving ? 'Saving...' : editingBanner ? '💾 Update Banner' : '💾 Create Banner'}
              </button>
              <button 
                type="button" 
                onClick={() => { 
                  setShowForm(false); 
                  setEditingBanner(null); 
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

export default BannersPanel;