'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  User,
  Quote,
  Search,
  Clock,
  X,
  TrendingUp,
  Flame,
  Sparkles,
} from 'lucide-react';
import type { SearchResponse, SearchSuggestion, PopularSearch } from '../types';

interface SearchResultsDropdownProps {
  data: SearchResponse | undefined;
  isLoading: boolean;
  query: string;
  onSelect: () => void;
  onSelectQuery?: (query: string) => void;
  searchHistory?: string[];
  onRemoveHistory?: (query: string) => void;
  onClearHistory?: () => void;
  suggestions?: SearchSuggestion[];
  suggestionsLoading?: boolean;
  popularSearches?: PopularSearch[];
  trendingSearches?: PopularSearch[];
}

function DropdownWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
      <ScrollArea className="max-h-[400px]">{children}</ScrollArea>
    </div>
  );
}

function SectionHeader({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {action}
    </div>
  );
}

function SectionDivider() {
  return <div className="mx-2 my-1 border-t" />;
}

function SuggestionIcon({ type }: { type: SearchSuggestion['type'] }) {
  switch (type) {
    case 'author':
      return <User className="h-4 w-4 shrink-0 text-purple-500" />;
    case 'book':
      return <BookOpen className="h-4 w-4 shrink-0 text-blue-500" />;
    case 'popular':
      return <TrendingUp className="h-4 w-4 shrink-0 text-orange-500" />;
  }
}

export function SearchResultsDropdown({
  data,
  isLoading,
  query,
  onSelect,
  onSelectQuery,
  searchHistory,
  onRemoveHistory,
  onClearHistory,
  suggestions,
  suggestionsLoading,
  popularSearches,
  trendingSearches,
}: SearchResultsDropdownProps) {
  const t = useTranslations('search');
  const router = useRouter();

  const handleNavigate = (href: string) => {
    onSelect();
    router.push(href);
  };

  const handleSelectQuery = (term: string) => {
    onSelectQuery?.(term);
  };

  const trimmedQuery = query.trim();

  // ──────────────────────────────────────────
  // State A: Empty query — show history + popular + trending
  // ──────────────────────────────────────────
  if (trimmedQuery.length < 2) {
    const hasHistory = searchHistory && searchHistory.length > 0;
    const hasPopular = popularSearches && popularSearches.length > 0;
    const hasTrending = trendingSearches && trendingSearches.length > 0;

    if (!hasHistory && !hasPopular && !hasTrending) {
      return null;
    }

    return (
      <DropdownWrapper>
        <div className="p-2">
          {hasHistory && (
            <div>
              <SectionHeader
                icon={<Clock className="h-3 w-3" />}
                label={t('recentSearches')}
                action={
                  onClearHistory && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearHistory();
                      }}
                    >
                      {t('clearAll')}
                    </button>
                  )
                }
              />
              {searchHistory.map((term) => (
                <button
                  key={term}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent group"
                  onClick={() => handleSelectQuery(term)}
                >
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{term}</span>
                  {onRemoveHistory && (
                    <button
                      className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveHistory(term);
                      }}
                      aria-label={t('deleteSearchTerm', { term })}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}

          {hasTrending && (
            <div>
              {hasHistory && <SectionDivider />}
              <SectionHeader
                icon={<Flame className="h-3 w-3" />}
                label={t('trendingSearches')}
              />
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {trendingSearches.map((item) => (
                  <button
                    key={item.term}
                    className="rounded-full bg-secondary px-3 py-1 text-xs transition-colors hover:bg-secondary/80"
                    onClick={() => handleSelectQuery(item.term)}
                  >
                    {item.term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasPopular && (
            <div>
              {(hasHistory || hasTrending) && <SectionDivider />}
              <SectionHeader
                icon={<Sparkles className="h-3 w-3" />}
                label={t('popularSearches')}
              />
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {popularSearches.map((item) => (
                  <button
                    key={item.term}
                    className="rounded-full bg-secondary px-3 py-1 text-xs transition-colors hover:bg-secondary/80"
                    onClick={() => handleSelectQuery(item.term)}
                  >
                    {item.term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DropdownWrapper>
    );
  }

  // ──────────────────────────────────────────
  // State B: Typing (≥2 chars) — show suggestions if available
  // ──────────────────────────────────────────
  if (suggestions && suggestions.length > 0) {
    return (
      <DropdownWrapper>
        <div className="p-2">
          <SectionHeader
            icon={<Search className="h-3 w-3" />}
            label={t('suggestions')}
          />
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
              onClick={() => handleSelectQuery(suggestion.text)}
            >
              <SuggestionIcon type={suggestion.type} />
              <span className="flex-1 truncate text-sm">{suggestion.text}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{suggestion.type}</span>
            </button>
          ))}
        </div>
      </DropdownWrapper>
    );
  }

  // ──────────────────────────────────────────
  // State C: Loading (suggestions or results)
  // ──────────────────────────────────────────
  if (isLoading || suggestionsLoading) {
    return (
      <DropdownWrapper>
        <div className="p-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </DropdownWrapper>
    );
  }

  if (!data) return null;

  // ──────────────────────────────────────────
  // State D: Results loaded — authors, books, quotes
  // ──────────────────────────────────────────
  const authors = data.authors ?? { items: [], total: 0, hasMore: false };
  const books = data.books ?? { items: [], total: 0, hasMore: false };
  const quotes = data.quotes ?? { items: [], total: 0, hasMore: false };
  const authorItems = authors.items ?? [];
  const bookItems = books.items ?? [];
  const quoteItems = quotes.items ?? [];
  const hasResults =
    authorItems.length > 0 ||
    bookItems.length > 0 ||
    quoteItems.length > 0;

  if (!hasResults) {
    return (
      <DropdownWrapper>
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 opacity-50" />
          <p className="mt-2 text-sm">
            {t('noResults', { query })}
          </p>
        </div>
      </DropdownWrapper>
    );
  }

  return (
    <DropdownWrapper>
      <div className="p-2">
        {authorItems.length > 0 && (
          <div>
            <SectionHeader
              icon={<User className="h-3 w-3" />}
              label={t('authors', { count: authors.total })}
            />
            {authorItems.map((author) => (
              <button
                key={author.id}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                onClick={() => handleNavigate(`/author/${author.id}`)}
              >
                {author.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {author.name}
                  </p>
                  {author.nameZh && (
                    <p className="truncate text-xs text-muted-foreground">
                      {author.nameZh}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('booksCount', { count: author.bookCount })}
                </span>
              </button>
            ))}
          </div>
        )}

        {bookItems.length > 0 && (
          <div>
            {authorItems.length > 0 && <SectionDivider />}
            <SectionHeader
              icon={<BookOpen className="h-3 w-3" />}
              label={t('books', { count: books.total })}
            />
            {bookItems.map((book) => (
              <button
                key={book.id}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                onClick={() => handleNavigate(`/book/${book.id}`)}
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-10 w-7 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-7 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {book.author}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {quoteItems.length > 0 && (
          <div>
            {(authorItems.length > 0 || bookItems.length > 0) && (
              <SectionDivider />
            )}
            <SectionHeader
              icon={<Quote className="h-3 w-3" />}
              label={t('quotes', { count: quotes.total })}
            />
            {quoteItems.map((quote) => (
              <button
                key={quote.id}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                onClick={() =>
                  quote.authorId
                    ? handleNavigate(`/author/${quote.authorId}`)
                    : undefined
                }
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                  <Quote className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="line-clamp-2 text-sm italic">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {quote.authorName}
                    {quote.source && ` -- ${quote.source}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DropdownWrapper>
  );
}
