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
  Volume2,
  Headphones,
  GitBranch,
  Columns2,
} from 'lucide-react';
import Link from 'next/link';
import { useReaderStore } from '../stores/reader-store';
import { useWhispersyncFromBook } from '@/features/audiobook/hooks/use-whispersync';
import { HighlightSidebar } from './highlight-sidebar';
import { BookmarkSidebar } from './bookmark-sidebar';
import { SearchPanel } from './search-panel';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  onPrev?: () => void;
  onNext?: () => void;
  onNavigateToHighlight?: (cfi: string) => void;
  onNavigateToBookmark?: (cfi: string) => void;
  onNavigateToChapter?: (chapterId: string, position?: number) => void;
  onToggleTTS?: () => void;
  isTTSActive?: boolean;
  showControls?: boolean;
  onToggleTimeline?: () => void;
}

export function ReaderToolbar({
  bookTitle,
  bookId,
  onPrev,
  onNext,
  onNavigateToHighlight,
  onNavigateToBookmark,
  onNavigateToChapter,
  onToggleTTS,
  isTTSActive,
  showControls,
  onToggleTimeline,
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

  const cycleColumnCount = () => {
    const next = (settings.columnCount % 3) + 1 as 1 | 2 | 3;
    updateSettings({ columnCount: next });
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
        <SearchPanel
          bookId={bookId}
          onNavigateToChapter={onNavigateToChapter}
        />
        <Button variant="ghost" size="icon" onClick={toggleToc}>
          <List className="h-5 w-5" />
        </Button>
        <BookmarkSidebar bookId={bookId} onNavigateToBookmark={onNavigateToBookmark} />
        <HighlightSidebar
          bookId={bookId}
          onNavigateToHighlight={onNavigateToHighlight}
        />
        {hasAudiobook && audiobook && (
          <Button variant="ghost" size="icon" asChild title="Audiobook">
            <Link href={`/audiobooks/${audiobook.id}`}>
              <Headphones className="h-5 w-5 text-primary" />
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTTS}
          className={isTTSActive ? 'text-primary' : ''}
          title="Text-to-Speech"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleReadingStats} className="md:hidden">
          <BarChart3 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleColumnCount}
          title={t('columnCount')}
          className="relative"
        >
          <Columns2 className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {settings.columnCount}
          </span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleTimeline} title={t('timelineTitle')}>
          <GitBranch className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
