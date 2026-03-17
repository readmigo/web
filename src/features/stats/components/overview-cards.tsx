'use client';

import { Clock, BookOpen, Flame, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { OverviewStats } from '../types';

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

interface OverviewCardsProps {
  data: OverviewStats;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const t = useTranslations('analytics');

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={Clock}
        label={t('totalTime')}
        value={formatMinutes(data.totalReadingMinutes)}
        color="bg-blue-500/10 text-blue-500"
      />
      <StatCard
        icon={BookOpen}
        label={t('booksFinished')}
        value={String(data.booksFinished)}
        color="bg-green-500/10 text-green-500"
      />
      <StatCard
        icon={Flame}
        label={t('currentStreak')}
        value={`${data.currentStreak}d`}
        color="bg-orange-500/10 text-orange-500"
      />
      <StatCard
        icon={TrendingUp}
        label={t('avgDaily')}
        value={formatMinutes(data.avgDailyMinutes)}
        color="bg-purple-500/10 text-purple-500"
      />
    </div>
  );
}
