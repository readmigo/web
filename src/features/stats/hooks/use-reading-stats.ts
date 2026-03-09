'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ReadingStatsResponse } from '../types';

export function useReadingStats() {
  return useQuery({
    queryKey: ['stats', 'reading'],
    queryFn: () =>
      apiClient.get<ReadingStatsResponse>('/reading/stats') as Promise<ReadingStatsResponse>,
    staleTime: 5 * 60 * 1000,
  });
}
