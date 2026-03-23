import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RantItem from '../components/RantItem';
import { getExploreFeed, type RantDto } from '../services/rantService';
import { searchUsers, type UserProfileDto } from '../services/userService';
import Icons from '../components/Icons';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [rants, setRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchExplore = async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getExploreFeed(pageNum);
      const items = Array.isArray(res) ? res : [];
      
      if (items.length < 10) setHasMore(false);
      else setHasMore(true);

      if (append) {
        setRants(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueItems = items.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniqueItems];
        });
      } else {
        setRants(items);
      }
    } catch { /* ignore */ }
    finally { 
      setLoading(false); 
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => { 
    setPage(1);
    fetchExplore(1, false); 
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || searchQuery.trim()) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < 300) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchExplore(nextPage, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, page, searchQuery]);

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
      <div className="page-header">
        <div className="search-container">
          {!isSearchExpanded && <div className="header-title">Explore</div>}
          <div className={`search-input-wrapper ${isSearchExpanded ? 'active' : ''}`}>
            <Icons.Search />
            <input
              placeholder="Search users"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus={isSearchExpanded}
              onBlur={() => !searchQuery && setIsSearchExpanded(false)}
            />
          </div>
          {!isSearchExpanded && (
            <button 
              className="icon-btn" 
              onClick={() => setIsSearchExpanded(true)}
              style={{ marginLeft: 'auto' }}
            >
              <Icons.Search />
            </button>
          )}
          {isSearchExpanded && (
             <button 
              className="icon-btn" 
              onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
            >
              ✕
            </button>
          )}
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


      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>}
      {!loading && rants.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No rants to explore yet.</div>
      )}
      {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={() => fetchExplore(1, false)} />)}

      {loadingMore && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text3)' }}>Loading more...</div>}
      {!hasMore && rants.length > 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: '14px' }}>
          You've explored everything! ✨
        </div>
      )}
    </>
  );
}
