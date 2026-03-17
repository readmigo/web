'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { NotificationsResponse } from '../types';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return (res as { count: number }).count;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
  });
}

export function useInfiniteNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async ({ pageParam = 1 }) =>
      apiClient.get<NotificationsResponse>(
        `/notifications?page=${pageParam}&limit=20`,
      ) as Promise<NotificationsResponse>,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.put(`/notifications/${notificationId}`, { status: 'OPENED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
