'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookGrid } from '@/features/library/components/book-grid';
import { useCategoryBooks } from '@/features/library/hooks/use-category-books';
import { useCategories } from '@/features/library/hooks/use-categories';
import type { Category } from '@/features/library/types';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

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

  // Error state
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
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回探索
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
            {isLoading ? '加载中...' : `共 ${total} 本书籍`}
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">分类</h1>
          <p className="text-muted-foreground">
            {isLoading ? '加载中...' : `共 ${total} 本书籍`}
          </p>
        </div>
      )}

      {/* Subcategories */}
      {category?.children && category.children.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">子分类</h2>
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
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">该分类暂无书籍</p>
          <p className="mt-2 text-sm text-muted-foreground">
            试试其他分类吧
          </p>
          <Link href="/explore">
            <Button className="mt-4" variant="outline">
              探索更多
            </Button>
          </Link>
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
