import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuggestedUsers, toggleFollow, searchUsers, type UserProfileDto } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import Icons from './Icons';

export default function RightPanel() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfileDto[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await getSuggestedUsers(3);
        setSuggestedUsers(Array.isArray(res) ? res : []);
      } catch { /* ignore */ }
    };
    fetchSuggested();
  }, [isLoggedIn]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="right-panel">
      <div className="search-bar" ref={dropdownRef} style={{ position: 'relative' }}>
        <span style={{ color: 'var(--text3)', display: 'flex' }}><Icons.Search /></span>
        <input 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />

        {showDropdown && searchQuery.trim() !== '' && (
          <div className="search-dropdown" style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            right: 0,
            background: 'var(--bg2)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 100,
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {isSearching ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text3)' }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text3)' }}>No users found</div>
            ) : (
              searchResults.map(user => (
                <div 
                  key={user.id} 
                  className="suggest-item" 
                  onClick={() => {
                    navigate(`/profile/${user.username}`);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  style={{ borderBottom: '1px solid var(--border)', padding: '12px 16px', cursor: 'pointer' }}
                >
                  <div className="avatar sm">
                    {(user.displayName || user.username).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{user.displayName || user.username}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text3)' }}>@{user.username}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {suggestedUsers.length > 0 && (
        <div className="panel-card">
          <div className="panel-title">Who to follow</div>
          {suggestedUsers.map(user => (
            <SuggestItem key={user.username} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestItem({ user }: { user: UserProfileDto }) {
  const navigate = useNavigate();
  const [followed, setFollowed] = useState(user.isFollowedByMe);

  const initials = (user.displayName || user.username)
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const gradients = [
    'linear-gradient(135deg,#7b68ee,#4fd1c5)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#22c55e,#0ea5e9)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ];
  let hash = 0;
  for (let i = 0; i < user.username.length; i++) hash = user.username.charCodeAt(i) + ((hash << 5) - hash);
  const bg = gradients[Math.abs(hash) % gradients.length];

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFollow(user.username);
      setFollowed(!followed);
    } catch { /* ignore */ }
  };

  return (
    <div
      className="suggest-item"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      <div className="avatar sm" style={{ background: bg }}>{initials}</div>
      <div>
        <div className="user-name">{user.displayName || user.username}</div>
        <div className="user-handle">@{user.username}</div>
      </div>
      <button
        className="follow-btn"
        onClick={handleFollow}
        style={{
          background: followed ? 'transparent' : 'var(--text)',
          color: followed ? 'var(--text)' : 'var(--bg)',
          border: followed ? '1px solid var(--border2)' : 'none'
        }}
      >
        {followed ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
