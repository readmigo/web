'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Category } from '../types';

async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await apiClient.get<Category[]>('/categories/tree', {
      skipAuth: true,
    });
    return response;
  } catch {
    // Fallback to flat categories endpoint
    const response = await apiClient.get<Category[]>('/categories', {
      skipAuth: true,
    });
    return response;
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
