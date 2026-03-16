import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import RantItem from '../components/RantItem';
import MentionSuggestions from '../components/MentionSuggestions';
import { useMentions } from '../hooks/useMentions';
import { getHomeFeed, getExploreFeed, createRant, type RantDto } from '../services/rantService';
import Icons from '../components/Icons';

export default function FeedPage() {
  const { user, isLoggedIn } = useAuth();
  const [rants, setRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const {
    suggestions,
    activeIndex,
    selectUser,
    handleKeyDown,
    onTextareaChange,
    onTextareaClick,
    textareaRef,
    showSuggestions
  } = useMentions(content, setContent);

  const initials = user
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const fetchFeed = async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      let res: RantDto[];
      if (isLoggedIn) {
        res = await getHomeFeed(pageNum);
      } else {
        res = await getExploreFeed(pageNum);
      }

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
    fetchFeed(1, false); 
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < 300) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(nextPage, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, page, isLoggedIn]);

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    try {
      await createRant(content.trim(), undefined, mediaFile || undefined);
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      fetchFeed();
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  return (
    <>
      <div className="tab-header">
        <div className="tab active">For you</div>
      </div>

      {/* Only show compose box when logged in */}
      {isLoggedIn && (
        <div className="compose">
          <div className="avatar">{initials}</div>
          <div className="compose-input">
            {showSuggestions && (
              <MentionSuggestions 
                suggestions={suggestions} 
                activeIndex={activeIndex} 
                onSelect={selectUser} 
              />
            )}
            <textarea
              ref={textareaRef}
              placeholder="Start a rant..."
              value={content}
              onChange={onTextareaChange}
              onKeyDown={handleKeyDown}
              onClick={onTextareaClick}
            />
            {mediaPreview && (
              <div className="media-preview" style={{ position: 'relative', marginTop: '10px' }}>
                <button 
                  onClick={removeMedia}
                  style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 1, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                >
                  ✕
                </button>
                {mediaFile?.type.startsWith('video') ? (
                  <video src={mediaPreview} controls style={{ maxWidth: '100%', borderRadius: '12px' }} />
                ) : (
                  <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                )}
              </div>
            )}
            <div className="compose-actions">
              <label className="action-btn" style={{ cursor: 'pointer', display: 'flex', color: 'var(--accent)' }}>
                <input type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
                <Icons.Media />
              </label>
              <button className="compose-submit" onClick={handlePost} disabled={posting || (!content.trim() && !mediaFile)}>
                {posting ? '...' : 'Rant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>}
      {!loading && rants.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No rants yet. Be the first to rant!</div>
      )}
      {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={() => fetchFeed(1, false)} />)}
      
      {loadingMore && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text3)' }}>Loading more...</div>}
      {!hasMore && rants.length > 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: '14px' }}>
          You've reached the end of the rants! ✨
        </div>
      )}
    </>
  );
}
