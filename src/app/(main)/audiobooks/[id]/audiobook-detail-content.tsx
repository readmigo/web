'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  Headphones,
  Play,
  Clock,
  Share2,
  Loader2,
} from 'lucide-react';
import { useAudiobook, useAudiobookProgress } from '@/features/audiobook/hooks';
import { useAudioPlayerStore, formatDuration, formatTime } from '@/features/audiobook/stores/audio-player-store';
import { ChapterList } from '@/features/audiobook/components/chapter-list';
import { PlayerControls } from '@/features/audiobook/components/player-controls';
import { ProgressSlider } from '@/features/audiobook/components/progress-slider';
import { SpeedSelector } from '@/features/audiobook/components/speed-selector';
import { SleepTimer } from '@/features/audiobook/components/sleep-timer';

interface AudiobookDetailContentProps {
  audiobookId: string;
}

export function AudiobookDetailContent({ audiobookId }: AudiobookDetailContentProps) {
  const router = useRouter();

  const { data: audiobook, isLoading, error } = useAudiobook(audiobookId);
  const { data: progress } = useAudiobookProgress(audiobookId);

  const {
    audiobook: currentAudiobook,
    isPlaying,
    isLoading: isPlayerLoading,
    currentTime,
    duration,
    chapterIndex,
    playbackSpeed,
    sleepTimer,
    sleepTimerEndTime,
    loadAudiobook,
    togglePlay,
    seek,
    seekForward,
    seekBackward,
    nextChapter,
    previousChapter,
    goToChapter,
    setPlaybackSpeed,
    setSleepTimer,
  } = useAudioPlayerStore();

  const isCurrentAudiobook = currentAudiobook?.id === audiobookId;

  // Auto-load audiobook if not already loaded
  useEffect(() => {
    if (audiobook && !isCurrentAudiobook) {
      const startChapter = progress?.currentChapter ?? 0;
      const startPosition = progress?.currentPosition ?? 0;
      loadAudiobook(audiobook, startChapter, startPosition);
    }
  }, [audiobook, isCurrentAudiobook, progress, loadAudiobook]);

  if (isLoading) {
    return <AudiobookDetailSkeleton />;
  }

  if (error || !audiobook) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          {error ? '加载有声书失败，请稍后重试' : '未找到该有声书'}
        </p>
      </div>
    );
  }

  const handlePlay = () => {
    if (!isCurrentAudiobook) {
      const startChapter = progress?.currentChapter ?? 0;
      const startPosition = progress?.currentPosition ?? 0;
      loadAudiobook(audiobook, startChapter, startPosition);
    }
    togglePlay();
  };

  const handleChapterSelect = (index: number) => {
    if (!isCurrentAudiobook) {
      loadAudiobook(audiobook, index);
    } else {
      goToChapter(index);
    }
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
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Calculate total progress
  const totalDurationBefore = isCurrentAudiobook
    ? audiobook.chapters.slice(0, chapterIndex).reduce((sum, ch) => sum + ch.duration, 0)
    : 0;
  const totalProgress = isCurrentAudiobook ? totalDurationBefore + currentTime : 0;
  const totalProgressPercent = audiobook.totalDuration > 0
    ? (totalProgress / audiobook.totalDuration) * 100
    : 0;

  return (
    <div className="pb-24">
      {/* Header Section */}
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
            aria-label="返回"
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
            <p className="mt-0.5 text-center text-sm text-muted-foreground">
              朗读: {audiobook.narrator}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(audiobook.totalDuration)}
            <span className="mx-1">·</span>
            {audiobook.chapters.length} 章
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Play Button */}
        <div className="space-y-3">
          <Button
            className="h-12 w-full rounded-xl"
            size="lg"
            onClick={handlePlay}
            disabled={isPlayerLoading && isCurrentAudiobook}
          >
            {isPlayerLoading && isCurrentAudiobook ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isPlaying && isCurrentAudiobook ? (
              <Headphones className="mr-2 h-5 w-5" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {isPlaying && isCurrentAudiobook ? '正在播放' : '开始播放'}
          </Button>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" onClick={handleShare} className="h-11 w-11 rounded-xl">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Now Playing Controls (only show when this audiobook is playing) */}
        {isCurrentAudiobook && (
          <div className="rounded-xl bg-card p-6 shadow-sm space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium">
                {audiobook.chapters[chapterIndex]?.title || `第 ${chapterIndex + 1} 章`}
              </p>
              <p className="text-xs text-muted-foreground">
                第 {chapterIndex + 1} / {audiobook.chapters.length} 章
              </p>
            </div>

            {/* Progress Slider */}
            <ProgressSlider
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />

            {/* Player Controls */}
            <PlayerControls
              isPlaying={isPlaying}
              isLoading={isPlayerLoading}
              onPlayPause={togglePlay}
              onPrevious={previousChapter}
              onNext={nextChapter}
              onSeekBackward={() => seekBackward(15)}
              onSeekForward={() => seekForward(15)}
              size="lg"
            />

            {/* Secondary Controls */}
            <div className="flex items-center justify-center gap-4">
              <SpeedSelector
                speed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
              />
              <SleepTimer
                activeTimer={sleepTimer}
                endTime={sleepTimerEndTime}
                onSetTimer={setSleepTimer}
              />
            </div>

            {/* Total Progress */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {formatTime(totalProgress)} / {formatDuration(audiobook.totalDuration)}
                {' '}({Math.round(totalProgressPercent)}%)
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {audiobook.description && (
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">简介</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {audiobook.description}
            </p>
          </div>
        )}

        {/* Chapter List */}
        <div className="rounded-xl bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            目录 ({audiobook.chapters.length} 章)
          </h2>
          <ChapterList
            chapters={audiobook.chapters}
            currentChapterIndex={isCurrentAudiobook ? chapterIndex : -1}
            isPlaying={isPlaying && isCurrentAudiobook}
            onChapterSelect={handleChapterSelect}
          />
        </div>
      </div>
    </div>
  );
}

function AudiobookDetailSkeleton() {
  return (
    <div className="pb-12">
      {/* Header skeleton */}
      <div className="px-4 pt-6">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="flex flex-col items-center px-4 pb-8">
        <Skeleton className="aspect-square w-[200px] rounded-xl" />
        <Skeleton className="mt-4 h-7 w-48" />
        <Skeleton className="mt-2 h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    </div>
  );
}
