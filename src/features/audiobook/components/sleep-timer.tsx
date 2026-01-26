'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, MoonStar } from 'lucide-react';
import { SLEEP_TIMER_OPTIONS, type SleepTimerOption } from '../types';

interface SleepTimerProps {
  activeTimer: SleepTimerOption | null;
  endTime: number | null;
  onSetTimer: (option: SleepTimerOption | null) => void;
}

export function SleepTimer({ activeTimer, endTime, onSetTimer }: SleepTimerProps) {
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    if (!endTime) {
      setRemainingTime(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, endTime - Date.now());
      if (remaining <= 0) {
        setRemainingTime(null);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const isActive = activeTimer !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={isActive ? 'text-primary' : ''}
        >
          {isActive ? <MoonStar className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {remainingTime && (
            <span className="absolute -bottom-1 -right-1 text-[10px] font-mono text-primary">
              {remainingTime}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive && (
          <DropdownMenuItem onClick={() => onSetTimer(null)} className="text-destructive">
            Cancel timer
          </DropdownMenuItem>
        )}
        {SLEEP_TIMER_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSetTimer(option.value)}
            className={activeTimer === option.value ? 'bg-accent' : ''}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
