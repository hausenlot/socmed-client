import { get, put } from './api';

export interface NotificationDto {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sourceUsername?: string;
  rantId?: number;
}

export function getNotifications() {
  return get<NotificationDto[]>('/notifications');
}

export function getUnreadCount() {
  return get<{ count: number }>('/notifications/unread-count');
}

export function markAllRead() {
  return put<void>('/notifications/read-all');
}

export function markAsRead(id: number) {
  return put<void>(`/notifications/read/${id}`);
}
