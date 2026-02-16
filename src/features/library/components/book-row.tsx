'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteBookIds, useToggleFavorite } from '../hooks/use-favorites';
import { getDifficultyLevel, difficultyLabels, difficultyDotColors } from '../utils/difficulty';
import type { Book } from '../types';

interface BookRowProps {
  book: Book;
  className?: string;
}

function formatWordCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  }
  return `${count}`;
}

export function BookRow({ book, className }: BookRowProps) {
  const { favoriteIds, isAuthenticated } = useFavoriteBookIds();
  const { toggleFavorite } = useToggleFavorite();
  const isFavorited = favoriteIds.has(book.id);
  const diffLevel = book.difficulty || getDifficultyLevel(book.difficultyScore);
  const rating = book.goodreadsRating || book.doubanRating;

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
        'group flex items-start gap-3 border-b py-3 transition-colors last:border-b-0 hover:bg-muted/30',
        className
      )}
    >
      {/* Cover */}
      <div className="relative h-[140px] w-[93px] flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="93px"
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
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.author}
        </p>
        {book.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {book.description}
          </p>
        )}
        {/* Metadata row: word count · rating · difficulty (matching iOS) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {book.wordCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              {formatWordCount(book.wordCount)}
            </span>
          )}
          {rating && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {diffLevel && diffLevel >= 1 && diffLevel <= 5 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={cn('h-1.5 w-1.5 rounded-full', difficultyDotColors[diffLevel])} />
              {difficultyLabels[diffLevel]}
            </span>
          )}
        </div>
      </div>

      {/* Favorite button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-muted',
            'opacity-0 group-hover:opacity-100',
            isFavorited && 'opacity-100'
          )}
          aria-label={isFavorited ? '取消收藏' : '收藏'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
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
