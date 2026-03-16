import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RantDto } from '../services/rantService';
import { toggleLike, toggleRerant, createRant, toggleBookmark } from '../services/rantService';
import { useAuth } from '../context/AuthContext';
import { isLoggedIn } from '../services/authService';
import { parseContent } from '../utils/contentParser';

function getInitials(name: string | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}


// Deterministic color from username
function avatarGradient(username: string | undefined): string {
  const gradients = [
    'linear-gradient(135deg,#7b68ee,#4fd1c5)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#22c55e,#0ea5e9)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ];
  const key = username || 'unknown';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function RantItem({ rant, onUpdate }: { rant: RantDto; onUpdate?: () => void }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  // Handle ASP.NET PascalCase: userName vs username, etc.
  const r = rant as unknown as Record<string, unknown>;
  const username = (rant.username || r['userName'] || '') as string;
  const displayName = (rant.displayName || r['displayName'] || username) as string;
  const likeCountInit = rant.likeCount ?? (r['likeCount'] as number) ?? 0;
  const rerantCountInit = rant.reRantCount ?? (r['reRantCount'] as number) ?? 0;

  const [liked, setLiked] = useState(rant.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(likeCountInit);
  const [reranted, setReranted] = useState(rant.isRerantedByMe ?? false);
  const [rerantCount, setRerantCount] = useState(rerantCountInit);
  const [bookmarked, setBookmarked] = useState(rant.isBookmarkedByMe ?? false);

  // Quote Re-rant state
  const [showRerantMenu, setShowRerantMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [postingQuote, setPostingQuote] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      await toggleLike(rant.id);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      onUpdate?.();
    } catch { /* ignore */ }
  };

  const handleRerant = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      await toggleRerant(rant.id);
      setReranted(!reranted);
      setRerantCount(prev => reranted ? prev - 1 : prev + 1);
      onUpdate?.();
    } catch { /* ignore */ }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      await toggleBookmark(rant.id);
      setBookmarked(!bookmarked);
      onUpdate?.();
    } catch { /* ignore */ }
  };

  const handlePostQuote = async () => {
    if (!quoteContent.trim()) return;
    setPostingQuote(true);
    try {
      await createRant(quoteContent.trim(), rant.id);
      setQuoteContent('');
      setShowQuoteModal(false);
      onUpdate?.(); // Refresh feed to show new quote
    } catch { /* ignore */ }
    finally { setPostingQuote(false); }
  };

  return (
    <>
    <div className="rant" style={{ flexDirection: 'column', gap: 0 }} onClick={() => {
        if (!showQuoteModal) navigate(`/rant/${rant.id}`);
    }}>
      {rant.reRantedByUsername && (
        <div className="rant-re-ranted-by" style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '8px', paddingLeft: '40px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          {rant.reRantedByUsername === currentUser?.username ? 'You' : `${rant.reRantedByUsername}`} re-ranted
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <div 
          className="avatar sm" 
          style={{ background: avatarGradient(username), flexShrink: 0, marginTop: '2px', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${username}`); }}
        >
          {getInitials(displayName)}
        </div>
        <div className="rant-body">
          <div className="rant-header">
          <span 
            className="rant-author" 
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${username}`); }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >{displayName}</span>
          <span 
            className="rant-handle"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${username}`); }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >@{username}</span>
          <span className="rant-dot">·</span>
          <span className="rant-time">{rant.createdAt ? timeAgo(rant.createdAt) : ''}</span>
        </div>

        <div className="rant-text">
          {(() => {
            const { elements, mediaLinks } = parseContent(rant.content, navigate);
            return (
              <>
                <div>{elements}</div>
                {mediaLinks.map((link, idx) => (
                  <div key={idx} className="rant-media embed" style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '300px' }}>
                    {link.type === 'video' ? (
                      <video src={link.url} controls style={{ maxWidth: '100%', maxHeight: '300px' }} onClick={e => e.stopPropagation()} />
                    ) : (
                      <img src={link.url} alt="Embedded" style={{ width: '100%', maxHeight: '300px', display: 'block' }} onClick={e => { e.stopPropagation(); window.open(link.url, '_blank'); }} />
                    )}
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {rant.mediaUrl && (
          <div className="rant-media" style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '500px' }}>
            {rant.mediaType === 'video' ? (
              <video 
                src={rant.mediaUrl} 
                controls 
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px' }} 
                onClick={e => e.stopPropagation()}
              />
            ) : (
                  <img 
                    src={rant.mediaUrl} 
                    alt="Media" 
                    style={{ width: '100%', height: 'auto', maxHeight: '500px', display: 'block' }} 
                onClick={e => { e.stopPropagation(); window.open(rant.mediaUrl, '_blank'); }}
              />
            )}
          </div>
        )}

        {rant.quoteRant && (
          <div className="quote-rant-card" style={{ border: '1px solid var(--border2)', borderRadius: '12px', padding: '12px', marginTop: '12px', marginBottom: '12px', transition: 'background 0.1s' }} onClick={(e) => { e.stopPropagation(); navigate(`/rant/${rant.quoteRant!.id}`); }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="rant-header" style={{ marginBottom: '6px' }}>
              <div 
                className="avatar sm" 
                style={{ background: avatarGradient(rant.quoteRant.username), width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${rant.quoteRant!.username}`); }}
              >
                {getInitials(rant.quoteRant.displayName || rant.quoteRant.username)}
              </div>
              <span 
                className="rant-author" 
                style={{ fontSize: '14px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${rant.quoteRant!.username}`); }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >{rant.quoteRant.displayName || rant.quoteRant.username}</span>
              <span 
                className="rant-handle" 
                style={{ fontSize: '14px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${rant.quoteRant!.username}`); }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >@{rant.quoteRant.username}</span>
              <span className="rant-dot">·</span>
              <span className="rant-time" style={{ fontSize: '14px' }}>{timeAgo(rant.quoteRant.createdAt)}</span>
            </div>
            <div className="rant-text" style={{ fontSize: '14px', marginBottom: 0 }}>
              {(() => {
                const { elements, mediaLinks } = parseContent(rant.quoteRant.content, navigate);
                return (
                  <>
                    <div>{elements}</div>
                    {mediaLinks.map((link, idx) => (
                      <div key={idx} className="rant-media embed sm" style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '200px' }}>
                        {link.type === 'video' ? (
                          <video src={link.url} controls style={{ maxWidth: '100%', maxHeight: '200px' }} onClick={e => e.stopPropagation()} />
                        ) : (
                          <img src={link.url} alt="Embedded" style={{ width: '100%', maxHeight: '200px', display: 'block' }} onClick={e => { e.stopPropagation(); window.open(link.url, '_blank'); }} />
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
            {rant.quoteRant.mediaUrl && (
              <div className="rant-media" style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '300px' }}>
                {rant.quoteRant.mediaType === 'video' ? (
                  <video 
                    src={rant.quoteRant.mediaUrl} 
                    controls
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }} 
                  />
                ) : (
                  <img 
                    src={rant.quoteRant.mediaUrl} 
                    alt="Media" 
                    style={{ width: '100%', height: 'auto', maxHeight: '300px', display: 'block' }} 
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="rant-actions">
          <span className="action reply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {formatCount(rant.replyCount)}
          </span>
          <span 
            className={`action re-rant`} 
            style={{ color: reranted ? 'var(--green)' : '', position: 'relative' }} 
            onClick={(e) => { e.stopPropagation(); if (!isLoggedIn()) { navigate('/login'); return; } setShowRerantMenu(!showRerantMenu); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> {formatCount(rerantCount)}
            
            {showRerantMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '4px', zIndex: 10, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', color: reranted ? 'var(--red)' : 'var(--text)' }} 
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => { handleRerant(e); setShowRerantMenu(false); }}
                >
                  {reranted ? 'Undo Re-rant' : '🔁 Re-rant'}
                </div>
                <div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', color: 'var(--text)' }} 
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => { e.stopPropagation(); setShowRerantMenu(false); setShowQuoteModal(true); }}
                >
                  💬 Quote Re-rant
                </div>
              </div>
            )}
          </span>
          <span
            className="action like"
            style={{ color: liked ? 'var(--red)' : '' }}
            onClick={handleLike}
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {formatCount(likeCount)}
          </span>
          <span
            className="action bookmark"
            style={{ color: bookmarked ? 'var(--blue, #1da1f2)' : '' }}
            onClick={handleBookmark}
          >
            <svg viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </span>
        </div>
        </div>
      </div>
    </div>

    {showQuoteModal && (
      <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Quote Re-rant</h3>
            <button className="modal-close" onClick={() => setShowQuoteModal(false)}>✕</button>
          </div>
          <div className="modal-body" style={{ padding: '16px 20px' }}>
            <div className="compose" style={{ padding: 0, border: 'none', marginBottom: '16px' }}>
              <div className="compose-input" style={{ marginLeft: 0 }}>
                <textarea
                  placeholder="Add a comment..."
                  value={quoteContent}
                  onChange={e => setQuoteContent(e.target.value)}
                  style={{ minHeight: '80px', fontSize: '16px' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Embedded Original Rant Card */}
            <div className="quote-rant-card" style={{ border: '1px solid var(--border2)', borderRadius: '12px', padding: '12px', opacity: 0.8 }}>
              <div className="rant-header" style={{ marginBottom: '4px' }}>
                <div className="avatar sm" style={{ background: avatarGradient(username), width: '20px', height: '20px', fontSize: '10px' }}>
                  {getInitials(displayName)}
                </div>
                <span className="rant-author" style={{ fontSize: '14px' }}>{displayName}</span>
                <span className="rant-handle" style={{ fontSize: '14px' }}>@{username}</span>
                <span className="rant-dot">·</span>
                <span className="rant-time" style={{ fontSize: '14px' }}>{timeAgo(rant.createdAt)}</span>
              </div>
              <div className="rant-text" style={{ fontSize: '14px' }}>{rant.content}</div>
            </div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <button className="edit-profile-btn" style={{ margin: 0 }} onClick={() => setShowQuoteModal(false)}>Cancel</button>
            <button className="compose-submit" onClick={handlePostQuote} disabled={postingQuote || !quoteContent.trim()}>
              {postingQuote ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
