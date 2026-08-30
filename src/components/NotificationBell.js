import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAllNotificationsAsRead, 
    markNotificationAsRead, 
    clearNotifications,
    loadNotifications,
    isDarkMode
  } = useApp();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reload when opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="notification-bell-wrapper" ref={ref} style={{ position: 'relative' }}>
      <button 
        className="notification-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          padding: '4px 8px',
          borderRadius: '50%',
          transition: 'all 0.3s ease',
          position: 'relative',
          color: isDarkMode ? '#fff' : '#2d1b2e'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge" style={{
            position: 'absolute',
            top: '-4px',
            right: '0px',
            background: '#ff4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '1px 6px',
            borderRadius: '50%',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          background: isDarkMode ? '#1a1a1a' : '#ffffff',
          border: isDarkMode ? '1px solid #333' : '1px solid #e8e0e5',
          borderRadius: '16px',
          width: '360px',
          maxHeight: '420px',
          overflow: 'hidden',
          boxShadow: isDarkMode ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f0e8ed'
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: '700',
              color: isDarkMode ? '#fff' : '#2d1b2e',
              fontFamily: 'Nunito, sans-serif'
            }}>
              🔔 Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: '#ff4444',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {notifications.length > 0 && (
                <>
                  <button 
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#D4AF37',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                  >
                    Mark all read
                  </button>
                  <button 
                    onClick={clearNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '320px'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '30px 20px',
                textAlign: 'center',
                color: '#888'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '6px' }}>✨</div>
                <p style={{ fontSize: '14px' }}>No notifications yet</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>We'll notify you when something happens</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: isDarkMode ? '1px solid #222' : '1px solid #f0e8ed',
                    transition: 'all 0.3s ease',
                    background: notif.isRead ? 'transparent' : isDarkMode ? 'rgba(212, 175, 55, 0.05)' : 'rgba(212, 175, 55, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? '#222' : '#f8f4f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'transparent' : isDarkMode ? 'rgba(212, 175, 55, 0.05)' : 'rgba(212, 175, 55, 0.03)';
                  }}
                >
                  {!notif.isRead && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#D4AF37',
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: '4px'
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      color: isDarkMode ? '#fff' : '#2d1b2e',
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {notif.message}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#888'
                      }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                      {notif.orderId && (
                        <span style={{
                          fontSize: '10px',
                          color: '#D4AF37',
                          background: 'rgba(212, 175, 55, 0.1)',
                          padding: '1px 8px',
                          borderRadius: '10px'
                        }}>
                          📦 Order
                        </span>
                      )}
                    </div>
                  </div>
                  {notif.link && (
                    <span style={{
                      color: '#D4AF37',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      →
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{
              padding: '8px 16px',
              borderTop: isDarkMode ? '1px solid #333' : '1px solid #f0e8ed',
              textAlign: 'center',
              fontSize: '11px',
              color: '#888'
            }}>
              {notifications.length} notifications • {unreadCount} unread
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;