'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export interface SearchMatch {
  position: number;
  beforeContext: string;
  matchedText: string;
  afterContext: string;
}

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  matches: SearchMatch[];
  matchCount: number;
}

export interface BookSearchResponse {
  bookId: string;
  query: string;
  totalMatches: number;
  matchingChapters: number;
  page: number;
  limit: number;
  totalPages: number;
  results: SearchResult[];
}

interface UseBookSearchOptions {
  bookId: string;
  contextLength?: number;
  limit?: number;
}

interface UseBookSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  totalMatches: number;
  matchingChapters: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  search: (searchQuery?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
}

export function useBookSearch({
  bookId,
  contextLength = 50,
  limit = 20,
}: UseBookSearchOptions): UseBookSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matchingChapters, setMatchingChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery ?? query;
      if (!q.trim()) {
        setResults([]);
        setTotalMatches(0);
        setMatchingChapters(0);
        setTotalPages(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<BookSearchResponse>(
          `/books/${bookId}/search`,
          {
            params: {
              q: q.trim(),
              page: String(1),
              limit: String(limit),
              contextLength: String(contextLength),
            },
          }
        );

        setResults(response.results);
        setTotalMatches(response.totalMatches);
        setMatchingChapters(response.matchingChapters);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, query, contextLength, limit]
  );

  const loadMore = useCallback(async () => {
    if (currentPage >= totalPages || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<BookSearchResponse>(
        `/books/${bookId}/search`,
        {
          params: {
            q: query.trim(),
            page: String(currentPage + 1),
            limit: String(limit),
            contextLength: String(contextLength),
          },
        }
      );

      setResults((prev) => [...prev, ...response.results]);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Load more failed:', err);
      setError('Failed to load more results.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, query, currentPage, totalPages, isLoading, contextLength, limit]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalMatches(0);
    setMatchingChapters(0);
    setCurrentPage(1);
    setTotalPages(0);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    totalMatches,
    matchingChapters,
    currentPage,
    totalPages,
    isLoading,
    error,
    search,
    loadMore,
    clearResults,
  };
}
