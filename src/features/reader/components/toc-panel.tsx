'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ChevronRight } from 'lucide-react';
import type { TocItem } from '../types';
import { cn } from '@/lib/utils';

interface TocPanelProps {
  items: TocItem[];
  currentChapter?: number;
  onSelect: (href: string) => void;
  onClose: () => void;
}

export function TocPanel({
  items,
  currentChapter,
  onSelect,
  onClose,
}: TocPanelProps) {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background shadow-lg">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-semibold">目录</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-4">
          {items.map((item, index) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  onSelect(item.href);
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                  currentChapter === index && 'bg-muted font-medium'
                )}
              >
                <span className="line-clamp-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </button>
              {item.subitems && item.subitems.length > 0 && (
                <div className="ml-4">
                  {item.subitems.map((subitem) => (
                    <button
                      key={subitem.id}
                      onClick={() => {
                        onSelect(subitem.href);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="line-clamp-1">{subitem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
