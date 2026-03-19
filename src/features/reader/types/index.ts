export interface ReaderSettings {
  fontSize: number;
  fontFamily:
    | 'system-ui'
    | 'Inter'
    | 'Helvetica Neue'
    | 'Georgia'
    | 'Times New Roman'
    | 'Palatino'
    | 'JetBrains Mono'
    | 'Consolas'
    | 'Courier New'
    | 'OpenDyslexic'
    | 'Noto Serif SC'
    | 'LXGW WenKai';
  lineHeight: number;
  theme: 'light' | 'sepia' | 'dark' | 'ultraDark';
  marginSize: 'small' | 'medium' | 'large';
  letterSpacing: number;
  wordSpacing: number;
  paragraphSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  hyphenation: boolean;
  columnCount: 1 | 2 | 3;
  textIndent: number;
  fontWeight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  appearanceMode: 'light' | 'dark' | 'auto';
}

export interface ReaderPosition {
  chapterIndex: number;
  page: number;
  totalPages: number;
  percentage: number;
}

export interface Highlight {
  id: string;
  serverId?: string;
  userBookId: string;
  chapterId?: string;
  cfiRange: string;
  selectedText: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  style: 'underline' | 'wavy' | 'background' | 'bold_line';
  note?: string;
  isPublic?: boolean;
  startOffset?: number;
  endOffset?: number;
  paragraphIndex?: number;
  charOffset?: number;
  charLength?: number;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface Bookmark {
  id: string;
  serverId?: string;
  userBookId: string;
  cfi: string;
  title: string;
  scrollPosition?: number;
  pageNumber?: number;
  excerpt?: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface SelectedText {
  text: string;
  cfiRange?: string;
  rect: DOMRect;
  source?: 'selection' | 'paragraph';
  chapterId?: string;
  paragraphIndex?: number;
  charOffset?: number;
  charLength?: number;
  startOffset?: number;
  endOffset?: number;
}

export interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  examples: string[];
  translation?: string;
}

export type AIExplanationType = 'word' | 'sentence' | 'paragraph' | 'grammar';

export interface AIExplanation {
  type: AIExplanationType;
  content: string;
  translation?: string;
  grammar?: string;
  vocabulary?: WordDefinition[];
  examples?: string[];
}

export interface BilingualParagraph {
  order: number;
  en: {
    raw: string;
  };
  zh: string;
}

export interface BilingualChapter {
  order: number;
  paragraphs: BilingualParagraph[];
}
