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
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface MobiSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  currentChapterIndex: number;
  totalChapters: number;
  onGoToChapter: (index: number) => void;
}

export function MobiSettings({
  open,
  onOpenChange,
  fontSize,
  onFontSizeChange,
  currentChapterIndex,
  totalChapters,
  onGoToChapter,
}: MobiSettingsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reading Settings</SheetTitle>
          <SheetDescription>Customize your reading experience</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Font Size</label>
            <div className="flex items-center gap-4">
              <Slider
                value={[fontSize]}
                min={12}
                max={32}
                step={2}
                onValueChange={([value]) => onFontSizeChange(value)}
              />
              <span className="w-12 text-right text-sm">{fontSize}px</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Go to Chapter</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={totalChapters}
                value={currentChapterIndex + 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= totalChapters) {
                    onGoToChapter(val - 1);
                  }
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
