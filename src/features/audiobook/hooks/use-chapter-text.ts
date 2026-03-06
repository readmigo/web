'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface ChapterContentResponse {
  id: string;
  title: string;
  order: number;
  contentUrl: string;
}

interface ParsedParagraph {
  index: number;
  text: string;
}

/**
 * Parse HTML content into plain-text paragraphs using DOMParser.
 * Only extracts textContent — no raw HTML is stored or rendered.
 */
function parseHtmlToParagraphs(html: string): ParsedParagraph[] {
  if (typeof document === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs: ParsedParagraph[] = [];

  const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, li');

  let index = 0;
  elements.forEach((el) => {
    const text = (el.textContent || '').trim();
    if (text.length > 0) {
      paragraphs.push({ index, text });
      index++;
    }
  });

  return paragraphs;
}

/**
 * Fetch and parse chapter text content for follow-along display.
 * Uses the same content API as the reader.
 */
export function useChapterText(bookId: string | undefined, chapterId: string | undefined) {
  return useQuery({
    queryKey: ['chapter-text', bookId, chapterId],
    queryFn: async () => {
      if (!bookId || !chapterId) return null;

      // Fetch chapter metadata to get content URL
      const res = await apiClient.get<ChapterContentResponse>(
        `/books/${bookId}/content/${chapterId}`,
        { skipAuth: true }
      );

      // Fetch actual HTML content
      const htmlRes = await fetch(res.contentUrl);
      if (!htmlRes.ok) throw new Error(`Failed to fetch chapter HTML: ${htmlRes.status}`);
      const html = await htmlRes.text();

      // Parse into plain-text paragraphs
      const paragraphs = parseHtmlToParagraphs(html);

      return {
        chapterId,
        title: res.title,
        paragraphs,
        totalCharacters: paragraphs.reduce((sum, p) => sum + p.text.length, 0),
      };
    },
    enabled: !!bookId && !!chapterId,
    staleTime: 30 * 60 * 1000,
  });
}
