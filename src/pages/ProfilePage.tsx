import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RantItem from '../components/RantItem';
import {
  getUserProfile, getUserRants, getUserReplies, getUserLikes,
  toggleFollow, updateProfile, getFollowers, getFollowing,
  uploadProfileImage, deleteProfileImage, uploadBannerImage, deleteBannerImage,
  type UserProfileDto
} from '../services/userService';
import type { RantDto, ReplyDto } from '../services/rantService';
import Icons from '../components/Icons';
import { getInitials, avatarGradient } from '../utils/avatarUtils';
import { parseContent } from '../utils/contentParser';


type ProfileTab = 'rants' | 'replies' | 'likes';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, logout } = useAuth();
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

  // File uploads
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert('File is too large. Maximum size is 100MB.');
      return;
    }
    setUploadingProfile(true);
    try {
      await uploadProfileImage(file);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile image');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert('File is too large. Maximum size is 100MB.');
      return;
    }
    setUploadingBanner(true);
    try {
      await uploadBannerImage(file);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!window.confirm('Remove profile picture?')) return;
    try {
      await deleteProfileImage();
      fetchProfile();
    } catch { /* ignore */ }
  };

  const handleDeleteBannerImage = async () => {
    if (!window.confirm('Remove banner image?')) return;
    try {
      await deleteBannerImage();
      fetchProfile();
    } catch { /* ignore */ }
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
      getUserReplies(profileUsername).then(res => setReplies(Array.isArray(res) ? res : [])).catch(() => { });
    }
    if (activeTab === 'likes' && likedRants.length === 0) {
      getUserLikes(profileUsername).then(res => setLikedRants(Array.isArray(res) ? res : [])).catch(() => { });
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
      <div className="page-header">
        <div className="header-title" style={{ textAlign: 'center' }}>
          {profile.displayName}
        </div>
        <div className="profile-header-actions">
          <button
            className="icon-btn"
            onClick={logout}
            title="Log out"
            style={{ color: 'var(--text3)' }}
          >
            <Icons.Logout />
          </button>
        </div>
      </div>

      <div
        className="profile-banner"
        style={{
          backgroundImage: profile.bannerImageUrl ? `url(${profile.bannerImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isOwnProfile && (
          <div className="banner-edit-overlay">
            <label className="image-upload-label">
              <input type="file" hidden onChange={handleBannerImageUpload} accept="image/*" />
              {uploadingBanner ? '...' : <Icons.Media />}
            </label>
            {profile.bannerImageUrl && (
              <button className="image-delete-btn" onClick={handleDeleteBannerImage}>✕</button>
            )}
          </div>
        )}
      </div>

      <div className="profile-info" style={{ position: 'relative' }}>
        <div className="profile-avatar-wrap">
          <div className="avatar lg" style={{ overflow: 'hidden' }}>
            {profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(profile.displayName)
            )}
            {isOwnProfile && (
              <div className="avatar-edit-overlay">
                <label className="image-upload-label">
                  <input type="file" hidden onChange={handleProfileImageUpload} accept="image/*" />
                  {uploadingProfile ? '...' : <Icons.Media />}
                </label>
                {profile.profileImageUrl && (
                  <button className="image-delete-btn" onClick={handleDeleteProfileImage}>✕</button>
                )}
              </div>
            )}
          </div>
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
          <Icons.CalendarIcon />
          <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Display Name</label>
                {editDisplayName.length === 50 && (
                  <span className="limit-reached" style={{ fontSize: '12px', marginBottom: '6px' }}>Limit reached</span>
                )}
              </div>
              <input
                className="form-input"
                value={editDisplayName}
                onChange={e => setEditDisplayName(e.target.value)}
                maxLength={50}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <label className="form-label" style={{ marginTop: 0 }}>Bio</label>
                {editBio.length === 160 && (
                  <span className="limit-reached" style={{ fontSize: '12px', marginBottom: '6px' }}>Limit reached</span>
                )}
              </div>
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
                    key={u.username}
                    className="suggest-item"
                    onClick={() => { setModalType(null); navigate(`/profile/${u.username}`); }}
                    style={{ borderTop: 'none', borderBottom: '1px solid var(--border)' }}
                  >
                    <div
                      className="avatar sm"
                      style={{
                        background: u.profileImageUrl ? `url(${u.profileImageUrl})` : avatarGradient(u.username),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!u.profileImageUrl && getInitials(u.displayName)}
                    </div>
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
                            setModalUsers(prev => prev.map(mu => mu.username === u.username ? { ...mu, isFollowedByMe: !mu.isFollowedByMe } : mu));
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
          {replies.map(reply => {
            const { elements, mediaLinks } = parseContent(reply.content, navigate);

            return (
              <div
                key={reply.id}
                className="rant"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/rant/${reply.rantId}#reply-${reply.id}`)}
              >
                <div className="rant-body">
                  <div className="rant-header">
                    <span className="rant-author">{reply.displayName || reply.username}</span>
                    <span className="rant-handle">@{reply.username}</span>
                    <span className="rant-dot">·</span>
                    <span className="rant-time">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="rant-text" style={{ marginBottom: '12px' }}>{elements}</div>

                  {/* Media Rendering */}
                  {(reply.mediaUrl || mediaLinks.length > 0) && (
                    <div className="rant-media" style={{ marginTop: '8px', marginBottom: '8px' }}>
                      {/* Uploaded Media */}
                      {reply.mediaUrl && (
                        reply.mediaType === 'video' ? (
                          <video src={reply.mediaUrl} controls className="media-preview" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                        ) : (
                          <img src={reply.mediaUrl} alt="Reply media" className="media-preview" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                        )
                      )}

                      {/* Link-embedded Media (like Giphy) */}
                      {mediaLinks.map((ml, i) => (
                        ml.type === 'video' ? (
                          <video key={i} src={ml.url} controls className="media-preview" style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }} />
                        ) : (
                          <img key={i} src={ml.url} alt="Embedded media" className="media-preview" style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }} />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
