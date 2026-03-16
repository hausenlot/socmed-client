import React from 'react';

export interface ParsedContent {
  elements: React.ReactNode[];
  mediaLinks: Array<{ url: string; type: 'image' | 'video' }>;
}

const MEDIA_REGEX = {
  image: /\.(gif|jpe?g|png|webp|bmp)$/i,
  video: /\.(mp4|webm|ogg)$/i,
};

/**
 * Centralized parser for Rant content.
 * Handles mentions (@user), hashtags (#tag), and detects media links for auto-embedding.
 */
export function parseContent(
  text: string, 
  navigate: (path: string) => void
): ParsedContent {
  if (!text) return { elements: [], mediaLinks: [] };
  
  const mediaLinks: Array<{ url: string; type: 'image' | 'video' }> = [];
  
  // Clean split approach: match URLs and mentions
  const regex = /(https?:\/\/[^\s]+|@\w+)/g;
  const parts = text.split(regex);
  
  const elements = parts.map((part, i) => {
    if (!part) return null;

    // Handle Mentions
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <span 
          key={i} 
          className="mention-link"
          style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${username}`); }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {part}
        </span>
      );
    }

    // Handle URLs
    if (part.startsWith('http')) {
      const lowerPart = part.toLowerCase();
      let actualMediaUrl = part;
      let isMedia = false;
      let mediaType: 'image' | 'video' = 'image';

      // Detect Media - Prioritize specialized services
      if (lowerPart.includes('tenor.com')) {
        isMedia = true;
        // If it's already a media.tenor.com link, keep it
        if (!lowerPart.includes('media.tenor.com')) {
          const match = part.match(/tenor\.com\/(?:view\/)?(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]+)/);
          if (match && match[1]) {
            actualMediaUrl = `https://media.tenor.com/m/${match[1]}/tenor.gif`;
          }
        }
      } else if (lowerPart.includes('giphy.com')) {
        isMedia = true;
        // If it's not a direct media link, try to convert it
        if (!lowerPart.includes('media.giphy.com') && !lowerPart.includes('media0.giphy.com') && !lowerPart.includes('media1.giphy.com') && !lowerPart.includes('media2.giphy.com') && !lowerPart.includes('media3.giphy.com') && !lowerPart.includes('media4.giphy.com')) {
          const match = part.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)/);
          if (match && match[1]) {
            actualMediaUrl = `https://media.giphy.com/media/${match[1]}/giphy.gif`;
          }
        }
      } else if (MEDIA_REGEX.image.test(lowerPart)) {
        isMedia = true;
      } else if (MEDIA_REGEX.video.test(lowerPart)) {
        isMedia = true;
        mediaType = 'video';
      }

      if (isMedia) {
        // Prevent duplicate media links if same URL is used twice
        if (!mediaLinks.some(ml => ml.url === actualMediaUrl)) {
          mediaLinks.push({ url: actualMediaUrl, type: mediaType });
        }
        // User requested to hide the link if it's rendered as media
        return null;
      }

      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {part}
        </a>
      );
    }

    return part;
  }).filter(Boolean);

  return { elements, mediaLinks };
}
