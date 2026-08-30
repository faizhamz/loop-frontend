import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function VideoUploader({ 
  onUpload, 
  label = 'Upload Video',
  folder = 'loop/videos',
  productId = null,
  accept = 'video/*'
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    const file = selectedFile;

    // Check file size (50MB max for videos)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video too large - max 50MB');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video');
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
    formData.append('video', file);
    formData.append('productId', productId);
    formData.append('folder', folder);

    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.post(
        `${API_URL}/api/upload/video`,
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

      setSuccess('✅ Video uploaded successfully!');
      if (onUpload) onUpload(response.data.url);
      setTimeout(() => {
        setSuccess('');
        setFile(null);
        setPreviewUrl(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="video-uploader" style={{ width: '100%' }}>
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

      {/* Preview */}
      {previewUrl && (
        <div style={{
          marginBottom: '12px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#0a0a0a',
          position: 'relative'
        }}>
          <video
            src={previewUrl}
            controls
            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
          />
          <button
            onClick={removeFile}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255, 68, 68, 0.9)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
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
      )}

      {/* Drop Zone */}
      {!file && (
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
            minHeight: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '40px' }}>🎬</div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            {isDragging ? 'Drop your video here!' : 'Drag & drop or click to upload video'}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            MP4, WebM, OGG • Max 50MB
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
                e.target.value = '';
              }
            }}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '12px',
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
          {uploading ? `Uploading... ${uploadProgress}%` : '📤 Upload Video'}
        </button>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div style={{ marginTop: '8px' }}>
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
        </div>
      )}

      <style>{`
        .video-uploader {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default VideoUploader;