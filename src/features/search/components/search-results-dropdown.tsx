'use client';

import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  User,
  Quote,
  Search,
  Clock,
  Flame,
  Sparkles,
  X,
} from 'lucide-react';
import type { SearchResponse, SearchSuggestion, PopularSearch } from '../types';

interface SearchResultsDropdownProps {
  /** Search results data (from useSearch) */
  data: SearchResponse | undefined;
  /** Whether search results are loading */
  isLoading: boolean;
  /** Current search query */
  query: string;
  /** Called when user selects a result (navigates away) */
  onSelect: () => void;
  /** Called when user clicks a suggestion/history/popular item to fill the input */
  onSelectQuery?: (query: string) => void;
  /** Autocomplete suggestions */
  suggestions?: SearchSuggestion[];
  suggestionsLoading?: boolean;
  /** Search history */
  searchHistory?: string[];
  onRemoveHistory?: (query: string) => void;
  onClearHistory?: () => void;
  /** Popular & trending searches */
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

export function SearchResultsDropdown({
  data,
  isLoading,
  query,
  onSelect,
  onSelectQuery,
  suggestions,
  suggestionsLoading,
  searchHistory,
  onRemoveHistory,
  onClearHistory,
  popularSearches,
  trendingSearches,
}: SearchResultsDropdownProps) {
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
  // State A: Empty query — show history, popular, trending
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
          {/* Recent Searches */}
          {hasHistory && (
            <div>
              <SectionHeader
                icon={<Clock className="h-3 w-3" />}
                label="最近搜索"
                action={
                  onClearHistory && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearHistory();
                      }}
                    >
                      清除全部
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
                      aria-label={`删除搜索记录: ${term}`}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {hasPopular && (
            <div>
              {hasHistory && <SectionDivider />}
              <SectionHeader
                icon={<Flame className="h-3 w-3" />}
                label="热门搜索"
              />
              {popularSearches.map((item) => (
                <button
                  key={item.term}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                  onClick={() => handleSelectQuery(item.term)}
                >
                  <Flame className="h-4 w-4 shrink-0 text-orange-500" />
                  <span className="flex-1 truncate text-sm">{item.term}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Trending Today */}
          {hasTrending && (
            <div>
              {(hasHistory || hasPopular) && <SectionDivider />}
              <SectionHeader
                icon={<Sparkles className="h-3 w-3" />}
                label="今日趋势"
              />
              {trendingSearches.map((item) => (
                <button
                  key={item.term}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                  onClick={() => handleSelectQuery(item.term)}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
                  <span className="flex-1 truncate text-sm">{item.term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownWrapper>
    );
  }

  // ──────────────────────────────────────────
  // State B: Typing (2+ chars), show suggestions if no results yet
  // ──────────────────────────────────────────
  if (suggestionsLoading) {
    return (
      <DropdownWrapper>
        <div className="p-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </DropdownWrapper>
    );
  }

  // Show suggestions when we have them and search results haven't loaded yet
  if (suggestions && suggestions.length > 0 && !data && !isLoading) {
    return (
      <DropdownWrapper>
        <div className="p-2">
          <SectionHeader
            icon={<Search className="h-3 w-3" />}
            label="搜索建议"
          />
          {suggestions.map((suggestion, idx) => {
            const SuggestionIcon =
              suggestion.type === 'author'
                ? User
                : suggestion.type === 'book'
                  ? BookOpen
                  : Quote;

            return (
              <button
                key={`${suggestion.text}-${idx}`}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                onClick={() => handleSelectQuery(suggestion.text)}
              >
                <SuggestionIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">
                  {suggestion.text}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground capitalize">
                  {suggestion.type === 'author'
                    ? '作者'
                    : suggestion.type === 'book'
                      ? '书籍'
                      : '名言'}
                </span>
              </button>
            );
          })}
        </div>
      </DropdownWrapper>
    );
  }

  // ──────────────────────────────────────────
  // State C: Results loading
  // ──────────────────────────────────────────
  if (isLoading) {
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

  // No data yet (but not loading and no suggestions)
  if (!data) return null;

  // ──────────────────────────────────────────
  // State C: Results loaded — authors, books, quotes
  // ──────────────────────────────────────────
  const { authors, books, quotes } = data;
  const hasResults =
    authors.items.length > 0 ||
    books.items.length > 0 ||
    quotes.items.length > 0;

  // Empty state
  if (!hasResults) {
    return (
      <DropdownWrapper>
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 opacity-50" />
          <p className="mt-2 text-sm">
            未找到 &ldquo;{query}&rdquo; 的相关结果
          </p>
        </div>
      </DropdownWrapper>
    );
  }

  return (
    <DropdownWrapper>
      <div className="p-2">
        {/* Authors section */}
        {authors.items.length > 0 && (
          <div>
            <SectionHeader
              icon={<User className="h-3 w-3" />}
              label={`作者 (${authors.total})`}
            />
            {authors.items.map((author) => (
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
                  {author.bookCount} 本书
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Books section */}
        {books.items.length > 0 && (
          <div>
            {authors.items.length > 0 && <SectionDivider />}
            <SectionHeader
              icon={<BookOpen className="h-3 w-3" />}
              label={`书籍 (${books.total})`}
            />
            {books.items.map((book) => (
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

        {/* Quotes section */}
        {quotes.items.length > 0 && (
          <div>
            {(authors.items.length > 0 || books.items.length > 0) && (
              <SectionDivider />
            )}
            <SectionHeader
              icon={<Quote className="h-3 w-3" />}
              label={`名言 (${quotes.total})`}
            />
            {quotes.items.map((quote) => (
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
