import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Icons from './Icons';
import { getInitials, avatarGradient } from '../utils/avatarUtils';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();



  const navItems = [
    { name: 'Home', path: '/', icon: <Icons.Home /> },
    { name: 'Explore', path: '/explore', icon: <Icons.Explore /> },
    { name: 'Notifications', path: '/notifications', icon: <Icons.Notifications />, badge: unreadCount },
    ...(isLoggedIn ? [{ name: 'Bookmarks', path: '/bookmarks', icon: <Icons.Bookmarks /> }] : []),
    ...(isLoggedIn && user ? [{ name: 'Profile', path: `/profile/${user.username}`, icon: <Icons.Profile /> }] : []),
  ];

  const handleNewRant = () => {
    navigate('/');
    // Focus compose box after navigation
    setTimeout(() => {
      const textarea = document.querySelector('.compose textarea') as HTMLTextAreaElement;
      if (textarea) { textarea.focus(); textarea.scrollIntoView({ behavior: 'smooth' }); }
    }, 100);
  };

  return (
    <div className="sidebar">
      <div className="logo">◈ rant</div>

      <div className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon">{item.icon}</span> 
            <span className="nav-label">{item.name}</span>
            {'badge' in item && (item as { badge?: number }).badge! > 0 && (
              <span className="badge">{(item as { badge?: number }).badge}</span>
            )}
          </Link>
        ))}
      </div>

      {isLoggedIn ? (
        <div className="sidebar-footer">
          <button className="rant-btn" onClick={handleNewRant}>+ New Rant</button>
          <div className="user-section" style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '4px' }}>
            <div className="user-chip" onClick={() => navigate(`/profile/${user?.username}`)} title="Go to profile" style={{ marginTop: 0, flex: 1 }}>
              <div 
                className="avatar" 
                style={{ 
                  background: user?.profileImageUrl ? `url(${user.profileImageUrl})` : avatarGradient(user?.username),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!user?.profileImageUrl && getInitials(user?.displayName)}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.displayName ?? 'Guest'}</div>
                <div className="user-handle">@{user?.username ?? '—'}</div>
              </div>
            </div>
            <button 
              onClick={logout} 
              title="Log out"
              className="logout-btn"
              style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      ) : (
        <div className="sidebar-footer">
          <button className="rant-btn" onClick={() => navigate('/login')}>Log in / Sign up</button>
        </div>
      )}
    </div>
  );
}
