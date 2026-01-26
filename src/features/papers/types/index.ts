export interface Paper {
  id: string;
  title: string;
  authors: string | null;
  abstract: string | null;
  pageCount: number | null;
  pdfUrl: string;
  fileSize: number | null;
  fileName: string | null;
  status: 'UPLOADING' | 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface PaperHighlight {
  id: string;
  paperId: string;
  pageNumber: number;
  text: string;
  color: string;
  rects: { x: number; y: number; width: number; height: number }[] | null;
  createdAt: string;
}

export interface PaperAnnotation {
  id: string;
  paperId: string;
  pageNumber: number;
  content: string;
  highlightId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SortOption = 'recent' | 'title' | 'size';
export type ViewMode = 'grid' | 'list';
