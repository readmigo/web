'use client';

/**
 * HighlightOverlay
 *
 * Renders visual highlight marks over reader content and provides:
 * - DOM <mark> wrapping via highlight-dom utilities
 * - Drag handles for resizing an active highlight's start/end
 * - A floating action bar (delete + color picker) for the active highlight
 *
 * Usage example:
 *
 *   <HighlightOverlay
 *     contentElement={contentRef.current}
 *     highlights={highlights}
 *     onHighlightClick={(id) => setActiveId(id)}
 *     onHighlightUpdate={(id, data) => updateHighlight(id, data)}
 *     onHighlightDelete={(id) => deleteHighlight(id)}
 *   />
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  findHighlightRange,
  wrapRangeWithMarks,
  clearAllHighlightMarks,
} from '../utils/highlight-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HighlightItem {
  id: string;
  selectedText: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  paragraphIndex?: number;
  charOffset?: number;
  charLength?: number;
}

export interface HighlightUpdateData {
  selectedText: string;
  paragraphIndex: number;
  charOffset: number;
  charLength: number;
  startOffset: number;
  endOffset: number;
}

export interface HighlightOverlayProps {
  contentElement: HTMLElement | null;
  highlights: HighlightItem[];
  onHighlightClick?: (highlightId: string) => void;
  onHighlightUpdate?: (highlightId: string, data: HighlightUpdateData) => void;
  onHighlightDelete?: (highlightId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGHLIGHT_COLORS: Array<{ name: HighlightItem['color']; tailwind: string; css: string }> = [
  { name: 'yellow', tailwind: 'bg-yellow-300', css: 'rgb(253 224 71)' },
  { name: 'green', tailwind: 'bg-green-300', css: 'rgb(134 239 172)' },
  { name: 'blue', tailwind: 'bg-blue-300', css: 'rgb(147 197 253)' },
  { name: 'pink', tailwind: 'bg-pink-300', css: 'rgb(249 168 212)' },
  { name: 'purple', tailwind: 'bg-purple-300', css: 'rgb(216 180 254)' },
  { name: 'orange', tailwind: 'bg-orange-300', css: 'rgb(253 186 116)' },
];

function getColorCss(color: HighlightItem['color']): string {
  return HIGHLIGHT_COLORS.find((c) => c.name === color)?.css ?? HIGHLIGHT_COLORS[0].css;
}

function getColorTailwind(color: HighlightItem['color']): string {
  return HIGHLIGHT_COLORS.find((c) => c.name === color)?.tailwind ?? HIGHLIGHT_COLORS[0].tailwind;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

interface HandlePosition {
  x: number;
  y: number;
}

/**
 * Returns the fixed-position coordinates for start/end drag handles by
 * querying all <mark> elements that share a highlight id.
 */
function computeHandlePositions(
  highlightId: string,
): { start: HandlePosition; end: HandlePosition } | null {
  const marks = document.querySelectorAll<HTMLElement>(
    `mark[data-highlight-id="${highlightId}"]`,
  );
  if (!marks.length) return null;

  const firstRect = marks[0].getBoundingClientRect();
  const lastRect = marks[marks.length - 1].getBoundingClientRect();

  return {
    start: { x: firstRect.left, y: firstRect.top },
    end: { x: lastRect.right, y: lastRect.bottom },
  };
}

/**
 * Returns the fixed-position midpoint of all <mark> elements for the action
 * bar, positioned above the first mark.
 */
function computeActionBarPosition(
  highlightId: string,
): { x: number; y: number } | null {
  const marks = document.querySelectorAll<HTMLElement>(
    `mark[data-highlight-id="${highlightId}"]`,
  );
  if (!marks.length) return null;

  const firstRect = marks[0].getBoundingClientRect();
  const lastRect = marks[marks.length - 1].getBoundingClientRect();
  const midX = (firstRect.left + lastRect.right) / 2;
  return { x: midX, y: firstRect.top };
}

// ---------------------------------------------------------------------------
// Position extraction from a Range (mirrors selection-popup logic)
// ---------------------------------------------------------------------------

function extractPositionFromRange(
  range: Range,
  contentElement: HTMLElement,
): Omit<HighlightUpdateData, 'selectedText'> | null {
  const paragraphs = Array.from(
    contentElement.querySelectorAll<HTMLElement>('p, blockquote, figcaption, h1, h2, h3, h4, h5, h6'),
  );

  // Find paragraph that contains the range start
  let startParagraphIndex = -1;
  let startCharOffset = 0;
  let endCharOffset = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.contains(range.startContainer)) {
      startParagraphIndex = i;
      // Walk text nodes up to startContainer to compute offset
      const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node === range.startContainer) {
          startCharOffset = offset + range.startOffset;
          break;
        }
        offset += (node.textContent ?? '').length;
      }
      break;
    }
  }

  if (startParagraphIndex === -1) return null;

  // Compute end offset relative to same paragraph start
  const startPara = paragraphs[startParagraphIndex];
  const walker = document.createTreeWalker(startPara, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === range.endContainer) {
      endCharOffset = offset + range.endOffset;
      break;
    }
    offset += (node.textContent ?? '').length;
  }
  if (endCharOffset === 0) endCharOffset = startCharOffset + (range.toString().length);

  return {
    paragraphIndex: startParagraphIndex,
    charOffset: startCharOffset,
    charLength: endCharOffset - startCharOffset,
    startOffset: startCharOffset,
    endOffset: endCharOffset,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type DragHandle = 'start' | 'end';

interface DragState {
  handle: DragHandle;
  highlightId: string;
  liveRange: Range | null;
}

export function HighlightOverlay({
  contentElement,
  highlights,
  onHighlightClick,
  onHighlightUpdate,
  onHighlightDelete,
}: HighlightOverlayProps) {
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [handlePositions, setHandlePositions] = useState<{
    start: HandlePosition;
    end: HandlePosition;
  } | null>(null);
  const [actionBarPosition, setActionBarPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const startHandleRef = useRef<HTMLDivElement>(null);
  const endHandleRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Re-render highlights into DOM whenever content or data change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!contentElement) return;

    clearAllHighlightMarks(contentElement);

    highlights.forEach((highlight) => {
      const range = findHighlightRange(contentElement, highlight);
      if (!range) return;
      wrapRangeWithMarks(range, highlight.id, highlight.color);
    });
  }, [contentElement, highlights]);

  // -------------------------------------------------------------------------
  // Click detection on <mark> elements
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!contentElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const mark = target.closest<HTMLElement>('mark[data-highlight-id]');
      if (mark) {
        const id = mark.dataset.highlightId ?? null;
        setActiveHighlightId(id);
        onHighlightClick?.(id ?? '');
        event.stopPropagation();
        return;
      }
      // Click outside any mark → clear active state
      setActiveHighlightId(null);
    };

    contentElement.addEventListener('click', handleClick);
    return () => contentElement.removeEventListener('click', handleClick);
  }, [contentElement, onHighlightClick]);

  // -------------------------------------------------------------------------
  // Dismiss active state when clicking outside the overlay layer
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!activeHighlightId) return;

    const handleDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Allow clicks on handles and action bar without dismissing
      const isHandle =
        startHandleRef.current?.contains(target) ||
        endHandleRef.current?.contains(target);
      const isActionBar = target.closest('[data-highlight-action-bar]');
      if (!isHandle && !isActionBar) {
        setActiveHighlightId(null);
      }
    };

    // Capture phase so we run before contentElement's click handler
    document.addEventListener('click', handleDocClick, true);
    return () => document.removeEventListener('click', handleDocClick, true);
  }, [activeHighlightId]);

  // -------------------------------------------------------------------------
  // Compute positions for handles and action bar whenever active id changes
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!activeHighlightId) {
      setHandlePositions(null);
      setActionBarPosition(null);
      return;
    }

    // Use rAF to ensure DOM marks are rendered
    const frame = requestAnimationFrame(() => {
      const positions = computeHandlePositions(activeHighlightId);
      setHandlePositions(positions);
      const barPos = computeActionBarPosition(activeHighlightId);
      setActionBarPosition(barPos);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeHighlightId, highlights]);

  // -------------------------------------------------------------------------
  // Drag interaction
  // -------------------------------------------------------------------------

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, handle: DragHandle) => {
      if (!activeHighlightId || !contentElement) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      dragStateRef.current = {
        handle,
        highlightId: activeHighlightId,
        liveRange: null,
      };
      setIsDragging(true);
    },
    [activeHighlightId, contentElement],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStateRef.current || !contentElement) return;

      event.preventDefault();

      const { highlightId, handle } = dragStateRef.current;
      const highlight = highlights.find((h) => h.id === highlightId);
      if (!highlight) return;

      // Get the caret position at the pointer location
      let caretRange: Range | null = null;
      if (document.caretRangeFromPoint) {
        caretRange = document.caretRangeFromPoint(event.clientX, event.clientY);
      } else if ((document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null }).caretPositionFromPoint) {
        const pos = (document as Document & { caretPositionFromPoint: (x: number, y: number) => { offsetNode: Node; offset: number } | null }).caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          caretRange = document.createRange();
          caretRange.setStart(pos.offsetNode, pos.offset);
          caretRange.collapse(true);
        }
      }

      if (!caretRange) return;
      dragStateRef.current.liveRange = caretRange;

      // Re-render marks with updated live range for preview
      clearAllHighlightMarks(contentElement);
      highlights.forEach((h) => {
        if (h.id !== highlightId) {
          const range = findHighlightRange(contentElement, h);
          if (range) wrapRangeWithMarks(range, h.id, h.color);
        }
      });

      // Build live preview range
      const originalRange = findHighlightRange(contentElement, highlight);
      if (!originalRange) return;

      try {
        const previewRange = document.createRange();
        if (handle === 'start') {
          previewRange.setStart(caretRange.startContainer, caretRange.startOffset);
          previewRange.setEnd(originalRange.endContainer, originalRange.endOffset);
        } else {
          previewRange.setStart(originalRange.startContainer, originalRange.startOffset);
          previewRange.setEnd(caretRange.startContainer, caretRange.startOffset);
        }
        // Ensure start <= end
        if (previewRange.collapsed) return;
        wrapRangeWithMarks(previewRange, highlightId, highlight.color);
      } catch {
        // Range boundaries may be invalid during rapid movement — ignore
      }

      // Update handle positions for live feedback
      const positions = computeHandlePositions(highlightId);
      setHandlePositions(positions);
    },
    [isDragging, contentElement, highlights],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStateRef.current || !contentElement) return;

      event.currentTarget.releasePointerCapture(event.pointerId);

      const { highlightId, handle, liveRange } = dragStateRef.current;
      const highlight = highlights.find((h) => h.id === highlightId);

      if (liveRange && highlight && onHighlightUpdate) {
        const originalRange = findHighlightRange(contentElement, highlight);
        if (originalRange) {
          try {
            const finalRange = document.createRange();
            if (handle === 'start') {
              finalRange.setStart(liveRange.startContainer, liveRange.startOffset);
              finalRange.setEnd(originalRange.endContainer, originalRange.endOffset);
            } else {
              finalRange.setStart(originalRange.startContainer, originalRange.startOffset);
              finalRange.setEnd(liveRange.startContainer, liveRange.startOffset);
            }

            if (!finalRange.collapsed) {
              const positionData = extractPositionFromRange(finalRange, contentElement);
              if (positionData) {
                onHighlightUpdate(highlightId, {
                  selectedText: finalRange.toString(),
                  ...positionData,
                });
              }
            }
          } catch {
            // Malformed range — skip update
          }
        }
      }

      dragStateRef.current = null;
      setIsDragging(false);

      // Refresh handle positions after update
      requestAnimationFrame(() => {
        const positions = computeHandlePositions(highlightId);
        setHandlePositions(positions);
        const barPos = computeActionBarPosition(highlightId);
        setActionBarPosition(barPos);
      });
    },
    [isDragging, contentElement, highlights, onHighlightUpdate],
  );

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const activeHighlight = highlights.find((h) => h.id === activeHighlightId) ?? null;
  const showHandlesAndBar = activeHighlightId !== null && !isDragging;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!activeHighlightId || !activeHighlight) return null;

  return (
    <>
      {/* Start drag handle */}
      {handlePositions && (
        <div
          ref={startHandleRef}
          role="slider"
          aria-label="Drag start of highlight"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          tabIndex={0}
          className={cn(
            'fixed z-50 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md',
            getColorTailwind(activeHighlight.color),
            isDragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
          style={{
            left: handlePositions.start.x - 12,
            top: handlePositions.start.y - 24,
            touchAction: 'none',
            userSelect: 'none',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Teardrop indicator pointing down */}
          <span
            className="absolute -bottom-1.5 left-1/2 h-2 w-1 -translate-x-1/2 rounded-b-full"
            style={{ backgroundColor: getColorCss(activeHighlight.color) }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* End drag handle */}
      {handlePositions && (
        <div
          ref={endHandleRef}
          role="slider"
          aria-label="Drag end of highlight"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
          tabIndex={0}
          className={cn(
            'fixed z-50 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md',
            getColorTailwind(activeHighlight.color),
            isDragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
          style={{
            left: handlePositions.end.x - 12,
            top: handlePositions.end.y,
            touchAction: 'none',
            userSelect: 'none',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Teardrop indicator pointing up */}
          <span
            className="absolute -top-1.5 left-1/2 h-2 w-1 -translate-x-1/2 rounded-t-full"
            style={{ backgroundColor: getColorCss(activeHighlight.color) }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Floating action bar */}
      {showHandlesAndBar && actionBarPosition && (
        <div
          data-highlight-action-bar
          role="toolbar"
          aria-label="Highlight actions"
          className="fixed z-50 flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg"
          style={{
            left: actionBarPosition.x,
            top: actionBarPosition.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          {/* Color picker */}
          <div className="flex items-center gap-0.5 pr-1 border-r" role="group" aria-label="Highlight color">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                aria-label={`Change highlight color to ${color.name}`}
                aria-pressed={activeHighlight.color === color.name}
                className={cn(
                  'h-5 w-5 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  color.tailwind,
                  activeHighlight.color === color.name && 'ring-2 ring-offset-1 ring-gray-600',
                )}
                onClick={() => {
                  // Color change is surfaced via onHighlightUpdate with same position data
                  if (!contentElement || !onHighlightUpdate) return;
                  const range = findHighlightRange(contentElement, activeHighlight);
                  if (!range) return;
                  const positionData = extractPositionFromRange(range, contentElement);
                  if (positionData) {
                    onHighlightUpdate(activeHighlight.id, {
                      selectedText: activeHighlight.selectedText,
                      ...positionData,
                    });
                  }
                }}
              />
            ))}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete highlight"
            onClick={() => {
              onHighlightDelete?.(activeHighlight.id);
              setActiveHighlightId(null);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </>
  );
}
