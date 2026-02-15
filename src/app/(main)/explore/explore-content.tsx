'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRow } from '@/features/library/components/book-row';
import { useInfiniteBooks } from '@/features/library/hooks/use-infinite-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import { Search, RefreshCw, Loader2, BookOpen } from 'lucide-react';
import { useSearch } from '@/features/search/hooks/use-search';
import { useSearchSuggestions } from '@/features/search/hooks/use-search-suggestions';
import { usePopularSearches, useTrendingSearches } from '@/features/search/hooks/use-popular-searches';
import { useSearchHistory } from '@/features/search/hooks/use-search-history';
import { SearchResultsDropdown } from '@/features/search/components/search-results-dropdown';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useBookLists } from '@/features/library/hooks/use-book-lists';
import { HeroBanner } from '@/features/library/components/hero-banner';
import { BookListSection, BookListSectionSkeleton } from '@/features/library/components/book-list-section';
import { RankedBookCard } from '@/features/library/components/ranked-book-card';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import type { Book } from '@/features/library/types';

export function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedDropdownQuery, setDebouncedDropdownQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search query for book list filtering
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce search query for unified search dropdown
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDropdownQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Unified search hook
  const {
    data: searchResults,
    isLoading: isSearchLoading,
  } = useSearch(debouncedDropdownQuery);

  // Autocomplete suggestions
  const {
    data: suggestions,
    isLoading: isSuggestionsLoading,
  } = useSearchSuggestions(debouncedDropdownQuery);

  // Popular & trending searches
  const { data: popularSearches } = usePopularSearches();
  const { data: trendingSearches } = useTrendingSearches();

  // Search history
  const { history: searchHistory, addSearch, removeSearch, clearHistory } = useSearchHistory();

  // Book lists for hero banner and sections
  const { data: bookListsData, isLoading: bookListsLoading } = useBookLists();
  const activeBookLists = (bookListsData || []).filter(
    (list) => list.isActive !== false && (list.books?.length ?? 0) > 0
  );
  // Ranking lists shown first at the top, then other featured lists
  const rankingBookLists = activeBookLists.filter((list) => list.type === 'RANKING');
  const featuredBookLists = activeBookLists.filter((list) => list.type !== 'RANKING');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Infinite scroll books query
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBooks({
    category: selectedCategory || undefined,
    search: debouncedSearch || undefined,
  });

  // Flatten all pages into a single books array
  const books = data?.pages.flatMap((page) => page.data ?? []) || [];

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative" ref={searchContainerRef}>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setShowDropdown(true);
          }}
          className="bg-secondary rounded-xl h-11 pl-10 border-0 focus:ring-2 focus:ring-primary"
        />
        {showDropdown && (
          <SearchResultsDropdown
            data={searchResults}
            isLoading={isSearchLoading}
            query={debouncedDropdownQuery}
            onSelect={() => {
              if (debouncedDropdownQuery.trim().length >= 2) {
                addSearch(debouncedDropdownQuery.trim());
              }
              setShowDropdown(false);
            }}
            onSelectQuery={(term) => {
              setSearchQuery(term);
              setDebouncedDropdownQuery(term);
              setDebouncedSearch(term);
              addSearch(term);
            }}
            suggestions={suggestions}
            suggestionsLoading={isSuggestionsLoading}
            searchHistory={searchHistory}
            onRemoveHistory={removeSearch}
            onClearHistory={clearHistory}
            popularSearches={popularSearches}
            trendingSearches={trendingSearches}
          />
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-destructive">加载失败</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : '请稍后重试'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      ) : (
      <>
      {/* Ranking Section — iOS-style ranked book list */}
      <RankingSection />

      {/* Ranking Book Lists from API (if available) */}
      {!bookListsLoading && rankingBookLists.length > 0 && (
        <div className="space-y-8">
          {rankingBookLists.map((list) => (
            <BookListSection key={list.id} bookList={list} />
          ))}
        </div>
      )}

      {/* Hero Banner */}
      <HeroBanner bookLists={featuredBookLists} isLoading={bookListsLoading} />

      {/* Category menu - circular icons */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categoriesLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 min-w-[56px]"
              onClick={() => setSelectedCategory('')}
            >
              <div
                className={cn(
                  'h-11 w-11 rounded-full flex items-center justify-center transition-colors',
                  selectedCategory === ''
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10'
                )}
              >
                <BookOpen
                  className={cn(
                    'h-5 w-5',
                    selectedCategory === '' ? 'text-primary-foreground' : 'text-primary'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  selectedCategory === '' && 'font-semibold'
                )}
              >
                All
              </span>
            </button>
            {categoriesData?.map((category) => (
              <button
                key={category.id}
                type="button"
                className="flex flex-col items-center gap-1.5 min-w-[56px]"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div
                  className={cn(
                    'h-11 w-11 rounded-full flex items-center justify-center transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10'
                  )}
                >
                  <BookOpen
                    className={cn(
                      'h-5 w-5',
                      selectedCategory === category.id
                        ? 'text-primary-foreground'
                        : 'text-primary'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    selectedCategory === category.id && 'font-semibold'
                  )}
                >
                  {category.nameEn || category.name}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Book List Sections */}
      {bookListsLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <BookListSectionSkeleton key={i} />
          ))}
        </div>
      ) : (
        featuredBookLists.length > 0 && (
          <div className="space-y-8">
            {featuredBookLists.slice(0, 4).map((list) => (
              <BookListSection key={list.id} bookList={list} />
            ))}
          </div>
        )
      )}

      {/* "全部书籍" divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-sm text-muted-foreground">全部书籍</span>
        <div className="flex-1 border-t" />
      </div>

      {/* Books list (vertical rows) */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b last:border-b-0">
              <Skeleton className="h-[105px] w-[70px] flex-shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2 py-0.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">暂无书籍</p>
          <p className="mt-2 text-sm text-muted-foreground">
            去探索发现更多好书吧
          </p>
        </div>
      ) : (
        <>
          <div>
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && books.length > 0 && (
              <p className="text-sm text-muted-foreground">没有更多书籍了</p>
            )}
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}

// ============ Ranking Section ============

interface BooksApiResponse {
  items?: Book[];
  data?: Book[];
  total: number;
}

function RankingSection() {
  const { data: rankedBooks, isLoading } = useQuery({
    queryKey: ['books', 'ranking'],
    queryFn: async () => {
      const response = await apiClient.get<BooksApiResponse>('/books', {
        params: { page: '1', limit: '8' },
        skipAuth: true,
      });
      return response.items ?? response.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[90px] flex-shrink-0 space-y-2">
              <Skeleton className="h-[135px] w-[90px] rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rankedBooks || rankedBooks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">热门推荐</h3>
      </div>
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {rankedBooks.map((book, index) => (
          <RankedBookCard
            key={book.id}
            book={book}
            rank={index + 1}
            className="flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
