import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RantItem from '../components/RantItem';
import { getHomeFeed, getExploreFeed, createRant, type RantDto } from '../services/rantService';

export default function FeedPage() {
  const { user, isLoggedIn } = useAuth();
  const [rants, setRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const initials = user
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const fetchFeed = async () => {
    try {
      // Logged-in users get home timeline, guests get explore/public feed
      if (isLoggedIn) {
        const res = await getHomeFeed();
        const items = Array.isArray(res) ? res : (res.items ?? []);
        setRants(items);
      } else {
        const res = await getExploreFeed();
        setRants(Array.isArray(res) ? res : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeed(); }, [isLoggedIn]);

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
            <textarea
              placeholder="Start a rant..."
              value={content}
              onChange={e => setContent(e.target.value)}
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
              <label className="action-btn" style={{ cursor: 'pointer' }}>
                <input type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
                🖼️
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
      {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={fetchFeed} />)}
    </>
  );
}
