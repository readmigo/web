'use client';

import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadingStats, useOverviewStats, useReadingTrend, useReadingProgress } from '../hooks/use-reading-stats';
import { useFeatureGate } from '@/features/subscription/hooks/use-feature-gate';
import { PaywallView } from '@/features/subscription/components/paywall-view';
import { TodayCard } from './today-card';
import { WeeklyChart } from './weekly-chart';
import { StreakCard } from './streak-card';
import { TypeBreakdown } from './type-breakdown';
import { OverviewCards } from './overview-cards';
import { ReadingTrendCard } from './reading-trend';
import { CurrentlyReading } from './currently-reading';
import { RecentSessions } from './recent-sessions';

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

export function ReadingStatsDashboard() {
  const { showPaywall, dismissPaywall, requireFeature, isPro } = useFeatureGate();
  const { data, isLoading, error } = useReadingStats();
  const { data: overview } = useOverviewStats();
  const { data: trend } = useReadingTrend(30);
  const { data: progress } = useReadingProgress();

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold">Reading Statistics</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to Pro to see detailed reading analytics with session types
          </p>
          <button
            className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2 text-sm font-medium text-white"
            onClick={() => requireFeature('detailedStats', 'reading_stats_v2')}
          >
            Upgrade to Pro
          </button>
        </div>
        {showPaywall && (
          <PaywallView triggerSource="reading_stats_v2" onDismiss={dismissPaywall} />
        )}
      </div>
    );
  }

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-sm text-muted-foreground">Failed to load stats</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {overview && <OverviewCards data={overview} />}
      <TodayCard data={data.today} />
      {data.weekly.days.length > 0 && <WeeklyChart data={data.weekly} />}
      {trend && <ReadingTrendCard data={trend} />}
      <StreakCard data={data.monthly} />
      <TypeBreakdown data={data.monthly} />
      {progress && <CurrentlyReading books={progress.currentlyReading} />}
      {progress && <RecentSessions sessions={progress.recentSessions} />}
      {showPaywall && (
        <PaywallView triggerSource="reading_stats_v2" onDismiss={dismissPaywall} />
      )}
    </div>
  );
}
