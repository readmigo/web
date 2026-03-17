'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRow } from '@/features/library/components/book-row';
import { useInfiniteBooks } from '@/features/library/hooks/use-infinite-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/features/library/types';
import {
  difficultyLabels,
  difficultyDotColors,
} from '@/features/library/utils/difficulty';

// ─── Types ───────────────────────────────────────────────────────────────────
type SortOption = 'recent' | 'popular' | 'rating';

interface BrowseFilters {
  difficulty?: number;
  categoryId?: string;
  sort: SortOption;
}

// ─── Difficulty pill options ─────────────────────────────────────────────────
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
];

// ─── Category pills ────────────────────────────────────────────────────────────
function CategoryPills({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          'rounded-full border px-3 py-1 text-sm transition-colors',
          !selectedId
            ? 'border-primary bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id === selectedId ? undefined : cat.id)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            cat.id === selectedId
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          {cat.nameEn || cat.name}
        </button>
      ))}
    </div>
  );
}

// ─── Active filter chips ──────────────────────────────────────────────────────
function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BrowseContent() {
  const tc = useTranslations('common');
  const tl = useTranslations('library');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>({ sort: 'recent' });

  // Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const flatCategories = categoriesData ?? [];

  // Infinite books with filters
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBooks({
    categoryId: filters.categoryId,
    difficulty: filters.difficulty,
  });

  const books = data?.pages.flatMap((page) => page.data ?? []) || [];
  const total = data?.pages[0]?.total ?? 0;

  // Intersection observer for infinite scroll
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
    return () => observer.disconnect();
  }, [handleObserver]);

  // Active filter count
  const activeFilterCount =
    (filters.difficulty ? 1 : 0) + (filters.categoryId ? 1 : 0);

  // Error state
  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Bookstore
      </Link>

      {/* Page title + filter toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tl('browseAll')}</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {total} books
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted',
            showFilters && 'border-primary'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
          {/* Sort */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sort By
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, sort: opt.value }))
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm transition-colors',
                    filters.sort === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Difficulty
            </p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      difficulty: f.difficulty === level ? undefined : level,
                    }))
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                    filters.difficulty === level
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      filters.difficulty === level
                        ? 'bg-primary-foreground'
                        : difficultyDotColors[level]
                    )}
                  />
                  {difficultyLabels[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            {categoriesLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            ) : (
              <CategoryPills
                categories={flatCategories}
                selectedId={filters.categoryId}
                onSelect={(id) =>
                  setFilters((f) => ({ ...f, categoryId: id }))
                }
              />
            )}
          </div>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ sort: 'recent' })}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips (always visible when filters active) */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.difficulty && (
            <ActiveFilterChip
              label={difficultyLabels[filters.difficulty]}
              onRemove={() =>
                setFilters((f) => ({ ...f, difficulty: undefined }))
              }
            />
          )}
          {filters.categoryId && categoriesData && (
            <ActiveFilterChip
              label={
                flatCategories.find((c) => c.id === filters.categoryId)
                  ?.nameEn ??
                flatCategories.find((c) => c.id === filters.categoryId)?.name ??
                'Category'
              }
              onRemove={() =>
                setFilters((f) => ({ ...f, categoryId: undefined }))
              }
            />
          )}
        </div>
      )}

      {/* Books list */}
      {isLoading ? (
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 border-b py-3">
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
          <p className="text-lg text-muted-foreground">No books found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setFilters({ sort: 'recent' })}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div>
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </div>
          <div ref={sentinelRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && books.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {tc('viewAll')} {total} books loaded
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
