'use client';

import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, User, Quote, Search } from 'lucide-react';
import type { SearchResponse } from '../types';

interface SearchResultsDropdownProps {
  data: SearchResponse | undefined;
  isLoading: boolean;
  query: string;
  onSelect: () => void;
}

export function SearchResultsDropdown({
  data,
  isLoading,
  query,
  onSelect,
}: SearchResultsDropdownProps) {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    onSelect();
    router.push(href);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
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
      </div>
    );
  }

  // No data yet
  if (!data) return null;

  const { authors, books, quotes } = data;
  const hasResults =
    authors.items.length > 0 ||
    books.items.length > 0 ||
    quotes.items.length > 0;

  // Empty state
  if (!hasResults) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 opacity-50" />
          <p className="mt-2 text-sm">
            未找到 &ldquo;{query}&rdquo; 的相关结果
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
      <ScrollArea className="max-h-[400px]">
        <div className="p-2">
          {/* Authors section */}
          {authors.items.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3 w-3" />
                <span>作者</span>
                <span>({authors.total})</span>
              </div>
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
              {authors.items.length > 0 && (
                <div className="mx-2 my-1 border-t" />
              )}
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>书籍</span>
                <span>({books.total})</span>
              </div>
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
                <div className="mx-2 my-1 border-t" />
              )}
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <Quote className="h-3 w-3" />
                <span>名言</span>
                <span>({quotes.total})</span>
              </div>
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
      </ScrollArea>
    </div>
  );
}
