'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, List, AlignLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAudioPlayerStore } from '../stores/audio-player-store';
import { useDanmaku, useSendDanmaku } from '../hooks/use-danmaku';
import { PlayerControls } from './player-controls';
import { ProgressSlider } from './progress-slider';
import { SpeedSelector } from './speed-selector';
import { SleepTimer } from './sleep-timer';
import { ChapterList } from './chapter-list';
import { DanmakuOverlay } from './danmaku-overlay';
import { SyncedReaderView } from './synced-reader-view';
import { SubtitleLine } from './subtitle-line';

interface AudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioPlayer({ isOpen, onClose }: AudioPlayerProps) {
  const {
    audiobook,
    currentChapter,
    chapterIndex,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    playbackSpeed,
    sleepTimer,
    sleepTimerEndTime,
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

  const t = useTranslations('audiobooks');
  const [showChapters, setShowChapters] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const { data: danmakuData } = useDanmaku(audiobook?.id, currentChapter?.number);
  const sendDanmaku = useSendDanmaku();

  if (!audiobook) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[100dvh] p-0 [&>button:last-child]:hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="flex-shrink-0 border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ChevronDown className="h-5 w-5" />
                </Button>
                <SheetTitle className="flex-1 text-center text-sm font-medium">
                  {t('nowPlaying')}
                </SheetTitle>
                <div className="w-10" />
              </div>
            </SheetHeader>

            {/* Player Content */}
            <div className="flex-1 overflow-auto">
              <div className="flex flex-col items-center px-6 pt-6 pb-6">
                {/* Title & Author — above vinyl like iOS */}
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-bold">{audiobook.title}</h2>
                  <p className="text-sm text-muted-foreground">{audiobook.author}</p>
                  {audiobook.narrator && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('narratedBy', { name: audiobook.narrator })}
                    </p>
                  )}
                </div>

                {/* Vinyl Record */}
                <div className="relative aspect-square w-full max-w-[260px]">
                  <div
                    className="absolute inset-0 rounded-full bg-neutral-900 shadow-2xl overflow-hidden"
                    style={{
                      animation: 'rm-vinyl-spin 22s linear infinite',
                      animationPlayState: isPlaying ? 'running' : 'paused',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background:
                          'repeating-radial-gradient(' +
                          'circle at 50% 50%,' +
                          'transparent 0px,' +
                          'transparent 4px,' +
                          'rgba(255,255,255,0.05) 5px,' +
                          'transparent 6px' +
                          ')',
                      }}
                    />
                    <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden ring-2 ring-neutral-700/40">
                      {audiobook.coverUrl ? (
                        <Image
                          src={audiobook.coverUrl}
                          alt={audiobook.title}
                          fill
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                          <span className="text-3xl font-bold text-neutral-400">
                            {audiobook.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400 shadow-sm" />
                  </div>
                  <style>{`
                    @keyframes rm-vinyl-spin {
                      from { transform: rotate(0deg); }
                      to   { transform: rotate(360deg); }
                    }
                  `}</style>
                  {danmakuData && (
                    <DanmakuOverlay
                      items={danmakuData.items}
                      onSend={(content) => {
                        if (audiobook && currentChapter) {
                          sendDanmaku.mutate({
                            audiobookId: audiobook.id,
                            chapterNumber: currentChapter.number,
                            content,
                          });
                        }
                      }}
                      isSending={sendDanmaku.isPending}
                    />
                  )}
                </div>

                {/* Current Chapter */}
                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {currentChapter?.title || t('chapterNumber', { number: currentChapter?.number ?? 0 })}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t('chapterOf', { current: chapterIndex + 1, total: audiobook.chapters.length })}
                  </p>
                </div>

                {/* Subtitle Line — tap to open lyrics */}
                <div
                  className="mt-3 w-full max-w-[320px] cursor-pointer"
                  onClick={() => setShowLyrics(true)}
                >
                  <SubtitleLine
                    audiobookId={audiobook.id}
                    chapterIndex={chapterIndex}
                    currentTime={currentTime}
                  />
                </div>

                {/* Progress Slider */}
                <div className="mt-4 w-full max-w-[320px]">
                  <ProgressSlider
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={seek}
                  />
                </div>

                {/* Player Controls */}
                <div className="mt-4">
                  <PlayerControls
                    isPlaying={isPlaying}
                    isLoading={isLoading}
                    onPlayPause={togglePlay}
                    onPrevious={previousChapter}
                    onNext={nextChapter}
                    onSeekBackward={() => seekBackward(15)}
                    onSeekForward={() => seekForward(30)}
                    size="lg"
                  />
                </div>

                {/* Secondary Controls: 章节 / 倍速 / 定时 / 原文 */}
                <div className="mt-5 flex w-full max-w-[320px] items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
                    onClick={() => setShowChapters(true)}
                  >
                    <List className="h-5 w-5" />
                    <span className="text-[10px]">{t('chaptersTab')}</span>
                  </Button>

                  <SpeedSelector
                    speed={playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                  />

                  <SleepTimer
                    activeTimer={sleepTimer}
                    endTime={sleepTimerEndTime}
                    onSetTimer={setSleepTimer}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
                    onClick={() => setShowLyrics(true)}
                  >
                    <AlignLeft className="h-5 w-5" />
                    <span className="text-[10px]">{t('lyricsTab')}</span>
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chapter List Sheet */}
      <Sheet open={showChapters} onOpenChange={setShowChapters}>
        <SheetContent side="bottom" className="h-[80dvh] p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-center text-sm font-medium">
              {t('chaptersTab')}
            </SheetTitle>
          </SheetHeader>
          <ChapterList
            chapters={audiobook.chapters}
            currentChapterIndex={chapterIndex}
            isPlaying={isPlaying}
            onChapterSelect={(index) => {
              goToChapter(index);
              setShowChapters(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Lyrics / Synced Reader Sheet */}
      <Sheet open={showLyrics} onOpenChange={setShowLyrics}>
        <SheetContent side="bottom" className="h-[80dvh] p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-center text-sm font-medium">
              {t('lyricsTab')}
            </SheetTitle>
          </SheetHeader>
          <SyncedReaderView
            audiobookId={audiobook.id}
            chapterIndex={chapterIndex}
            currentTime={currentTime}
            isActive={showLyrics}
            onSeek={seek}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
