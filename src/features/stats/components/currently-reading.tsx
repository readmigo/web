'use client';

import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { BookProgress } from '../types';

interface CurrentlyReadingProps {
  books: BookProgress[];
}

export function CurrentlyReading({ books }: CurrentlyReadingProps) {
  const t = useTranslations('analytics');

  if (books.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('currentlyReading')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {books.map((book) => (
          <Link
            key={book.bookId}
            href={`/book/${book.bookId}`}
            className="flex items-center gap-3 group"
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-12 w-8 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-8 items-center justify-center rounded bg-muted">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary">
                {book.title}
              </p>
              <Progress value={book.progress * 100} className="mt-1 h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {Math.round(book.progress * 100)}%
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
