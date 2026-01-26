'use client';

import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book, UserBook } from '../types';

// Extended book type that includes user-specific data
export interface BookWithProgress extends Book {
  progress?: number;
  status?: UserBook['status'];
  userBookId?: string;
}

interface BookGridProps {
  books: (Book | BookWithProgress)[];
  userBooks?: Record<string, UserBook>;
  isLoading?: boolean;
  showProgress?: boolean;
}

export function BookGrid({ books, userBooks, isLoading, showProgress }: BookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">暂无书籍</p>
        <p className="mt-2 text-sm text-muted-foreground">
          去探索发现更多好书吧
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book) => {
        // Check if this is a BookWithProgress
        const bookWithProgress = book as BookWithProgress;
        const userBook = userBooks?.[book.id] || (showProgress && bookWithProgress.progress !== undefined ? {
          id: bookWithProgress.userBookId || book.id,
          bookId: book.id,
          book: book,
          addedAt: new Date(),
          progress: bookWithProgress.progress || 0,
          status: bookWithProgress.status || 'reading',
        } as UserBook : undefined);

        return (
          <BookCard key={book.id} book={book} userBook={userBook} />
        );
      })}
    </div>
  );
}
