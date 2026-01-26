'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Paper } from '../types';

interface PaginatedResponse {
  items: Paper[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function usePapers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['papers', page, limit],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>('/papers', {
        params: { page: String(page), limit: String(limit) },
        skipAuth: true,
      });
      return response;
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paperId: string) => {
      return apiClient.delete(`/papers/${paperId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
    },
  });
}
