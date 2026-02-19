'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Headphones,
  ChevronLeft,
  Play,
  Clock,
  BookOpen,
  ChevronDown,
  Share2,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useAudiobookWithProgress,
  useStartAudiobook,
} from '@/features/audiobook/hooks/use-audiobooks';
import { useAudioPlayerStore, formatDuration, formatTime } from '@/features/audiobook/stores/audio-player-store';
import { useWhispersyncFromAudiobook } from '@/features/audiobook/hooks/use-whispersync';

interface AudiobookDetailContentProps {
  audiobookId: string;
}

export function AudiobookDetailContent({ audiobookId }: AudiobookDetailContentProps) {
  const router = useRouter();
  const t = useTranslations('audiobooks');
  const [showAllChapters, setShowAllChapters] = useState(false);

  const { data: audiobook, isLoading, error } = useAudiobookWithProgress(audiobookId);
  const { mutate: startAudiobook } = useStartAudiobook();
  const { loadAudiobook, play, audiobook: currentAudiobook } = useAudioPlayerStore();

  if (isLoading) {
    return <AudiobookDetailSkeleton />;
  }

  if (error || !audiobook) {
    return (
      <div className="container py-12 text-center">
        <Headphones className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {error ? t('loadError') : t('notFound')}
        </p>
      </div>
    );
  }

  const { book, hasBook, getBookChapterId } = useWhispersyncFromAudiobook(audiobook);
  const progress = audiobook.progress;
  const isCurrentlyPlaying = currentAudiobook?.id === audiobook.id;
  const chaptersToShow = showAllChapters ? audiobook.chapters : audiobook.chapters.slice(0, 10);

  const handlePlay = async () => {
    const startChapter = progress?.currentChapter ?? 0;
    const startPosition = progress?.currentPosition ?? 0;

    startAudiobook({ audiobookId: audiobook.id });
    await loadAudiobook(audiobook, startChapter, startPosition);
    await play();
  };

  const handlePlayChapter = async (chapterIndex: number) => {
    startAudiobook({
      audiobookId: audiobook.id,
      request: { chapterIndex, positionSeconds: 0 },
    });
    await loadAudiobook(audiobook, chapterIndex, 0);
    await play();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: audiobook.title,
          text: `${audiobook.title} - ${audiobook.author}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="pb-12">
      {/* Header with gradient */}
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
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex h-9 w-9 items-center justify-center self-start rounded-full bg-background/60 backdrop-blur transition-colors hover:bg-background/80"
            aria-label={t('back')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Cover Art */}
          <div className="relative aspect-square w-[200px] overflow-hidden rounded-xl shadow-lg">
            {audiobook.coverUrl ? (
              <Image
                src={audiobook.coverUrl}
                alt={audiobook.title}
                fill
                className="object-cover"
                sizes="200px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Headphones className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title & Author */}
          <h1 className="mt-4 text-center text-2xl font-bold">{audiobook.title}</h1>
          <p className="mt-1 text-center text-muted-foreground">{audiobook.author}</p>
          {audiobook.narrator && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {t('narrator', { name: audiobook.narrator })}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(audiobook.totalDuration)}
            </span>
            <span>{t('chapterCount', { count: audiobook.chapters.length })}</span>
            {audiobook.language && <span>{audiobook.language}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Play Button */}
        <div className="space-y-3">
          <Button
            className="w-full h-12 rounded-xl"
            size="lg"
            onClick={handlePlay}
            style={{ backgroundImage: 'var(--brand-gradient)' }}
          >
            <Play className="mr-2 h-5 w-5" />
            {progress && progress.status === 'IN_PROGRESS'
              ? t('continueListening')
              : t('startListening')
            }
          </Button>
          <div className="flex items-center gap-3">
            {hasBook && book ? (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                asChild
              >
                <Link href={
                  progress
                    ? `/read/${book.id}${getBookChapterId(progress.currentChapter) ? `?chapter=${getBookChapterId(progress.currentChapter)}` : ''}`
                    : `/read/${book.id}`
                }>
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  {progress ? t('readFromHere') : t('viewEbook')}
                </Link>
              </Button>
            ) : audiobook.bookId ? (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                asChild
              >
                <Link href={`/book/${audiobook.bookId}`}>
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  {t('viewEbook')}
                </Link>
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="outline"
              onClick={handleShare}
              className="h-11 w-11 rounded-xl"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        {progress && progress.status === 'IN_PROGRESS' && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('progress')}</span>
              <span className="font-medium">
                {t('chapterProgress', {
                  current: progress.currentChapter + 1,
                  total: audiobook.chapters.length,
                })}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (progress.totalListened / audiobook.totalDuration) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {formatDuration(progress.totalListened)} / {formatDuration(audiobook.totalDuration)}
            </p>
          </div>
        )}

        {/* Description */}
        {audiobook.description && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{t('description')}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {audiobook.description}
            </p>
          </div>
        )}

        {/* Chapters */}
        {audiobook.chapters.length > 0 && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              {t('chapters')} ({audiobook.chapters.length})
            </h2>
            <div className="mt-2 divide-y">
              {chaptersToShow.map((chapter, index) => {
                const isCurrent = progress?.currentChapter === index;
                const isPast = progress ? index < progress.currentChapter : false;

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => handlePlayChapter(index)}
                    className={`flex w-full items-center gap-3 py-3 transition-colors hover:bg-muted rounded-lg px-2 text-left ${
                      isCurrent ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className={`w-7 flex-shrink-0 text-sm text-right ${
                      isCurrent ? 'text-primary font-semibold' : isPast ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`block truncate text-sm ${
                        isCurrent ? 'text-primary font-medium' : ''
                      }`}>
                        {chapter.title || t('chapterNumber', { number: chapter.number })}
                      </span>
                      {chapter.readerName && (
                        <span className="text-xs text-muted-foreground">
                          {chapter.readerName}
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDuration(chapter.duration)}
                    </span>
                    <Play className={`h-4 w-4 flex-shrink-0 ${
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </button>
                );
              })}
              {audiobook.chapters.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
                >
                  {showAllChapters ? (
                    <>
                      {t('collapse')}
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </>
                  ) : (
                    <>
                      {t('viewAllChapters', { count: audiobook.chapters.length })}
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

function AudiobookDetailSkeleton() {
  return (
    <div className="pb-12">
      <div className="px-4 pt-6">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="flex flex-col items-center px-4 pb-8">
        <Skeleton className="aspect-square w-[200px] rounded-xl" />
        <Skeleton className="mt-4 h-7 w-48" />
        <Skeleton className="mt-2 h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
