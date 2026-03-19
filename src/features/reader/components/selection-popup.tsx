'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Share2,
} from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { log } from '@/lib/logger';
import type { SelectedText } from '../types';

interface SelectionPopupProps {
  selection: SelectedText;
  bookId: string;
}

export function SelectionPopup({
  selection,
}: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { setSelectedText } = useReaderStore();

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
      log.reader.error('Failed to copy', error);
    }
    setSelectedText(null);
  }, [selection.text, setSelectedText]);

  const handleShare = useCallback(async () => {
    const shareText = selection.text.trim();
    if (!shareText) return;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        setSelectedText(null);
        return;
      } catch (error) {
        log.reader.error('Failed to share', error);
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setSelectedText(null);
      } catch (error) {
        log.reader.error('Failed to copy text', error);
      }
    }
  }, [selection.text, setSelectedText]);

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
          className="h-8 px-2"
          onClick={handleShare}
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
