'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  Crown,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Cloud,
  ShieldCheck,
  Headphones,
  BarChart3,
  Palette,
  BookOpen,
  Wifi,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/features/subscription/hooks/use-subscription';
import { FREE_DAILY_AUDIO_LIMIT_SECONDS } from '@/features/subscription/stores/subscription-store';
import { CancelSubscriptionDialog } from '@/features/subscription/components/cancel-subscription-dialog';
import { apiClient } from '@/lib/api/client';

// Pro feature definition list — labelKey maps to subscription.page.feature.* i18n keys
const PRO_FEATURES = [
  { icon: Cloud, labelKey: 'featureDataSync' },
  { icon: ShieldCheck, labelKey: 'featureCloudBackup' },
  { icon: Headphones, labelKey: 'featureUnlimitedAudio' },
  { icon: BarChart3, labelKey: 'featureStats' },
  { icon: Palette, labelKey: 'featureTemplates' },
  { icon: BookOpen, labelKey: 'featureBookAccess' },
  { icon: Wifi, labelKey: 'featureOfflineReading' },
] as const;

// FAQ items
const FAQ_KEYS = [
  'faq1',
  'faq2',
  'faq3',
  'faq4',
] as const;

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}`;
}

function FaqItem({ questionKey, answerKey }: { questionKey: string; answerKey: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors hover:text-foreground/80"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>{questionKey}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground">{answerKey}</p>
      )}
    </div>
  );
}

export function SubscriptionPageContent() {
  const t = useTranslations('subscription');
  const tp = useTranslations('subscription.page');
  const {
    isPro,
    status,
    expiresAt,
    willRenew,
    isLoading,
    dailyAudioSeconds,
    tier,
  } = useSubscription();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ url: string }>('/subscriptions/portal');
      return res.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  // Audio usage for free users
  const dailyLimitSeconds = FREE_DAILY_AUDIO_LIMIT_SECONDS;
  const audioUsedSeconds = Math.min(dailyAudioSeconds, dailyLimitSeconds);
  const audioUsedPercent = Math.round((audioUsedSeconds / dailyLimitSeconds) * 100);
  const audioUsedMins = formatSeconds(audioUsedSeconds);
  const audioLimitMins = formatSeconds(dailyLimitSeconds);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {tp('backToSettings')}
        </Link>
      </div>

      {/* Grace period banner */}
      {status === 'GRACE_PERIOD' && (
        <div
          className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-700 dark:bg-orange-950/40"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
              {t('gracePeriod.title')}
            </p>
            <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300">
              {t('gracePeriod.description')}
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
          >
            {t('gracePeriod.fixPayment')}
          </Button>
        </div>
      )}

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" aria-hidden="true" />
            {tp('currentPlan')}
          </CardTitle>
          <CardDescription>{tp('currentPlanDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tier badge + label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{tp('planLabel')}</p>
              <p className="text-lg font-semibold mt-0.5">
                {isPro ? 'Readmigo Pro' : 'Readmigo Free'}
              </p>
              {tier === 'PREMIUM' && (
                <p className="text-xs text-muted-foreground">{tp('premiumTier')}</p>
              )}
            </div>
            {isPro ? (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 text-sm px-3 py-1">
                <Crown className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Pro
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Free
              </Badge>
            )}
          </div>

          <Separator />

          {/* Renewal / expiry info */}
          {isPro && expiresAt && (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">
                  {willRenew ? tp('renewsOn') : tp('expiresOn')}
                </p>
                <p className="font-medium mt-0.5">
                  {new Date(expiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {willRenew ? (
                  <>
                    <RefreshCw className="h-4 w-4 text-green-500" aria-hidden="true" />
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                      {tp('autoRenewOn')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{tp('autoRenewOff')}</span>
                )}
              </div>
            </div>
          )}

          {/* Status badge for non-active states */}
          {isPro && status === 'EXPIRED' && (
            <p className="text-sm text-destructive">{tp('statusExpired')}</p>
          )}
          {isPro && status === 'CANCELLED' && (
            <p className="text-sm text-muted-foreground">{tp('statusCancelled')}</p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {isPro ? (
              <Button
                variant="outline"
                className="justify-between"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                <span>{tp('manageSubscription')}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
              >
                <Link href="/upgrade">{tp('upgradeToPro')}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily audio usage card — shown for free users */}
      {!isPro && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" aria-hidden="true" />
              {tp('audioUsageTitle')}
            </CardTitle>
            <CardDescription>{tp('audioUsageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{tp('dailyUsage')}</span>
              <span className="font-medium tabular-nums">
                {audioUsedMins} / {audioLimitMins} {tp('minutes')}
              </span>
            </div>
            <Progress
              value={audioUsedPercent}
              className="h-2"
              aria-label={`${audioUsedMins} of ${audioLimitMins} minutes used`}
            />
            {audioUsedPercent >= 100 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {tp('audioLimitReached')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{tp('audioResetNote')}</p>
          </CardContent>
        </Card>
      )}

      {/* Pro features list */}
      <Card>
        <CardHeader>
          <CardTitle>{tp('proFeaturesTitle')}</CardTitle>
          <CardDescription>{tp('proFeaturesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" role="list">
            {PRO_FEATURES.map(({ icon: Icon, labelKey }) => (
              <li key={labelKey} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isPro
                      ? 'bg-green-100 dark:bg-green-950/50'
                      : 'bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isPro ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                    aria-hidden="true"
                  />
                </div>
                <span className={`flex-1 text-sm ${isPro ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {tp(labelKey as Parameters<typeof tp>[0])}
                </span>
                {isPro ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" aria-label="Unlocked" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" aria-label="Locked" />
                )}
              </li>
            ))}
          </ul>

          {!isPro && (
            <div className="mt-4 pt-4 border-t">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
              >
                <Link href="/upgrade">
                  <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
                  {tp('unlockAllFeatures')}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel subscription — only for active Pro */}
      {isPro && status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>{tp('manageTitle')}</CardTitle>
            <CardDescription>{tp('manageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <span>{tp('stripePortal')}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Button>
            <button
              className="w-full text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline transition-colors py-1"
              onClick={() => setCancelDialogOpen(true)}
            >
              {t('cancelSubscription')}
            </button>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{tp('faqTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-2">
          {FAQ_KEYS.map((key) => (
            <FaqItem
              key={key}
              questionKey={tp(`${key}Q` as Parameters<typeof tp>[0])}
              answerKey={tp(`${key}A` as Parameters<typeof tp>[0])}
            />
          ))}
        </CardContent>
      </Card>

      {/* Contact support */}
      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm font-medium">{tp('contactTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tp('contactDesc')}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@readmigo.app">
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              {tp('contactButton')}
            </a>
          </Button>
        </CardContent>
      </Card>

      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      />
    </div>
  );
}
