'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Request types
interface ExplainRequest {
  word: string;
  sentence: string;
  bookId?: string;
  chapterId?: string;
}

interface SimplifyRequest {
  sentence: string;
  targetLevel?: number;
  bookId?: string;
}

interface TranslateRequest {
  text: string;
  targetLanguage?: string;
  bookId?: string;
}

interface QARequest {
  question: string;
  context: string;
  bookId?: string;
}

// Response types
interface WordExplanation {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  translation: string;
  examples: string[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  frequency?: string;
  collocations?: string[];
}

interface SimplifyResponse {
  original: string;
  simplified: string;
  level: number;
  changes: string[];
}

interface TranslateResponse {
  original: string;
  translation: string;
  language: string;
}

interface QAResponse {
  answer: string;
  sources?: string[];
}

// Hooks
export function useExplainWord() {
  return useMutation({
    mutationFn: async (request: ExplainRequest) => {
      const response = await apiClient.post<{ data: WordExplanation }>(
        '/ai/explain',
        request
      );
      return response.data;
    },
  });
}

export function useSimplifySentence() {
  return useMutation({
    mutationFn: async (request: SimplifyRequest) => {
      const response = await apiClient.post<{ data: SimplifyResponse }>(
        '/ai/simplify',
        request
      );
      return response.data;
    },
  });
}

export function useTranslate() {
  return useMutation({
    mutationFn: async (request: TranslateRequest) => {
      const response = await apiClient.post<{ data: TranslateResponse }>(
        '/ai/translate',
        request
      );
      return response.data;
    },
  });
}

export function useAIQA() {
  return useMutation({
    mutationFn: async (request: QARequest) => {
      const response = await apiClient.post<{ data: QAResponse }>(
        '/ai/qa',
        request
      );
      return response.data;
    },
  });
}

// Export types
export type {
  ExplainRequest,
  SimplifyRequest,
  TranslateRequest,
  QARequest,
  WordExplanation,
  SimplifyResponse,
  TranslateResponse,
  QAResponse,
};
