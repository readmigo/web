'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { AgoraComment, AgoraCommentsResponse, CreateCommentPayload } from '../types';

const COMMENTS_PAGE_SIZE = 20;

// ---- Query ----

/**
 * Infinite query for a post's comment list.
 * queryKey: ['agora-comments', postId]
 */
export function useAgoraComments(postId: string | null) {
  return useInfiniteQuery({
    queryKey: ['agora-comments', postId],
    enabled: !!postId,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<AgoraCommentsResponse>(
        `/agora/posts/${postId}/comments`,
        {
          params: { page: String(pageParam), limit: String(COMMENTS_PAGE_SIZE) },
          noRedirectOn401: true,
        }
      );
      return {
        ...response,
        data: response.items ?? response.data ?? [],
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (sum, page) => sum + (page.data?.length ?? 0),
        0
      );
      if (loadedCount >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    staleTime: 60 * 1000,
  });
}

// ---- Create Comment ----

/**
 * Mutation for creating a comment on a post.
 * Performs optimistic update: prepends a temp comment to the cache,
 * then rolls back on error and refetches on settle.
 */
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      apiClient.post<AgoraComment>(
        `/agora/posts/${postId}/comments`,
        payload,
        { noRedirectOn401: true }
      ),
    onMutate: async ({ content }) => {
      const queryKey = ['agora-comments', postId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      const tempComment: AgoraComment = {
        id: `temp-${Date.now()}`,
        authorName: '',
        content,
        likeCount: 0,
        isLiked: false,
        isAuthor: true,
        createdAt: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const firstPage = old.pages[0];
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: [tempComment, ...(firstPage?.data ?? [])],
              total: (firstPage?.total ?? 0) + 1,
            },
            ...old.pages.slice(1),
          ],
        };
      });

      // Also update the commentCount on the parent post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['agora-posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((post: { id: string; commentCount: number }) =>
              post.id === postId
                ? { ...post, commentCount: post.commentCount + 1 }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agora-comments', postId], context.previousData);
      }
      // Rollback commentCount on the post
      queryClient.invalidateQueries({ queryKey: ['agora-posts'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agora-comments', postId] });
    },
  });
}

// ---- Delete Comment ----

/**
 * Mutation for deleting a comment.
 * Optimistically removes the comment from the cache.
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`/agora/comments/${commentId}`, { noRedirectOn401: true }),
    onMutate: async (commentId) => {
      const queryKey = ['agora-comments', postId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).filter(
              (c: AgoraComment) => c.id !== commentId
            ),
            total: Math.max(0, (page.total ?? 0) - 1),
          })),
        };
      });

      // Decrement commentCount on the post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['agora-posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((post: { id: string; commentCount: number }) =>
              post.id === postId
                ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agora-comments', postId], context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: ['agora-posts'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agora-comments', postId] });
    },
  });
}

// ---- Like Comment ----

/**
 * Mutation for liking/unliking a comment.
 * Optimistically toggles isLiked and adjusts likeCount.
 */
export function useLikeComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      isLiked,
    }: {
      commentId: string;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        return apiClient.delete(`/agora/comments/${commentId}/like`, {
          noRedirectOn401: true,
        });
      }
      return apiClient.post(`/agora/comments/${commentId}/like`, undefined, {
        noRedirectOn401: true,
      });
    },
    onMutate: async ({ commentId, isLiked }) => {
      const queryKey = ['agora-comments', postId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((c: AgoraComment) =>
              c.id === commentId
                ? {
                    ...c,
                    isLiked: !isLiked,
                    likeCount: isLiked
                      ? Math.max(0, c.likeCount - 1)
                      : c.likeCount + 1,
                  }
                : c
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agora-comments', postId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agora-comments', postId] });
    },
  });
}
