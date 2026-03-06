'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { BadgeCard } from './badge-card';
import { useAllBadges, useUserBadges, useBadgeProgress } from '../hooks/use-badges';
import type { BadgeCategory } from '../types';

const CATEGORIES: { id: BadgeCategory | ''; labelKey: string }[] = [
  { id: '', labelKey: 'all' },
  { id: 'reading', labelKey: 'reading' },
  { id: 'vocabulary', labelKey: 'vocabulary' },
  { id: 'streak', labelKey: 'streak' },
  { id: 'milestone', labelKey: 'milestone' },
  { id: 'social', labelKey: 'social' },
];

export function BadgesView() {
  const t = useTranslations('badges');
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | ''>('');

  const { data: allBadges, isLoading: badgesLoading } = useAllBadges();
  const { data: earned } = useUserBadges();
  const { data: progress } = useBadgeProgress();

  const earnedSet = new Set(earned?.map((ub) => ub.badge.id) || []);
  const earnedMap = new Map(earned?.map((ub) => [ub.badge.id, ub.earnedAt]) || []);
  const progressMap = new Map(progress?.map((bp) => [bp.badge.id, bp.progressPercent]) || []);

  const filtered = selectedCategory
    ? allBadges?.filter((b) => b.category === selectedCategory)
    : allBadges;

  const earnedBadges = filtered?.filter((b) => earnedSet.has(b.id)) || [];
  const inProgressBadges = progress?.filter(
    (bp) => !bp.isComplete && (!selectedCategory || bp.badge.category === selectedCategory),
  ) || [];
  const unearnedBadges = filtered?.filter((b) => !earnedSet.has(b.id)) || [];

  if (badgesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80',
            )}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {t(`categories.${cat.labelKey}`)}
          </button>
        ))}
      </div>

      {/* Earned */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">
            {t('earned')} ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {earnedBadges.map((b) => (
              <BadgeCard
                key={b.id}
                badge={b}
                earned
                earnedAt={earnedMap.get(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgressBadges.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">{t('inProgress')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {inProgressBadges.map((bp) => (
              <BadgeCard
                key={bp.badge.id}
                badge={bp.badge}
                progress={bp.progressPercent}
              />
            ))}
          </div>
        </div>
      )}

      {/* All (unearned) */}
      {unearnedBadges.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">{t('allBadges')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {unearnedBadges.map((b) => (
              <BadgeCard
                key={b.id}
                badge={b}
                progress={progressMap.get(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {(!filtered || filtered.length === 0) && (
        <p className="py-12 text-center text-sm text-muted-foreground">{t('empty')}</p>
      )}
    </div>
  );
}
