import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearNotifications } = useApp();
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="notification-bell-wrapper" ref={ref}>
      <button 
        className="notification-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            <div className="notification-dropdown-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead}>Mark all read</button>
                  <button onClick={clearNotifications}>Clear all</button>
                </>
              )}
            </div>
          </div>
          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications</p>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notification-icon">
                    {notification.type === 'success' ? '✅' : 
                     notification.type === 'error' ? '❌' : 
                     notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="notification-content">
                    <span className="notification-message">{notification.message}</span>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 10 && (
            <div className="notification-footer">
              <button>View all notifications</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;