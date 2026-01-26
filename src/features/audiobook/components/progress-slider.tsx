'use client';

import { Slider } from '@/components/ui/slider';
import { formatTime } from '../stores/audio-player-store';

interface ProgressSliderProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function ProgressSlider({
  currentTime,
  duration,
  onSeek,
  className,
}: ProgressSliderProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleValueChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    onSeek(newTime);
  };

  return (
    <div className={className}>
      <Slider
        value={[progress]}
        onValueChange={handleValueChange}
        max={100}
        step={0.1}
        className="w-full"
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
