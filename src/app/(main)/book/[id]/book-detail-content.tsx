'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Headphones,
  Share2,
  Play,
  FileText,
} from 'lucide-react';
import { useBookDetail } from '@/features/library/hooks/use-books';
import { useAudiobookByBookId } from '@/features/audiobook/hooks/use-audiobooks';
import { useReadingGuide, useBookContext } from '@/features/library/hooks/use-book-extras';
import { ReadingGuideSection } from '@/features/library/components/reading-guide-section';
import { BookContextSection } from '@/features/library/components/book-context-section';
import { formatDuration } from '@/features/audiobook/stores/audio-player-store';

function formatWordCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return `${count}`;
}

function getAuthorColor(name: string): string {
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#A855F7', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface BookDetailContentProps {
  bookId: string;
}

export function BookDetailContent({ bookId }: BookDetailContentProps) {
  const router = useRouter();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);

  const { data: book, isLoading, error } = useBookDetail(bookId);
  const { data: audiobook } = useAudiobookByBookId(bookId);
  const { data: readingGuide, isLoading: isGuideLoading } = useReadingGuide(bookId);
  const { data: bookContext, isLoading: isContextLoading } = useBookContext(bookId);

  if (isLoading) {
    return <BookDetailSkeleton />;
  }

  if (error || !book) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          {error ? '加载书籍详情失败，请稍后重试' : '未找到该书籍'}
        </p>
      </div>
    );
  }

  const hasAudiobook = book.hasAudiobook || !!audiobook;
  const chaptersToShow = showAllChapters ? book.chapters : book.chapters.slice(0, 10);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title} - ${book.author}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="pb-12">
      {/* Header Section - Gradient Background */}
      <div
        className="relative w-full px-4 pb-8 pt-6"
        style={{
          background: 'linear-gradient(to bottom, color-mix(in srgb, var(--brand-gradient-start, #8BB9FF) 10%, transparent), transparent)',
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'var(--brand-gradient)' }}
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
          {/* Back & Share buttons */}
          <div className="mb-2 flex w-full items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60 backdrop-blur transition-colors hover:bg-background/80"
              aria-label="返回"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60 backdrop-blur transition-colors hover:bg-background/80"
              aria-label="分享"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          {/* Book Cover */}
          <div className="relative aspect-[2/3] h-[200px] overflow-hidden rounded-xl shadow-lg">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="140px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title & Author & Word Count */}
          <h1 className="mt-4 text-center text-2xl font-bold">{book.title}</h1>
          <p className="mt-1 text-center text-muted-foreground">{book.author}</p>
          {book.wordCount > 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              {formatWordCount(book.wordCount)} words
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full h-12 rounded-xl" size="lg" asChild>
            <Link
              href={`/read/${book.id}`}
              className="inline-flex items-center justify-center gap-2"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              <BookOpen className="h-5 w-5" />
              开始阅读
            </Link>
          </Button>
        </div>

        {/* Audiobook Section */}
        {hasAudiobook && (
          <Link
            href={
              audiobook
                ? `/audiobooks?book=${book.id}&audiobook=${audiobook.id}`
                : `/audiobooks?book=${book.id}`
            }
            className="block"
          >
            <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Play className="ml-0.5 h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  <span className="font-medium">有声版</span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  {audiobook?.narrator && (
                    <span className="truncate">朗读: {audiobook.narrator}</span>
                  )}
                  {audiobook?.totalDuration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(audiobook.totalDuration)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Author Section */}
        {book.authorId && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">作者</h2>
            <Link
              href={`/author/${book.authorId}`}
              className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 transition-colors hover:bg-secondary"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: getAuthorColor(book.author) }}
              >
                {book.author.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 truncate font-medium">
                {book.author}
                {book.authorZh && (
                  <span className="ml-1 text-muted-foreground">({book.authorZh})</span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </Link>
          </div>
        )}

        {/* Description Section */}
        <div className="rounded-xl bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">简介</h2>
          <div className="relative mt-2">
            <p
              className={`leading-relaxed text-muted-foreground ${
                !isDescriptionExpanded ? 'line-clamp-4' : ''
              }`}
            >
              {book.description}
            </p>
            {book.description && book.description.length > 200 && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-1 text-sm font-medium text-primary"
              >
                {isDescriptionExpanded ? '收起' : '展开全文'}
              </button>
            )}
          </div>
        </div>

        {/* Reading Guide Section */}
        {isGuideLoading && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )}
        {readingGuide && <ReadingGuideSection guide={readingGuide} />}

        {/* Book Context Section */}
        {isContextLoading && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )}
        {bookContext && <BookContextSection context={bookContext} />}

        {/* Chapters Section */}
        {book.chapters.length > 0 && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              目录 ({book.chapters.length} 章)
            </h2>
            <div className="mt-2 divide-y">
              {chaptersToShow.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/read/${book.id}?chapter=${chapter.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted rounded-lg px-2"
                >
                  <span className="w-7 flex-shrink-0 text-sm text-muted-foreground text-right">
                    {index + 1}.
                  </span>
                  <span className="flex-1 truncate text-sm">{chapter.title}</span>
                  {chapter.wordCount != null && chapter.wordCount > 0 && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatWordCount(chapter.wordCount)}
                    </span>
                  )}
                </Link>
              ))}
              {book.chapters.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
                >
                  {showAllChapters ? (
                    <>
                      收起
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </>
                  ) : (
                    <>
                      查看全部 {book.chapters.length} 章
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookDetailSkeleton() {
  return (
    <div className="pb-12">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 pt-6">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="flex flex-col items-center px-4 pb-8">
        <Skeleton className="aspect-[2/3] h-[200px] rounded-xl" />
        <Skeleton className="mt-4 h-7 w-48" />
        <Skeleton className="mt-2 h-5 w-32" />
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
