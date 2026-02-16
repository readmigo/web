'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Headphones } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useRecentlyListened,
  useAudiobookLanguages,
  useInfiniteAudiobooks,
} from '@/features/audiobook/hooks';
import { formatDuration } from '@/features/audiobook/stores/audio-player-store';
import type { AudiobookListItem, AudiobookWithProgress } from '@/features/audiobook/types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============ Recently Listened Section ============

function RecentlyListenedSection() {
  const { data: recentBooks, isLoading } = useRecentlyListened(10);

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">最近收听</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28">
              <Skeleton className="aspect-[1/1] w-full rounded-xl" />
              <Skeleton className="h-3 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!recentBooks || recentBooks.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">最近收听</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recentBooks.map((book: AudiobookWithProgress) => (
          <Link
            key={book.id}
            href={`/audiobooks/${book.id}`}
            className="flex-shrink-0 w-28"
          >
            <div className="relative aspect-[1/1] w-full overflow-hidden rounded-xl bg-secondary">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Headphones className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-medium line-clamp-2">{book.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============ Language Filter Pills ============

function LanguageFilter({
  selectedLanguage,
  onSelect,
}: {
  selectedLanguage: string | undefined;
  onSelect: (lang: string | undefined) => void;
}) {
  const { data: languages, isLoading } = useAudiobookLanguages();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (!languages || languages.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(undefined)}
        className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !selectedLanguage
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        全部
      </button>
      {languages.map((lang: string) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedLanguage === lang
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

// ============ Audiobook Card ============

function AudiobookCard({ audiobook }: { audiobook: AudiobookListItem }) {
  return (
    <Link href={`/audiobooks/${audiobook.id}`} className="group flex gap-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        {audiobook.coverUrl ? (
          <Image
            src={audiobook.coverUrl}
            alt={audiobook.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Headphones className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <h3 className="text-sm font-medium line-clamp-2">{audiobook.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {audiobook.author}
        </p>
        {audiobook.narrator && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            朗读: {audiobook.narrator}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDuration(audiobook.totalDuration)}
        </p>
      </div>
    </Link>
  );
}

// ============ Audiobook Grid with Infinite Scroll ============

function AudiobookGrid({
  language,
  search,
}: {
  language: string | undefined;
  search: string;
}) {
  const debouncedSearch = useDebounce(search, 300);
  const params = useMemo(
    () => ({
      language,
      search: debouncedSearch || undefined,
    }),
    [language, debouncedSearch]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteAudiobooks(params);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const audiobooks = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
            <div className="flex flex-col justify-center gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (audiobooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Headphones className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg text-muted-foreground">暂无有声书</p>
        {debouncedSearch && (
          <p className="mt-2 text-sm text-muted-foreground">
            没有找到与 &ldquo;{debouncedSearch}&rdquo; 相关的有声书
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audiobooks.map((audiobook) => (
          <AudiobookCard key={audiobook.id} audiobook={audiobook} />
        ))}
      </div>
      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {isFetchingNextPage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
                  <div className="flex flex-col justify-center gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ============ Main Content ============

export function AudiobooksContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    undefined
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索有声书..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary rounded-xl h-11 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Recently Listened */}
      <RecentlyListenedSection />

      {/* Language Filter */}
      <LanguageFilter
        selectedLanguage={selectedLanguage}
        onSelect={setSelectedLanguage}
      />

      {/* Audiobook Grid */}
      <AudiobookGrid language={selectedLanguage} search={searchQuery} />
    </div>
  );
}
