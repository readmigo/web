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

function RatingDisplay({ rating }: { rating: number | undefined }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

/**
 * Carousel cover with aspect-ratio 2/3.
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

// ============ Style 0: 金榜排行 (GoldRankingSection) ============
// iOS: horizontal carousel, rank badges (orange top3, gray rest), title, author, rating

export function GoldRankingSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-3.5 overflow-x-auto px-1 pb-2">
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
                {/* Rank badge - rounded rect like iOS */}
                <div
                  className={cn(
                    'absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white',
                    isTop3 ? 'bg-orange-500' : 'bg-gray-400/70'
                  )}
                >
                  {rank}
                </div>
              </CarouselCover>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 1: 清新入门 (FreshStartSection) ============
// iOS: horizontal carousel, green numbered circles, title, author, rating

export function FreshStartSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {books.map((book, i) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                className="shadow-[0_4px_6px_rgba(34,197,94,0.2)]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              >
                {/* Green numbered circle */}
                <div className="absolute -left-1 -top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-green-500/85 text-[11px] font-bold text-white">
                  {i + 1}
                </div>
              </CarouselCover>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 2: 霓虹科幻 (NeonSciFiSection) ============
// iOS: horizontal carousel, purple shadow, 90×135, title, rating

export function NeonSciFiSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-3.5 overflow-x-auto px-1 pb-2">
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
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 3: 暖调探险 (AdventureScrollSection) ============
// iOS: horizontal carousel, 3D rotation, brown shadow, title, author, rating

export function AdventureScrollSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <div
                style={{ transform: 'perspective(400px) rotateY(2deg)' }}
              >
                <CarouselCover
                  book={book}
                  widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                  className="shadow-[3px_5px_8px_rgba(139,90,43,0.35)]"
                  sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
                />
              </div>
              <p className="line-clamp-1 text-xs font-semibold leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 4: 彩色气泡 (ColorfulBubbleSection) ============
// iOS: horizontal carousel, pastel shadows per book, rounded-2xl, title, rating

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
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
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
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 5: 极简雅致 (PhilosophyScrollSection) ============
// iOS: horizontal carousel, border overlay on covers, serif italic author with em-dash

export function PhilosophyScrollSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-[18px] overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-2">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              >
                {/* Border overlay like iOS */}
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-border/50" />
              </CarouselCover>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              {/* Quote-style author with em-dash, serif italic */}
              <p className="line-clamp-1 text-[10px] italic text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                — {book.author}
              </p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 6: 暗色悬疑 (MysteryScrollSection) ============
// iOS: horizontal carousel, dark vignette overlay at bottom, dark shadow

export function MysteryScrollSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                className="shadow-[0_5px_8px_rgba(38,46,64,0.4)]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              >
                {/* Dark vignette overlay at bottom */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[60px] rounded-b-lg"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }}
                />
              </CarouselCover>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 7: 浪漫爱情 (RomanceScrollSection) ============
// iOS: horizontal carousel, pink shadow, title, author, rating

export function RomanceScrollSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                className="shadow-[0_4px_6px_rgba(236,72,153,0.25)]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              />
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 8: 鸿篇巨制 (BookSpineSection) ============
// iOS: 2-column grid, epic horizontal cards with cover + title + author + description + rating + word count

export function BookSpineSection({ books }: { books: BookListBook[] }) {
  const display = books.slice(0, 6);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-0.5">
      {display.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group block">
            <div className="flex gap-2.5 rounded-xl bg-secondary/60 p-2.5">
              <BookCover
                book={book}
                sizeClass="w-[80px] h-[120px]"
                className="rounded-md shadow-sm"
                sizes="80px"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-sm font-semibold line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                {book.description && (
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5">{book.description}</p>
                )}
                {rating && <RatingDisplay rating={rating} />}
                {book.wordCount && book.wordCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-400">
                    📖 {formatWordCount(book.wordCount)} words
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 9: 学习进阶 (LearnerScrollSection) ============
// iOS: horizontal carousel, difficulty badge at top-right, colored dots, title, author, rating

export function LearnerScrollSection({ books }: { books: BookListBook[] }) {
  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {books.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                className="shadow-[0_3px_5px_rgba(59,130,246,0.15)]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              >
                {/* Difficulty badge at top-right */}
                {book.difficultyScore != null && (
                  <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5">
                    <div className={cn('h-[7px] w-[7px] rounded-full', getDifficultyColor(book.difficultyScore))} />
                    <span className="text-[9px] font-bold text-white">
                      {getDifficultyLabel(book.difficultyScore)}
                    </span>
                  </div>
                )}
              </CarouselCover>
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ============ Style 10: 系列书展 (SeriesShowcaseSection) ============
// iOS: fanned 3D book covers grouped by series, series name, author, book count badge

interface SeriesGroup {
  id: string;
  name: string;
  bookCount: number;
  books: BookListBook[];
}

function parseSeriesGroups(books: BookListBook[]): SeriesGroup[] {
  const groupMap: Record<string, { name: string; count: number; books: BookListBook[] }> = {};
  const order: string[] = [];

  for (const book of books) {
    if (!book.customDescription) continue;
    const parts = book.customDescription.split('::');
    if (parts.length !== 3) continue;
    const bookCount = parseInt(parts[2], 10);
    if (isNaN(bookCount)) continue;

    const seriesId = parts[0];
    const seriesName = parts[1];

    if (!groupMap[seriesId]) {
      groupMap[seriesId] = { name: seriesName, count: bookCount, books: [book] };
      order.push(seriesId);
    } else {
      groupMap[seriesId].books.push(book);
    }
  }

  return order
    .map((id) => {
      const g = groupMap[id];
      return g ? { id, name: g.name, bookCount: g.count, books: g.books } : null;
    })
    .filter((g): g is SeriesGroup => g !== null);
}

export function SeriesShowcaseSection({ books }: { books: BookListBook[] }) {
  const groups = parseSeriesGroups(books);

  if (groups.length === 0) {
    // Fallback: render as simple carousel if no series grouping
    return (
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {books.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1.5">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              />
              <p className="line-clamp-1 text-xs font-medium leading-tight">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {groups.map((group) => (
        <div key={group.id} className="flex-shrink-0 w-[150px] space-y-2.5 py-2">
          {/* Fanned book covers */}
          <div className="relative h-[130px] flex items-end justify-center">
            <div className="relative">
              {[...group.books].reverse().map((book, reverseIndex) => {
                const index = group.books.length - 1 - reverseIndex;
                const url = book.coverThumbUrl || book.coverUrl;
                return (
                  <div
                    key={book.id}
                    className="absolute bottom-0 left-1/2 w-[80px] h-[120px] overflow-hidden rounded-md bg-muted"
                    style={{
                      transform: `translateX(-50%) rotate(${index * 8}deg) translateX(${index * 12}px) translateY(${-index * 2}px)`,
                      transformOrigin: 'bottom center',
                      zIndex: group.books.length - reverseIndex,
                      boxShadow: `2px 3px ${4 + index}px rgba(0,0,0,${0.2 - index * 0.05})`,
                    }}
                  >
                    {url ? (
                      <Image src={url} alt={book.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-lg text-muted-foreground/40">{book.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Book count badge */}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {group.bookCount} books
            </div>
          </div>
          {/* Series name & author */}
          <div className="text-center">
            <p className="text-sm font-semibold line-clamp-2">{group.name}</p>
            {group.books[0]?.author && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{group.books[0].author}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Style 18: 皇家剧院 (RoyalTheaterSection) ============
// iOS: genre categories (tragedy/comedy/history), theater dividers, Shakespeare quotes

const THEATER_QUOTES = [
  { quote: 'All the world\'s a stage, and all the men and women merely players.', source: 'As You Like It' },
  { quote: 'To be, or not to be, that is the question.', source: 'Hamlet' },
  { quote: 'The course of true love never did run smooth.', source: 'A Midsummer Night\'s Dream' },
];

export function RoyalTheaterSection({ books }: { books: BookListBook[] }) {
  // Group by customDescription: tragedy / comedy / history
  const tragedyBooks = books.filter((b) => b.customDescription === 'tragedy');
  const comedyBooks = books.filter((b) => b.customDescription === 'comedy');
  const historyBooks = books.filter((b) => b.customDescription === 'history');

  // If no customDescription grouping, fall back to first-half / second-half
  const hasGrouping = tragedyBooks.length > 0 || comedyBooks.length > 0 || historyBooks.length > 0;

  const categories = hasGrouping
    ? [
        { key: 'tragedy', label: 'Tragedy', dotColor: 'bg-red-500', labelColor: 'text-red-500/80', books: tragedyBooks },
        { key: 'comedy', label: 'Comedy', dotColor: 'bg-blue-500', labelColor: 'text-blue-500/80', books: comedyBooks },
        { key: 'history', label: 'History', dotColor: 'bg-orange-500', labelColor: 'text-orange-500/80', books: historyBooks },
      ].filter((c) => c.books.length > 0)
    : [
        { key: 'tragedy', label: 'Tragedy', dotColor: 'bg-red-500', labelColor: 'text-red-500/80', books: books.slice(0, 4) },
        { key: 'comedy', label: 'Comedy', dotColor: 'bg-blue-500', labelColor: 'text-blue-500/80', books: books.slice(4, 10) },
      ].filter((c) => c.books.length > 0);

  // Stable quote selection
  const quoteIndex = Math.abs(books.length) % THEATER_QUOTES.length;
  const quote = THEATER_QUOTES[quoteIndex];

  const renderRow = (items: BookListBook[]) => (
    <div className="scrollbar-hide -mx-1 flex gap-3.5 overflow-x-auto px-1 pb-2">
      {items.map((book) => {
        const rating = getRating(book);
        return (
          <Link key={book.id} href={`/book/${book.id}`} className="group flex-shrink-0">
            <div className="w-[100px] md:w-[120px] lg:w-[140px] space-y-1">
              <CarouselCover
                book={book}
                widthClass="w-[100px] md:w-[120px] lg:w-[140px]"
                className="shadow-[0_3px_4px_rgba(0,0,0,0.15)]"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
              />
              <p className="line-clamp-1 text-[11px] font-medium leading-tight">{book.title}</p>
              {rating && <RatingDisplay rating={rating} />}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {categories.map((cat, catIndex) => (
        <div key={cat.key}>
          {/* Theater divider between categories */}
          {catIndex > 0 && (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="flex-1 h-px bg-purple-500/15" />
              <span className="text-[10px] text-purple-500/30">🎭</span>
              <div className="flex-1 h-px bg-purple-500/15" />
            </div>
          )}
          {/* Genre label */}
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <div className={cn('h-2 w-2 rounded-full', cat.dotColor)} />
            <span className={cn('text-sm font-bold', cat.labelColor)}>{cat.label}</span>
          </div>
          {renderRow(cat.books)}
        </div>
      ))}

      {/* Shakespeare quote */}
      <div className="text-center px-6 pt-1">
        <p className="text-xs italic text-foreground/60">
          &ldquo;{quote.quote}&rdquo;
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          — William Shakespeare, {quote.source}
        </p>
      </div>
    </div>
  );
}
