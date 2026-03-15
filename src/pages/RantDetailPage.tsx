import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRantById, getReplies, toggleLike, toggleRerant,
  createReply, type RantDto, type ReplyDto
} from '../services/rantService';

function getInitials(name: string | undefined): string {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

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

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function parseMentions(text: string, navigate: (path: string) => void): React.ReactNode[] {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <span 
          key={i} 
          style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${username}`); }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function RantDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const rantId = Number(id);

  const [rant, setRant] = useState<RantDto | null>(null);
  const [replies, setReplies] = useState<ReplyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reranted, setReranted] = useState(false);
  const [rerantCount, setRerantCount] = useState(0);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ replyId: number; username: string } | null>(null);

  const fetchData = async () => {
    try {
      const [rantData, repliesData] = await Promise.all([
        getRantById(rantId),
        getReplies(rantId),
      ]);
      setRant(rantData);
      setLiked(rantData.isLikedByMe);
      setLikeCount(rantData.likeCount);
      setReranted(rantData.isRerantedByMe);
      setRerantCount(rantData.reRantCount);
      setReplies(repliesData.items ?? (repliesData as unknown as ReplyDto[]));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [rantId]);

  const handleLike = async () => {
    try {
      await toggleLike(rantId);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch { /* ignore */ }
  };

  const handleRerant = async () => {
    try {
      await toggleRerant(rantId);
      setReranted(!reranted);
      setRerantCount(prev => reranted ? prev - 1 : prev + 1);
    } catch { /* ignore */ }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await createReply(rantId, replyContent.trim(), replyingTo?.replyId);
      setReplyContent('');
      setReplyingTo(null);
      fetchData();
    } catch { /* ignore */ }
    finally { setSubmittingReply(false); }
  };

  const handleReplyToReply = (replyId: number, username: string) => {
    setReplyingTo({ replyId, username });
    setReplyContent(`@${username} `);
    // Focus the textarea
    setTimeout(() => {
      const ta = document.querySelector('.compose textarea') as HTMLTextAreaElement | null;
      ta?.focus();
    }, 50);
  };

  const cancelReplyTo = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>;
  }

  if (!rant) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Rant not found.</div>;
  }

  return (
    <>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="rant-detail">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div 
            className="avatar sm" 
            style={{ background: avatarGradient(rant.username), cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${rant.username}`)}
          >
            {getInitials(rant.displayName)}
          </div>
          <div onClick={() => navigate(`/profile/${rant.username}`)} style={{ cursor: 'pointer' }}>
            <div 
              style={{ fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {rant.displayName || rant.username || 'Unknown'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>@{rant.username || '—'}</div>
          </div>
        </div>

        <div className="rant-text">{parseMentions(rant.content, navigate)}</div>
        
        {rant.mediaUrl && (
          <div className="rant-media" style={{ marginTop: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '600px', background: '#000', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {rant.mediaType === 'video' ? (
              <video 
                src={rant.mediaUrl} 
                controls 
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '600px' }} 
              />
            ) : (
              <img 
                src={rant.mediaUrl} 
                alt="Media" 
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain', cursor: 'pointer' }} 
                onClick={() => window.open(rant.mediaUrl, '_blank')}
              />
            )}
          </div>
        )}
        {rant.quoteRant && (
          <div className="quote-rant-card" style={{ border: '1px solid var(--border2)', borderRadius: '12px', padding: '12px', marginTop: '16px', marginBottom: '16px', cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => navigate(`/rant/${rant.quoteRant!.id}`)}>
            <div className="rant-header" style={{ marginBottom: '6px' }}>
              <span className="rant-author" style={{ fontSize: '14px' }}>{rant.quoteRant.displayName || rant.quoteRant.username}</span>
              <span className="rant-handle" style={{ fontSize: '14px' }}>@{rant.quoteRant.username}</span>
            </div>
            <div className="rant-text" style={{ fontSize: '14px', marginBottom: 0 }}>{parseMentions(rant.quoteRant.content, navigate)}</div>
            
            {rant.quoteRant.mediaUrl && (
              <div className="rant-media" style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '300px', background: '#000', display: 'flex', justifyContent: 'center' }}>
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
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain' }} 
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="rant-detail-meta">
          {new Date(rant.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        <div className="rant-detail-stats">
          <div className="stat-item"><strong>{formatCount(rerantCount)}</strong> Re-rants</div>
          <div className="stat-item"><strong>{formatCount(likeCount)}</strong> Likes</div>
          <div className="stat-item"><strong>{formatCount(rant.replyCount)}</strong> Replies</div>
        </div>

        <div className="rant-actions" style={{ padding: '4px 0' }}>
          <span className="action reply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '20px', height: '20px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </span>
          <span className="action re-rant" style={{ color: reranted ? 'var(--green)' : '' }} onClick={handleRerant}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '20px', height: '20px' }}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </span>
          <span
            className="action like"
            style={{ color: liked ? 'var(--red)' : '' }}
            onClick={handleLike}
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" style={{ width: '20px', height: '20px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
        </div>
      </div>

      {/* Reply compose */}
      <div className="compose" style={{ borderBottom: '1px solid var(--border)' }}>
        {replyingTo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 12px', fontSize: '13px', color: 'var(--accent)',
            borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,0.06)'
          }}>
            <span>Replying to <strong>@{replyingTo.username}</strong></span>
            <button
              onClick={cancelReplyTo}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)',
                cursor: 'pointer', fontSize: '16px', padding: '0 4px',
                lineHeight: 1
              }}
              title="Cancel reply"
            >✕</button>
          </div>
        )}
        <div className="compose-input">
          <textarea
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Write a reply...'}
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
          />
          <div className="compose-actions">
            <button
              className="compose-submit"
              onClick={handleSubmitReply}
              disabled={submittingReply}
            >
              {submittingReply ? '...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.map((reply, idx) => (
        <div className="reply-item" key={reply.id}>
          <div className="thread-col">
            <div 
              className="avatar sm" 
              style={{ background: avatarGradient(reply.username), cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${reply.username}`)}
            >
              {getInitials(reply.displayName)}
            </div>
            {idx < replies.length - 1 && <div className="thread-line"></div>}
          </div>
          <div className="rant-body">
            <div className="rant-header" onClick={() => navigate(`/profile/${reply.username}`)} style={{ cursor: 'pointer' }}>
              <span 
                className="rant-author"
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                {reply.displayName || reply.username || 'Unknown'}
              </span>
              <span className="rant-handle">@{reply.username || '—'}</span>
              <span className="rant-dot">·</span>
              <span className="rant-time">{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}</span>
            </div>
            {reply.parentReplyUsername && (
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
                Replying to <span style={{ color: 'var(--accent)' }}>@{reply.parentReplyUsername}</span>
              </div>
            )}
            <div className="rant-text">{parseMentions(reply.content, navigate)}</div>
            <div className="rant-actions">
              <span className="action reply" onClick={() => handleReplyToReply(reply.id, reply.username)} style={{ cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {reply.replyCount}
              </span>
              <span className="action like">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {reply.likeCount}
              </span>
            </div>
          </div>
        </div>
      ))}

      {replies.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No replies yet. Be the first!</div>
      )}
    </>
  );
}
