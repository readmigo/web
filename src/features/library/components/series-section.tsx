'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SeriesInfo {
  id: string;
  name: string;
  bookCount: number;
  authorName: string;
}

interface SeriesBook {
  id: string;
  title: string;
  coverUrl?: string;
  seriesPosition?: number;
}

interface SeriesDetail {
  id: string;
  name: string;
  description?: string;
  authorName: string;
  bookCount: number;
  books: SeriesBook[];
}

function useSeriesDetail(seriesId: string) {
  return useQuery({
    queryKey: ['series', seriesId],
    queryFn: () => apiClient.get<SeriesDetail>(`/series/${seriesId}`) as Promise<SeriesDetail>,
    enabled: !!seriesId,
    staleTime: 10 * 60 * 1000,
  });
}

interface SeriesSectionProps {
  series: SeriesInfo;
}

/**
 * Series section shown in BookDetailView, aligned with iOS SeriesSection.
 */
export function SeriesSection({ series }: SeriesSectionProps) {
  const { data: detail } = useSeriesDetail(series.id);

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{series.name}</p>
          <p className="text-xs text-muted-foreground">
            {series.authorName} · {series.bookCount} books
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Series
        </Badge>
      </div>

      {detail && detail.books.length > 0 && (
        <div className="mt-3 space-y-2">
          {detail.books.slice(0, 5).map((book) => (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50 transition-colors group"
            >
              {book.seriesPosition != null && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {book.seriesPosition}
                </div>
              )}
              {book.coverUrl ? (
                <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded">
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-7 items-center justify-center rounded bg-muted">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 text-sm truncate group-hover:text-primary">{book.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
          {detail.books.length > 5 && (
            <p className="text-center text-xs text-muted-foreground">
              +{detail.books.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
