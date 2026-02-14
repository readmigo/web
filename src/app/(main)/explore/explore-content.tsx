'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookGrid } from '@/features/library/components/book-grid';
import { useInfiniteBooks } from '@/features/library/hooks/use-infinite-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import Link from 'next/link';
import { Search, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useSearch } from '@/features/search/hooks/use-search';
import { useSearchSuggestions } from '@/features/search/hooks/use-search-suggestions';
import { usePopularSearches, useTrendingSearches } from '@/features/search/hooks/use-popular-searches';
import { useSearchHistory } from '@/features/search/hooks/use-search-history';
import { SearchResultsDropdown } from '@/features/search/components/search-results-dropdown';
import { useBookLists } from '@/features/library/hooks/use-book-lists';
import { HeroBanner } from '@/features/library/components/hero-banner';
import { BookListSection, BookListSectionSkeleton } from '@/features/library/components/book-list-section';

const difficulties = [
  { label: '全部难度', value: 0 },
  { label: 'Beginner', value: 1 },
  { label: 'Elementary', value: 2 },
  { label: 'Intermediate', value: 3 },
  { label: 'Advanced', value: 4 },
  { label: 'Expert', value: 5 },
];

export function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedDropdownQuery, setDebouncedDropdownQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search query for book grid filtering
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
  const featuredBookLists = (bookListsData || []).filter(
    (list) => list.isActive !== false && (list.books?.length ?? 0) > 0
  );

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
    difficulty: selectedDifficulty || undefined,
    search: debouncedSearch || undefined,
  });

  // Flatten all pages into a single books array
  const books = data?.pages.flatMap((page) => page.data) || [];
  const total = data?.pages[0]?.total || 0;

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

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <HeroBanner bookLists={featuredBookLists} isLoading={bookListsLoading} />

      {/* Search */}
      <div className="relative max-w-xl" ref={searchContainerRef}>
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
          className="pl-10 h-12 text-lg"
        />
        {showDropdown && (
          <SearchResultsDropdown
            data={searchResults}
            isLoading={isSearchLoading}
            query={debouncedDropdownQuery}
            onSelect={() => {
              // Record the search when user selects a result
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

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categoriesLoading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </>
        ) : (
          <>
            <Badge
              variant={selectedCategory === '' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedCategory('')}
            >
              All
            </Badge>
            {categoriesData?.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.nameEn || category.name}
              </Badge>
            ))}
          </>
        )}
      </div>

      {/* View all in category link */}
      {selectedCategory && categoriesData && (
        <Link
          href={`/category/${selectedCategory}`}
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          查看「{categoriesData.find((c) => c.id === selectedCategory)?.nameEn || categoriesData.find((c) => c.id === selectedCategory)?.name || '该分类'}」的全部书籍
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      )}

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-2">
        {difficulties.map((diff) => (
          <Button
            key={diff.value}
            variant={selectedDifficulty === diff.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedDifficulty(diff.value)}
          >
            {diff.label}
          </Button>
        ))}
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? '搜索中...' : `找到 ${total} 本书籍`}
      </p>

      {/* Books grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <BookGrid books={books} />

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
    </div>
  );
}
