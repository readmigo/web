'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Highlighter,
  MessageSquare,
  Share2,
  Languages,
} from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import type { SelectedText, Highlight } from '../types';
import { NoteInputDialog } from './note-input-dialog';
import { TranslationSheet } from './translation-sheet';
import { cn } from '@/lib/utils';

const POPUP_STYLES: { name: Highlight['style']; label: string }[] = [
  { name: 'background', label: 'Background' },
  { name: 'underline', label: 'Underline' },
  { name: 'wavy', label: 'Wavy' },
  { name: 'bold_line', label: 'Bold Line' },
];

function PopupStyleIcon({ style, active }: { style: Highlight['style']; active: boolean }) {
  const color = active ? 'currentColor' : '#9ca3af';
  if (style === 'background') {
    return (
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
        <rect x="1" y="2" width="20" height="12" rx="2" fill={color} />
      </svg>
    );
  }
  if (style === 'underline') {
    return (
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
        <text x="2" y="12" fontFamily="serif" fontSize="11" fill={color}>Aa</text>
        <line x1="1" y1="15" x2="21" y2="15" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (style === 'wavy') {
    return (
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
        <text x="2" y="12" fontFamily="serif" fontSize="11" fill={color}>Aa</text>
        <path d="M1 15 Q4 13 7 15 Q10 17 13 15 Q16 13 19 15 Q20 15.5 21 15" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <text x="2" y="12" fontFamily="serif" fontSize="11" fill={color}>Aa</text>
      <line x1="1" y1="15" x2="21" y2="15" stroke={color} strokeWidth="3" />
    </svg>
  );
}

interface SelectionPopupProps {
  selection: SelectedText;
  bookId: string;
}

export function SelectionPopup({
  selection,
  bookId,
}: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Highlight['style']>('background');
  const [showTranslation, setShowTranslation] = useState(false);
  const { addHighlight, setSelectedText } = useReaderStore();

  useEffect(() => {
    if (selection.rect) {
      const x = selection.rect.left + selection.rect.width / 2;
      const y = selection.rect.top - 10;
      setPosition({ x, y });
    }
  }, [selection]);

  const handleCopy = useCallback(async () => {
    const text = selection.text.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
    setSelectedText(null);
  }, [selection.text, setSelectedText]);

  const commitHighlight = useCallback((style: Highlight['style']) => {
    addHighlight({
      userBookId: bookId,
      cfiRange: selection.cfiRange || '',
      selectedText: selection.text,
      color: 'yellow',
      style,
      chapterId: selection.chapterId,
      paragraphIndex: selection.paragraphIndex,
      charOffset: selection.charOffset,
      charLength: selection.charLength,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    setSelectedText(null);
  }, [addHighlight, bookId, selection, setSelectedText]);

  const handleHighlightClick = useCallback(() => {
    if (showStylePicker) {
      commitHighlight(selectedStyle);
    } else {
      setShowStylePicker(true);
    }
  }, [showStylePicker, selectedStyle, commitHighlight]);

  const handleStyleSelect = useCallback((style: Highlight['style']) => {
    setSelectedStyle(style);
    commitHighlight(style);
  }, [commitHighlight]);

  const handleThoughts = useCallback(() => {
    setShowNoteDialog(true);
  }, []);

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
    setSelectedText(null);
  }, [addHighlight, bookId, selection, selectedStyle, setSelectedText]);

  const handleShare = useCallback(async () => {
    const shareText = selection.text.trim();
    if (!shareText) return;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        setSelectedText(null);
        return;
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setSelectedText(null);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  }, [selection.text, setSelectedText]);

  const handleTranslate = useCallback(() => {
    setShowTranslation(true);
  }, []);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 flex flex-col rounded-lg border bg-popover shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {showStylePicker && (
        <div className="flex items-center gap-0.5 border-b px-1 py-1">
          {POPUP_STYLES.map((s) => (
            <button
              key={s.name}
              aria-label={`highlight-style-${s.name}`}
              aria-pressed={selectedStyle === s.name}
              onClick={() => handleStyleSelect(s.name)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                selectedStyle === s.name
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <PopupStyleIcon style={s.name} active={selectedStyle === s.name} />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 p-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleCopy}
          title="Copy"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', showStylePicker && 'bg-accent')}
          onClick={handleHighlightClick}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleThoughts}
          title="Thoughts"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleShare}
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleTranslate}
          title="Translate"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </div>

      <NoteInputDialog
        open={showNoteDialog}
        selectedText={selection.text}
        onSave={handleSaveNote}
        onClose={() => setShowNoteDialog(false)}
      />

      <TranslationSheet
        open={showTranslation}
        originalText={selection.text}
        bookId={bookId}
        onClose={() => {
          setShowTranslation(false);
          setSelectedText(null);
        }}
      />
    </div>
  );
}
