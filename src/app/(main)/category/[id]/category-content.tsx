'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRow } from '@/features/library/components/book-row';
import { useCategoryBooks } from '@/features/library/hooks/use-category-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import type { Category } from '@/features/library/types';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategoryContentProps {
  categoryId: string;
}

function findCategory(categories: Category[], id: string): Category | undefined {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategory(cat.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function CategoryContent({ categoryId }: CategoryContentProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('category');
  const tc = useTranslations('common');

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const category = useMemo(() => {
    if (!categoriesData) return undefined;
    return findCategory(categoriesData, categoryId);
  }, [categoriesData, categoryId]);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCategoryBooks(categoryId);

  const books = data?.pages.flatMap((page) => page.data ?? []) || [];
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
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('backToExplore')}
      </Link>

      {/* Category header */}
      {categoriesLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      ) : category ? (
        <div>
          <h1 className="text-2xl font-bold">{category.nameEn || category.name}</h1>
          <p className="text-muted-foreground">
            {isLoading ? tc('loading') : t('booksCount', { count: total })}
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{t('category')}</h1>
          <p className="text-muted-foreground">
            {isLoading ? tc('loading') : t('booksCount', { count: total })}
          </p>
        </div>
      )}

      {/* Subcategories */}
      {category?.children && category.children.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('subcategories')}</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link key={child.id} href={`/category/${child.id}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-3 py-1 hover:bg-accent transition-colors"
                >
                  {child.nameEn || child.name}
                  {child.bookCount > 0 && (
                    <span className="ml-1 text-muted-foreground">({child.bookCount})</span>
                  )}
                </Badge>
              </Link>
            ))}
          </div>
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
          <p className="text-lg text-muted-foreground">{t('noBooks')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('tryOther')}
          </p>
          <Link href="/explore">
            <Button className="mt-4" variant="outline">
              {t('exploreMore')}
            </Button>
          </Link>
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
    </div>
  );
}
