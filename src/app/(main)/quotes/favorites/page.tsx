'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useFavoriteQuotes } from '@/features/quotes/hooks/use-quotes';
import { QuoteCard } from '@/features/quotes/components/quote-card';

export default function QuotesFavoritesPage() {
  const t = useTranslations('quotes');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFavoriteQuotes();

  const quotes = data?.pages.flatMap((p) => p.data) ?? [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        {t('favorites')}
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 opacity-30" />
          <p className="mt-3 text-sm">{t('favoritesEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
