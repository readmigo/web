'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Quote,
  Calendar,
  MapPin,
  Globe,
  Heart,
  Share2,
  UserPlus,
  UserCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Feather,
  Clock,
  Users,
} from 'lucide-react';
import {
  useAuthor,
  useFollowAuthor,
} from '@/features/author';
import type {
  AuthorDetail,
  AuthorBook,
  AuthorQuote,
  AuthorTimelineEvent,
  TimelineCategory,
  AuthorLink as AuthorLinkType,
} from '@/features/author';

// Era-based gradient colors for the hero background
const eraGradients: Record<string, string> = {
  'Ancient': 'from-amber-700 to-amber-900',
  'Medieval': 'from-stone-600 to-stone-800',
  'Renaissance': 'from-indigo-600 to-purple-800',
  'Enlightenment': 'from-yellow-600 to-amber-700',
  'Romantic': 'from-rose-600 to-pink-800',
  'Victorian': 'from-slate-600 to-slate-800',
  'Modern': 'from-blue-600 to-cyan-800',
  'Contemporary': 'from-violet-600 to-purple-800',
  'Postmodern': 'from-fuchsia-600 to-pink-800',
};

const eraBorderColors: Record<string, string> = {
  'Ancient': 'border-amber-500',
  'Medieval': 'border-stone-500',
  'Renaissance': 'border-indigo-500',
  'Enlightenment': 'border-yellow-500',
  'Romantic': 'border-rose-500',
  'Victorian': 'border-slate-500',
  'Modern': 'border-blue-500',
  'Contemporary': 'border-violet-500',
  'Postmodern': 'border-fuchsia-500',
};

function getEraGradient(era?: string): string {
  if (!era) return 'from-primary/80 to-primary';
  for (const [key, value] of Object.entries(eraGradients)) {
    if (era.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 'from-primary/80 to-primary';
}

function getEraBorderColor(era?: string): string {
  if (!era) return 'border-primary';
  for (const [key, value] of Object.entries(eraBorderColors)) {
    if (era.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 'border-primary';
}

const timelineCategoryLabels: Record<TimelineCategory, string> = {
  BIRTH: '出生',
  EDUCATION: '教育',
  WORK: '作品',
  MAJOR_EVENT: '重要事件',
  AWARD: '荣誉',
  DEATH: '逝世',
};

const timelineCategoryColors: Record<TimelineCategory, string> = {
  BIRTH: 'bg-green-500',
  EDUCATION: 'bg-blue-500',
  WORK: 'bg-purple-500',
  MAJOR_EVENT: 'bg-yellow-500',
  AWARD: 'bg-orange-500',
  DEATH: 'bg-gray-500',
};

interface AuthorDetailContentProps {
  authorId: string;
}

export function AuthorDetailContent({ authorId }: AuthorDetailContentProps) {
  const { data: author, isLoading, error } = useAuthor(authorId);
  const followMutation = useFollowAuthor();

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (author?.isFollowing !== undefined) {
      setIsFollowing(author.isFollowing);
    }
  }, [author?.isFollowing]);

  const handleFollow = () => {
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);
    followMutation.mutate({ authorId, follow: newFollowState });
  };

  if (isLoading) {
    return <AuthorDetailSkeleton />;
  }

  if (error || !author) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          {error ? '加载作者详情失败，请稍后重试' : '未找到该作者'}
        </p>
      </div>
    );
  }

  const gradient = getEraGradient(author.era);
  const borderColor = getEraBorderColor(author.era);

  // Collect related authors from civilizationMap
  const relatedAuthors: AuthorLinkType[] = [];
  if (author.civilizationMap?.influences) {
    const { contemporaries, successors, predecessors } = author.civilizationMap.influences;
    relatedAuthors.push(...(contemporaries || []), ...(successors || []), ...(predecessors || []));
  }
  // Deduplicate by id
  const uniqueRelated = relatedAuthors.filter(
    (a, i, arr) => arr.findIndex((b) => b.id === a.id) === i
  );

  return (
    <div className="pb-12">
      {/* 1. Hero Background */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Avatar overlapping hero */}
      <div className="flex justify-center -mt-12">
        <div
          className={`relative h-24 w-24 overflow-hidden rounded-full border-4 ${borderColor} bg-card shadow-lg`}
        >
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-semibold text-muted-foreground">
              {author.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* 2. Author Header */}
      <div className="container space-y-6 pt-4">
        <div className="space-y-3 text-center">
          <div>
            <h1 className="text-2xl font-bold">{author.name}</h1>
            {author.nameZh && (
              <p className="mt-0.5 text-base text-muted-foreground">
                {author.nameZh}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {author.era && (
              <Badge variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                {author.era}
              </Badge>
            )}
            {author.nationality && (
              <Badge variant="outline">
                <Globe className="mr-1 h-3 w-3" />
                {author.nationality}
              </Badge>
            )}
          </div>

          {/* Follow Button */}
          <div className="flex justify-center pt-1">
            <Button
              onClick={handleFollow}
              className={
                isFollowing
                  ? 'rounded-full px-8'
                  : 'rounded-full bg-gradient-to-r from-primary to-primary/80 px-8'
              }
              variant={isFollowing ? 'secondary' : 'default'}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  已关注
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  关注
                </>
              )}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-8 pt-1 text-sm">
            <div className="text-center">
              <p className="font-semibold">{author.bookCount}</p>
              <p className="text-xs text-muted-foreground">作品</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{author.quoteCount}</p>
              <p className="text-xs text-muted-foreground">名言</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{author.followerCount}</p>
              <p className="text-xs text-muted-foreground">关注</p>
            </div>
          </div>
        </div>

        {/* All sections stacked vertically */}
        <div className="space-y-6">
          {/* 3. Literary Profile Card */}
          <LiteraryProfileCard author={author} />

          {/* 4. Quotes Section */}
          {author.quotes.length > 0 && (
            <QuotesSection quotes={author.quotes} authorId={author.id} />
          )}

          {/* 5. Bio Section */}
          <BioSection author={author} />

          {/* 6. Famous Works */}
          {author.books.length > 0 && (
            <WorksSection books={author.books} />
          )}

          {/* 7. Timeline */}
          {author.timeline.length > 0 && (
            <TimelineSection timeline={author.timeline} />
          )}

          {/* 8. Related Authors */}
          {uniqueRelated.length > 0 && (
            <RelatedAuthorsSection authors={uniqueRelated} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Section Components ---

function LiteraryProfileCard({ author }: { author: AuthorDetail }) {
  const lifespan =
    author.birthYear || author.deathYear
      ? `${author.birthYear ?? '?'} - ${author.deathYear ?? '?'}`
      : null;

  return (
    <Card className="bg-card rounded-xl shadow-sm">
      <CardContent className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Feather className="h-5 w-5 text-primary" />
          文学档案
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {lifespan && (
            <div>
              <dt className="text-muted-foreground">生卒年</dt>
              <dd className="font-medium">{lifespan}</dd>
            </div>
          )}
          {author.era && (
            <div>
              <dt className="text-muted-foreground">时代</dt>
              <dd className="font-medium">{author.era}</dd>
            </div>
          )}
          {author.nationality && (
            <div>
              <dt className="text-muted-foreground">国籍</dt>
              <dd className="font-medium">{author.nationality}</dd>
            </div>
          )}
          {author.birthPlace && (
            <div>
              <dt className="text-muted-foreground">出生地</dt>
              <dd className="font-medium">{author.birthPlace}</dd>
            </div>
          )}
          {author.literaryPeriod && (
            <div>
              <dt className="text-muted-foreground">文学流派</dt>
              <dd className="font-medium">{author.literaryPeriod}</dd>
            </div>
          )}
          {author.writingStyle && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">写作风格</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {author.writingStyle.split(', ').map((style) => (
                  <Badge key={style} variant="outline" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
          {author.civilizationMap?.primaryGenres &&
            author.civilizationMap.primaryGenres.length > 0 && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">主要体裁</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {author.civilizationMap.primaryGenres.map((g) => (
                    <Badge key={g} variant="secondary" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          {author.civilizationMap?.themes &&
            author.civilizationMap.themes.length > 0 && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">核心主题</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {author.civilizationMap.themes.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
        </dl>
      </CardContent>
    </Card>
  );
}

function QuotesSection({
  quotes,
  authorId,
}: {
  quotes: AuthorQuote[];
  authorId: string;
}) {
  const [likedQuotes, setLikedQuotes] = useState<Set<string>>(
    new Set(quotes.filter((q) => q.isLiked).map((q) => q.id))
  );

  const handleLike = (quoteId: string) => {
    setLikedQuotes((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) {
        next.delete(quoteId);
      } else {
        next.add(quoteId);
      }
      return next;
    });
  };

  // Show up to 3 quotes initially
  const [showAll, setShowAll] = useState(false);
  const visibleQuotes = showAll ? quotes : quotes.slice(0, 3);

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Quote className="h-5 w-5 text-primary" />
        名言
      </h2>
      <div className="space-y-3">
        {visibleQuotes.map((quote) => (
          <Card key={quote.id} className="bg-card rounded-xl shadow-sm">
            <CardContent className="p-4">
              <blockquote className="space-y-2">
                <p className="italic leading-relaxed text-foreground">
                  &ldquo;{quote.text}&rdquo;
                </p>
                {quote.textZh && (
                  <p className="text-sm text-muted-foreground">
                    &ldquo;{quote.textZh}&rdquo;
                  </p>
                )}
                {quote.source && (
                  <footer className="text-xs text-muted-foreground">
                    -- {quote.source}
                  </footer>
                )}
              </blockquote>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(quote.id)}
                  className={likedQuotes.has(quote.id) ? 'text-red-500' : ''}
                >
                  <Heart
                    className={`mr-1 h-4 w-4 ${likedQuotes.has(quote.id) ? 'fill-current' : ''}`}
                  />
                  {quote.likeCount +
                    (likedQuotes.has(quote.id) && !quote.isLiked ? 1 : 0)}
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="mr-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {quotes.length > 3 && (
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                收起 <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                查看全部 {quotes.length} 条名言 <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function BioSection({ author }: { author: AuthorDetail }) {
  const [expanded, setExpanded] = useState(false);
  const bio = author.bioZh || author.bio;

  if (!bio) return null;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-primary" />
        简介
      </h2>
      <Card className="bg-card rounded-xl shadow-sm">
        <CardContent className="p-4">
          <p
            className={`leading-relaxed text-muted-foreground ${
              !expanded ? 'line-clamp-6' : ''
            }`}
          >
            {bio}
          </p>
          {bio.length > 200 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0 text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  收起 <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  展开阅读 <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* English bio toggle */}
          {author.bioZh && author.bio && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-sm text-primary hover:underline">
                View English
              </summary>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {author.bio}
              </p>
            </details>
          )}

          {/* Wikipedia link */}
          {author.wikipediaUrl && (
            <div className="mt-3 border-t pt-3">
              <a
                href={author.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                在 Wikipedia 上了解更多
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WorksSection({ books }: { books: AuthorBook[] }) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-primary" />
        代表作品
      </h2>
      <div className="space-y-3">
        {books.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`}>
            <Card className="bg-card rounded-xl shadow-sm transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-3">
                {/* Cover thumbnail */}
                <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium leading-tight">
                    {book.title}
                  </h3>
                  {book.titleZh && (
                    <p className="truncate text-sm text-muted-foreground">
                      {book.titleZh}
                    </p>
                  )}
                  {book.publishYear && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {book.publishYear}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TimelineSection({
  timeline,
}: {
  timeline: AuthorTimelineEvent[];
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Clock className="h-5 w-5 text-primary" />
        生平时间线
      </h2>
      <Card className="bg-card rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-1 h-[calc(100%-8px)] w-0.5 bg-border" />

            {timeline.map((event) => (
              <div key={event.id} className="relative pb-6 last:pb-0">
                {/* Dot */}
                <div
                  className={`absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-background ${timelineCategoryColors[event.category]}`}
                />

                {/* Content */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{event.year}</span>
                    <Badge variant="outline" className="text-xs">
                      {timelineCategoryLabels[event.category]}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    {event.titleZh || event.title}
                  </p>
                  {event.titleZh && event.title && (
                    <p className="text-xs text-muted-foreground">
                      {event.title}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RelatedAuthorsSection({ authors }: { authors: AuthorLinkType[] }) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Users className="h-5 w-5 text-primary" />
        相关作家
      </h2>
      {/* Horizontal scroll */}
      <div className="-mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {authors.map((a) => (
            <Link
              key={a.id}
              href={`/author/${a.id}`}
              className="flex-shrink-0"
            >
              <div className="w-28 rounded-xl border bg-card p-3 text-center shadow-sm transition-colors hover:bg-muted/50">
                <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full bg-muted">
                  {a.avatarUrl ? (
                    <Image
                      src={a.avatarUrl}
                      alt={a.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-medium text-muted-foreground">
                      {a.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{a.name}</p>
                {a.nameZh && (
                  <p className="truncate text-xs text-muted-foreground">
                    {a.nameZh}
                  </p>
                )}
                {a.era && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {a.era}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Skeleton ---

function AuthorDetailSkeleton() {
  return (
    <div className="pb-12">
      {/* Hero skeleton */}
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="flex justify-center -mt-12">
        <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
      </div>
      <div className="container space-y-4 pt-4">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
