'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  children: React.ReactNode;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  progress?: number;
  currentPage?: number;
  totalPages?: number;
  theme?: 'light' | 'sepia' | 'dark' | 'ultraDark';
}

export function FocusMode({
  children,
  onExit,
  onPrev,
  onNext,
  progress = 0,
  currentPage,
  totalPages,
  theme = 'light',
}: FocusModeProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const bgColors = {
    light: 'bg-white',
    sepia: 'bg-[#f4ecd8]',
    dark: 'bg-[#1a1a1a]',
    ultraDark: 'bg-black',
  };

  const textColors = {
    light: 'text-gray-900',
    sepia: 'text-[#5b4636]',
    dark: 'text-gray-100',
    ultraDark: 'text-gray-100',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        bgColors[theme],
        textColors[theme]
      )}
    >
      {/* Exit Button - appears on hover */}
      <div className="absolute right-4 top-4 z-10 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          退出专注模式
        </Button>
      </div>

      {/* Navigation - appears on hover at edges */}
      <div
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity hover:opacity-100"
        style={{ width: '80px' }}
      >
        <Button
          variant="ghost"
          size="lg"
          className="h-32 w-full rounded-none"
          onClick={onPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      </div>

      <div
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity hover:opacity-100"
        style={{ width: '80px' }}
      >
        <Button
          variant="ghost"
          size="lg"
          className="h-32 w-full rounded-none"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom bar - appears on hover */}
      <div className="absolute bottom-0 left-0 right-0 opacity-0 transition-opacity hover:opacity-100">
        <div className="bg-gradient-to-t from-black/20 to-transparent p-4">
          <div className="mx-auto max-w-md">
            {/* Progress */}
            <div className="mb-2 flex items-center justify-center gap-4 text-sm">
              {currentPage && totalPages && (
                <span>
                  {currentPage} / {totalPages}
                </span>
              )}
              <span>{Math.round(progress)}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions hint - shown initially then fades */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 animate-in fade-in duration-1000">
        <div className="rounded-lg bg-black/50 px-4 py-2 text-white text-sm">
          按 Esc 退出 · ← → 翻页 · 移动鼠标显示控制
        </div>
      </div>
    </div>
  );
}
