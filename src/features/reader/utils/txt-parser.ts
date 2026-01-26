/**
 * TXT file parser with chapter detection and HTML conversion
 */

export interface ParsedChapter {
  id: string;
  title: string;
  content: string;
  paragraphs: string[];
  startIndex: number;
  endIndex: number;
}

export interface ParsedTxtDocument {
  title: string;
  chapters: ParsedChapter[];
  totalCharacters: number;
  html: string;
}

// Chapter detection patterns for multiple languages
const CHAPTER_PATTERNS = [
  // English patterns
  /^Chapter\s+(\d+|[IVXLC]+)(?:\s*[:\-–—.]\s*(.*))?$/im,
  /^CHAPTER\s+(\d+|[IVXLC]+)(?:\s*[:\-–—.]\s*(.*))?$/m,
  /^Part\s+(\d+|[IVXLC]+)(?:\s*[:\-–—.]\s*(.*))?$/im,
  /^Book\s+(\d+|[IVXLC]+)(?:\s*[:\-–—.]\s*(.*))?$/im,
  /^Section\s+(\d+)(?:\s*[:\-–—.]\s*(.*))?$/im,
  // Chinese patterns
  /^第\s*([零一二三四五六七八九十百千万\d]+)\s*章(?:\s*[:\-–—.：]\s*(.*))?$/m,
  /^第\s*([零一二三四五六七八九十百千万\d]+)\s*节(?:\s*[:\-–—.：]\s*(.*))?$/m,
  /^第\s*([零一二三四五六七八九十百千万\d]+)\s*卷(?:\s*[:\-–—.：]\s*(.*))?$/m,
  /^第\s*([零一二三四五六七八九十百千万\d]+)\s*回(?:\s*[:\-–—.：]\s*(.*))?$/m,
  // Korean patterns
  /^제\s*(\d+)\s*장(?:\s*[:\-–—.]\s*(.*))?$/m,
  /^제\s*(\d+)\s*편(?:\s*[:\-–—.]\s*(.*))?$/m,
  // Japanese patterns
  /^第\s*(\d+)\s*章(?:\s*[:\-–—.]\s*(.*))?$/m,
  /^(\d+)\s*章(?:\s*[:\-–—.]\s*(.*))?$/m,
  // Numbered patterns
  /^(\d+)[\.\)]\s+(.+)$/m,
];

/**
 * Detect text encoding (basic detection for common encodings)
 */
export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Check for BOM
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'utf-8';
  }
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'utf-16le';
  }
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'utf-16be';
  }

  // Try to detect common encodings by byte patterns
  // This is a simplified detection - for production, use a library like jschardet
  let hasHighBytes = false;
  let utf8Valid = true;
  let i = 0;

  while (i < bytes.length && i < 10000) {
    if (bytes[i] > 127) {
      hasHighBytes = true;
      // Check for valid UTF-8 sequences
      if ((bytes[i] & 0xE0) === 0xC0) {
        if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) {
          utf8Valid = false;
        }
        i += 2;
      } else if ((bytes[i] & 0xF0) === 0xE0) {
        if (i + 2 >= bytes.length ||
            (bytes[i + 1] & 0xC0) !== 0x80 ||
            (bytes[i + 2] & 0xC0) !== 0x80) {
          utf8Valid = false;
        }
        i += 3;
      } else if ((bytes[i] & 0xF8) === 0xF0) {
        if (i + 3 >= bytes.length ||
            (bytes[i + 1] & 0xC0) !== 0x80 ||
            (bytes[i + 2] & 0xC0) !== 0x80 ||
            (bytes[i + 3] & 0xC0) !== 0x80) {
          utf8Valid = false;
        }
        i += 4;
      } else {
        utf8Valid = false;
        i++;
      }
    } else {
      i++;
    }
  }

  if (!hasHighBytes) {
    return 'ascii';
  }

  if (utf8Valid) {
    return 'utf-8';
  }

  // Default to UTF-8, let the decoder handle errors
  return 'utf-8';
}

/**
 * Decode text content from ArrayBuffer with auto-detection
 */
export function decodeText(buffer: ArrayBuffer, encoding?: string): string {
  const detectedEncoding = encoding || detectEncoding(buffer);

  try {
    const decoder = new TextDecoder(detectedEncoding, { fatal: false });
    return decoder.decode(buffer);
  } catch {
    // Fallback to UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  }
}

/**
 * Detect chapters in text content
 */
export function detectChapters(content: string): ParsedChapter[] {
  const lines = content.split(/\r?\n/);
  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter | null = null;
  let chapterIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentChapter) {
        currentChapter.content += '\n';
      }
      continue;
    }

    // Check if this line is a chapter heading
    let isChapterHeading = false;
    let chapterTitle = line;

    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        isChapterHeading = true;
        chapterTitle = match[2] ? `${match[0]}` : line;
        break;
      }
    }

    if (isChapterHeading) {
      // Save previous chapter
      if (currentChapter) {
        currentChapter.endIndex = i - 1;
        currentChapter.paragraphs = parseParagraphs(currentChapter.content);
        chapters.push(currentChapter);
      }

      // Start new chapter
      currentChapter = {
        id: `chapter-${chapterIndex}`,
        title: chapterTitle,
        content: '',
        paragraphs: [],
        startIndex: i,
        endIndex: -1,
      };
      chapterIndex++;
    } else if (currentChapter) {
      currentChapter.content += line + '\n';
    } else {
      // Content before first chapter - create prologue
      if (!currentChapter) {
        currentChapter = {
          id: 'chapter-0',
          title: 'Prologue',
          content: line + '\n',
          paragraphs: [],
          startIndex: 0,
          endIndex: -1,
        };
        chapterIndex = 1;
      }
    }
  }

  // Add last chapter
  if (currentChapter) {
    currentChapter.endIndex = lines.length - 1;
    currentChapter.paragraphs = parseParagraphs(currentChapter.content);
    chapters.push(currentChapter);
  }

  // If no chapters detected, treat entire content as one chapter
  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-0',
      title: 'Chapter 1',
      content: content,
      paragraphs: parseParagraphs(content),
      startIndex: 0,
      endIndex: lines.length - 1,
    });
  }

  return chapters;
}

/**
 * Parse content into paragraphs
 */
function parseParagraphs(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    } else {
      // Check if this looks like a new paragraph (indented or starts with special characters)
      const isNewParagraph = /^[\s\t　]/.test(line) || /^[""「『【〈]/.test(trimmed);

      if (isNewParagraph && currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = trimmed;
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      }
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs.filter(p => p.length > 0);
}

/**
 * Convert parsed TXT to HTML
 */
export function txtToHtml(chapters: ParsedChapter[]): string {
  return chapters.map(chapter => {
    const paragraphsHtml = chapter.paragraphs
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('\n');

    return `
      <section id="${chapter.id}" class="chapter">
        <h2 class="chapter-title">${escapeHtml(chapter.title)}</h2>
        <div class="chapter-content">
          ${paragraphsHtml}
        </div>
      </section>
    `;
  }).join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extract title from filename or content
 */
function extractTitle(filename: string, content: string): string {
  // Try to get title from filename
  if (filename) {
    const name = filename.replace(/\.txt$/i, '');
    if (name && name.length > 0) {
      return name;
    }
  }

  // Try to get title from first non-empty line
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length < 100) {
      return trimmed;
    }
  }

  return 'Untitled Document';
}

/**
 * Parse TXT file to structured document
 */
export function parseTxtFile(
  content: string,
  filename?: string
): ParsedTxtDocument {
  const chapters = detectChapters(content);
  const html = txtToHtml(chapters);
  const title = extractTitle(filename || '', content);

  return {
    title,
    chapters,
    totalCharacters: content.length,
    html,
  };
}

/**
 * Parse TXT file from ArrayBuffer
 */
export async function parseTxtFromBuffer(
  buffer: ArrayBuffer,
  filename?: string,
  encoding?: string
): Promise<ParsedTxtDocument> {
  const content = decodeText(buffer, encoding);
  return parseTxtFile(content, filename);
}

/**
 * Parse TXT file from URL
 */
export async function parseTxtFromUrl(
  url: string,
  filename?: string,
  encoding?: string
): Promise<ParsedTxtDocument> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return parseTxtFromBuffer(buffer, filename || url.split('/').pop(), encoding);
}

/**
 * Generate full HTML document with styles for TXT content
 */
export function generateFullHtml(document: ParsedTxtDocument): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(document.title)}</title>
  <style>
    :root {
      --text-color: #333;
      --bg-color: #fff;
      --heading-color: #222;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --text-color: #e0e0e0;
        --bg-color: #1a1a1a;
        --heading-color: #f0f0f0;
      }
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.8;
      color: var(--text-color);
      background-color: var(--bg-color);
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .chapter {
      margin-bottom: 40px;
    }

    .chapter-title {
      font-size: 1.5em;
      color: var(--heading-color);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }

    .chapter-content p {
      text-indent: 2em;
      margin: 0.8em 0;
    }
  </style>
</head>
<body>
  <article>
    ${document.html}
  </article>
</body>
</html>
  `;
}
