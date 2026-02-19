'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  List,
  Settings,
  Bookmark,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Volume2,
  Headphones,
} from 'lucide-react';
import Link from 'next/link';
import { useReaderStore } from '../stores/reader-store';
import { useWhispersyncFromBook } from '@/features/audiobook/hooks/use-whispersync';
import { HighlightSidebar } from './highlight-sidebar';
import { SearchPanel } from './search-panel';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  onPrev?: () => void;
  onNext?: () => void;
  onNavigateToHighlight?: (cfi: string) => void;
  onNavigateToChapter?: (chapterId: string, position?: number) => void;
  onToggleTTS?: () => void;
  isTTSActive?: boolean;
}

export function ReaderToolbar({
  bookTitle,
  bookId,
  onPrev,
  onNext,
  onNavigateToHighlight,
  onNavigateToChapter,
  onToggleTTS,
  isTTSActive,
}: ReaderToolbarProps) {
  const {
    position,
    toggleToc,
    toggleSettings,
    toggleAiPanel,
    toggleReadingStats,
    addBookmark,
  } = useReaderStore();

  const { audiobook, hasAudiobook } = useWhispersyncFromBook(bookId);

  const handleAddBookmark = () => {
    if (position) {
      addBookmark({
        bookId,
        cfi: `ch:${position.chapterIndex}:pg:${position.page}`,
        title: `第 ${position.chapterIndex + 1} 章`,
      });
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4">
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
        <Button variant="ghost" size="icon" onClick={handleAddBookmark}>
          <Bookmark className="h-5 w-5" />
        </Button>
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
        <Button variant="ghost" size="icon" onClick={toggleAiPanel}>
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
