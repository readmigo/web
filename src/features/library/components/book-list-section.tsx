'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { RankedBookCard } from './ranked-book-card';
import { HeroBookCard } from './hero-book-card';
import { useBookListDetail } from '../hooks/use-book-lists';
import type { BookList, BookListType } from '../types';

/** iOS-matching background gradients for each ranking section */
const SECTION_GRADIENTS = [
  'linear-gradient(to bottom, rgba(249,115,22,0.08), transparent)', // 0: orange (高分经典)
  'linear-gradient(to bottom, rgba(59,130,246,0.06), transparent)',  // 1: blue (入门推荐)
  'linear-gradient(to right, rgba(168,85,247,0.08), rgba(99,102,241,0.06))', // 2: purple→indigo (科幻经典)
  'linear-gradient(to bottom, rgba(180,83,9,0.08), transparent)',   // 3: brown (冒险故事)
  'linear-gradient(to right, rgba(236,72,153,0.06), rgba(52,211,153,0.06), rgba(34,211,238,0.06))', // 4: pink→mint→cyan (儿童文学)
  'linear-gradient(to bottom, rgba(107,114,128,0.06), transparent)', // 5: gray (哲学思想)
  'linear-gradient(135deg, rgba(217,226,237,0.6), rgba(224,232,242,0.4))', // 6: blue-gray (侦探推理)
  'linear-gradient(to bottom, rgba(168,85,247,0.06), rgba(234,179,8,0.04))', // 7: purple→yellow (莎士比亚)
  'linear-gradient(to top, rgba(180,83,9,0.06), transparent)',      // 8: brown (鸿篇巨制)
  'linear-gradient(to bottom, rgba(34,197,94,0.06), transparent)',  // 9: green (英语学习必读)
];

interface BookListSectionProps {
  bookList: BookList;
  styleIndex?: number;
}

const RANKED_TYPES: BookListType[] = ['RANKING'];
const HERO_TYPES: BookListType[] = ['AI_FEATURED', 'AI_RECOMMENDED', 'EDITORS_PICK'];

function isRankedType(type: BookListType): boolean {
  return RANKED_TYPES.includes(type);
}

function isHeroType(type: BookListType): boolean {
  return HERO_TYPES.includes(type);
}

export function BookListSection({ bookList, styleIndex }: BookListSectionProps) {
  // Fetch books from detail API if not already populated
  const { data: detailData, isLoading: detailLoading } = useBookListDetail(
    bookList.books && bookList.books.length > 0 ? '' : bookList.id
  );

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const maxDisplay = isDesktop ? 12 : 8;
  const allBooks = bookList.books || detailData?.books || [];
  const books = allBooks.length <= maxDisplay ? allBooks : allBooks.slice(0, maxDisplay);

  if (detailLoading && !bookList.books) {
    return <BookListSectionSkeleton />;
  }

  if (books.length === 0) {
    return null;
  }

  const useRanked = isRankedType(bookList.type);
  const useHero = isHeroType(bookList.type);
  const showAiBadge = bookList.type === 'AI_FEATURED' || bookList.type === 'AI_RECOMMENDED';

  const gradient = styleIndex != null ? SECTION_GRADIENTS[styleIndex % SECTION_GRADIENTS.length] : undefined;

  return (
    <div
      className={cn('space-y-3', gradient && 'rounded-xl px-4 py-4')}
      style={gradient ? { background: gradient } : undefined}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bookList.name}</h3>
          {bookList.subtitle && (
            <p className="text-sm text-muted-foreground">{bookList.subtitle}</p>
          )}
        </div>
        {books.length < allBooks.length && (
          <Link
            href={`/book-list/${bookList.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
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

          // Default: standard inline card (iOS StandardBookCard 100x150)
          return (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="group flex-shrink-0"
            >
              <div className="w-[140px] space-y-2">
                {/* Cover */}
                <div className="relative h-[210px] w-[140px] overflow-hidden rounded-lg bg-muted shadow-sm transition-shadow group-hover:shadow-md">
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
                      <span className="text-2xl text-muted-foreground/40">
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
          <div key={i} className="w-[140px] flex-shrink-0 space-y-2">
            <Skeleton className="h-[210px] w-[140px] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
