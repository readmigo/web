'use client';

import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Loader2,
} from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  size?: 'sm' | 'default' | 'lg';
}

export function PlayerControls({
  isPlaying,
  isLoading,
  onPlayPause,
  onPrevious,
  onNext,
  onSeekBackward,
  onSeekForward,
  size = 'default',
}: PlayerControlsProps) {
  const iconSize = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const playIconSize = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  const buttonSize = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Chapter */}
      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={onPrevious}
      >
        <SkipBack className={iconSize} />
      </Button>

      {/* Seek Backward */}
      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={onSeekBackward}
      >
        <Rewind className={iconSize} />
        <span className="absolute text-[10px] font-bold">15</span>
      </Button>

      {/* Play/Pause */}
      <Button
        variant="default"
        size="icon"
        className={`${buttonSize} rounded-full`}
        onClick={onPlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className={`${playIconSize} animate-spin`} />
        ) : isPlaying ? (
          <Pause className={playIconSize} />
        ) : (
          <Play className={`${playIconSize} ml-1`} />
        )}
      </Button>

      {/* Seek Forward */}
      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={onSeekForward}
      >
        <FastForward className={iconSize} />
        <span className="absolute text-[10px] font-bold">15</span>
      </Button>

      {/* Next Chapter */}
      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={onNext}
      >
        <SkipForward className={iconSize} />
      </Button>
    </div>
  );
}
