export interface Book {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorZh?: string;
  coverUrl: string;
  description: string;
  language: string;
  difficulty?: number;
  difficultyScore?: number;
  category: string;
  wordCount: number;
  publishYear?: number;
  source?: string;
  goodreadsRating?: number;
  doubanRating?: number;
  genres?: string[];
}

export interface BookDetail extends Book {
  epubUrl: string;
  chapters: Chapter[];
  aiScore?: number;
  estimatedReadTime: number;
  tags: string[];
  hasAudiobook?: boolean;
  audiobookId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  href: string;
  order: number;
  wordCount?: number;
}

export interface UserBook {
  id: string;
  bookId: string;
  book: Book;
  addedAt: Date;
  lastReadAt?: Date;
  progress: number;
  currentCfi?: string;
  status: 'reading' | 'finished' | 'want-to-read';
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startTime: Date;
  endTime: Date;
  pagesRead: number;
  wordsRead: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  bookCount: number;
  children: Category[];
}

export interface ReadingGuide {
  id: string;
  bookId: string;
  sourceType: 'AI_GENERATED' | 'MANUAL';
  aiModel?: string;
  generatedAt?: string;
  readingWarnings?: string;
  storyTimeline?: string;
  quickStartGuide?: string;
  locale?: string;
}

export interface BookContext {
  id: string;
  bookId: string;
  sourceType: 'WIKIPEDIA' | 'STANDARD_EBOOKS' | 'OPEN_LIBRARY' | 'WIKIDATA' | 'MANUAL';
  sourceUrl?: string;
  summary?: string;
  creationBackground?: string;
  historicalContext?: string;
  themes?: string;
  literaryStyle?: string;
  license?: string;
  fetchedAt?: string;
  locale?: string;
}

export type SortOption = 'recent' | 'title' | 'author' | 'progress';
export type FilterOption = 'all' | 'reading' | 'finished' | 'want-to-read';
export type ViewMode = 'grid' | 'list';

export type BookListType =
  | 'RANKING'
  | 'EDITORS_PICK'
  | 'COLLECTION'
  | 'UNIVERSITY'
  | 'CELEBRITY'
  | 'ANNUAL_BEST'
  | 'AI_RECOMMENDED'
  | 'PERSONALIZED'
  | 'AI_FEATURED';

export interface BookListBook {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  description?: string;
  coverUrl?: string;
  coverThumbUrl?: string;
  difficultyScore?: number;
  wordCount?: number;
  genres?: string[];
  doubanRating?: number;
  goodreadsRating?: number;
  rank?: number;
  customDescription?: string;
  difficulty?: number;
}

export interface BookList {
  id: string;
  name: string;
  nameEn?: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  type: BookListType;
  displayStyle?: string;
  bookCount: number;
  sortOrder?: number;
  isActive?: boolean;
  showRank?: boolean;
  showDescription?: boolean;
  maxDisplayCount?: number;
  isAiGenerated?: boolean;
  books?: BookListBook[];
  createdAt?: string;
  updatedAt?: string;
}
