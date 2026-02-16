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
  StepLadderSection,
  NeonSciFiSection,
  AdventureMapSection,
  ColorfulBubbleSection,
  MinimalStoneSection,
  DarkMysterySection,
  RoyalTheaterSection,
  BookSpineSection,
  DifficultyLadderSection,
} from './book-list-section-styles';

/** iOS-matching background gradients for each ranking section */
const SECTION_GRADIENTS = [
  'linear-gradient(to bottom, rgba(249,115,22,0.08), transparent)', // 0: orange (金榜排行)
  'linear-gradient(to bottom, rgba(59,130,246,0.06), transparent)',  // 1: blue (渐进阶梯)
  'linear-gradient(to right, rgba(168,85,247,0.08), rgba(99,102,241,0.06))', // 2: purple→indigo (霓虹科幻)
  'linear-gradient(to bottom, rgba(180,83,9,0.08), transparent)',   // 3: brown (地图探险)
  'linear-gradient(to right, rgba(236,72,153,0.06), rgba(52,211,153,0.06), rgba(34,211,238,0.06))', // 4: pink→mint→cyan (彩色气泡)
  'linear-gradient(to bottom, rgba(107,114,128,0.06), transparent)', // 5: gray (极简石刻)
  'linear-gradient(135deg, rgba(217,226,237,0.6), rgba(224,232,242,0.4))', // 6: blue-gray (悬疑推理)
  'linear-gradient(to bottom, rgba(168,85,247,0.06), rgba(234,179,8,0.04))', // 7: purple→yellow (皇家剧院)
  'linear-gradient(to top, rgba(180,83,9,0.06), transparent)',      // 8: brown (书脊堆叠)
  'linear-gradient(to bottom, rgba(34,197,94,0.06), transparent)',  // 9: green (难度阶梯)
];

/** Style dispatcher: maps styleIndex to the corresponding section component */
const STYLE_COMPONENTS = [
  GoldRankingSection,     // 0: 金榜排行
  StepLadderSection,      // 1: 渐进阶梯
  NeonSciFiSection,       // 2: 霓虹科幻
  AdventureMapSection,    // 3: 地图探险
  ColorfulBubbleSection,  // 4: 彩色气泡
  MinimalStoneSection,    // 5: 极简石刻
  DarkMysterySection,     // 6: 悬疑推理
  RoyalTheaterSection,    // 7: 皇家剧院
  BookSpineSection,       // 8: 书脊堆叠
  DifficultyLadderSection, // 9: 难度阶梯
];

interface BookListSectionProps {
  bookList: BookList;
  styleIndex?: number;
}

export function BookListSection({ bookList, styleIndex }: BookListSectionProps) {
  const { data: detailData, isLoading: detailLoading } = useBookListDetail(
    bookList.books && bookList.books.length > 0 ? '' : bookList.id
  );

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const maxDisplay = isDesktop ? 12 : 8;
  const allBooks = bookList.books || detailData?.books || [];
  const books = allBooks.length <= maxDisplay ? allBooks : allBooks.slice(0, maxDisplay);

  if (detailLoading && !bookList.books) {
    return <BookListSectionSkeleton />;
  }

  if (books.length === 0) {
    return null;
  }

  const idx = styleIndex ?? 0;
  const gradient = SECTION_GRADIENTS[idx % SECTION_GRADIENTS.length];
  const StyleComponent = STYLE_COMPONENTS[idx % STYLE_COMPONENTS.length];

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
          <div key={i} className="w-[100px] lg:w-[140px] flex-shrink-0 space-y-2">
            <Skeleton className="h-[150px] w-[100px] lg:h-[210px] lg:w-[140px] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
