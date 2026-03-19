'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  List,
  Settings,
  BarChart3,
  Headphones,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReaderStore } from '../stores/reader-store';
import { useWhispersyncFromBook } from '@/features/audiobook/hooks/use-whispersync';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  showControls?: boolean;
}

export function ReaderToolbar({
  bookTitle,
  bookId,
  showControls,
}: ReaderToolbarProps) {
  const router = useRouter();
  const {
    toggleToc,
    toggleSettings,
    toggleReadingStats,
  } = useReaderStore();

  const { audiobook, hasAudiobook } = useWhispersyncFromBook(bookId);

  return (
    <div
      data-testid="reader-toolbar"
      className={cn(
        'absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4',
        'transition-all duration-300 ease-in-out',
        showControls === false
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="max-w-[200px] truncate font-medium">{bookTitle}</span>
      </div>

{/* Right section */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleToc}>
          <List className="h-5 w-5" />
        </Button>
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
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
