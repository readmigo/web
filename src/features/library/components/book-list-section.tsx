'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RankedBookCard } from './ranked-book-card';
import { HeroBookCard } from './hero-book-card';
import { useBookListDetail } from '../hooks/use-book-lists';
import type { BookList, BookListType } from '../types';

interface BookListSectionProps {
  bookList: BookList;
}

const RANKED_TYPES: BookListType[] = ['RANKING'];
const HERO_TYPES: BookListType[] = ['AI_FEATURED', 'AI_RECOMMENDED', 'EDITORS_PICK'];

function isRankedType(type: BookListType): boolean {
  return RANKED_TYPES.includes(type);
}

function isHeroType(type: BookListType): boolean {
  return HERO_TYPES.includes(type);
}

export function BookListSection({ bookList }: BookListSectionProps) {
  // Fetch books from detail API if not already populated
  const { data: detailData, isLoading: detailLoading } = useBookListDetail(
    bookList.books && bookList.books.length > 0 ? '' : bookList.id
  );

  const books = (bookList.books || detailData?.books || []).slice(0, 8);

  if (detailLoading && !bookList.books) {
    return <BookListSectionSkeleton />;
  }

  if (books.length === 0) {
    return null;
  }

  const useRanked = isRankedType(bookList.type);
  const useHero = isHeroType(bookList.type);
  const showAiBadge = bookList.type === 'AI_FEATURED' || bookList.type === 'AI_RECOMMENDED';

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bookList.name}</h3>
          {bookList.subtitle && (
            <p className="text-sm text-muted-foreground">{bookList.subtitle}</p>
          )}
        </div>
        <Link
          href={`/book-list/${bookList.id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal Scrollable Books */}
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {books.map((book, index) => {
          if (useRanked) {
            return (
              <RankedBookCard
                key={book.id}
                book={book}
                rank={index + 1}
                className="flex-shrink-0"
              />
            );
          }

          if (useHero) {
            return (
              <HeroBookCard
                key={book.id}
                book={book}
                showAiBadge={showAiBadge}
                className="flex-shrink-0"
              />
            );
          }

          // Default: standard inline card (original style)
          return (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="group flex-shrink-0"
            >
              <div className="w-[120px] space-y-2 sm:w-[140px]">
                {/* Cover */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm transition-shadow group-hover:shadow-md">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 120px, 140px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-3xl text-muted-foreground/40">
                        {book.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & Author */}
                <div>
                  <p className="line-clamp-2 text-sm font-medium leading-tight">
                    {book.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {book.author}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BookListSectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[120px] flex-shrink-0 space-y-2 sm:w-[140px]">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
