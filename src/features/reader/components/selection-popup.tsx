'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Highlighter,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import type { SelectedText } from '../types';
import { NoteInputDialog } from './note-input-dialog';

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

  const handleHighlight = useCallback(() => {
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color: 'yellow',
    });
    setSelectedText(null);
  }, [addHighlight, bookId, selection, setSelectedText]);

  const handleThoughts = useCallback(() => {
    setShowNoteDialog(true);
  }, []);

  const handleSaveNote = useCallback((note: string) => {
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color: 'yellow',
      note,
    });
    setSelectedText(null);
  }, [addHighlight, bookId, selection, setSelectedText]);

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

  return (
    <div
      ref={popupRef}
      className="fixed z-50 flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
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
        className="h-8 px-2"
        onClick={handleHighlight}
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

      <NoteInputDialog
        open={showNoteDialog}
        selectedText={selection.text}
        onSave={handleSaveNote}
        onClose={() => setShowNoteDialog(false)}
      />
    </div>
  );
}
