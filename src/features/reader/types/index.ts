export interface ReaderSettings {
  fontSize: number;
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  lineHeight: number;
  theme: 'light' | 'sepia' | 'dark';
  marginSize: 'small' | 'medium' | 'large';
}

export interface ReaderPosition {
  chapterIndex: number;
  page: number;
  percentage: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  cfiRange: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  note?: string;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  bookId: string;
  cfi: string;
  title: string;
  createdAt: Date;
}

export interface SelectedText {
  text: string;
  cfiRange?: string;
  rect: DOMRect;
  source?: 'selection' | 'paragraph';
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
