'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DailyQuote } from './daily-quote';
import { QuoteCard } from './quote-card';
import { useTrendingQuotes, useQuoteTags, useInfiniteQuotes } from '../hooks/use-quotes';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function QuotesView() {
  const t = useTranslations('quotes');
  const searchParams = useSearchParams();
  const authorId = searchParams.get('authorId') ?? undefined;
  const bookId = searchParams.get('bookId') ?? undefined;

  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: trending, isLoading: trendingLoading } = useTrendingQuotes();
  const { data: tags } = useQuoteTags();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuotes({
    tag: selectedTag || undefined,
    search: debouncedSearch || undefined,
    authorId,
    bookId,
  });

  const quotes = data?.pages.flatMap((p) => p.data) || [];

  // Infinite scroll
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
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="space-y-6">
      {/* My Favorites entry — only shown on the main quotes page */}
      {!authorId && !bookId && (
        <Link
          href="/quotes/favorites"
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            {t('favorites')}
          </span>
          <span className="text-xs text-muted-foreground">{t('viewAll')}</span>
        </Link>
      )}

      {/* Daily Quote */}
      {!authorId && !bookId && <DailyQuote />}

      {/* Trending — hidden when filtering by author or book */}
      {!authorId && !bookId && !trendingLoading && trending && trending.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">{t('trending')}</h3>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {trending.map((q) => (
                <div key={q.id} className="w-[280px] shrink-0">
                  <QuoteCard quote={q} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-secondary rounded-xl h-10 pl-9 border-0"
        />
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
              !selectedTag ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
            )}
            onClick={() => setSelectedTag('')}
          >
            {t('all')}
          </button>
          {tags.map((tag) => (
            <button
              key={tag.name}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
                selectedTag === tag.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
              )}
              onClick={() => setSelectedTag(tag.name)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Quotes list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
