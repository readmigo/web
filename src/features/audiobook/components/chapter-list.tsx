'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Pause, Check } from 'lucide-react';
import { formatDuration } from '../stores/audio-player-store';
import type { AudiobookChapter } from '../types';

interface ChapterListProps {
  chapters: AudiobookChapter[];
  currentChapterIndex: number;
  isPlaying: boolean;
  onChapterSelect: (index: number) => void;
}

export function ChapterList({
  chapters,
  currentChapterIndex,
  isPlaying,
  onChapterSelect,
}: ChapterListProps) {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-1 p-2">
        {chapters.map((chapter, index) => {
          const isCurrent = index === currentChapterIndex;
          const isPast = index < currentChapterIndex;

          return (
            <Button
              key={chapter.id}
              variant={isCurrent ? 'secondary' : 'ghost'}
              className="w-full justify-start h-auto py-3"
              onClick={() => onChapterSelect(index)}
            >
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {isPast ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : isCurrent && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">
                  {chapter.title || `Chapter ${chapter.number}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(chapter.duration)}
                  {chapter.readerName && ` - ${chapter.readerName}`}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
