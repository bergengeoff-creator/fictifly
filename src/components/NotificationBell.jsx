import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';

const API_BASE = '/api/teacher-features';
const POLL_INTERVAL_MS = 60000; // 1 minute

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}?action=getNotifications&limit=20`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('NotificationBell fetch error:', err);
      setError(err.message);
    }
  }, []);

  // Fetch session once on mount, matching CommentTemplateManager's pattern
  useEffect(() => {
    let interval;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }
      setToken(session.access_token);
      fetchNotifications(session.access_token);
      interval = setInterval(() => fetchNotifications(session.access_token), POLL_INTERVAL_MS);
    })();
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next && token) fetchNotifications(token); // refresh on open
      return next;
    });
  };

  const handleMarkRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_BASE}?action=markNotificationRead`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });
      if (!res.ok) throw new Error('Failed to mark notification read');
    } catch (err) {
      console.error('markNotificationRead error:', err);
      fetchNotifications(token); // resync on failure
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch(`${API_BASE}?action=markAllNotificationsRead`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark all read');
    } catch (err) {
      console.error('markAllNotificationsRead error:', err);
      fetchNotifications(token);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) handleMarkRead(notification.id);
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={bellRef}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#C2542D' /* terra */,
              color: 'white',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid #eee',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid #eee',
            }}
          >
            <strong style={{ fontSize: '15px' }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2C6E6A' /* seaMid */,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div style={{ padding: '16px', color: '#C2542D', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {!error && notifications.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
              No notifications yet
            </div>
          )}

          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f4f4f4',
                cursor: 'pointer',
                background: notification.read ? 'white' : '#F5FAF9',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              {!notification.read && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2C6E6A',
                    marginTop: '5px',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: notification.read ? 400 : 600, marginBottom: '2px' }}>
                  {notification.title}
                </div>
                {notification.body && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#777',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notification.body}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                  {formatTimeAgo(notification.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="#333"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#333"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}