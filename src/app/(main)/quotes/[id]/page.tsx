'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, BookOpen, ChevronLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useQuote, useToggleLike } from '@/features/quotes/hooks/use-quotes';
import { ShareCardDialog } from '@/features/share-card/share-card-dialog';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('quotes');
  const id = params.id as string;

  const { data: quote, isLoading, error } = useQuote(id);
  const toggleLike = useToggleLike();
  const [shareOpen, setShareOpen] = useState(false);

  const handleLike = () => {
    if (!quote) return;
    toggleLike.mutate({ quoteId: quote.id, isLiked: quote.isLiked });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          {t('back')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('back')}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('back')}
        </button>

        {/* Quote card */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm">
          <blockquote className="text-lg italic leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </blockquote>

          {/* Author */}
          <div className="space-y-1">
            {quote.authorId ? (
              <Link
                href={`/author/${quote.authorId}`}
                className="text-base font-semibold text-primary hover:underline"
              >
                {quote.author}
              </Link>
            ) : (
              <p className="text-base font-semibold">{quote.author}</p>
            )}

            {/* Book source */}
            {quote.bookTitle && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                {quote.bookId ? (
                  <Link
                    href={`/book/${quote.bookId}`}
                    className="hover:underline"
                  >
                    {quote.bookTitle}
                  </Link>
                ) : (
                  quote.bookTitle
                )}
              </p>
            )}
          </div>

          {/* Tags */}
          {quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quote.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant={quote.isLiked ? 'default' : 'secondary'}
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className="flex items-center gap-2"
            aria-label={quote.isLiked ? t('unlike') : t('like')}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                quote.isLiked && 'fill-current',
              )}
            />
            {t('like')}
            {quote.likeCount > 0 && (
              <span className="ml-1 text-sm opacity-80">{quote.likeCount}</span>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2"
            aria-label={t('share')}
          >
            <Share2 className="h-4 w-4" />
            {t('share')}
          </Button>
        </div>

        {/* View all quotes from this author / book */}
        <div className="space-y-2 border-t pt-4">
          {quote.authorId && (
            <Link
              href={`/quotes?authorId=${quote.authorId}`}
              className="block text-sm text-primary hover:underline"
            >
              {t('viewAuthorQuotes', { author: quote.author })}
            </Link>
          )}
          {quote.bookId && (
            <Link
              href={`/quotes?bookId=${quote.bookId}`}
              className="block text-sm text-primary hover:underline"
            >
              {t('viewBookQuotes', { book: quote.bookTitle ?? '' })}
            </Link>
          )}
        </div>
      </div>

      <ShareCardDialog
        open={shareOpen}
        content={{
          text: quote.text,
          author: quote.author,
          bookTitle: quote.bookTitle,
          source: 'quote',
        }}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
