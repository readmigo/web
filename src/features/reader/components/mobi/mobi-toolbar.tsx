'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { MobiMetadata, ParsedMobiChapter } from '../../utils/mobi-parser';
import { MobiMetadataPanel } from './mobi-metadata';
import { MobiToc } from './mobi-toc';
import { MobiSettings } from './mobi-settings';

interface MobiToolbarProps {
  title: string | undefined;
  documentTitle: string | undefined;
  onBack: (() => void) | undefined;
  currentChapterIndex: number;
  totalChapters: number;
  fontSize: number;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onFontSizeChange: (size: number) => void;
  onGoToChapter: (index: number) => void;
  // Metadata panel
  showMetadata: boolean;
  onShowMetadataChange: (open: boolean) => void;
  metadata: MobiMetadata | undefined;
  // TOC panel
  showChapterList: boolean;
  onShowChapterListChange: (open: boolean) => void;
  chapters: ParsedMobiChapter[];
  // Settings panel
  showSettings: boolean;
  onShowSettingsChange: (open: boolean) => void;
}

export function MobiToolbar({
  title,
  documentTitle,
  onBack,
  currentChapterIndex,
  totalChapters,
  fontSize,
  onPreviousChapter,
  onNextChapter,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onFontSizeChange,
  onGoToChapter,
  showMetadata,
  onShowMetadataChange,
  metadata,
  showChapterList,
  onShowChapterListChange,
  chapters,
  showSettings,
  onShowSettingsChange,
}: MobiToolbarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <span className="max-w-[200px] truncate font-medium">
          {title || documentTitle || 'Document'}
        </span>
      </div>

      {/* Center controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousChapter}
          disabled={currentChapterIndex <= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[100px] text-center text-sm">
          {currentChapterIndex + 1} / {totalChapters}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextChapter}
          disabled={currentChapterIndex >= totalChapters - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDecreaseFontSize}
          disabled={fontSize <= 12}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[40px] text-center text-xs">{fontSize}px</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onIncreaseFontSize}
          disabled={fontSize >= 32}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <MobiMetadataPanel
          open={showMetadata}
          onOpenChange={onShowMetadataChange}
          metadata={metadata}
          chapterCount={totalChapters}
        />

        <MobiToc
          open={showChapterList}
          onOpenChange={onShowChapterListChange}
          chapters={chapters}
          currentChapterIndex={currentChapterIndex}
          onChapterSelect={onGoToChapter}
        />

        <MobiSettings
          open={showSettings}
          onOpenChange={onShowSettingsChange}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
          currentChapterIndex={currentChapterIndex}
          totalChapters={totalChapters}
          onGoToChapter={onGoToChapter}
        />
      </div>
    </div>
  );
}
