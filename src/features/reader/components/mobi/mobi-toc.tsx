'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import type { ParsedMobiChapter } from '../../utils/mobi-parser';

interface MobiTocProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapters: ParsedMobiChapter[];
  currentChapterIndex: number;
  onChapterSelect: (index: number) => void;
}

export function MobiToc({
  open,
  onOpenChange,
  chapters,
  currentChapterIndex,
  onChapterSelect,
}: MobiTocProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <List className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Chapters</SheetTitle>
          <SheetDescription>
            {chapters.length} chapters
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => onChapterSelect(index)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                index === currentChapterIndex
                  ? 'bg-primary/10 font-medium text-primary'
                  : ''
              }`}
            >
              <span className="mr-2 text-muted-foreground">
                {index + 1}.
              </span>
              {chapter.title}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
