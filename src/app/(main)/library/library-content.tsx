'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BookOpen, ChevronRight, X, LogIn, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserLibrary } from '@/features/library/hooks/use-user-library';
import { useMergedReadingProgress } from '@/features/library/hooks/use-merged-reading-progress';
import { useBrowsingHistory } from '@/features/library/hooks/use-browsing-history';
import { useToggleFavorite } from '@/features/library/hooks/use-favorites';
import type { UserBook } from '@/features/library/types';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

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
          aria-label="Remove"
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

// ─── Guest Login Prompt Card ─────────────────────────────────────────────────
function GuestPromptCard() {
  const t = useTranslations('library');
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-muted/30 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <LogIn className="h-8 w-8 text-primary" />
      </div>
      <p className="mt-4 text-base font-semibold">{t('guestPromptTitle')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t('guestPromptSubtitle')}</p>
      <Button className="mt-6" asChild>
        <Link href="/login">{t('loginToView')}</Link>
      </Button>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState() {
  const t = useTranslations('library');
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mt-4 text-lg font-medium text-muted-foreground">
        {t('emptyTitle')}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('emptySubtitle')}
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">{t('goToBookstore')}</Link>
      </Button>
    </div>
  );
}

// ─── Continue Reading Section ───────────────────────────────────────────────
function ContinueReadingSection() {
  const t = useTranslations('library');
  const { data: readingBooks, isLoading } = useMergedReadingProgress();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <SectionHeader title={t('continueReading')} />
        <HorizontalSkeleton count={3} />
      </section>
    );
  }

  if (!readingBooks || readingBooks.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title={t('continueReading')} />
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
  const t = useTranslations('library');
  const { history, removeFromHistory, clearHistory } = useBrowsingHistory();

  if (history.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t('recentlyBrowsed')}
        actionLabel={t('clear')}
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

// ─── Favorite Books Section (Grid with batch-delete edit mode) ───────────────
function FavoriteBooksSection() {
  const t = useTranslations('library');
  const { data: userBooks, isLoading } = useUserLibrary();
  const { toggleFavorite, isLoading: isDeleting } = useToggleFavorite();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSelect = useCallback((bookId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    for (const bookId of selectedIds) {
      toggleFavorite(bookId, true);
    }
    setShowConfirm(false);
    exitEditMode();
  }, [selectedIds, toggleFavorite, exitEditMode]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <SectionHeader title={t('favorites')} />
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
    <>
      <section className="space-y-3">
        {/* Header with Edit / Done toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('favorites')}</h2>
          <button
            type="button"
            onClick={() => (isEditMode ? exitEditMode() : setIsEditMode(true))}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {isEditMode ? t('done') : t('edit')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {userBooks.map((userBook: UserBook) => {
            const isSelected = selectedIds.has(userBook.bookId);
            return (
              <div
                key={userBook.bookId}
                className="relative"
                onClick={isEditMode ? () => toggleSelect(userBook.bookId) : undefined}
              >
                {isEditMode && (
                  <div className="absolute -right-1 -top-1 z-10 text-primary">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className={isEditMode ? 'pointer-events-none select-none' : ''}>
                  <HorizontalBookCard
                    book={userBook.book}
                    progress={userBook.progress > 0 ? userBook.progress : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit mode bottom bar */}
        {isEditMode && (
          <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} {t('favorites').toLowerCase()}
            </span>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0 || isDeleting}
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {t('deleteSelected')}
            </Button>
          </div>
        )}
      </section>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteDesc', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function LibraryContent() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const isSessionLoading = status === 'loading';

  const { history } = useBrowsingHistory();
  const { data: userBooks, isLoading: isLibraryLoading } = useUserLibrary();
  const { data: readingBooks, isLoading: isReadingLoading } = useMergedReadingProgress();

  // Show loading state while initial data loads (only for auth users)
  const isInitialLoading = isAuthenticated && (isLibraryLoading || isReadingLoading);

  // Determine if everything is empty for authenticated users
  const hasReadingBooks = isAuthenticated && readingBooks && readingBooks.length > 0;
  const hasHistory = history.length > 0;
  const hasFavorites = isAuthenticated && userBooks && userBooks.length > 0;
  const isEmpty = !isInitialLoading && !hasReadingBooks && !hasHistory && !hasFavorites;

  // Guest: session loaded and not authenticated
  if (!isSessionLoading && !isAuthenticated) {
    return (
      <div className="space-y-6">
        <GuestPromptCard />
        {hasHistory && <RecentlyBrowsedSection />}
      </div>
    );
  }

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
