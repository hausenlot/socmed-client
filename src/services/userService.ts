import { get, post, put } from './api';
import type { RantDto, ReplyDto } from './rantService';

export interface UserProfileDto {
  id: number;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount: number;
  rantCount: number;
  isFollowedByMe: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function getUserProfile(username: string) {
  return get<UserProfileDto>(`/users/${username}`);
}

export function getUserRants(username: string, page = 1, pageSize = 20) {
  return get<PaginatedResponse<RantDto>>(`/users/${username}/rants?page=${page}&pageSize=${pageSize}`);
}

export function getUserReplies(username: string, page = 1, pageSize = 20) {
  return get<ReplyDto[]>(`/users/${username}/replies?page=${page}&pageSize=${pageSize}`);
}

export function getUserLikes(username: string, page = 1, pageSize = 20) {
  return get<RantDto[]>(`/users/${username}/likes?page=${page}&pageSize=${pageSize}`);
}

export function updateProfile(data: { displayName?: string; bio?: string }) {
  return put<UserProfileDto>('/users/profile', data);
}

export function toggleFollow(username: string) {
  return post<void>(`/users/${username}/follow`);
}

export function searchUsers(query: string) {
  return get<UserProfileDto[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function getSuggestedUsers(count = 5) {
  return get<UserProfileDto[]>(`/users/suggested?count=${count}`);
}

export function getFollowers(username: string) {
  return get<UserProfileDto[]>(`/users/${username}/followers`);
}

export function getFollowing(username: string) {
  return get<UserProfileDto[]>(`/users/${username}/following`);
}
