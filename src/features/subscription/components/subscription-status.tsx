'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Crown, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '../hooks/use-subscription';
import { useTranslations } from 'next-intl';
import { CancelSubscriptionDialog } from './cancel-subscription-dialog';

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface GracePeriodBannerProps {
  expiresAt?: string;
}

interface TrialCountdownBannerProps {
  trialEnd: string;
}

function TrialCountdownBanner({ trialEnd }: TrialCountdownBannerProps) {
  const t = useTranslations('subscription.trial');
  const remainingDays = daysUntil(trialEnd);

  const colorClasses =
    remainingDays > 7
      ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40'
      : remainingDays >= 3
        ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40'
        : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40';

  const iconColorClass =
    remainingDays > 7
      ? 'text-purple-500'
      : remainingDays >= 3
        ? 'text-orange-500'
        : 'text-red-500';

  const textColorClass =
    remainingDays > 7
      ? 'text-purple-900 dark:text-purple-200'
      : remainingDays >= 3
        ? 'text-orange-900 dark:text-orange-200'
        : 'text-red-900 dark:text-red-200';

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${colorClasses}`}>
      <Clock className={`h-4 w-4 shrink-0 ${iconColorClass}`} aria-hidden="true" />
      <p className={`flex-1 text-sm font-medium ${textColorClass}`}>
        {t('countdown', { days: remainingDays })}
      </p>
    </div>
  );
}

function GracePeriodBanner({ expiresAt }: GracePeriodBannerProps) {
  const t = useTranslations('subscription.gracePeriod');
  const remainingDays = expiresAt ? daysUntil(expiresAt) : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-700 dark:bg-orange-950/40">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
          {t('title')}
        </p>
        <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300">
          {remainingDays !== null
            ? t('descriptionWithDays', { days: remainingDays })
            : t('description')}
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="shrink-0 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
      >
        <Link href="/settings/subscription">
          {t('fixPayment')}
        </Link>
      </Button>
    </div>
  );
}

export function SubscriptionStatus() {
  const { isPro, status, expiresAt, trialEnd, willRenew, isLoading } = useSubscription();
  const t = useTranslations('subscription');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status === 'TRIALING' && trialEnd && (
        <TrialCountdownBanner trialEnd={trialEnd} />
      )}
      {status === 'GRACE_PERIOD' && (
        <GracePeriodBanner expiresAt={expiresAt} />
      )}
      <div className="flex items-center gap-2">
        {isPro ? (
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
            <Crown className="mr-1 h-3 w-3" aria-hidden="true" />
            Pro
          </Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
        {isPro && expiresAt && (
          <span className="text-xs text-muted-foreground">
            {willRenew ? (
              <>
                <RefreshCw className="inline mr-0.5 h-3 w-3" aria-hidden="true" />
                {new Date(expiresAt).toLocaleDateString()}
              </>
            ) : (
              `${t('expires')} ${new Date(expiresAt).toLocaleDateString()}`
            )}
          </span>
        )}
      </div>

      {isPro && status === 'ACTIVE' && (
        <>
          <button
            className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline transition-colors"
            onClick={() => setCancelDialogOpen(true)}
          >
            {t('cancelSubscription')}
          </button>
          <CancelSubscriptionDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
          />
        </>
      )}
    </div>
  );
}
