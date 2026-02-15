'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteBookIds, useToggleFavorite } from '../hooks/use-favorites';
import type { Book, BookListBook } from '../types';

interface RankedBookCardProps {
  book: Book | BookListBook;
  rank: number;
  className?: string;
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        badge: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white',
        glow: 'shadow-lg shadow-amber-300/40',
        showCrown: true,
      };
    case 2:
      return {
        badge: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
        glow: 'shadow-lg shadow-gray-300/40',
        showCrown: false,
      };
    case 3:
      return {
        badge: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
        glow: 'shadow-lg shadow-amber-600/30',
        showCrown: false,
      };
    default:
      return {
        badge: 'bg-gray-500 text-white',
        glow: '',
        showCrown: false,
      };
  }
}

export function RankedBookCard({ book, rank, className }: RankedBookCardProps) {
  const { favoriteIds, isAuthenticated } = useFavoriteBookIds();
  const { toggleFavorite } = useToggleFavorite();
  const isFavorited = favoriteIds.has(book.id);
  const rankStyle = getRankStyle(rank);
  const rating = ('goodreadsRating' in book ? book.goodreadsRating : undefined) || ('doubanRating' in book ? book.doubanRating : undefined);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleFavorite(book.id, isFavorited);
  };

  return (
    <Link href={`/book/${book.id}`} className={cn('group block', className)}>
      <div className="w-[100px] space-y-2">
        {/* Cover with rank badge */}
        <div
          className={cn(
            'relative h-[150px] w-[100px] overflow-hidden rounded-lg bg-muted transition-shadow',
            rankStyle.glow
          )}
        >
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="100px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-2xl text-muted-foreground/40">
                {book.title.charAt(0)}
              </span>
            </div>
          )}

          {/* Rank badge overlay */}
          <div
            className={cn(
              'absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full px-1.5 text-xs font-bold',
              rankStyle.badge
            )}
          >
            {rankStyle.showCrown && <Crown className="h-3 w-3" />}
            <span>{rank}</span>
          </div>

          {/* Favorite button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50',
                'opacity-0 group-hover:opacity-100',
                isFavorited && 'opacity-100'
              )}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(
                  'h-3 w-3 transition-colors',
                  isFavorited
                    ? 'fill-red-500 text-red-500'
                    : 'text-white'
                )}
              />
            </button>
          )}
        </div>

        {/* Title & Author & Rating */}
        <div>
          <p className="line-clamp-1 text-xs font-medium leading-tight">
            {book.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {book.author}
          </p>
          {rating && (
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
