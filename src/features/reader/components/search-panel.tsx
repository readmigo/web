'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { useBookSearch, type SearchResult, type SearchMatch } from '../hooks/use-book-search';
import { cn } from '@/lib/utils';

interface SearchPanelProps {
  bookId: string;
  onNavigateToChapter?: (chapterId: string, position?: number) => void;
}

export function SearchPanel({ bookId, onNavigateToChapter }: SearchPanelProps) {
  const [open, setOpen] = useState(false);
  const {
    query,
    setQuery,
    results,
    totalMatches,
    matchingChapters,
    currentPage,
    totalPages,
    isLoading,
    error,
    search,
    loadMore,
    clearResults,
  } = useBookSearch({ bookId });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      search();
    },
    [search]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    },
    [search]
  );

  const handleResultClick = useCallback(
    (result: SearchResult, match?: SearchMatch) => {
      onNavigateToChapter?.(result.chapterId, match?.position);
      setOpen(false);
    },
    [onNavigateToChapter]
  );

  // Clear results when panel closes
  useEffect(() => {
    if (!open) {
      // Delay clearing to allow for animation
      const timer = setTimeout(clearResults, 300);
      return () => clearTimeout(timer);
    }
  }, [open, clearResults]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Search in book">
          <Search className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Search in Book</SheetTitle>
        </SheetHeader>

        {/* Search Input */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter search term..."
                className="pl-9 pr-8"
                autoFocus
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setQuery('');
                    clearResults();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>

          {/* Results Summary */}
          {totalMatches > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              Found {totalMatches} match{totalMatches !== 1 ? 'es' : ''} in{' '}
              {matchingChapters} chapter{matchingChapters !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          {error && (
            <div className="p-4 text-sm text-destructive">{error}</div>
          )}

          {!isLoading && results.length === 0 && query && !error && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}

          <div className="divide-y">
            {results.map((result) => (
              <SearchResultItem
                key={result.chapterId}
                result={result}
                searchQuery={query}
                onClick={handleResultClick}
              />
            ))}
          </div>

          {/* Load More */}
          {currentPage < totalPages && (
            <div className="p-4 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  searchQuery: string;
  onClick: (result: SearchResult, match?: SearchMatch) => void;
}

function SearchResultItem({
  result,
  searchQuery,
  onClick,
}: SearchResultItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Show first 3 matches by default, all when expanded
  const visibleMatches = expanded
    ? result.matches
    : result.matches.slice(0, 3);
  const hasMore = result.matches.length > 3;

  return (
    <div className="p-4">
      {/* Chapter Header */}
      <button
        className="w-full text-left mb-2"
        onClick={() => onClick(result)}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            Chapter {result.chapterOrder + 1}: {result.chapterTitle}
          </span>
          <span className="text-xs text-muted-foreground">
            {result.matchCount} match{result.matchCount !== 1 ? 'es' : ''}
          </span>
        </div>
      </button>

      {/* Matches */}
      <div className="space-y-2 ml-2 border-l-2 border-muted pl-3">
        {visibleMatches.map((match, idx) => (
          <button
            key={idx}
            className="w-full text-left text-sm hover:bg-muted/50 rounded p-2 -ml-2 transition-colors"
            onClick={() => onClick(result, match)}
          >
            <HighlightedText
              beforeContext={match.beforeContext}
              matchedText={match.matchedText}
              afterContext={match.afterContext}
            />
          </button>
        ))}

        {/* Show More/Less */}
        {hasMore && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded
              ? 'Show less'
              : `Show ${result.matches.length - 3} more...`}
          </button>
        )}
      </div>
    </div>
  );
}

interface HighlightedTextProps {
  beforeContext: string;
  matchedText: string;
  afterContext: string;
}

function HighlightedText({
  beforeContext,
  matchedText,
  afterContext,
}: HighlightedTextProps) {
  return (
    <span className="text-muted-foreground">
      {beforeContext}
      <mark className="bg-yellow-200 dark:bg-yellow-800 text-foreground px-0.5 rounded">
        {matchedText}
      </mark>
      {afterContext}
    </span>
  );
}
