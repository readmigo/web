'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Paper, PaperHighlight, PaperAnnotation } from '../types';

export function usePaper(paperId: string | undefined) {
  return useQuery({
    queryKey: ['paper', paperId],
    queryFn: async () => {
      if (!paperId) return null;
      return apiClient.get<Paper>(`/papers/${paperId}`, { skipAuth: true });
    },
    enabled: !!paperId,
  });
}

export function usePaperHighlights(paperId: string | undefined) {
  return useQuery({
    queryKey: ['paper-highlights', paperId],
    queryFn: async () => {
      if (!paperId) return [];
      return apiClient.get<PaperHighlight[]>(`/papers/${paperId}/highlights`);
    },
    enabled: !!paperId,
  });
}

export function usePaperAnnotations(paperId: string | undefined) {
  return useQuery({
    queryKey: ['paper-annotations', paperId],
    queryFn: async () => {
      if (!paperId) return [];
      return apiClient.get<PaperAnnotation[]>(`/papers/${paperId}/annotations`);
    },
    enabled: !!paperId,
  });
}

export function useAddHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paperId,
      pageNumber,
      text,
      color,
      rects,
    }: {
      paperId: string;
      pageNumber: number;
      text: string;
      color: string;
      rects?: { x: number; y: number; width: number; height: number }[];
    }) => {
      return apiClient.post(`/papers/${paperId}/highlights`, {
        pageNumber,
        text,
        color,
        rects,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['paper-highlights', variables.paperId],
      });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paperId,
      highlightId,
    }: {
      paperId: string;
      highlightId: string;
    }) => {
      return apiClient.delete(`/papers/${paperId}/highlights/${highlightId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['paper-highlights', variables.paperId],
      });
    },
  });
}

export function useAddAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paperId,
      pageNumber,
      content,
      highlightId,
    }: {
      paperId: string;
      pageNumber: number;
      content: string;
      highlightId?: string;
    }) => {
      return apiClient.post(`/papers/${paperId}/annotations`, {
        pageNumber,
        content,
        highlightId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['paper-annotations', variables.paperId],
      });
    },
  });
}

export function useUpdateAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paperId,
      annotationId,
      content,
    }: {
      paperId: string;
      annotationId: string;
      content: string;
    }) => {
      return apiClient.patch(`/papers/${paperId}/annotations/${annotationId}`, {
        content,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['paper-annotations', variables.paperId],
      });
    },
  });
}

export function useDeleteAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paperId,
      annotationId,
    }: {
      paperId: string;
      annotationId: string;
    }) => {
      return apiClient.delete(`/papers/${paperId}/annotations/${annotationId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['paper-annotations', variables.paperId],
      });
    },
  });
}
