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
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// --- Feed / Timeline ---
export function getHomeFeed(page = 1, pageSize = 20) {
  return get<PaginatedResponse<RantDto>>(`/timelines/home?page=${page}&pageSize=${pageSize}`);
}

export function getExploreFeed() {
  return get<RantDto[]>('/rants/explore');
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
export function getReplies(rantId: number, page = 1, pageSize = 20) {
  return get<PaginatedResponse<ReplyDto>>(`/rants/${rantId}/replies?page=${page}&pageSize=${pageSize}`);
}

export function createReply(rantId: number, content: string, parentReplyId?: number) {
  return post<ReplyDto>(`/rants/${rantId}/replies`, { content, parentReplyId });
}
