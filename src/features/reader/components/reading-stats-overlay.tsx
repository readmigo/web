'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Clock, BookOpen, Zap, TrendingUp } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { cn } from '@/lib/utils';

interface ReadingStatsOverlayProps {
  bookId: string;
  totalChapters?: number;
  bookTitle?: string;
}

export function ReadingStatsOverlay({
  bookId,
  totalChapters = 0,
  bookTitle,
}: ReadingStatsOverlayProps) {
  const {
    position,
    showReadingStats,
    toggleReadingStats,
    getBookStats,
    getCurrentSessionDuration,
  } = useReaderStore();

  const [sessionTime, setSessionTime] = useState(0);
  const bookStats = getBookStats(bookId);

  // Update session time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(getCurrentSessionDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, [getCurrentSessionDuration]);

  if (!showReadingStats) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTotalTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const percentage = position?.percentage || 0;
  const currentChapter = (position?.chapter || 0) + 1;
  const estimatedTimeRemaining = bookStats?.averageWpm
    ? Math.round(((1 - percentage) * 50000) / bookStats.averageWpm) // Assuming ~50k words per book
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Reading Progress</h2>
          <Button variant="ghost" size="icon" onClick={toggleReadingStats}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Book Progress */}
          <div className="space-y-3">
            {bookTitle && (
              <p className="text-sm text-muted-foreground truncate">{bookTitle}</p>
            )}
            <div className="relative">
              <Progress value={percentage * 100} className="h-4" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {Math.round(percentage * 100)}%
              </span>
            </div>
            {totalChapters > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Chapter {currentChapter} of {totalChapters}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Session */}
            <StatCard
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              label="This Session"
              value={formatTime(sessionTime)}
              subtext="Reading time"
            />

            {/* Total Time */}
            <StatCard
              icon={<BookOpen className="h-5 w-5 text-green-500" />}
              label="Total Time"
              value={formatTotalTime(bookStats?.totalReadingTime || 0)}
              subtext={`${bookStats?.sessionsCount || 0} sessions`}
            />

            {/* Reading Speed */}
            <StatCard
              icon={<Zap className="h-5 w-5 text-yellow-500" />}
              label="Reading Speed"
              value={`${bookStats?.averageWpm || 0}`}
              subtext="words/min"
            />

            {/* Time Remaining */}
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
              label="Estimated Left"
              value={estimatedTimeRemaining > 0 ? formatTotalTime(estimatedTimeRemaining * 60) : '--'}
              subtext="to finish"
            />
          </div>

          {/* Progress Milestones */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Milestones</p>
            <div className="flex justify-between">
              {[25, 50, 75, 100].map((milestone) => (
                <div
                  key={milestone}
                  className={cn(
                    'flex flex-col items-center',
                    percentage * 100 >= milestone ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2',
                      percentage * 100 >= milestone
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {percentage * 100 >= milestone ? '✓' : `${milestone}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}
