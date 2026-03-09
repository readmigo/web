'use client';

import { BookOpen, Volume2, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDuration } from '../utils/format-duration';
import type { MonthlyStats } from '../types';

interface TypeRowProps {
  icon: React.ElementType;
  label: string;
  seconds: number;
  color: string;
  iconBg: string;
}

function TypeRow({ icon: Icon, label, seconds, color, iconBg }: TypeRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', iconBg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className={cn('text-sm font-semibold tabular-nums', seconds > 0 ? color : 'text-muted-foreground')}>
        {formatDuration(seconds)}
      </p>
    </div>
  );
}

interface TypeBreakdownProps {
  data: MonthlyStats;
}

export function TypeBreakdown({ data }: TypeBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">This Month by Type</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/50">
        <TypeRow
          icon={BookOpen}
          label="Reading"
          seconds={data.readingSeconds}
          color="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <TypeRow
          icon={Volume2}
          label="TTS"
          seconds={data.ttsSeconds}
          color="text-violet-500"
          iconBg="bg-violet-500/10"
        />
        <TypeRow
          icon={Headphones}
          label="Audiobook"
          seconds={data.audiobookSeconds}
          color="text-amber-500"
          iconBg="bg-amber-500/10"
        />
      </CardContent>
    </Card>
  );
}
