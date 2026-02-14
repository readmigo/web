'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFavoriteBookIds, useToggleFavorite } from '../hooks/use-favorites';
import type { Book, BookListBook } from '../types';

interface HeroBookCardProps {
  book: Book | BookListBook;
  showAiBadge?: boolean;
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

export function HeroBookCard({ book, showAiBadge, className }: HeroBookCardProps) {
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
    <Link href={`/book/${book.id}`} className={cn('group block', className)}>
      <div className="w-[140px] space-y-2">
        {/* Cover */}
        <div className="relative h-[210px] w-[140px] overflow-hidden rounded-xl bg-muted shadow-md transition-shadow group-hover:shadow-xl">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="140px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-3xl text-muted-foreground/40">
                {book.title.charAt(0)}
              </span>
            </div>
          )}

          {/* AI badge overlay */}
          {showAiBadge && (
            <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span>AI Pick</span>
            </div>
          )}

          {/* Favorite button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50',
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
                    : 'text-white'
                )}
              />
            </button>
          )}
        </div>

        {/* Title & Author */}
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-tight">
            {book.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {book.author}
          </p>
        </div>

        {/* Difficulty badge */}
        {book.difficulty && (
          <Badge
            className={cn(
              'text-[10px] text-white',
              difficultyColors[book.difficulty]
            )}
          >
            {difficultyLabels[book.difficulty]}
          </Badge>
        )}
      </div>
    </Link>
  );
}
