'use client';

import { useParams, useRouter } from 'next/navigation';
import { Award, ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  useBadge,
  useBadgeProgressById,
  useUserBadges,
} from '@/features/badges/hooks/use-badges';
import type { BadgeTier } from '@/features/badges/types';

const TIER_COLORS: Record<
  BadgeTier,
  { bg: string; text: string; border: string; progress: string }
> = {
  bronze: {
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    progress: 'bg-orange-400',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    progress: 'bg-slate-400',
  },
  gold: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    progress: 'bg-yellow-400',
  },
  platinum: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    progress: 'bg-purple-400',
  },
};

export default function BadgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('badges');
  const id = params.id as string;

  const { data: badge, isLoading, error } = useBadge(id);
  const { data: progressData } = useBadgeProgressById(id);
  const { data: userBadges } = useUserBadges();

  const userBadge = userBadges?.find((ub) => ub.badge.id === id);
  const isEarned = !!userBadge;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          {t('back')}
        </Button>
      </div>
    );
  }

  const tier = TIER_COLORS[badge.tier];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t('back')}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('back')}
      </button>

      {/* Hero */}
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-2xl border p-8',
          tier.border,
          !isEarned && 'opacity-70',
        )}
      >
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            tier.bg,
          )}
        >
          {badge.iconUrl ? (
            <img src={badge.iconUrl} alt={badge.name} className="h-14 w-14" />
          ) : (
            <Award className={cn('h-12 w-12', tier.text)} />
          )}
        </div>

        <h1 className="text-2xl font-bold text-center">{badge.name}</h1>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium capitalize',
              tier.bg,
              tier.text,
            )}
          >
            {badge.tier}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">
            {badge.category}
          </span>
        </div>

        {isEarned && userBadge?.earnedAt && (
          <p className="text-sm text-muted-foreground">
            {t('earnedOn', {
              date: new Date(userBadge.earnedAt).toLocaleDateString(),
            })}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Info className="h-4 w-4 text-primary" />
          {t('description')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {badge.description}
        </p>
      </div>

      {/* Progress */}
      {!isEarned && progressData && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-base font-semibold">{t('progress')}</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {progressData.currentValue} / {progressData.targetValue}
              </span>
              <span className={cn('font-medium', tier.text)}>
                {Math.round(progressData.progressPercent)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all', tier.progress)}
                style={{
                  width: `${Math.min(progressData.progressPercent, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* How to earn */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="text-base font-semibold">{t('howToEarn')}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {badge.requirement.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('requirementTarget', { value: badge.requirement.targetValue })}
        </p>
      </div>
    </div>
  );
}
