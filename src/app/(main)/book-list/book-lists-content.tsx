'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useBookLists } from '@/features/library/hooks/use-book-lists';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { BookList } from '@/features/library/types';

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

function BookListCard({ list }: { list: BookList }) {
  const gradient = gradientMap[list.type] || 'from-gray-500 to-blue-600';

  return (
    <Link href={`/book-list/${list.id}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className={cn('relative h-24 bg-gradient-to-r', gradient)}>
          {list.coverUrl && (
            <Image
              src={list.coverUrl}
              alt={list.name}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          )}
          <div className="absolute inset-0 flex items-end p-3">
            <Badge className="border-white/30 bg-white/20 text-white text-[10px] backdrop-blur-sm">
              {typeLabels[list.type] || list.type}
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-1">{list.nameEn || list.name}</h3>
          {list.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{list.subtitle}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {list.bookCount} books
          </p>
        </div>
      </div>
    </Link>
  );
}

export function BookListsContent() {
  const t = useTranslations('explore');
  const { data: bookLists, isLoading } = useBookLists();
  const activeLists = (bookLists || []).filter((list) => list.bookCount > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/explore"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">{t('viewAllLists')}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <Skeleton className="h-24 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activeLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">{t('noBooks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {activeLists.map((list) => (
            <BookListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
