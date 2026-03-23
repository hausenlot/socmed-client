import type { UserProfileDto } from '../services/userService';

interface MentionSuggestionsProps {
  suggestions: UserProfileDto[];
  activeIndex: number;
  onSelect: (user: UserProfileDto) => void;
}

export default function MentionSuggestions({ suggestions, activeIndex, onSelect }: MentionSuggestionsProps) {

  if (suggestions.length === 0) return null;

  const getInitials = (user: UserProfileDto) => {
    return (user.displayName || user.username)
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarGradient = (username: string) => {
    const gradients = [
      'linear-gradient(135deg,#7b68ee,#4fd1c5)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#22c55e,#0ea5e9)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
      'linear-gradient(135deg,#06b6d4,#3b82f6)',
      'linear-gradient(135deg,#f97316,#facc15)',
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="mention-suggestions">
      {suggestions.map((user, index) => (
        <div
          key={user.id}
          className={`mention-item ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(user)}
        >
          <div 
            className="avatar sm" 
            style={{ 
              background: user.profileImageUrl ? `url(${user.profileImageUrl})` : avatarGradient(user.username),
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!user.profileImageUrl && getInitials(user)}
          </div>
          <div className="user-info">
            <span className="display-name">{user.displayName || user.username}</span>
            <span className="username">@{user.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
