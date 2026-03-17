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

const HIGHLIGHT_STYLES: { name: Highlight['style']; label: string }[] = [
  { name: 'background', label: 'Background' },
  { name: 'underline', label: 'Underline' },
  { name: 'wavy', label: 'Wavy' },
  { name: 'bold_line', label: 'Bold Line' },
];

function StyleIcon({ style, active }: { style: Highlight['style']; active: boolean }) {
  const color = active ? 'currentColor' : '#9ca3af';
  if (style === 'background') {
    return (
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
        <rect x="2" y="4" width="24" height="12" rx="2" fill={color} />
      </svg>
    );
  }
  if (style === 'underline') {
    return (
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
        <text x="4" y="14" fontFamily="serif" fontSize="13" fill={color}>Aa</text>
        <line x1="2" y1="18" x2="26" y2="18" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (style === 'wavy') {
    return (
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
        <text x="4" y="14" fontFamily="serif" fontSize="13" fill={color}>Aa</text>
        <path d="M2 18 Q5.5 15.5 9 18 Q12.5 20.5 16 18 Q19.5 15.5 23 18 Q24.5 19 26 18" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <text x="4" y="14" fontFamily="serif" fontSize="13" fill={color}>Aa</text>
      <line x1="2" y1="18" x2="26" y2="18" stroke={color} strokeWidth="3" />
    </svg>
  );
}

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
  const [selectedStyle, setSelectedStyle] = useState<Highlight['style']>('background');

  const dismiss = useCallback(() => {
    setSelectedText(null);
    onClose();
  }, [setSelectedText, onClose]);

  const handleHighlight = useCallback((color: Highlight['color']) => {
    addHighlight({
      userBookId: bookId,
      cfiRange: selection.cfiRange || '',
      selectedText: selection.text,
      color,
      style: selectedStyle,
      chapterId: selection.chapterId,
      paragraphIndex: selection.paragraphIndex,
      charOffset: selection.charOffset,
      charLength: selection.charLength,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    dismiss();
  }, [addHighlight, bookId, selection, selectedStyle, dismiss]);

  const handleSaveNote = useCallback((note: string, isPublic: boolean) => {
    addHighlight({
      userBookId: bookId,
      cfiRange: selection.cfiRange || '',
      selectedText: selection.text,
      color: 'yellow',
      style: selectedStyle,
      note,
      isPublic,
      chapterId: selection.chapterId,
      paragraphIndex: selection.paragraphIndex,
      charOffset: selection.charOffset,
      charLength: selection.charLength,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    dismiss();
  }, [addHighlight, bookId, selection, selectedStyle, dismiss]);

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
          <div className="mb-3 flex items-center gap-3">
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

          {/* Highlight style row */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground shrink-0">Style</span>
            <div className="flex items-center gap-1">
              {HIGHLIGHT_STYLES.map((s) => (
                <button
                  key={s.name}
                  aria-label={`highlight-style-${s.name}`}
                  aria-pressed={selectedStyle === s.name}
                  onClick={() => setSelectedStyle(s.name)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                    selectedStyle === s.name
                      ? 'border-foreground bg-accent text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-muted'
                  )}
                >
                  <StyleIcon style={s.name} active={selectedStyle === s.name} />
                </button>
              ))}
            </div>
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
