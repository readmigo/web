'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { BookListBook } from '../types';

// ============ Shared Helpers ============

function getRating(book: BookListBook) {
  return book.goodreadsRating || book.doubanRating;
}

function formatWordCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return `${count}`;
}

function getDifficultyColor(score: number | undefined | null): string {
  if (score == null) return 'bg-gray-400';
  if (score <= 3) return 'bg-green-500';
  if (score <= 5) return 'bg-blue-500';
  if (score <= 7) return 'bg-orange-500';
  return 'bg-red-500';
}

function getDifficultyLabel(score: number | undefined | null): string {
  if (score == null) return '';
  if (score <= 3) return 'Easy';
  if (score <= 5) return 'Medium';
  if (score <= 7) return 'Hard';
  return 'Expert';
}

/**
 * Responsive BookCover using Tailwind classes for Phone / Pad / Desktop.
 * `sizeClass` should contain responsive w-/h- classes, e.g. "w-[100px] h-[150px] md:w-[120px] md:h-[180px] lg:w-[140px] lg:h-[210px]"
 */
function BookCover({
  book,
  sizeClass,
  className,
  sizes,
}: {
  book: BookListBook;
  sizeClass: string;
  className?: string;
  sizes?: string;
}) {
  const url = book.coverThumbUrl || book.coverUrl;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted flex-shrink-0',
        sizeClass,
        className
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={book.title}
          fill
          className="object-cover"
          sizes={sizes || '140px'}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-lg text-muted-foreground/40">
            {book.title.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive carousel cover with aspect-ratio 2/3 and optional overlay children.
 */
function CarouselCover({
  book,
  widthClass,
  className,
  sizes,
  children,
}: {
  book: BookListBook;
  widthClass: string;
  className?: string;
  sizes?: string;
  children?: React.ReactNode;
}) {
  const url = book.coverThumbUrl || book.coverUrl;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        className
      )}
      style={{ aspectRatio: '2/3' }}
    >
      {url ? (
        <Image
          src={url}
          alt={book.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes={sizes || '140px'}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-xl text-muted-foreground/40">{book.title.charAt(0)}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function RatingDisplay({ rating }: { rating: number | undefined }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

// ============ Style 0: 金榜排行 (GoldRankingSection) ============
// Phone: 100px  Pad: 120px  Desktop: 140px

export function GoldRankingSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {books.map((book, i) => {
        const rank = i + 1;
        const isTop3 = rank <= 3;
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              >
                {/* Rank badge */}
                <div
                  className={cn(
                    'absolute -left-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                    isTop3 ? 'bg-orange-500' : 'bg-gray-400'
                  )}
                >
                  {rank}
                </div>
              </CarouselCover>
              {rating && <RatingDisplay rating={rating} />}
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 1: 渐进阶梯 (StepLadderSection) ============
// Phone: 50×75  Pad: 60×90  Desktop: 70×105

export function StepLadderSection({ books }: { books: BookListBook[] }) {
  const display = books.slice(0, 5);
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      {display.map((book, i) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className={cn(
              'flex items-center gap-3 py-2.5',
              i < display.length - 1 && 'border-b'
            )}>
              <BookCover
                book={book}
                sizeClass="w-[50px] h-[75px] md:w-[60px] md:h-[90px] lg:w-[70px] lg:h-[105px]"
                className="rounded-md"
                sizes="(min-width: 1024px) 70px, (min-width: 768px) 60px, 50px"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rating && <RatingDisplay rating={rating} />}
                {book.wordCount && book.wordCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatWordCount(book.wordCount)}
                  </span>
                )}
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    getDifficultyColor(book.difficultyScore)
                  )}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 2: 霓虹科幻 (NeonSciFiSection) ============
// Phone: 90px  Pad: 110px  Desktop: 130px

export function NeonSciFiSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[90px] md:w-[110px] lg:w-[130px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[90px] md:w-[110px] lg:w-[130px]"
                className="shadow-[0_3px_6px_rgba(139,92,246,0.3)]"
                sizes="(min-width: 1024px) 130px, (min-width: 768px) 110px, 90px"
              />
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 3: 地图探险 (AdventureMapSection) ============
// Featured: Phone 130px  Pad 150px  Desktop 170px
// Secondary: Phone 45×68  Pad 55×82  Desktop 65×98

export function AdventureMapSection({ books }: { books: BookListBook[] }) {
  if (books.length === 0) return null;
  const featured = books[0];
  const secondary = books.slice(1, 4);

  return (
    <div className="flex gap-4">
      {/* Featured large book */}
      <Link href={`/book/${featured.id}`} className="group flex-shrink-0">
        <div className="w-[130px] md:w-[150px] lg:w-[170px] space-y-1.5">
          <CarouselCover
            book={featured}
            widthClass="w-[130px] md:w-[150px] lg:w-[170px]"
            className="shadow-md"
            sizes="(min-width: 1024px) 170px, (min-width: 768px) 150px, 130px"
          />
          <p className="line-clamp-2 text-sm font-medium leading-tight">{featured.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{featured.author}</p>
        </div>
      </Link>

      {/* Secondary stacked list */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {secondary.map((book, i) => (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className={cn(
              'flex items-center gap-2.5 py-2.5',
              i < secondary.length - 1 && 'border-b'
            )}>
              <BookCover
                book={book}
                sizeClass="w-[45px] h-[68px] md:w-[55px] md:h-[82px] lg:w-[65px] lg:h-[98px]"
                className="rounded-md"
                sizes="(min-width: 1024px) 65px, (min-width: 768px) 55px, 45px"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
              </div>
              {book.wordCount && book.wordCount > 0 && (
                <span className="text-[11px] text-orange-500 flex-shrink-0">
                  {formatWordCount(book.wordCount)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============ Style 4: 彩色气泡 (ColorfulBubbleSection) ============
// Phone: 90px  Pad: 110px  Desktop: 130px

const BUBBLE_COLORS = [
  'rgba(236,72,153,0.3)',   // pink
  'rgba(52,211,153,0.3)',   // mint
  'rgba(34,211,238,0.3)',   // cyan
  'rgba(234,179,8,0.3)',    // yellow
  'rgba(168,85,247,0.3)',   // purple
  'rgba(249,115,22,0.3)',   // orange
  'rgba(34,197,94,0.3)',    // green
  'rgba(59,130,246,0.3)',   // blue
];

export function ColorfulBubbleSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {books.map((book, i) => {
        const rating = getRating(book);
        const shadowColor = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
        const url = book.coverThumbUrl || book.coverUrl;
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[90px] md:w-[110px] lg:w-[130px] space-y-1.5">
              <div
                className="relative overflow-hidden rounded-2xl bg-muted"
                style={{
                  aspectRatio: '2/3',
                  boxShadow: `0 4px 6px ${shadowColor}`,
                }}
              >
                {url ? (
                  <Image
                    src={url}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(min-width: 1024px) 130px, (min-width: 768px) 110px, 90px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xl text-muted-foreground/40">{book.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 5: 极简石刻 (MinimalStoneSection) ============
// No covers

export function MinimalStoneSection({ books }: { books: BookListBook[] }) {
  const display = books.slice(0, 4);
  return (
    <div className="rounded-xl border border-border/50 p-3">
      {display.map((book, i) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className={cn(
              'flex items-center gap-3 py-2.5',
              i < display.length - 1 && 'border-b'
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rating && <RatingDisplay rating={rating} />}
                {book.wordCount && book.wordCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatWordCount(book.wordCount)}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 6: 悬疑推理 (DarkMysterySection) ============
// Phone: 45×68  Pad: 55×82  Desktop: 65×98

export function DarkMysterySection({ books }: { books: BookListBook[] }) {
  const display = books.slice(0, 5);
  return (
    <div>
      {display.map((book, i) => {
        const rank = i + 1;
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className={cn(
              'flex items-center gap-3 py-2.5',
              i < display.length - 1 && 'border-b'
            )}>
              {/* Rank number */}
              <span className="w-7 text-center text-lg font-bold text-orange-500 flex-shrink-0">
                {rank}
              </span>
              <BookCover
                book={book}
                sizeClass="w-[45px] h-[68px] md:w-[55px] md:h-[82px] lg:w-[65px] lg:h-[98px]"
                className="rounded-md"
                sizes="(min-width: 1024px) 65px, (min-width: 768px) 55px, 45px"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
              </div>
              {rating && (
                <div className="flex-shrink-0">
                  <RatingDisplay rating={rating} />
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 7: 皇家剧院 (RoyalTheaterSection) ============
// Phone: 75px  Pad: 90px  Desktop: 110px

export function RoyalTheaterSection({ books }: { books: BookListBook[] }) {
  // Split into two groups: first 4 as "悲剧", rest as "喜剧"
  const tragedies = books.slice(0, 4);
  const comedies = books.slice(4, 10);

  const renderRow = (items: BookListBook[]) => (
    <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {items.map((book) => (
        <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
          <div className="w-[75px] md:w-[90px] lg:w-[110px] space-y-1">
            <CarouselCover
              book={book}
              widthClass="w-[75px] md:w-[90px] lg:w-[110px]"
              sizes="(min-width: 1024px) 110px, (min-width: 768px) 90px, 75px"
            />
            <p className="line-clamp-1 text-[11px] font-medium leading-tight">{book.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {tragedies.length > 0 && (
        <div>
          <span className="mb-2 inline-block rounded-full bg-red-500/80 px-2.5 py-0.5 text-[11px] font-medium text-white">
            悲剧
          </span>
          {renderRow(tragedies)}
        </div>
      )}
      {comedies.length > 0 && (
        <div>
          <span className="mb-2 inline-block rounded-full bg-blue-500/80 px-2.5 py-0.5 text-[11px] font-medium text-white">
            喜剧
          </span>
          {renderRow(comedies)}
        </div>
      )}
    </div>
  );
}

// ============ Style 8: 书脊堆叠 (BookSpineSection) ============
// Phone: h140 w30-80  Pad: h160 w35-90  Desktop: h180 w40-100

const SPINE_COLORS = [
  'from-amber-800 to-amber-700',   // brown
  'from-red-700 to-red-600',       // red
  'from-blue-700 to-blue-600',     // blue
  'from-green-700 to-green-600',   // green
  'from-purple-700 to-purple-600', // purple
  'from-orange-700 to-orange-600', // orange
];

export function BookSpineSection({ books }: { books: BookListBook[] }) {
  const isPad = useMediaQuery('(min-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const spineHeight = isDesktop ? 180 : isPad ? 160 : 140;
  const minWidth = isDesktop ? 40 : isPad ? 35 : 30;
  const maxWidth = isDesktop ? 100 : isPad ? 90 : 80;
  const maxTextHeight = spineHeight - 20;

  const maxWordCount = Math.max(...books.map((b) => b.wordCount || 0), 1);

  return (
    <div className="scrollbar-hide -mx-1 flex items-end gap-1 overflow-x-auto px-1 pb-2">
      {books.map((book, i) => {
        const ratio = (book.wordCount || 0) / maxWordCount;
        const width = Math.max(minWidth, Math.round(ratio * maxWidth));
        const colorClass = SPINE_COLORS[i % SPINE_COLORS.length];

        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'rounded-sm bg-gradient-to-b flex items-center justify-center overflow-hidden',
                  colorClass
                )}
                style={{ width, height: spineHeight }}
              >
                <span
                  className="text-[10px] font-medium text-white/90 leading-tight"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    maxHeight: maxTextHeight,
                    overflow: 'hidden',
                  }}
                >
                  {book.title}
                </span>
              </div>
              {book.wordCount && book.wordCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {formatWordCount(book.wordCount)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 9: 难度阶梯 (DifficultyLadderSection) ============
// Phone: 45×68  Pad: 55×82  Desktop: 65×98

export function DifficultyLadderSection({ books }: { books: BookListBook[] }) {
  // Sort by difficulty ascending
  const sorted = [...books]
    .sort((a, b) => (a.difficultyScore || 0) - (b.difficultyScore || 0))
    .slice(0, 6);

  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      {sorted.map((book, i) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className={cn(
              'flex items-center gap-3 py-2.5',
              i < sorted.length - 1 && 'border-b'
            )}>
              <BookCover
                book={book}
                sizeClass="w-[45px] h-[68px] md:w-[55px] md:h-[82px] lg:w-[65px] lg:h-[98px]"
                className="rounded-md"
                sizes="(min-width: 1024px) 65px, (min-width: 768px) 55px, 45px"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rating && <RatingDisplay rating={rating} />}
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      getDifficultyColor(book.difficultyScore)
                    )}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {getDifficultyLabel(book.difficultyScore)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
