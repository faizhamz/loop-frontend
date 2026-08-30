import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ImageUploader({ 
  onUpload, 
  multiple = false, 
  maxFiles = 5,
  accept = 'image/*',
  label = 'Upload Images',
  folder = 'loop/products',
  productId = null
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const validFiles = [];
    const invalidFiles = [];

    Array.from(selectedFiles).forEach(file => {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large - max 5MB)`);
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} (not an image)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files: ${invalidFiles.join(', ')}`);
      setTimeout(() => setError(''), 5000);
    }

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    } else {
      setFiles(validFiles.slice(0, 1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (!productId) {
      setError('Product ID is required for upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    
    if (multiple) {
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('productId', productId);
      formData.append('folder', folder);

      try {
        const token = localStorage.getItem('loop_token');
        const response = await axios.post(
          `${API_URL}/api/upload/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        );

        setSuccess(`✅ ${files.length} images uploaded successfully!`);
        setFiles([]);
        if (onUpload) onUpload(response.data.images);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      formData.append('image', files[0]);
      formData.append('productId', productId);
      formData.append('folder', folder);

      try {
        const token = localStorage.getItem('loop_token');
        const response = await axios.post(
          `${API_URL}/api/upload/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        );

        setSuccess('✅ Image uploaded successfully!');
        setFiles([]);
        if (onUpload) onUpload(response.data.urls);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="image-uploader" style={{ width: '100%' }}>
      {/* Error / Success Messages */}
      {error && (
        <div style={{
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          color: '#ff4444',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '13px'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid #28a745',
          color: '#28a745',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '13px'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? '#D4AF37' : '#333'}`,
          borderRadius: '12px',
          padding: '30px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: isDragging ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '40px' }}>📸</div>
        <div style={{ color: '#888', fontSize: '14px' }}>
          {isDragging ? 'Drop your images here!' : 'Drag & drop or click to upload'}
        </div>
        <div style={{ color: '#666', fontSize: '12px' }}>
          {multiple ? `Max ${maxFiles} images` : 'Single image'} • JPG, PNG, WebP, GIF • Max 5MB
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files.length > 0) {
              handleFileSelect(e.target.files);
              e.target.value = '';
            }
          }}
          style={{ display: 'none' }}
        />
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px'
          }}>
            {files.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(255, 68, 68, 0.9)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    fontSize: '9px',
                    padding: '2px 4px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.name}
                  </div>
                </div>
              );
            })}
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
              <div style={{
                color: '#888',
                fontSize: '12px',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                Uploading... {uploadProgress}%
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            style={{
              width: '100%',
              padding: '10px',
              background: uploading ? '#555' : '#D4AF37',
              color: uploading ? '#888' : '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : `📤 Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      <style>{`
        .image-uploader {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default ImageUploader;