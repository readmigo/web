'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { UserBook } from '../types';

export function useUserLibrary() {
  return useQuery({
    queryKey: ['userLibrary'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserBook[] }>(
        '/reading/library'
      );
      return response.data;
    },
  });
}

export function useAddToLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      return apiClient.post('/reading/library', { bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });
}

export function useRemoveFromLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      return apiClient.delete(`/reading/library/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });
}

export function useUpdateReadingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      progress,
      currentCfi,
    }: {
      bookId: string;
      progress: number;
      currentCfi?: string;
    }) => {
      return apiClient.patch(`/reading/progress/${bookId}`, {
        progress,
        currentCfi,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });
}

export function useUpdateBookStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      status,
    }: {
      bookId: string;
      status: UserBook['status'];
    }) => {
      return apiClient.patch(`/reading/progress/${bookId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });
}

export function useContinueReading() {
  return useQuery({
    queryKey: ['continueReading'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserBook }>(
        '/reading/current'
      );
      return response.data ? [response.data] : [];
    },
  });
}

export function useRecordReadingSession() {
  return useMutation({
    mutationFn: async (session: {
      bookId: string;
      startTime: Date;
      endTime: Date;
      wordsRead?: number;
      pagesRead?: number;
    }) => {
      return apiClient.post('/reading/sessions', session);
    },
  });
}

export function useReadingStats() {
  return useQuery({
    queryKey: ['readingStats'],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: {
          totalBooksRead: number;
          totalReadingTime: number;
          totalWordsRead: number;
          currentStreak: number;
        };
      }>('/reading/stats');
      return response.data;
    },
  });
}
