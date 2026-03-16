import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Icons from './Icons';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();

  const initials = user
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

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

      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <span className="nav-icon">{item.icon}</span> {item.name}
          {'badge' in item && (item as { badge?: number }).badge! > 0 && (
            <span className="badge">{(item as { badge?: number }).badge}</span>
          )}
        </Link>
      ))}

      {isLoggedIn ? (
        <>
          <button className="rant-btn" onClick={handleNewRant}>+ New Rant</button>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '4px' }}>
            <div className="user-chip" onClick={() => navigate(`/profile/${user?.username}`)} title="Go to profile" style={{ marginTop: 0, flex: 1 }}>
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{user?.displayName ?? 'Guest'}</div>
                <div className="user-handle">@{user?.username ?? '—'}</div>
              </div>
            </div>
            <button 
              onClick={logout} 
              title="Log out"
              style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Icons.Logout />
            </button>
          </div>
        </>
      ) : (
        <button className="rant-btn" onClick={() => navigate('/login')}>Log in / Sign up</button>
      )}
    </div>
  );
}
