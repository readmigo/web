'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useReadingTrend } from '../hooks/use-reading-stats';
import type { DailyStats } from '../types';

type PeriodDays = 7 | 30 | 365;

interface MonthlyAggregate {
  month: string; // "yyyy-MM"
  minutes: number;
}

function aggregateByMonth(dailyStats: DailyStats[]): MonthlyAggregate[] {
  const map = new Map<string, number>();
  for (const day of dailyStats) {
    const month = day.date.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + day.minutes);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, minutes]) => ({ month, minutes }));
}

function formatBarLabel(key: string, period: PeriodDays): string {
  if (period === 365) {
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  }
  return String(Number(key.slice(8, 10)));
}

export function ReadingTrendCard() {
  const t = useTranslations('analytics');
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data, isLoading } = useReadingTrend(period);

  const periods: { value: PeriodDays; label: string }[] = [
    { value: 7, label: t('days7') },
    { value: 30, label: t('days30') },
    { value: 365, label: t('year1') },
  ];

  const handlePeriodChange = useCallback((days: PeriodDays) => {
    setPeriod(days);
    setSelectedKey(null);
  }, []);

  const handleBarClick = useCallback((key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  }, []);

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  const is365 = period === 365;
  const bars: { key: string; minutes: number }[] = is365
    ? aggregateByMonth(data.dailyStats).map((m) => ({ key: m.month, minutes: m.minutes }))
    : data.dailyStats.map((d) => ({ key: d.date, minutes: d.minutes }));

  const maxMinutes = Math.max(...bars.map((b) => b.minutes), 1);
  const selectedBar = bars.find((b) => b.key === selectedKey) ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
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
                {data.trend === 'up' ? '+' : ''}
                {Math.round(data.percentChange)}%
              </span>
            )}
          </CardTitle>

          {/* Segmented Control */}
          <div className="flex gap-1">
            {periods.map(({ value, label }) => (
              <Button
                key={value}
                variant={period === value ? 'secondary' : 'outline'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => handlePeriodChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Bar chart */}
        <div className="flex items-end gap-0.5 h-24">
          {bars.map((bar) => {
            const height = (bar.minutes / maxMinutes) * 100;
            const isSelected = selectedKey === bar.key;
            const hasSelection = selectedKey !== null;
            return (
              <button
                key={bar.key}
                type="button"
                aria-label={`${bar.key}: ${bar.minutes} min`}
                aria-pressed={isSelected}
                onClick={() => handleBarClick(bar.key)}
                className={cn(
                  'flex-1 rounded-t transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary'
                    : hasSelection
                      ? 'bg-primary/30 hover:bg-primary/50'
                      : 'bg-primary/60 hover:bg-primary',
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            );
          })}
        </div>

        {/* X-axis labels — first, middle, last only to avoid crowding */}
        {bars.length > 0 && (
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{formatBarLabel(bars[0].key, period)}</span>
            {bars.length > 2 && (
              <span>{formatBarLabel(bars[Math.floor(bars.length / 2)].key, period)}</span>
            )}
            <span>{formatBarLabel(bars[bars.length - 1].key, period)}</span>
          </div>
        )}

        {/* Tooltip row — shown when a bar is selected */}
        {selectedBar !== null && (
          <div className="mt-2 flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">{selectedBar.key}</span>
            <span className="font-medium">
              {t('totalMinutes', { minutes: selectedBar.minutes })}
            </span>
          </div>
        )}

        {/* Summary footer */}
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{t('daysActive', { count: data.daysActive })}</span>
          <span>{t('avgPerDay', { minutes: Math.round(data.avgMinutesPerDay) })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
