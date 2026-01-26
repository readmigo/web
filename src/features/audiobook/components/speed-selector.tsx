'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from '../types';

interface SpeedSelectorProps {
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function SpeedSelector({ speed, onSpeedChange }: SpeedSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="min-w-[60px] font-mono">
          {speed}x
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {PLAYBACK_SPEEDS.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onSpeedChange(s)}
            className={speed === s ? 'bg-accent' : ''}
          >
            {s}x
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
