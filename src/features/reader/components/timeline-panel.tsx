'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocItem } from '../types';

interface TimelinePanelProps {
  items: TocItem[];
  currentChapter?: number;
  totalProgress: number;
  onSelect: (href: string) => void;
  onClose: () => void;
}

export function TimelinePanel({ items, currentChapter, totalProgress, onSelect, onClose }: TimelinePanelProps) {
  const getChapterProgress = (index: number): string | null => {
    if (currentChapter === undefined) return null;
    if (index < currentChapter) return '100%';
    if (index === currentChapter) {
      const progressInChapter = Math.round(
        Math.max(0, Math.min(100, (totalProgress * items.length - currentChapter) * 100))
      );
      return `${progressInChapter}%`;
    }
    return null;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-72 border-l bg-background shadow-lg flex flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="font-semibold">故事时间线</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭时间线">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Overall progress bar */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>总进度</span>
          <span>{Math.round(totalProgress * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${totalProgress * 100}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="relative py-4 px-4">
          {/* Timeline line */}
          <div className="absolute left-[28px] top-4 bottom-4 w-0.5 bg-border" />

          <div className="space-y-1">
            {items.map((item, index) => {
              const isActive = index === currentChapter;
              const isPast = currentChapter !== undefined && index < currentChapter;
              const progress = getChapterProgress(index);

              return (
                <div
                  key={item.id}
                  data-active={isActive ? 'true' : 'false'}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer transition-colors',
                    isActive ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  onClick={() => {
                    onSelect(item.href);
                    onClose();
                  }}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'relative z-10 h-3 w-3 shrink-0 rounded-full border-2',
                    isActive
                      ? 'border-primary bg-primary'
                      : isPast
                        ? 'border-primary bg-background'
                        : 'border-muted-foreground bg-background'
                  )} />

                  {/* Chapter label */}
                  <span className={cn(
                    'text-sm truncate flex-1',
                    isActive ? 'font-medium' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>

                  {/* Per-chapter progress */}
                  {progress && (
                    <span className="text-xs text-muted-foreground shrink-0">{progress}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
