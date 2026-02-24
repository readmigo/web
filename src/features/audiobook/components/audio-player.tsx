'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, List, Volume2, VolumeX, GraduationCap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { useAudioPlayerStore, formatTime, formatDuration } from '../stores/audio-player-store';
import { useWhispersyncFromAudiobook } from '../hooks/use-whispersync';
import { PlayerControls } from './player-controls';
import { ProgressSlider } from './progress-slider';
import { SpeedSelector } from './speed-selector';
import { SleepTimer } from './sleep-timer';
import { ChapterList } from './chapter-list';
import { WhispersyncToBook } from './whispersync-banner';
import { StudyModeView } from './study-mode-view';

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
    volume,
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
    setVolume,
    setSleepTimer,
  } = useAudioPlayerStore();

  const t = useTranslations('audiobooks');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const { book, hasBook, getBookChapterId } = useWhispersyncFromAudiobook(audiobook);

  if (!audiobook) return null;

  // Calculate total progress across all chapters
  const totalDurationBefore = audiobook.chapters
    .slice(0, chapterIndex)
    .reduce((sum, ch) => sum + ch.duration, 0);
  const totalProgress = totalDurationBefore + currentTime;
  const totalProgressPercent = (totalProgress / audiobook.totalDuration) * 100;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
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
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </SheetHeader>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="player" className="flex h-full flex-col">
              <TabsContent value="player" className="flex-1 overflow-auto">
                <div className="flex flex-col items-center px-6 py-8">
                  {/* Cover Art */}
                  <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-xl shadow-lg">
                    {audiobook.coverUrl ? (
                      <Image
                        src={audiobook.coverUrl}
                        alt={audiobook.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-6xl font-bold text-muted-foreground">
                          {audiobook.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Author */}
                  <div className="mt-6 text-center">
                    <h2 className="text-xl font-bold">{audiobook.title}</h2>
                    <p className="text-muted-foreground">{audiobook.author}</p>
                    {audiobook.narrator && (
                      <p className="text-sm text-muted-foreground">
                        {t('narratedBy', { name: audiobook.narrator })}
                      </p>
                    )}
                  </div>

                  {/* Current Chapter */}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium">
                      {currentChapter?.title || t('chapterNumber', { number: currentChapter?.number ?? 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('chapterOf', { current: chapterIndex + 1, total: audiobook.chapters.length })}
                    </p>
                  </div>

                  {/* Progress Slider */}
                  <div className="mt-6 w-full max-w-[320px]">
                    <ProgressSlider
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={seek}
                    />
                  </div>

                  {/* Player Controls */}
                  <div className="mt-6">
                    <PlayerControls
                      isPlaying={isPlaying}
                      isLoading={isLoading}
                      onPlayPause={togglePlay}
                      onPrevious={previousChapter}
                      onNext={nextChapter}
                      onSeekBackward={() => seekBackward(15)}
                      onSeekForward={() => seekForward(15)}
                      size="lg"
                    />
                  </div>

                  {/* Secondary Controls */}
                  <div className="mt-6 flex items-center gap-4">
                    <SpeedSelector
                      speed={playbackSpeed}
                      onSpeedChange={setPlaybackSpeed}
                    />

                    <SleepTimer
                      activeTimer={sleepTimer}
                      endTime={sleepTimerEndTime}
                      onSetTimer={setSleepTimer}
                    />

                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      >
                        {volume === 0 ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                      {showVolumeSlider && (
                        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg border bg-popover p-3 shadow-lg">
                          <Slider
                            orientation="vertical"
                            value={[volume * 100]}
                            onValueChange={(v) => setVolume(v[0] / 100)}
                            max={100}
                            className="h-24"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Progress */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      {formatTime(totalProgress)} / {formatDuration(audiobook.totalDuration)}
                      {' '}({Math.round(totalProgressPercent)}% {t('complete')})
                    </p>
                  </div>

                  {/* Whispersync Banner */}
                  {hasBook && book && (
                    <div className="mt-4 w-full max-w-[320px]">
                      <WhispersyncToBook
                        book={book}
                        currentAudioChapterIndex={chapterIndex}
                        bookChapterId={getBookChapterId(chapterIndex)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chapters" className="flex-1 overflow-hidden">
                <ChapterList
                  chapters={audiobook.chapters}
                  currentChapterIndex={chapterIndex}
                  isPlaying={isPlaying}
                  onChapterSelect={goToChapter}
                />
              </TabsContent>

              {hasBook && (
                <TabsContent value="study" className="flex-1 overflow-hidden">
                  <StudyModeView audiobook={audiobook} />
                </TabsContent>
              )}

              {/* Tab Navigation */}
              <TabsList className="flex-shrink-0 w-full justify-center rounded-none border-t">
                <TabsTrigger value="player" className="flex-1">
                  {t('player')}
                </TabsTrigger>
                <TabsTrigger value="chapters" className="flex-1">
                  <List className="mr-2 h-4 w-4" />
                  {t('chaptersTab')}
                </TabsTrigger>
                {hasBook && (
                  <TabsTrigger value="study" className="flex-1">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {t('studyTab')}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
