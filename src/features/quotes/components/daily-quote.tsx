'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { useDailyQuote } from '../hooks/use-quotes';
import { useTranslations } from 'next-intl';

export function DailyQuote() {
  const { data: quote, isLoading } = useDailyQuote();
  const t = useTranslations('quotes');

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 p-6">
        <Skeleton className="h-4 w-24 bg-white/20" />
        <Skeleton className="mt-4 h-16 w-full bg-white/20" />
        <Skeleton className="mt-3 h-4 w-32 bg-white/20" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 p-6 text-white">
      <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
        <Sparkles className="h-4 w-4" />
        {t('dailyQuote')}
      </div>
      <p className="mt-3 text-lg font-medium italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="mt-3 text-sm text-white/70">— {quote.author}</p>
    </div>
  );
}
