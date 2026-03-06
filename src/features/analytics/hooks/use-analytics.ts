'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { OverviewStats, ReadingTrend, ReadingProgress } from '../types';

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
