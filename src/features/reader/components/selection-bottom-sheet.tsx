'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Share2, X } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { NoteInputDialog } from './note-input-dialog';
import { QuoteShareCard } from './quote-share-card';
import { cn } from '@/lib/utils';
import type { SelectedText, Highlight } from '../types';

const HIGHLIGHT_COLORS: { name: Highlight['color']; class: string }[] = [
  { name: 'yellow', class: 'bg-yellow-300' },
  { name: 'green', class: 'bg-green-300' },
  { name: 'blue', class: 'bg-blue-300' },
  { name: 'pink', class: 'bg-pink-300' },
  { name: 'purple', class: 'bg-purple-300' },
  { name: 'orange', class: 'bg-orange-300' },
];

interface SelectionBottomSheetProps {
  selection: SelectedText;
  bookId: string;
  bookTitle?: string;
  authorName?: string;
  onClose: () => void;
}

export function SelectionBottomSheet({ selection, bookId, bookTitle, authorName, onClose }: SelectionBottomSheetProps) {
  const t = useTranslations('reader');
  const { addHighlight, setSelectedText } = useReaderStore();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const dismiss = useCallback(() => {
    setSelectedText(null);
    onClose();
  }, [setSelectedText, onClose]);

  const handleHighlight = useCallback((color: Highlight['color']) => {
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color,
      chapterId: selection.chapterId,
      paragraphIndex: selection.paragraphIndex,
      charOffset: selection.charOffset,
      charLength: selection.charLength,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    dismiss();
  }, [addHighlight, bookId, selection, dismiss]);

  const handleSaveNote = useCallback((note: string) => {
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color: 'yellow',
      note,
      chapterId: selection.chapterId,
      paragraphIndex: selection.paragraphIndex,
      charOffset: selection.charOffset,
      charLength: selection.charLength,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    dismiss();
  }, [addHighlight, bookId, selection, dismiss]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(selection.text.trim()).catch(() => {});
    dismiss();
  }, [selection.text, dismiss]);

  const handleShare = useCallback(() => {
    setShowShareCard(true);
  }, []);

  return (
    <>
      <Sheet open onOpenChange={(v) => !v && dismiss()}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
          {/* Drag indicator */}
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />

          {/* Selected text preview */}
          <div className="mb-4 rounded-md bg-muted px-3 py-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              &ldquo;{selection.text}&rdquo;
            </p>
          </div>

          {/* Highlight color row */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground shrink-0">{t('highlight')}</span>
            <div className="flex flex-1 items-center gap-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  aria-label={`highlight-color-${c.name}`}
                  onClick={() => handleHighlight(c.name)}
                  className={cn(
                    'h-8 w-8 rounded-full border border-black/10 transition-transform hover:scale-110',
                    c.class
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-500 shrink-0"
              onClick={() => setShowNoteDialog(true)}
            >
              + {t('addNote')}
            </Button>
          </div>

          {/* Action row */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="flex-col h-16 gap-1" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              <span className="text-xs">{t('copy')}</span>
            </Button>
            <Button variant="outline" className="flex-col h-16 gap-1" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              <span className="text-xs">{t('share')}</span>
            </Button>
            <Button variant="outline" className="flex-col h-16 gap-1" aria-label={t('cancel')} onClick={dismiss}>
              <X className="h-4 w-4" />
              <span className="text-xs">{t('cancel')}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <NoteInputDialog
        open={showNoteDialog}
        selectedText={selection.text}
        onSave={handleSaveNote}
        onClose={() => setShowNoteDialog(false)}
      />

      <QuoteShareCard
        open={showShareCard}
        quoteText={selection.text}
        bookTitle={bookTitle || ''}
        authorName={authorName}
        onClose={() => setShowShareCard(false)}
      />
    </>
  );
}
