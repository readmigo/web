'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFavoriteBookIds, useToggleFavorite } from '../hooks/use-favorites';
import type { Book, BookListBook } from '../types';

interface CompactBookCardProps {
  book: Book | BookListBook;
  rank?: number;
  className?: string;
}

const difficultyLabels = [
  '',
  'Beginner',
  'Elementary',
  'Intermediate',
  'Advanced',
  'Expert',
];
const difficultyColors = [
  '',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
];

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k words`;
  }
  return `${count} words`;
}

export function CompactBookCard({ book, rank, className }: CompactBookCardProps) {
  const { favoriteIds, isAuthenticated } = useFavoriteBookIds();
  const { toggleFavorite } = useToggleFavorite();
  const isFavorited = favoriteIds.has(book.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleFavorite(book.id, isFavorited);
  };

  return (
    <Link
      href={`/book/${book.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50',
        className
      )}
    >
      {/* Optional rank number */}
      {rank !== undefined && (
        <span
          className={cn(
            'flex-shrink-0 text-lg font-bold tabular-nums',
            rank <= 3 ? 'text-amber-500' : 'text-muted-foreground'
          )}
        >
          {rank}
        </span>
      )}

      {/* Small cover */}
      <div className="relative h-[90px] w-[60px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="60px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-lg text-muted-foreground/40">
              {book.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="line-clamp-1 text-sm font-medium leading-tight">
          {book.title}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.author}
        </p>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {'wordCount' in book && book.wordCount && book.wordCount > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {formatWordCount(book.wordCount)}
            </span>
          )}
          {(('goodreadsRating' in book && book.goodreadsRating) || ('doubanRating' in book && book.doubanRating)) && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {(('goodreadsRating' in book ? book.goodreadsRating : undefined) || ('doubanRating' in book ? book.doubanRating : undefined))?.toFixed(1)}
            </span>
          )}
          {book.difficulty && (
            <Badge
              className={cn(
                'px-1.5 py-0 text-[10px] text-white',
                difficultyColors[book.difficulty]
              )}
            >
              {difficultyLabels[book.difficulty]}
            </Badge>
          )}
        </div>
      </div>

      {/* Favorite button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-muted',
            'opacity-0 group-hover:opacity-100',
            isFavorited && 'opacity-100'
          )}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'h-3.5 w-3.5 transition-colors',
              isFavorited
                ? 'fill-red-500 text-red-500'
                : 'text-muted-foreground'
            )}
          />
        </button>
      )}
    </Link>
  );
}
