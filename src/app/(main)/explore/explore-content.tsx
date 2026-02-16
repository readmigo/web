'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRow } from '@/features/library/components/book-row';
import { useInfiniteBooks } from '@/features/library/hooks/use-infinite-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import {
  Search, RefreshCw, Loader2, BookOpen, Library, Drama, Mountain,
  Lightbulb, Quote, Wand2, Moon, Heart, Folder, Clock, FlaskConical,
  Code, TrendingUp, Users, Palette, Sun, Star, Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '@/features/library/types';
import { useSearch } from '@/features/search/hooks/use-search';
import { useSearchSuggestions } from '@/features/search/hooks/use-search-suggestions';
import { usePopularSearches, useTrendingSearches } from '@/features/search/hooks/use-popular-searches';
import { useSearchHistory } from '@/features/search/hooks/use-search-history';
import { SearchResultsDropdown } from '@/features/search/components/search-results-dropdown';
import { useBookLists } from '@/features/library/hooks/use-book-lists';
import { HeroBanner } from '@/features/library/components/hero-banner';
import { BookListSection, BookListSectionSkeleton } from '@/features/library/components/book-list-section';
import { cn } from '@/lib/utils';

const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  fiction: BookOpen,
  classics: Library,
  drama: Drama,
  adventure: Mountain,
  philosophy: Lightbulb,
  poetry: Quote,
  fantasy: Wand2,
  mystery: Search,
  horror: Moon,
  romance: Heart,
};

const ICON_URL_MAP: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  lightbulb: Lightbulb,
  clock: Clock,
  beaker: FlaskConical,
  code: Code,
  'chart-line': TrendingUp,
  users: Users,
  palette: Palette,
  sun: Sun,
  star: Star,
  globe: Globe,
  heart: Heart,
};

function getCategoryIcon(category: Category): LucideIcon {
  return SLUG_ICON_MAP[category.slug] ?? ICON_URL_MAP[category.iconUrl ?? ''] ?? Folder;
}

export function ExploreContent() {
  const router = useRouter();
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
    (list) => list.bookCount > 0
  );
  // All book lists shown together with iOS-style backgrounds (by index)
  const allBookLists = activeBookLists;
  // Keep hero banner lists separate (for HeroBanner component)
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
      {/* Hero Banner */}
      <HeroBanner bookLists={featuredBookLists} isLoading={bookListsLoading} />

      {/* Category menu - circular icons */}
      <div className="grid grid-flow-col auto-cols-fr gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categoriesLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              type="button"
              className="flex flex-col items-center gap-1.5"
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
            {categoriesData?.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5"
                  onClick={() => router.push(`/category/${category.id}`)}
                >
                  <div
                    className={cn(
                      'h-11 w-11 rounded-full flex items-center justify-center transition-colors',
                      'bg-primary/10'
                    )}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs whitespace-nowrap">
                    {category.nameEn || category.name}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* All Book Lists with iOS-style backgrounds */}
      {bookListsLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookListSectionSkeleton key={i} />
          ))}
        </div>
      ) : (
        allBookLists.length > 0 && (
          <div className="divide-y">
            {allBookLists.map((list, index) => (
              <div key={list.id} className={index > 0 ? 'pt-6' : ''}>
                <BookListSection bookList={list} styleIndex={index} />
              </div>
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

