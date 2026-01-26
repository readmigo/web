'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Highlighter, Trash2, Edit2, Check, X } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import type { Highlight } from '../types';
import { cn } from '@/lib/utils';

interface HighlightSidebarProps {
  bookId: string;
  onNavigateToHighlight?: (cfi: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-300', label: 'Yellow' },
  { name: 'green', class: 'bg-green-300', label: 'Green' },
  { name: 'blue', class: 'bg-blue-300', label: 'Blue' },
  { name: 'pink', class: 'bg-pink-300', label: 'Pink' },
  { name: 'purple', class: 'bg-purple-300', label: 'Purple' },
  { name: 'orange', class: 'bg-orange-300', label: 'Orange' },
] as const;

export function HighlightSidebar({ bookId, onNavigateToHighlight }: HighlightSidebarProps) {
  const { highlights, removeHighlight, updateHighlightNote, updateHighlightColor } = useReaderStore();
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const bookHighlights = highlights.filter((h) => h.bookId === bookId);

  const handleStartEditNote = (highlight: Highlight) => {
    setEditingNoteId(highlight.id);
    setNoteText(highlight.note || '');
  };

  const handleSaveNote = (highlight: Highlight) => {
    updateHighlightNote(highlight.id, bookId, noteText);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleChangeColor = (highlight: Highlight, color: Highlight['color']) => {
    updateHighlightColor(highlight.id, bookId, color);
  };

  const handleDeleteHighlight = (highlight: Highlight) => {
    if (window.confirm('Are you sure you want to delete this highlight? This action cannot be undone.')) {
      removeHighlight(highlight.id, bookId);
    }
  };

  const getColorClass = (color: string) => {
    const colorConfig = HIGHLIGHT_COLORS.find((c) => c.name === color);
    return colorConfig?.class || 'bg-yellow-300';
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Highlighter className="h-5 w-5" />
            {bookHighlights.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {bookHighlights.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Highlighter className="h-5 w-5" />
              Highlights ({bookHighlights.length})
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
            {bookHighlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Highlighter className="h-8 w-8 mb-2 opacity-50" />
                <p>No highlights yet</p>
                <p className="text-sm">Select text to create a highlight</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className={cn(
                      'rounded-lg border p-4 transition-colors hover:bg-accent/50 cursor-pointer',
                      selectedHighlight?.id === highlight.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => {
                      setSelectedHighlight(highlight);
                      onNavigateToHighlight?.(highlight.cfiRange);
                    }}
                  >
                    {/* Highlighted text */}
                    <div
                      className={cn(
                        'rounded px-2 py-1 mb-3',
                        getColorClass(highlight.color)
                      )}
                    >
                      <p className="text-sm text-gray-800 line-clamp-3">
                        &ldquo;{highlight.text}&rdquo;
                      </p>
                    </div>

                    {/* Color selector */}
                    <div className="flex items-center gap-1 mb-3">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeColor(highlight, color.name as Highlight['color']);
                          }}
                          className={cn(
                            'h-5 w-5 rounded-full transition-transform hover:scale-110',
                            color.class,
                            highlight.color === color.name && 'ring-2 ring-offset-1 ring-gray-600'
                          )}
                          title={color.label}
                        />
                      ))}
                    </div>

                    {/* Note section */}
                    {editingNoteId === highlight.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveNote(highlight)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {highlight.note ? (
                          <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                            {highlight.note}
                          </p>
                        ) : null}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {highlight.createdAt.toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditNote(highlight);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHighlight(highlight);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
