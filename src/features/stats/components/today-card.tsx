'use client';

import { BookOpen, Volume2, Headphones, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDuration } from '../utils/format-duration';
import type { TodayStats } from '../types';

interface SessionTypeRowProps {
  icon: React.ElementType;
  label: string;
  seconds: number;
  total: number;
  iconClass: string;
  barClass: string;
}

function SessionTypeRow({ icon: Icon, label, seconds, total, iconClass, barClass }: SessionTypeRowProps) {
  const pct = total > 0 ? Math.round((seconds / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium tabular-nums">{formatDuration(seconds)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface TodayCardProps {
  data: TodayStats;
}

export function TodayCard({ data }: TodayCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Large total time */}
        <div className="text-center py-2">
          <p className="text-4xl font-bold tracking-tight">{formatDuration(data.totalSeconds)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.sessionCount} {data.sessionCount === 1 ? 'session' : 'sessions'}
            {data.pagesRead > 0 && ` · ${data.pagesRead} pages`}
          </p>
        </div>

        {/* Session type breakdown */}
        <div className="space-y-3">
          <SessionTypeRow
            icon={BookOpen}
            label="Reading"
            seconds={data.readingSeconds}
            total={data.totalSeconds}
            iconClass="bg-blue-500/10 text-blue-500"
            barClass="bg-blue-500"
          />
          <SessionTypeRow
            icon={Volume2}
            label="TTS"
            seconds={data.ttsSeconds}
            total={data.totalSeconds}
            iconClass="bg-violet-500/10 text-violet-500"
            barClass="bg-violet-500"
          />
          <SessionTypeRow
            icon={Headphones}
            label="Audiobook"
            seconds={data.audiobookSeconds}
            total={data.totalSeconds}
            iconClass="bg-amber-500/10 text-amber-500"
            barClass="bg-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
