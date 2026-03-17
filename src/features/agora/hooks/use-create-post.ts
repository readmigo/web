'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { CreatePostPayload } from '../types';

/**
 * Mutation hook for creating a new agora post.
 * On success, invalidates the agora-posts query to refresh the feed.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      apiClient.post('/agora/posts', payload, { noRedirectOn401: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agora-posts'] });
    },
  });
}
