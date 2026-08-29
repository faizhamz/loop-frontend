import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WhatsAppIcon from '../components/WhatsAppIcon';
import './Contact.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function Contact() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/contact`);
      setContact(response.data);
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phoneNumber, message = '') => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const text = message || `Hi LOOP Team, I found your number on the contact page.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="contact-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const hasInfo = contact && Object.values(contact).some(
    val => val && typeof val === 'string' && val.trim() !== ''
  );

  if (!hasInfo) {
    return (
      <div className="contact-page">
        <div className="container">
          <div className="contact-header">
            <h1>📧 Contact Us</h1>
            <p>We'd love to hear from you</p>
          </div>
          <div className="contact-empty">
            <p>Contact information will be added soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-header">
          <h1>📧 Contact Us</h1>
          <p>Get in touch with us</p>
        </div>

        <div className="contact-grid">
          {/* Email */}
          {contact.email && (
            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div className="contact-content">
                <h4>Email</h4>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
          )}

          {/* ✅ WhatsApp - With Icon */}
          {contact.whatsapp && (
            <div 
              className="contact-item clickable" 
              onClick={() => openWhatsApp(contact.whatsapp)}
              style={{ cursor: 'pointer' }}
            >
              <div className="contact-icon">
                <WhatsAppIcon size={28} />
              </div>
              <div className="contact-content">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  WhatsApp 
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#25D366',
                    background: 'rgba(37, 211, 102, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    Chat Now 💬
                  </span>
                </h4>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#25D366' }}>
                  {contact.whatsapp}
                </a>
              </div>
            </div>
          )}

          {/* Phone */}
          {contact.phone && (
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-content">
                <h4>Phone</h4>
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </div>
            </div>
          )}

          {/* Address */}
          {(contact.address || contact.city || contact.state) && (
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div className="contact-content">
                <h4>Address</h4>
                <p>
                  {contact.address}
                  {contact.address && (contact.city || contact.state) && ', '}
                  {contact.city}
                  {contact.city && contact.state && ', '}
                  {contact.state}
                  {contact.pincode && ` - ${contact.pincode}`}
                </p>
              </div>
            </div>
          )}

          {/* Social Media */}
          {contact.instagram && (
            <div className="contact-item">
              <div className="contact-icon">📷</div>
              <div className="contact-content">
                <h4>Instagram</h4>
                <a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer">
                  @{contact.instagram}
                </a>
              </div>
            </div>
          )}

          {contact.facebook && (
            <div className="contact-item">
              <div className="contact-icon">👍</div>
              <div className="contact-content">
                <h4>Facebook</h4>
                <a href={`https://facebook.com/${contact.facebook}`} target="_blank" rel="noopener noreferrer">
                  {contact.facebook}
                </a>
              </div>
            </div>
          )}

          {contact.youtube && (
            <div className="contact-item">
              <div className="contact-icon">▶️</div>
              <div className="contact-content">
                <h4>YouTube</h4>
                <a href={`https://youtube.com/${contact.youtube}`} target="_blank" rel="noopener noreferrer">
                  {contact.youtube}
                </a>
              </div>
            </div>
          )}

          {contact.twitter && (
            <div className="contact-item">
              <div className="contact-icon">🐦</div>
              <div className="contact-content">
                <h4>Twitter</h4>
                <a href={`https://twitter.com/${contact.twitter}`} target="_blank" rel="noopener noreferrer">
                  @{contact.twitter}
                </a>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {contact.customFields && contact.customFields.map((field, index) => (
            field.label && field.value && (
              <div key={index} className="contact-item">
                <div className="contact-icon">📌</div>
                <div className="contact-content">
                  <h4>{field.label}</h4>
                  <p>{field.value}</p>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;