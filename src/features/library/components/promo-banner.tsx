'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

const SESSION_KEY = 'promoBannerDismissed';

interface PromoBannerData {
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  bgGradient?: string;
}

// Static fallback config used when the API call fails or returns no data
const STATIC_FALLBACK: PromoBannerData = {
  bookId: 'pride-and-prejudice',
  title: 'Pride and Prejudice',
  author: 'Jane Austen',
  description: 'A timeless classic — free to read',
  bgGradient: 'from-rose-500 to-pink-600',
};

async function fetchPromoBanner(): Promise<PromoBannerData> {
  try {
    const data = await apiClient.get<PromoBannerData>('/promotions/banner', {
      skipAuth: true,
    });
    if (data?.bookId) return data;
  } catch {
    // Silently fall back to static config
  }
  return STATIC_FALLBACK;
}

export function PromoBanner() {
  const t = useTranslations('discover');
  // Start as null (unknown) to avoid flash; resolved on mount
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  // Read sessionStorage on mount (client-only)
  useEffect(() => {
    // Wrap in setTimeout to defer the setState out of the synchronous effect body,
    // satisfying the React Compiler lint rule while still running on mount.
    const id = setTimeout(() => {
      setDismissed(sessionStorage.getItem(SESSION_KEY) === '1');
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // dismissed === null means we haven't read sessionStorage yet (SSR / first paint)
  const isVisible = dismissed === false;

  const { data } = useQuery({
    queryKey: ['promoBanner'],
    queryFn: fetchPromoBanner,
    staleTime: 10 * 60 * 1000,
    enabled: isVisible,
  });

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  if (!isVisible || !data) return null;

  const gradient = data.bgGradient ?? STATIC_FALLBACK.bgGradient;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-r text-white',
        gradient
      )}
      role="complementary"
      aria-label={data.title}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Cover or fallback icon */}
        <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
          {data.coverUrl ? (
            <Image
              src={data.coverUrl}
              alt={data.title}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/20 backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-white/80" />
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
            {t('promoBanner.freeBadge')}
          </span>
          <p className="mt-1 truncate font-semibold leading-tight">{data.title}</p>
          {data.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{data.description}</p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/book/${data.bookId}`}
          className="flex-shrink-0 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/30"
          onClick={handleDismiss}
        >
          {t('promoBanner.cta')}
        </Link>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full bg-black/10 p-1 transition-colors hover:bg-black/20"
        aria-label={t('promoBanner.dismiss')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
