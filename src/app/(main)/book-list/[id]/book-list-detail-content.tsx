'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useBookListDetail } from '@/features/library/hooks/use-book-lists';
import { cn } from '@/lib/utils';
import type { BookListType } from '@/features/library/types';

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

const difficultyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const difficultyColors: Record<number, string> = {
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

interface BookListDetailContentProps {
  listId: string;
}

export function BookListDetailContent({ listId }: BookListDetailContentProps) {
  const { data: bookList, isLoading, error, refetch } = useBookListDetail(listId);

  if (isLoading) {
    return <BookListDetailSkeleton />;
  }

  if (error || !bookList) {
    return (
      <div className="container flex flex-col items-center justify-center py-20">
        <p className="text-lg text-destructive">
          {error ? 'Failed to load book list' : 'Book list not found'}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Please try again later'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const gradient = getGradient(bookList.type);
  const books = bookList.books || [];

  return (
    <div>
      {/* Banner */}
      <div className={cn('bg-gradient-to-r px-6 py-8 text-white md:px-8 md:py-12', gradient)}>
        <div className="container">
          <Link
            href="/explore"
            className="mb-4 inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex-1">
              <Badge className="mb-3 border-white/30 bg-white/20 text-white backdrop-blur-sm">
                {typeLabels[bookList.type] || bookList.type}
              </Badge>
              <h1 className="text-3xl font-bold md:text-4xl">{bookList.name}</h1>
              {bookList.subtitle && (
                <p className="mt-2 text-lg text-white/80">{bookList.subtitle}</p>
              )}
              {bookList.description && (
                <p className="mt-3 max-w-2xl text-sm text-white/70">
                  {bookList.description}
                </p>
              )}
              <p className="mt-4 text-sm text-white/60">
                {bookList.bookCount} books in this collection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="container py-8">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">No books in this list yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg">
                  <CardContent className="flex gap-4 p-4">
                    {/* Cover */}
                    <div className="relative aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-xl text-muted-foreground/40">
                            {book.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h3 className="line-clamp-2 font-medium leading-tight">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {book.author}
                      </p>
                      {book.difficulty && (
                        <Badge
                          className={cn(
                            'mt-2 w-fit text-white',
                            difficultyColors[book.difficulty]
                          )}
                        >
                          {difficultyLabels[book.difficulty]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookListDetailSkeleton() {
  return (
    <div>
      {/* Banner skeleton */}
      <Skeleton className="h-[200px] w-full rounded-none md:h-[260px]" />

      {/* Books grid skeleton */}
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border p-4">
              <Skeleton className="aspect-[2/3] w-20 rounded-lg" />
              <div className="flex flex-1 flex-col justify-center space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
