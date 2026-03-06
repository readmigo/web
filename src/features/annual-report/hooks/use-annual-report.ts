'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  AnnualReport,
  AnnualReportHistoryResponse,
  AnnualReportStatusResponse,
  SharePageResponse,
} from '../types';

export function useAnnualReport(year: number) {
  return useQuery({
    queryKey: ['annual-report', year],
    queryFn: () =>
      apiClient.get<AnnualReport>(`/annual-report/${year}`) as Promise<AnnualReport>,
    staleTime: 5 * 60 * 1000,
    enabled: !!year,
  });
}

export function useAnnualReportStatus(year: number, enabled: boolean) {
  return useQuery({
    queryKey: ['annual-report', year, 'status'],
    queryFn: () =>
      apiClient.get<AnnualReportStatusResponse>(
        `/annual-report/${year}/status`,
      ) as Promise<AnnualReportStatusResponse>,
    enabled,
    refetchInterval: enabled ? 1000 : false,
  });
}

export function useAnnualReportHistory() {
  return useQuery({
    queryKey: ['annual-report', 'history'],
    queryFn: () =>
      apiClient.get<AnnualReportHistoryResponse>(
        '/annual-report/history',
      ) as Promise<AnnualReportHistoryResponse>,
    staleTime: 10 * 60 * 1000,
  });
}

export function useShareReport() {
  return useMutation({
    mutationFn: (year: number) =>
      apiClient.post<SharePageResponse>(`/annual-report/${year}/share-page`, {}) as Promise<SharePageResponse>,
  });
}
