'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFavoriteBookIds, useToggleFavorite } from '../hooks/use-favorites';
import type { Book, UserBook } from '../types';

interface BookCardProps {
  book: Book;
  userBook?: UserBook;
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

export function BookCard({ book, userBook, className }: BookCardProps) {
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
    <Link href={`/book/${book.id}`}>
      <Card
        className={cn(
          'group overflow-hidden transition-all hover:shadow-lg',
          className
        )}
      >
        <CardContent className="p-0">
          {/* Cover */}
          <div className="relative aspect-[2/3] overflow-hidden bg-muted">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
            )}
            {/* Difficulty badge */}
            <Badge
              className={cn(
                'absolute left-2 top-2 text-white',
                difficultyColors[book.difficulty]
              )}
            >
              {difficultyLabels[book.difficulty]}
            </Badge>

            {/* Favorite button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={cn(
                  'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50',
                  'opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100',
                  // Always visible on touch devices and when favorited
                  isFavorited && 'opacity-100'
                )}
                aria-label={isFavorited ? '取消收藏' : '收藏'}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isFavorited
                      ? 'fill-red-500 text-red-500'
                      : 'text-white'
                  )}
                />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="line-clamp-2 font-medium leading-tight">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>

            {/* Reading progress */}
            {userBook && userBook.progress > 0 && (
              <div className="mt-2">
                <Progress value={userBook.progress} className="h-1" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {userBook.progress}% 已读
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
