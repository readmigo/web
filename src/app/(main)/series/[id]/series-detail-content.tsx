'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserLibrary } from '@/features/library/hooks/use-user-library';
import type { UserBook } from '@/features/library/types';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SeriesBook {
  id: string;
  title: string;
  coverUrl?: string;
  seriesPosition?: number;
  author?: string;
  description?: string;
}

interface SeriesDetail {
  id: string;
  name: string;
  description?: string;
  authorName: string;
  bookCount: number;
  books: SeriesBook[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────
function useSeriesDetail(seriesId: string) {
  return useQuery({
    queryKey: ['series', seriesId],
    queryFn: () =>
      apiClient.get<SeriesDetail>(`/series/${seriesId}`) as Promise<SeriesDetail>,
    enabled: !!seriesId,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Series Book Row ─────────────────────────────────────────────────────────
function SeriesBookRow({
  book,
  progress,
}: {
  book: SeriesBook;
  progress?: number;
}) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex items-start gap-4 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      {/* Position badge */}
      {book.seriesPosition != null && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-1">
          {book.seriesPosition}
        </div>
      )}

      {/* Cover */}
      <div className="relative h-[90px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="60px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary transition-colors">
          {book.title}
        </p>
        {book.author && (
          <p className="text-xs text-muted-foreground">{book.author}</p>
        )}
        {book.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{book.description}</p>
        )}

        {/* Reading progress */}
        {progress !== undefined && progress > 0 && (
          <div className="mt-1 space-y-0.5">
            <Progress value={progress} className="h-1" />
            <p className="text-[10px] text-muted-foreground text-right">{progress}%</p>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface SeriesDetailContentProps {
  seriesId: string;
}

export function SeriesDetailContent({ seriesId }: SeriesDetailContentProps) {
  const tc = useTranslations('common');
  const { data: series, isLoading, error, refetch } = useSeriesDetail(seriesId);
  const { data: userBooks } = useUserLibrary();

  // Build a map of bookId -> progress for quick lookup
  const progressMap = useMemo<Record<string, number>>(() => {
    if (!userBooks) return {};
    return userBooks.reduce<Record<string, number>>((acc, ub: UserBook) => {
      acc[ub.bookId] = ub.progress;
      return acc;
    }, {});
  }, [userBooks]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-destructive">{tc('loadingFailed')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{tc('retryLater')}</p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tc('retry')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Series not found</p>
        <Link href="/" className="mt-4">
          <Button variant="outline">Back to Bookstore</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Link>

      {/* Series header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{series.name}</h1>
        <p className="text-sm text-muted-foreground">
          {series.authorName} · {series.bookCount} books
        </p>
        {series.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {series.description}
          </p>
        )}
      </div>

      {/* Books list */}
      {series.books && series.books.length > 0 ? (
        <div className="space-y-3">
          {series.books.map((book) => (
            <SeriesBookRow
              key={book.id}
              book={book}
              progress={progressMap[book.id]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No books found in this series</p>
        </div>
      )}
    </div>
  );
}
