import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function AdminNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('loop_token') || localStorage.getItem('admin_token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/notifications/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = response.data || [];
      setNotifications(all.slice(0, 20));
      // Admin notifications are 'all' targetType; count those in last 24h as "unread"
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = all.filter(n => new Date(n.createdAt).getTime() > oneDayAgo);
      setUnreadCount(recent.length);
    } catch (err) {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          cursor: 'pointer',
          fontSize: '18px',
          color: '#D4AF37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Admin Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ff4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #0a0a0a'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '360px',
          maxHeight: '450px',
          overflowY: 'auto',
          background: '#111',
          border: '1px solid #333',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #333',
            fontWeight: '700',
            color: '#D4AF37',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🔔 Admin Notifications</span>
            <button
              onClick={fetchNotifications}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Refresh"
            >
              🔄
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
              <p style={{ fontSize: '13px' }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif._id}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid #222',
                  cursor: notif.link ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (notif.link) e.currentTarget.style.background = '#1a1a1a';
                }}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  if (notif.link) {
                    window.location.href = notif.link;
                  }
                  setIsOpen(false);
                }}
              >
                <div style={{
                  fontSize: '13px',
                  color: '#fff',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: notif.type === 'success' ? '#28a745'
                      : notif.type === 'error' ? '#ff4444'
                      : notif.type === 'warning' ? '#ff8800'
                      : '#D4AF37',
                    flexShrink: 0,
                    marginTop: '6px'
                  }} />
                  <span style={{ flex: 1 }}>{notif.message}</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  marginLeft: '16px'
                }}>
                  {timeAgo(notif.createdAt)}
                </div>
              </div>
            ))
          )}

          {notifications.length > 0 && (
            <div style={{
              padding: '10px 18px',
              textAlign: 'center',
              borderTop: '1px solid #333',
              fontSize: '11px',
              color: '#666'
            }}>
              Showing last {notifications.length} notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationBell;