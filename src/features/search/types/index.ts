// Search feature types

export interface SearchAuthorItem {
  id: string;
  name: string;
  nameZh?: string;
  avatarUrl?: string;
  bookCount: number;
}

export interface SearchBookItem {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  coverUrl?: string;
  difficulty?: number;
}

export interface SearchQuoteItem {
  id: string;
  text: string;
  source?: string;
  authorName?: string;
  authorId?: string;
}

export interface SearchResultSection<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface SearchResponse {
  query: string;
  authors: SearchResultSection<SearchAuthorItem>;
  books: SearchResultSection<SearchBookItem>;
  quotes: SearchResultSection<SearchQuoteItem>;
}

export interface SearchSuggestion {
  text: string;
  type: 'author' | 'book' | 'quote';
}

export interface PopularSearch {
  term: string;
  count: number;
}
