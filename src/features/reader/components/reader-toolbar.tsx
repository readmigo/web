'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Headphones,
} from 'lucide-react';
import Link from 'next/link';
import { useReaderStore } from '../stores/reader-store';
import { useWhispersyncFromBook } from '@/features/audiobook/hooks/use-whispersync';
import { BookmarkSidebar } from './bookmark-sidebar';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  onPrev?: () => void;
  onNext?: () => void;
  onNavigateToBookmark?: (cfi: string) => void;
  showControls?: boolean;
}

export function ReaderToolbar({
  bookTitle,
  bookId,
  onPrev,
  onNext,
  onNavigateToBookmark,
  showControls,
}: ReaderToolbarProps) {
  const t = useTranslations('reader');
  const {
    position,
    settings,
    updateSettings,
    toggleToc,
    toggleSettings,
    toggleReadingStats,
  } = useReaderStore();

  const setColumnCount = (count: 1 | 2 | 3) => {
    updateSettings({ columnCount: count });
  };

  const { audiobook, hasAudiobook } = useWhispersyncFromBook(bookId);

  return (
    <div
      data-testid="reader-toolbar"
      className={cn(
        'flex h-14 items-center justify-between border-b bg-background px-4',
        'transition-all duration-300 ease-in-out',
        showControls === false
          ? 'absolute inset-x-0 top-0 -translate-y-full opacity-0 pointer-events-none'
          : 'relative translate-y-0 opacity-100'
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/book/${bookId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="max-w-[200px] truncate font-medium">{bookTitle}</span>
      </div>

      {/* Center - Progress */}
      <div className="hidden flex-1 items-center gap-4 px-8 md:flex">
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={toggleReadingStats}
          className="flex-1 group cursor-pointer"
          title="View reading statistics"
        >
          <Progress value={(position?.percentage || 0) * 100} className="h-2 group-hover:h-3 transition-all" />
        </button>
        <span className="w-12 text-center text-sm text-muted-foreground">
          {Math.round((position?.percentage || 0) * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleToc}>
          <List className="h-5 w-5" />
        </Button>
        <BookmarkSidebar bookId={bookId} onNavigateToBookmark={onNavigateToBookmark} />
        {hasAudiobook && audiobook && (
          <Button variant="ghost" size="icon" asChild title="Audiobook">
            <Link href={`/audiobooks/${audiobook.id}`}>
              <Headphones className="h-5 w-5 text-primary" />
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleReadingStats} className="md:hidden">
          <BarChart3 className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-0.5" title={t('columnCount')}>
          {([1, 2, 3] as const).map((count) => (
            <Button
              key={count}
              variant={settings.columnCount === count ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 text-xs font-medium"
              onClick={() => setColumnCount(count)}
            >
              {count}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
