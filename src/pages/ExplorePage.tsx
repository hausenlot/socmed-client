import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RantItem from '../components/RantItem';
import { getExploreFeed, type RantDto } from '../services/rantService';
import { searchUsers, type UserProfileDto } from '../services/userService';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [rants, setRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileDto[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchExplore = async () => {
    try {
      const res = await getExploreFeed();
      setRants(Array.isArray(res) ? res : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExplore(); }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery.trim());
        setSearchResults(Array.isArray(res) ? res : []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      <div className="explore-search">
        <div className="explore-search-bar">
          <span style={{ color: 'var(--text3)', fontSize: '16px' }}>🔍</span>
          <input
            placeholder="Search users"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search results dropdown */}
      {searchQuery.trim() && (
        <div className="search-results">
          {searching && <div style={{ padding: '12px 1.25rem', color: 'var(--text3)', fontSize: '14px' }}>Searching...</div>}
          {!searching && searchResults.length === 0 && (
            <div style={{ padding: '12px 1.25rem', color: 'var(--text3)', fontSize: '14px' }}>No users found.</div>
          )}
          {searchResults.map(user => (
            <div
              key={user.username}
              className="suggest-item"
              style={{ cursor: 'pointer' }}
              onClick={() => { navigate(`/profile/${user.username}`); setSearchQuery(''); }}
            >
              <div className="avatar sm" style={{ background: 'var(--accent)' }}>
                {(user.displayName || user.username).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div className="user-name">{user.displayName || user.username}</div>
                <div className="user-handle">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
        Explore
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>}
      {!loading && rants.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No rants to explore yet.</div>
      )}
      {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={fetchExplore} />)}
    </>
  );
}
