'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useUserLibrary } from './use-user-library';
import type { UserBook } from '../types';

/**
 * Hook to check if a book is in the user's library (favorited).
 * Returns a Set of book IDs for O(1) lookup.
 */
export function useFavoriteBookIds() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const { data: userBooks, isLoading } = useUserLibrary();

  const favoriteIds = useMemo(() => {
    if (!userBooks || !Array.isArray(userBooks)) return new Set<string>();
    return new Set(userBooks.map((ub: UserBook) => ub.bookId));
  }, [userBooks]);

  return {
    favoriteIds,
    isLoading: isAuthenticated && isLoading,
    isAuthenticated,
  };
}

/**
 * Hook to toggle a book's favorite (library) status with optimistic updates.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const mutation = useMutation({
    mutationFn: async ({
      bookId,
      isFavorited,
    }: {
      bookId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        return apiClient.delete(`/reading/library/${bookId}`);
      } else {
        return apiClient.post('/reading/library', { bookId });
      }
    },
    onMutate: async ({ bookId, isFavorited }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userLibrary'] });

      // Snapshot the previous value
      const previousLibrary = queryClient.getQueryData<UserBook[]>(['userLibrary']);

      // Optimistically update the cache
      queryClient.setQueryData<UserBook[]>(['userLibrary'], (old) => {
        if (!old) return old;
        if (isFavorited) {
          // Remove from library
          return old.filter((ub) => ub.bookId !== bookId);
        } else {
          // Add to library (minimal placeholder)
          return [
            ...old,
            {
              id: `temp-${bookId}`,
              bookId,
              book: {} as UserBook['book'],
              addedAt: new Date(),
              progress: 0,
              status: 'want-to-read' as const,
            },
          ];
        }
      });

      return { previousLibrary };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLibrary) {
        queryClient.setQueryData(['userLibrary'], context.previousLibrary);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });

  const toggleFavorite = useCallback(
    (bookId: string, isFavorited: boolean) => {
      if (!isAuthenticated) return;
      mutation.mutate({ bookId, isFavorited });
    },
    [isAuthenticated, mutation]
  );

  return {
    toggleFavorite,
    isLoading: mutation.isPending,
    isAuthenticated,
  };
}
