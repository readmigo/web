'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlyStats } from '../types';

interface StreakCardProps {
  data: MonthlyStats;
}

export function StreakCard({ data }: StreakCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-orange-500" />
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-xl bg-orange-500/10 py-4">
            <Flame className="h-6 w-6 text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-orange-500">{data.currentStreak}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.currentStreak === 1 ? 'day' : 'days'} current
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/60 py-4">
            <Flame className="h-6 w-6 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{data.longestStreak}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.longestStreak === 1 ? 'day' : 'days'} best
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {data.activeDays} active {data.activeDays === 1 ? 'day' : 'days'} this month
        </p>
      </CardContent>
    </Card>
  );
}
