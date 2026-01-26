'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, X, ChevronUp, Loader2 } from 'lucide-react';
import { useAudioPlayerStore } from '../stores/audio-player-store';

interface MiniPlayerProps {
  onExpand: () => void;
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const {
    audiobook,
    currentChapter,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    unloadAudiobook,
    isVisible,
  } = useAudioPlayerStore();

  if (!isVisible || !audiobook) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Progress bar at top of mini player */}
      <Progress value={progress} className="h-1 rounded-none" />

      <div className="flex items-center gap-3 p-3">
        {/* Cover */}
        <button
          onClick={onExpand}
          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md"
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
              <span className="text-lg font-bold text-muted-foreground">
                {audiobook.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <ChevronUp className="h-6 w-6 text-white" />
          </div>
        </button>

        {/* Info */}
        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <div className="truncate font-medium text-sm">{audiobook.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {currentChapter?.title || `Chapter ${currentChapter?.number}`}
          </div>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={unloadAudiobook}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
