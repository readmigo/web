'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { BookList, BookListType } from '../types';

interface HeroBannerProps {
  bookLists: BookList[];
  isLoading?: boolean;
}

const gradientMap: Record<string, string> = {
  RANKING: 'from-orange-500 to-red-600',
  EDITORS_PICK: 'from-blue-500 to-purple-600',
  COLLECTION: 'from-green-500 to-teal-600',
  UNIVERSITY: 'from-indigo-500 to-blue-600',
  CELEBRITY: 'from-pink-500 to-rose-600',
  ANNUAL_BEST: 'from-amber-500 to-orange-600',
  AI_RECOMMENDED: 'from-cyan-500 to-blue-600',
  PERSONALIZED: 'from-violet-500 to-purple-600',
  AI_FEATURED: 'from-purple-500 to-pink-600',
};

const defaultGradient = 'from-gray-500 to-blue-600';

function getGradient(type: BookListType): string {
  return gradientMap[type] || defaultGradient;
}

const typeLabels: Record<string, string> = {
  RANKING: 'Ranking',
  EDITORS_PICK: "Editor's Pick",
  COLLECTION: 'Collection',
  UNIVERSITY: 'University',
  CELEBRITY: 'Celebrity',
  ANNUAL_BEST: 'Annual Best',
  AI_RECOMMENDED: 'AI Recommended',
  PERSONALIZED: 'For You',
  AI_FEATURED: 'AI Featured',
};

export function HeroBanner({ bookLists, isLoading }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = bookLists.slice(0, 3);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index % slides.length);
    },
    [slides.length]
  );

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentIndex, slides.length, goToSlide]);

  if (isLoading) {
    return <HeroBannerSkeleton />;
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((list) => (
          <HeroBannerSlide key={list.id} bookList={list} />
        ))}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroBannerSlide({ bookList }: { bookList: BookList }) {
  const gradient = getGradient(bookList.type);
  const books = bookList.books?.slice(0, 3) || [];

  return (
    <Link
      href={`/book-list/${bookList.id}`}
      className="block w-full flex-shrink-0"
    >
      <div
        className={cn(
          'relative flex min-h-[200px] items-center bg-gradient-to-r p-6 md:min-h-[240px] md:p-8',
          gradient
        )}
      >
        {/* Text content */}
        <div className="relative z-10 flex-1 text-white">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {typeLabels[bookList.type] || bookList.type}
          </span>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            {bookList.name}
          </h2>
          {bookList.subtitle && (
            <p className="mt-1 text-sm text-white/80 md:text-base">
              {bookList.subtitle}
            </p>
          )}
          <p className="mt-3 text-sm text-white/70">
            {bookList.bookCount} books
          </p>
        </div>

        {/* Book covers - overlapping stack */}
        {books.length > 0 && (
          <div className="relative z-10 hidden md:flex">
            <div className="flex items-end">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="relative aspect-[2/3] w-24 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105 lg:w-28"
                  style={{
                    marginLeft: index > 0 ? '-16px' : '0',
                    zIndex: books.length - index,
                    transform: `rotate(${(index - 1) * 3}deg)`,
                  }}
                >
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/20 backdrop-blur-sm">
                      <span className="text-2xl text-white/60">
                        {book.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-white" />
          <div className="absolute bottom-4 right-24 h-20 w-20 rounded-full bg-white" />
        </div>
      </div>
    </Link>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl">
      <Skeleton className="h-[200px] w-full md:h-[240px]" />
    </div>
  );
}
