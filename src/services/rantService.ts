import { get, post, del } from './api';

// DTO shape returned by the enriched backend
export interface RantDto {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  userId: number;
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
  quoteRantId?: number;
  quoteRant?: QuoteRantDto;
  mediaUrl?: string; // Multimedia support
  mediaType?: 'image' | 'video';
}

export interface QuoteRantDto {
  id: number;
  content: string;
  username: string;
  displayName?: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface ReplyDto {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  parentReplyId?: number;
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

export function getRantById(id: number) {
  return get<RantDto>(`/rants/${id}`);
}

// --- CRUD ---
export function createRant(content: string, quoteRantId?: number, mediaFile?: File) {
  const formData = new FormData();
  formData.append('content', content);
  if (quoteRantId) formData.append('quoteRantId', quoteRantId.toString());
  if (mediaFile) formData.append('mediaFile', mediaFile);
  
  return post<RantDto>('/rants', formData);
}

export function deleteRant(id: number) {
  return del<void>(`/rants/${id}`);
}

// --- Interactions ---
export function toggleLike(id: number) {
  return post<void>(`/rants/${id}/like`);
}

export function toggleRerant(id: number) {
  return post<void>(`/rants/${id}/rerant`);
}

export function toggleBookmark(id: number) {
  return post<void>(`/rants/${id}/bookmark`);
}

// --- Replies ---
export function getReplies(rantId: number, page = 1, pageSize = 10) {
  return get<ReplyDto[]>(`/rants/${rantId}/replies?page=${page}&pageSize=${pageSize}`);
}

export function createReply(rantId: number, content: string, parentReplyId?: number, mediaFile?: File) {
  const formData = new FormData();
  formData.append('content', content);
  if (parentReplyId) formData.append('parentReplyId', parentReplyId.toString());
  if (mediaFile) formData.append('mediaFile', mediaFile);
  
  return post<ReplyDto>(`/rants/${rantId}/replies`, formData);
}

export function toggleReplyLike(replyId: number) {
  return post<void>(`/replies/${replyId}/like`);
}
