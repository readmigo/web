'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Clock, BookOpen, Flame, TrendingUp, TrendingDown, Minus, BarChart3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOverviewStats, useReadingTrend, useReadingProgress } from '../hooks/use-analytics';
import { useFeatureGate } from '@/features/subscription/hooks/use-feature-gate';
import { PaywallView } from '@/features/subscription/components/paywall-view';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsDashboard() {
  const t = useTranslations('analytics');
  const { showPaywall, dismissPaywall, requireFeature, isPro } = useFeatureGate();

  const { data: overview, isLoading: overviewLoading } = useOverviewStats();
  const { data: trend } = useReadingTrend(30);
  const { data: progress } = useReadingProgress();

  // Feature gate check
  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold">{t('locked.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('locked.desc')}</p>
          <button
            className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2 text-sm font-medium text-white"
            onClick={() => requireFeature('detailedStats', 'stats_dashboard')}
          >
            {t('locked.upgrade')}
          </button>
        </div>
        {showPaywall && (
          <PaywallView triggerSource="stats_dashboard" onDismiss={dismissPaywall} />
        )}
      </div>
    );
  }

  if (overviewLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Clock}
            label={t('totalTime')}
            value={formatMinutes(overview.totalReadingMinutes)}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            icon={BookOpen}
            label={t('booksFinished')}
            value={String(overview.booksFinished)}
            color="bg-green-500/10 text-green-500"
          />
          <StatCard
            icon={Flame}
            label={t('currentStreak')}
            value={`${overview.currentStreak}d`}
            color="bg-orange-500/10 text-orange-500"
          />
          <StatCard
            icon={TrendingUp}
            label={t('avgDaily')}
            value={formatMinutes(overview.avgDailyMinutes)}
            color="bg-purple-500/10 text-purple-500"
          />
        </div>
      )}

      {/* Trend */}
      {trend && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {t('readingTrend')}
              {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {trend.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
              {trend.percentChange != null && (
                <span className={cn(
                  'text-xs',
                  trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground',
                )}>
                  {trend.trend === 'up' ? '+' : ''}{Math.round(trend.percentChange)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Simple bar chart */}
            <div className="flex items-end gap-0.5 h-24">
              {trend.dailyStats.slice(-14).map((day, i) => {
                const maxMin = Math.max(...trend.dailyStats.map((d) => d.minutes), 1);
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
              <span>{t('daysActive', { count: trend.daysActive })}</span>
              <span>{t('avgPerDay', { minutes: Math.round(trend.avgMinutesPerDay) })}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently reading */}
      {progress && progress.currentlyReading.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('currentlyReading')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.currentlyReading.map((book) => (
              <Link
                key={book.bookId}
                href={`/book/${book.bookId}`}
                className="flex items-center gap-3 group"
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-12 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-8 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary">
                    {book.title}
                  </p>
                  <Progress value={book.progress * 100} className="mt-1 h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {Math.round(book.progress * 100)}%
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      {progress && progress.recentSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('recentSessions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {progress.recentSessions.slice(0, 5).map((session, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{session.bookTitle}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {formatMinutes(session.durationMinutes)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showPaywall && (
        <PaywallView triggerSource="stats_dashboard" onDismiss={dismissPaywall} />
      )}
    </div>
  );
}
