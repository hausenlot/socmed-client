import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllRead, type NotificationDto } from '../services/notificationService';

function notificationIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'like': return '❤️';
    case 'rerant': return '🔁';
    case 'reply': return '💬';
    case 'follow': return '👤';
    case 'mention': return '📢';
    default: return '🔔';
  }
}

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(Array.isArray(res) ? res : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    fetchNotifications();
  }, [isLoggedIn]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleClick = (n: NotificationDto) => {
    if (n.rantId) {
      navigate(`/rant/${n.rantId}`);
    } else if (n.sourceUsername) {
      navigate(`/profile/${n.sourceUsername}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div className="tab-header" style={{ justifyContent: 'space-between' }}>
        <div className="tab active">Notifications</div>
        {unreadCount > 0 && (
          <button
            className="compose-submit"
            style={{ margin: '0 1rem', fontSize: '13px', padding: '6px 14px' }}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>}

      {!loading && notifications.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No notifications yet.</div>
      )}

      {notifications.map(n => (
        <div
          key={n.id}
          className="notification-item"
          onClick={() => handleClick(n)}
          style={{
            padding: '14px 1.25rem',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            background: n.isRead ? 'transparent' : 'rgba(var(--accent-rgb, 124, 58, 237), 0.05)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(var(--accent-rgb, 124, 58, 237), 0.05)')}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{notificationIcon(n.type)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.4 }}>
              {n.message}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
          {!n.isRead && (
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--accent)', flexShrink: 0, marginTop: '6px'
            }} />
          )}
        </div>
      ))}
    </>
  );
}
