import { get, post, del } from './api';

// DTO shape returned by the enriched backend
export interface RantDto {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  likeCount: number;
  reRantCount: number;
  replyCount: number;
  isLikedByMe: boolean;
  isRerantedByMe: boolean;
  isBookmarkedByMe: boolean;
  reRantedByUsername?: string;
  quoteRantId?: string;
  quoteRant?: QuoteRantDto;
  mediaUrl?: string; // Multimedia support
  mediaType?: 'image' | 'video';
}

export interface QuoteRantDto {
  id: string;
  content: string;
  username: string;
  displayName?: string;
  createdAt: string;
  profileImageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface ReplyDto {
  id: string;
  rantId: string;
  content: string;
  createdAt: string;
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  parentReplyId?: string;
  parentReplyUsername?: string;
  likeCount: number;
  replyCount: number;
  isLikedByMe: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}


// --- Feed / Timeline ---
export function getHomeFeed(page = 1, pageSize = 10) {
  return get<RantDto[]>(`/timelines/home?page=${page}&pageSize=${pageSize}`);
}

export function getExploreFeed(page = 1, pageSize = 10) {
  return get<RantDto[]>(`/rants/explore?page=${page}&pageSize=${pageSize}`);
}

export function getRantById(id: string) {
  return get<RantDto>(`/rants/${id}`);
}

// --- CRUD ---
export function createRant(content: string, quoteRantId?: string, mediaFile?: File) {
  const formData = new FormData();
  formData.append('content', content);
  if (quoteRantId) formData.append('quoteRantId', quoteRantId);
  if (mediaFile) formData.append('mediaFile', mediaFile);
  
  return post<RantDto>('/rants', formData);
}

export function deleteRant(id: string) {
  return del<void>(`/rants/${id}`);
}

// --- Interactions ---
export function toggleLike(id: string) {
  return post<void>(`/rants/${id}/like`);
}

export function toggleRerant(id: string) {
  return post<void>(`/rants/${id}/rerant`);
}

export function toggleBookmark(id: string) {
  return post<void>(`/rants/${id}/bookmark`);
}

// --- Replies ---
export function getReplies(rantId: string, page = 1, pageSize = 10) {
  return get<ReplyDto[]>(`/rants/${rantId}/replies?page=${page}&pageSize=${pageSize}`);
}

export function createReply(rantId: string, content: string, parentReplyId?: string, mediaFile?: File) {
  const formData = new FormData();
  formData.append('content', content);
  if (parentReplyId) formData.append('parentReplyId', parentReplyId);
  if (mediaFile) formData.append('mediaFile', mediaFile);
  
  return post<ReplyDto>(`/rants/${rantId}/replies`, formData);
}

export function toggleReplyLike(replyId: string) {
  return post<void>(`/replies/${replyId}/like`);
}
