'use client';

import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Badge, BadgeTier } from '../types';

const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  gold: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  platinum: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
};

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  earnedAt?: string;
  progress?: number;
}

export function BadgeCard({ badge, earned, earnedAt, progress }: BadgeCardProps) {
  const tier = TIER_COLORS[badge.tier];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-opacity',
        tier.border,
        earned ? 'opacity-100' : 'opacity-50',
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', tier.bg)}>
        {badge.iconUrl ? (
          <img src={badge.iconUrl} alt={badge.name} className="h-7 w-7" />
        ) : (
          <Award className={cn('h-6 w-6', tier.text)} />
        )}
      </div>
      <p className="text-xs font-medium leading-tight">{badge.name}</p>
      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] capitalize', tier.bg, tier.text)}>
        {badge.tier}
      </span>
      {earned && earnedAt && (
        <p className="text-[10px] text-muted-foreground">
          {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}
      {!earned && progress != null && (
        <div className="w-full">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full', tier.bg.replace('bg-', 'bg-').replace('/50', ''))}
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'currentColor' }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}
