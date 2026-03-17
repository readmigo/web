'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ReadingStatsResponse, OverviewStats, ReadingTrend, ReadingProgress } from '../types';

export function useReadingStats() {
  return useQuery({
    queryKey: ['stats', 'reading'],
    queryFn: () =>
      apiClient.get<ReadingStatsResponse>('/reading/stats') as Promise<ReadingStatsResponse>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiClient.get<OverviewStats>('/analytics/overview') as Promise<OverviewStats>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReadingTrend(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'trend', days],
    queryFn: () =>
      apiClient.get<ReadingTrend>(`/analytics/reading-trend?days=${days}`) as Promise<ReadingTrend>,
    staleTime: 10 * 60 * 1000,
  });
}

export function useReadingProgress() {
  return useQuery({
    queryKey: ['analytics', 'progress'],
    queryFn: () =>
      apiClient.get<ReadingProgress>('/analytics/reading-progress') as Promise<ReadingProgress>,
    staleTime: 5 * 60 * 1000,
  });
}
