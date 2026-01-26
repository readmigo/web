export interface Book {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorZh?: string;
  coverUrl: string;
  description: string;
  language: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: string;
  wordCount: number;
  publishYear?: number;
  source: 'gutenberg' | 'standard-ebooks' | 'user-upload';
}

export interface BookDetail extends Book {
  epubUrl: string;
  chapters: Chapter[];
  aiScore?: number;
  estimatedReadTime: number;
  tags: string[];
}

export interface Chapter {
  id: string;
  title: string;
  href: string;
  order: number;
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

export type SortOption = 'recent' | 'title' | 'author' | 'progress';
export type FilterOption = 'all' | 'reading' | 'finished' | 'want-to-read';
export type ViewMode = 'grid' | 'list';
