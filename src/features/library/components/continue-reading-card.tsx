'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContinueReading } from '@/features/library/hooks/use-user-library';

export function ContinueReadingCard() {
  const tl = useTranslations('library');
  const { data: currentBooks, isLoading } = useContinueReading();

  if (isLoading || !currentBooks || currentBooks.length === 0) return null;

  const book = currentBooks[0];

  return (
    <Link href={`/reader/${book.bookId}`} className="block">
      <div className="rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-accent">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tl('continueReading')}
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative h-[60px] w-[40px] flex-shrink-0 overflow-hidden rounded-md bg-secondary">
            {book.book?.coverUrl ? (
              <Image
                src={book.book.coverUrl}
                alt={book.book.title}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs">📖</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{book.book?.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{book.book?.author}</p>
            {book.progress > 0 && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(book.progress * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
