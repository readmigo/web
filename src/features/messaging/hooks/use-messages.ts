'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ThreadsResponse, Message } from '../types';

export function useTickets(page = 1, status?: string) {
  return useQuery({
    queryKey: ['tickets', page, status],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status) params.set('status', status);
      return apiClient.get<ThreadsResponse>(`/me/tickets?${params}`) as Promise<ThreadsResponse>;
    },
    staleTime: 60 * 1000,
  });
}

export function useThreadMessages(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'messages'],
    queryFn: () =>
      apiClient.get<Message[]>(`/me/tickets/${ticketId}/messages`) as Promise<Message[]>,
    enabled: !!ticketId,
    staleTime: 30 * 1000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { subject: string; category: string; content: string }) =>
      apiClient.post('/me/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      apiClient.post(`/me/tickets/${ticketId}/messages`, { content }),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
