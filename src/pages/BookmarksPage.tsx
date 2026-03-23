import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RantItem from '../components/RantItem';
import { get } from '../services/api';
import type { RantDto } from '../services/rantService';

export default function BookmarksPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [rants, setRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await get<RantDto[]>('/timelines/bookmarks');
      setRants(Array.isArray(res) ? res : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    fetchBookmarks();
  }, [isLoggedIn]);

  return (
    <>
      <div className="page-header">
        <div className="header-title">Bookmarks</div>
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>}

      {!loading && rants.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>
          No bookmarks yet. Bookmark a rant to save it here.
        </div>
      )}

      {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={fetchBookmarks} />)}
    </>
  );
}
