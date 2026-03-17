'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, List, Volume2, VolumeX, AlignLeft, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { useAudioPlayerStore, formatTime, formatDuration } from '../stores/audio-player-store';
import { useWhispersyncFromAudiobook } from '../hooks/use-whispersync';
import { useDanmaku, useSendDanmaku } from '../hooks/use-danmaku';
import { PlayerControls } from './player-controls';
import { ProgressSlider } from './progress-slider';
import { SpeedSelector } from './speed-selector';
import { SleepTimer } from './sleep-timer';
import { VoiceSelector } from './voice-selector';
import { ChapterList } from './chapter-list';
import { WhispersyncToBook } from './whispersync-banner';
import { DanmakuOverlay } from './danmaku-overlay';
import { SyncedReaderView } from './synced-reader-view';
import { FloatingHearts } from './floating-hearts';

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
    selectedVoiceId,
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
    setSelectedVoice,
  } = useAudioPlayerStore();

  const t = useTranslations('audiobooks');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  const [heartTriggered, setHeartTriggered] = useState(false);
  const heartButtonRef = useRef<HTMLButtonElement>(null);

  const handleHeartClick = useCallback(() => {
    setHeartTriggered(true);
  }, []);
  const { book, hasBook, getBookChapterId } = useWhispersyncFromAudiobook(audiobook);
  const { data: danmakuData } = useDanmaku(audiobook?.id, currentChapter?.number);
  const sendDanmaku = useSendDanmaku();

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
              <TabsContent value="player" className="flex-1 overflow-auto">
                <div className="flex flex-col items-center px-6 py-8">
                  {/* Cover Art + Danmaku — B8: vinyl rotation */}
                  {/*
                    The cover is clipped to a circle and rotates while playing.
                    A radial-gradient overlay simulates vinyl grooves.
                    animation-play-state is toggled via inline style so the disc
                    pauses exactly at its current angle when playback stops.
                  */}
                  <div className="relative aspect-square w-full max-w-[280px]">
                    {/* Outer vinyl ring (slightly larger than cover) */}
                    <div className="absolute inset-0 rounded-full bg-neutral-900 shadow-2xl" />

                    {/* Spinning disc */}
                    <div
                      className="absolute inset-0 rounded-full overflow-hidden"
                      style={{
                        animation: 'rm-vinyl-spin 22s linear infinite',
                        animationPlayState: isPlaying ? 'running' : 'paused',
                      }}
                    >
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

                      {/* Vinyl groove overlay — concentric rings */}
                      <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background:
                            'repeating-radial-gradient(' +
                            'circle at 50% 50%,' +
                            'transparent 0px,' +
                            'transparent 6px,' +
                            'rgba(0,0,0,0.12) 7px,' +
                            'transparent 8px' +
                            ')',
                        }}
                      />

                      {/* Centre label circle */}
                      <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-800/80 ring-2 ring-neutral-700/60" />
                      {/* Centre spindle dot */}
                      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400" />
                    </div>

                    {/* Keyframe style — injected inline once */}
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
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {currentChapter?.title || t('chapterNumber', { number: currentChapter?.number ?? 0 })}
                    </span>
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
                      onSeekForward={() => seekForward(30)}
                      size="lg"
                    />
                  </div>

                  {/* Secondary Controls - aligned to iOS order: Speed / Timer / Voice / Volume */}
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

                    {audiobook.availableVoices && audiobook.availableVoices.length > 1 && (
                      <VoiceSelector
                        voices={audiobook.availableVoices}
                        selectedVoiceId={selectedVoiceId}
                        onVoiceSelect={setSelectedVoice}
                      />
                    )}

                    <div className="relative ml-auto">
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

                  {/* Heart / Like Button */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      ref={heartButtonRef}
                      variant="ghost"
                      size="icon"
                      onClick={handleHeartClick}
                      aria-label="Like this audiobook"
                      className="h-10 w-10 text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                    <FloatingHearts
                      triggered={heartTriggered}
                      originRef={heartButtonRef}
                      onAnimationEnd={() => setHeartTriggered(false)}
                    />
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

              <TabsContent value="lyrics" className="flex-1 overflow-hidden">
                <SyncedReaderView
                  audiobookId={audiobook.id}
                  chapterIndex={chapterIndex}
                  currentTime={currentTime}
                  isActive={activeTab === 'lyrics'}
                  onSeek={seek}
                />
              </TabsContent>

              {/* Tab Navigation */}
              <TabsList className="flex-shrink-0 w-full justify-center rounded-none border-t">
                <TabsTrigger value="player" className="flex-1">
                  {t('player')}
                </TabsTrigger>
                <TabsTrigger value="chapters" className="flex-1">
                  <List className="mr-2 h-4 w-4" />
                  {t('chaptersTab')}
                </TabsTrigger>
                <TabsTrigger value="lyrics" className="flex-1">
                  <AlignLeft className="mr-2 h-4 w-4" />
                  {t('lyricsTab')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
