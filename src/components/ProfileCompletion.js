import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfileCompletion.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function ProfileCompletion({ user, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dob: '',
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        gender: user.gender || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        avatar: user.avatar || ''
      });
    } else {
      // Try to load from localStorage
      const savedUser = localStorage.getItem('loop_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setFormData({
            name: parsedUser.name || '',
            gender: parsedUser.gender || '',
            dob: parsedUser.dob ? new Date(parsedUser.dob).toISOString().split('T')[0] : '',
            avatar: parsedUser.avatar || ''
          });
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSkip = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('loop_token');
      if (!token) {
        setError('Please login again');
        setLoading(false);
        return;
      }

      // ✅ Only send fields that have values
      const updateData = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.dob) updateData.dob = formData.dob;
      if (formData.avatar) updateData.avatar = formData.avatar;

      const response = await axios.put(
        `${API_URL}/api/auth/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update user in state and localStorage
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('loop_user', JSON.stringify(updatedUser));

      setSuccess('✅ Profile updated successfully!');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Avatar options
  const maleAvatars = [
    '👨', '👦', '🧑', '👱‍♂️', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳'
  ];
  const femaleAvatars = [
    '👩', '👧', '👱‍♀️', '👩‍🦰', '👩‍🦱', '👩‍🦳', '🧑‍🦰', '🧑‍🦱'
  ];
  const allAvatars = [...maleAvatars, ...femaleAvatars, '🐱', '🐶', '🐼', '🦊', '🐨'];

  return (
    <div className="profile-completion-container">
      <div className="profile-completion-card">
        <div className="profile-completion-header">
          <div className="auth-logo">
            <span className="logo-l">L</span>
            <span className="logo-infinity">∞</span>
            <span className="logo-p">P</span>
          </div>
          <h2>Complete Your Profile</h2>
          <p>Help us personalize your experience</p>
          <p className="profile-skip-hint">You can skip this and complete it later</p>
        </div>

        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        <form onSubmit={handleSubmit} className="profile-completion-form">
          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>Gender</label>
            <div className="gender-options">
              <button
                type="button"
                className={`gender-option ${formData.gender === 'Male' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'Male' })}
              >
                👨 Male
              </button>
              <button
                type="button"
                className={`gender-option ${formData.gender === 'Female' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'Female' })}
              >
                👩 Female
              </button>
              <button
                type="button"
                className={`gender-option ${formData.gender === 'Other' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'Other' })}
              >
                🌈 Other
              </button>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Avatar Selection */}
          <div className="form-group">
            <label>Choose Your Avatar</label>
            <div className="avatar-grid">
              {allAvatars.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  className={`avatar-option ${formData.avatar === emoji ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {formData.avatar && (
              <p className="selected-avatar">Selected: {formData.avatar}</p>
            )}
          </div>

          <div className="profile-completion-actions">
            <button 
              type="button" 
              className="skip-btn"
              onClick={handleSkip}
            >
              ⏭️ Skip for now
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : '✅ Continue to Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileCompletion;