import { useState, useEffect, useCallback, useRef } from 'react';
import { searchUsers, type UserProfileDto } from '../services/userService';

export function useMentions(content: string, setContent: (val: string) => void) {
  const [suggestions, setSuggestions] = useState<UserProfileDto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Detect mention trigger
  useEffect(() => {
    const lastAt = content.lastIndexOf('@', cursorPos - 1);
    if (lastAt !== -1) {
      const textAfterAt = content.slice(lastAt + 1, cursorPos);
      // Valid mention query: no spaces, follows @ immediately or after space/newline
      const isValidTrigger = lastAt === 0 || /[\s\n]/.test(content[lastAt - 1]);
      const hasSpace = /[\s\n]/.test(textAfterAt);
      
      if (isValidTrigger && !hasSpace) {
        setMentionQuery(textAfterAt);
        return;
      }
    }
    setMentionQuery(null);
    setSuggestions([]);
  }, [content, cursorPos]);

  // Fetch suggestions
  useEffect(() => {
    if (mentionQuery === null) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await searchUsers(mentionQuery);
        setSuggestions(Array.isArray(res) ? res : []);
        setActiveIndex(0);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [mentionQuery]);

  const selectUser = useCallback((user: UserProfileDto) => {
    if (mentionQuery === null) return;
    
    const lastAt = content.lastIndexOf('@', cursorPos - 1);
    const before = content.slice(0, lastAt);
    const after = content.slice(cursorPos);
    
    const newContent = `${before}@${user.username} ${after}`;
    setContent(newContent);
    setMentionQuery(null);
    setSuggestions([]);
    
    // Focus and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = lastAt + user.username.length + 2; // +1 for @, +1 for space
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [content, cursorPos, mentionQuery, setContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery === null || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectUser(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPos(e.target.selectionStart);
  };

  const onTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.currentTarget.selectionStart);
  };

  return {
    suggestions,
    activeIndex,
    selectUser,
    handleKeyDown,
    onTextareaChange,
    onTextareaClick,
    textareaRef,
    showSuggestions: mentionQuery !== null && suggestions.length > 0
  };
}
