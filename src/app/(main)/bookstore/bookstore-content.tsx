'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRow } from '@/features/library/components/book-row';
import { useInfiniteBooks } from '@/features/library/hooks/use-infinite-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import {
  Search, RefreshCw, Loader2, BookOpen, Library, Drama, Mountain,
  Lightbulb, Quote, Wand2, Moon, Heart, Folder, Clock, FlaskConical,
  Code, TrendingUp, Users, Palette, Sun, Star, Globe, ChevronRight, ListMusic, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category, BookList } from '@/features/library/types';
import { useSearch } from '@/features/search/hooks/use-search';
import { useSearchHistory } from '@/features/search/hooks/use-search-history';
import { useSearchSuggestions } from '@/features/search/hooks/use-search-suggestions';
import { usePopularSearches, useTrendingSearches } from '@/features/search/hooks/use-popular-searches';
import { SearchResultsDropdown } from '@/features/search/components/search-results-dropdown';
import { useBookLists } from '@/features/library/hooks/use-book-lists';
import { HeroBanner } from '@/features/library/components/hero-banner';
import { BookListSection, BookListSectionSkeleton } from '@/features/library/components/book-list-section';
import { ContinueReadingCard } from '@/features/library/components/continue-reading-card';
import { PromoBanner } from '@/features/library/components/promo-banner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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

// E10: Seeded Fisher-Yates shuffle — deterministic for a given numeric seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    // LCG-based pseudo-random in [0, i]
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const SESSION_SEED_KEY = 'bookListSeed';

function getSessionSeed(): number {
  if (typeof window === 'undefined') return 0;
  const stored = sessionStorage.getItem(SESSION_SEED_KEY);
  if (stored) return parseInt(stored, 10);
  const seed = Date.now();
  sessionStorage.setItem(SESSION_SEED_KEY, String(seed));
  return seed;
}

// E8: Pull-to-refresh distance threshold in px
const PULL_THRESHOLD = 60;

export function BookstoreContent() {
  const router = useRouter();
  const t = useTranslations('discover');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [booksTab, setBooksTab] = useState<'all' | 'new'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedDropdownQuery, setDebouncedDropdownQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // E8: Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  // Debounce search query for book list filtering
  useEffect(() => {
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

  // Search history
  const { history: searchHistory, addSearch, removeSearch, clearHistory } = useSearchHistory();

  // Search suggestions (iOS: autocomplete while typing)
  const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(debouncedDropdownQuery);

  // Popular & trending searches (iOS: shown when search input is empty)
  const { data: popularSearches } = usePopularSearches();
  const { data: trendingSearches } = useTrendingSearches();

  // Book lists for hero banner and sections
  const { data: bookListsData, isLoading: bookListsLoading } = useBookLists();
  const activeBookLists = (bookListsData || []).filter(
    (list) => list.bookCount > 0
  );
  const featuredBookLists = activeBookLists.filter((list) => list.type !== 'RANKING');

  // E10: Shuffle book lists with a session-stable seed
  const allBookLists: BookList[] = activeBookLists.length > 0
    ? seededShuffle(activeBookLists, getSessionSeed())
    : activeBookLists;

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
    visibility: booksTab === 'new' ? 'WEB_ONLY' : undefined,
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

  // E8: Pull-to-refresh touch handlers (touch-device only, guards scrollY > 0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartYRef.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0) {
      // Apply rubber-band resistance
      const clamped = Math.min(delta * 0.4, PULL_THRESHOLD * 1.5);
      setPullY(clamped);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (touchStartYRef.current === null) return;
    touchStartYRef.current = null;

    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(0);
      await queryClient.invalidateQueries();
      setIsRefreshing(false);
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, queryClient]);

  const isPulling = pullY > 0;
  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);

  return (
    <div
      className="space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* E8: Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150"
          style={{ height: isRefreshing ? 48 : Math.max(pullY, 0) }}
          aria-live="polite"
          aria-label={isRefreshing ? t('refreshing') : t('pullToRefresh')}
        >
          <div className="flex flex-col items-center gap-1">
            <RefreshCw
              className={cn(
                'h-5 w-5 text-primary transition-transform duration-150',
                isRefreshing && 'animate-spin'
              )}
              style={
                !isRefreshing
                  ? { transform: `rotate(${pullProgress * 360}deg)` }
                  : undefined
              }
            />
            <span className="text-xs text-muted-foreground">
              {isRefreshing ? t('refreshing') : t('pullToRefresh')}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative" ref={searchContainerRef}>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search.placeholder')}
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
            searchHistory={searchHistory}
            onRemoveHistory={removeSearch}
            onClearHistory={clearHistory}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            popularSearches={popularSearches}
            trendingSearches={trendingSearches}
          />
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-destructive">{tc('loadingFailed')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : tc('retryLater')}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {tc('retry')}
          </Button>
        </div>
      ) : (
      <>
      {/* E11: Free book promo banner */}
      <PromoBanner />

      {/* Hero Banner */}
      <HeroBanner bookLists={featuredBookLists} isLoading={bookListsLoading} />

      {/* Continue Reading (iOS: ContinueActivityWrapper) */}
      <ContinueReadingCard />

      {/* Category menu - circular icons */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categoriesLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-shrink-0 flex-col items-center gap-1.5">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </>
        ) : (
          <>
            {categoriesData?.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category.id}
                  type="button"
                  className="flex flex-shrink-0 flex-col items-center gap-1.5"
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

      {/* All Book Lists with iOS-style backgrounds (E10: seeded-shuffled order) */}
      {bookListsLoading && !bookListsData ? (
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
                <BookListSection bookList={list} styleIndex={(list.sortOrder ?? 1) - 1} />
              </div>
            ))}
          </div>
        )
      )}

      {/* View All Lists Entry (iOS: MoreListsEntryWrapper) */}
      {!(bookListsLoading && !bookListsData) && allBookLists.length > 0 && (
        <Link
          href="/book-list"
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
        >
          <ListMusic className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{t('viewAllLists')}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {/* Browse All Books Entry */}
      <Link
        href="/browse"
        className="flex items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
      >
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{t('browseAll')}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Books tabs: All / New Books (review) */}
      <div className="flex items-center gap-4 border-b">
        <button
          type="button"
          onClick={() => setBooksTab('all')}
          className={cn(
            'relative pb-2 text-sm font-medium transition-colors',
            booksTab === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('tabs.all')}
          {booksTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setBooksTab('new')}
          className={cn(
            'relative pb-2 text-sm font-medium transition-colors',
            booksTab === 'new' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('tabs.new')}
          {booksTab === 'new' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Books list (vertical rows) */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b last:border-b-0">
              <Skeleton className="h-[105px] w-[70px] lg:h-[140px] lg:w-[93px] flex-shrink-0 rounded-lg" />
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
          <p className="text-lg text-muted-foreground">{t('emptyTitle')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('exploreMore')}
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
              <p className="text-sm text-muted-foreground">{t('noMoreBooks')}</p>
            )}
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
