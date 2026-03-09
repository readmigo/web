'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '../utils/format-duration';
import type { WeeklyStats } from '../types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  // getDay returns 0 (Sun) to 6 (Sat), map to Mon-Sun index
  const day = date.getDay();
  return DAY_LABELS[(day + 6) % 7];
}

interface WeeklyChartProps {
  data: WeeklyStats;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxSeconds = Math.max(...data.days.map((d) => d.totalSeconds), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bar chart */}
        <div className="flex items-end gap-1 h-28">
          {data.days.map((day) => {
            const totalPct = (day.totalSeconds / maxSeconds) * 100;
            const readingPct = day.totalSeconds > 0 ? (day.readingSeconds / day.totalSeconds) * 100 : 0;
            const ttsPct = day.totalSeconds > 0 ? (day.ttsSeconds / day.totalSeconds) * 100 : 0;
            const audiobookPct = day.totalSeconds > 0 ? (day.audiobookSeconds / day.totalSeconds) * 100 : 0;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={day.totalSeconds > 0 ? `${getDayLabel(day.date)}: ${formatDuration(day.totalSeconds)}` : getDayLabel(day.date)}
              >
                {/* Stacked bar */}
                <div
                  className="w-full flex flex-col-reverse rounded-t overflow-hidden"
                  style={{ height: `${Math.max(totalPct, day.totalSeconds > 0 ? 4 : 2)}%`, minHeight: day.totalSeconds > 0 ? '4px' : '2px' }}
                >
                  {/* Reading (blue) — bottom */}
                  {readingPct > 0 && (
                    <div
                      className="w-full bg-blue-500/70"
                      style={{ height: `${readingPct}%` }}
                    />
                  )}
                  {/* TTS (violet) — middle */}
                  {ttsPct > 0 && (
                    <div
                      className="w-full bg-violet-500/70"
                      style={{ height: `${ttsPct}%` }}
                    />
                  )}
                  {/* Audiobook (amber) — top */}
                  {audiobookPct > 0 && (
                    <div
                      className="w-full bg-amber-500/70"
                      style={{ height: `${audiobookPct}%` }}
                    />
                  )}
                  {/* Empty bar placeholder */}
                  {day.totalSeconds === 0 && (
                    <div className="w-full h-full bg-muted rounded-t" />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground">{getDayLabel(day.date)}</span>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{data.activeDays} active {data.activeDays === 1 ? 'day' : 'days'}</span>
          <span>Total: {formatDuration(data.totalSeconds)}</span>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-500/70" />
            Reading
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-violet-500/70" />
            TTS
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/70" />
            Audiobook
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
