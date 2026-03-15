import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RantItem from '../components/RantItem';
import {
  getUserProfile, getUserRants, getUserReplies, getUserLikes,
  toggleFollow, updateProfile, getFollowers, getFollowing, type UserProfileDto
} from '../services/userService';
import type { RantDto, ReplyDto } from '../services/rantService';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

type ProfileTab = 'rants' | 'replies' | 'likes';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const profileUsername = username || currentUser?.username || '';

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [rants, setRants] = useState<RantDto[]>([]);
  const [replies, setReplies] = useState<ReplyDto[]>([]);
  const [likedRants, setLikedRants] = useState<RantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('rants');

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Follow lists modal
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<UserProfileDto[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const isOwnProfile = currentUser?.username === profileUsername;

  const fetchProfile = async () => {
    if (!profileUsername) return;
    try {
      const [profileData, rantsData] = await Promise.all([
        getUserProfile(profileUsername),
        getUserRants(profileUsername),
      ]);
      setProfile(profileData);
      setIsFollowing(profileData.isFollowedByMe);
      setRants(rantsData.items ?? (rantsData as unknown as RantDto[]));
      setEditDisplayName(profileData.displayName || '');
      setEditBio(profileData.bio || '');
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    setActiveTab('rants');
    fetchProfile();
  }, [profileUsername]);

  // Fetch tab data on switch
  useEffect(() => {
    if (!profileUsername) return;
    if (activeTab === 'replies' && replies.length === 0) {
      getUserReplies(profileUsername).then(res => setReplies(Array.isArray(res) ? res : [])).catch(() => {});
    }
    if (activeTab === 'likes' && likedRants.length === 0) {
      getUserLikes(profileUsername).then(res => setLikedRants(Array.isArray(res) ? res : [])).catch(() => {});
    }
  }, [activeTab, profileUsername]);

  const handleFollowToggle = async () => {
    if (!profileUsername) return;
    try {
      await toggleFollow(profileUsername);
      setIsFollowing(!isFollowing);
    } catch { /* ignore */ }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName: editDisplayName, bio: editBio });
      setEditing(false);
      fetchProfile();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleOpenFollowModal = async (type: 'followers' | 'following') => {
    if (!profileUsername) return;
    setModalType(type);
    setModalLoading(true);
    setModalUsers([]);
    try {
      if (type === 'followers') {
        const users = await getFollowers(profileUsername);
        setModalUsers(users);
      } else {
        const users = await getFollowing(profileUsername);
        setModalUsers(users);
      }
    } catch { /* ignore */ }
    finally { setModalLoading(false); }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>User not found.</div>;
  }

  return (
    <>
      <div className="tab-header" style={{ padding: '0.5rem 1.25rem', justifyContent: 'flex-start', gap: '16px', display: 'flex', alignItems: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ margin: 0 }}>← Back</button>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>{profile.displayName}</span>
      </div>

      <div className="profile-banner"></div>

      <div className="profile-info" style={{ position: 'relative' }}>
        <div className="profile-avatar-wrap">
          <div className="avatar lg">{getInitials(profile.displayName)}</div>
        </div>
        {isOwnProfile ? (
          <button className="edit-profile-btn" onClick={() => setEditing(true)}>Edit profile</button>
        ) : (
          <button
            className="edit-profile-btn"
            onClick={handleFollowToggle}
            style={{
              background: isFollowing ? 'transparent' : 'var(--accent)',
              color: isFollowing ? 'var(--text)' : '#fff',
              border: isFollowing ? '1px solid var(--border2)' : 'none',
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
        <div className="profile-name">{profile.displayName}</div>
        <div className="profile-handle">@{profile.username}</div>
        {profile.bio && <div className="profile-bio">{profile.bio}</div>}
        <div className="profile-meta">
          <span>📅 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="profile-stats">
          <span style={{ cursor: 'pointer' }} onClick={() => handleOpenFollowModal('following')}>
            <span className="stat-num">{profile.followingCount}</span> <span className="stat-label">Following</span>
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => handleOpenFollowModal('followers')}>
            <span className="stat-num">{profile.followerCount}</span> <span className="stat-label">Followers</span>
          </span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit profile</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                value={editDisplayName}
                onChange={e => setEditDisplayName(e.target.value)}
                maxLength={50}
              />
              <label className="form-label" style={{ marginTop: '12px' }}>Bio</label>
              <textarea
                className="form-input"
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={160}
                rows={3}
              />
            </div>
            <div className="modal-footer">
              <button className="compose-submit" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follows Modal */}
      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ textTransform: 'capitalize' }}>{modalType}</h3>
              <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: 0 }}>
              {modalLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
              ) : modalUsers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No {modalType} to show.</div>
              ) : (
                modalUsers.map(u => (
                  <div 
                    key={u.id} 
                    className="suggest-item" 
                    onClick={() => { setModalType(null); navigate(`/profile/${u.username}`); }}
                    style={{ borderTop: 'none', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="avatar sm">{getInitials(u.displayName)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{u.displayName}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text3)' }}>@{u.username}</span>
                    </div>
                    {currentUser?.username !== u.username && (
                      <button
                        className="follow-btn"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!currentUser) { navigate('/login'); return; }
                          try {
                            await toggleFollow(u.username);
                            setModalUsers(prev => prev.map(mu => mu.id === u.id ? { ...mu, isFollowedByMe: !mu.isFollowedByMe } : mu));
                            fetchProfile();
                          } catch { /* ignore */ }
                        }}
                        style={{
                          background: u.isFollowedByMe ? 'transparent' : 'var(--accent)',
                          color: u.isFollowedByMe ? 'var(--text)' : '#fff',
                          border: u.isFollowedByMe ? '1px solid var(--border2)' : 'none',
                        }}
                      >
                        {u.isFollowedByMe ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="tab-header">
        <div className={`tab ${activeTab === 'rants' ? 'active' : ''}`} onClick={() => setActiveTab('rants')}>Rants</div>
        <div className={`tab ${activeTab === 'replies' ? 'active' : ''}`} onClick={() => setActiveTab('replies')}>Replies</div>
        <div className={`tab ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>Likes</div>
      </div>

      {/* Rants tab */}
      {activeTab === 'rants' && (
        <>
          {rants.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No rants yet.</div>
          )}
          {rants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={fetchProfile} />)}
        </>
      )}

      {/* Replies tab */}
      {activeTab === 'replies' && (
        <>
          {replies.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No replies yet.</div>
          )}
          {replies.map(reply => (
            <div key={reply.id} className="rant" style={{ cursor: 'default' }}>
              <div className="rant-body">
                <div className="rant-header">
                  <span className="rant-author">{reply.displayName || reply.username}</span>
                  <span className="rant-handle">@{reply.username}</span>
                  <span className="rant-dot">·</span>
                  <span className="rant-time">{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="rant-text">{reply.content}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Likes tab */}
      {activeTab === 'likes' && (
        <>
          {likedRants.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>No liked rants yet.</div>
          )}
          {likedRants.map(rant => <RantItem key={rant.id} rant={rant} onUpdate={fetchProfile} />)}
        </>
      )}
    </>
  );
}
