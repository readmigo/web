'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Headphones, X, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioLimitDialogProps {
  open: boolean;
  onDismiss: () => void;
  /** Called when the user taps "Upgrade". Parent is responsible for showing PaywallView. */
  onUpgrade: () => void;
  dailySecondsUsed: number;
  dailyLimitSeconds: number;
  /** True when the user is not authenticated (guest). */
  isGuest: boolean;
}

function formatMinutes(seconds: number): string {
  return `${Math.floor(seconds / 60)}`;
}

/**
 * Shown when the daily free audio limit is reached.
 * - Guest users: prompted to log in (30 min/day after login).
 * - Free users:  prompted to upgrade to Pro (unlimited audio).
 *
 * Aligned with iOS AudioLimitReachedSheet behaviour.
 */
export function AudioLimitDialog({
  open,
  onDismiss,
  onUpgrade,
  dailySecondsUsed,
  dailyLimitSeconds,
  isGuest,
}: AudioLimitDialogProps) {
  const router = useRouter();
  const t = useTranslations('subscription.audioLimit');

  if (!open) return null;

  const usedMinutes = formatMinutes(Math.min(dailySecondsUsed, dailyLimitSeconds));
  const limitMinutes = formatMinutes(dailyLimitSeconds);
  const progressPercent = Math.min(100, (dailySecondsUsed / dailyLimitSeconds) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="relative w-full max-w-sm rounded-t-2xl bg-background p-6 pb-8 sm:rounded-2xl sm:pb-6 animate-in slide-in-from-bottom duration-300">
        {/* Dismiss button */}
        <button
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
          onClick={onDismiss}
          aria-label={t('dismiss')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t('title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isGuest ? t('descGuest') : t('descFree')}
          </p>
        </div>

        {/* Usage progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t('used', { used: usedMinutes, limit: limitMinutes })}</span>
            <span>{t('perDay')}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 space-y-2">
          {isGuest ? (
            <>
              <Button
                className="w-full"
                onClick={() => {
                  onDismiss();
                  router.push('/login');
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('loginCta')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={onDismiss}>
                {t('cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
                onClick={() => {
                  onDismiss();
                  onUpgrade();
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t('upgradeCta')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={onDismiss}>
                {t('cancel')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
