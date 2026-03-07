'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { BookstoreTab } from '../types';

interface BookstoreTabsResponse {
  tabs: BookstoreTab[];
}

const TAB_SORT_ORDER = [
  'fiction', 'classics', 'drama', 'philosophy',
  'poetry', 'adventure', 'romance', 'other',
];

function sortTabs(tabs: BookstoreTab[]): BookstoreTab[] {
  return [...tabs].sort((a, b) => {
    if (a.type === 'recommendation' && b.type !== 'recommendation') return -1;
    if (a.type !== 'recommendation' && b.type === 'recommendation') return 1;
    if (a.type === 'recommendation' && b.type === 'recommendation') {
      return a.sortOrder - b.sortOrder;
    }
    const ia = TAB_SORT_ORDER.indexOf(a.slug.toLowerCase());
    const ib = TAB_SORT_ORDER.indexOf(b.slug.toLowerCase());
    const ra = ia === -1 ? Infinity : ia;
    const rb = ib === -1 ? Infinity : ib;
    if (ra !== rb) return ra - rb;
    return a.sortOrder - b.sortOrder;
  });
}

export function useBookstoreTabs() {
  return useQuery({
    queryKey: ['bookstore-tabs'],
    queryFn: async () => {
      const response = await apiClient.get<BookstoreTabsResponse>('/bookstore/tabs', {
        skipAuth: true,
      });
      return sortTabs(response.tabs);
    },
    staleTime: 10 * 60 * 1000,
  });
}
