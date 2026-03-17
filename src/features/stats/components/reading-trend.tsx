'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { ReadingTrend } from '../types';

interface ReadingTrendCardProps {
  data: ReadingTrend;
}

export function ReadingTrendCard({ data }: ReadingTrendCardProps) {
  const t = useTranslations('analytics');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {t('readingTrend')}
          {data.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {data.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          {data.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
          {data.percentChange != null && (
            <span
              className={cn(
                'text-xs',
                data.trend === 'up'
                  ? 'text-green-500'
                  : data.trend === 'down'
                    ? 'text-red-500'
                    : 'text-muted-foreground',
              )}
            >
              {data.trend === 'up' ? '+' : ''}{Math.round(data.percentChange)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-0.5 h-24">
          {data.dailyStats.slice(-14).map((day) => {
            const maxMin = Math.max(...data.dailyStats.map((d) => d.minutes), 1);
            const height = (day.minutes / maxMin) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${day.date}: ${day.minutes}m`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{t('daysActive', { count: data.daysActive })}</span>
          <span>{t('avgPerDay', { minutes: Math.round(data.avgMinutesPerDay) })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
