/**
 * Pure DOM manipulation utilities for highlight rendering and drag handle positioning.
 */

/**
 * Color mapping from highlight color names to CSS rgba values.
 */
export const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: 'rgba(253, 224, 71, 0.4)',
  green: 'rgba(134, 239, 172, 0.4)',
  blue: 'rgba(147, 197, 253, 0.4)',
  pink: 'rgba(249, 168, 212, 0.4)',
  purple: 'rgba(196, 181, 253, 0.4)',
  orange: 'rgba(253, 186, 116, 0.4)',
};

const PARAGRAPH_SELECTOR = 'p, blockquote, figcaption, h1, h2, h3, h4, h5, h6';

/**
 * Get paragraph elements from the content element.
 * Paragraphs are: p, blockquote, figcaption, h1-h6
 */
export function getParagraphs(contentEl: HTMLElement): HTMLElement[] {
  return Array.from(contentEl.querySelectorAll<HTMLElement>(PARAGRAPH_SELECTOR));
}

/**
 * Walk text nodes within a given root element using TreeWalker.
 */
function getTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    nodes.push(node as Text);
  }
  return nodes;
}

/**
 * Given a content element and highlight data, find the matching text range.
 * First tries position-based lookup (paragraphIndex + charOffset + charLength),
 * then falls back to text search.
 * Returns null if not found.
 */
export function findHighlightRange(
  contentEl: HTMLElement,
  highlight: {
    text: string;
    paragraphIndex?: number;
    charOffset?: number;
    charLength?: number;
  }
): Range | null {
  const { text, paragraphIndex, charOffset, charLength } = highlight;

  // Position-based lookup
  if (
    paragraphIndex !== undefined &&
    charOffset !== undefined &&
    charLength !== undefined
  ) {
    const paragraphs = getParagraphs(contentEl);
    const paragraph = paragraphs[paragraphIndex];
    if (paragraph) {
      const range = createRangeFromParagraphOffsets(paragraph, charOffset, charLength);
      if (range !== null) {
        return range;
      }
    }
  }

  // Fallback: text search across all text nodes in contentEl
  return findRangeByTextSearch(contentEl, text);
}

/**
 * Create a Range within a paragraph element using character offsets relative
 * to the paragraph's textContent.
 */
function createRangeFromParagraphOffsets(
  paragraph: HTMLElement,
  charOffset: number,
  charLength: number
): Range | null {
  const textNodes = getTextNodes(paragraph);
  if (textNodes.length === 0) return null;

  let startNode: Text | null = null;
  let startOffsetInNode = 0;
  let endNode: Text | null = null;
  let endOffsetInNode = 0;

  const endOffset = charOffset + charLength;
  let accumulated = 0;

  for (const node of textNodes) {
    const nodeLength = node.textContent?.length ?? 0;
    const nodeStart = accumulated;
    const nodeEnd = accumulated + nodeLength;

    if (startNode === null && charOffset >= nodeStart && charOffset <= nodeEnd) {
      startNode = node;
      startOffsetInNode = charOffset - nodeStart;
    }

    if (endNode === null && endOffset >= nodeStart && endOffset <= nodeEnd) {
      endNode = node;
      endOffsetInNode = endOffset - nodeStart;
    }

    if (startNode !== null && endNode !== null) {
      break;
    }

    accumulated += nodeLength;
  }

  if (startNode === null || endNode === null) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffsetInNode);
    range.setEnd(endNode, endOffsetInNode);
    return range;
  } catch {
    return null;
  }
}

/**
 * Search all text nodes in contentEl for the first occurrence of the exact text string.
 */
function findRangeByTextSearch(contentEl: HTMLElement, text: string): Range | null {
  if (!text) return null;

  const fullText = contentEl.textContent ?? '';
  const matchIndex = fullText.indexOf(text);
  if (matchIndex === -1) return null;

  const textNodes = getTextNodes(contentEl);
  let startNode: Text | null = null;
  let startOffsetInNode = 0;
  let endNode: Text | null = null;
  let endOffsetInNode = 0;

  const endIndex = matchIndex + text.length;
  let accumulated = 0;

  for (const node of textNodes) {
    const nodeLength = node.textContent?.length ?? 0;
    const nodeStart = accumulated;
    const nodeEnd = accumulated + nodeLength;

    if (startNode === null && matchIndex >= nodeStart && matchIndex < nodeEnd) {
      startNode = node;
      startOffsetInNode = matchIndex - nodeStart;
    }

    if (endNode === null && endIndex > nodeStart && endIndex <= nodeEnd) {
      endNode = node;
      endOffsetInNode = endIndex - nodeStart;
    }

    if (startNode !== null && endNode !== null) {
      break;
    }

    accumulated += nodeLength;
  }

  if (startNode === null || endNode === null) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffsetInNode);
    range.setEnd(endNode, endOffsetInNode);
    return range;
  } catch {
    return null;
  }
}

/**
 * Wrap a Range with <mark> elements. Handles ranges that span multiple text nodes.
 * Sets data-highlight-id and data-highlight-color attributes on the mark elements.
 * Returns array of created mark elements.
 */
export function wrapRangeWithMarks(
  range: Range,
  highlightId: string,
  color: string
): HTMLElement[] {
  const backgroundColor = HIGHLIGHT_COLOR_MAP[color] ?? color;
  const marks: HTMLElement[] = [];

  // Collect all text nodes that overlap with the range
  const walker = document.createTreeWalker(
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode!
      : range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    null
  );

  const overlappingTextNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    const textNode = node as Text;
    if (range.intersectsNode(textNode)) {
      overlappingTextNodes.push(textNode);
    }
  }

  for (const textNode of overlappingTextNodes) {
    const nodeStart = range.startContainer === textNode ? range.startOffset : 0;
    const nodeEnd =
      range.endContainer === textNode
        ? range.endOffset
        : (textNode.textContent?.length ?? 0);

    if (nodeStart === nodeEnd) continue;

    // Split at end boundary first to preserve correct offset for start split
    const middleAndAfter =
      nodeEnd < (textNode.textContent?.length ?? 0)
        ? textNode.splitText(nodeEnd)
        : null;

    const before =
      nodeStart > 0 ? textNode.splitText(nodeStart) : textNode;

    // At this point:
    // - textNode = text before the highlight (if nodeStart > 0) or the highlight itself
    // - before = the highlight text node
    // - middleAndAfter = text after the highlight (if split)

    const targetNode = nodeStart > 0 ? before : textNode;

    const mark = document.createElement('mark');
    mark.dataset.highlightId = highlightId;
    mark.dataset.highlightColor = color;
    mark.style.backgroundColor = backgroundColor;
    mark.style.cursor = 'pointer';
    mark.style.borderRadius = '2px';

    targetNode.parentNode?.insertBefore(mark, targetNode);
    mark.appendChild(targetNode);
    marks.push(mark);

    // Suppress unused variable warning; middleAndAfter stays in the DOM
    void middleAndAfter;
  }

  return marks;
}

/**
 * Remove all <mark> elements for a specific highlight ID, restoring original text nodes.
 */
export function removeHighlightMarks(contentEl: HTMLElement, highlightId: string): void {
  const marks = contentEl.querySelectorAll<HTMLElement>(
    `mark[data-highlight-id="${CSS.escape(highlightId)}"]`
  );

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    // Move children out of the mark back into the parent
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);

    // Normalize to merge adjacent text nodes
    parent.normalize();
  });
}

/**
 * Remove all highlight marks from content.
 */
export function clearAllHighlightMarks(contentEl: HTMLElement): void {
  const marks = contentEl.querySelectorAll<HTMLElement>('mark[data-highlight-id]');

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });

  // Single normalize pass after all marks are removed
  contentEl.normalize();
}

/**
 * Calculate position data from the current window Selection relative to the content element.
 * Returns the paragraphIndex (0-based index among p/blockquote/etc elements),
 * charOffset within that paragraph's textContent, and charLength.
 * Also returns startOffset/endOffset as absolute character offsets within contentEl.textContent.
 */
export function getPositionFromSelection(
  contentEl: HTMLElement
): {
  text: string;
  paragraphIndex: number;
  charOffset: number;
  charLength: number;
  startOffset: number;
  endOffset: number;
} | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();
  if (!selectedText) return null;

  // Verify the selection is within contentEl
  if (!contentEl.contains(range.commonAncestorContainer)) return null;

  // Find which paragraph the selection starts in
  const startContainer = range.startContainer;
  const startElement =
    startContainer.nodeType === Node.ELEMENT_NODE
      ? (startContainer as HTMLElement)
      : startContainer.parentElement;

  if (!startElement) return null;

  const closestParagraph = startElement.closest<HTMLElement>(PARAGRAPH_SELECTOR);
  const paragraphs = getParagraphs(contentEl);

  let paragraphIndex = -1;
  if (closestParagraph) {
    paragraphIndex = paragraphs.indexOf(closestParagraph);
  }

  if (paragraphIndex === -1) return null;

  const paragraph = paragraphs[paragraphIndex];

  // Calculate charOffset within the paragraph's textContent
  const charOffset = getOffsetWithinContainer(paragraph, range.startContainer, range.startOffset);
  if (charOffset === null) return null;

  const charLength = selectedText.length;

  // Calculate absolute offsets within contentEl.textContent
  const startOffset = getOffsetWithinContainer(contentEl, range.startContainer, range.startOffset);
  const endOffset = getOffsetWithinContainer(contentEl, range.endContainer, range.endOffset);

  if (startOffset === null || endOffset === null) return null;

  return {
    text: selectedText,
    paragraphIndex,
    charOffset,
    charLength,
    startOffset,
    endOffset,
  };
}

/**
 * Calculate the character offset of a node+offset position relative to the
 * textContent of a container element.
 * Returns null if the node is not within the container.
 */
function getOffsetWithinContainer(
  container: HTMLElement,
  targetNode: Node,
  targetOffset: number
): number | null {
  if (!container.contains(targetNode)) return null;

  const textNodes = getTextNodes(container);
  let accumulated = 0;

  for (const node of textNodes) {
    if (node === targetNode) {
      return accumulated + targetOffset;
    }
    accumulated += node.textContent?.length ?? 0;
  }

  // If targetNode is an element node (e.g. start of a block), sum up preceding text
  if (targetNode.nodeType === Node.ELEMENT_NODE) {
    // targetOffset is a child index in this case
    const element = targetNode as Element;
    let charCount = 0;
    for (let i = 0; i < targetOffset; i++) {
      const child = element.childNodes[i];
      if (child) {
        charCount += child.textContent?.length ?? 0;
      }
    }
    const offsetBeforeElement = getOffsetWithinContainer(
      container,
      targetNode.parentNode as HTMLElement,
      Array.from((targetNode.parentNode as ParentNode).childNodes).indexOf(targetNode as ChildNode)
    );
    return offsetBeforeElement !== null ? offsetBeforeElement + charCount : null;
  }

  return null;
}
