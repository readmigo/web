'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import {
  useAuthor,
  useFollowAuthor,
  useLikeQuote,
  CivilizationMapSection,
} from '@/features/author';
import type {
  AuthorDetail,
  AuthorBook,
  AuthorQuote,
  AuthorTimelineEvent,
  TimelineCategory,
  CivilizationMap,
} from '@/features/author';

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

  return (
    <div className="container py-6">
      {/* Author Header */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full bg-muted shadow-lg md:h-40 md:w-40">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">
                {author.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl font-bold">{author.name}</h1>
            {author.nameZh && (
              <p className="mt-1 text-lg text-muted-foreground">
                {author.nameZh}
              </p>
            )}
            {author.aliases.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                本名: {author.aliases.join(', ')}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground md:justify-start">
            {author.era && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{author.era}</span>
              </div>
            )}
            {author.nationality && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>{author.nationality}</span>
              </div>
            )}
            {author.birthPlace && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{author.birthPlace}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            {author.literaryPeriod && (
              <Badge variant="secondary">{author.literaryPeriod}</Badge>
            )}
            {author.writingStyle?.split(', ').map((style) => (
              <Badge key={style} variant="outline">
                {style}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm md:justify-start">
            <div className="text-center">
              <p className="font-semibold">{author.bookCount}</p>
              <p className="text-muted-foreground">作品</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{author.quoteCount}</p>
              <p className="text-muted-foreground">名言</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{author.followerCount}</p>
              <p className="text-muted-foreground">关注</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2 md:justify-start">
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              onClick={handleFollow}
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
            {author.wikipediaUrl && (
              <Button variant="outline" asChild>
                <a
                  href={author.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Wikipedia
                </a>
              </Button>
            )}
            <Button size="icon" variant="ghost">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Tabs Content */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="about">简介</TabsTrigger>
          <TabsTrigger value="works">
            作品 ({author.books.length})
          </TabsTrigger>
          <TabsTrigger value="quotes">
            名言 ({author.quotes.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">生平</TabsTrigger>
          <TabsTrigger value="civilization">文明地图</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <AboutSection author={author} />
        </TabsContent>

        <TabsContent value="works">
          <WorksSection books={author.books} />
        </TabsContent>

        <TabsContent value="quotes">
          <QuotesSection quotes={author.quotes} authorId={author.id} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineSection timeline={author.timeline} />
        </TabsContent>

        <TabsContent value="civilization">
          {author.civilizationMap ? (
            <CivilizationMapSection
              civilizationMap={author.civilizationMap}
              authorName={author.name}
              authorEra={author.era}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              暂无文明地图数据
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AboutSection({ author }: { author: AuthorDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>简介</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">
              {author.bioZh || author.bio}
            </p>
            {author.bioZh && author.bio && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-primary hover:underline">
                  View English
                </summary>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {author.bio}
                </p>
              </details>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>代表作</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {author.famousWorks.map((work, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <BookOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{work}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>信息</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">时代</dt>
                <dd>{author.era}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">国籍</dt>
                <dd>{author.nationality}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">出生地</dt>
                <dd>{author.birthPlace}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">文学流派</dt>
                <dd>{author.literaryPeriod}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WorksSection({ books }: { books: AuthorBook[] }) {
  const difficultyLabels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <Link key={book.id} href={`/book/${book.id}`}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex gap-4 p-4">
              <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">
                    📚
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium leading-tight">{book.title}</h3>
                {book.titleZh && (
                  <p className="text-sm text-muted-foreground">{book.titleZh}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {book.publishYear && (
                    <Badge variant="outline" className="text-xs">
                      {book.publishYear}
                    </Badge>
                  )}
                  {book.difficulty && (
                    <Badge variant="secondary" className="text-xs">
                      {difficultyLabels[book.difficulty]}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
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
    // TODO: Call API
  };

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardContent className="p-6">
            <blockquote className="space-y-4">
              <p className="text-lg italic leading-relaxed">"{quote.text}"</p>
              {quote.textZh && (
                <p className="text-muted-foreground">"{quote.textZh}"</p>
              )}
              {quote.source && (
                <footer className="text-sm text-muted-foreground">
                  — {quote.source}
                </footer>
              )}
            </blockquote>
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(quote.id)}
                className={likedQuotes.has(quote.id) ? 'text-red-500' : ''}
              >
                <Heart
                  className={`mr-1 h-4 w-4 ${likedQuotes.has(quote.id) ? 'fill-current' : ''}`}
                />
                {quote.likeCount + (likedQuotes.has(quote.id) && !quote.isLiked ? 1 : 0)}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="mr-1 h-4 w-4" />
                分享
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TimelineSection({ timeline }: { timeline: AuthorTimelineEvent[] }) {
  return (
    <div className="relative space-y-0 pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 h-[calc(100%-16px)] w-0.5 bg-border" />

      {timeline.map((event, index) => (
        <div key={event.id} className="relative pb-8 last:pb-0">
          {/* Dot */}
          <div
            className={`absolute -left-5 top-1 h-4 w-4 rounded-full border-2 border-background ${timelineCategoryColors[event.category]}`}
          />

          {/* Content */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{event.year}</span>
              <Badge variant="outline" className="text-xs">
                {timelineCategoryLabels[event.category]}
              </Badge>
            </div>
            <p className="font-medium">{event.titleZh || event.title}</p>
            {event.titleZh && event.title && (
              <p className="text-sm text-muted-foreground">{event.title}</p>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthorDetailSkeleton() {
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <Skeleton className="mx-auto h-32 w-32 rounded-full md:h-40 md:w-40" />
        <div className="flex-1 space-y-4">
          <Skeleton className="mx-auto h-8 w-48 md:mx-0" />
          <Skeleton className="mx-auto h-4 w-32 md:mx-0" />
          <div className="flex justify-center gap-4 md:justify-start">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
