'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Languages,
  BookOpen,
  Plus,
  Volume2,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import type { SelectedText } from '../types';

interface SelectionPopupProps {
  selection: SelectedText;
  bookId: string;
  onTranslate: () => void;
  onExplain: () => void;
  onSpeak: () => void;
  onAddWord: () => void;
}

export function SelectionPopup({
  selection,
  bookId,
  onTranslate,
  onExplain,
  onSpeak,
  onAddWord,
}: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { addHighlight, setShowAiPanel, setSelectedText } = useReaderStore();
  const isParagraphMenu = selection.source === 'paragraph';

  useEffect(() => {
    if (selection.rect) {
      const x = selection.rect.left + selection.rect.width / 2;
      const y = selection.rect.top - 10;
      setPosition({ x, y });
    }
  }, [selection]);

  const handleHighlight = (color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange') => {
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color,
    });
    setSelectedText(null);
  };

  const handleOpenAI = () => {
    setShowAiPanel(true);
  };

  const handleAddNote = () => {
    const note = window.prompt('Add a note', '');
    if (note === null) return;
    if (!note.trim()) return;
    addHighlight({
      bookId,
      cfiRange: selection.cfiRange || '',
      text: selection.text,
      color: 'yellow',
      note: note.trim(),
    });
    setSelectedText(null);
  };

  const handleShare = async () => {
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
  };

  // Check if selection is a single word
  const isSingleWord = selection.text.trim().split(/\s+/).length === 1;

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
      {!isParagraphMenu && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onTranslate}
          >
            <Languages className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleOpenAI}
          >
            <BookOpen className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onSpeak}
          >
            <Volume2 className="h-4 w-4" />
          </Button>

          {isSingleWord && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onAddWord}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {isParagraphMenu && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleAddNote}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Highlight colors */}
      <div className="flex items-center gap-0.5 border-l pl-1 ml-1">
        <button
          onClick={() => handleHighlight('yellow')}
          className="h-5 w-5 rounded-full bg-yellow-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Yellow"
        />
        <button
          onClick={() => handleHighlight('green')}
          className="h-5 w-5 rounded-full bg-green-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Green"
        />
        <button
          onClick={() => handleHighlight('blue')}
          className="h-5 w-5 rounded-full bg-blue-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Blue"
        />
        <button
          onClick={() => handleHighlight('pink')}
          className="h-5 w-5 rounded-full bg-pink-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Pink"
        />
        <button
          onClick={() => handleHighlight('purple')}
          className="h-5 w-5 rounded-full bg-purple-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Purple"
        />
        <button
          onClick={() => handleHighlight('orange')}
          className="h-5 w-5 rounded-full bg-orange-300 hover:ring-2 hover:ring-ring hover:ring-offset-1"
          title="Orange"
        />
      </div>
    </div>
  );
}
