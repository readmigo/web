export interface Quote {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  source?: string;
  sourceType?: string;
  bookId?: string;
  bookTitle?: string;
  chapterId?: string;
  tags: string[];
  likeCount: number;
  shareCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface QuoteTag {
  name: string;
  count: number;
}

export interface QuotesResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
