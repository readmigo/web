/**
 * MOBI file parser with support for PalmDOC compression
 * Supports MOBI/PRC/AZW formats
 */

export interface MobiMetadata {
  title: string;
  author: string;
  publisher: string;
  language: string;
  isbn: string;
  description: string;
}

export interface ParsedMobiChapter {
  id: string;
  title: string;
  content: string;
  html: string;
}

export interface ParsedMobiDocument {
  metadata: MobiMetadata;
  chapters: ParsedMobiChapter[];
  html: string;
  css: string;
  images: Map<string, Blob>;
}

// PalmDOC header constants
const PALMDOC_COMPRESSION_NONE = 1;
const PALMDOC_COMPRESSION_PALMDOC = 2;
const PALMDOC_COMPRESSION_HUFFCDIC = 17480;

// MOBI header type constants
const MOBI_TYPE_MOBIPOCKET = 2;
const MOBI_TYPE_PALMDOC = 3;
const MOBI_TYPE_AUDIO = 4;
const MOBI_TYPE_NEWS = 257;
const MOBI_TYPE_NEWS_FEED = 258;
const MOBI_TYPE_NEWS_MAGAZINE = 259;

/**
 * Parse MOBI file from ArrayBuffer
 */
export async function parseMobiFile(buffer: ArrayBuffer): Promise<ParsedMobiDocument> {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');

  // Parse Palm Database header (78 bytes)
  const palmHeader = parsePalmHeader(view, decoder);

  // Parse record offsets
  const recordOffsets: number[] = [];
  for (let i = 0; i < palmHeader.numRecords; i++) {
    const offset = view.getUint32(78 + (i * 8));
    recordOffsets.push(offset);
  }

  // First record contains PalmDOC header
  const record0Offset = recordOffsets[0];
  const palmDocHeader = parsePalmDocHeader(view, record0Offset);

  // Parse MOBI header (if present)
  const mobiHeader = parseMobiHeader(view, record0Offset + 16);

  // Extract text content
  const textContent = extractTextContent(
    buffer,
    recordOffsets,
    palmDocHeader,
    mobiHeader
  );

  // Parse HTML content
  const { chapters, html, css } = parseHtmlContent(textContent, palmHeader.name);

  // Extract images (if present)
  const images = extractImages(buffer, recordOffsets, mobiHeader);

  return {
    metadata: {
      title: mobiHeader.fullTitle || palmHeader.name,
      author: mobiHeader.author || 'Unknown',
      publisher: mobiHeader.publisher || '',
      language: mobiHeader.language || 'en',
      isbn: mobiHeader.isbn || '',
      description: mobiHeader.description || '',
    },
    chapters,
    html,
    css,
    images,
  };
}

interface PalmHeader {
  name: string;
  attributes: number;
  version: number;
  creationDate: number;
  modificationDate: number;
  numRecords: number;
}

function parsePalmHeader(view: DataView, decoder: TextDecoder): PalmHeader {
  // Name is 32 bytes at offset 0
  const nameBytes = new Uint8Array(view.buffer, 0, 32);
  const nullIndex = nameBytes.indexOf(0);
  const name = decoder.decode(nameBytes.slice(0, nullIndex > 0 ? nullIndex : 32));

  return {
    name,
    attributes: view.getUint16(32),
    version: view.getUint16(34),
    creationDate: view.getUint32(36),
    modificationDate: view.getUint32(40),
    numRecords: view.getUint16(76),
  };
}

interface PalmDocHeader {
  compression: number;
  textLength: number;
  recordCount: number;
  recordSize: number;
  encryptionType: number;
}

function parsePalmDocHeader(view: DataView, offset: number): PalmDocHeader {
  return {
    compression: view.getUint16(offset),
    textLength: view.getUint32(offset + 4),
    recordCount: view.getUint16(offset + 8),
    recordSize: view.getUint16(offset + 10),
    encryptionType: view.getUint16(offset + 12),
  };
}

interface MobiHeader {
  identifier: string;
  headerLength: number;
  mobiType: number;
  textEncoding: number;
  firstImageRecord: number;
  fullTitle: string;
  author: string;
  publisher: string;
  language: string;
  isbn: string;
  description: string;
  exthFlags: number;
}

function parseMobiHeader(view: DataView, offset: number): MobiHeader {
  const decoder = new TextDecoder('utf-8');

  // Check for MOBI identifier
  const identBytes = new Uint8Array(view.buffer, offset, 4);
  const identifier = decoder.decode(identBytes);

  if (identifier !== 'MOBI') {
    // No MOBI header, return defaults
    return {
      identifier: '',
      headerLength: 0,
      mobiType: 0,
      textEncoding: 65001, // UTF-8
      firstImageRecord: 0,
      fullTitle: '',
      author: '',
      publisher: '',
      language: 'en',
      isbn: '',
      description: '',
      exthFlags: 0,
    };
  }

  const headerLength = view.getUint32(offset + 4);
  const mobiType = view.getUint32(offset + 8);
  const textEncoding = view.getUint32(offset + 12);
  const firstImageRecord = view.getUint32(offset + 108);
  const exthFlags = view.getUint32(offset + 128);

  // Get full title
  const fullNameOffset = view.getUint32(offset + 84);
  const fullNameLength = view.getUint32(offset + 88);
  let fullTitle = '';

  if (fullNameOffset > 0 && fullNameLength > 0) {
    const titleBytes = new Uint8Array(view.buffer, offset - 16 + fullNameOffset, fullNameLength);
    fullTitle = decoder.decode(titleBytes);
  }

  // Parse EXTH header if present
  let author = '';
  let publisher = '';
  let description = '';
  let isbn = '';
  let language = 'en';

  if (exthFlags & 0x40) {
    const exthOffset = offset + headerLength;
    const exthData = parseExthHeader(view, exthOffset, decoder);
    author = exthData.author;
    publisher = exthData.publisher;
    description = exthData.description;
    isbn = exthData.isbn;
    language = exthData.language || 'en';
  }

  return {
    identifier,
    headerLength,
    mobiType,
    textEncoding,
    firstImageRecord,
    fullTitle,
    author,
    publisher,
    language,
    isbn,
    description,
    exthFlags,
  };
}

interface ExthData {
  author: string;
  publisher: string;
  description: string;
  isbn: string;
  language: string;
}

function parseExthHeader(view: DataView, offset: number, decoder: TextDecoder): ExthData {
  const result: ExthData = {
    author: '',
    publisher: '',
    description: '',
    isbn: '',
    language: '',
  };

  try {
    // Check for EXTH identifier
    const identBytes = new Uint8Array(view.buffer, offset, 4);
    const identifier = decoder.decode(identBytes);

    if (identifier !== 'EXTH') {
      return result;
    }

    const recordCount = view.getUint32(offset + 8);
    let recordOffset = offset + 12;

    for (let i = 0; i < recordCount; i++) {
      const recordType = view.getUint32(recordOffset);
      const recordLength = view.getUint32(recordOffset + 4);
      const dataLength = recordLength - 8;

      if (dataLength > 0) {
        const dataBytes = new Uint8Array(view.buffer, recordOffset + 8, dataLength);
        const data = decoder.decode(dataBytes);

        switch (recordType) {
          case 100: // Author
            result.author = data;
            break;
          case 101: // Publisher
            result.publisher = data;
            break;
          case 103: // Description
            result.description = data;
            break;
          case 104: // ISBN
            result.isbn = data;
            break;
          case 524: // Language
            result.language = data;
            break;
        }
      }

      recordOffset += recordLength;
    }
  } catch {
    // Ignore EXTH parsing errors
  }

  return result;
}

function extractTextContent(
  buffer: ArrayBuffer,
  recordOffsets: number[],
  palmDocHeader: PalmDocHeader,
  mobiHeader: MobiHeader
): string {
  const textRecords: Uint8Array[] = [];
  const startRecord = 1;
  const endRecord = Math.min(palmDocHeader.recordCount + 1, recordOffsets.length - 1);

  for (let i = startRecord; i <= endRecord; i++) {
    const recordStart = recordOffsets[i];
    const recordEnd = i < recordOffsets.length - 1 ? recordOffsets[i + 1] : buffer.byteLength;
    const recordData = new Uint8Array(buffer, recordStart, recordEnd - recordStart);

    let decompressed: Uint8Array;

    switch (palmDocHeader.compression) {
      case PALMDOC_COMPRESSION_NONE:
        decompressed = recordData;
        break;
      case PALMDOC_COMPRESSION_PALMDOC:
        decompressed = decompressPalmDoc(recordData);
        break;
      case PALMDOC_COMPRESSION_HUFFCDIC:
        // HUFFCDIC compression is complex, fallback to raw data
        decompressed = recordData;
        break;
      default:
        decompressed = recordData;
    }

    textRecords.push(decompressed);
  }

  // Combine all records
  const totalLength = textRecords.reduce((sum, r) => sum + r.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const record of textRecords) {
    combined.set(record, offset);
    offset += record.length;
  }

  // Decode based on text encoding
  const encoding = mobiHeader.textEncoding === 1252 ? 'windows-1252' : 'utf-8';
  const decoder = new TextDecoder(encoding, { fatal: false });

  return decoder.decode(combined);
}

/**
 * PalmDOC decompression algorithm
 */
function decompressPalmDoc(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0) {
      // Literal null byte
      output.push(0);
      i++;
    } else if (byte >= 1 && byte <= 8) {
      // Literal bytes follow
      for (let j = 0; j < byte && i + 1 + j < data.length; j++) {
        output.push(data[i + 1 + j]);
      }
      i += byte + 1;
    } else if (byte >= 9 && byte <= 0x7F) {
      // Literal byte
      output.push(byte);
      i++;
    } else if (byte >= 0x80 && byte <= 0xBF) {
      // Distance-length pair (2 bytes)
      if (i + 1 >= data.length) break;

      const nextByte = data[i + 1];
      const distance = ((byte & 0x3F) << 8 | nextByte) >> 3;
      const length = (nextByte & 0x07) + 3;

      for (let j = 0; j < length; j++) {
        const srcIndex = output.length - distance;
        if (srcIndex >= 0 && srcIndex < output.length) {
          output.push(output[srcIndex]);
        }
      }
      i += 2;
    } else if (byte >= 0xC0 && byte <= 0xFF) {
      // Space + character
      output.push(0x20);
      output.push(byte ^ 0x80);
      i++;
    }
  }

  return new Uint8Array(output);
}

function parseHtmlContent(
  rawContent: string,
  fallbackTitle: string
): { chapters: ParsedMobiChapter[]; html: string; css: string } {
  // Clean up the content
  let html = rawContent;

  // Remove null bytes and control characters
  html = html.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Try to extract CSS
  let css = '';
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatch) {
    css = styleMatch.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
  }

  // Parse chapters from HTML structure
  const chapters: ParsedMobiChapter[] = [];

  // Try to find chapter markers in the HTML
  const chapterPatterns = [
    /<h[12][^>]*>([^<]+)<\/h[12]>/gi,
    /<p[^>]*class="[^"]*chapter[^"]*"[^>]*>([^<]+)<\/p>/gi,
    /filepos=(\d+)[^>]*>([^<]+)</gi,
  ];

  const chapterMarkers: { index: number; title: string }[] = [];

  for (const pattern of chapterPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const title = match[match.length - 1].trim();
      if (title && title.length < 200) {
        chapterMarkers.push({
          index: match.index,
          title: cleanHtmlText(title),
        });
      }
    }
  }

  // Sort by position and remove duplicates
  chapterMarkers.sort((a, b) => a.index - b.index);
  const uniqueMarkers = chapterMarkers.filter((marker, i) =>
    i === 0 || marker.index - chapterMarkers[i - 1].index > 100
  );

  if (uniqueMarkers.length > 0) {
    for (let i = 0; i < uniqueMarkers.length; i++) {
      const start = uniqueMarkers[i].index;
      const end = i < uniqueMarkers.length - 1 ? uniqueMarkers[i + 1].index : html.length;
      const content = html.slice(start, end);

      chapters.push({
        id: `chapter-${i}`,
        title: uniqueMarkers[i].title,
        content: cleanHtmlText(content),
        html: content,
      });
    }
  } else {
    // No chapters found, create single chapter
    chapters.push({
      id: 'chapter-0',
      title: fallbackTitle || 'Content',
      content: cleanHtmlText(html),
      html,
    });
  }

  return { chapters, html, css };
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImages(
  buffer: ArrayBuffer,
  recordOffsets: number[],
  mobiHeader: MobiHeader
): Map<string, Blob> {
  const images = new Map<string, Blob>();

  if (!mobiHeader.firstImageRecord || mobiHeader.firstImageRecord >= recordOffsets.length) {
    return images;
  }

  const imageSignatures = {
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46],
    bmp: [0x42, 0x4D],
  };

  for (let i = mobiHeader.firstImageRecord; i < recordOffsets.length - 1; i++) {
    const recordStart = recordOffsets[i];
    const recordEnd = recordOffsets[i + 1];
    const recordData = new Uint8Array(buffer, recordStart, recordEnd - recordStart);

    // Detect image type
    let mimeType = '';
    let extension = '';

    for (const [ext, signature] of Object.entries(imageSignatures)) {
      let match = true;
      for (let j = 0; j < signature.length; j++) {
        if (recordData[j] !== signature[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        extension = ext;
        mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        break;
      }
    }

    if (mimeType) {
      const imageIndex = i - mobiHeader.firstImageRecord;
      const blob = new Blob([recordData], { type: mimeType });
      images.set(`image${imageIndex}.${extension}`, blob);
    }
  }

  return images;
}

/**
 * Generate complete HTML document from parsed MOBI
 */
export function generateMobiHtml(doc: ParsedMobiDocument): string {
  const chaptersHtml = doc.chapters.map(chapter => `
    <section id="${chapter.id}" class="chapter">
      <h2 class="chapter-title">${escapeHtml(chapter.title)}</h2>
      <div class="chapter-content">
        ${chapter.html}
      </div>
    </section>
  `).join('\n');

  return `
<!DOCTYPE html>
<html lang="${doc.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.metadata.title)}</title>
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

    img {
      max-width: 100%;
      height: auto;
    }

    ${doc.css}
  </style>
</head>
<body>
  <article>
    ${chaptersHtml}
  </article>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse MOBI file from URL
 */
export async function parseMobiFromUrl(url: string): Promise<ParsedMobiDocument> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return parseMobiFile(buffer);
}

/**
 * Check if buffer is a valid MOBI file
 */
export function isMobiFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 100) {
    return false;
  }

  const view = new DataView(buffer);

  // Check for Palm Database signature at offset 60
  const type = String.fromCharCode(
    view.getUint8(60),
    view.getUint8(61),
    view.getUint8(62),
    view.getUint8(63)
  );

  const creator = String.fromCharCode(
    view.getUint8(64),
    view.getUint8(65),
    view.getUint8(66),
    view.getUint8(67)
  );

  // MOBI files have type 'BOOK' and creator 'MOBI'
  return (type === 'BOOK' && creator === 'MOBI') ||
         (type === 'TEXt' && creator === 'REAd');
}
