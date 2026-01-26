'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Highlight, Bookmark } from '../types';

// API Response types
interface HighlightResponse {
  id: string;
  bookId: string;
  cfiRange: string;
  text: string;
  color: string;
  note?: string;
  createdAt: string;
}

interface BookmarkResponse {
  id: string;
  bookId: string;
  cfi: string;
  title: string;
  createdAt: string;
}

// Transform API response to local types
function transformHighlight(h: HighlightResponse): Highlight {
  return {
    id: h.id,
    bookId: h.bookId,
    cfiRange: h.cfiRange,
    text: h.text,
    color: h.color as Highlight['color'],
    note: h.note,
    createdAt: new Date(h.createdAt),
  };
}

function transformBookmark(b: BookmarkResponse): Bookmark {
  return {
    id: b.id,
    bookId: b.bookId,
    cfi: b.cfi,
    title: b.title,
    createdAt: new Date(b.createdAt),
  };
}

// ============ Highlights Hooks ============

export function useHighlights(bookId: string | undefined) {
  return useQuery({
    queryKey: ['highlights', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const response = await apiClient.get<{ data: HighlightResponse[] }>(
        '/reading/highlights',
        { params: { bookId } }
      );
      return (response.data || []).map(transformHighlight);
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

interface CreateHighlightRequest {
  bookId: string;
  cfiRange: string;
  text: string;
  color: Highlight['color'];
  note?: string;
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateHighlightRequest) => {
      const response = await apiClient.post<{ data: HighlightResponse }>(
        '/reading/highlights',
        request
      );
      return transformHighlight(response.data);
    },
    onSuccess: (newHighlight) => {
      // Invalidate highlights query to refetch
      queryClient.invalidateQueries({
        queryKey: ['highlights', newHighlight.bookId],
      });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      highlightId,
      bookId,
    }: {
      highlightId: string;
      bookId: string;
    }) => {
      await apiClient.delete(`/reading/highlights/${highlightId}`);
      return { highlightId, bookId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['highlights', variables.bookId],
      });
    },
  });
}

interface UpdateHighlightRequest {
  highlightId: string;
  bookId: string;
  note?: string;
  color?: Highlight['color'];
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, note, color }: UpdateHighlightRequest) => {
      const response = await apiClient.patch<{ data: HighlightResponse }>(
        `/reading/highlights/${highlightId}`,
        { note, color }
      );
      return transformHighlight(response.data);
    },
    onSuccess: (updatedHighlight) => {
      queryClient.invalidateQueries({
        queryKey: ['highlights', updatedHighlight.bookId],
      });
    },
  });
}

// ============ Bookmarks Hooks ============

export function useBookmarks(bookId: string | undefined) {
  return useQuery({
    queryKey: ['bookmarks', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const response = await apiClient.get<{ data: BookmarkResponse[] }>(
        '/reading/bookmarks',
        { params: { bookId } }
      );
      return (response.data || []).map(transformBookmark);
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

interface CreateBookmarkRequest {
  bookId: string;
  cfi: string;
  title: string;
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateBookmarkRequest) => {
      const response = await apiClient.post<{ data: BookmarkResponse }>(
        '/reading/bookmarks',
        request
      );
      return transformBookmark(response.data);
    },
    onSuccess: (newBookmark) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', newBookmark.bookId],
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookmarkId,
      bookId,
    }: {
      bookmarkId: string;
      bookId: string;
    }) => {
      await apiClient.delete(`/reading/bookmarks/${bookmarkId}`);
      return { bookmarkId, bookId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', variables.bookId],
      });
    },
  });
}

// ============ Sync Utilities ============

// Offline queue for failed operations
interface QueuedOperation {
  id: string;
  type: 'create_highlight' | 'delete_highlight' | 'update_highlight' | 'create_bookmark' | 'delete_bookmark';
  data: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'readmigo_sync_queue';

export function getOfflineQueue(): QueuedOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push({
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(operationId: string): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  const filtered = queue.filter((op) => op.id !== operationId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}

// Process offline queue when back online
export async function processOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'create_highlight':
          await apiClient.post('/reading/highlights', operation.data);
          break;
        case 'delete_highlight': {
          const deleteData = operation.data as { highlightId: string };
          await apiClient.delete(`/reading/highlights/${deleteData.highlightId}`);
          break;
        }
        case 'update_highlight': {
          const updateData = operation.data as { highlightId: string; note?: string; color?: string };
          await apiClient.patch(`/reading/highlights/${updateData.highlightId}`, {
            note: updateData.note,
            color: updateData.color,
          });
          break;
        }
        case 'create_bookmark':
          await apiClient.post('/reading/bookmarks', operation.data);
          break;
        case 'delete_bookmark': {
          const deleteBookmarkData = operation.data as { bookmarkId: string };
          await apiClient.delete(`/reading/bookmarks/${deleteBookmarkData.bookmarkId}`);
          break;
        }
      }
      removeFromOfflineQueue(operation.id);
    } catch (error) {
      console.error('Failed to process offline operation:', error);
      // Keep in queue for retry
    }
  }
}

// Export types
export type {
  CreateHighlightRequest,
  UpdateHighlightRequest,
  CreateBookmarkRequest,
  QueuedOperation,
};
