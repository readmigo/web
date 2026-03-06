'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Badge, UserBadge, BadgeProgress } from '../types';

export function useAllBadges() {
  return useQuery({
    queryKey: ['badges', 'all'],
    queryFn: () => apiClient.get<Badge[]>('/badges') as Promise<Badge[]>,
    staleTime: 30 * 60 * 1000,
  });
}

export function useUserBadges() {
  return useQuery({
    queryKey: ['badges', 'user'],
    queryFn: () => apiClient.get<UserBadge[]>('/badges/user') as Promise<UserBadge[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBadgeProgress() {
  return useQuery({
    queryKey: ['badges', 'progress'],
    queryFn: () => apiClient.get<BadgeProgress[]>('/badges/progress') as Promise<BadgeProgress[]>,
    staleTime: 5 * 60 * 1000,
  });
}
