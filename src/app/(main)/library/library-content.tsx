'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserLibrary, useContinueReading } from '@/features/library/hooks/use-user-library';
import { useBrowsingHistory } from '@/features/library/hooks/use-browsing-history';
import type { UserBook } from '@/features/library/types';

// ─── Horizontal Book Card (for scrollable sections) ─────────────────────────
function HorizontalBookCard({
  book,
  progress,
  onRemove,
}: {
  book: { id: string; title: string; author: string; coverUrl: string };
  progress?: number;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative w-[120px] flex-shrink-0 sm:w-[140px]">
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
          aria-label="移除"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <Link href={`/book/${book.id}`}>
        <div className="space-y-2">
          {/* Cover */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm transition-shadow group-hover:shadow-md">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 120px, 140px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-3xl text-muted-foreground/40">
                  {book.title.charAt(0)}
                </span>
              </div>
            )}
            {/* Progress overlay */}
            {progress !== undefined && progress > 0 && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                <Progress value={progress} className="h-1" />
                <p className="mt-1 text-right text-[10px] text-white/80">
                  {progress}%
                </p>
              </div>
            )}
          </div>

          {/* Title & Author */}
          <div>
            <p className="line-clamp-2 text-sm font-medium leading-tight">
              {book.title}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {book.author}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Horizontal Scroll Skeleton ─────────────────────────────────────────────
function HorizontalSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[120px] flex-shrink-0 space-y-2 sm:w-[140px]">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mt-4 text-lg font-medium text-muted-foreground">
        您的书架还是空的
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        去书城发现更多好书吧
      </p>
      <Button className="mt-6" asChild>
        <Link href="/explore">去书城看看</Link>
      </Button>
    </div>
  );
}

// ─── Continue Reading Section ───────────────────────────────────────────────
function ContinueReadingSection() {
  const { data: readingBooks, isLoading } = useContinueReading();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <SectionHeader title="继续阅读" />
        <HorizontalSkeleton count={3} />
      </section>
    );
  }

  if (!readingBooks || readingBooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="继续阅读" />
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {readingBooks.map((userBook: UserBook) => (
          <HorizontalBookCard
            key={userBook.bookId}
            book={userBook.book}
            progress={userBook.progress}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Recently Browsed Section ───────────────────────────────────────────────
function RecentlyBrowsedSection() {
  const { history, removeFromHistory, clearHistory } = useBrowsingHistory();

  if (history.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="最近浏览"
        actionLabel="清除"
        onAction={clearHistory}
      />
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {history.map((item) => (
          <HorizontalBookCard
            key={item.id}
            book={item}
            onRemove={() => removeFromHistory(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Favorite Books Section (Grid) ──────────────────────────────────────────
function FavoriteBooksSection() {
  const { data: userBooks, isLoading } = useUserLibrary();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <SectionHeader title="收藏书籍" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!userBooks || userBooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="收藏书籍" />
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {userBooks.map((userBook: UserBook) => (
          <HorizontalBookCard
            key={userBook.bookId}
            book={userBook.book}
            progress={userBook.progress > 0 ? userBook.progress : undefined}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function LibraryContent() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const { history } = useBrowsingHistory();
  const { data: userBooks, isLoading: isLibraryLoading } = useUserLibrary();
  const { data: readingBooks, isLoading: isReadingLoading } = useContinueReading();

  // Show loading state while initial data loads (only for auth users)
  const isInitialLoading = isAuthenticated && (isLibraryLoading || isReadingLoading);

  // Determine if everything is empty
  const hasReadingBooks = isAuthenticated && readingBooks && readingBooks.length > 0;
  const hasHistory = history.length > 0;
  const hasFavorites = isAuthenticated && userBooks && userBooks.length > 0;
  const isEmpty = !isInitialLoading && !hasReadingBooks && !hasHistory && !hasFavorites;

  if (isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Continue Reading - only for authenticated users */}
      {isAuthenticated && <ContinueReadingSection />}

      {/* Recently Browsed - all users */}
      <RecentlyBrowsedSection />

      {/* Favorite Books - only for authenticated users */}
      {isAuthenticated && <FavoriteBooksSection />}
    </div>
  );
}
