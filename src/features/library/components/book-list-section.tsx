'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useBookListDetail } from '../hooks/use-book-lists';
import type { BookList } from '../types';
import {
  GoldRankingSection,
  FreshStartSection,
  NeonSciFiSection,
  AdventureScrollSection,
  ColorfulBubbleSection,
  PhilosophyScrollSection,
  MysteryScrollSection,
  RomanceScrollSection,
  BookSpineSection,
  LearnerScrollSection,
  SeriesShowcaseSection,
  RoyalTheaterSection,
} from './book-list-section-styles';

/**
 * iOS-matching background gradients keyed by styleIndex.
 * Maps to BookListStyleDispatcher in iOS BookListSectionStyles.swift
 */
const SECTION_GRADIENTS: Record<number, string> = {
  0: 'linear-gradient(to bottom, rgba(249,115,22,0.08), transparent)',   // orange (金榜排行)
  1: 'linear-gradient(to bottom, rgba(34,197,94,0.08), rgba(52,211,153,0.05), transparent)', // green→mint (清新入门)
  2: 'linear-gradient(to right, rgba(168,85,247,0.08), rgba(99,102,241,0.06))',              // purple→indigo (霓虹科幻)
  3: 'linear-gradient(135deg, rgba(180,83,9,0.10), rgba(249,115,22,0.06), transparent)',     // brown→orange (暖调探险)
  4: 'linear-gradient(to right, rgba(236,72,153,0.06), rgba(52,211,153,0.06), rgba(34,211,238,0.06))', // pink→mint→cyan (彩色气泡)
  5: 'linear-gradient(to bottom, rgba(107,114,128,0.08), rgba(156,163,175,0.05), transparent)', // gray (极简雅致)
  6: 'linear-gradient(135deg, rgba(51,61,80,0.10), rgba(64,71,90,0.06), transparent)',       // dark blue (暗色悬疑)
  7: 'linear-gradient(to bottom, rgba(236,72,153,0.08), rgba(239,68,68,0.05), transparent)', // pink→red (浪漫爱情)
  8: 'linear-gradient(to bottom, rgba(180,83,9,0.08), rgba(180,83,9,0.03), transparent)',    // brown (鸿篇巨制)
  9: 'linear-gradient(to right, rgba(34,197,94,0.06), rgba(59,130,246,0.06), transparent)',  // green→blue (学习进阶)
  10: 'linear-gradient(to bottom, rgba(140,90,43,0.10), rgba(165,115,65,0.06), transparent)', // brown→tan (系列书展)
  18: 'linear-gradient(to bottom, rgba(168,85,247,0.08), rgba(217,191,140,0.06), rgba(168,85,247,0.04))', // purple→gold→purple (皇家剧院)
};

/**
 * Style dispatcher: maps styleIndex to section component.
 * Matches iOS BookListStyleDispatcher case mapping exactly.
 */
const STYLE_COMPONENTS: Record<number, React.ComponentType<{ books: import('../types').BookListBook[] }>> = {
  0: GoldRankingSection,       // 金榜排行
  1: FreshStartSection,        // 清新入门
  2: NeonSciFiSection,         // 霓虹科幻
  3: AdventureScrollSection,   // 暖调探险
  4: ColorfulBubbleSection,    // 彩色气泡
  5: PhilosophyScrollSection,  // 极简雅致
  6: MysteryScrollSection,     // 暗色悬疑
  7: RomanceScrollSection,     // 浪漫爱情
  8: BookSpineSection,         // 鸿篇巨制
  9: LearnerScrollSection,     // 学习进阶
  10: SeriesShowcaseSection,   // 系列书展
  18: RoyalTheaterSection,     // 皇家剧院
};

const DEFAULT_STYLE = GoldRankingSection;

interface BookListSectionProps {
  bookList: BookList;
  styleIndex?: number;
}

export function BookListSection({ bookList, styleIndex }: BookListSectionProps) {
  const { data: detailData, isLoading: detailLoading } = useBookListDetail(
    bookList.books && bookList.books.length > 0 ? '' : bookList.id
  );

  const isPad = useMediaQuery('(min-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const maxDisplay = isDesktop ? 12 : isPad ? 10 : 8;
  const allBooks = bookList.books || detailData?.books || [];
  const books = allBooks.length <= maxDisplay ? allBooks : allBooks.slice(0, maxDisplay);

  if (detailLoading && !bookList.books) {
    return <BookListSectionSkeleton />;
  }

  if (books.length === 0) {
    return null;
  }

  // Use sortOrder-based styleIndex (iOS: (list.sortOrder ?? 1) - 1), fallback to prop
  const idx = styleIndex ?? 0;
  const gradient = SECTION_GRADIENTS[idx] || SECTION_GRADIENTS[0];
  const StyleComponent = STYLE_COMPONENTS[idx] || DEFAULT_STYLE;

  return (
    <div
      className={cn('space-y-3', gradient && 'rounded-xl px-4 py-4')}
      style={gradient ? { background: gradient } : undefined}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bookList.name}</h3>
          {bookList.subtitle && (
            <p className="text-sm text-muted-foreground">{bookList.subtitle}</p>
          )}
        </div>
        <Link
          href={`/book-list/${bookList.id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          查看全部
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Style-specific content */}
      <StyleComponent books={books} />
    </div>
  );
}

export function BookListSectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[100px] md:w-[120px] lg:w-[140px] flex-shrink-0 space-y-2">
            <Skeleton className="h-[150px] w-[100px] md:h-[180px] md:w-[120px] lg:h-[210px] lg:w-[140px] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
