'use client';

import { Heart, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToggleLike } from '../hooks/use-quotes';
import type { Quote } from '../types';
import Link from 'next/link';

interface QuoteCardProps {
  quote: Quote;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  const toggleLike = useToggleLike();

  const handleLike = () => {
    toggleLike.mutate({ quoteId: quote.id, isLiked: quote.isLiked });
  };

  const handleShare = async () => {
    const text = `"${quote.text}" — ${quote.author}`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="text-sm italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>

      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {quote.authorId ? (
            <Link
              href={`/author/${quote.authorId}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {quote.author}
            </Link>
          ) : (
            <span className="text-sm font-medium">{quote.author}</span>
          )}
          {quote.bookTitle && (
            <p className="text-xs text-muted-foreground truncate">
              <BookOpen className="inline mr-1 h-3 w-3" />
              {quote.bookTitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleLike}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                quote.isLiked && 'fill-red-500 text-red-500',
              )}
            />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[1.5rem]">
            {quote.likeCount > 0 ? quote.likeCount : ''}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quote.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
