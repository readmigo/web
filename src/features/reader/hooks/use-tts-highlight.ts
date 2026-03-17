'use client';

import { useEffect, useRef } from 'react';
import type { TTSProgress } from './use-tts';

const STYLE_ID = 'rm-tts-highlight-style';

/**
 * Injects TTS highlight CSS once and returns a helper that applies/clears
 * sentence-level and paragraph-level highlight classes on the reader DOM.
 *
 * Strategy:
 *   - Paragraph: add `rm-tts-para` class to the matching <p>/<blockquote>/<figcaption>
 *   - Sentence: replace the paragraph's text with an inline <mark> wrapping the
 *     active sentence text, preserving surrounding text in plain spans.
 *
 * The sentence wrap is rebuilt on every progress tick so it always stays correct.
 */
export function useTTSHighlight(
  contentElement: HTMLElement | null,
  progress: TTSProgress | null,
) {
  const prevParaIndexRef = useRef<number>(-1);
  const prevSentIndexRef = useRef<number>(-1);

  // Inject shared CSS once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rm-tts-para {
        background-color: rgba(99, 102, 241, 0.10);
        border-radius: 4px;
        transition: background-color 200ms ease;
      }
      .rm-tts-word {
        background-color: rgba(99, 102, 241, 0.28);
        color: inherit;
        font-weight: 600;
        border-radius: 3px;
        padding: 0 2px;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!contentElement || !progress) {
      // Clear all highlights when TTS is idle
      clearHighlights(contentElement);
      prevParaIndexRef.current = -1;
      prevSentIndexRef.current = -1;
      return;
    }

    const { paragraphIndex, sentenceIndex, currentText } = progress;
    const paraNodes = Array.from(
      contentElement.querySelectorAll('p, blockquote, figcaption'),
    ) as HTMLElement[];

    const targetNode = paraNodes[paragraphIndex];
    if (!targetNode) return;

    // Remove previous paragraph highlight if paragraph changed
    if (prevParaIndexRef.current !== paragraphIndex) {
      const prevNode = paraNodes[prevParaIndexRef.current];
      if (prevNode) {
        prevNode.classList.remove('rm-tts-para');
        restoreNodeText(prevNode);
      }
      prevParaIndexRef.current = paragraphIndex;
      prevSentIndexRef.current = -1;
    }

    // Apply paragraph highlight
    targetNode.classList.add('rm-tts-para');

    // Apply sentence highlight only if it changed
    if (prevSentIndexRef.current !== sentenceIndex) {
      prevSentIndexRef.current = sentenceIndex;
      applySentenceHighlight(targetNode, currentText);
    }

    return () => {
      // Nothing: cleanup happens when progress goes null or paragraph changes
    };
  }, [contentElement, progress]);

  // Full cleanup when content element changes (chapter navigation)
  useEffect(() => {
    return () => {
      clearHighlights(contentElement);
      prevParaIndexRef.current = -1;
      prevSentIndexRef.current = -1;
    };
  }, [contentElement]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearHighlights(contentElement: HTMLElement | null) {
  if (!contentElement) return;
  const nodes = Array.from(
    contentElement.querySelectorAll('.rm-tts-para'),
  ) as HTMLElement[];
  nodes.forEach((node) => {
    node.classList.remove('rm-tts-para');
    restoreNodeText(node);
  });
}

/**
 * Restore a node that has been mutated by applySentenceHighlight back to plain
 * text. We store the original text in a data attribute to avoid losing it.
 */
function restoreNodeText(node: HTMLElement) {
  const original = node.dataset.ttsOriginalText;
  if (original !== undefined) {
    node.textContent = original;
    delete node.dataset.ttsOriginalText;
  }
}

/**
 * Wrap the active sentence with a <mark class="rm-tts-word"> inside the node.
 * All surrounding text is kept as plain text nodes.
 */
function applySentenceHighlight(node: HTMLElement, sentenceText: string) {
  // Store original text on first mutation
  if (node.dataset.ttsOriginalText === undefined) {
    node.dataset.ttsOriginalText = node.textContent ?? '';
  }

  const fullText = node.dataset.ttsOriginalText;
  const idx = fullText.indexOf(sentenceText);
  if (idx === -1 || !sentenceText.trim()) {
    // Cannot locate sentence — just show the paragraph highlight without word mark
    node.textContent = fullText;
    return;
  }

  const before = fullText.slice(0, idx);
  const after = fullText.slice(idx + sentenceText.length);

  // Rebuild node content safely using DOM (no innerHTML)
  node.textContent = '';

  if (before) {
    node.appendChild(document.createTextNode(before));
  }

  const mark = document.createElement('mark');
  mark.className = 'rm-tts-word';
  mark.textContent = sentenceText;
  node.appendChild(mark);

  if (after) {
    node.appendChild(document.createTextNode(after));
  }
}
