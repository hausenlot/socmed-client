import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  getRantById, getReplies, toggleLike, toggleRerant,
  createReply, toggleReplyLike, type RantDto, type ReplyDto
} from '../services/rantService';
import MentionSuggestions from '../components/MentionSuggestions';
import { useMentions } from '../hooks/useMentions';
import { parseContent } from '../utils/contentParser';
import Icons from '../components/Icons';

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


export default function RantDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const rantId = id || '';

  const [rant, setRant] = useState<RantDto | null>(null);
  const [replies, setReplies] = useState<ReplyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reranted, setReranted] = useState(false);
  const [rerantCount, setRerantCount] = useState(0);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ replyId: string; username: string } | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('File is too large. Maximum size is 100MB.');
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const {
    suggestions,
    activeIndex,
    selectUser,
    handleKeyDown,
    onTextareaChange,
    onTextareaClick,
    textareaRef,
    showSuggestions
  } = useMentions(replyContent, setReplyContent);

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
      setReplies(repliesData);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [rantId]);
  
  // Handle scrolling to a specific reply from deep link
  useEffect(() => {
    if (!loading && replies.length > 0 && location.hash) {
      const id = location.hash.replace('#reply-', '');
      const element = document.getElementById(`reply-${id}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-reply');
          setTimeout(() => {
            element.classList.remove('highlight-reply');
          }, 3000); // Highlight for 3 seconds
        }, 100);
      }
    }
  }, [loading, replies, location.hash]);

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

  const handleLikeReply = async (replyId: string) => {
    try {
      await toggleReplyLike(replyId);
      setReplies(prev => prev.map(r => {
        if (r.id === replyId) {
          return {
            ...r,
            isLikedByMe: !r.isLikedByMe,
            likeCount: r.isLikedByMe ? r.likeCount - 1 : r.likeCount + 1
          };
        }
        return r;
      }));
    } catch { /* ignore */ }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() && !mediaFile) return;
    setSubmittingReply(true);
    try {
      await createReply(rantId, replyContent.trim(), replyingTo?.replyId, mediaFile || undefined);
      setReplyContent('');
      setReplyingTo(null);
      removeFile();
      fetchData();
    } catch { /* ignore */ }
    finally { setSubmittingReply(false); }
  };

  const handleReplyToReply = (replyId: string, username: string) => {
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
            style={{ 
              background: rant.profileImageUrl ? `url(${rant.profileImageUrl})` : avatarGradient(rant.username),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer' 
            }}
            onClick={() => navigate(`/profile/${rant.username}`)}
          >
            {!rant.profileImageUrl && getInitials(rant.displayName)}
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

        <div className="rant-text" style={{ marginBottom: '16px' }}>
          {(() => {
            const { elements, mediaLinks } = parseContent(rant.content, navigate);
            return (
              <>
                <div style={{ fontSize: '19px', lineHeight: '1.4' }}>{elements}</div>
                {mediaLinks.map((link, idx) => (
                  <div key={idx} className="rant-media embed" style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '500px', background: '#000', display: 'flex', justifyContent: 'center' }}>
                    {link.type === 'video' ? (
                      <video src={link.url} controls style={{ maxWidth: '100%', maxHeight: '500px' }} />
                    ) : (
                      <img src={link.url} alt="Embedded" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => window.open(link.url, '_blank')} />
                    )}
                  </div>
                ))}
              </>
            );
          })()}
        </div>
        
        {rant.mediaUrl && (
          <div className="rant-media" style={{ marginTop: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '600px', marginBottom: '16px' }}>
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
                    style={{ width: '100%', height: 'auto', maxHeight: '600px', display: 'block', cursor: 'pointer' }} 
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
            <div className="rant-text" style={{ fontSize: '14px', marginBottom: 0 }}>
              {(() => {
                const { elements, mediaLinks } = parseContent(rant.quoteRant.content, navigate);
                return (
                  <>
                    <div>{elements}</div>
                    {mediaLinks.map((link, idx) => (
                      <div key={idx} className="rant-media embed sm" style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '200px', background: '#000', display: 'flex', justifyContent: 'center' }}>
                        {link.type === 'video' ? (
                          <video src={link.url} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        ) : (
                          <img src={link.url} alt="Embedded" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
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
      <div className="compose" style={{ borderBottom: '1px solid var(--border)', flexDirection: 'column', gap: 0, padding: 0 }}>
        {replyingTo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 1.25rem', fontSize: '13px', color: 'var(--accent)',
            borderBottom: '1px solid var(--border)', background: 'rgba(123, 104, 238, 0.05)'
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
        <div className="compose-input" style={{ padding: '1.25rem' }}>
          {showSuggestions && (
            <MentionSuggestions 
              suggestions={suggestions} 
              activeIndex={activeIndex} 
              onSelect={selectUser} 
            />
          )}
          <textarea
            ref={textareaRef}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Write a reply...'}
            value={replyContent}
            onChange={onTextareaChange}
            onKeyDown={handleKeyDown}
            onClick={onTextareaClick}
            maxLength={1000}
          />

          {mediaPreview && (
            <div style={{ position: 'relative', marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '200px' }}>
              <img src={mediaPreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
              <button 
                onClick={removeFile}
                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
              >✕</button>
            </div>
          )}

          <div className="compose-actions">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*,video/*"
              onChange={handleFileChange} 
            />
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Add media">
              <Icons.Media />
            </button>

            <button
              className="compose-submit"
              onClick={handleSubmitReply}
              disabled={submittingReply || (!replyContent.trim() && !mediaFile)}
            >
              {replyContent.length === 1000 && (
                <span className="limit-reached">Limit reached</span>
              )}
              {submittingReply ? '...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.map((reply, idx) => (
        <div className="reply-item" key={reply.id} id={`reply-${reply.id}`}>
          <div className="thread-col">
            <div 
              className="avatar sm" 
              style={{ 
                background: reply.profileImageUrl ? `url(${reply.profileImageUrl})` : avatarGradient(reply.username),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer' 
              }}
              onClick={() => navigate(`/profile/${reply.username}`)}
            >
              {!reply.profileImageUrl && getInitials(reply.displayName)}
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
            <div className="rant-text">
              {(() => {
                const { elements, mediaLinks } = parseContent(reply.content, navigate);
                return (
                  <>
                    <div>{elements}</div>
                    {mediaLinks.map((link, idx) => (
                      <div key={idx} className="rant-media embed sm" style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '300px' }}>
                        {link.type === 'video' ? (
                          <video src={link.url} controls style={{ maxWidth: '100%', maxHeight: '300px' }} />
                        ) : (
                          <img src={link.url} alt="Embedded" style={{ width: '100%', maxHeight: '300px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(link.url, '_blank')} />
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            {reply.mediaUrl && (
              <div className="rant-media" style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: '300px', marginBottom: '8px' }}>
                {reply.mediaType === 'video' ? (
                  <video 
                    src={reply.mediaUrl} 
                    controls 
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }} 
                  />
                ) : (
                  <img 
                    src={reply.mediaUrl} 
                    alt="Media" 
                    style={{ width: '100%', height: 'auto', maxHeight: '300px', display: 'block', cursor: 'pointer' }} 
                    onClick={() => window.open(reply.mediaUrl, '_blank')}
                  />
                )}
              </div>
            )}

            <div className="rant-actions">
              <span className="action reply" onClick={() => handleReplyToReply(reply.id, reply.username)} style={{ cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {reply.replyCount}
              </span>
              <span 
                className="action like" 
                onClick={() => handleLikeReply(reply.id)} 
                style={{ color: reply.isLikedByMe ? 'var(--red)' : '', cursor: 'pointer' }}
              >
                <svg viewBox="0 0 24 24" fill={reply.isLikedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {reply.likeCount}
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
