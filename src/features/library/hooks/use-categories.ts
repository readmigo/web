'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Category } from '../types';

interface CategoriesTreeResponse {
  data: Category[];
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await apiClient.get<CategoriesTreeResponse>('/categories/tree', {
      skipAuth: true,
    });
    return response.data;
  } catch {
    // Fallback to flat categories endpoint
    const response = await apiClient.get<CategoriesTreeResponse>('/categories', {
      skipAuth: true,
    });
    return response.data;
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
