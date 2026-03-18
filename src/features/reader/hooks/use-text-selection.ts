import { useEffect, useRef } from 'react';
import type { SelectedText } from '../types';
import type { ChapterRenderer } from '../engine/chapter-renderer';
import type { Chapter } from '@/features/library/types';
import { getPositionFromSelection } from '../utils/highlight-dom';

/**
 * Listens for mouseup events and emits selected-text data when the user
 * finishes a text selection inside the reader content element.
 */
export function useTextSelection(
  rendererRef: React.RefObject<ChapterRenderer | null>,
  chapters: Chapter[],
  currentIndexRef: React.RefObject<number>,
  suppressSelectionRef: React.RefObject<boolean>,
  onTextSelect?: (selection: SelectedText) => void,
) {
  const onTextSelectRef = useRef(onTextSelect);
  useEffect(() => { onTextSelectRef.current = onTextSelect; }, [onTextSelect]);

  useEffect(() => {
    const handleSelectionUp = () => {
      if (suppressSelectionRef.current) return;
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const contentEl = rendererRef.current?.contentElement;
      const posData = contentEl ? getPositionFromSelection(contentEl) : null;
      const chapter = chapters[currentIndexRef.current];

      onTextSelectRef.current?.({
        text: selection.toString(),
        rect,
        source: 'selection',
        chapterId: chapter?.id,
        paragraphIndex: posData?.paragraphIndex,
        charOffset: posData?.charOffset,
        charLength: posData?.charLength,
        startOffset: posData?.startOffset,
        endOffset: posData?.endOffset,
      });
    };

    document.addEventListener('mouseup', handleSelectionUp);
    return () => document.removeEventListener('mouseup', handleSelectionUp);
  }, [chapters, rendererRef, currentIndexRef, suppressSelectionRef]);
}
